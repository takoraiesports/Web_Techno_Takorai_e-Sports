package websocket

import (
	"encoding/json"
	"log"
	"sync"

	"github.com/gorilla/websocket"
)

type EventMessage struct {
	Event string      `json:"event"`
	Room  string      `json:"room,omitempty"`
	Data  interface{} `json:"data"`
}

type Client struct {
	Hub  *Hub
	Conn *websocket.Conn
	Send chan []byte
	Room string
}

type Hub struct {
	clients    map[*Client]bool
	rooms      map[string]map[*Client]bool
	register   chan *Client
	unregister chan *Client
	mu         sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
		rooms:      make(map[string]map[*Client]bool),
	}
}

func (h *Hub) RegisterClient(client *Client) {
	h.register <- client
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			if client.Room != "" {
				if h.rooms[client.Room] == nil {
					h.rooms[client.Room] = make(map[*Client]bool)
				}
				h.rooms[client.Room][client] = true
			}
			count := len(h.clients)
			h.mu.Unlock()
			log.Printf("[WebSocket] Client connected. Total clients: %d\n", count)

		case client := <-h.unregister:
			h.mu.Lock()
			h.removeClientLocked(client)
			count := len(h.clients)
			h.mu.Unlock()
			log.Printf("[WebSocket] Client disconnected. Total clients: %d\n", count)
		}
	}
}

// removeClientLocked removes a client from every hub index and closes its send
// queue. The caller must hold h.mu exclusively.
func (h *Hub) removeClientLocked(client *Client) {
	if _, ok := h.clients[client]; !ok {
		return
	}
	delete(h.clients, client)
	for room, clients := range h.rooms {
		if clients[client] {
			delete(clients, client)
			if len(clients) == 0 {
				delete(h.rooms, room)
			}
		}
	}
	close(client.Send)
}

func (h *Hub) BroadcastToRoom(room string, event string, data interface{}) {
	msg := EventMessage{
		Event: event,
		Room:  room,
		Data:  data,
	}
	bytes, err := json.Marshal(msg)
	if err != nil {
		log.Printf("[WebSocket] Marshal error: %v\n", err)
		return
	}

	h.mu.Lock()
	defer h.mu.Unlock()

	if clients, ok := h.rooms[room]; ok {
		for client := range clients {
			select {
			case client.Send <- bytes:
			default:
				h.removeClientLocked(client)
			}
		}
	}
}

func (c *Client) ReadPump() {
	defer func() {
		c.Hub.unregister <- c
		c.Conn.Close()
	}()
	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			break
		}
		var msg map[string]interface{}
		if err := json.Unmarshal(message, &msg); err == nil {
			if action, ok := msg["action"].(string); ok && action == "join" {
				if room, ok := msg["room"].(string); ok && room != "" {
					c.Hub.mu.Lock()
					if _, registered := c.Hub.clients[c]; !registered {
						c.Hub.mu.Unlock()
						continue
					}
					if oldRoom := c.Room; oldRoom != "" {
						delete(c.Hub.rooms[oldRoom], c)
						if len(c.Hub.rooms[oldRoom]) == 0 {
							delete(c.Hub.rooms, oldRoom)
						}
					}
					c.Room = room
					if c.Hub.rooms[room] == nil {
						c.Hub.rooms[room] = make(map[*Client]bool)
					}
					c.Hub.rooms[room][c] = true
					c.Hub.mu.Unlock()
					log.Printf("[WebSocket] Client joined room: %s\n", room)
				}
			}
		}
	}
}

func (c *Client) WritePump() {
	defer c.Conn.Close()
	for message := range c.Send {
		w, err := c.Conn.NextWriter(websocket.TextMessage)
		if err != nil {
			return
		}
		w.Write(message)

		if err := w.Close(); err != nil {
			return
		}
	}
	c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
}

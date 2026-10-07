package websocket

import (
	"encoding/json"
	"testing"
)

func TestBroadcastToRoomOnlySendsToMembers(t *testing.T) {
	hub := NewHub()
	one := &Client{Send: make(chan []byte, 1), Room: "match-one"}
	two := &Client{Send: make(chan []byte, 1), Room: "match-two"}
	hub.clients[one] = true
	hub.clients[two] = true
	hub.rooms[one.Room] = map[*Client]bool{one: true}
	hub.rooms[two.Room] = map[*Client]bool{two: true}

	hub.BroadcastToRoom("match-one", "SCORE_UPDATE", map[string]int{"score": 2})
	select {
	case raw := <-one.Send:
		var got EventMessage
		if err := json.Unmarshal(raw, &got); err != nil {
			t.Fatalf("decode broadcast: %v", err)
		}
		if got.Event != "SCORE_UPDATE" || got.Room != "match-one" {
			t.Fatalf("unexpected message: %+v", got)
		}
	default:
		t.Fatal("room member did not receive broadcast")
	}
	select {
	case <-two.Send:
		t.Fatal("client in another room received broadcast")
	default:
	}
}

func TestSlowClientIsRemovedFromAllRoomsOnlyOnce(t *testing.T) {
	hub := NewHub()
	client := &Client{Send: make(chan []byte), Room: "one"}
	hub.clients[client] = true
	hub.rooms["one"] = map[*Client]bool{client: true}
	hub.rooms["two"] = map[*Client]bool{client: true}

	hub.BroadcastToRoom("one", "UPDATE", nil)
	hub.BroadcastToRoom("one", "UPDATE", nil)

	if len(hub.clients) != 0 || len(hub.rooms) != 0 {
		t.Fatalf("slow client remains registered: clients=%d rooms=%d", len(hub.clients), len(hub.rooms))
	}
	if _, open := <-client.Send; open {
		t.Fatal("slow client's send channel was not closed")
	}
}

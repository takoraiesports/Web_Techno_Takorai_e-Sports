package handler

import (
	"net/http"
	"strings"
	"time"

	"backend/internal/domain"
	"backend/internal/service"
	"backend/internal/storage"
	ws "backend/internal/websocket"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type AuthHandler struct {
	authService service.AuthService
}

func NewAuthHandler(authService service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req domain.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, domain.APIResponse{Success: false, Error: err.Error()})
		return
	}

	resp, err := h.authService.Register(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, domain.APIResponse{Success: false, Error: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, domain.APIResponse{
		Success: true,
		Message: "User registered successfully",
		Data:    resp,
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req domain.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, domain.APIResponse{Success: false, Error: err.Error()})
		return
	}

	resp, err := h.authService.Login(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusUnauthorized, domain.APIResponse{Success: false, Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, domain.APIResponse{
		Success: true,
		Message: "Logged in successfully",
		Data:    resp,
	})
}

// Game Handler
type GameHandler struct {
	gameService service.GameService
}

func NewGameHandler(gameService service.GameService) *GameHandler {
	return &GameHandler{gameService: gameService}
}

func (h *GameHandler) GetGames(c *gin.Context) {
	games, err := h.gameService.GetAllGames(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, domain.APIResponse{Success: false, Error: err.Error()})
		return
	}
	c.JSON(http.StatusOK, domain.APIResponse{Success: true, Data: games})
}

func (h *GameHandler) CreateGame(c *gin.Context) {
	var game domain.Game
	if err := c.ShouldBindJSON(&game); err != nil {
		c.JSON(http.StatusBadRequest, domain.APIResponse{Success: false, Error: err.Error()})
		return
	}
	if err := h.gameService.CreateGame(c.Request.Context(), &game); err != nil {
		c.JSON(http.StatusInternalServerError, domain.APIResponse{Success: false, Error: err.Error()})
		return
	}
	c.JSON(http.StatusCreated, domain.APIResponse{Success: true, Message: "Game created successfully", Data: game})
}

// Team Handler
type TeamHandler struct {
	teamService service.TeamService
	gameService service.GameService
}

func NewTeamHandler(teamService service.TeamService, gameService service.GameService) *TeamHandler {
	return &TeamHandler{teamService: teamService, gameService: gameService}
}

func (h *TeamHandler) GetTeams(c *gin.Context) {
	teams, err := h.teamService.GetAllTeams(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, domain.APIResponse{Success: false, Error: err.Error()})
		return
	}
	items := make([]gin.H, 0, len(teams))
	for i := range teams {
		items = append(items, publicTeam(&teams[i]))
	}
	c.JSON(http.StatusOK, domain.APIResponse{Success: true, Data: items})
}

func (h *TeamHandler) GetTeamByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, domain.APIResponse{Success: false, Error: "Invalid team ID"})
		return
	}
	team, err := h.teamService.GetTeamByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, domain.APIResponse{Success: false, Error: "Unable to load team"})
		return
	}
	if team == nil {
		c.JSON(http.StatusNotFound, domain.APIResponse{Success: false, Error: "Team not found"})
		return
	}
	c.JSON(http.StatusOK, domain.APIResponse{Success: true, Data: publicTeam(team)})
}

func publicTeam(team *domain.Team) gin.H {
	members := make([]gin.H, 0, len(team.Members))
	for _, member := range team.Members {
		members = append(members, gin.H{"id": member.ID, "role": member.Role, "user": gin.H{"username": member.User.Username, "full_name": member.User.FullName}})
	}
	return gin.H{
		"id": team.ID, "name": team.Name, "tag": team.Tag, "logo_url": team.LogoURL,
		"rating": team.Rating, "wins": team.Wins, "losses": team.Losses, "championships": team.Championships,
		"captain": gin.H{"username": team.Captain.Username, "full_name": team.Captain.FullName},
		"game":    gin.H{"id": team.Game.ID, "name": team.Game.Name, "slug": team.Game.Slug, "is_active": team.Game.IsActive},
		"members": members,
	}
}

func (h *TeamHandler) CreateTeam(c *gin.Context) {
	var req struct {
		Name   string `json:"name" binding:"required,min=2,max=80"`
		Tag    string `json:"tag" binding:"required,min=2,max=8"`
		GameID string `json:"game_id" binding:"required,uuid"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, domain.APIResponse{Success: false, Error: err.Error()})
		return
	}
	userID, err := uuid.Parse(c.GetString("userID"))
	if err != nil {
		c.JSON(http.StatusUnauthorized, domain.APIResponse{Success: false, Error: "Invalid user identity"})
		return
	}
	gameID, err := uuid.Parse(req.GameID)
	if err != nil {
		c.JSON(http.StatusBadRequest, domain.APIResponse{Success: false, Error: "Invalid game ID"})
		return
	}
	games, err := h.gameService.GetAllGames(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, domain.APIResponse{Success: false, Error: "Unable to load games"})
		return
	}
	gameActive := false
	for i := range games {
		if games[i].ID == gameID && games[i].IsActive {
			gameActive = true
			break
		}
	}
	if !gameActive {
		c.JSON(http.StatusBadRequest, domain.APIResponse{Success: false, Error: "Selected game is not available"})
		return
	}
	team := domain.Team{Name: strings.TrimSpace(req.Name), Tag: strings.ToUpper(strings.TrimSpace(req.Tag)), GameID: gameID, CaptainID: userID, IsActive: true}
	if err := h.teamService.CreateTeam(c.Request.Context(), &team); err != nil {
		c.JSON(http.StatusConflict, domain.APIResponse{Success: false, Error: "Unable to create team; check that the team name and game are valid"})
		return
	}
	c.JSON(http.StatusCreated, domain.APIResponse{Success: true, Message: "Team created successfully", Data: team})
}

// Tournament Handler
type TournamentHandler struct {
	tournamentService service.TournamentService
	gameService       service.GameService
	hub               *ws.Hub
}

func NewTournamentHandler(tournamentService service.TournamentService, gameService service.GameService, hub *ws.Hub) *TournamentHandler {
	return &TournamentHandler{tournamentService: tournamentService, gameService: gameService, hub: hub}
}

func (h *TournamentHandler) GetTournaments(c *gin.Context) {
	tournaments, err := h.tournamentService.GetAllTournaments(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, domain.APIResponse{Success: false, Error: err.Error()})
		return
	}
	items := make([]gin.H, 0, len(tournaments))
	for i := range tournaments {
		items = append(items, publicTournament(&tournaments[i]))
	}
	c.JSON(http.StatusOK, domain.APIResponse{Success: true, Data: items})
}

type CreateTournamentRequest struct {
	Title       string                  `json:"title" binding:"required,min=3,max=120"`
	GameName    string                  `json:"game_name" binding:"required"`
	Description string                  `json:"description"`
	Format      domain.TournamentFormat `json:"format" binding:"required"`
	MaxTeams    int                     `json:"max_teams" binding:"required,gte=2,lte=128"`
	PrizePool   string                  `json:"prize_pool"`
}

func (h *TournamentHandler) CreateTournament(c *gin.Context) {
	var req CreateTournamentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, domain.APIResponse{Success: false, Error: err.Error()})
		return
	}
	if req.Format != domain.FormatSingleElimination && req.Format != domain.FormatDoubleElimination && req.Format != domain.FormatRoundRobin && req.Format != domain.FormatSwiss && req.Format != domain.FormatTwoStage {
		c.JSON(http.StatusBadRequest, domain.APIResponse{Success: false, Error: "Invalid tournament format"})
		return
	}
	userID, err := uuid.Parse(c.GetString("userID"))
	if err != nil {
		c.JSON(http.StatusUnauthorized, domain.APIResponse{Success: false, Error: "Invalid user identity"})
		return
	}
	games, err := h.gameService.GetAllGames(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, domain.APIResponse{Success: false, Error: "Unable to load games"})
		return
	}
	var game *domain.Game
	for i := range games {
		if strings.EqualFold(strings.TrimSpace(games[i].Name), strings.TrimSpace(req.GameName)) || strings.EqualFold(games[i].Slug, strings.TrimSpace(req.GameName)) {
			game = &games[i]
			break
		}
	}
	if game == nil {
		c.JSON(http.StatusBadRequest, domain.APIResponse{Success: false, Error: "Selected game is not available"})
		return
	}
	start := time.Now()
	baseSlug := strings.ToLower(strings.Trim(req.Title, " -_"))
	var slug strings.Builder
	lastDash := false
	for _, char := range baseSlug {
		if char >= 'a' && char <= 'z' || char >= '0' && char <= '9' {
			slug.WriteRune(char)
			lastDash = false
		} else if !lastDash && slug.Len() > 0 {
			slug.WriteByte('-')
			lastDash = true
		}
	}
	slugValue := strings.Trim(slug.String(), "-")
	if slugValue == "" {
		slugValue = "tournament-" + uuid.NewString()[:8]
	}
	tournament := domain.Tournament{
		Title: strings.TrimSpace(req.Title), Slug: slugValue + "-" + uuid.NewString()[:8], Description: strings.TrimSpace(req.Description),
		GameID: game.ID, OrganizerID: userID, Format: req.Format, MaxTeams: req.MaxTeams,
		PrizePool: req.PrizePool, RegistrationStart: start, RegistrationEnd: start.AddDate(0, 0, 7),
		TournamentStart: start.AddDate(0, 0, 10), TournamentEnd: start.AddDate(0, 0, 14),
		Status: domain.TournamentRegistrationOpen,
	}
	if err := h.tournamentService.CreateTournament(c.Request.Context(), &tournament); err != nil {
		c.JSON(http.StatusInternalServerError, domain.APIResponse{Success: false, Error: "Unable to create tournament"})
		return
	}
	c.JSON(http.StatusCreated, domain.APIResponse{Success: true, Message: "Tournament created successfully", Data: tournament})
}

func (h *TournamentHandler) GetTournamentByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, domain.APIResponse{Success: false, Error: "Invalid tournament ID"})
		return
	}

	tournament, err := h.tournamentService.GetTournamentByID(c.Request.Context(), id)
	if err != nil || tournament == nil {
		c.JSON(http.StatusNotFound, domain.APIResponse{Success: false, Error: "Tournament not found"})
		return
	}
	c.JSON(http.StatusOK, domain.APIResponse{Success: true, Data: publicTournament(tournament)})
}

func publicTournament(tournament *domain.Tournament) gin.H {
	matches := make([]gin.H, 0, len(tournament.Matches))
	for _, match := range tournament.Matches {
		var team1, team2 interface{}
		if match.Team1 != nil {
			team1 = gin.H{"id": match.Team1.ID, "name": match.Team1.Name, "tag": match.Team1.Tag}
		}
		if match.Team2 != nil {
			team2 = gin.H{"id": match.Team2.ID, "name": match.Team2.Name, "tag": match.Team2.Tag}
		}
		matches = append(matches, gin.H{"id": match.ID, "round": match.Round, "match_number": match.MatchNumber, "match_type": match.MatchType, "score_team1": match.ScoreTeam1, "score_team2": match.ScoreTeam2, "winner_id": match.WinnerID, "status": match.Status, "scheduled_at": match.ScheduledAt, "stream_url": match.StreamURL, "vod_url": match.VODURL, "team1": team1, "team2": team2})
	}
	return gin.H{"id": tournament.ID, "title": tournament.Title, "slug": tournament.Slug, "description": tournament.Description, "rules": tournament.Rules, "banner_url": tournament.BannerURL, "format": tournament.Format, "max_teams": tournament.MaxTeams, "prize_pool": tournament.PrizePool, "registration_start": tournament.RegistrationStart, "registration_end": tournament.RegistrationEnd, "tournament_start": tournament.TournamentStart, "tournament_end": tournament.TournamentEnd, "status": tournament.Status, "game": gin.H{"id": tournament.Game.ID, "name": tournament.Game.Name, "slug": tournament.Game.Slug, "is_active": tournament.Game.IsActive}, "organizer": gin.H{"username": tournament.Organizer.Username, "full_name": tournament.Organizer.FullName}, "matches": matches}
}

type UpdateMatchScoreRequest struct {
	MatchID  string             `json:"match_id" binding:"required"`
	Score1   int                `json:"score_team1" binding:"gte=0"`
	Score2   int                `json:"score_team2" binding:"gte=0"`
	WinnerID *string            `json:"winner_id"`
	Status   domain.MatchStatus `json:"status"`
}

func (h *TournamentHandler) UpdateMatchScore(c *gin.Context) {
	var req UpdateMatchScoreRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, domain.APIResponse{Success: false, Error: err.Error()})
		return
	}

	matchID, err := uuid.Parse(req.MatchID)
	if err != nil {
		c.JSON(http.StatusBadRequest, domain.APIResponse{Success: false, Error: "Invalid match ID"})
		return
	}

	var winnerUUID *uuid.UUID
	if req.WinnerID != nil {
		id, err := uuid.Parse(*req.WinnerID)
		if err != nil {
			c.JSON(http.StatusBadRequest, domain.APIResponse{Success: false, Error: "Invalid winner ID"})
			return
		}
		winnerUUID = &id
	}
	if req.Status != domain.MatchPending && req.Status != domain.MatchScheduled && req.Status != domain.MatchLive && req.Status != domain.MatchCompleted && req.Status != domain.MatchCancelled {
		c.JSON(http.StatusBadRequest, domain.APIResponse{Success: false, Error: "Invalid match status"})
		return
	}
	if err := domain.ValidateMatchResult(req.Score1, req.Score2, winnerUUID, req.Status); err != nil {
		c.JSON(http.StatusBadRequest, domain.APIResponse{Success: false, Error: err.Error()})
		return
	}

	if err := h.tournamentService.UpdateScore(c.Request.Context(), matchID, req.Score1, req.Score2, winnerUUID, req.Status); err != nil {
		c.JSON(http.StatusInternalServerError, domain.APIResponse{Success: false, Error: err.Error()})
		return
	}

	// Broadcast real-time score update over WebSocket to tournament room
	if h.hub != nil {
		h.hub.BroadcastToRoom("match_"+req.MatchID, "SCORE_UPDATE", req)
	}

	c.JSON(http.StatusOK, domain.APIResponse{Success: true, Message: "Match score updated and broadcasted"})
}

// File Upload Handler (S3)
type UploadHandler struct {
	s3Service storage.S3Service
}

func NewUploadHandler(s3Service storage.S3Service) *UploadHandler {
	return &UploadHandler{s3Service: s3Service}
}

func (h *UploadHandler) UploadFile(c *gin.Context) {
	if h.s3Service == nil {
		c.JSON(http.StatusServiceUnavailable, domain.APIResponse{Success: false, Error: "File storage is not configured"})
		return
	}
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, domain.APIResponse{Success: false, Error: "No file uploaded"})
		return
	}

	if file.Size > 10*1024*1024 {
		c.JSON(http.StatusRequestEntityTooLarge, domain.APIResponse{Success: false, Error: "File size must be 10 MB or less"})
		return
	}
	folder := c.DefaultPostForm("folder", "general")
	allowedFolders := map[string]bool{"general": true, "profile": true, "team": true, "tournament": true, "news": true, "product": true, "evidence": true, "match": true}
	if !allowedFolders[folder] {
		c.JSON(http.StatusBadRequest, domain.APIResponse{Success: false, Error: "Invalid upload folder"})
		return
	}
	opened, err := file.Open()
	if err != nil {
		c.JSON(http.StatusBadRequest, domain.APIResponse{Success: false, Error: "Unable to read uploaded file"})
		return
	}
	defer opened.Close()
	var header [512]byte
	count, err := opened.Read(header[:])
	if err != nil && count == 0 {
		c.JSON(http.StatusBadRequest, domain.APIResponse{Success: false, Error: "Uploaded file is empty or unreadable"})
		return
	}
	contentType := http.DetectContentType(header[:count])
	if !strings.HasPrefix(contentType, "image/") || (contentType != "image/jpeg" && contentType != "image/png" && contentType != "image/webp" && contentType != "image/gif") {
		c.JSON(http.StatusUnsupportedMediaType, domain.APIResponse{Success: false, Error: "Only JPEG, PNG, WebP, and GIF images are allowed"})
		return
	}
	url, err := h.s3Service.UploadFile(c.Request.Context(), file, folder)
	if err != nil {
		c.JSON(http.StatusInternalServerError, domain.APIResponse{Success: false, Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, domain.APIResponse{
		Success: true,
		Message: "File uploaded successfully",
		Data:    gin.H{"url": url},
	})
}

// WebSocket Handler
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for dev
	},
}

func ServeWS(hub *ws.Hub, c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}

	client := &ws.Client{
		Hub:  hub,
		Conn: conn,
		Send: make(chan []byte, 256),
		Room: c.Query("room"),
	}
	hub.RegisterClient(client)

	go client.WritePump()
	go client.ReadPump()
}

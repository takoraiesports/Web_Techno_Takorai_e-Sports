package handler

import (
	"backend/internal/config"
	"backend/internal/domain"
	"backend/internal/middleware"
	"backend/internal/service"
	"backend/internal/storage"
	ws "backend/internal/websocket"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func SetupRouter(
	cfg *config.Config,
	authService service.AuthService,
	gameService service.GameService,
	teamService service.TeamService,
	tournamentService service.TournamentService,
	s3Service storage.S3Service,
	hub *ws.Hub,
	db *gorm.DB,
) *gin.Engine {
	if cfg.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	// CORS Middleware
	r.Use(middleware.CORSMiddleware(cfg.FrontendURL))

	// Handlers
	authHandler := NewAuthHandler(authService)
	gameHandler := NewGameHandler(gameService)
	teamHandler := NewTeamHandler(teamService, gameService)
	tournamentHandler := NewTournamentHandler(tournamentService, gameService, hub)
	productHandler := NewProductHandler(db)
	uploadHandler := NewUploadHandler(s3Service)

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"service": "esports-backend-go",
		})
	})

	// Real-time WebSocket endpoint
	r.GET("/ws", func(c *gin.Context) {
		ServeWS(hub, c)
	})

	// API v1 group
	v1 := r.Group("/api/v1")
	{
		// Auth routes
		auth := v1.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
		}

		// Public game & tournament listings
		v1.GET("/games", gameHandler.GetGames)
		v1.GET("/tournaments", tournamentHandler.GetTournaments)
		v1.GET("/tournaments/:id", tournamentHandler.GetTournamentByID)
		v1.GET("/teams", teamHandler.GetTeams)
		v1.GET("/teams/:id", teamHandler.GetTeamByID)
		v1.GET("/products", productHandler.ListPublic)

		// Protected routes (Requires JWT)
		protected := v1.Group("/")
		protected.Use(middleware.JWTAuthMiddleware(authService))
		{
			protected.POST("/games", middleware.RequireAnyRole(string(domain.RoleAdmin)), gameHandler.CreateGame)
			protected.POST("/teams", teamHandler.CreateTeam)
			protected.POST("/tournaments", middleware.RequireAnyRole(string(domain.RoleMember), string(domain.RoleAdmin)), tournamentHandler.CreateTournament)
			protected.POST("/matches/score", middleware.RequireAnyRole(string(domain.RoleAdmin)), tournamentHandler.UpdateMatchScore)
			protected.POST("/upload", middleware.RequireAnyRole(string(domain.RoleMember), string(domain.RoleAdmin)), uploadHandler.UploadFile)
			admin := protected.Group("/admin")
			admin.Use(middleware.RequireAnyRole(string(domain.RoleAdmin)))
			{
				admin.GET("/products", productHandler.ListAdmin)
				admin.POST("/products", productHandler.Create)
				admin.PUT("/products/:id", productHandler.Update)
				admin.DELETE("/products/:id", productHandler.Delete)
			}
		}
	}

	return r
}

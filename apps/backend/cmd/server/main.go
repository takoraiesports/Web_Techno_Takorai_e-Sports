package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"backend/internal/config"
	"backend/internal/handler"
	"backend/internal/repository"
	"backend/internal/service"
	"backend/internal/storage"
	ws "backend/internal/websocket"
)

func main() {
	log.Println(" Starting University E-Sports Portal Backend (Golang)...")

	// 1. Config
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// 2. Database (PostgreSQL)
	db, err := repository.NewPostgresDB(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to PostgreSQL: %v", err)
	}
	if cfg.Env == "production" || cfg.InitialAdminEmail != "" || cfg.InitialAdminUsername != "" || cfg.InitialAdminPassword != "" {
		if err := repository.EnsureInitialAdmin(db, cfg); err != nil {
			log.Fatalf("Initial administrator setup failed: %v", err)
		}
	}

	// 3. Redis
	redisClient, err := repository.NewRedisClient(cfg)
	if err != nil {
		log.Printf("Warning: Redis client error: %v", err)
	}

	// 4. S3 Storage
	s3Service, err := storage.NewS3Service(cfg)
	if err != nil {
		if cfg.Env == "production" {
			log.Fatalf("Failed to initialize object storage: %v", err)
		}
		log.Printf("Warning: S3 Storage initialization error: %v", err)
	}

	// 5. WebSocket Hub
	hub := ws.NewHub()
	go hub.Run()
	log.Println("[WebSocket] Real-time Hub started")

	// 6. Repositories
	userRepo := repository.NewUserRepository(db)
	gameRepo := repository.NewGameRepository(db)
	teamRepo := repository.NewTeamRepository(db)
	tournamentRepo := repository.NewTournamentRepository(db)

	// 7. Services
	authService := service.NewAuthService(userRepo, cfg)
	gameService := service.NewGameService(gameRepo)
	teamService := service.NewTeamService(teamRepo)
	tournamentService := service.NewTournamentService(tournamentRepo)

	// 8. Router
	router := handler.SetupRouter(
		cfg,
		authService,
		gameService,
		teamService,
		tournamentService,
		s3Service,
		hub,
		db,
	)

	// 9. HTTP Server with Graceful Shutdown
	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: router,
	}

	go func() {
		log.Printf(" Server running on http://localhost:%s\n", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server Listen Error: %s\n", err)
		}
	}()

	// Wait for interrupt signal to gracefully shut down the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	if redisClient != nil {
		redisClient.Close()
	}
	if sqlDB, err := db.DB(); err == nil {
		_ = sqlDB.Close()
	}

	log.Println("Server exiting gracefully.")
}

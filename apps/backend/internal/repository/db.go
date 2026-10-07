package repository

import (
	"log"
	"time"

	"backend/internal/config"
	"backend/internal/domain"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"gorm.io/gorm/logger"
)

func NewPostgresDB(cfg *config.Config) (*gorm.DB, error) {
	gormLogLevel := logger.Warn
	if cfg.Env == "development" {
		gormLogLevel = logger.Info
	}

	db, err := gorm.Open(postgres.Open(cfg.GetDSN()), &gorm.Config{
		Logger: logger.Default.LogMode(gormLogLevel),
	})
	if err != nil {
		return nil, err
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}

	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	log.Println("[Database] Connected to PostgreSQL successfully")

	// Auto-migrate tables
	if err := db.AutoMigrate(
		&domain.User{},
		&domain.Role{},
		&domain.Permission{},
		&domain.StudentVerification{},
		&domain.GamerProfile{},
		&domain.Game{},
		&domain.Team{},
		&domain.TeamMember{},
		&domain.TeamInvitation{},
		&domain.Tournament{},
		&domain.TournamentRegistration{},
		&domain.Match{},
		&domain.Dispute{},
		&domain.DisputeMessage{},
		&domain.News{},
		&domain.Product{},
		&domain.ProductVariant{},
		&domain.Order{},
		&domain.OrderItem{},
		&domain.Notification{},
		&domain.AuditLog{},
	); err != nil {
		log.Printf("[Database] Auto-migration error: %v\n", err)
		return nil, err
	}

	seedGames := []domain.Game{
		{Name: "Valorant", Slug: "valorant", Publisher: "Riot Games", Category: "FPS", Platform: "PC", TeamSizeMin: 5, TeamSizeMax: 7, IsActive: true},
		{Name: "ROV / Arena of Valor", Slug: "rov", Publisher: "Garena", Category: "MOBA", Platform: "MOBILE", TeamSizeMin: 5, TeamSizeMax: 7, IsActive: true},
		{Name: "League of Legends", Slug: "league-of-legends", Publisher: "Riot Games", Category: "MOBA", Platform: "PC", TeamSizeMin: 5, TeamSizeMax: 7, IsActive: true},
		{Name: "FC Online", Slug: "fc-online", Publisher: "EA Sports", Category: "SPORTS", Platform: "PC", TeamSizeMin: 1, TeamSizeMax: 1, IsActive: true},
		{Name: "PUBG Mobile", Slug: "pubg-mobile", Publisher: "KRAFTON", Category: "BATTLE_ROYALE", Platform: "MOBILE", TeamSizeMin: 4, TeamSizeMax: 4, IsActive: true},
		{Name: "Dota 2", Slug: "dota-2", Publisher: "Valve", Category: "MOBA", Platform: "PC", TeamSizeMin: 5, TeamSizeMax: 7, IsActive: true},
	}
	if err := db.Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "slug"}}, DoNothing: true}).Create(&seedGames).Error; err != nil {
		log.Printf("[Database] Game catalog seed warning: %v\n", err)
	}

	log.Println("[Database] Auto-migration completed")
	return db, nil
}

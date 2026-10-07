package repository

import (
	"fmt"
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

	// Rename only the original built-in labels; preserve any names changed by admins.
	legacyNames := map[string][2]string{
		"rov":         {"ROV / Arena of Valor", "Arena of Valor (RoV)"},
		"valorant":    {"Valorant", "VALORANT"},
		"pubg-mobile": {"PUBG Mobile", "PUBG MOBILE"},
	}
	for slug, names := range legacyNames {
		if err := db.Model(&domain.Game{}).Where("slug = ? AND name = ?", slug, names[0]).Update("name", names[1]).Error; err != nil {
			return nil, fmt.Errorf("update built-in game label %s: %w", slug, err)
		}
	}
	gameCatalog := competitiveGames()
	if err := db.Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "slug"}}, DoNothing: true}).Create(&gameCatalog).Error; err != nil {
		return nil, fmt.Errorf("initialize esports game catalog: %w", err)
	}

	log.Println("[Database] Auto-migration completed")
	return db, nil
}

package repository

import (
	"errors"
	"fmt"
	"net/mail"
	"strings"

	"backend/internal/config"
	"backend/internal/domain"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// EnsureInitialAdmin creates the first administrator exactly once. After that
// account exists, deployment no longer needs to keep the bootstrap password.
func EnsureInitialAdmin(db *gorm.DB, cfg *config.Config) error {
	var admins int64
	if err := db.Table("user_roles").Joins("JOIN roles ON roles.id = user_roles.role_id").Where("roles.name = ?", string(domain.RoleAdmin)).Count(&admins).Error; err != nil {
		return err
	}
	if admins > 0 {
		return nil
	}
	if strings.TrimSpace(cfg.InitialAdminEmail) == "" || strings.TrimSpace(cfg.InitialAdminUsername) == "" || cfg.InitialAdminPassword == "" {
		return errors.New("no admin account exists; set INITIAL_ADMIN_EMAIL, INITIAL_ADMIN_USERNAME, and INITIAL_ADMIN_PASSWORD for the first startup")
	}
	if _, err := mail.ParseAddress(cfg.InitialAdminEmail); err != nil {
		return errors.New("INITIAL_ADMIN_EMAIL must be a valid email address")
	}
	if len(strings.TrimSpace(cfg.InitialAdminUsername)) < 3 {
		return errors.New("INITIAL_ADMIN_USERNAME must be at least 3 characters")
	}
	passwordLower := strings.ToLower(cfg.InitialAdminPassword)
	if len(cfg.InitialAdminPassword) < 12 || len(cfg.InitialAdminPassword) > 72 || strings.Contains(passwordLower, "replace_with") || strings.Contains(passwordLower, "change_me") {
		return errors.New("INITIAL_ADMIN_PASSWORD must be a unique password between 12 and 72 characters")
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(cfg.InitialAdminPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("hash initial admin password: %w", err)
	}
	return db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "name"}}, DoNothing: true}).Create(&domain.Role{Name: string(domain.RoleAdmin), Description: "Platform administrator"}).Error; err != nil {
			return err
		}
		var role domain.Role
		if err := tx.Where("name = ?", string(domain.RoleAdmin)).First(&role).Error; err != nil {
			return err
		}
		user := domain.User{
			Email:        strings.ToLower(strings.TrimSpace(cfg.InitialAdminEmail)),
			Username:     strings.TrimSpace(cfg.InitialAdminUsername),
			FullName:     strings.TrimSpace(cfg.InitialAdminUsername),
			PasswordHash: string(hash),
			IsVerified:   true,
		}
		if err := tx.Create(&user).Error; err != nil {
			return fmt.Errorf("create initial admin: %w", err)
		}
		return tx.Model(&user).Association("Roles").Append(&role)
	})
}

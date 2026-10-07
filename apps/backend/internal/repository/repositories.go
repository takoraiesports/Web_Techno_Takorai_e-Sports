package repository

import (
	"context"
	"errors"

	"backend/internal/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type UserRepository interface {
	Create(ctx context.Context, user *domain.User) error
	GetByID(ctx context.Context, id uuid.UUID) (*domain.User, error)
	GetByEmail(ctx context.Context, email string) (*domain.User, error)
	GetByUsername(ctx context.Context, username string) (*domain.User, error)
	Update(ctx context.Context, user *domain.User) error
}

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) Create(ctx context.Context, user *domain.User) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		for i := range user.Roles {
			role := &user.Roles[i]
			if err := tx.Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "name"}}, DoNothing: true}).Create(role).Error; err != nil {
				return err
			}
			if err := tx.Where("name = ?", role.Name).First(role).Error; err != nil {
				return err
			}
		}
		if err := tx.Omit("Roles").Create(user).Error; err != nil {
			return err
		}
		if len(user.Roles) > 0 {
			return tx.Model(user).Association("Roles").Append(&user.Roles)
		}
		return nil
	})
}

func (r *userRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	var user domain.User
	err := r.db.WithContext(ctx).Preload("Roles").Preload("StudentVerification").Preload("GamerProfile").First(&user, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &user, err
}

func (r *userRepository) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	var user domain.User
	err := r.db.WithContext(ctx).Preload("Roles").First(&user, "email = ?", email).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &user, err
}

func (r *userRepository) GetByUsername(ctx context.Context, username string) (*domain.User, error) {
	var user domain.User
	err := r.db.WithContext(ctx).Preload("Roles").First(&user, "username = ?", username).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &user, err
}

func (r *userRepository) Update(ctx context.Context, user *domain.User) error {
	return r.db.WithContext(ctx).Save(user).Error
}

// Game Repository
type GameRepository interface {
	Create(ctx context.Context, game *domain.Game) error
	GetAll(ctx context.Context) ([]domain.Game, error)
	GetByID(ctx context.Context, id uuid.UUID) (*domain.Game, error)
}

type gameRepository struct {
	db *gorm.DB
}

func NewGameRepository(db *gorm.DB) GameRepository {
	return &gameRepository{db: db}
}

func (r *gameRepository) Create(ctx context.Context, game *domain.Game) error {
	return r.db.WithContext(ctx).Create(game).Error
}

func (r *gameRepository) GetAll(ctx context.Context) ([]domain.Game, error) {
	var games []domain.Game
	err := r.db.WithContext(ctx).Where("is_active = ?", true).Find(&games).Error
	return games, err
}

func (r *gameRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.Game, error) {
	var game domain.Game
	err := r.db.WithContext(ctx).First(&game, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &game, err
}

// Team Repository
type TeamRepository interface {
	Create(ctx context.Context, team *domain.Team) error
	GetAll(ctx context.Context) ([]domain.Team, error)
	GetByID(ctx context.Context, id uuid.UUID) (*domain.Team, error)
}

type teamRepository struct {
	db *gorm.DB
}

func NewTeamRepository(db *gorm.DB) TeamRepository {
	return &teamRepository{db: db}
}

func (r *teamRepository) Create(ctx context.Context, team *domain.Team) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Omit("Members", "Captain", "Game").Create(team).Error; err != nil { return err }
		captain := domain.TeamMember{TeamID: team.ID, UserID: team.CaptainID, Role: "CAPTAIN"}
		return tx.Create(&captain).Error
	})
}

func (r *teamRepository) GetAll(ctx context.Context) ([]domain.Team, error) {
	var teams []domain.Team
	err := r.db.WithContext(ctx).Preload("Captain").Preload("Game").Preload("Members.User").Find(&teams).Error
	return teams, err
}

func (r *teamRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.Team, error) {
	var team domain.Team
	err := r.db.WithContext(ctx).Preload("Captain").Preload("Game").Preload("Members.User").First(&team, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &team, err
}

// Tournament Repository
type TournamentRepository interface {
	Create(ctx context.Context, tournament *domain.Tournament) error
	GetAll(ctx context.Context) ([]domain.Tournament, error)
	GetByID(ctx context.Context, id uuid.UUID) (*domain.Tournament, error)
	UpdateMatchScore(ctx context.Context, matchID uuid.UUID, score1, score2 int, winnerID *uuid.UUID, status domain.MatchStatus) error
}

type tournamentRepository struct {
	db *gorm.DB
}

func NewTournamentRepository(db *gorm.DB) TournamentRepository {
	return &tournamentRepository{db: db}
}

func (r *tournamentRepository) Create(ctx context.Context, tournament *domain.Tournament) error {
	return r.db.WithContext(ctx).Create(tournament).Error
}

func (r *tournamentRepository) GetAll(ctx context.Context) ([]domain.Tournament, error) {
	var tournaments []domain.Tournament
	err := r.db.WithContext(ctx).Preload("Game").Preload("Organizer").Find(&tournaments).Error
	return tournaments, err
}

func (r *tournamentRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.Tournament, error) {
	var tournament domain.Tournament
	err := r.db.WithContext(ctx).Preload("Game").Preload("Organizer").Preload("Matches.Team1").Preload("Matches.Team2").First(&tournament, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &tournament, err
}

func (r *tournamentRepository) UpdateMatchScore(ctx context.Context, matchID uuid.UUID, score1, score2 int, winnerID *uuid.UUID, status domain.MatchStatus) error {
	if err := domain.ValidateMatchResult(score1, score2, winnerID, status); err != nil {
		return err
	}
	updates := map[string]interface{}{
		"score_team1": score1,
		"score_team2": score2,
		"status":      status,
	}
	tx := r.db.WithContext(ctx).Begin()
	if tx.Error != nil {
		return tx.Error
	}
	var match domain.Match
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&match, "id = ?", matchID).Error; err != nil {
		tx.Rollback()
		return err
	}
	if winnerID != nil && (match.Team1ID == nil || match.Team2ID == nil || (*winnerID != *match.Team1ID && *winnerID != *match.Team2ID)) {
		tx.Rollback()
		return errors.New("winner must be one of the match teams")
	}
	if winnerID != nil && ((*winnerID == *match.Team1ID && score1 <= score2) || (*winnerID == *match.Team2ID && score2 <= score1)) {
		tx.Rollback()
		return errors.New("winner score must be greater than the opponent score")
	}
	updates["winner_id"] = winnerID
	if err := tx.Model(&match).Updates(updates).Error; err != nil {
		tx.Rollback()
		return err
	}
	return tx.Commit().Error
}

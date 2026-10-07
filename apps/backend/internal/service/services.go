package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"backend/internal/config"
	"backend/internal/domain"
	"backend/internal/repository"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type AuthService interface {
	Register(ctx context.Context, req *domain.RegisterRequest) (*domain.AuthResponse, error)
	Login(ctx context.Context, req *domain.LoginRequest) (*domain.AuthResponse, error)
	GenerateToken(user *domain.User) (string, error)
	ValidateToken(tokenStr string) (*jwt.Token, error)
}

type authService struct {
	userRepo repository.UserRepository
	cfg      *config.Config
}

func NewAuthService(userRepo repository.UserRepository, cfg *config.Config) AuthService {
	return &authService{userRepo: userRepo, cfg: cfg}
}

func (s *authService) Register(ctx context.Context, req *domain.RegisterRequest) (*domain.AuthResponse, error) {
	existingEmail, err := s.userRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		return nil, err
	}
	if existingEmail != nil {
		return nil, errors.New("email already in use")
	}

	existingUser, err := s.userRepo.GetByUsername(ctx, req.Username)
	if err != nil {
		return nil, err
	}
	if existingUser != nil {
		return nil, errors.New("username already taken")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	newUser := &domain.User{
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		Username:     req.Username,
		FullName:     req.FullName,
		IsVerified:   false,
		Roles:        []domain.Role{{Name: string(domain.RoleMember)}},
	}

	if err := s.userRepo.Create(ctx, newUser); err != nil {
		return nil, err
	}

	token, err := s.GenerateToken(newUser)
	if err != nil {
		return nil, err
	}

	return &domain.AuthResponse{
		Token: token,
		User:  *newUser,
	}, nil
}

func (s *authService) Login(ctx context.Context, req *domain.LoginRequest) (*domain.AuthResponse, error) {
	user, err := s.userRepo.GetByEmail(ctx, req.Email)
	if err != nil || user == nil {
		return nil, errors.New("invalid email or password")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, errors.New("invalid email or password")
	}

	token, err := s.GenerateToken(user)
	if err != nil {
		return nil, err
	}

	return &domain.AuthResponse{
		Token: token,
		User:  *user,
	}, nil
}

func (s *authService) GenerateToken(user *domain.User) (string, error) {
	claims := jwt.MapClaims{
		"sub":      user.ID.String(),
		"email":    user.Email,
		"username": user.Username,
		"roles":    roleNames(user.Roles),
		"exp":      time.Now().Add(time.Hour * time.Duration(s.cfg.JWTExpirationHours)).Unix(),
		"iat":      time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.cfg.JWTSecret))
}

func roleNames(roles []domain.Role) []string {
	names := make([]string, 0, len(roles))
	for _, role := range roles {
		names = append(names, role.Name)
	}
	return names
}

func (s *authService) ValidateToken(tokenStr string) (*jwt.Token, error) {
	return jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
		if token.Method != jwt.SigningMethodHS256 {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(s.cfg.JWTSecret), nil
	}, jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}))
}

// Game Service
type GameService interface {
	CreateGame(ctx context.Context, game *domain.Game) error
	GetAllGames(ctx context.Context) ([]domain.Game, error)
}

type gameService struct {
	gameRepo repository.GameRepository
}

func NewGameService(gameRepo repository.GameRepository) GameService {
	return &gameService{gameRepo: gameRepo}
}

func (s *gameService) CreateGame(ctx context.Context, game *domain.Game) error {
	return s.gameRepo.Create(ctx, game)
}

func (s *gameService) GetAllGames(ctx context.Context) ([]domain.Game, error) {
	return s.gameRepo.GetAll(ctx)
}

// Team Service
type TeamService interface {
	CreateTeam(ctx context.Context, team *domain.Team) error
	GetAllTeams(ctx context.Context) ([]domain.Team, error)
	GetTeamByID(ctx context.Context, id uuid.UUID) (*domain.Team, error)
}

type teamService struct {
	teamRepo repository.TeamRepository
}

func NewTeamService(teamRepo repository.TeamRepository) TeamService {
	return &teamService{teamRepo: teamRepo}
}

func (s *teamService) CreateTeam(ctx context.Context, team *domain.Team) error {
	return s.teamRepo.Create(ctx, team)
}

func (s *teamService) GetAllTeams(ctx context.Context) ([]domain.Team, error) {
	return s.teamRepo.GetAll(ctx)
}

func (s *teamService) GetTeamByID(ctx context.Context, id uuid.UUID) (*domain.Team, error) {
	return s.teamRepo.GetByID(ctx, id)
}

// Tournament Service
type TournamentService interface {
	CreateTournament(ctx context.Context, tournament *domain.Tournament) error
	GetAllTournaments(ctx context.Context) ([]domain.Tournament, error)
	GetTournamentByID(ctx context.Context, id uuid.UUID) (*domain.Tournament, error)
	UpdateScore(ctx context.Context, matchID uuid.UUID, score1, score2 int, winnerID *uuid.UUID, status domain.MatchStatus) error
}

type tournamentService struct {
	tournamentRepo repository.TournamentRepository
}

func NewTournamentService(tournamentRepo repository.TournamentRepository) TournamentService {
	return &tournamentService{tournamentRepo: tournamentRepo}
}

func (s *tournamentService) CreateTournament(ctx context.Context, tournament *domain.Tournament) error {
	return s.tournamentRepo.Create(ctx, tournament)
}

func (s *tournamentService) GetAllTournaments(ctx context.Context) ([]domain.Tournament, error) {
	return s.tournamentRepo.GetAll(ctx)
}

func (s *tournamentService) GetTournamentByID(ctx context.Context, id uuid.UUID) (*domain.Tournament, error) {
	return s.tournamentRepo.GetByID(ctx, id)
}

func (s *tournamentService) UpdateScore(ctx context.Context, matchID uuid.UUID, score1, score2 int, winnerID *uuid.UUID, status domain.MatchStatus) error {
	return s.tournamentRepo.UpdateMatchScore(ctx, matchID, score1, score2, winnerID, status)
}

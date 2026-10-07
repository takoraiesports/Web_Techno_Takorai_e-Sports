package domain

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

func ValidateMatchResult(score1, score2 int, winnerID *uuid.UUID, status MatchStatus) error {
	if score1 < 0 || score2 < 0 {
		return errors.New("scores cannot be negative")
	}
	if status == MatchCompleted {
		if winnerID == nil {
			return errors.New("completed match requires a winner")
		}
		if score1 == score2 {
			return errors.New("completed match cannot end in a tie")
		}
		return nil
	}
	if winnerID != nil {
		return errors.New("winner can only be set for a completed match")
	}
	return nil
}

// User Enums
type UserRoleEnum string

const (
	RoleAdmin  UserRoleEnum = "ADMIN"
	RoleMember UserRoleEnum = "MEMBER"
)

type VerificationStatus string

const (
	VerificationUnverified VerificationStatus = "UNVERIFIED"
	VerificationPending    VerificationStatus = "PENDING"
	VerificationApproved   VerificationStatus = "APPROVED"
	VerificationRejected   VerificationStatus = "REJECTED"
)

type StudentStatus string

const (
	StudentActive         StudentStatus = "ACTIVE"
	StudentInactive       StudentStatus = "INACTIVE"
	StudentGraduated      StudentStatus = "GRADUATED"
	StudentLeaveOfAbsence StudentStatus = "LEAVE_OF_ABSENCE"
)

type TournamentStatus string

const (
	TournamentDraft            TournamentStatus = "DRAFT"
	TournamentRegistrationOpen TournamentStatus = "REGISTRATION_OPEN"
	TournamentClosed           TournamentStatus = "REGISTRATION_CLOSED"
	TournamentCheckIn          TournamentStatus = "CHECK_IN"
	TournamentOngoing          TournamentStatus = "ONGOING"
	TournamentCompleted        TournamentStatus = "COMPLETED"
	TournamentCancelled        TournamentStatus = "CANCELLED"
)

type TournamentFormat string

const (
	FormatSingleElimination TournamentFormat = "SINGLE_ELIMINATION"
	FormatDoubleElimination TournamentFormat = "DOUBLE_ELIMINATION"
	FormatRoundRobin        TournamentFormat = "ROUND_ROBIN"
	FormatSwiss             TournamentFormat = "SWISS"
	FormatTwoStage          TournamentFormat = "TWO_STAGE"
)

type RegistrationStatus string

const (
	RegistrationPending      RegistrationStatus = "PENDING"
	RegistrationApproved     RegistrationStatus = "APPROVED"
	RegistrationRejected     RegistrationStatus = "REJECTED"
	RegistrationCheckedIn    RegistrationStatus = "CHECKED_IN"
	RegistrationWithdrawn    RegistrationStatus = "WITHDRAWN"
	RegistrationDisqualified RegistrationStatus = "DISQUALIFIED"
)

type MatchStatus string

const (
	MatchScheduled MatchStatus = "SCHEDULED"
	MatchCheckIn   MatchStatus = "CHECK_IN"
	MatchLive      MatchStatus = "LIVE"
	MatchPending   MatchStatus = "PENDING"
	MatchCompleted MatchStatus = "COMPLETED"
	MatchDisputed  MatchStatus = "DISPUTED"
	MatchCancelled MatchStatus = "CANCELLED"
	MatchForfeit   MatchStatus = "FORFEIT"
)

type MatchType string

const (
	BO1 MatchType = "BO1"
	BO3 MatchType = "BO3"
	BO5 MatchType = "BO5"
)

type DisputeStatus string

const (
	DisputeOpen               DisputeStatus = "OPEN"
	DisputeUnderReview        DisputeStatus = "UNDER_REVIEW"
	DisputeRequestingEvidence DisputeStatus = "REQUESTING_EVIDENCE"
	DisputeResolved           DisputeStatus = "RESOLVED"
	DisputeRejected           DisputeStatus = "REJECTED"
)

type OrderStatus string

const (
	OrderPending        OrderStatus = "PENDING"
	OrderConfirmed      OrderStatus = "CONFIRMED"
	OrderPaid           OrderStatus = "PAID"
	OrderProcessing     OrderStatus = "PROCESSING"
	OrderReadyForPickup OrderStatus = "READY_FOR_PICKUP"
	OrderShipped        OrderStatus = "SHIPPED"
	OrderCompleted      OrderStatus = "COMPLETED"
	OrderCancelled      OrderStatus = "CANCELLED"
	OrderRefunded       OrderStatus = "REFUNDED"
)

type Base struct {
	ID        uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// Permission & Role Models
type Permission struct {
	ID          uint   `gorm:"primaryKey" json:"id"`
	Code        string `gorm:"uniqueIndex;not null" json:"code"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

type Role struct {
	ID          uint         `gorm:"primaryKey" json:"id"`
	Name        string       `gorm:"uniqueIndex;not null" json:"name"`
	Description string       `json:"description"`
	Permissions []Permission `gorm:"many2many:role_permissions;" json:"permissions"`
}

// User Model
type User struct {
	Base
	Email               string               `gorm:"uniqueIndex;not null" json:"email"`
	PasswordHash        string               `gorm:"not null" json:"-"`
	Username            string               `gorm:"uniqueIndex;not null" json:"username"`
	FullName            string               `json:"full_name"`
	AvatarURL           string               `json:"avatar_url"`
	IsVerified          bool                 `gorm:"default:false" json:"is_verified"`
	Roles               []Role               `gorm:"many2many:user_roles;" json:"roles"`
	StudentVerification *StudentVerification `json:"student_verification,omitempty"`
	GamerProfile        *GamerProfile        `json:"gamer_profile,omitempty"`
}

type StudentVerification struct {
	Base
	UserID          uuid.UUID          `gorm:"type:uuid;uniqueIndex;not null" json:"user_id"`
	StudentID       string             `gorm:"not null" json:"student_id"`
	UniversityEmail string             `json:"university_email"`
	Faculty         string             `json:"faculty"`
	Department      string             `json:"department"`
	Year            int                `json:"year"`
	StudentStatus   StudentStatus      `gorm:"default:'ACTIVE'" json:"student_status"`
	StudentCardURL  string             `json:"student_card_url"`
	Status          VerificationStatus `gorm:"default:'PENDING'" json:"status"`
	RejectReason    string             `json:"reject_reason,omitempty"`
}

type GamerProfile struct {
	Base
	UserID        uuid.UUID `gorm:"type:uuid;uniqueIndex;not null" json:"user_id"`
	InGameName    string    `json:"in_game_name"`
	PrimaryGame   string    `json:"primary_game"`
	Rank          string    `json:"rank"`
	Bio           string    `json:"bio"`
	DiscordTag    string    `json:"discord_tag"`
	TwitchURL     string    `json:"twitch_url"`
	YouTubeURL    string    `json:"youtube_url"`
	MatchesPlayed int       `gorm:"default:0" json:"matches_played"`
	Wins          int       `gorm:"default:0" json:"wins"`
	Losses        int       `gorm:"default:0" json:"losses"`
	WinRate       float64   `gorm:"default:0" json:"win_rate"`
	Championships int       `gorm:"default:0" json:"championships"`
	MVPCount      int       `gorm:"default:0" json:"mvp_count"`
	EloRating     int       `gorm:"default:1200" json:"elo_rating"`
}

// Game Model
type Game struct {
	Base
	Name        string `gorm:"not null" json:"name"`
	Slug        string `gorm:"uniqueIndex;not null" json:"slug"`
	Publisher   string `json:"publisher"`
	Category    string `json:"category"`
	Platform    string `json:"platform"` // PC, MOBILE, CONSOLE, MULTI_PLATFORM
	BannerURL   string `json:"banner_url"`
	LogoURL     string `json:"logo_url"`
	TeamSizeMin int    `gorm:"default:1" json:"team_size_min"`
	TeamSizeMax int    `gorm:"default:5" json:"team_size_max"`
	IsActive    bool   `gorm:"default:true" json:"is_active"`
}

// Team Model
type Team struct {
	Base
	Name          string       `gorm:"not null" json:"name"`
	Tag           string       `gorm:"not null" json:"tag"`
	LogoURL       string       `json:"logo_url"`
	BannerURL     string       `json:"banner_url"`
	CaptainID     uuid.UUID    `gorm:"type:uuid;not null" json:"captain_id"`
	Captain       User         `gorm:"foreignKey:CaptainID" json:"captain"`
	GameID        uuid.UUID    `gorm:"type:uuid;not null" json:"game_id"`
	Game          Game         `gorm:"foreignKey:GameID" json:"game"`
	Members       []TeamMember `json:"members"`
	Rating        int          `gorm:"default:1200" json:"rating"`
	Wins          int          `gorm:"default:0" json:"wins"`
	Losses        int          `gorm:"default:0" json:"losses"`
	Championships int          `gorm:"default:0" json:"championships"`
	IsActive      bool         `gorm:"default:true" json:"is_active"`
}

type TeamMember struct {
	Base
	TeamID   uuid.UUID `gorm:"type:uuid;not null;index" json:"team_id"`
	UserID   uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	User     User      `gorm:"foreignKey:UserID" json:"user"`
	Role     string    `gorm:"default:'MAIN_PLAYER'" json:"role"` // CAPTAIN, MAIN_PLAYER, SUBSTITUTE, COACH, MANAGER
	JoinedAt time.Time `json:"joined_at"`
}

type TeamInvitation struct {
	Base
	TeamID      uuid.UUID `gorm:"type:uuid;not null;index" json:"team_id"`
	Team        Team      `gorm:"foreignKey:TeamID" json:"team"`
	InvitedBy   uuid.UUID `gorm:"type:uuid;not null" json:"invited_by"`
	InvitedUser User      `gorm:"foreignKey:InvitedBy" json:"invited_user"`
	UserEmail   string    `json:"user_email"`
	Role        string    `json:"role"`
	Status      string    `gorm:"default:'PENDING'" json:"status"` // PENDING, ACCEPTED, REJECTED
}

// Tournament Model
type Tournament struct {
	Base
	Title             string           `gorm:"not null" json:"title"`
	Slug              string           `gorm:"uniqueIndex;not null" json:"slug"`
	Description       string           `json:"description"`
	Rules             string           `json:"rules"`
	BannerURL         string           `json:"banner_url"`
	GameID            uuid.UUID        `gorm:"type:uuid;not null" json:"game_id"`
	Game              Game             `gorm:"foreignKey:GameID" json:"game"`
	OrganizerID       uuid.UUID        `gorm:"type:uuid;not null" json:"organizer_id"`
	Organizer         User             `gorm:"foreignKey:OrganizerID" json:"organizer"`
	Format            TournamentFormat `gorm:"default:'SINGLE_ELIMINATION'" json:"format"`
	MaxTeams          int              `gorm:"default:16" json:"max_teams"`
	PrizePool         string           `json:"prize_pool"`
	RegistrationStart time.Time        `json:"registration_start"`
	RegistrationEnd   time.Time        `json:"registration_end"`
	TournamentStart   time.Time        `json:"tournament_start"`
	TournamentEnd     time.Time        `json:"tournament_end"`
	Status            TournamentStatus `gorm:"default:'DRAFT'" json:"status"`
	SeedingType       string           `gorm:"default:'RANDOM'" json:"seeding_type"` // RANDOM, MANUAL, RANKING, RATING
	SeedLocked        bool             `gorm:"default:false" json:"seed_locked"`
	Matches           []Match          `json:"matches,omitempty"`
}

type TournamentRegistration struct {
	Base
	TournamentID uuid.UUID          `gorm:"type:uuid;not null;index" json:"tournament_id"`
	TeamID       uuid.UUID          `gorm:"type:uuid;not null;index" json:"team_id"`
	Team         Team               `gorm:"foreignKey:TeamID" json:"team"`
	CaptainID    uuid.UUID          `gorm:"type:uuid" json:"captain_id"`
	Roster       string             `json:"roster_json"` // JSON string array of user IDs
	Seed         int                `json:"seed"`
	Status       RegistrationStatus `gorm:"default:'PENDING'" json:"status"`
	RejectReason string             `json:"reject_reason,omitempty"`
	CheckedInAt  *time.Time         `json:"checked_in_at,omitempty"`
}

// Match & Dispute Models
type Match struct {
	Base
	TournamentID uuid.UUID   `gorm:"type:uuid;not null;index" json:"tournament_id"`
	Stage        string      `gorm:"default:'PLAYOFF'" json:"stage"` // GROUP_STAGE, PLAYOFF
	Group        string      `json:"group_name,omitempty"`           // Group A, B, C, D
	Round        int         `json:"round"`
	MatchNumber  int         `json:"match_number"`
	MatchType    MatchType   `gorm:"default:'BO1'" json:"match_type"`
	Team1ID      *uuid.UUID  `gorm:"type:uuid" json:"team1_id"`
	Team1        *Team       `gorm:"foreignKey:Team1ID" json:"team1,omitempty"`
	Team2ID      *uuid.UUID  `gorm:"type:uuid" json:"team2_id"`
	Team2        *Team       `gorm:"foreignKey:Team2ID" json:"team2,omitempty"`
	ScoreTeam1   int         `gorm:"default:0" json:"score_team1"`
	ScoreTeam2   int         `gorm:"default:0" json:"score_team2"`
	WinnerID     *uuid.UUID  `gorm:"type:uuid" json:"winner_id"`
	Status       MatchStatus `gorm:"default:'SCHEDULED'" json:"status"`
	ScheduledAt  *time.Time  `json:"scheduled_at"`
	StreamURL    string      `json:"stream_url,omitempty"`
	VODURL       string      `json:"vod_url,omitempty"`
	EvidenceURL  string      `json:"evidence_url,omitempty"`
	Notes        string      `json:"notes,omitempty"`
}

type Dispute struct {
	Base
	MatchID      uuid.UUID     `gorm:"type:uuid;not null;index" json:"match_id"`
	Match        Match         `gorm:"foreignKey:MatchID" json:"match"`
	RaisedByID   uuid.UUID     `gorm:"type:uuid;not null" json:"raised_by_id"`
	RaisedBy     User          `gorm:"foreignKey:RaisedByID" json:"raised_by"`
	Reason       string        `gorm:"not null" json:"reason"`
	EvidenceURL  string        `json:"evidence_url"`
	Status       DisputeStatus `gorm:"default:'OPEN'" json:"status"`
	Resolution   string        `json:"resolution,omitempty"`
	ResolvedByID *uuid.UUID    `gorm:"type:uuid" json:"resolved_by_id,omitempty"`
}

type DisputeMessage struct {
	Base
	DisputeID  uuid.UUID `gorm:"type:uuid;not null;index" json:"dispute_id"`
	SenderID   uuid.UUID `gorm:"type:uuid;not null" json:"sender_id"`
	Sender     User      `gorm:"foreignKey:SenderID" json:"sender"`
	Message    string    `gorm:"not null" json:"message"`
	Attachment string    `json:"attachment,omitempty"`
}

// News CMS Model
type News struct {
	Base
	Title       string    `gorm:"not null" json:"title"`
	Slug        string    `gorm:"uniqueIndex;not null" json:"slug"`
	Content     string    `gorm:"type:text" json:"content"`
	Category    string    `json:"category"`
	Tags        string    `json:"tags"` // Comma separated
	CoverURL    string    `json:"cover_url"`
	AuthorID    uuid.UUID `gorm:"type:uuid;not null" json:"author_id"`
	Author      User      `gorm:"foreignKey:AuthorID" json:"author"`
	Status      string    `gorm:"default:'PUBLISHED'" json:"status"` // DRAFT, PUBLISHED, ARCHIVED
	PublishedAt time.Time `json:"published_at"`
}

// Store & Order Models
type Product struct {
	Base
	Name        string           `gorm:"not null" json:"name"`
	Slug        string           `gorm:"uniqueIndex;not null" json:"slug"`
	Subtitle    string           `json:"subtitle"`
	Description string           `json:"description"`
	Category    string           `json:"category"`
	SKU         string           `gorm:"uniqueIndex;not null" json:"sku"`
	Price       float64          `gorm:"not null" json:"price"`
	ImageURL    string           `json:"image_url"`
	Stock       int              `gorm:"default:0" json:"stock"`
	Color       string           `json:"color"`
	HasSizes    bool             `gorm:"default:false" json:"has_sizes"`
	IsActive    bool             `gorm:"default:true" json:"is_active"`
	Variants    []ProductVariant `gorm:"constraint:OnDelete:CASCADE" json:"variants,omitempty"`
}

type ProductVariant struct {
	Base
	ProductID uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_product_variant" json:"product_id"`
	Size      string    `gorm:"uniqueIndex:idx_product_variant;not null" json:"size"`
	Color     string    `gorm:"uniqueIndex:idx_product_variant;not null" json:"color"`
	SKU       string    `gorm:"uniqueIndex;not null" json:"sku"`
	Price     float64   `gorm:"not null" json:"price"`
	Stock     int       `gorm:"not null;default:0" json:"stock"`
}

type Order struct {
	Base
	UserID         uuid.UUID   `gorm:"type:uuid;not null;index" json:"user_id"`
	User           User        `gorm:"foreignKey:UserID" json:"user"`
	OrderNumber    string      `gorm:"uniqueIndex;not null" json:"order_number"`
	TotalAmount    float64     `gorm:"not null" json:"total_amount"`
	Status         OrderStatus `gorm:"default:'PENDING'" json:"status"`
	PaymentMethod  string      `json:"payment_method"`
	PaymentSlipURL string      `json:"payment_slip_url"`
	DeliveryMethod string      `json:"delivery_method"` // PICKUP, SHIPPING
	ShippingAddr   string      `json:"shipping_address,omitempty"`
	Items          []OrderItem `json:"items"`
}

type OrderItem struct {
	Base
	OrderID   uuid.UUID `gorm:"type:uuid;not null;index" json:"order_id"`
	ProductID uuid.UUID `gorm:"type:uuid;not null" json:"product_id"`
	Product   Product   `gorm:"foreignKey:ProductID" json:"product"`
	Quantity  int       `gorm:"not null" json:"quantity"`
	Price     float64   `gorm:"not null" json:"price"`
	Size      string    `json:"size,omitempty"`
	Color     string    `json:"color,omitempty"`
}

// Notification Model
type Notification struct {
	Base
	UserID  uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	Title   string    `gorm:"not null" json:"title"`
	Message string    `gorm:"not null" json:"message"`
	Type    string    `json:"type"`
	Link    string    `json:"link,omitempty"`
	IsRead  bool      `gorm:"default:false" json:"is_read"`
}

// Audit Log Model
type AuditLog struct {
	Base
	UserID    *uuid.UUID `gorm:"type:uuid" json:"user_id,omitempty"`
	Action    string     `gorm:"not null" json:"action"`
	Entity    string     `gorm:"not null" json:"entity"`
	EntityID  string     `json:"entity_id"`
	OldValue  string     `gorm:"type:text" json:"old_value,omitempty"`
	NewValue  string     `gorm:"type:text" json:"new_value,omitempty"`
	IPAddress string     `json:"ip_address"`
	UserAgent string     `json:"user_agent"`
}

// Request & Response DTOs
type RegisterRequest struct {
	Email          string `json:"email" binding:"required,email"`
	Password       string `json:"password" binding:"required,min=6"`
	Username       string `json:"username" binding:"required,min=3"`
	FullName       string `json:"full_name" binding:"required"`
	StudentID      string `json:"student_id"`
	Faculty        string `json:"faculty"`
	Department     string `json:"department"`
	Year           int    `json:"year"`
	StudentCardURL string `json:"student_card_url"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

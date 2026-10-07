package config

import (
	"errors"
	"fmt"
	"net/url"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	Port        string
	Env         string
	FrontendURL string

	// DB
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	DBSslMode  string

	// Redis
	RedisHost     string
	RedisPort     string
	RedisPassword string
	RedisDB       int

	// JWT
	JWTSecret            string
	JWTExpirationHours   int
	InitialAdminEmail    string
	InitialAdminUsername string
	InitialAdminPassword string

	// S3 Storage
	S3Endpoint     string
	S3Region       string
	S3AccessKey    string
	S3SecretKey    string
	S3BucketName   string
	S3UsePathStyle bool
	S3CreateBucket bool
}

func LoadConfig() (*Config, error) {
	_ = godotenv.Load()

	redisDB, _ := strconv.Atoi(getEnv("REDIS_DB", "0"))
	jwtExp, _ := strconv.Atoi(getEnv("JWT_EXPIRATION_HOURS", "24"))
	s3PathStyle, _ := strconv.ParseBool(getEnv("S3_USE_PATH_STYLE", "true"))
	s3CreateBucket, _ := strconv.ParseBool(getEnv("S3_CREATE_BUCKET", "false"))

	cfg := &Config{
		Port:                 getEnv("PORT", "8080"),
		Env:                  getEnv("ENV", "development"),
		FrontendURL:          getEnv("FRONTEND_URL", "http://localhost:3000"),
		DBHost:               getEnv("DB_HOST", "localhost"),
		DBPort:               getEnv("DB_PORT", "5432"),
		DBUser:               getEnv("DB_USER", "esports_user"),
		DBPassword:           getEnv("DB_PASSWORD", "esports_dev_password_change_in_prod"),
		DBName:               getEnv("DB_NAME", "esports_db"),
		DBSslMode:            getEnv("DB_SSLMODE", "disable"),
		RedisHost:            getEnv("REDIS_HOST", "localhost"),
		RedisPort:            getEnv("REDIS_PORT", "6379"),
		RedisPassword:        getEnv("REDIS_PASSWORD", "esports_redis_dev_password"),
		RedisDB:              redisDB,
		JWTSecret:            getEnv("JWT_SECRET", "default_secret_key_please_change"),
		JWTExpirationHours:   jwtExp,
		InitialAdminEmail:    getEnv("INITIAL_ADMIN_EMAIL", ""),
		InitialAdminUsername: getEnv("INITIAL_ADMIN_USERNAME", ""),
		InitialAdminPassword: getEnv("INITIAL_ADMIN_PASSWORD", ""),
		S3Endpoint:           getEnv("S3_ENDPOINT", "http://localhost:9000"),
		S3Region:             getEnv("S3_REGION", "us-east-1"),
		S3AccessKey:          getEnv("S3_ACCESS_KEY", "minioadmin"),
		S3SecretKey:          getEnv("S3_SECRET_KEY", "minioadmin"),
		S3BucketName:         getEnv("S3_BUCKET_NAME", "esports-assets"),
		S3UsePathStyle:       s3PathStyle,
		S3CreateBucket:       s3CreateBucket,
	}
	if err := cfg.Validate(); err != nil {
		return nil, err
	}
	return cfg, nil
}

func (c *Config) Validate() error {
	if c.JWTExpirationHours <= 0 {
		return errors.New("JWT_EXPIRATION_HOURS must be greater than zero")
	}
	if c.Env == "production" {
		if len(c.JWTSecret) < 32 || isPlaceholderSecret(c.JWTSecret) {
			return errors.New("JWT_SECRET must be a unique secret of at least 32 characters in production")
		}
		if strings.TrimSpace(c.DBPassword) == "" || isPlaceholderSecret(c.DBPassword) {
			return errors.New("DB_PASSWORD must be set to a unique value in production")
		}
		if strings.TrimSpace(c.RedisPassword) == "" || isPlaceholderSecret(c.RedisPassword) {
			return errors.New("REDIS_PASSWORD must be set to a unique value in production")
		}
		if strings.TrimSpace(c.S3AccessKey) == "" || isPlaceholderSecret(c.S3AccessKey) || strings.TrimSpace(c.S3SecretKey) == "" || isPlaceholderSecret(c.S3SecretKey) {
			return errors.New("S3 credentials must be set to unique values in production")
		}
		frontend, err := url.ParseRequestURI(c.FrontendURL)
		if err != nil || frontend.Scheme != "https" || frontend.Host == "" {
			return errors.New("FRONTEND_URL must be an HTTPS origin in production")
		}
	}
	return nil
}

func isPlaceholderSecret(value string) bool {
	value = strings.ToLower(strings.TrimSpace(value))
	for _, placeholder := range []string{"change_me", "change-me", "change_in_prod", "default_secret", "minioadmin", "dev_password", "super_secret", "replace_with", "example", "your_"} {
		if strings.Contains(value, placeholder) {
			return true
		}
	}
	return false
}

func (c *Config) GetDSN() string {
	return fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=Asia/Bangkok",
		c.DBHost, c.DBUser, c.DBPassword, c.DBName, c.DBPort, c.DBSslMode)
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}

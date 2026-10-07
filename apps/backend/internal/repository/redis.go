package repository

import (
	"context"
	"fmt"
	"log"

	"backend/internal/config"

	"github.com/redis/go-redis/v9"
)

func NewRedisClient(cfg *config.Config) (*redis.Client, error) {
	rdb := redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", cfg.RedisHost, cfg.RedisPort),
		Password: cfg.RedisPassword,
		DB:       cfg.RedisDB,
	})

	ctx := context.Background()
	_, err := rdb.Ping(ctx).Result()
	if err != nil {
		log.Printf("[Redis] Connection warning (running without redis or invalid credentials): %v\n", err)
		return rdb, nil // Non-fatal for dev init
	}

	log.Println("[Redis] Connected to Redis successfully")
	return rdb, nil
}

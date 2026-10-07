package config

import "testing"

func TestValidateProductionJWTSecret(t *testing.T) {
	tests := []struct {
		name        string
		env, secret string
		hours       int
		wantErr     bool
	}{
		{"development defaults allowed", "development", "default_secret_key_please_change", 24, false},
		{"production rejects default", "production", "default_secret_key_please_change", 24, true},
		{"production rejects short secret", "production", "short", 24, true},
		{"production accepts configured secrets", "production", "01234567890123456789012345678901", 24, false},
		{"rejects invalid expiry", "development", "secret", 0, true},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			cfg := &Config{
				Env: tc.env, JWTSecret: tc.secret, JWTExpirationHours: tc.hours,
				DBPassword: "db-secret-never-used-742901", RedisPassword: "redis-secret-never-used-742901",
				S3AccessKey: "object-access-key", S3SecretKey: "object-secret-never-used-742901",
				FrontendURL: "https://club.example.edu",
			}
			if err := cfg.Validate(); (err != nil) != tc.wantErr {
				t.Fatalf("Validate() error = %v, wantErr %v", err, tc.wantErr)
			}
		})
	}
}

func TestValidateProductionFrontendAllowlist(t *testing.T) {
	base := Config{
		Env: "production", JWTSecret: "01234567890123456789012345678901", JWTExpirationHours: 12,
		DBPassword: "db-secret-never-used-742901", RedisPassword: "redis-secret-never-used-742901",
		S3AccessKey: "object-access-key", S3SecretKey: "object-secret-never-used-742901",
		FrontendURL: "https://club.example.edu",
	}
	if err := base.Validate(); err != nil {
		t.Fatalf("valid primary origin rejected: %v", err)
	}
	base.FrontendURLs = "https://ttes-club.vercel.app, https://club-preview.vercel.app/"
	if err := base.Validate(); err != nil {
		t.Fatalf("valid additional origins rejected: %v", err)
	}
	base.FrontendURLs = "https://evil.example/path"
	if err := base.Validate(); err == nil {
		t.Fatal("expected a frontend path to be rejected as an origin")
	}
	base.FrontendURLs = "http://ttes-club.vercel.app"
	if err := base.Validate(); err == nil {
		t.Fatal("expected insecure production origin to be rejected")
	}
}

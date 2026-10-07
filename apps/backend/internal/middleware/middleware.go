package middleware

import (
	"net/http"
	"strings"

	"backend/internal/domain"
	"backend/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func CORSMiddleware(frontendURL string) gin.HandlerFunc {
	allowedOrigins := make(map[string]struct{})
	for _, origin := range strings.Split(frontendURL, ",") {
		if origin = strings.TrimSpace(origin); origin != "" {
			allowedOrigins[strings.TrimSuffix(origin, "/")] = struct{}{}
		}
	}
	return func(c *gin.Context) {
		c.Writer.Header().Add("Vary", "Origin")
		origin := strings.TrimSuffix(c.GetHeader("Origin"), "/")
		if _, ok := allowedOrigins[origin]; ok {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
			c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
			c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
			c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, PATCH, DELETE")
		}

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

func JWTAuthMiddleware(authService service.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, domain.APIResponse{
				Success: false,
				Error:   "Authorization header required",
			})
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, domain.APIResponse{
				Success: false,
				Error:   "Invalid authorization token format",
			})
			c.Abort()
			return
		}

		token, err := authService.ValidateToken(parts[1])
		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, domain.APIResponse{
				Success: false,
				Error:   "Invalid or expired token",
			})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok || claims["sub"] == nil {
			c.JSON(http.StatusUnauthorized, domain.APIResponse{Success: false, Error: "Invalid token claims"})
			c.Abort()
			return
		}
		c.Set("userID", claims["sub"])
		c.Set("email", claims["email"])
		c.Set("username", claims["username"])
		c.Set("roles", claimRoles(claims["roles"]))

		c.Next()
	}
}

// RequireAnyRole protects a route with one or more role names from the JWT.
// Keep this middleware after JWTAuthMiddleware in the route chain.
func RequireAnyRole(allowed ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		roles, _ := c.Get("roles")
		if hasAnyRole(roles, allowed) {
			c.Next()
			return
		}
		c.JSON(http.StatusForbidden, domain.APIResponse{Success: false, Error: "Insufficient permissions"})
		c.Abort()
	}
}

func claimRoles(value interface{}) []string {
	items, ok := value.([]interface{})
	if !ok {
		return nil
	}
	roles := make([]string, 0, len(items))
	for _, item := range items {
		if role, ok := item.(string); ok {
			roles = append(roles, role)
		}
	}
	return roles
}

func hasAnyRole(value interface{}, allowed []string) bool {
	roles, ok := value.([]string)
	if !ok || len(roles) == 0 || len(allowed) == 0 {
		return false
	}
	for _, role := range roles {
		for _, candidate := range allowed {
			if role == candidate {
				return true
			}
		}
	}
	return false
}

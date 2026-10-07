package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestClaimRoles(t *testing.T) {
	got := claimRoles([]interface{}{"STUDENT", "ORGANIZER", 12})
	if len(got) != 2 || got[0] != "STUDENT" || got[1] != "ORGANIZER" {
		t.Fatalf("claimRoles returned %#v", got)
	}
	if got := claimRoles("ADMIN"); got != nil {
		t.Fatalf("expected malformed claim to be ignored, got %#v", got)
	}
}

func TestRequireAnyRole(t *testing.T) {
	gin.SetMode(gin.TestMode)
	tests := []struct {
		name  string
		roles []string
		want  int
	}{
		{name: "allowed organizer", roles: []string{"STUDENT", "ORGANIZER"}, want: http.StatusNoContent},
		{name: "forbidden student", roles: []string{"STUDENT"}, want: http.StatusForbidden},
		{name: "missing role", want: http.StatusForbidden},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			r := gin.New()
			r.Use(func(c *gin.Context) { c.Set("roles", tc.roles); c.Next() })
			r.POST("/protected", RequireAnyRole("ORGANIZER", "ADMIN"), func(c *gin.Context) { c.Status(http.StatusNoContent) })
			w := httptest.NewRecorder()
			r.ServeHTTP(w, httptest.NewRequest(http.MethodPost, "/protected", nil))
			if w.Code != tc.want {
				t.Fatalf("status = %d, want %d", w.Code, tc.want)
			}
		})
	}
}

func TestCORSAllowlist(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(CORSMiddleware("http://localhost:3000,https://ttes-club.vercel.app"))
	r.OPTIONS("/api/v1/games", func(c *gin.Context) { c.Status(http.StatusNoContent) })
	for _, test := range []struct {
		origin string
		want   string
	}{
		{"https://ttes-club.vercel.app", "https://ttes-club.vercel.app"},
		{"http://localhost:3000", "http://localhost:3000"},
		{"https://untrusted.example", ""},
	} {
		t.Run(test.origin, func(t *testing.T) {
			request := httptest.NewRequest(http.MethodOptions, "/api/v1/games", nil)
			request.Header.Set("Origin", test.origin)
			response := httptest.NewRecorder()
			r.ServeHTTP(response, request)
			if got := response.Header().Get("Access-Control-Allow-Origin"); got != test.want {
				t.Fatalf("allow origin = %q, want %q", got, test.want)
			}
			if response.Code != http.StatusNoContent {
				t.Fatalf("preflight status = %d, want 204", response.Code)
			}
		})
	}
}

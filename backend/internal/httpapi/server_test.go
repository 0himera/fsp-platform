package httpapi

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestContestProxyRoutesDoNotConflictWithFrontendRoutes(t *testing.T) {
	engine := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet || r.URL.Path != "/api/competitions/42/contest" {
			t.Errorf("engine received %s %s", r.Method, r.URL.Path)
		}
		if got := r.Header.Get("Authorization"); got != "Bearer test-engine-token" {
			t.Errorf("engine authorization = %q", got)
		}
		if got := r.Header.Get("Cookie"); got != "" {
			t.Errorf("platform cookie leaked to engine: %q", got)
		}
		if got := r.Header.Get("X-Arena-User-ID"); got != "" {
			t.Errorf("untrusted user ID header leaked to engine: %q", got)
		}
		w.WriteHeader(http.StatusNoContent)
	}))
	defer engine.Close()

	api := &Server{ContestEngineURL: engine.URL, ContestEngineToken: "test-engine-token"}
	handler := api.Handler()

	request := httptest.NewRequest(http.MethodGet, "/api/competitions/42/contest", nil)
	request.Header.Set("X-Arena-User-ID", "999")
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, request)
	if response.Code != http.StatusNoContent {
		t.Fatalf("contest proxy status = %d, want %d", response.Code, http.StatusNoContent)
	}
}

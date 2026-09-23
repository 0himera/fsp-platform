package httpapi

import (
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/0himera/fsp-platform/internal/athletes"
	"github.com/0himera/fsp-platform/internal/auth"
	"github.com/0himera/fsp-platform/internal/competitions"
	"github.com/0himera/fsp-platform/internal/rating"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Server struct {
	DB           *pgxpool.Pool
	Auth         auth.Service
	Athletes     athletes.Service
	Competitions competitions.Service
	Rating       rating.Service
	FrontendDir  string
}

func New(db *pgxpool.Pool, frontendDir string) *Server {
	return &Server{DB: db, Auth: auth.Service{DB: db}, Athletes: athletes.Service{DB: db}, Competitions: competitions.Service{DB: db}, Rating: rating.Service{DB: db}, FrontendDir: frontendDir}
}

func (s *Server) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/health", s.health)
	mux.HandleFunc("POST /api/auth/register", s.register)
	mux.HandleFunc("POST /api/auth/login", s.login)
	mux.HandleFunc("POST /api/auth/logout", s.logout)
	mux.HandleFunc("GET /api/me", s.me)
	mux.HandleFunc("PATCH /api/me", s.updateMe)
	mux.HandleFunc("GET /api/me/registrations", s.myRegistrations)
	mux.HandleFunc("GET /api/disciplines", s.disciplines)
	mux.HandleFunc("POST /api/disciplines", s.createDiscipline)
	mux.HandleFunc("PUT /api/disciplines/{code}", s.renameDiscipline)
	mux.HandleFunc("GET /api/rankings", s.rankings)
	mux.HandleFunc("GET /api/athletes/{id}", s.athlete)
	mux.HandleFunc("PATCH /api/athletes/{id}/rank", s.setRank)
	mux.HandleFunc("GET /api/competitions", s.competitionList)
	mux.HandleFunc("POST /api/competitions", s.createCompetition)
	mux.HandleFunc("GET /api/competitions/{id}", s.competitionDetail)
	mux.HandleFunc("PUT /api/competitions/{id}", s.updateCompetition)
	mux.HandleFunc("POST /api/competitions/{id}/register", s.registerCompetition)
	mux.HandleFunc("DELETE /api/competitions/{id}/register", s.unregisterCompetition)
	mux.HandleFunc("POST /api/competitions/{id}/teams", s.createTeam)
	mux.HandleFunc("DELETE /api/competitions/{id}/teams/{team_id}", s.deleteTeam)
	mux.HandleFunc("PUT /api/competitions/{id}/results", s.publishResults)
	mux.Handle("GET /assets/", http.StripPrefix("/assets/", http.FileServer(http.Dir(s.FrontendDir))))
	mux.HandleFunc("GET /", s.index)
	return security(mux)
}

func security(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("Content-Security-Policy", "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'")
		if strings.HasPrefix(r.URL.Path, "/api/") {
			w.Header().Set("Cache-Control", "no-store")
			if r.Method == http.MethodPost || r.Method == http.MethodPut || r.Method == http.MethodPatch || r.Method == http.MethodDelete {
				if origin := r.Header.Get("Origin"); origin != "" {
					parsed, err := url.Parse(origin)
					if err != nil || parsed.Host != r.Host {
						writeError(w, http.StatusForbidden, "Недопустимый источник запроса")
						return
					}
				}
			}
		}
		defer func() {
			if rec := recover(); rec != nil {
				slog.Error("request panic", "error", rec, "path", r.URL.Path)
				writeError(w, http.StatusInternalServerError, "Внутренняя ошибка")
			}
		}()
		next.ServeHTTP(w, r)
	})
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

func decodeJSON(r *http.Request, target any) error {
	if !strings.HasPrefix(r.Header.Get("Content-Type"), "application/json") {
		return errors.New("Content-Type должен быть application/json")
	}
	decoder := json.NewDecoder(io.LimitReader(r.Body, 1<<20))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(target); err != nil {
		return err
	}
	var extra any
	if err := decoder.Decode(&extra); err != io.EOF {
		return errors.New("ожидался один JSON-объект")
	}
	return nil
}

func pathID(r *http.Request, key string) (int64, error) {
	id, err := strconv.ParseInt(r.PathValue(key), 10, 64)
	if err != nil || id < 1 {
		return 0, errors.New("неверный идентификатор")
	}
	return id, nil
}

func (s *Server) currentUser(r *http.Request) (auth.User, error) {
	cookie, err := r.Cookie("arena_session")
	if err != nil {
		return auth.User{}, err
	}
	return s.Auth.Session(r.Context(), cookie.Value)
}

func (s *Server) requireUser(w http.ResponseWriter, r *http.Request, role string) (auth.User, bool) {
	user, err := s.currentUser(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "Войдите в аккаунт")
		return auth.User{}, false
	}
	if role != "" && user.Role != role {
		writeError(w, http.StatusForbidden, "Недостаточно прав")
		return auth.User{}, false
	}
	return user, true
}

func handleError(w http.ResponseWriter, err error) {
	if err == nil {
		return
	}
	var pgErr *pgconn.PgError
	switch {
	case errors.Is(err, competitions.ErrNotFound), errors.Is(err, athletes.ErrNotFound), errors.Is(err, rating.ErrNotFound), errors.Is(err, pgx.ErrNoRows):
		writeError(w, http.StatusNotFound, "Не найдено")
	case errors.Is(err, competitions.ErrClosed):
		writeError(w, http.StatusConflict, "Регистрация закрыта или действие недоступно")
	case errors.Is(err, competitions.ErrConflict):
		writeError(w, http.StatusConflict, "Вы уже зарегистрированы или участник включён в команду")
	case errors.Is(err, competitions.ErrNotQualified):
		writeError(w, http.StatusForbidden, "В финал проходят только участники отбора в пределах проходного места")
	case errors.Is(err, competitions.ErrInvalid):
		writeError(w, http.StatusBadRequest, "Проверьте данные соревнования и протокола")
	case errors.Is(err, auth.ErrInvalidCredentials):
		writeError(w, http.StatusUnauthorized, "Неверная почта или пароль")
	case errors.As(err, &pgErr) && pgErr.Code == "23505":
		writeError(w, http.StatusConflict, "Такая запись уже существует")
	case errors.As(err, &pgErr) && (pgErr.Code == "23503" || pgErr.Code == "23514" || pgErr.Code == "23502"):
		writeError(w, http.StatusBadRequest, "Некорректные или несвязанные данные")
	default:
		slog.Error("request failed", "error", err)
		writeError(w, http.StatusInternalServerError, "Внутренняя ошибка")
	}
}

func (s *Server) health(w http.ResponseWriter, r *http.Request) {
	if err := s.DB.Ping(r.Context()); err != nil {
		writeError(w, http.StatusServiceUnavailable, "База данных недоступна")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok", "rating_rules": rating.RulesVersion})
}

func (s *Server) index(w http.ResponseWriter, r *http.Request) {
	if strings.HasPrefix(r.URL.Path, "/api/") || strings.Contains(filepath.Base(r.URL.Path), ".") {
		http.NotFound(w, r)
		return
	}
	w.Header().Set("Cache-Control", "no-cache")
	http.ServeFile(w, r, filepath.Join(s.FrontendDir, "index.html"))
}

func setSessionCookie(w http.ResponseWriter, r *http.Request, token string) {
	http.SetCookie(w, &http.Cookie{Name: "arena_session", Value: token, Path: "/", HttpOnly: true, SameSite: http.SameSiteLaxMode, Secure: r.TLS != nil, MaxAge: int((30 * 24 * time.Hour).Seconds())})
}

func clearSessionCookie(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{Name: "arena_session", Value: "", Path: "/", HttpOnly: true, SameSite: http.SameSiteLaxMode, Secure: r.TLS != nil, MaxAge: -1})
}

func ensureFrontend(dir string) error {
	_, err := os.Stat(filepath.Join(dir, "index.html"))
	return err
}

package httpapi

import (
	"net/http"
	"net/mail"
	"strings"
	"time"

	"github.com/0himera/fsp-platform/internal/athletes"
)

func validEmail(value string) bool {
	value = strings.TrimSpace(value)
	address, err := mail.ParseAddress(value)
	return err == nil && address.Address == value && len(value) <= 254
}

func (s *Server) register(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Email        string `json:"email"`
		Password     string `json:"password"`
		FullName     string `json:"full_name"`
		Organization string `json:"organization"`
		City         string `json:"city"`
	}
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	if !validEmail(input.Email) || len(input.Password) < 8 || len(input.Password) > 128 || len(strings.TrimSpace(input.FullName)) < 2 || len(input.FullName) > 100 || len(input.City) > 100 || len(input.Organization) > 160 {
		writeError(w, http.StatusBadRequest, "Укажите имя, корректную почту и пароль от 8 символов")
		return
	}
	user, token, err := s.Auth.Register(r.Context(), input.Email, input.Password, input.FullName, input.Organization, input.City)
	if err != nil {
		handleError(w, err)
		return
	}
	setSessionCookie(w, r, token)
	writeJSON(w, http.StatusCreated, map[string]any{"user": user})
}

func (s *Server) login(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	user, token, err := s.Auth.Login(r.Context(), input.Email, input.Password)
	if err != nil {
		handleError(w, err)
		return
	}
	setSessionCookie(w, r, token)
	writeJSON(w, http.StatusOK, map[string]any{"user": user})
}

func (s *Server) logout(w http.ResponseWriter, r *http.Request) {
	if cookie, err := r.Cookie("arena_session"); err == nil {
		if err := s.Auth.Logout(r.Context(), cookie.Value); err != nil {
			handleError(w, err)
			return
		}
	}
	clearSessionCookie(w, r)
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func (s *Server) me(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireUser(w, r, "")
	if !ok {
		return
	}
	response := map[string]any{"user": user}
	if user.Role == "athlete" {
		a, err := s.Rating.One(r.Context(), user.ID, time.Now().UTC())
		if err != nil {
			handleError(w, err)
			return
		}
		response["athlete"] = a
	}
	writeJSON(w, http.StatusOK, response)
}

func (s *Server) updateMe(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireUser(w, r, "athlete")
	if !ok {
		return
	}
	var input athletes.Update
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	if len(strings.TrimSpace(input.FullName)) < 2 || len(input.FullName) > 100 || len(input.City) > 100 || len(input.Organization) > 160 || len(input.Disciplines) > 5 {
		writeError(w, http.StatusBadRequest, "Проверьте данные профиля")
		return
	}
	if err := s.Athletes.Update(r.Context(), user.ID, input); err != nil {
		handleError(w, err)
		return
	}
	s.me(w, r)
}

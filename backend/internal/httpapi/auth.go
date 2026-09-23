package httpapi

import (
	"log/slog"
	"net/http"
	"net/mail"
	"net/url"
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
	if s.Mailer == nil {
		writeError(w, http.StatusServiceUnavailable, "Регистрация по почте пока недоступна")
		return
	}
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
	user, token, err := s.Auth.RegisterPending(r.Context(), input.Email, input.Password, input.FullName, input.Organization, input.City)
	if err != nil {
		handleError(w, err)
		return
	}
	mailSent := true
	if err := s.sendAuthMail(r, user.Email, "verify_email", token); err != nil {
		slog.Error("verification email failed", "error", err)
		mailSent = false
	}
	writeJSON(w, http.StatusCreated, map[string]bool{"check_email": true, "mail_sent": mailSent})
}

func (s *Server) sendAuthMail(r *http.Request, email, purpose, token string) error {
	page, subject, body := "verify-email", "Подтвердите почту · Арена ФСП РД", "Для подтверждения почты откройте ссылку:\n"
	if purpose == "reset_password" {
		page, subject, body = "reset-password", "Сброс пароля · Арена ФСП РД", "Для смены пароля откройте ссылку:\n"
	}
	link := s.PublicURL + "/" + page + "?token=" + url.QueryEscape(token)
	return s.Mailer.Send(r.Context(), email, subject, body+link+"\n\nЕсли вы не запрашивали это письмо, просто проигнорируйте его.\n")
}

func (s *Server) verifyEmail(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Token string `json:"token"`
	}
	if err := decodeJSON(r, &input); err != nil || len(input.Token) < 30 || len(input.Token) > 200 {
		writeError(w, http.StatusBadRequest, "Неверная ссылка")
		return
	}
	user, session, err := s.Auth.VerifyEmail(r.Context(), input.Token)
	if err != nil {
		handleError(w, err)
		return
	}
	s.setSessionCookie(w, r, session)
	writeJSON(w, http.StatusOK, map[string]any{"user": user})
}

func (s *Server) requestAuthMail(w http.ResponseWriter, r *http.Request, purpose string) {
	if s.Mailer == nil {
		writeError(w, http.StatusServiceUnavailable, "Отправка писем пока недоступна")
		return
	}
	var input struct {
		Email string `json:"email"`
	}
	if err := decodeJSON(r, &input); err != nil || !validEmail(input.Email) {
		writeError(w, http.StatusBadRequest, "Укажите корректную почту")
		return
	}
	token, err := s.Auth.RequestToken(r.Context(), input.Email, purpose)
	if err != nil {
		handleError(w, err)
		return
	}
	if token != "" {
		if err := s.sendAuthMail(r, strings.ToLower(strings.TrimSpace(input.Email)), purpose, token); err != nil {
			slog.Error("authentication email failed", "purpose", purpose, "error", err)
		}
	}
	writeJSON(w, http.StatusAccepted, map[string]bool{"check_email": true})
}

func (s *Server) resendVerification(w http.ResponseWriter, r *http.Request) {
	s.requestAuthMail(w, r, "verify_email")
}

func (s *Server) forgotPassword(w http.ResponseWriter, r *http.Request) {
	s.requestAuthMail(w, r, "reset_password")
}

func (s *Server) resetPassword(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Token    string `json:"token"`
		Password string `json:"password"`
	}
	if err := decodeJSON(r, &input); err != nil || len(input.Token) < 30 || len(input.Token) > 200 || len(input.Password) < 8 || len(input.Password) > 128 {
		writeError(w, http.StatusBadRequest, "Проверьте ссылку и пароль от 8 символов")
		return
	}
	if err := s.Auth.ResetPassword(r.Context(), input.Token, input.Password); err != nil {
		handleError(w, err)
		return
	}
	clearSessionCookie(w, r)
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
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
	s.setSessionCookie(w, r, token)
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

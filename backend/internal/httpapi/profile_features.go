package httpapi

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/jackc/pgx/v5"
)

func envUploadDir() string {
	if value := os.Getenv("UPLOAD_DIR"); value != "" {
		return value
	}
	return "uploads"
}

func randomFileName(ext string) (string, error) {
	value := make([]byte, 16)
	if _, err := rand.Read(value); err != nil {
		return "", err
	}
	return hex.EncodeToString(value) + ext, nil
}

func (s *Server) setFeaturedAchievement(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireUser(w, r, "athlete")
	if !ok {
		return
	}
	var input struct {
		Code *string `json:"code"`
	}
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, 400, err.Error())
		return
	}
	code := ""
	if input.Code != nil {
		code = *input.Code
	}
	athlete, err := s.Rating.One(r.Context(), user.ID, time.Now().UTC())
	if err != nil {
		handleError(w, err)
		return
	}
	valid := code == ""
	for _, item := range athlete.Achievements {
		if item.Code == code {
			valid = true
			break
		}
	}
	if !valid {
		writeError(w, 400, "Выберите достижение из списка профиля")
		return
	}
	if _, err := s.DB.Exec(r.Context(), `UPDATE athletes SET featured_achievement_code=$2 WHERE user_id=$1`, user.ID, code); err != nil {
		handleError(w, err)
		return
	}
	updated, err := s.Rating.One(r.Context(), user.ID, time.Now().UTC())
	if err != nil {
		handleError(w, err)
		return
	}
	writeJSON(w, 200, updated)
}

func (s *Server) uploadAvatar(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireUser(w, r, "athlete")
	if !ok {
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, 5<<20)
	file, _, err := r.FormFile("avatar")
	if err != nil {
		writeError(w, 400, "Загрузите изображение до 5 МБ")
		return
	}
	defer file.Close()
	data, err := io.ReadAll(file)
	if err != nil {
		writeError(w, 400, "Не удалось прочитать изображение")
		return
	}
	mime := http.DetectContentType(data)
	ext := map[string]string{"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}[mime]
	if ext == "" || len(data) == 0 {
		writeError(w, 400, "Поддерживаются JPG, PNG и WebP")
		return
	}
	name, err := randomFileName(ext)
	if err != nil {
		handleError(w, err)
		return
	}
	path := filepath.Join(s.UploadDir, "avatars", name)
	if err := os.MkdirAll(filepath.Dir(path), 0750); err != nil {
		handleError(w, err)
		return
	}
	if err := os.WriteFile(path, data, 0640); err != nil {
		handleError(w, err)
		return
	}
	url := "/media/avatars/" + name
	var old string
	if err := s.DB.QueryRow(r.Context(), `SELECT avatar_url FROM athletes WHERE user_id=$1`, user.ID).Scan(&old); err != nil {
		_ = os.Remove(path)
		handleError(w, err)
		return
	}
	if _, err := s.DB.Exec(r.Context(), `UPDATE athletes SET avatar_url=$2 WHERE user_id=$1`, user.ID, url); err != nil {
		_ = os.Remove(path)
		handleError(w, err)
		return
	}
	removeStoredAvatar(s.UploadDir, old)
	writeJSON(w, 200, map[string]string{"avatar_url": url})
}

func (s *Server) deleteAvatar(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireUser(w, r, "athlete")
	if !ok {
		return
	}
	var old string
	_ = s.DB.QueryRow(r.Context(), `SELECT avatar_url FROM athletes WHERE user_id=$1`, user.ID).Scan(&old)
	_, err := s.DB.Exec(r.Context(), `UPDATE athletes SET avatar_url='' WHERE user_id=$1`, user.ID)
	if err != nil {
		handleError(w, err)
		return
	}
	removeStoredAvatar(s.UploadDir, old)
	writeJSON(w, 200, map[string]bool{"ok": true})
}

func removeStoredAvatar(uploadDir, url string) {
	if strings.HasPrefix(url, "/media/avatars/") {
		name := strings.TrimPrefix(url, "/media/avatars/")
		if filepath.Base(name) == name {
			_ = os.Remove(filepath.Join(uploadDir, "avatars", name))
		}
	}
}

func (s *Server) serveAvatar(w http.ResponseWriter, r *http.Request) {
	s.serveMedia(w, r, "avatars", r.PathValue("name"))
}
func (s *Server) serveDocument(w http.ResponseWriter, r *http.Request) {
	s.serveMedia(w, r, "documents", r.PathValue("name"))
}
func (s *Server) serveMedia(w http.ResponseWriter, r *http.Request, folder, name string) {
	if filepath.Base(name) != name || strings.Contains(name, "..") {
		http.NotFound(w, r)
		return
	}
	w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
	http.ServeFile(w, r, filepath.Join(s.UploadDir, folder, name))
}

type documentDTO struct {
	ID            int64     `json:"id"`
	CompetitionID *int64    `json:"competition_id"`
	Title         string    `json:"title"`
	URL           string    `json:"url"`
	FileSize      int64     `json:"file_size"`
	CreatedAt     time.Time `json:"created_at"`
}

func (s *Server) documents(w http.ResponseWriter, r *http.Request) { s.listDocuments(w, r, nil) }
func (s *Server) competitionDocuments(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r, "id")
	if err != nil {
		writeError(w, 400, err.Error())
		return
	}
	item, err := s.Competitions.Get(r.Context(), id)
	if err != nil {
		handleError(w, err)
		return
	}
	if item.Status == "draft" {
		user, userErr := s.currentUser(r)
		if userErr != nil || user.Role != "organizer" {
			writeError(w, 404, "Не найдено")
			return
		}
	}
	s.listDocuments(w, r, &id)
}
func (s *Server) listDocuments(w http.ResponseWriter, r *http.Request, competitionID *int64) {
	rows, err := s.DB.Query(r.Context(), `SELECT id,competition_id,title,storage_key,file_size,created_at FROM documents WHERE competition_id IS NOT DISTINCT FROM $1 ORDER BY created_at DESC`, competitionID)
	if err != nil {
		handleError(w, err)
		return
	}
	defer rows.Close()
	items := []documentDTO{}
	for rows.Next() {
		var item documentDTO
		var key string
		var created time.Time
		if err := rows.Scan(&item.ID, &item.CompetitionID, &item.Title, &key, &item.FileSize, &created); err != nil {
			handleError(w, err)
			return
		}
		item.URL = "/media/documents/" + key
		item.CreatedAt = created
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		handleError(w, err)
		return
	}
	writeJSON(w, 200, items)
}

func (s *Server) uploadDocument(w http.ResponseWriter, r *http.Request) {
	s.uploadDocumentFor(w, r, nil)
}
func (s *Server) uploadCompetitionDocument(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r, "id")
	if err != nil {
		writeError(w, 400, err.Error())
		return
	}
	s.uploadDocumentFor(w, r, &id)
}
func (s *Server) uploadDocumentFor(w http.ResponseWriter, r *http.Request, competitionID *int64) {
	user, ok := s.requireUser(w, r, "organizer")
	if !ok {
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, 20<<20)
	if err := r.ParseMultipartForm(20 << 20); err != nil {
		writeError(w, 400, "Файл должен быть не больше 20 МБ")
		return
	}
	title := strings.TrimSpace(r.FormValue("title"))
	if utf8.RuneCountInString(title) < 1 || utf8.RuneCountInString(title) > 160 {
		writeError(w, 400, "Укажите название документа")
		return
	}
	file, _, err := r.FormFile("file")
	if err != nil {
		writeError(w, 400, "Загрузите PDF-файл")
		return
	}
	defer file.Close()
	data, err := io.ReadAll(file)
	if err != nil {
		writeError(w, 400, "Не удалось прочитать файл")
		return
	}
	if len(data) < 5 || string(data[:5]) != "%PDF-" {
		writeError(w, 400, "Поддерживается формат PDF")
		return
	}
	name, err := randomFileName(".pdf")
	if err != nil {
		handleError(w, err)
		return
	}
	path := filepath.Join(s.UploadDir, "documents", name)
	if err := os.MkdirAll(filepath.Dir(path), 0750); err != nil {
		handleError(w, err)
		return
	}
	if err := os.WriteFile(path, data, 0640); err != nil {
		handleError(w, err)
		return
	}
	var item documentDTO
	item.CompetitionID = competitionID
	item.Title = title
	item.URL = "/media/documents/" + name
	item.FileSize = int64(len(data))
	err = s.DB.QueryRow(r.Context(), `INSERT INTO documents(competition_id,title,storage_key,media_type,file_size,created_by) VALUES($1,$2,$3,'application/pdf',$4,$5) RETURNING id,created_at`, competitionID, title, name, len(data), user.ID).Scan(&item.ID, &item.CreatedAt)
	if err != nil {
		_ = os.Remove(path)
		handleError(w, err)
		return
	}
	writeJSON(w, 201, item)
}

func (s *Server) deleteDocument(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.requireUser(w, r, "organizer"); !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		writeError(w, 400, err.Error())
		return
	}
	var key string
	err = s.DB.QueryRow(r.Context(), `DELETE FROM documents WHERE id=$1 RETURNING storage_key`, id).Scan(&key)
	if errors.Is(err, pgx.ErrNoRows) {
		writeError(w, 404, "Документ не найден")
		return
	}
	if err != nil {
		handleError(w, err)
		return
	}
	_ = os.Remove(filepath.Join(s.UploadDir, "documents", key))
	writeJSON(w, 200, map[string]bool{"deleted": true})
}

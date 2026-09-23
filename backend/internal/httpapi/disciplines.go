package httpapi

import (
	"net/http"
	"regexp"
	"strings"
	"unicode/utf8"

	"github.com/jackc/pgx/v5"
)

var disciplineCodePattern = regexp.MustCompile(`^[a-z][a-z0-9_]{1,31}$`)

func (s *Server) createDiscipline(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.requireUser(w, r, "organizer"); !ok {
		return
	}
	var input struct {
		Code string `json:"code"`
		Name string `json:"name"`
	}
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	input.Name = strings.TrimSpace(input.Name)
	if !disciplineCodePattern.MatchString(input.Code) || utf8.RuneCountInString(input.Name) < 3 || utf8.RuneCountInString(input.Name) > 120 {
		writeError(w, http.StatusBadRequest, "Проверьте код и название дисциплины")
		return
	}
	_, err := s.DB.Exec(r.Context(), `INSERT INTO disciplines (code,name,sort_order) VALUES ($1,$2,(SELECT COALESCE(MAX(sort_order),0)+1 FROM disciplines))`, input.Code, input.Name)
	if err != nil {
		handleError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, input)
}

func (s *Server) renameDiscipline(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.requireUser(w, r, "organizer"); !ok {
		return
	}
	var input struct {
		Name string `json:"name"`
	}
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	input.Name = strings.TrimSpace(input.Name)
	if utf8.RuneCountInString(input.Name) < 3 || utf8.RuneCountInString(input.Name) > 120 {
		writeError(w, http.StatusBadRequest, "Проверьте название дисциплины")
		return
	}
	command, err := s.DB.Exec(r.Context(), `UPDATE disciplines SET name=$2 WHERE code=$1`, r.PathValue("code"), input.Name)
	if err != nil {
		handleError(w, err)
		return
	}
	if command.RowsAffected() == 0 {
		handleError(w, pgx.ErrNoRows)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"code": r.PathValue("code"), "name": input.Name})
}

package httpapi

import (
	"net/http"
	"strings"

	"github.com/0himera/fsp-platform/internal/codeforces"
)

func (s *Server) getCodeforces(w http.ResponseWriter, r *http.Request) {
	competitionID, err := pathID(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	data, err := s.Codeforces.GetLinked(r.Context(), competitionID)
	if err != nil {
		handleError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, data)
}

func (s *Server) linkCodeforces(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.requireUser(w, r, "organizer"); !ok {
		return
	}
	competitionID, err := pathID(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	var input struct {
		ContestID int `json:"contest_id"`
	}
	if err := decodeJSON(r, &input); err != nil || input.ContestID <= 0 {
		writeError(w, http.StatusBadRequest, "Укажите корректный ID контеста Codeforces")
		return
	}
	if err := s.Codeforces.LinkContest(r.Context(), competitionID, input.ContestID); err != nil {
		handleError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"linked": true})
}

func (s *Server) importCodeforcesTasks(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.requireUser(w, r, "organizer"); !ok {
		return
	}
	competitionID, err := pathID(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	count, err := s.Codeforces.ImportTasks(r.Context(), competitionID)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Не удалось импортировать задачи с Codeforces: "+err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"imported": count})
}

func (s *Server) syncCodeforcesStandings(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.requireUser(w, r, "organizer"); !ok {
		return
	}
	competitionID, err := pathID(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	count, err := s.Codeforces.SyncStandings(r.Context(), competitionID)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Не удалось синхронизировать результаты: "+err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"synced": count})
}

func (s *Server) getCodeforcesUser(w http.ResponseWriter, r *http.Request) {
	handle := strings.TrimSpace(r.PathValue("handle"))
	if handle == "" {
		writeError(w, http.StatusBadRequest, "Укажите хэндл")
		return
	}
	user, err := codeforces.NewClient().FetchUser(r.Context(), handle)
	if err != nil {
		writeError(w, http.StatusNotFound, "Пользователь Codeforces не найден")
		return
	}
	writeJSON(w, http.StatusOK, user)
}

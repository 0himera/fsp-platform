package httpapi

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/0himera/fsp-platform/internal/rating"
	"time"
)

func (s *Server) athlete(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	a, err := s.Rating.One(r.Context(), id, time.Now().UTC())
	if err != nil {
		handleError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, a)
}

func (s *Server) rankings(w http.ResponseWriter, r *http.Request) {
	list, err := s.Rating.All(r.Context(), time.Now().UTC())
	if err != nil {
		handleError(w, err)
		return
	}
	query := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("q")))
	city := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("city")))
	discipline := r.URL.Query().Get("discipline")
	rank := r.URL.Query().Get("rank")
	filtered := make([]rating.Athlete, 0, len(list))
	for _, a := range list {
		if query != "" && !strings.Contains(strings.ToLower(a.FullName), query) {
			continue
		}
		if city != "" && !strings.Contains(strings.ToLower(a.City), city) {
			continue
		}
		if rank != "" && a.RankCode != rank {
			continue
		}
		if discipline != "" && !contains(a.Disciplines, discipline) {
			continue
		}
		filtered = append(filtered, a)
	}
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if page < 1 {
		page = 1
	}
	if limit < 0 || limit > 100 {
		limit = 0
	}
	total := len(filtered)
	if limit > 0 {
		start := total
		if page <= (total+limit-1)/limit {
			start = (page - 1) * limit
		}
		end := start + limit
		if end > total {
			end = total
		}
		filtered = filtered[start:end]
	}
	writeJSON(w, http.StatusOK, map[string]any{"athletes": filtered, "as_of": time.Now().UTC(), "total": total, "page": page, "page_size": limit})
}

func contains(values []string, value string) bool {
	for _, item := range values {
		if item == value {
			return true
		}
	}
	return false
}

func (s *Server) setRank(w http.ResponseWriter, r *http.Request) {
	organizer, ok := s.requireUser(w, r, "organizer")
	if !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	var input struct {
		RankCode string `json:"rank_code"`
	}
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	allowed := map[string]bool{"none": true, "III": true, "II": true, "I": true, "KMS": true, "MS": true, "MSMK": true, "ZMS": true}
	if !allowed[input.RankCode] {
		writeError(w, http.StatusBadRequest, "Неизвестный разряд")
		return
	}
	if err := s.Athletes.SetRank(r.Context(), id, input.RankCode, organizer.ID); err != nil {
		handleError(w, err)
		return
	}
	a, err := s.Rating.One(r.Context(), id, time.Now().UTC())
	if err != nil {
		handleError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, a)
}

func (s *Server) disciplines(w http.ResponseWriter, r *http.Request) {
	rows, err := s.DB.Query(r.Context(), `SELECT code,name FROM disciplines ORDER BY sort_order,code`)
	if err != nil {
		handleError(w, err)
		return
	}
	defer rows.Close()
	type discipline struct {
		Code string `json:"code"`
		Name string `json:"name"`
	}
	items := []discipline{}
	for rows.Next() {
		var item discipline
		if err := rows.Scan(&item.Code, &item.Name); err != nil {
			handleError(w, err)
			return
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		handleError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (s *Server) myRegistrations(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireUser(w, r, "athlete")
	if !ok {
		return
	}
	items, err := s.Competitions.MyRegistrations(r.Context(), user.ID)
	if err != nil {
		handleError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (s *Server) rankHistory(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	type rankChange struct {
		ID        int64     `json:"id"`
		OldRank   string    `json:"old_rank_code"`
		NewRank   string    `json:"new_rank_code"`
		ChangedBy int64     `json:"changed_by"`
		ChangedAt time.Time `json:"changed_at"`
	}
	rows, err := s.DB.Query(r.Context(),
		`SELECT id, old_rank_code, new_rank_code, changed_by, changed_at
		 FROM rank_changes WHERE athlete_id=$1 ORDER BY changed_at DESC`, id)
	if err != nil {
		handleError(w, err)
		return
	}
	defer rows.Close()
	history := []rankChange{}
	for rows.Next() {
		var rc rankChange
		if err := rows.Scan(&rc.ID, &rc.OldRank, &rc.NewRank, &rc.ChangedBy, &rc.ChangedAt); err != nil {
			handleError(w, err)
			return
		}
		history = append(history, rc)
	}
	if err := rows.Err(); err != nil {
		handleError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, history)
}

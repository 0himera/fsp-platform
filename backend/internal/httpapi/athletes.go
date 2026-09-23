package httpapi

import (
	"net/http"
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
	writeJSON(w, http.StatusOK, map[string]any{"athletes": list, "as_of": time.Now().UTC()})
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

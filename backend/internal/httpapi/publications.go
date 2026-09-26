package httpapi

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/0himera/fsp-platform/internal/competitions"
)

type publicationDTO struct {
	ID          int64                 `json:"id"`
	PublishedAt time.Time             `json:"published_at"`
	Publisher   string                `json:"publisher"`
	Results     []competitions.Result `json:"results,omitempty"`
}

func (s *Server) publications(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r, "id")
	if err != nil {
		writeError(w, 400, err.Error())
		return
	}
	rows, err := s.DB.Query(r.Context(), `SELECT p.id,p.published_at,COALESCE(a.full_name,u.email) FROM result_publications p JOIN users u ON u.id=p.published_by LEFT JOIN athletes a ON a.user_id=u.id WHERE p.competition_id=$1 ORDER BY p.published_at DESC`, id)
	if err != nil {
		handleError(w, err)
		return
	}
	defer rows.Close()
	items := []publicationDTO{}
	for rows.Next() {
		var item publicationDTO
		if err := rows.Scan(&item.ID, &item.PublishedAt, &item.Publisher); err != nil {
			handleError(w, err)
			return
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		handleError(w, err)
		return
	}
	writeJSON(w, 200, items)
}

func (s *Server) publication(w http.ResponseWriter, r *http.Request) {
	competitionID, err := pathID(r, "id")
	if err != nil {
		writeError(w, 400, err.Error())
		return
	}
	publicationID, err := strconv.ParseInt(r.PathValue("publication_id"), 10, 64)
	if err != nil || publicationID < 1 {
		writeError(w, 400, "Неверный идентификатор")
		return
	}
	var item publicationDTO
	var raw []byte
	err = s.DB.QueryRow(r.Context(), `SELECT p.id,p.published_at,COALESCE(a.full_name,u.email),p.protocol FROM result_publications p JOIN users u ON u.id=p.published_by LEFT JOIN athletes a ON a.user_id=u.id WHERE p.competition_id=$1 AND p.id=$2`, competitionID, publicationID).Scan(&item.ID, &item.PublishedAt, &item.Publisher, &raw)
	if err != nil {
		handleError(w, err)
		return
	}
	if err = json.Unmarshal(raw, &item.Results); err != nil {
		handleError(w, err)
		return
	}
	writeJSON(w, 200, item)
}

func (s *Server) restorePublication(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireUser(w, r, "organizer")
	if !ok {
		return
	}
	competitionID, err := pathID(r, "id")
	if err != nil {
		writeError(w, 400, err.Error())
		return
	}
	publicationID, err := strconv.ParseInt(r.PathValue("publication_id"), 10, 64)
	if err != nil || publicationID < 1 {
		writeError(w, 400, "Неверный идентификатор")
		return
	}
	var raw []byte
	if err := s.DB.QueryRow(r.Context(), `SELECT protocol FROM result_publications WHERE competition_id=$1 AND id=$2`, competitionID, publicationID).Scan(&raw); err != nil {
		handleError(w, err)
		return
	}
	var results []competitions.Result
	if err := json.Unmarshal(raw, &results); err != nil {
		handleError(w, err)
		return
	}
	if err := s.Competitions.PublishResults(r.Context(), competitionID, user.ID, results); err != nil {
		handleError(w, err)
		return
	}
	writeJSON(w, 200, map[string]bool{"restored": true})
}

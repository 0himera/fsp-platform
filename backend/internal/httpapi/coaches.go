package httpapi

import "net/http"

type staffDTO struct {
	UserID       int64  `json:"user_id"`
	FullName     string `json:"full_name"`
	Organization string `json:"organization"`
	City         string `json:"city"`
	Bio          string `json:"bio"`
	AvatarURL    string `json:"avatar_url"`
	Role         string `json:"role"`
}

func (s *Server) listCoaches(w http.ResponseWriter, r *http.Request) {
	rows, err := s.DB.Query(r.Context(),
		`SELECT sp.user_id, sp.full_name, sp.organization, sp.city, sp.bio, sp.avatar_url, u.role
		 FROM staff_profiles sp JOIN users u ON u.id=sp.user_id
		 WHERE u.role IN ('coach','judge') ORDER BY sp.full_name`)
	if err != nil {
		handleError(w, err)
		return
	}
	defer rows.Close()
	list := []staffDTO{}
	for rows.Next() {
		var d staffDTO
		if err := rows.Scan(&d.UserID, &d.FullName, &d.Organization, &d.City, &d.Bio, &d.AvatarURL, &d.Role); err != nil {
			handleError(w, err)
			return
		}
		list = append(list, d)
	}
	if err := rows.Err(); err != nil {
		handleError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, list)
}

func (s *Server) getCoach(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	var d staffDTO
	err = s.DB.QueryRow(r.Context(),
		`SELECT sp.user_id, sp.full_name, sp.organization, sp.city, sp.bio, sp.avatar_url, u.role
		 FROM staff_profiles sp JOIN users u ON u.id=sp.user_id
		 WHERE sp.user_id=$1`, id).
		Scan(&d.UserID, &d.FullName, &d.Organization, &d.City, &d.Bio, &d.AvatarURL, &d.Role)
	if err != nil {
		handleError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, d)
}

func (s *Server) athleteCoaches(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	rows, err := s.DB.Query(r.Context(),
		`SELECT sp.user_id, sp.full_name, sp.organization, sp.city, sp.bio, sp.avatar_url, u.role
		 FROM athlete_coaches ac
		 JOIN staff_profiles sp ON sp.user_id=ac.coach_id
		 JOIN users u ON u.id=sp.user_id
		 WHERE ac.athlete_id=$1 ORDER BY sp.full_name`, id)
	if err != nil {
		handleError(w, err)
		return
	}
	defer rows.Close()
	list := []staffDTO{}
	for rows.Next() {
		var d staffDTO
		if err := rows.Scan(&d.UserID, &d.FullName, &d.Organization, &d.City, &d.Bio, &d.AvatarURL, &d.Role); err != nil {
			handleError(w, err)
			return
		}
		list = append(list, d)
	}
	if err := rows.Err(); err != nil {
		handleError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, list)
}

type judgeDTO struct {
	UserID   int64  `json:"user_id"`
	FullName string `json:"full_name"`
	RoleNote string `json:"role_note"`
}

func (s *Server) competitionJudges(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	rows, err := s.DB.Query(r.Context(),
		`SELECT sp.user_id, sp.full_name, cj.role_note
		 FROM competition_judges cj
		 JOIN staff_profiles sp ON sp.user_id=cj.judge_id
		 WHERE cj.competition_id=$1 ORDER BY sp.full_name`, id)
	if err != nil {
		handleError(w, err)
		return
	}
	defer rows.Close()
	list := []judgeDTO{}
	for rows.Next() {
		var d judgeDTO
		if err := rows.Scan(&d.UserID, &d.FullName, &d.RoleNote); err != nil {
			handleError(w, err)
			return
		}
		list = append(list, d)
	}
	if err := rows.Err(); err != nil {
		handleError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, list)
}

func (s *Server) addCompetitionJudge(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.requireUser(w, r, "organizer"); !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	var input struct {
		JudgeID  int64  `json:"judge_id"`
		RoleNote string `json:"role_note"`
	}
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	_, err = s.DB.Exec(r.Context(),
		`INSERT INTO competition_judges(competition_id, judge_id, role_note) VALUES($1,$2,$3) ON CONFLICT DO NOTHING`,
		id, input.JudgeID, input.RoleNote)
	if err != nil {
		handleError(w, err)
		return
	}
	s.competitionJudges(w, r)
}

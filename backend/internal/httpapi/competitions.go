package httpapi

import (
	"net/http"

	"github.com/0himera/fsp-platform/internal/competitions"
)

func (s *Server) competitionList(w http.ResponseWriter, r *http.Request) {
	list, err := s.Competitions.List(r.Context(), r.URL.Query().Get("status"), r.URL.Query().Get("q"))
	if err != nil {
		handleError(w, err)
		return
	}
	if user, err := s.currentUser(r); err != nil || user.Role != "organizer" {
		visible := list[:0]
		for _, item := range list {
			if item.Status != "draft" {
				visible = append(visible, item)
			}
		}
		list = visible
	}
	writeJSON(w, http.StatusOK, list)
}

func (s *Server) competitionDetail(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	competition, err := s.Competitions.Get(r.Context(), id)
	if err != nil {
		handleError(w, err)
		return
	}
	if competition.Status == "draft" {
		user, err := s.currentUser(r)
		if err != nil || user.Role != "organizer" {
			writeError(w, http.StatusNotFound, "Не найдено")
			return
		}
	}
	registrations, err := s.Competitions.Registrations(r.Context(), id)
	if err != nil {
		handleError(w, err)
		return
	}
	teams, err := s.Competitions.Teams(r.Context(), id)
	if err != nil {
		handleError(w, err)
		return
	}
	results, err := s.Competitions.Results(r.Context(), id)
	if err != nil {
		handleError(w, err)
		return
	}
	registered := false
	if user, err := s.currentUser(r); err == nil && user.Role == "athlete" {
		for _, registration := range registrations {
			if registration.AthleteID == user.ID {
				registered = true
				break
			}
		}
	}
	writeJSON(w, http.StatusOK, map[string]any{"competition": competition, "registrations": registrations, "teams": teams, "results": results, "registered": registered})
}

func (s *Server) createCompetition(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireUser(w, r, "organizer")
	if !ok {
		return
	}
	var input competitions.Input
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	item, err := s.Competitions.Create(r.Context(), input, user.ID)
	if err != nil {
		handleError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, item)
}

func (s *Server) updateCompetition(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.requireUser(w, r, "organizer"); !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	var input competitions.Input
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	item, err := s.Competitions.Update(r.Context(), id, input)
	if err != nil {
		handleError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (s *Server) registerCompetition(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireUser(w, r, "athlete")
	if !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	if err := s.Competitions.Register(r.Context(), id, user.ID); err != nil {
		handleError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]bool{"registered": true})
}

func (s *Server) unregisterCompetition(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireUser(w, r, "athlete")
	if !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	if err := s.Competitions.Unregister(r.Context(), id, user.ID); err != nil {
		handleError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"registered": false})
}

func (s *Server) createTeam(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.requireUser(w, r, "organizer"); !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	var input struct {
		Name      string  `json:"name"`
		MemberIDs []int64 `json:"member_ids"`
	}
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	team, err := s.Competitions.CreateTeam(r.Context(), id, input.Name, input.MemberIDs)
	if err != nil {
		handleError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, team)
}

func (s *Server) deleteTeam(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.requireUser(w, r, "organizer"); !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	teamID, err := pathID(r, "team_id")
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	if err := s.Competitions.DeleteTeam(r.Context(), id, teamID); err != nil {
		handleError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"deleted": true})
}

func (s *Server) publishResults(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireUser(w, r, "organizer")
	if !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	var input struct {
		Results []competitions.Result `json:"results"`
	}
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	if err := s.Competitions.PublishResults(r.Context(), id, user.ID, input.Results); err != nil {
		handleError(w, err)
		return
	}
	s.competitionDetail(w, r)
}

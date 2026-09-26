package httpapi

import (
	"net/http"
	"net/url"
	"time"

	"github.com/0himera/fsp-platform/internal/competitions"
	"github.com/0himera/fsp-platform/internal/rating"
)

type publicTeamMember struct {
	AthleteID           int64  `json:"athlete_id"`
	FullName            string `json:"full_name"`
	AvatarURL           string `json:"avatar_url"`
	FeaturedAchievement any    `json:"featured_achievement"`
}

type publicTeam struct {
	CompetitionID int64              `json:"competition_id"`
	ID            int64              `json:"id"`
	Name          string             `json:"name"`
	Description   string             `json:"description"`
	CaptainID     int64              `json:"captain_id"`
	Members       []publicTeamMember `json:"members"`
}

func (s *Server) competitionList(w http.ResponseWriter, r *http.Request) {
	list, err := s.Competitions.List(r.Context(), r.URL.Query().Get("status"), r.URL.Query().Get("phase"), r.URL.Query().Get("q"))
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
	user, authErr := s.currentUser(r)
	signedIn := authErr == nil
	organizer := signedIn && user.Role == "organizer"
	registrations := []competitions.Registration{}
	var teams any = []publicTeam{}
	if organizer {
		registrations, err = s.Competitions.Registrations(r.Context(), id)
		if err != nil {
			handleError(w, err)
			return
		}
		teams, err = s.Competitions.Teams(r.Context(), id)
		if err != nil {
			handleError(w, err)
			return
		}
	} else if competition.Format == "team" {
		privateTeams, teamErr := s.Competitions.Teams(r.Context(), id)
		if teamErr != nil {
			handleError(w, teamErr)
			return
		}
		all, ratingErr := s.Rating.All(r.Context(), time.Now().UTC())
		if ratingErr != nil {
			handleError(w, ratingErr)
			return
		}
		byID := make(map[int64]rating.Athlete, len(all))
		for _, athlete := range all {
			byID[athlete.ID] = athlete
		}
		publicTeams := make([]publicTeam, 0, len(privateTeams))
		for _, team := range privateTeams {
			item := publicTeam{CompetitionID: team.CompetitionID, ID: team.ID, Name: team.Name, Description: team.Description, CaptainID: team.CaptainID, Members: []publicTeamMember{}}
			for _, member := range team.Members {
				athlete := byID[member.AthleteID]
				item.Members = append(item.Members, publicTeamMember{AthleteID: member.AthleteID, FullName: member.FullName, AvatarURL: athlete.AvatarURL, FeaturedAchievement: athlete.FeaturedAchievement})
			}
			publicTeams = append(publicTeams, item)
		}
		teams = publicTeams
	}
	results, err := s.Competitions.Results(r.Context(), id)
	if err != nil {
		handleError(w, err)
		return
	}
	registered := false
	if signedIn && user.Role == "athlete" {
		_ = s.DB.QueryRow(r.Context(), `SELECT EXISTS(SELECT 1 FROM registrations WHERE competition_id=$1 AND athlete_id=$2)`, id, user.ID).Scan(&registered)
	}
	writeJSON(w, http.StatusOK, map[string]any{"competition": competition, "registrations": registrations, "teams": teams, "results": results, "registered": registered})
}

func (s *Server) competitionParticipants(w http.ResponseWriter, r *http.Request) {
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
		writeError(w, 404, "Не найдено")
		return
	}
	list, err := s.Competitions.Registrations(r.Context(), id)
	if err != nil {
		handleError(w, err)
		return
	}
	all, err := s.Rating.All(r.Context(), time.Now().UTC())
	if err != nil {
		handleError(w, err)
		return
	}
	byID := make(map[int64]any, len(all))
	for _, a := range all {
		byID[a.ID] = a.FeaturedAchievement
	}
	participants := make([]map[string]any, 0, len(list))
	for _, item := range list {
		participants = append(participants, map[string]any{"athlete_id": item.AthleteID, "full_name": item.FullName, "avatar_url": item.AvatarURL, "featured_achievement": byID[item.AthleteID]})
	}
	writeJSON(w, 200, participants)
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
	user, ok := s.requireUser(w, r, "athlete")
	if !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	var input struct {
		Name        string `json:"name"`
		Description string `json:"description"`
	}
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	team, token, err := s.Competitions.CreateCaptainTeam(r.Context(), id, user.ID, input.Name, input.Description)
	if err != nil {
		handleError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"team": team, "invite_url": s.teamInviteURL(token)})
}

func (s *Server) updateTeam(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireUser(w, r, "athlete")
	if !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		writeError(w, 400, err.Error())
		return
	}
	teamID, err := pathID(r, "team_id")
	if err != nil {
		writeError(w, 400, err.Error())
		return
	}
	var input struct {
		Name        string `json:"name"`
		Description string `json:"description"`
	}
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, 400, err.Error())
		return
	}
	team, err := s.Competitions.UpdateTeam(r.Context(), id, teamID, user.ID, input.Name, input.Description)
	if err != nil {
		handleError(w, err)
		return
	}
	writeJSON(w, 200, team)
}

func (s *Server) deleteTeam(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireUser(w, r, "athlete")
	if !ok {
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
	if err := s.Competitions.DeleteTeam(r.Context(), id, teamID, user.ID); err != nil {
		handleError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"deleted": true})
}

func (s *Server) teamInviteURL(token string) string {
	return s.PublicURL + "/teams/join?token=" + url.QueryEscape(token)
}

func (s *Server) createTeamInviteLink(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireUser(w, r, "athlete")
	if !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		writeError(w, 400, err.Error())
		return
	}
	teamID, err := pathID(r, "team_id")
	if err != nil {
		writeError(w, 400, err.Error())
		return
	}
	token, err := s.Competitions.NewTeamInviteLink(r.Context(), id, teamID, user.ID)
	if err != nil {
		handleError(w, err)
		return
	}
	writeJSON(w, 200, map[string]string{"invite_url": s.teamInviteURL(token)})
}

func (s *Server) createTeamEmailInvites(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireUser(w, r, "athlete")
	if !ok {
		return
	}
	if s.Mailer == nil {
		writeError(w, 503, "Отправка приглашений по почте недоступна")
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		writeError(w, 400, err.Error())
		return
	}
	teamID, err := pathID(r, "team_id")
	if err != nil {
		writeError(w, 400, err.Error())
		return
	}
	var input struct {
		Emails []string `json:"emails"`
	}
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, 400, err.Error())
		return
	}
	for _, email := range input.Emails {
		if !validEmail(email) {
			writeError(w, 400, "Проверьте адреса электронной почты")
			return
		}
	}
	invites, err := s.Competitions.CreateEmailInvites(r.Context(), id, teamID, user.ID, input.Emails)
	if err != nil {
		handleError(w, err)
		return
	}
	sent := []string{}
	failed := []string{}
	for _, invite := range invites {
		body := "Вас пригласили в команду. Откройте ссылку, чтобы вступить:\n" + s.teamInviteURL(invite.Token)
		if err := s.Mailer.Send(r.Context(), invite.Email, "Приглашение в команду · Арена ФСП РД", body); err != nil {
			failed = append(failed, invite.Email)
		} else {
			sent = append(sent, invite.Email)
		}
	}
	writeJSON(w, 202, map[string]any{"sent": sent, "failed": failed})
}

func (s *Server) acceptTeamInvite(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireUser(w, r, "athlete")
	if !ok {
		return
	}
	token := r.PathValue("token")
	if len(token) < 30 || len(token) > 200 {
		writeError(w, 400, "Неверная ссылка-приглашение")
		return
	}
	team, err := s.Competitions.AcceptTeamInvite(r.Context(), token, user.ID, user.Email)
	if err != nil {
		handleError(w, err)
		return
	}
	writeJSON(w, 200, map[string]any{"team": team, "joined": true})
}

func (s *Server) removeTeamMember(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireUser(w, r, "athlete")
	if !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		writeError(w, 400, err.Error())
		return
	}
	teamID, err := pathID(r, "team_id")
	if err != nil {
		writeError(w, 400, err.Error())
		return
	}
	athleteID, err := pathID(r, "athlete_id")
	if err != nil {
		writeError(w, 400, err.Error())
		return
	}
	if err := s.Competitions.RemoveTeamMember(r.Context(), id, teamID, user.ID, athleteID); err != nil {
		handleError(w, err)
		return
	}
	writeJSON(w, 200, map[string]bool{"removed": true})
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

// exportCompetition отдаёт полный дамп соревнования (метаданные + участники + результаты)
// для интеграции сторонних площадок проведения.
// Доступ — Bearer-токен через заголовок Authorization.
func (s *Server) exportCompetition(w http.ResponseWriter, r *http.Request) {
	if s.ExportToken == "" {
		writeError(w, http.StatusServiceUnavailable, "Export API не настроен")
		return
	}
	auth := r.Header.Get("Authorization")
	const prefix = "Bearer "
	if len(auth) <= len(prefix) || auth[:len(prefix)] != prefix || auth[len(prefix):] != s.ExportToken {
		w.Header().Set("WWW-Authenticate", `Bearer realm="fsp-export"`)
		writeError(w, http.StatusUnauthorized, "Неверный или отсутствующий API-токен")
		return
	}
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
	registrations, err := s.Competitions.Registrations(r.Context(), id)
	if err != nil {
		handleError(w, err)
		return
	}
	results, err := s.Competitions.Results(r.Context(), id)
	if err != nil {
		handleError(w, err)
		return
	}
	teams, err := s.Competitions.Teams(r.Context(), id)
	if err != nil {
		handleError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"competition":   competition,
		"registrations": registrations,
		"teams":         teams,
		"results":       results,
	})
}


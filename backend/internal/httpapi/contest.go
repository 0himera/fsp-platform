package httpapi

import (
	"bytes"
	"context"
	"crypto/subtle"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/0himera/fsp-platform/internal/competitions"

	"github.com/0himera/fsp-platform/internal/contest"
)

func (s *Server) createContest(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.requireUser(w, r, "organizer"); !ok {
		return
	}
	competitionID, err := pathID(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	var input struct {
		Mode         string `json:"mode"`
		Instructions string `json:"instructions"`
	}
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	item, err := s.Contests.Create(r.Context(), competitionID, input.Mode, input.Instructions)
	if err != nil {
		handleContestError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, item)
}

func (s *Server) getContest(w http.ResponseWriter, r *http.Request) {
	competitionID, err := pathID(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	competition, err := s.Competitions.Get(r.Context(), competitionID)
	if err != nil {
		handleError(w, err)
		return
	}
	user, authErr := s.currentUser(r)
	organizer := authErr == nil && user.Role == "organizer"
	if competition.Status == "draft" && !organizer {
		writeError(w, http.StatusNotFound, "Не найдено")
		return
	}
	item, err := s.Contests.Get(r.Context(), competitionID, organizer)
	if err != nil {
		handleContestError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (s *Server) createContestTask(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.requireUser(w, r, "organizer"); !ok {
		return
	}
	competitionID, err := pathID(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	var input contest.TaskInput
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	item, err := s.Contests.Get(r.Context(), competitionID, true)
	if err != nil {
		handleContestError(w, err)
		return
	}
	task, err := s.Contests.AddTask(r.Context(), competitionID, item.Mode, input)
	if err != nil {
		handleContestError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, task)
}

func (s *Server) submitContestCode(w http.ResponseWriter, r *http.Request) {
	athlete, ok := s.requireUser(w, r, "athlete")
	if !ok {
		return
	}
	competitionID, err := pathID(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	taskID, err := pathID(r, "task_id")
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	var input struct {
		Language   string `json:"language"`
		SourceCode string `json:"source_code"`
	}
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	item, err := s.Contests.SubmitCode(r.Context(), competitionID, taskID, athlete.ID, input.Language, input.SourceCode)
	if err != nil {
		handleContestError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, item)
}

func (s *Server) submitContestCSV(w http.ResponseWriter, r *http.Request) {
	athlete, ok := s.requireUser(w, r, "athlete")
	if !ok {
		return
	}
	competitionID, err := pathID(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	taskID, err := pathID(r, "task_id")
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, (2<<20)+(64<<10))
	file, header, err := r.FormFile("file")
	if err != nil {
		writeError(w, http.StatusBadRequest, "Загрузите CSV-файл в поле file")
		return
	}
	defer file.Close()
	content, err := io.ReadAll(io.LimitReader(file, (2<<20)+1))
	if err != nil || len(content) > 2<<20 {
		writeError(w, http.StatusBadRequest, "CSV-файл не должен превышать 2 МБ")
		return
	}
	item, err := s.Contests.SubmitCSV(r.Context(), competitionID, taskID, athlete.ID, header.Filename, content)
	if err != nil {
		handleContestError(w, err)
		return
	}
	writeJSON(w, http.StatusAccepted, item)
}

func (s *Server) listContestSubmissions(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireUser(w, r, "")
	if !ok {
		return
	}
	if user.Role != "athlete" && user.Role != "organizer" {
		writeError(w, http.StatusForbidden, "Недостаточно прав")
		return
	}
	competitionID, err := pathID(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	items, err := s.Contests.Submissions(r.Context(), competitionID, user.ID, user.Role == "organizer")
	if err != nil {
		handleContestError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (s *Server) reviewContestSubmission(w http.ResponseWriter, r *http.Request) {
	organizer, ok := s.requireUser(w, r, "organizer")
	if !ok {
		return
	}
	competitionID, err := pathID(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	submissionID, err := pathID(r, "submission_id")
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	var input struct {
		Score    float64 `json:"score"`
		Feedback string  `json:"feedback"`
	}
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	if err := s.Contests.Review(r.Context(), competitionID, submissionID, organizer.ID, input.Score, input.Feedback); err != nil {
		handleContestError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"reviewed": true})
}

func (s *Server) contestLeaderboard(w http.ResponseWriter, r *http.Request) {
	competitionID, err := pathID(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	items, err := s.Contests.Leaderboard(r.Context(), competitionID)
	if err != nil {
		handleContestError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (s *Server) finalizeContest(w http.ResponseWriter, r *http.Request) {
	organizer, ok := s.requireUser(w, r, "organizer")
	if !ok {
		return
	}
	competitionID, err := pathID(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	item, err := s.Contests.Get(r.Context(), competitionID, true)
	if err != nil {
		handleContestError(w, err)
		return
	}
	if item.Finalized {
		writeJSON(w, http.StatusOK, map[string]bool{"finalized": true})
		return
	}
	force := r.URL.Query().Get("force") == "true" || r.URL.Query().Get("force") == "1"
	if force {
		now := time.Now().UTC()
		_, _ = s.DB.Exec(r.Context(), `UPDATE competitions SET ends_at=LEAST(ends_at,$2), registration_deadline=LEAST(registration_deadline,$2), updated_at=now() WHERE id=$1`, competitionID, now)
		_, _ = s.DB.Exec(r.Context(), `UPDATE contest_submissions SET status='graded', score=COALESCE(score,0), automatic_score=COALESCE(automatic_score,0), verdict=CASE WHEN verdict='' THEN 'Завершено досрочно' ELSE verdict END WHERE competition_id=$1 AND status IN ('submitted','queued','checking')`, competitionID)
	}
	results, err := s.Contests.BuildProtocol(r.Context(), competitionID)
	if err != nil {
		handleContestError(w, err)
		return
	}
	if err := s.publishContestResults(r.Context(), competitionID, organizer.ID, results, force); err != nil {
		if s.PlatformInternalURL != "" {
			slog.Error("contest result publication failed", "competition_id", competitionID, "error", err)
			writeError(w, http.StatusBadGateway, "Не удалось передать протокол платформе")
		} else {
			handleError(w, err)
		}
		return
	}
	if err := s.Contests.MarkFinalized(r.Context(), competitionID); err != nil {
		handleContestError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"finalized": true})
}

func (s *Server) publishContestResults(ctx context.Context, competitionID, organizerID int64, results []competitions.Result, force bool) error {
	if s.PlatformInternalURL == "" {
		if force {
			now := time.Now().UTC()
			if _, err := s.DB.Exec(ctx, `UPDATE competitions SET ends_at=LEAST(ends_at,$2), registration_deadline=LEAST(registration_deadline,$2), updated_at=now() WHERE id=$1`, competitionID, now); err != nil {
				return err
			}
		}
		return s.Competitions.PublishResults(ctx, competitionID, organizerID, results)
	}
	if s.ContestResultsToken == "" {
		return errors.New("contest result API token is not configured")
	}
	body, err := json.Marshal(map[string]any{"results": results})
	if err != nil {
		return err
	}
	endpoint := strings.TrimRight(s.PlatformInternalURL, "/") + "/internal/competitions/" + strconv.FormatInt(competitionID, 10) + "/results"
	if force {
		endpoint += "?force=true"
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.ContestResultsToken)
	req.Header.Set("X-Arena-Publisher-ID", strconv.FormatInt(organizerID, 10))
	response, err := (&http.Client{Timeout: 20 * time.Second}).Do(req)
	if err != nil {
		return err
	}
	defer response.Body.Close()
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		message, _ := io.ReadAll(io.LimitReader(response.Body, 4096))
		return errors.New("platform result API returned " + response.Status + ": " + strings.TrimSpace(string(message)))
	}
	return nil
}

func (s *Server) publishContestResultsInternal(w http.ResponseWriter, r *http.Request) {
	if s.ContestResultsToken == "" {
		writeError(w, http.StatusServiceUnavailable, "Contest results API token is not configured")
		return
	}
	const prefix = "Bearer "
	authorization := r.Header.Get("Authorization")
	if !strings.HasPrefix(authorization, prefix) || subtle.ConstantTimeCompare([]byte(strings.TrimPrefix(authorization, prefix)), []byte(s.ContestResultsToken)) != 1 {
		writeError(w, http.StatusUnauthorized, "Неверный токен интеграции")
		return
	}
	competitionID, err := pathID(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	force := r.URL.Query().Get("force") == "true" || r.URL.Query().Get("force") == "1"
	if force {
		now := time.Now().UTC()
		if _, err := s.DB.Exec(r.Context(), `UPDATE competitions SET ends_at=LEAST(ends_at,$2), registration_deadline=LEAST(registration_deadline,$2), updated_at=now() WHERE id=$1`, competitionID, now); err != nil {
			handleError(w, err)
			return
		}
	}
	publisherID, err := strconv.ParseInt(r.Header.Get("X-Arena-Publisher-ID"), 10, 64)
	if err != nil || publisherID < 1 {
		writeError(w, http.StatusBadRequest, "Не указан организатор публикации")
		return
	}
	var organizer bool
	if err := s.DB.QueryRow(r.Context(), `SELECT EXISTS(SELECT 1 FROM users WHERE id=$1 AND role='organizer')`, publisherID).Scan(&organizer); err != nil {
		handleError(w, err)
		return
	}
	if !organizer {
		writeError(w, http.StatusForbidden, "Публикатор не является организатором")
		return
	}
	var input struct {
		Results []competitions.Result `json:"results"`
	}
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	if err := s.Competitions.PublishResults(r.Context(), competitionID, publisherID, input.Results); err != nil {
		handleError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"published": true})
}

func handleContestError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, contest.ErrNotFound):
		writeError(w, http.StatusNotFound, "Контест не найден")
	case errors.Is(err, contest.ErrConflict):
		writeError(w, http.StatusConflict, "Контест уже создан")
	case errors.Is(err, contest.ErrNotJoined):
		writeError(w, http.StatusForbidden, "Сначала подайте заявку на соревнование")
	case errors.Is(err, contest.ErrClosed):
		writeError(w, http.StatusConflict, "Контест закрыт или действие недоступно")
	case errors.Is(err, contest.ErrNotReady):
		writeError(w, http.StatusConflict, "Сначала дождитесь автоматической проверки CSV и оцените все решения")
	case errors.Is(err, contest.ErrInvalid):
		writeError(w, http.StatusBadRequest, "Проверьте поля задания и формат отправки")
	default:
		if strings.Contains(strings.ToLower(err.Error()), "duplicate key") {
			writeError(w, http.StatusConflict, "Такое задание уже существует")
			return
		}
		handleError(w, err)
	}
}

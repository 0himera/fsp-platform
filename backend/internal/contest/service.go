package contest

import (
	"context"
	"encoding/csv"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math"
	"path/filepath"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/0himera/fsp-platform/internal/competitions"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrNotFound  = errors.New("contest not found")
	ErrConflict  = errors.New("contest already exists or is finalized")
	ErrInvalid   = errors.New("invalid contest data")
	ErrClosed    = errors.New("contest is not accepting changes or submissions")
	ErrNotReady  = errors.New("contest has unfinished submissions")
	ErrNotJoined = errors.New("athlete is not registered for this competition")
)

const maxCSVBytes = 2 << 20
const maxSourceBytes = 128 << 10

type Service struct{ DB *pgxpool.Pool }

type Contest struct {
	CompetitionID int64  `json:"competition_id"`
	Mode          string `json:"mode"`
	Instructions  string `json:"instructions"`
	Finalized     bool   `json:"finalized"`
	Tasks         []Task `json:"tasks"`
}

type Task struct {
	ID        int64   `json:"id"`
	Title     string  `json:"title"`
	Statement string  `json:"statement"`
	MaxPoints float64 `json:"max_points"`
	Position  int     `json:"position"`
	PublicCSV string  `json:"public_csv,omitempty"`
}

type TaskInput struct {
	Title          string            `json:"title"`
	Statement      string            `json:"statement"`
	MaxPoints      float64           `json:"max_points"`
	Position       int               `json:"position"`
	PublicCSV      string            `json:"public_csv,omitempty"`
	ExpectedLabels map[string]string `json:"expected_labels,omitempty"`
	PositiveLabel  string            `json:"positive_label,omitempty"`
}

type Submission struct {
	ID             int64      `json:"id"`
	TaskID         int64      `json:"task_id"`
	TaskTitle      string     `json:"task_title"`
	AthleteID      int64      `json:"athlete_id"`
	AthleteName    string     `json:"athlete_name,omitempty"`
	Language       string     `json:"language,omitempty"`
	SourceCode     string     `json:"source_code,omitempty"`
	FileName       string     `json:"file_name,omitempty"`
	FileContent    string     `json:"file_content,omitempty"`
	Status         string     `json:"status"`
	AutomaticScore *float64   `json:"automatic_score,omitempty"`
	Score          *float64   `json:"score,omitempty"`
	Verdict        string     `json:"verdict"`
	Feedback       string     `json:"feedback"`
	SubmittedAt    time.Time  `json:"submitted_at"`
	ReviewedAt     *time.Time `json:"reviewed_at,omitempty"`
}

type Leader struct {
	AthleteID int64   `json:"athlete_id"`
	FullName  string  `json:"full_name"`
	Place     int     `json:"place"`
	Score     float64 `json:"score"`
	MaxScore  float64 `json:"max_score"`
}

func (s Service) Create(ctx context.Context, competitionID int64, mode, instructions string) (Contest, error) {
	if mode != "algorithm" && mode != "csv_metric" || utf8.RuneCountInString(instructions) > 3000 {
		return Contest{}, ErrInvalid
	}
	var format, status string
	var startsAt, endsAt time.Time
	err := s.DB.QueryRow(ctx, `SELECT format,status,starts_at,ends_at FROM competitions WHERE id=$1`, competitionID).Scan(&format, &status, &startsAt, &endsAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return Contest{}, ErrNotFound
	}
	if err != nil {
		return Contest{}, err
	}
	if format != "individual" || status == "completed" || !startsAt.After(time.Now()) || !endsAt.After(time.Now()) {
		return Contest{}, ErrInvalid
	}
	_, err = s.DB.Exec(ctx, `INSERT INTO contests(competition_id,mode,instructions) VALUES($1,$2,$3)`, competitionID, mode, strings.TrimSpace(instructions))
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) {
			if pgErr.Code == "23505" {
				return Contest{}, ErrConflict
			}
		}
		return Contest{}, err
	}
	return s.Get(ctx, competitionID, true)
}

func (s Service) Get(ctx context.Context, competitionID int64, organizer bool) (Contest, error) {
	var item Contest
	var finalizedAt *time.Time
	err := s.DB.QueryRow(ctx, `SELECT competition_id,mode,instructions,finalized_at FROM contests WHERE competition_id=$1`, competitionID).
		Scan(&item.CompetitionID, &item.Mode, &item.Instructions, &finalizedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return Contest{}, ErrNotFound
	}
	if err != nil {
		return Contest{}, err
	}
	item.Finalized = finalizedAt != nil
	item.Tasks = []Task{}
	var startsAt time.Time
	if err := s.DB.QueryRow(ctx, `SELECT starts_at FROM competitions WHERE id=$1`, competitionID).Scan(&startsAt); err != nil {
		return Contest{}, err
	}
	if organizer || !time.Now().Before(startsAt) {
		rows, err := s.DB.Query(ctx, `SELECT id,title,statement,max_points,position,public_csv FROM contest_tasks WHERE competition_id=$1 ORDER BY position,id`, competitionID)
		if err != nil {
			return Contest{}, err
		}
		defer rows.Close()
		for rows.Next() {
			var task Task
			if err := rows.Scan(&task.ID, &task.Title, &task.Statement, &task.MaxPoints, &task.Position, &task.PublicCSV); err != nil {
				return Contest{}, err
			}
			item.Tasks = append(item.Tasks, task)
		}
		if err := rows.Err(); err != nil {
			return Contest{}, err
		}
	}
	return item, nil
}

func (s Service) AddTask(ctx context.Context, competitionID int64, mode string, input TaskInput) (Task, error) {
	input.Title = strings.TrimSpace(input.Title)
	input.Statement = strings.TrimSpace(input.Statement)
	if utf8.RuneCountInString(input.Title) < 1 || utf8.RuneCountInString(input.Title) > 160 || utf8.RuneCountInString(input.Statement) < 1 || utf8.RuneCountInString(input.Statement) > 12000 || len(input.PublicCSV) > 100<<10 || input.MaxPoints <= 0 || input.MaxPoints > 100000 || math.IsNaN(input.MaxPoints) || math.IsInf(input.MaxPoints, 0) {
		return Task{}, ErrInvalid
	}
	if mode == "csv_metric" {
		if len(input.ExpectedLabels) == 0 || len(input.ExpectedLabels) > 100000 || !validPublicCSV(input.PublicCSV, input.ExpectedLabels) {
			return Task{}, ErrInvalid
		}
		for id, label := range input.ExpectedLabels {
			if strings.TrimSpace(id) == "" || (label != "0" && label != "1") {
				return Task{}, ErrInvalid
			}
		}
		if input.PositiveLabel == "" {
			input.PositiveLabel = "1"
		}
		if input.PositiveLabel != "0" && input.PositiveLabel != "1" {
			return Task{}, ErrInvalid
		}
	} else if mode != "algorithm" {
		return Task{}, ErrInvalid
	}
	var startsAt time.Time
	var finalizedAt *time.Time
	err := s.DB.QueryRow(ctx, `SELECT c.starts_at,x.finalized_at FROM competitions c JOIN contests x ON x.competition_id=c.id WHERE c.id=$1`, competitionID).Scan(&startsAt, &finalizedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return Task{}, ErrNotFound
	}
	if err != nil {
		return Task{}, err
	}
	if finalizedAt != nil || !startsAt.After(time.Now()) {
		return Task{}, ErrClosed
	}
	if input.Position < 1 {
		if err := s.DB.QueryRow(ctx, `SELECT COALESCE(max(position),0)+1 FROM contest_tasks WHERE competition_id=$1`, competitionID).Scan(&input.Position); err != nil {
			return Task{}, err
		}
	}
	labels, err := json.Marshal(input.ExpectedLabels)
	if err != nil {
		return Task{}, err
	}
	var task Task
	err = s.DB.QueryRow(ctx, `INSERT INTO contest_tasks(competition_id,title,statement,max_points,position,public_csv,expected_labels,positive_label)
		VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id,title,statement,max_points,position,public_csv`, competitionID, input.Title, input.Statement, input.MaxPoints, input.Position, input.PublicCSV, labels, input.PositiveLabel).
		Scan(&task.ID, &task.Title, &task.Statement, &task.MaxPoints, &task.Position, &task.PublicCSV)
	return task, err
}

func validPublicCSV(content string, expected map[string]string) bool {
	reader := csv.NewReader(strings.NewReader(content))
	header, err := reader.Read()
	if err != nil || len(header) < 2 || strings.TrimSpace(strings.ToLower(header[0])) != "id" {
		return false
	}
	reader.FieldsPerRecord = len(header)
	seen := make(map[string]bool, len(expected))
	for {
		row, err := reader.Read()
		if errors.Is(err, io.EOF) {
			break
		}
		if err != nil {
			return false
		}
		id := strings.TrimSpace(row[0])
		if _, ok := expected[id]; !ok || id == "" || seen[id] {
			return false
		}
		seen[id] = true
	}
	return len(seen) == len(expected)
}

func (s Service) canSubmit(ctx context.Context, competitionID, athleteID, taskID int64, expectedMode string) error {
	var mode, status string
	var startsAt, endsAt time.Time
	var finalizedAt *time.Time
	err := s.DB.QueryRow(ctx, `SELECT x.mode,c.status,c.starts_at,c.ends_at,x.finalized_at FROM contests x JOIN competitions c ON c.id=x.competition_id WHERE x.competition_id=$1`, competitionID).
		Scan(&mode, &status, &startsAt, &endsAt, &finalizedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrNotFound
	}
	if err != nil {
		return err
	}
	if mode != expectedMode {
		return ErrInvalid
	}
	if status == "draft" || status == "completed" || finalizedAt != nil || time.Now().Before(startsAt) || !time.Now().Before(endsAt) {
		return ErrClosed
	}
	var valid bool
	if err := s.DB.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM registrations WHERE competition_id=$1 AND athlete_id=$2) AND EXISTS(SELECT 1 FROM contest_tasks WHERE competition_id=$1 AND id=$3)`, competitionID, athleteID, taskID).Scan(&valid); err != nil {
		return err
	}
	if !valid {
		return ErrNotJoined
	}
	return nil
}

func (s Service) SubmitCode(ctx context.Context, competitionID, taskID, athleteID int64, language, source string) (Submission, error) {
	allowedLanguages := map[string]bool{"cpp": true, "python": true, "go": true, "java": true, "javascript": true}
	if !allowedLanguages[language] || strings.TrimSpace(source) == "" || len(source) > maxSourceBytes {
		return Submission{}, ErrInvalid
	}
	if err := s.canSubmit(ctx, competitionID, athleteID, taskID, "algorithm"); err != nil {
		return Submission{}, err
	}
	var submission Submission
	err := s.DB.QueryRow(ctx, `INSERT INTO contest_submissions(competition_id,task_id,athlete_id,language,source_code,status,verdict)
		VALUES($1,$2,$3,$4,$5,'submitted','Ожидает проверки организатором') RETURNING id,task_id,athlete_id,language,status,verdict,submitted_at`, competitionID, taskID, athleteID, language, source).
		Scan(&submission.ID, &submission.TaskID, &submission.AthleteID, &submission.Language, &submission.Status, &submission.Verdict, &submission.SubmittedAt)
	return submission, err
}

func (s Service) SubmitCSV(ctx context.Context, competitionID, taskID, athleteID int64, filename string, content []byte) (Submission, error) {
	if len(content) == 0 || len(content) > maxCSVBytes || !strings.EqualFold(filepath.Ext(filename), ".csv") {
		return Submission{}, ErrInvalid
	}
	if err := s.canSubmit(ctx, competitionID, athleteID, taskID, "csv_metric"); err != nil {
		return Submission{}, err
	}
	tx, err := s.DB.Begin(ctx)
	if err != nil {
		return Submission{}, err
	}
	defer tx.Rollback(ctx)
	var submission Submission
	err = tx.QueryRow(ctx, `INSERT INTO contest_submissions(competition_id,task_id,athlete_id,file_name,file_content,status,verdict)
		VALUES($1,$2,$3,$4,$5,'queued','Файл принят, ожидает проверки') RETURNING id,task_id,athlete_id,status,verdict,submitted_at`, competitionID, taskID, athleteID, filepathBase(filename), content).
		Scan(&submission.ID, &submission.TaskID, &submission.AthleteID, &submission.Status, &submission.Verdict, &submission.SubmittedAt)
	if err != nil {
		return Submission{}, err
	}
	if _, err := tx.Exec(ctx, `INSERT INTO contest_jobs(submission_id) VALUES($1)`, submission.ID); err != nil {
		return Submission{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return Submission{}, err
	}
	return submission, nil
}

func filepathBase(name string) string {
	name = strings.ReplaceAll(name, "\\", "/")
	name = strings.TrimRight(name, "/")
	if name == "" {
		return ""
	}
	return filepath.Base(name)
}

func (s Service) Submissions(ctx context.Context, competitionID int64, athleteID int64, organizer bool) ([]Submission, error) {
	var competitionStatus string
	if err := s.DB.QueryRow(ctx, `SELECT status FROM competitions WHERE id=$1`, competitionID).Scan(&competitionStatus); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	hideScores := !organizer && competitionStatus != "completed"
	query := `SELECT s.id,s.task_id,t.title,s.athlete_id,COALESCE(a.full_name,''),s.language,s.source_code,s.file_name,s.file_content,s.status,s.automatic_score,s.score,s.verdict,s.feedback,s.submitted_at,s.reviewed_at
		FROM contest_submissions s JOIN contest_tasks t ON t.id=s.task_id JOIN athletes a ON a.user_id=s.athlete_id WHERE s.competition_id=$1`
	args := []any{competitionID}
	if !organizer {
		query += ` AND s.athlete_id=$2`
		args = append(args, athleteID)
	}
	query += ` ORDER BY s.submitted_at DESC,s.id DESC`
	rows, err := s.DB.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []Submission{}
	for rows.Next() {
		var item Submission
		var fileContent []byte
		if err := rows.Scan(&item.ID, &item.TaskID, &item.TaskTitle, &item.AthleteID, &item.AthleteName, &item.Language, &item.SourceCode, &item.FileName, &fileContent, &item.Status, &item.AutomaticScore, &item.Score, &item.Verdict, &item.Feedback, &item.SubmittedAt, &item.ReviewedAt); err != nil {
			return nil, err
		}
		if item.FileName != "" {
			item.FileContent = strings.ToValidUTF8(string(fileContent), "�")
		}
		if hideScores && item.Status == "graded" {
			item.AutomaticScore = nil
			item.Score = nil
			item.Feedback = ""
			item.Verdict = "Оценка сохранена; итог будет показан после завершения контеста"
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s Service) Review(ctx context.Context, competitionID, submissionID, reviewerID int64, score float64, feedback string) error {
	if score < 0 || math.IsNaN(score) || math.IsInf(score, 0) || utf8.RuneCountInString(feedback) > 2000 {
		return ErrInvalid
	}
	var maxPoints float64
	err := s.DB.QueryRow(ctx, `SELECT t.max_points FROM contest_submissions s JOIN contest_tasks t ON t.id=s.task_id WHERE s.competition_id=$1 AND s.id=$2`, competitionID, submissionID).Scan(&maxPoints)
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrNotFound
	}
	if err != nil {
		return err
	}
	if score > maxPoints {
		return ErrInvalid
	}
	var finalizedAt *time.Time
	if err := s.DB.QueryRow(ctx, `SELECT finalized_at FROM contests WHERE competition_id=$1`, competitionID).Scan(&finalizedAt); err != nil {
		return err
	}
	if finalizedAt != nil {
		return ErrClosed
	}
	cmd, err := s.DB.Exec(ctx, `UPDATE contest_submissions SET score=$3,status='graded',feedback=$4,reviewed_by=$5,reviewed_at=now(),verdict='Проверено организатором'
		WHERE competition_id=$1 AND id=$2 AND status<>'queued' AND status<>'checking'`, competitionID, submissionID, score, strings.TrimSpace(feedback), reviewerID)
	if err != nil {
		return err
	}
	if cmd.RowsAffected() == 0 {
		return ErrClosed
	}
	return nil
}

func (s Service) Leaderboard(ctx context.Context, competitionID int64) ([]Leader, error) {
	var maxScore float64
	if err := s.DB.QueryRow(ctx, `SELECT COALESCE(sum(max_points),0) FROM contest_tasks WHERE competition_id=$1`, competitionID).Scan(&maxScore); err != nil {
		return nil, err
	}
	rows, err := s.DB.Query(ctx, `SELECT a.user_id,a.full_name,COALESCE(sum(best.score),0)::float8
		FROM registrations r JOIN athletes a ON a.user_id=r.athlete_id
		LEFT JOIN LATERAL (
			SELECT s.task_id,max(COALESCE(s.score,s.automatic_score,0))::float8 AS score
			FROM contest_submissions s WHERE s.competition_id=r.competition_id AND s.athlete_id=r.athlete_id AND s.status IN ('graded','invalid')
			GROUP BY s.task_id
		) best ON true
		WHERE r.competition_id=$1 GROUP BY a.user_id,a.full_name ORDER BY 3 DESC,a.full_name,a.user_id`, competitionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []Leader{}
	for rows.Next() {
		var item Leader
		item.MaxScore = maxScore
		if err := rows.Scan(&item.AthleteID, &item.FullName, &item.Score); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	place := 0
	for i := range items {
		if items[i].Score == 0 {
			place = len(items)
		} else if i == 0 || items[i].Score != items[i-1].Score {
			place = i + 1
		}
		items[i].Place = place
	}
	return items, nil
}

func (s Service) BuildProtocol(ctx context.Context, competitionID int64) ([]competitions.Result, error) {
	var taskCount int
	if err := s.DB.QueryRow(ctx, `SELECT count(*) FROM contest_tasks WHERE competition_id=$1`, competitionID).Scan(&taskCount); err != nil {
		return nil, err
	}
	if taskCount == 0 {
		return nil, ErrInvalid
	}
	var pending int
	if err := s.DB.QueryRow(ctx, `SELECT count(*) FROM contest_submissions s LEFT JOIN contest_jobs j ON j.submission_id=s.id
		WHERE s.competition_id=$1 AND (s.status IN ('submitted','queued','checking') OR COALESCE(j.state,'done')<>'done')`, competitionID).Scan(&pending); err != nil {
		return nil, err
	}
	if pending > 0 {
		return nil, ErrNotReady
	}
	leaders, err := s.Leaderboard(ctx, competitionID)
	if err != nil {
		return nil, err
	}
	if len(leaders) == 0 {
		return nil, ErrInvalid
	}
	var maxScore float64
	if err := s.DB.QueryRow(ctx, `SELECT COALESCE(sum(max_points),0) FROM contest_tasks WHERE competition_id=$1`, competitionID).Scan(&maxScore); err != nil {
		return nil, err
	}
	results := make([]competitions.Result, 0, len(leaders))
	for _, leader := range leaders {
		results = append(results, competitions.Result{AthleteID: leader.AthleteID, Place: leader.Place, ScoreText: fmt.Sprintf("%.2f / %.2f балла", leader.Score, maxScore)})
	}
	return results, nil
}

func (s Service) MarkFinalized(ctx context.Context, competitionID int64) error {
	cmd, err := s.DB.Exec(ctx, `UPDATE contests SET finalized_at=COALESCE(finalized_at,now()) WHERE competition_id=$1`, competitionID)
	if err != nil {
		return err
	}
	if cmd.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

// ProcessOne claims and scores a queued CSV submission. Multiple worker processes can safely call it.
func (s Service) ProcessOne(ctx context.Context) (bool, error) {
	tx, err := s.DB.Begin(ctx)
	if err != nil {
		return false, err
	}
	defer tx.Rollback(ctx)
	var submissionID int64
	_, _ = tx.Exec(ctx, `UPDATE contest_jobs SET state='queued',locked_at=NULL WHERE state='running' AND locked_at<now()-interval '5 minutes'`)
	err = tx.QueryRow(ctx, `SELECT submission_id FROM contest_jobs WHERE state='queued' AND available_at<=now() ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED`).Scan(&submissionID)
	if errors.Is(err, pgx.ErrNoRows) {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	if _, err := tx.Exec(ctx, `UPDATE contest_jobs SET state='running',locked_at=now(),attempts=attempts+1 WHERE submission_id=$1`, submissionID); err != nil {
		return false, err
	}
	if _, err := tx.Exec(ctx, `UPDATE contest_submissions SET status='checking',verdict='Проверка файла' WHERE id=$1`, submissionID); err != nil {
		return false, err
	}
	var content []byte
	var expectedRaw []byte
	var positiveLabel string
	err = tx.QueryRow(ctx, `SELECT s.file_content,t.expected_labels,t.positive_label FROM contest_submissions s JOIN contest_tasks t ON t.id=s.task_id WHERE s.id=$1`, submissionID).Scan(&content, &expectedRaw, &positiveLabel)
	if err != nil {
		return false, err
	}
	if err := tx.Commit(ctx); err != nil {
		return false, err
	}
	var expected map[string]string
	if err := json.Unmarshal(expectedRaw, &expected); err != nil {
		return true, s.failJob(ctx, submissionID, "Не удалось загрузить эталонные метки")
	}
	score, feedback, validationErr := scoreRecall(content, expected, positiveLabel)
	if validationErr != nil {
		_, updateErr := s.DB.Exec(ctx, `UPDATE contest_submissions SET status='invalid',score=0,automatic_score=0,verdict='Файл не прошёл проверку',feedback=$2 WHERE id=$1`, submissionID, validationErr.Error())
		if updateErr != nil {
			return true, updateErr
		}
	} else {
		var maxPoints float64
		if err := s.DB.QueryRow(ctx, `SELECT t.max_points FROM contest_submissions s JOIN contest_tasks t ON t.id=s.task_id WHERE s.id=$1`, submissionID).Scan(&maxPoints); err != nil {
			return true, err
		}
		score = math.Round(score*maxPoints*100) / 100
		_, err := s.DB.Exec(ctx, `UPDATE contest_submissions SET status='graded',automatic_score=$2,score=$2,verdict='Проверено автоматически',feedback=$3 WHERE id=$1`, submissionID, score, feedback)
		if err != nil {
			return true, err
		}
	}
	_, err = s.DB.Exec(ctx, `UPDATE contest_jobs SET state='done',locked_at=NULL,last_error='' WHERE submission_id=$1`, submissionID)
	return true, err
}

func (s Service) failJob(ctx context.Context, submissionID int64, message string) error {
	_, err := s.DB.Exec(ctx, `UPDATE contest_jobs SET state='queued',available_at=now()+interval '10 seconds',locked_at=NULL,last_error=$2 WHERE submission_id=$1`, submissionID, message)
	return err
}

func scoreRecall(data []byte, expected map[string]string, positive string) (float64, string, error) {
	reader := csv.NewReader(strings.NewReader(string(data)))
	reader.FieldsPerRecord = 2
	header, err := reader.Read()
	if err != nil || len(header) != 2 || strings.TrimSpace(strings.ToLower(header[0])) != "id" || strings.TrimSpace(strings.ToLower(header[1])) != "prediction" {
		return 0, "", errors.New("ожидаются CSV-колонки id,prediction")
	}
	predictions := make(map[string]string, len(expected))
	for {
		row, err := reader.Read()
		if errors.Is(err, io.EOF) {
			break
		}
		if err != nil {
			return 0, "", errors.New("проверьте формат CSV и разделитель-запятую")
		}
		id := strings.TrimSpace(row[0])
		prediction := strings.TrimSpace(row[1])
		if _, exists := expected[id]; !exists || id == "" {
			return 0, "", fmt.Errorf("неизвестный или пустой id: %q", id)
		}
		if _, exists := predictions[id]; exists {
			return 0, "", fmt.Errorf("id %q встречается больше одного раза", id)
		}
		if prediction != "0" && prediction != "1" {
			return 0, "", fmt.Errorf("для id %q prediction должен быть 0 или 1", id)
		}
		predictions[id] = prediction
	}
	if len(predictions) != len(expected) {
		return 0, "", fmt.Errorf("ожидалось %d строк с id, получено %d", len(expected), len(predictions))
	}
	positives, truePositive := 0, 0
	for id, label := range expected {
		if label == positive {
			positives++
			if predictions[id] == positive {
				truePositive++
			}
		}
	}
	if positives == 0 {
		return 0, "", errors.New("в эталонных данных нет положительных примеров")
	}
	recall := float64(truePositive) / float64(positives)
	return recall, fmt.Sprintf("Recall: %.4f (%d из %d положительных примеров)", recall, truePositive, positives), nil
}

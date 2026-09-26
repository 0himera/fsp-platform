package codeforces

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type LinkedData struct {
	Linked    bool         `json:"linked"`
	ContestID int          `json:"contest_id,omitempty"`
	Standings *CFStandings `json:"standings,omitempty"`
}

type Service struct {
	DB     *pgxpool.Pool
	Client *Client
}

func NewService(db *pgxpool.Pool) Service {
	return Service{
		DB:     db,
		Client: NewClient(),
	}
}

func (s Service) GetLinked(ctx context.Context, competitionID int64) (*LinkedData, error) {
	var cfID sql.NullInt64
	err := s.DB.QueryRow(ctx, `SELECT codeforces_contest_id FROM contests WHERE competition_id=$1`, competitionID).Scan(&cfID)
	if errors.Is(err, pgx.ErrNoRows) || !cfID.Valid || cfID.Int64 <= 0 {
		return &LinkedData{Linked: false}, nil
	}
	if err != nil {
		return nil, err
	}
	standings, err := s.Client.FetchStandings(ctx, int(cfID.Int64))
	if err != nil {
		return &LinkedData{Linked: true, ContestID: int(cfID.Int64)}, nil
	}
	return &LinkedData{
		Linked:    true,
		ContestID: int(cfID.Int64),
		Standings: standings,
	}, nil
}

func (s Service) LinkContest(ctx context.Context, competitionID int64, cfContestID int) error {
	cmd, err := s.DB.Exec(ctx, `UPDATE contests SET codeforces_contest_id=$2 WHERE competition_id=$1`, competitionID, cfContestID)
	if err != nil {
		return err
	}
	if cmd.RowsAffected() == 0 {
		_, err = s.DB.Exec(ctx, `INSERT INTO contests (competition_id, mode, instructions, codeforces_contest_id) VALUES ($1, 'algorithm', 'Контест на базе Codeforces', $2) ON CONFLICT (competition_id) DO UPDATE SET codeforces_contest_id=$2`, competitionID, cfContestID)
		return err
	}
	return nil
}

func (s Service) ImportTasks(ctx context.Context, competitionID int64) (int, error) {
	var cfID sql.NullInt64
	err := s.DB.QueryRow(ctx, `SELECT codeforces_contest_id FROM contests WHERE competition_id=$1`, competitionID).Scan(&cfID)
	if err != nil || !cfID.Valid || cfID.Int64 <= 0 {
		return 0, errors.New("codeforces contest not linked")
	}
	standings, err := s.Client.FetchStandings(ctx, int(cfID.Int64))
	if err != nil {
		return 0, err
	}
	imported := 0
	for i, p := range standings.Problems {
		title := fmt.Sprintf("%s. %s", p.Index, p.Name)
		statement := fmt.Sprintf("Задача %s: «%s» с Codeforces контеста #%d.\n\nСсылка на условие: https://codeforces.com/contest/%d/problem/%s\n\nТеги: %s\n\nРешите задачу и вставьте ваше решение в поле редактора.", p.Index, p.Name, p.ContestID, p.ContestID, p.Index, strings.Join(p.Tags, ", "))
		pts := p.Points
		if pts <= 0 {
			pts = 100
		}
		var exists bool
		_ = s.DB.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM contest_tasks WHERE competition_id=$1 AND position=$2)`, competitionID, i+1).Scan(&exists)
		if exists {
			continue
		}
		_, insertErr := s.DB.Exec(ctx, `INSERT INTO contest_tasks (competition_id, title, statement, max_points, position) VALUES ($1,$2,$3,$4,$5)`, competitionID, title, statement, pts, i+1)
		if insertErr == nil {
			imported++
		}
	}
	return imported, nil
}

func (s Service) SyncStandings(ctx context.Context, competitionID int64) (int, error) {
	var cfID sql.NullInt64
	err := s.DB.QueryRow(ctx, `SELECT codeforces_contest_id FROM contests WHERE competition_id=$1`, competitionID).Scan(&cfID)
	if err != nil || !cfID.Valid || cfID.Int64 <= 0 {
		return 0, errors.New("codeforces contest not linked")
	}
	standings, err := s.Client.FetchStandings(ctx, int(cfID.Int64))
	if err != nil {
		return 0, err
	}
	rows, err := s.DB.Query(ctx, `SELECT a.user_id, a.codeforces_handle FROM registrations r JOIN athletes a ON a.user_id=r.athlete_id WHERE r.competition_id=$1`, competitionID)
	if err != nil {
		return 0, err
	}
	defer rows.Close()

	athletes := make(map[string]int64)
	for rows.Next() {
		var uid int64
		var handle string
		if err := rows.Scan(&uid, &handle); err == nil && handle != "" {
			athletes[strings.ToLower(strings.TrimSpace(handle))] = uid
		}
	}

	taskRows, err := s.DB.Query(ctx, `SELECT id, position, max_points FROM contest_tasks WHERE competition_id=$1 ORDER BY position`, competitionID)
	if err != nil {
		return 0, err
	}
	defer taskRows.Close()

	type taskInfo struct {
		id  int64
		pos int
		pts float64
	}
	var tasks []taskInfo
	for taskRows.Next() {
		var t taskInfo
		if err := taskRows.Scan(&t.id, &t.pos, &t.pts); err == nil {
			tasks = append(tasks, t)
		}
	}

	synced := 0
	for _, row := range standings.Rows {
		for _, member := range row.Party.Members {
			uid, ok := athletes[strings.ToLower(member.Handle)]
			if !ok {
				continue
			}
			for i, res := range row.ProblemResults {
				if i >= len(tasks) || res.Points <= 0 {
					continue
				}
				task := tasks[i]
				score := task.pts
				_, _ = s.DB.Exec(ctx, `INSERT INTO contest_submissions (competition_id, task_id, athlete_id, language, source_code, status, automatic_score, score, verdict) VALUES ($1,$2,$3,'codeforces','// Synced from Codeforces','graded',$4,$4,'Accepted (Codeforces)')`, competitionID, task.id, uid, score)
			}
			synced++
		}
	}
	return synced, nil
}

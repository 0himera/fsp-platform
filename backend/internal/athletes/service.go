package athletes

import (
	"context"
	"errors"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrNotFound = errors.New("athlete not found")

type Update struct {
	FullName         string   `json:"full_name"`
	Organization     string   `json:"organization"`
	City             string   `json:"city"`
	Disciplines      []string `json:"disciplines"`
	CodeforcesHandle string   `json:"codeforces_handle"`
}

type Service struct{ DB *pgxpool.Pool }

func (s Service) Update(ctx context.Context, userID int64, input Update) error {
	tx, err := s.DB.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	command, err := tx.Exec(ctx, `UPDATE athletes SET full_name=$2,organization=$3,city=$4,codeforces_handle=$5 WHERE user_id=$1`, userID, strings.TrimSpace(input.FullName), strings.TrimSpace(input.Organization), strings.TrimSpace(input.City), strings.TrimSpace(input.CodeforcesHandle))
	if err != nil {
		return err
	}
	if command.RowsAffected() == 0 {
		return ErrNotFound
	}
	if _, err := tx.Exec(ctx, `DELETE FROM athlete_disciplines WHERE athlete_id=$1`, userID); err != nil {
		return err
	}
	seen := map[string]bool{}
	for _, code := range input.Disciplines {
		if seen[code] {
			continue
		}
		seen[code] = true
		if _, err := tx.Exec(ctx, `INSERT INTO athlete_disciplines (athlete_id,discipline_code) VALUES ($1,$2)`, userID, code); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}

func (s Service) SetRank(ctx context.Context, userID int64, rank string, organizerID int64) error {
	tx, err := s.DB.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	var previous string
	if err := tx.QueryRow(ctx, `SELECT rank_code FROM athletes WHERE user_id=$1 FOR UPDATE`, userID).Scan(&previous); err != nil {
		return err
	}
	if previous == rank {
		return nil
	}
	if _, err := tx.Exec(ctx, `UPDATE athletes SET rank_code=$2 WHERE user_id=$1`, userID, rank); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `INSERT INTO rank_changes (athlete_id,old_rank_code,new_rank_code,changed_by) VALUES ($1,$2,$3,$4)`, userID, previous, rank, organizerID); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

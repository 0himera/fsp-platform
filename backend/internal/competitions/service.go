package competitions

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrNotFound      = errors.New("competition not found")
	ErrClosed        = errors.New("competition is closed")
	ErrConflict      = errors.New("already registered or assigned")
	ErrInvalid       = errors.New("invalid competition data")
	ErrNotQualified  = errors.New("athlete did not qualify for final")
	ErrNotFinished   = errors.New("competition has not finished")
	ErrTeamRequired  = errors.New("team entry must be submitted as a team")
	ErrTeamFull      = errors.New("team has reached its size limit")
	ErrInvalidInvite = errors.New("team invitation is invalid or expired")
	ErrNotCaptain    = errors.New("only the team captain can manage it")
)

type Competition struct {
	ID                   int64     `json:"id"`
	Title                string    `json:"title"`
	LevelCode            string    `json:"level_code"`
	DisciplineCode       string    `json:"discipline_code"`
	Format               string    `json:"format"`
	StartsAt             time.Time `json:"starts_at"`
	EndsAt               time.Time `json:"ends_at"`
	RegistrationDeadline time.Time `json:"registration_deadline"`
	Location             string    `json:"location"`
	Description          string    `json:"description"`
	Status               string    `json:"status"`
	Phase                string    `json:"phase"`
	RegistrationOpen     bool      `json:"registration_open"`
	Stage                string    `json:"stage"`
	QualifyingID         *int64    `json:"qualifying_competition_id"`
	QualifyingPlaceLimit *int      `json:"qualifying_place_limit"`
	RegistrationsCount   int       `json:"registrations_count"`
	ResultsCount         int       `json:"results_count"`
	MaxTeamSize          int       `json:"max_team_size"`
}

type Input struct {
	Title                string    `json:"title"`
	LevelCode            string    `json:"level_code"`
	DisciplineCode       string    `json:"discipline_code"`
	Format               string    `json:"format"`
	StartsAt             time.Time `json:"starts_at"`
	EndsAt               time.Time `json:"ends_at"`
	RegistrationDeadline time.Time `json:"registration_deadline"`
	Location             string    `json:"location"`
	Description          string    `json:"description"`
	Status               string    `json:"status"`
	Stage                string    `json:"stage"`
	QualifyingID         *int64    `json:"qualifying_competition_id"`
	QualifyingPlaceLimit *int      `json:"qualifying_place_limit"`
	MaxTeamSize          int       `json:"max_team_size"`
}

type Registration struct {
	AthleteID           int64     `json:"athlete_id"`
	FullName            string    `json:"full_name"`
	Organization        string    `json:"organization"`
	City                string    `json:"city"`
	CreatedAt           time.Time `json:"created_at"`
	AvatarURL           string    `json:"avatar_url"`
	FeaturedAchievement any       `json:"featured_achievement,omitempty"`
}

type Team struct {
	CompetitionID int64          `json:"competition_id"`
	ID            int64          `json:"id"`
	Name          string         `json:"name"`
	Description   string         `json:"description"`
	CaptainID     int64          `json:"captain_id"`
	Members       []Registration `json:"members"`
}

type Result struct {
	ID        int64  `json:"id,omitempty"`
	AthleteID int64  `json:"athlete_id,omitempty"`
	TeamID    int64  `json:"team_id,omitempty"`
	Place     int    `json:"place"`
	ScoreText string `json:"score_text"`
	Name      string `json:"name,omitempty"`
}

type Service struct{ DB *pgxpool.Pool }

const selectCompetition = `SELECT c.id,c.title,c.level_code,c.discipline_code,c.format,c.starts_at,c.ends_at,c.registration_deadline,c.location,c.description,c.status,c.stage,c.qualifying_competition_id,c.qualifying_place_limit,c.max_team_size,
  (SELECT count(*)::integer FROM registrations x WHERE x.competition_id=c.id),
  (SELECT count(*)::integer FROM results x WHERE x.competition_id=c.id)
  FROM competitions c`

type scanner interface{ Scan(...any) error }

func scanCompetition(row scanner, now time.Time) (Competition, error) {
	var c Competition
	err := row.Scan(&c.ID, &c.Title, &c.LevelCode, &c.DisciplineCode, &c.Format, &c.StartsAt, &c.EndsAt, &c.RegistrationDeadline, &c.Location, &c.Description, &c.Status, &c.Stage, &c.QualifyingID, &c.QualifyingPlaceLimit, &c.MaxTeamSize, &c.RegistrationsCount, &c.ResultsCount)
	if err == nil {
		c = withPhase(c, now)
	}
	return c, err
}

func withPhase(c Competition, now time.Time) Competition {
	c.RegistrationOpen = registrationOpen(c.Status, c.RegistrationDeadline, c.EndsAt, now)
	switch {
	case c.Status == "draft":
		c.Phase = "draft"
	case c.Status == "completed":
		c.Phase = "completed"
	case !now.Before(c.EndsAt):
		c.Phase = "awaiting_results"
	case now.Before(c.StartsAt):
		c.Phase = "upcoming"
	default:
		c.Phase = "current"
	}
	return c
}

func registrationOpen(status string, deadline, endsAt, now time.Time) bool {
	return status == "open" && now.Before(deadline) && now.Before(endsAt)
}

func (s Service) List(ctx context.Context, status, phase, query string) ([]Competition, error) {
	if phase != "" && phase != "draft" && phase != "upcoming" && phase != "current" && phase != "awaiting_results" && phase != "completed" {
		return nil, ErrInvalid
	}
	now := time.Now().UTC()
	rows, err := s.DB.Query(ctx, selectCompetition+` WHERE ($1='' OR c.status=$1) AND ($2='' OR c.title ILIKE '%' || $2 || '%') ORDER BY c.starts_at DESC,c.id DESC`, status, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	list := []Competition{}
	for rows.Next() {
		item, err := scanCompetition(rows, now)
		if err != nil {
			return nil, err
		}
		if phase == "" || item.Phase == phase {
			list = append(list, item)
		}
	}
	return list, rows.Err()
}

func (s Service) Get(ctx context.Context, id int64) (Competition, error) {
	c, err := scanCompetition(s.DB.QueryRow(ctx, selectCompetition+` WHERE c.id=$1`, id), time.Now().UTC())
	if errors.Is(err, pgx.ErrNoRows) {
		return c, ErrNotFound
	}
	return c, err
}

func validInput(in Input) bool {
	levels := map[string]bool{"rf_championship": true, "all_russian": true, "interregional": true, "rd_championship": true, "regional": true}
	return utf8.RuneCountInString(strings.TrimSpace(in.Title)) >= 3 && utf8.RuneCountInString(in.Title) <= 160 && utf8.RuneCountInString(in.Location) <= 160 && utf8.RuneCountInString(in.Description) <= 3000 && levels[in.LevelCode] && in.DisciplineCode != "" &&
		(in.MaxTeamSize >= 2 && in.MaxTeamSize <= 5) &&
		(in.Format == "individual" || in.Format == "team") && (in.Status == "draft" || in.Status == "open" || in.Status == "running" || in.Status == "completed") &&
		(in.Stage == "standalone" || in.Stage == "qualification" || in.Stage == "final") && ((in.Stage == "final") == (in.QualifyingID != nil)) &&
		((in.Stage == "final") == (in.QualifyingPlaceLimit != nil)) && (in.QualifyingPlaceLimit == nil || (*in.QualifyingPlaceLimit > 0 && *in.QualifyingPlaceLimit <= 10000)) &&
		!in.StartsAt.IsZero() && !in.EndsAt.IsZero() && !in.RegistrationDeadline.IsZero() && in.EndsAt.After(in.StartsAt) && !in.RegistrationDeadline.After(in.EndsAt)
}

func normalizeInput(in *Input) {
	if in.Stage == "" {
		in.Stage = "standalone"
	}
	if in.MaxTeamSize == 0 {
		in.MaxTeamSize = 5
	}
}

func (s Service) validateQualifier(ctx context.Context, in Input) error {
	if in.Stage != "final" {
		return nil
	}
	qualifier, err := s.Get(ctx, *in.QualifyingID)
	if err != nil {
		return ErrInvalid
	}
	if qualifier.Stage != "qualification" || qualifier.Format != in.Format || qualifier.DisciplineCode != in.DisciplineCode || qualifier.EndsAt.After(in.StartsAt) {
		return ErrInvalid
	}
	return nil
}

func (s Service) Create(ctx context.Context, in Input, organizerID int64) (Competition, error) {
	normalizeInput(&in)
	if !validInput(in) || in.Status == "completed" {
		return Competition{}, ErrInvalid
	}
	if err := s.validateQualifier(ctx, in); err != nil {
		return Competition{}, err
	}
	var id int64
	err := s.DB.QueryRow(ctx, `INSERT INTO competitions (title,level_code,discipline_code,format,starts_at,ends_at,registration_deadline,location,description,status,stage,qualifying_competition_id,qualifying_place_limit,max_team_size,created_by)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id`, strings.TrimSpace(in.Title), in.LevelCode, in.DisciplineCode, in.Format, in.StartsAt, in.EndsAt, in.RegistrationDeadline, strings.TrimSpace(in.Location), strings.TrimSpace(in.Description), in.Status, in.Stage, in.QualifyingID, in.QualifyingPlaceLimit, in.MaxTeamSize, organizerID).Scan(&id)
	if err != nil {
		return Competition{}, err
	}
	return s.Get(ctx, id)
}

func (s Service) Update(ctx context.Context, id int64, in Input) (Competition, error) {
	normalizeInput(&in)
	if !validInput(in) {
		return Competition{}, ErrInvalid
	}
	if in.Status == "completed" {
		current, err := s.Get(ctx, id)
		if err != nil {
			return Competition{}, err
		}
		if current.Status != "completed" || current.LevelCode != in.LevelCode || current.DisciplineCode != in.DisciplineCode || current.Format != in.Format ||
			!current.StartsAt.Equal(in.StartsAt) || !current.EndsAt.Equal(in.EndsAt) || !current.RegistrationDeadline.Equal(in.RegistrationDeadline) ||
			current.Stage != in.Stage || !equalID(current.QualifyingID, in.QualifyingID) || !equalInt(current.QualifyingPlaceLimit, in.QualifyingPlaceLimit) || current.MaxTeamSize != in.MaxTeamSize {
			return Competition{}, ErrClosed
		}
		command, err := s.DB.Exec(ctx, `UPDATE competitions SET title=$2,location=$3,description=$4,updated_at=now() WHERE id=$1 AND status='completed'`,
			id, strings.TrimSpace(in.Title), strings.TrimSpace(in.Location), strings.TrimSpace(in.Description))
		if err != nil {
			return Competition{}, err
		}
		if command.RowsAffected() == 0 {
			return Competition{}, ErrClosed
		}
		return s.Get(ctx, id)
	}
	if err := s.validateQualifier(ctx, in); err != nil {
		return Competition{}, err
	}
	command, err := s.DB.Exec(ctx, `UPDATE competitions SET title=$2,level_code=$3,discipline_code=$4,format=$5,starts_at=$6,ends_at=$7,registration_deadline=$8,location=$9,description=$10,status=$11,stage=$12,qualifying_competition_id=$13,qualifying_place_limit=$14,max_team_size=$15,updated_at=now()
		WHERE id=$1 AND status<>'completed' AND NOT EXISTS (SELECT 1 FROM results WHERE competition_id=$1)
			AND (NOT EXISTS (SELECT 1 FROM registrations WHERE competition_id=$1) OR
				(discipline_code=$4 AND format=$5 AND stage=$12
				AND qualifying_competition_id IS NOT DISTINCT FROM $13
				AND qualifying_place_limit IS NOT DISTINCT FROM $14))
			AND ($11<>'draft' OR NOT EXISTS (SELECT 1 FROM registrations WHERE competition_id=$1))
		AND NOT EXISTS (SELECT 1 FROM teams WHERE competition_id=$1 AND $5='individual')
		AND NOT EXISTS (SELECT 1 FROM competitions child WHERE child.qualifying_competition_id=$1
			AND ($12<>'qualification' OR $4<>child.discipline_code OR $5<>child.format OR $7>child.starts_at))`,
		id, strings.TrimSpace(in.Title), in.LevelCode, in.DisciplineCode, in.Format, in.StartsAt, in.EndsAt, in.RegistrationDeadline, strings.TrimSpace(in.Location), strings.TrimSpace(in.Description), in.Status, in.Stage, in.QualifyingID, in.QualifyingPlaceLimit, in.MaxTeamSize)
	if err != nil {
		return Competition{}, err
	}
	if command.RowsAffected() == 0 {
		if _, err := s.Get(ctx, id); err != nil {
			return Competition{}, err
		}
		return Competition{}, ErrClosed
	}
	return s.Get(ctx, id)
}

func canCloseEarly(status string, startsAt, endsAt, now time.Time) bool {
	return (status == "open" || status == "running") && !startsAt.After(now) && endsAt.After(now)
}

func (s Service) CloseEarly(ctx context.Context, id int64) (Competition, error) {
	tx, err := s.DB.Begin(ctx)
	if err != nil {
		return Competition{}, err
	}
	defer tx.Rollback(ctx)

	var status string
	var startsAt, endsAt time.Time
	err = tx.QueryRow(ctx, `SELECT status,starts_at,ends_at FROM competitions WHERE id=$1 FOR UPDATE`, id).Scan(&status, &startsAt, &endsAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return Competition{}, ErrNotFound
	}
	if err != nil {
		return Competition{}, err
	}
	now := time.Now().UTC()
	if !canCloseEarly(status, startsAt, endsAt, now) {
		return Competition{}, ErrClosed
	}
	if _, err := tx.Exec(ctx, `UPDATE competitions SET status='running',ends_at=$2,registration_deadline=LEAST(registration_deadline,$2),updated_at=now() WHERE id=$1`, id, now); err != nil {
		return Competition{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return Competition{}, err
	}
	return s.Get(ctx, id)
}

// CloseRegistrationEarly stops new applications without changing the contest schedule.
func (s Service) CloseRegistrationEarly(ctx context.Context, id int64) (Competition, error) {
	tx, err := s.DB.Begin(ctx)
	if err != nil {
		return Competition{}, err
	}
	defer tx.Rollback(ctx)

	var status string
	var deadline, endsAt time.Time
	if err := tx.QueryRow(ctx, `SELECT status,registration_deadline,ends_at FROM competitions WHERE id=$1 FOR UPDATE`, id).Scan(&status, &deadline, &endsAt); errors.Is(err, pgx.ErrNoRows) {
		return Competition{}, ErrNotFound
	} else if err != nil {
		return Competition{}, err
	}
	now := time.Now().UTC()
	if status != "open" || !deadline.After(now) || !endsAt.After(now) {
		return Competition{}, ErrClosed
	}
	if _, err := tx.Exec(ctx, `UPDATE competitions SET registration_deadline=$2,updated_at=now() WHERE id=$1`, id, now); err != nil {
		return Competition{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return Competition{}, err
	}
	return s.Get(ctx, id)
}

// StartEarly opens the solving window immediately and closes registration at the same time.
func (s Service) StartEarly(ctx context.Context, id int64) (Competition, error) {
	tx, err := s.DB.Begin(ctx)
	if err != nil {
		return Competition{}, err
	}
	defer tx.Rollback(ctx)

	var status string
	var startsAt, endsAt time.Time
	if err := tx.QueryRow(ctx, `SELECT status,starts_at,ends_at FROM competitions WHERE id=$1 FOR UPDATE`, id).Scan(&status, &startsAt, &endsAt); errors.Is(err, pgx.ErrNoRows) {
		return Competition{}, ErrNotFound
	} else if err != nil {
		return Competition{}, err
	}
	now := time.Now().UTC()
	if status != "open" || !startsAt.After(now) || !endsAt.After(now) {
		return Competition{}, ErrClosed
	}
	var ready bool
	if err := tx.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM contests x JOIN contest_tasks t ON t.competition_id=x.competition_id WHERE x.competition_id=$1)`, id).Scan(&ready); err != nil {
		return Competition{}, err
	}
	if !ready {
		return Competition{}, ErrInvalid
	}
	if _, err := tx.Exec(ctx, `UPDATE competitions SET status='running',starts_at=$2,registration_deadline=LEAST(registration_deadline,$2),updated_at=now() WHERE id=$1`, id, now); err != nil {
		return Competition{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return Competition{}, err
	}
	return s.Get(ctx, id)
}

func equalID(a, b *int64) bool {
	return (a == nil && b == nil) || (a != nil && b != nil && *a == *b)
}

func equalInt(a, b *int) bool {
	return (a == nil && b == nil) || (a != nil && b != nil && *a == *b)
}

func (s Service) Register(ctx context.Context, competitionID, athleteID int64) error {
	tx, err := s.DB.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	var status, stage, format string
	var deadline time.Time
	var qualifierID *int64
	var placeLimit *int
	var endsAt time.Time
	err = tx.QueryRow(ctx, `SELECT status,registration_deadline,ends_at,stage,qualifying_competition_id,qualifying_place_limit,format FROM competitions WHERE id=$1 FOR SHARE`, competitionID).Scan(&status, &deadline, &endsAt, &stage, &qualifierID, &placeLimit, &format)
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrNotFound
	}
	if err != nil {
		return err
	}
	if !registrationOpen(status, deadline, endsAt, time.Now()) {
		return ErrClosed
	}
	if format == "team" {
		return ErrTeamRequired
	}
	if stage == "final" {
		var qualified bool
		err = tx.QueryRow(ctx, `SELECT EXISTS (
			SELECT 1 FROM results r JOIN competitions q ON q.id=r.competition_id
			LEFT JOIN team_members m ON m.team_id=r.team_id
			WHERE r.competition_id=$1 AND q.status='completed' AND r.place<=$2
			AND (r.athlete_id=$3 OR m.athlete_id=$3)
		)`, *qualifierID, *placeLimit, athleteID).Scan(&qualified)
		if err != nil {
			return err
		}
		if !qualified {
			return ErrNotQualified
		}
	}
	command, err := tx.Exec(ctx, `INSERT INTO registrations (competition_id,athlete_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, competitionID, athleteID)
	if err != nil {
		return err
	}
	if command.RowsAffected() == 0 {
		return ErrConflict
	}
	return tx.Commit(ctx)
}

func (s Service) Unregister(ctx context.Context, competitionID, athleteID int64) error {
	command, err := s.DB.Exec(ctx, `DELETE FROM registrations r USING competitions c WHERE r.competition_id=$1 AND r.athlete_id=$2 AND c.id=r.competition_id AND c.status='open' AND c.registration_deadline>now() AND c.ends_at>now() AND NOT EXISTS (SELECT 1 FROM team_members m WHERE m.competition_id=$1 AND m.athlete_id=$2)`, competitionID, athleteID)
	if err != nil {
		return err
	}
	if command.RowsAffected() == 0 {
		return ErrClosed
	}
	return nil
}

func (s Service) Registrations(ctx context.Context, competitionID int64) ([]Registration, error) {
	rows, err := s.DB.Query(ctx, `SELECT a.user_id,a.full_name,a.organization,a.city,r.created_at,a.avatar_url FROM registrations r JOIN athletes a ON a.user_id=r.athlete_id WHERE r.competition_id=$1 ORDER BY r.created_at,a.full_name`, competitionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	list := []Registration{}
	for rows.Next() {
		var r Registration
		if err := rows.Scan(&r.AthleteID, &r.FullName, &r.Organization, &r.City, &r.CreatedAt, &r.AvatarURL); err != nil {
			return nil, err
		}
		list = append(list, r)
	}
	return list, rows.Err()
}

func (s Service) MyRegistrations(ctx context.Context, athleteID int64) ([]Competition, error) {
	now := time.Now().UTC()
	rows, err := s.DB.Query(ctx, selectCompetition+` JOIN registrations r ON r.competition_id=c.id WHERE r.athlete_id=$1 ORDER BY c.starts_at DESC`, athleteID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	list := []Competition{}
	for rows.Next() {
		item, err := scanCompetition(rows, now)
		if err != nil {
			return nil, err
		}
		list = append(list, item)
	}
	return list, rows.Err()
}

func (s Service) CreateTeam(ctx context.Context, competitionID int64, name string, memberIDs []int64) (Team, error) {
	name = strings.TrimSpace(name)
	if name == "" || utf8.RuneCountInString(name) > 100 || len(memberIDs) == 0 {
		return Team{}, ErrInvalid
	}
	seen := map[int64]bool{}
	for _, id := range memberIDs {
		if id < 1 || seen[id] {
			return Team{}, ErrInvalid
		}
		seen[id] = true
	}
	tx, err := s.DB.Begin(ctx)
	if err != nil {
		return Team{}, err
	}
	defer tx.Rollback(ctx)
	var format, status string
	err = tx.QueryRow(ctx, `SELECT format,status FROM competitions WHERE id=$1 FOR SHARE`, competitionID).Scan(&format, &status)
	if errors.Is(err, pgx.ErrNoRows) {
		return Team{}, ErrNotFound
	}
	if err != nil {
		return Team{}, err
	}
	if format != "team" || status == "completed" {
		return Team{}, ErrClosed
	}
	var id int64
	if err := tx.QueryRow(ctx, `INSERT INTO teams (competition_id,name,captain_id) VALUES ($1,$2,$3) RETURNING id`, competitionID, name, memberIDs[0]).Scan(&id); err != nil {
		return Team{}, err
	}
	for _, athleteID := range memberIDs {
		command, err := tx.Exec(ctx, `INSERT INTO team_members (competition_id,team_id,athlete_id)
			SELECT $1,$2,r.athlete_id FROM registrations r WHERE r.competition_id=$1 AND r.athlete_id=$3`, competitionID, id, athleteID)
		if err != nil {
			return Team{}, err
		}
		if command.RowsAffected() == 0 {
			return Team{}, fmt.Errorf("athlete %d is not registered: %w", athleteID, ErrInvalid)
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return Team{}, err
	}
	teams, err := s.Teams(ctx, competitionID)
	if err != nil {
		return Team{}, err
	}
	for _, team := range teams {
		if team.ID == id {
			return team, nil
		}
	}
	return Team{}, ErrNotFound
}

func (s Service) DeleteTeam(ctx context.Context, competitionID, teamID, captainID int64) error {
	tx, err := s.DB.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	var owner int64
	var status string
	var deadline time.Time
	err = tx.QueryRow(ctx, `SELECT t.captain_id,c.status,c.registration_deadline FROM teams t JOIN competitions c ON c.id=t.competition_id WHERE t.id=$2 AND t.competition_id=$1 FOR UPDATE OF t,c`, competitionID, teamID).Scan(&owner, &status, &deadline)
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrNotFound
	}
	if err != nil {
		return err
	}
	if owner != captainID {
		return ErrNotCaptain
	}
	if status != "open" || !time.Now().Before(deadline) {
		return ErrClosed
	}
	if _, err = tx.Exec(ctx, `DELETE FROM registrations r USING team_members m WHERE m.competition_id=$1 AND m.team_id=$2 AND r.competition_id=m.competition_id AND r.athlete_id=m.athlete_id`, competitionID, teamID); err != nil {
		return err
	}
	if _, err = tx.Exec(ctx, `DELETE FROM teams WHERE competition_id=$1 AND id=$2`, competitionID, teamID); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (s Service) UpdateTeam(ctx context.Context, competitionID, teamID, captainID int64, name, description string) (Team, error) {
	name = strings.TrimSpace(name)
	description = strings.TrimSpace(description)
	if utf8.RuneCountInString(name) < 2 || utf8.RuneCountInString(name) > 100 || utf8Len(description) > 500 {
		return Team{}, ErrInvalid
	}
	tx, err := s.DB.Begin(ctx)
	if err != nil {
		return Team{}, err
	}
	defer tx.Rollback(ctx)
	var format, status string
	var owner int64
	var deadline time.Time
	err = tx.QueryRow(ctx, `SELECT c.format,c.status,t.captain_id,c.registration_deadline FROM competitions c JOIN teams t ON t.competition_id=c.id WHERE c.id=$1 AND t.id=$2 FOR UPDATE OF c,t`, competitionID, teamID).Scan(&format, &status, &owner, &deadline)
	if errors.Is(err, pgx.ErrNoRows) {
		return Team{}, ErrNotFound
	}
	if err != nil {
		return Team{}, err
	}
	if owner != captainID {
		return Team{}, ErrNotCaptain
	}
	if format != "team" || status != "open" || !time.Now().Before(deadline) {
		return Team{}, ErrClosed
	}
	if _, err := tx.Exec(ctx, `UPDATE teams SET name=$4,description=$5 WHERE competition_id=$1 AND id=$2 AND captain_id=$3`, competitionID, teamID, captainID, name, description); err != nil {
		return Team{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return Team{}, err
	}
	teams, err := s.Teams(ctx, competitionID)
	if err != nil {
		return Team{}, err
	}
	for _, team := range teams {
		if team.ID == teamID {
			return team, nil
		}
	}
	return Team{}, ErrNotFound
}

func (s Service) Teams(ctx context.Context, competitionID int64) ([]Team, error) {
	rows, err := s.DB.Query(ctx, `SELECT t.id,t.name,t.description,t.captain_id,m.athlete_id,a.full_name,a.organization,a.city,r.created_at FROM teams t
		LEFT JOIN team_members m ON m.team_id=t.id LEFT JOIN athletes a ON a.user_id=m.athlete_id
		LEFT JOIN registrations r ON r.competition_id=t.competition_id AND r.athlete_id=m.athlete_id
		WHERE t.competition_id=$1 ORDER BY t.id,a.full_name`, competitionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	teams := []Team{}
	for rows.Next() {
		var id int64
		var name string
		var description string
		var captainID *int64
		var athleteID *int64
		var fullName, org, city *string
		var createdAt *time.Time
		if err := rows.Scan(&id, &name, &description, &captainID, &athleteID, &fullName, &org, &city, &createdAt); err != nil {
			return nil, err
		}
		if len(teams) == 0 || teams[len(teams)-1].ID != id {
			team := Team{CompetitionID: competitionID, ID: id, Name: name, Description: description, Members: []Registration{}}
			if captainID != nil {
				team.CaptainID = *captainID
			}
			teams = append(teams, team)
		}
		if athleteID != nil {
			teams[len(teams)-1].Members = append(teams[len(teams)-1].Members, Registration{AthleteID: *athleteID, FullName: *fullName, Organization: *org, City: *city, CreatedAt: *createdAt})
		}
	}
	return teams, rows.Err()
}

func nullableID(id int64) any {
	if id == 0 {
		return nil
	}
	return id
}

func validateProtocol(format string, results []Result) error {
	if (format != "individual" && format != "team") || len(results) == 0 {
		return ErrInvalid
	}
	seen := map[int64]bool{}
	for _, result := range results {
		id := result.AthleteID
		if format == "team" {
			id = result.TeamID
		}
		if id <= 0 || seen[id] || result.Place < 1 || result.Place > len(results) || utf8.RuneCountInString(result.ScoreText) > 200 ||
			(format == "individual" && result.TeamID != 0) || (format == "team" && result.AthleteID != 0) {
			return ErrInvalid
		}
		seen[id] = true
	}
	return nil
}

func (s Service) PublishResults(ctx context.Context, competitionID, organizerID int64, results []Result) error {
	tx, err := s.DB.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	var format, stage, status string
	var endsAt time.Time
	err = tx.QueryRow(ctx, `SELECT format,stage,status,ends_at FROM competitions WHERE id=$1 FOR UPDATE`, competitionID).Scan(&format, &stage, &status, &endsAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrNotFound
	}
	if err != nil {
		return err
	}
	if status == "draft" {
		return ErrClosed
	}
	if endsAt.After(time.Now()) {
		return ErrNotFinished
	}
	if stage == "qualification" {
		var finalHasRegistrations bool
		if err := tx.QueryRow(ctx, `SELECT EXISTS (
			SELECT 1 FROM competitions final JOIN registrations r ON r.competition_id=final.id
			WHERE final.qualifying_competition_id=$1
		)`, competitionID).Scan(&finalHasRegistrations); err != nil {
			return err
		}
		if finalHasRegistrations {
			return ErrClosed
		}
	}
	if err := validateProtocol(format, results); err != nil {
		return err
	}
	entrantIDs := make([]int64, len(results))
	for i, r := range results {
		id := r.AthleteID
		if format == "team" {
			id = r.TeamID
		}
		entrantIDs[i] = id
	}
	var validCount int
	if format == "team" {
		err = tx.QueryRow(ctx, `SELECT count(DISTINCT t.id) FROM teams t JOIN team_members m ON m.team_id=t.id
			WHERE t.competition_id=$1 AND t.id=ANY($2::bigint[])`, competitionID, entrantIDs).Scan(&validCount)
	} else {
		err = tx.QueryRow(ctx, `SELECT count(*) FROM registrations WHERE competition_id=$1 AND athlete_id=ANY($2::bigint[])`, competitionID, entrantIDs).Scan(&validCount)
	}
	if err != nil {
		return err
	}
	if validCount != len(results) {
		return ErrInvalid
	}
	if _, err := tx.Exec(ctx, `DELETE FROM results WHERE competition_id=$1`, competitionID); err != nil {
		return err
	}
	rows := make([][]any, len(results))
	for i, r := range results {
		rows[i] = []any{competitionID, nullableID(r.AthleteID), nullableID(r.TeamID), r.Place, strings.TrimSpace(r.ScoreText)}
	}
	if _, err := tx.CopyFrom(ctx, pgx.Identifier{"results"}, []string{"competition_id", "athlete_id", "team_id", "place", "score_text"}, pgx.CopyFromRows(rows)); err != nil {
		return err
	}
	protocol, err := json.Marshal(results)
	if err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `INSERT INTO result_publications (competition_id,published_by,protocol) VALUES ($1,$2,$3)`, competitionID, organizerID, protocol); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `UPDATE competitions SET status='completed',updated_at=now() WHERE id=$1`, competitionID); err != nil {
		return err
	}
	if err := tx.Commit(ctx); err != nil {
		return err
	}
	// fetch title for notification (ignore error — best-effort)
	var title string
	_ = s.DB.QueryRow(ctx, `SELECT title FROM competitions WHERE id=$1`, competitionID).Scan(&title)
	go s.notifyResultsPublished(context.Background(), competitionID, title)
	return nil
}

func (s Service) notifyResultsPublished(ctx context.Context, competitionID int64, title string) {
	rows, err := s.DB.Query(ctx, `SELECT athlete_id FROM registrations WHERE competition_id=$1`, competitionID)
	if err != nil {
		return
	}
	defer rows.Close()
	var ids []int64
	for rows.Next() {
		var id int64
		if rows.Scan(&id) == nil {
			ids = append(ids, id)
		}
	}
	_ = rows.Err()
	notifTitle := "Опубликованы результаты: " + title
	link := fmt.Sprintf("/competitions/%d", competitionID)
	for _, id := range ids {
		_, _ = s.DB.Exec(ctx,
			`INSERT INTO notifications(user_id,kind,title,body,link) VALUES($1,'results_published',$2,'Проверьте ваше место и рейтинг.',$3)`,
			id, notifTitle, link)
	}
}

func (s Service) Results(ctx context.Context, competitionID int64) ([]Result, error) {
	rows, err := s.DB.Query(ctx, `SELECT r.id,COALESCE(r.athlete_id,0),COALESCE(r.team_id,0),r.place,r.score_text,COALESCE(a.full_name,t.name,'')
		FROM results r LEFT JOIN athletes a ON a.user_id=r.athlete_id LEFT JOIN teams t ON t.id=r.team_id
		WHERE r.competition_id=$1 ORDER BY r.place,r.id`, competitionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	results := []Result{}
	for rows.Next() {
		var r Result
		if err := rows.Scan(&r.ID, &r.AthleteID, &r.TeamID, &r.Place, &r.ScoreText, &r.Name); err != nil {
			return nil, err
		}
		results = append(results, r)
	}
	return results, rows.Err()
}

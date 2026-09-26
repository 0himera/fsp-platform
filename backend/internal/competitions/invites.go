package competitions

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"net/mail"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
)

type Invite struct {
	Email string `json:"email"`
	Token string `json:"token"`
}

func tokenValue() (string, []byte, error) {
	secret := make([]byte, 32)
	if _, err := rand.Read(secret); err != nil {
		return "", nil, err
	}
	token := base64.RawURLEncoding.EncodeToString(secret)
	hash := sha256.Sum256([]byte(token))
	return token, hash[:], nil
}

func (s Service) CreateCaptainTeam(ctx context.Context, competitionID, captainID int64, name, description string) (Team, string, error) {
	name = strings.TrimSpace(name)
	description = strings.TrimSpace(description)
	if utf8Len(name) < 2 || utf8Len(name) > 100 || utf8Len(description) > 500 {
		return Team{}, "", ErrInvalid
	}
	tx, err := s.DB.Begin(ctx)
	if err != nil {
		return Team{}, "", err
	}
	defer tx.Rollback(ctx)
	var format, status string
	var deadline time.Time
	var maxSize int
	err = tx.QueryRow(ctx, `SELECT format,status,registration_deadline,max_team_size FROM competitions WHERE id=$1 FOR UPDATE`, competitionID).Scan(&format, &status, &deadline, &maxSize)
	if errors.Is(err, pgx.ErrNoRows) {
		return Team{}, "", ErrNotFound
	}
	if err != nil {
		return Team{}, "", err
	}
	if format != "team" || status != "open" || !time.Now().Before(deadline) {
		return Team{}, "", ErrClosed
	}
	var id int64
	err = tx.QueryRow(ctx, `INSERT INTO teams(competition_id,name,description,captain_id) VALUES($1,$2,$3,$4) RETURNING id`, competitionID, name, description, captainID).Scan(&id)
	if err != nil {
		return Team{}, "", err
	}
	if _, err = tx.Exec(ctx, `INSERT INTO registrations(competition_id,athlete_id) VALUES($1,$2) ON CONFLICT DO NOTHING`, competitionID, captainID); err != nil {
		return Team{}, "", err
	}
	if _, err = tx.Exec(ctx, `INSERT INTO team_members(competition_id,team_id,athlete_id) VALUES($1,$2,$3)`, competitionID, id, captainID); err != nil {
		return Team{}, "", err
	}
	token, hash, err := tokenValue()
	if err != nil {
		return Team{}, "", err
	}
	if _, err = tx.Exec(ctx, `INSERT INTO team_invitations(competition_id,team_id,token_hash,expires_at) VALUES($1,$2,$3,$4)`, competitionID, id, hash, deadline); err != nil {
		return Team{}, "", err
	}
	if err = tx.Commit(ctx); err != nil {
		return Team{}, "", err
	}
	teams, err := s.Teams(ctx, competitionID)
	if err != nil {
		return Team{}, "", err
	}
	for _, team := range teams {
		if team.ID == id {
			return team, token, nil
		}
	}
	return Team{}, "", ErrNotFound
}

func (s Service) NewTeamInviteLink(ctx context.Context, competitionID, teamID, captainID int64) (string, error) {
	tx, err := s.DB.Begin(ctx)
	if err != nil {
		return "", err
	}
	defer tx.Rollback(ctx)
	var deadline time.Time
	var status string
	err = tx.QueryRow(ctx, `SELECT c.registration_deadline,c.status FROM competitions c JOIN teams t ON t.competition_id=c.id WHERE c.id=$1 AND t.id=$2 AND t.captain_id=$3 AND c.format='team' FOR UPDATE OF c,t`, competitionID, teamID, captainID).Scan(&deadline, &status)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", ErrNotCaptain
	}
	if err != nil {
		return "", err
	}
	if status != "open" || !time.Now().Before(deadline) {
		return "", ErrClosed
	}
	if _, err = tx.Exec(ctx, `DELETE FROM team_invitations WHERE team_id=$1 AND invite_email IS NULL`, teamID); err != nil {
		return "", err
	}
	token, hash, err := tokenValue()
	if err != nil {
		return "", err
	}
	if _, err = tx.Exec(ctx, `INSERT INTO team_invitations(competition_id,team_id,token_hash,expires_at) VALUES($1,$2,$3,$4)`, competitionID, teamID, hash, deadline); err != nil {
		return "", err
	}
	return token, tx.Commit(ctx)
}

func (s Service) CreateEmailInvites(ctx context.Context, competitionID, teamID, captainID int64, emails []string) ([]Invite, error) {
	if len(emails) == 0 || len(emails) > 5 {
		return nil, ErrInvalid
	}
	tx, err := s.DB.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)
	var deadline time.Time
	var status string
	var maxSize int
	err = tx.QueryRow(ctx, `SELECT c.registration_deadline,c.status,c.max_team_size FROM competitions c JOIN teams t ON t.competition_id=c.id WHERE c.id=$1 AND t.id=$2 AND t.captain_id=$3 AND c.format='team' FOR UPDATE OF c,t`, competitionID, teamID, captainID).Scan(&deadline, &status, &maxSize)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotCaptain
	}
	if err != nil {
		return nil, err
	}
	if status != "open" || !time.Now().Before(deadline) {
		return nil, ErrClosed
	}
	var members, pending int
	if err = tx.QueryRow(ctx, `SELECT count(*) FROM team_members WHERE team_id=$1`, teamID).Scan(&members); err != nil {
		return nil, err
	}
	if err = tx.QueryRow(ctx, `SELECT count(*) FROM team_invitations WHERE team_id=$1 AND invite_email IS NOT NULL AND accepted_at IS NULL AND expires_at>now()`, teamID).Scan(&pending); err != nil {
		return nil, err
	}
	if members+pending+len(emails) > maxSize {
		return nil, ErrTeamFull
	}
	seen := map[string]bool{}
	invites := make([]Invite, 0, len(emails))
	for _, value := range emails {
		address, parseErr := mail.ParseAddress(strings.TrimSpace(value))
		if parseErr != nil || address.Address != strings.TrimSpace(value) || seen[strings.ToLower(address.Address)] {
			return nil, ErrInvalid
		}
		email := strings.ToLower(address.Address)
		seen[email] = true
		if _, err = tx.Exec(ctx, `DELETE FROM team_invitations WHERE team_id=$1 AND lower(invite_email)=lower($2) AND accepted_at IS NULL`, teamID, email); err != nil {
			return nil, err
		}
		token, hash, tokenErr := tokenValue()
		if tokenErr != nil {
			return nil, tokenErr
		}
		if _, err = tx.Exec(ctx, `INSERT INTO team_invitations(competition_id,team_id,token_hash,invite_email,expires_at) VALUES($1,$2,$3,$4,$5)`, competitionID, teamID, hash, email, deadline); err != nil {
			return nil, err
		}
		invites = append(invites, Invite{Email: email, Token: token})
	}
	return invites, tx.Commit(ctx)
}

func (s Service) AcceptTeamInvite(ctx context.Context, token string, athleteID int64, email string) (Team, error) {
	hash := sha256.Sum256([]byte(token))
	tx, err := s.DB.Begin(ctx)
	if err != nil {
		return Team{}, err
	}
	defer tx.Rollback(ctx)
	var invitationID, competitionID, teamID int64
	err = tx.QueryRow(ctx, `SELECT id,competition_id,team_id FROM team_invitations WHERE token_hash=$1`, hash[:]).Scan(&invitationID, &competitionID, &teamID)
	if errors.Is(err, pgx.ErrNoRows) {
		return Team{}, ErrInvalidInvite
	}
	if err != nil {
		return Team{}, err
	}
	var deadline time.Time
	var status string
	var maxSize int
	err = tx.QueryRow(ctx, `SELECT c.registration_deadline,c.status,c.max_team_size FROM competitions c JOIN teams t ON t.competition_id=c.id WHERE c.id=$1 AND t.id=$2 FOR UPDATE OF c,t`, competitionID, teamID).Scan(&deadline, &status, &maxSize)
	if errors.Is(err, pgx.ErrNoRows) {
		return Team{}, ErrInvalidInvite
	}
	if err != nil {
		return Team{}, err
	}
	var inviteEmail *string
	var expiresAt time.Time
	var acceptedAt *time.Time
	err = tx.QueryRow(ctx, `SELECT invite_email,expires_at,accepted_at FROM team_invitations WHERE id=$1 AND token_hash=$2 FOR UPDATE`, invitationID, hash[:]).Scan(&inviteEmail, &expiresAt, &acceptedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return Team{}, ErrInvalidInvite
	}
	if err != nil {
		return Team{}, err
	}
	if !time.Now().Before(expiresAt) || (inviteEmail != nil && acceptedAt != nil) {
		return Team{}, ErrInvalidInvite
	}
	if status != "open" || !time.Now().Before(deadline) {
		return Team{}, ErrClosed
	}
	if inviteEmail != nil && !strings.EqualFold(*inviteEmail, email) {
		return Team{}, ErrInvalidInvite
	}
	var captainID int64
	if err = tx.QueryRow(ctx, `SELECT captain_id FROM teams WHERE id=$1 AND competition_id=$2 FOR UPDATE`, teamID, competitionID).Scan(&captainID); err != nil {
		return Team{}, ErrInvalidInvite
	}
	var existing bool
	if err = tx.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM team_members WHERE competition_id=$1 AND athlete_id=$2 AND team_id=$3)`, competitionID, athleteID, teamID).Scan(&existing); err != nil {
		return Team{}, err
	}
	if existing {
		if err = tx.Commit(ctx); err != nil {
			return Team{}, err
		}
		return s.teamByID(ctx, competitionID, teamID)
	}
	var count int
	if err = tx.QueryRow(ctx, `SELECT count(*) FROM team_members WHERE team_id=$1`, teamID).Scan(&count); err != nil {
		return Team{}, err
	}
	if count >= maxSize {
		return Team{}, ErrTeamFull
	}
	if _, err = tx.Exec(ctx, `INSERT INTO registrations(competition_id,athlete_id) VALUES($1,$2) ON CONFLICT DO NOTHING`, competitionID, athleteID); err != nil {
		return Team{}, err
	}
	if _, err = tx.Exec(ctx, `INSERT INTO team_members(competition_id,team_id,athlete_id) VALUES($1,$2,$3)`, competitionID, teamID, athleteID); err != nil {
		return Team{}, err
	}
	if inviteEmail != nil {
		if _, err = tx.Exec(ctx, `UPDATE team_invitations SET accepted_at=now() WHERE id=$1`, invitationID); err != nil {
			return Team{}, err
		}
	}
	if err = tx.Commit(ctx); err != nil {
		return Team{}, err
	}
	return s.teamByID(ctx, competitionID, teamID)
}

func (s Service) teamByID(ctx context.Context, competitionID, teamID int64) (Team, error) {
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

func (s Service) RemoveTeamMember(ctx context.Context, competitionID, teamID, captainID, athleteID int64) error {
	tx, err := s.DB.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	var owner int64
	var status string
	var deadline time.Time
	err = tx.QueryRow(ctx, `SELECT t.captain_id,c.status,c.registration_deadline FROM teams t JOIN competitions c ON c.id=t.competition_id WHERE t.id=$1 AND t.competition_id=$2 FOR UPDATE OF t,c`, teamID, competitionID).Scan(&owner, &status, &deadline)
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
	if athleteID == owner {
		return ErrInvalid
	}
	command, err := tx.Exec(ctx, `DELETE FROM registrations r USING team_members m WHERE r.competition_id=$1 AND r.athlete_id=$3 AND m.competition_id=r.competition_id AND m.athlete_id=r.athlete_id AND m.team_id=$2`, competitionID, teamID, athleteID)
	if err != nil {
		return err
	}
	if command.RowsAffected() == 0 {
		return ErrNotFound
	}
	return tx.Commit(ctx)
}

func utf8Len(value string) int { return len([]rune(value)) }

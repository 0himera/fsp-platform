package demo

import (
	"context"
	"errors"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/0himera/fsp-platform/internal/auth"
	"github.com/0himera/fsp-platform/internal/competitions"
	"github.com/0himera/fsp-platform/internal/platform"
	"github.com/0himera/fsp-platform/internal/rating"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

func TestSeedAndMainFlow(t *testing.T) {
	databaseURL := os.Getenv("TEST_DATABASE_URL")
	if databaseURL == "" {
		t.Skip("set TEST_DATABASE_URL to run the PostgreSQL integration test")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()
	admin, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(admin.Close)
	if err := admin.Ping(ctx); err != nil {
		t.Fatal(err)
	}
	schema := fmt.Sprintf("arena_test_%d", time.Now().UnixNano())
	identifier := pgx.Identifier{schema}.Sanitize()
	if _, err := admin.Exec(ctx, "CREATE SCHEMA "+identifier); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		cleanupCtx, done := context.WithTimeout(context.Background(), 10*time.Second)
		defer done()
		if _, err := admin.Exec(cleanupCtx, "DROP SCHEMA "+identifier+" CASCADE"); err != nil {
			t.Errorf("remove temporary schema: %v", err)
		}
	})
	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		t.Fatal(err)
	}
	if config.ConnConfig.RuntimeParams == nil {
		config.ConnConfig.RuntimeParams = map[string]string{}
	}
	config.ConnConfig.RuntimeParams["search_path"] = schema
	db, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(db.Close)
	if err := platform.Migrate(ctx, db, "../../migrations"); err != nil {
		t.Fatal(err)
	}
	organizerEmail := "organizer@arena.local"
	if err := (auth.Service{DB: db}).EnsureOrganizer(ctx, organizerEmail, "integration-demo-password"); err != nil {
		t.Fatal(err)
	}
	for i := 0; i < 2; i++ {
		if err := Seed(ctx, db, organizerEmail); err != nil {
			t.Fatalf("seed pass %d: %v", i+1, err)
		}
		var athletes, events, results, teams int
		if err := db.QueryRow(ctx, `SELECT (SELECT count(*) FROM athletes), (SELECT count(*) FROM competitions), (SELECT count(*) FROM results), (SELECT count(*) FROM teams)`).Scan(&athletes, &events, &results, &teams); err != nil {
			t.Fatal(err)
		}
		if athletes != 524 || events != 19 || results != 794 || teams != 6 {
			t.Fatalf("seed pass %d changed counts: athletes=%d events=%d results=%d teams=%d", i+1, athletes, events, results, teams)
		}
	}
	resultFor := func(email, title string) rating.Result {
		t.Helper()
		var id int64
		if err := db.QueryRow(ctx, `SELECT id FROM users WHERE email=$1`, email).Scan(&id); err != nil {
			t.Fatal(err)
		}
		athlete, err := (rating.Service{DB: db}).One(ctx, id, time.Now().UTC())
		if err != nil {
			t.Fatal(err)
		}
		for _, result := range athlete.Results {
			if result.Competition == title {
				return result
			}
		}
		t.Fatalf("result %q not found for %s", title, email)
		return rating.Result{}
	}
	large := resultFor("athlete5@arena.local", "Всероссийский турнир · Алгоритмы / Демо")
	if large.Place != 11 || large.Finishers != 20 || large.Points <= 0 {
		t.Fatalf("11th place in a large field: %+v", large)
	}
	last := resultFor("athlete18@arena.local", "Региональный дебют · Информационная безопасность / Демо")
	if last.Place != 6 || last.Finishers != 6 || last.Points != 0 {
		t.Fatalf("last place in a small field: %+v", last)
	}
	teamTitle := "Межрегиональный командный кубок · Алгоритмы / Демо"
	teamPoints := resultFor("athlete9@arena.local", teamTitle).Points
	if teamPoints <= 0 || resultFor("athlete13@arena.local", teamTitle).Points != teamPoints || resultFor("athlete21@arena.local", teamTitle).Points != teamPoints {
		t.Fatal("team members did not receive equal points")
	}
	qualifying := resultFor("mock001@arena.invalid", "Всероссийский кубок · Отбор / Демо")
	final := resultFor("mock001@arena.invalid", "Всероссийский кубок · Финал / Демо")
	if qualifying.Place != 1 || qualifying.Points != 0 || qualifying.Included || final.Place != 1 || final.Finishers != 200 || final.Points <= 0 {
		t.Fatalf("qualifier and final rating: qualifier=%+v final=%+v", qualifying, final)
	}
	if result := resultFor("mock250@arena.invalid", "Всероссийский кубок · Отбор / Демо"); result.Points != 0 || result.Place != 250 {
		t.Fatalf("non-finalist qualifier result: %+v", result)
	}

	var organizerID int64
	if err := db.QueryRow(ctx, `SELECT id FROM users WHERE email=$1`, organizerEmail).Scan(&organizerID); err != nil {
		t.Fatal(err)
	}
	service := competitions.Service{DB: db}
	now := time.Now().UTC()
	var qualifierID, eligibleID, ineligibleID int64
	if err := db.QueryRow(ctx, `SELECT id FROM competitions WHERE title='Всероссийский кубок · Отбор / Демо'`).Scan(&qualifierID); err != nil {
		t.Fatal(err)
	}
	if err := db.QueryRow(ctx, `SELECT id FROM users WHERE email='mock200@arena.invalid'`).Scan(&eligibleID); err != nil {
		t.Fatal(err)
	}
	if err := db.QueryRow(ctx, `SELECT id FROM users WHERE email='mock201@arena.invalid'`).Scan(&ineligibleID); err != nil {
		t.Fatal(err)
	}
	limit := 200
	openFinal, err := service.Create(ctx, competitions.Input{
		Title: "Проверка допуска в финал", LevelCode: "rf_championship", DisciplineCode: "algorithmic", Format: "individual", Stage: "final", QualifyingID: &qualifierID, QualifyingPlaceLimit: &limit,
		StartsAt: now.Add(10 * 24 * time.Hour), EndsAt: now.Add(10*24*time.Hour + 6*time.Hour), RegistrationDeadline: now.Add(8 * 24 * time.Hour), Status: "open",
	}, organizerID)
	if err != nil {
		t.Fatal(err)
	}
	if err := service.Register(ctx, openFinal.ID, eligibleID); err != nil {
		t.Fatalf("finalist denied: %v", err)
	}
	if err := service.Register(ctx, openFinal.ID, ineligibleID); !errors.Is(err, competitions.ErrNotQualified) {
		t.Fatalf("non-finalist admitted: %v", err)
	}
	stricterLimit := 100
	if _, err := service.Update(ctx, openFinal.ID, competitions.Input{
		Title: openFinal.Title, LevelCode: openFinal.LevelCode, DisciplineCode: openFinal.DisciplineCode, Format: openFinal.Format,
		Stage: "final", QualifyingID: &qualifierID, QualifyingPlaceLimit: &stricterLimit,
		StartsAt: openFinal.StartsAt, EndsAt: openFinal.EndsAt, RegistrationDeadline: openFinal.RegistrationDeadline, Status: "open",
	}); !errors.Is(err, competitions.ErrClosed) {
		t.Fatalf("final cutoff changed after registration: %v", err)
	}
	if err := service.PublishResults(ctx, qualifierID, organizerID, []competitions.Result{{AthleteID: eligibleID, Place: 1}}); !errors.Is(err, competitions.ErrClosed) {
		t.Fatalf("qualifier rewritten after final registration: %v", err)
	}
	account := auth.Service{DB: db}
	first, _, err := account.RegisterVerified(ctx, "flow-first@arena.local", "integration-demo-password", "Первый спортсмен", "ДГУ", "Махачкала")
	if err != nil {
		t.Fatal(err)
	}
	second, _, err := account.RegisterVerified(ctx, "flow-second@arena.local", "integration-demo-password", "Второй спортсмен", "ДГТУ", "Дербент")
	if err != nil {
		t.Fatal(err)
	}
	event, err := service.Create(ctx, competitions.Input{Title: "Интеграционный личный зачёт", LevelCode: "regional", DisciplineCode: "algorithmic", Format: "individual", StartsAt: now.Add(-time.Hour), EndsAt: now.Add(time.Hour), RegistrationDeadline: now.Add(30 * time.Minute), Status: "open"}, organizerID)
	if err != nil {
		t.Fatal(err)
	}
	for _, id := range []int64{first.ID, second.ID} {
		if err := service.Register(ctx, event.ID, id); err != nil {
			t.Fatal(err)
		}
	}
	if err := service.Register(ctx, event.ID, first.ID); !errors.Is(err, competitions.ErrConflict) {
		t.Fatalf("duplicate registration: %v", err)
	}
	registrations, err := service.Registrations(ctx, event.ID)
	if err != nil || len(registrations) != 2 {
		t.Fatalf("organizer registration list: %d entries, %v", len(registrations), err)
	}
	checkRating := func(winnerID, loserID int64) {
		t.Helper()
		winner, err := (rating.Service{DB: db}).One(ctx, winnerID, time.Now().UTC())
		if err != nil {
			t.Fatal(err)
		}
		loser, err := (rating.Service{DB: db}).One(ctx, loserID, time.Now().UTC())
		if err != nil {
			t.Fatal(err)
		}
		if winner.ResultPoints <= 0 || len(winner.Results) != 1 || winner.Results[0].CompetitionID != event.ID || loser.ResultPoints != 0 {
			t.Fatalf("rating did not follow protocol: winner=%+v loser=%+v", winner, loser)
		}
	}
	protocol := []competitions.Result{{AthleteID: first.ID, Place: 1}, {AthleteID: second.ID, Place: 2}}
	if err := service.PublishResults(ctx, event.ID, organizerID, protocol); !errors.Is(err, competitions.ErrNotFinished) {
		t.Fatalf("results accepted before competition ended: %v", err)
	}
	ended, err := service.Update(ctx, event.ID, competitions.Input{
		Title: event.Title, LevelCode: event.LevelCode, DisciplineCode: event.DisciplineCode, Format: event.Format,
		Stage: event.Stage, StartsAt: event.StartsAt, EndsAt: now.Add(-time.Minute), RegistrationDeadline: now.Add(-2 * time.Minute), Status: "running",
	})
	if err != nil {
		t.Fatalf("mark competition as ended: %v", err)
	}
	if err := service.PublishResults(ctx, event.ID, organizerID, protocol); err != nil {
		t.Fatal(err)
	}
	checkRating(first.ID, second.ID)
	stored, err := service.Get(ctx, event.ID)
	if err != nil || stored.Status != "completed" || stored.ResultsCount != 2 || !stored.EndsAt.Equal(ended.EndsAt) {
		t.Fatalf("published event: %+v, %v", stored, err)
	}
	if err := service.PublishResults(ctx, event.ID, organizerID, []competitions.Result{{AthleteID: first.ID, Place: 2}, {AthleteID: second.ID, Place: 1}}); err != nil {
		t.Fatal(err)
	}
	checkRating(second.ID, first.ID)
	var publications int
	if err := db.QueryRow(ctx, `SELECT count(*) FROM result_publications WHERE competition_id=$1`, event.ID).Scan(&publications); err != nil || publications != 2 {
		t.Fatalf("publication history: count=%d, err=%v", publications, err)
	}
}

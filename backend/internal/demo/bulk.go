package demo

import (
	"context"
	"fmt"
	"time"

	"github.com/0himera/fsp-platform/internal/competitions"
	"github.com/jackc/pgx/v5/pgxpool"
)

const syntheticAthleteCount = 500

var syntheticGivenNames = []string{
	"Амин", "Амина", "Расул", "Патимат", "Магомед", "Марьям", "Саид", "Зарина", "Тимур", "Мадина",
	"Ислам", "Фатима", "Арсен", "Самира", "Ибрагим", "Хадижат", "Руслан", "Саида", "Юсуф", "Милана",
	"Камиль", "Рания", "Ахмед", "Зарема", "Абдурахман",
}

var syntheticFamilyNames = []string{
	"Алиев", "Гаджиев", "Исаев", "Курбанов", "Омаров", "Магомедов", "Салихов", "Шарипов", "Ахмедов", "Абдуллаев",
	"Абакаров", "Гасанов", "Муртазалиев", "Агаев", "Османов", "Нурмагомедов", "Джабраилов", "Сулейманов", "Мусаев", "Бекбулатов",
}

func syntheticEmail(index int) string {
	return fmt.Sprintf("mock%03d@arena.invalid", index+1)
}

// These synthetic profiles have deliberately disabled passwords. The featured
// demo athletes remain available for sign-in; bulk profiles exist for scale.
func seedSyntheticAthletes(ctx context.Context, db *pgxpool.Pool) ([]int64, error) {
	if len(syntheticGivenNames)*len(syntheticFamilyNames) != syntheticAthleteCount {
		return nil, fmt.Errorf("synthetic name combinations must equal %d", syntheticAthleteCount)
	}
	cities := []string{"Махачкала", "Каспийск", "Дербент", "Хасавюрт", "Избербаш", "Буйнакск", "Кизляр", "Кизилюрт", "Дагестанские Огни", "Южно-Сухокумск"}
	organizations := []string{"ДГУ", "ДГТУ", "ДГПУ", "Колледж ИТ", "Лицей 39", "Школа 12", "ИТ-клуб", "Технопарк"}
	disciplines := []string{"algorithmic", "security", "robotics", "product", "uav"}
	femaleNames := map[string]bool{"Амина": true, "Патимат": true, "Марьям": true, "Зарина": true, "Мадина": true, "Фатима": true, "Самира": true, "Хадижат": true, "Саида": true, "Милана": true, "Рания": true, "Зарема": true}
	emails := make([]string, syntheticAthleteCount)
	names := make([]string, syntheticAthleteCount)
	cityNames := make([]string, syntheticAthleteCount)
	organizationNames := make([]string, syntheticAthleteCount)
	ranks := make([]string, syntheticAthleteCount)
	disciplineCodes := make([]string, syntheticAthleteCount)
	for i := range emails {
		emails[i] = syntheticEmail(i)
		givenName := syntheticGivenNames[i%len(syntheticGivenNames)]
		familyName := syntheticFamilyNames[i/len(syntheticGivenNames)]
		if femaleNames[givenName] {
			familyName += "а"
		}
		names[i] = givenName + " " + familyName
		cityNames[i] = cities[(i*7)%len(cities)]
		organizationNames[i] = organizations[(i*3)%len(organizations)]
		disciplineCodes[i] = disciplines[i%len(disciplines)]
		ranks[i] = "none"
		switch {
		case i%97 == 0:
			ranks[i] = "MS"
		case i%37 == 0:
			ranks[i] = "KMS"
		case i%11 == 0:
			ranks[i] = "I"
		case i%7 == 0:
			ranks[i] = "II"
		case i%3 == 0:
			ranks[i] = "III"
		}
	}
	if _, err := db.Exec(ctx, `INSERT INTO users (email,password_hash,role)
		SELECT input.email,'disabled-synthetic-profile','athlete' FROM unnest($1::text[]) AS input(email)
		ON CONFLICT DO NOTHING`, emails); err != nil {
		return nil, err
	}
	if _, err := db.Exec(ctx, `INSERT INTO athletes (user_id,full_name,organization,city,rank_code)
		SELECT u.id,input.full_name,input.organization,input.city,input.rank_code
		FROM unnest($1::text[],$2::text[],$3::text[],$4::text[],$5::text[]) AS input(email,full_name,organization,city,rank_code)
		JOIN users u ON u.email=input.email AND u.role='athlete'
		ON CONFLICT (user_id) DO NOTHING`, emails, names, organizationNames, cityNames, ranks); err != nil {
		return nil, err
	}
	if _, err := db.Exec(ctx, `INSERT INTO athlete_disciplines (athlete_id,discipline_code)
		SELECT u.id,input.discipline_code FROM unnest($1::text[],$2::text[]) AS input(email,discipline_code)
		JOIN users u ON u.email=input.email AND u.role='athlete'
		ON CONFLICT DO NOTHING`, emails, disciplineCodes); err != nil {
		return nil, err
	}
	rows, err := db.Query(ctx, `SELECT id,email FROM users WHERE role='athlete' AND email=ANY($1::text[])`, emails)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	ids := make([]int64, syntheticAthleteCount)
	byEmail := make(map[string]int, syntheticAthleteCount)
	for i, email := range emails {
		byEmail[email] = i
	}
	count := 0
	for rows.Next() {
		var id int64
		var email string
		if err := rows.Scan(&id, &email); err != nil {
			return nil, err
		}
		ids[byEmail[email]] = id
		count++
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if count != syntheticAthleteCount {
		return nil, fmt.Errorf("synthetic athletes found: %d of %d", count, syntheticAthleteCount)
	}
	return ids, nil
}

type competitionCreator func(competitions.Input) (int64, bool, error)

func seedLargeEvents(ctx context.Context, db *pgxpool.Pool, organizerID int64, ids []int64, create competitionCreator) error {
	now := time.Now().UTC().Truncate(time.Minute)
	service := competitions.Service{DB: db}
	seedCompleted := func(in competitions.Input, entrants []int64) (int64, error) {
		id, fresh, err := create(in)
		if err != nil || !fresh {
			return id, err
		}
		if _, err := db.Exec(ctx, `INSERT INTO registrations (competition_id,athlete_id)
			SELECT $1,entrant FROM unnest($2::bigint[]) AS input(entrant)`, id, entrants); err != nil {
			return 0, fmt.Errorf("register %s: %w", in.Title, err)
		}
		results := make([]competitions.Result, len(entrants))
		for i, athleteID := range entrants {
			results[i] = competitions.Result{AthleteID: athleteID, Place: i + 1, ScoreText: fmt.Sprintf("%d баллов", len(entrants)-i)}
		}
		if err := service.PublishResults(ctx, id, organizerID, results); err != nil {
			return 0, fmt.Errorf("publish %s: %w", in.Title, err)
		}
		return id, nil
	}
	qualifierID, err := seedCompleted(competitions.Input{
		Title: "Всероссийский кубок · Отбор / Демо", LevelCode: "rf_championship", DisciplineCode: "algorithmic", Format: "individual", Stage: "qualification",
		StartsAt: now.AddDate(0, 0, -70), EndsAt: now.AddDate(0, 0, -70).Add(6 * time.Hour), RegistrationDeadline: now.AddDate(0, 0, -72),
		Location: "Онлайн", Description: "Отбор на 300 человек. Протокол определяет финалистов, но не даёт рейтинговых очков.", Status: "running",
	}, ids[:300])
	if err != nil {
		return err
	}
	finalistLimit := 200
	if _, err := seedCompleted(competitions.Input{
		Title: "Всероссийский кубок · Финал / Демо", LevelCode: "rf_championship", DisciplineCode: "algorithmic", Format: "individual", Stage: "final", QualifyingID: &qualifierID, QualifyingPlaceLimit: &finalistLimit,
		StartsAt: now.AddDate(0, 0, -55), EndsAt: now.AddDate(0, 0, -55).Add(6 * time.Hour), RegistrationDeadline: now.AddDate(0, 0, -57),
		Location: "Махачкала", Description: "Финал на 200 человек из опубликованного отбора. Рейтинговые очки начисляются только за финал.", Status: "running",
	}, ids[:200]); err != nil {
		return err
	}
	if _, err := seedCompleted(competitions.Input{
		Title: "Кубок России · Информационная безопасность / Демо", LevelCode: "rf_championship", DisciplineCode: "security", Format: "individual", Stage: "standalone",
		StartsAt: now.AddDate(0, 0, -25), EndsAt: now.AddDate(0, 0, -25).Add(7 * time.Hour), RegistrationDeadline: now.AddDate(0, 0, -27),
		Location: "Каспийск", Description: "Большой личный зачёт с 200 финишировавшими.", Status: "running",
	}, ids[250:450]); err != nil {
		return err
	}
	open := competitions.Input{
		Title: "Чемпионат Дагестана · Алгоритмы / Демо", LevelCode: "rd_championship", DisciplineCode: "algorithmic", Format: "individual", Stage: "standalone",
		StartsAt: now.AddDate(0, 0, 21), EndsAt: now.AddDate(0, 0, 21).Add(6 * time.Hour), RegistrationDeadline: now.AddDate(0, 0, 19),
		Location: "Дербент", Description: "Предстоящий старт с 200 демонстрационными заявками.", Status: "open",
	}
	id, fresh, err := create(open)
	if err != nil {
		return err
	}
	if fresh {
		if _, err := db.Exec(ctx, `INSERT INTO registrations (competition_id,athlete_id)
			SELECT $1,entrant FROM unnest($2::bigint[]) AS input(entrant)`, id, ids[300:500]); err != nil {
			return err
		}
	}
	return nil
}

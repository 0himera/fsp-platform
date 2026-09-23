package demo

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/0himera/fsp-platform/internal/auth"
	"github.com/0himera/fsp-platform/internal/competitions"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type demoAthlete struct {
	name, city, organization, rank, discipline string
}

var athleteData = []demoAthlete{
	{"Амина Алиева", "Махачкала", "ДГУ", "KMS", "algorithmic"},
	{"Магомед Исаев", "Каспийск", "ДГТУ", "MS", "algorithmic"},
	{"Патимат Курбанова", "Дербент", "ДГУ", "I", "product"},
	{"Расул Салихов", "Махачкала", "ДГТУ", "II", "security"},
	{"Зарина Магомедова", "Хасавюрт", "Школа 12", "I", "algorithmic"},
	{"Ислам Гаджиев", "Махачкала", "ДГУ", "KMS", "security"},
	{"Мадина Шарипова", "Избербаш", "Колледж ИТ", "III", "product"},
	{"Руслан Ахмедов", "Буйнакск", "ДГТУ", "none", "robotics"},
}

func Seed(ctx context.Context, db *pgxpool.Pool, organizerEmail string) error {
	var organizerID int64
	if err := db.QueryRow(ctx, `SELECT id FROM users WHERE lower(email)=lower($1) AND role='organizer'`, organizerEmail).Scan(&organizerID); err != nil {
		return fmt.Errorf("organizer seed account required: %w", err)
	}
	ids := make([]int64, len(athleteData))
	for i, data := range athleteData {
		email := fmt.Sprintf("athlete%d@arena.local", i+1)
		fresh := false
		err := db.QueryRow(ctx, `SELECT id FROM users WHERE email=$1`, email).Scan(&ids[i])
		if errors.Is(err, pgx.ErrNoRows) {
			user, _, err := (auth.Service{DB: db}).Register(ctx, email, "demo-athlete-2026", data.name, data.organization, data.city)
			if err != nil {
				return err
			}
			ids[i] = user.ID
			fresh = true
		} else if err != nil {
			return err
		}
		if fresh {
			if _, err := db.Exec(ctx, `UPDATE athletes SET rank_code=$2 WHERE user_id=$1`, ids[i], data.rank); err != nil {
				return err
			}
			if _, err := db.Exec(ctx, `INSERT INTO athlete_disciplines (athlete_id,discipline_code) VALUES ($1,$2)`, ids[i], data.discipline); err != nil {
				return err
			}
		}
	}
	now := time.Now().UTC().Truncate(time.Minute)
	service := competitions.Service{DB: db}
	create := func(in competitions.Input) (int64, bool, error) {
		var id int64
		err := db.QueryRow(ctx, `SELECT id FROM competitions WHERE title=$1`, in.Title).Scan(&id)
		if err == nil {
			return id, false, nil
		}
		if !errors.Is(err, pgx.ErrNoRows) {
			return 0, false, err
		}
		item, err := service.Create(ctx, in, organizerID)
		return item.ID, true, err
	}
	completed := []struct {
		input   competitions.Input
		players []int
		places  []int
	}{
		{competitions.Input{Title: "Кубок России · Алгоритмы / Демо", LevelCode: "rf_championship", DisciplineCode: "algorithmic", Format: "individual", StartsAt: now.AddDate(0, -2, 0), EndsAt: now.AddDate(0, -2, 0).Add(5 * time.Hour), RegistrationDeadline: now.AddDate(0, -2, -2), Location: "Москва", Description: "Демонстрационный протокол для проверки рейтинга и истории выступлений.", Status: "running"}, []int{0, 1, 2, 3, 4, 5, 6, 7}, []int{1, 2, 3, 4, 5, 6, 7, 8}},
		{competitions.Input{Title: "Чемпионат Дагестана · Информационная безопасность / Демо", LevelCode: "rd_championship", DisciplineCode: "security", Format: "individual", StartsAt: now.AddDate(0, -1, 0), EndsAt: now.AddDate(0, -1, 0).Add(4 * time.Hour), RegistrationDeadline: now.AddDate(0, -1, -2), Location: "Махачкала", Description: "Демонстрационные данные. Результаты подтверждены организатором.", Status: "running"}, []int{5, 3, 0, 1, 2, 4}, []int{1, 2, 3, 4, 5, 6}},
	}
	for _, event := range completed {
		id, fresh, err := create(event.input)
		if err != nil {
			return err
		}
		if !fresh {
			continue
		}
		results := make([]competitions.Result, len(event.players))
		for j, player := range event.players {
			if _, err := db.Exec(ctx, `INSERT INTO registrations (competition_id,athlete_id) VALUES ($1,$2)`, id, ids[player]); err != nil {
				return err
			}
			results[j] = competitions.Result{AthleteID: ids[player], Place: event.places[j], ScoreText: fmt.Sprintf("%d задач", len(event.players)-j)}
		}
		if err := service.PublishResults(ctx, id, organizerID, results); err != nil {
			return err
		}
	}
	teamEvent := competitions.Input{Title: "Продуктовый хакатон Республики · Команды / Демо", LevelCode: "rd_championship", DisciplineCode: "product", Format: "team", StartsAt: now.AddDate(0, 0, -20), EndsAt: now.AddDate(0, 0, -20).Add(8 * time.Hour), RegistrationDeadline: now.AddDate(0, 0, -21), Location: "Дербент", Description: "Демонстрационный командный протокол: каждый участник итогового состава получает одинаковые очки.", Status: "running"}
	if id, fresh, err := create(teamEvent); err != nil {
		return err
	} else if fresh {
		for _, player := range []int{0, 2, 4, 1, 5, 6} {
			if _, err := db.Exec(ctx, `INSERT INTO registrations (competition_id,athlete_id) VALUES ($1,$2)`, id, ids[player]); err != nil {
				return err
			}
		}
		first, err := service.CreateTeam(ctx, id, "Код Каспия", []int64{ids[0], ids[2], ids[4]})
		if err != nil {
			return err
		}
		second, err := service.CreateTeam(ctx, id, "Бинарный берег", []int64{ids[1], ids[5], ids[6]})
		if err != nil {
			return err
		}
		if err := service.PublishResults(ctx, id, organizerID, []competitions.Result{{TeamID: first.ID, Place: 1, ScoreText: "92 балла жюри"}, {TeamID: second.ID, Place: 2, ScoreText: "86 баллов жюри"}}); err != nil {
			return err
		}
	}
	_, _, err := create(competitions.Input{Title: "Code Sprint: алгоритмический зачёт", LevelCode: "regional", DisciplineCode: "algorithmic", Format: "individual", StartsAt: now.Add(-time.Hour), EndsAt: now.Add(5 * time.Hour), RegistrationDeadline: now.Add(3 * time.Hour), Location: "Махачкала · ТехноСпортФест", Description: "Открытый демонстрационный старт. Зарегистрируйтесь, затем организатор сможет опубликовать протокол и обновить рейтинг.", Status: "open"})
	if err != nil {
		return err
	}
	_, _, err = create(competitions.Input{Title: "Межрегиональный кубок по спортивному программированию", LevelCode: "interregional", DisciplineCode: "security", Format: "team", StartsAt: now.AddDate(0, 0, 14), EndsAt: now.AddDate(0, 0, 14).Add(6 * time.Hour), RegistrationDeadline: now.AddDate(0, 0, 12), Location: "Каспийск", Description: "Командный старт по защите информационных систем. Составы формируются из зарегистрированных спортсменов.", Status: "open"})
	return err
}

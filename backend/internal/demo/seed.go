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
	{"Саид Абдуллаев", "Махачкала", "ДГУ", "KMS", "algorithmic"},
	{"Марьям Абакарова", "Кизляр", "ДГТУ", "II", "robotics"},
	{"Тимур Алиев", "Дербент", "ДГУ", "I", "product"},
	{"Фатима Омарова", "Махачкала", "Лицей 39", "III", "security"},
	{"Ахмед Нурмагомедов", "Хасавюрт", "ДГТУ", "MS", "algorithmic"},
	{"Самира Магомедова", "Каспийск", "ДГУ", "none", "uav"},
	{"Ибрагим Курбанов", "Избербаш", "Колледж ИТ", "II", "robotics"},
	{"Хадижат Гасанова", "Махачкала", "ДГПУ", "I", "product"},
	{"Арсен Муртазалиев", "Дербент", "ДГУ", "KMS", "security"},
	{"Саида Агаева", "Каспийск", "ДГТУ", "III", "algorithmic"},
	{"Юсуф Магомедов", "Кизилюрт", "Колледж ИТ", "II", "uav"},
	{"Милана Алиева", "Буйнакск", "ДГУ", "none", "product"},
	{"Абдурахман Исаев", "Махачкала", "ДГТУ", "MSMK", "algorithmic"},
	{"Зарема Османова", "Дербент", "ДГУ", "MS", "robotics"},
	{"Камиль Абдулаев", "Каспийск", "ДГУ", "ZMS", "security"},
	{"Рания Гаджиева", "Махачкала", "Лицей 39", "I", "uav"},
}

func sequence(n int) []int {
	values := make([]int, n)
	for i := range values {
		values[i] = i + 1
	}
	return values
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
		{competitions.Input{Title: "Всероссийский турнир · Алгоритмы / Демо", LevelCode: "all_russian", DisciplineCode: "algorithmic", Format: "individual", StartsAt: now.AddDate(0, 0, -120), EndsAt: now.AddDate(0, 0, -120).Add(6 * time.Hour), RegistrationDeadline: now.AddDate(0, 0, -122), Location: "Онлайн", Description: "Большая сетка: участники за пределами топ-10 тоже получают очки за результативное выступление.", Status: "running"}, []int{8, 12, 20, 0, 17, 1, 9, 10, 2, 21, 4, 13, 3, 15, 5, 18, 6, 16, 7, 19}, sequence(20)},
		{competitions.Input{Title: "Межрегиональный старт · Робототехника / Демо", LevelCode: "interregional", DisciplineCode: "robotics", Format: "individual", StartsAt: now.AddDate(0, 0, -95), EndsAt: now.AddDate(0, 0, -95).Add(5 * time.Hour), RegistrationDeadline: now.AddDate(0, 0, -97), Location: "Каспийск", Description: "Две бронзы и два пятых места в итоговом протоколе.", Status: "running"}, []int{21, 9, 7, 14, 0, 10, 11, 2, 12, 15, 3, 4, 5, 6, 8, 17}, []int{1, 2, 3, 3, 5, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16}},
		{competitions.Input{Title: "Кубок Дагестана · Продуктовое программирование / Демо", LevelCode: "rd_championship", DisciplineCode: "product", Format: "individual", StartsAt: now.AddDate(0, 0, -260), EndsAt: now.AddDate(0, 0, -260).Add(8 * time.Hour), RegistrationDeadline: now.AddDate(0, 0, -262), Location: "Дербент", Description: "Личный зачёт по продуктовой дисциплине.", Status: "running"}, []int{15, 2, 10, 6, 19, 8, 0, 11, 13, 14, 1, 7}, sequence(12)},
		{competitions.Input{Title: "Региональный осенний кубок · Алгоритмы / Демо", LevelCode: "regional", DisciplineCode: "algorithmic", Format: "individual", StartsAt: now.AddDate(0, 0, -420), EndsAt: now.AddDate(0, 0, -420).Add(4 * time.Hour), RegistrationDeadline: now.AddDate(0, 0, -422), Location: "Махачкала", Description: "Прошлогодний результат показывает плавное снижение баллов со временем.", Status: "running"}, []int{4, 1, 8, 12, 17, 20, 0, 3}, sequence(8)},
		{competitions.Input{Title: "Республиканский отбор · БПЛА / Демо", LevelCode: "regional", DisciplineCode: "uav", Format: "individual", StartsAt: now.AddDate(0, 0, -30), EndsAt: now.AddDate(0, 0, -30).Add(5 * time.Hour), RegistrationDeadline: now.AddDate(0, 0, -32), Location: "Избербаш", Description: "Отдельная дисциплина и недавний старт.", Status: "running"}, []int{23, 13, 18, 11, 9, 14, 17, 22, 7, 5, 6, 19}, sequence(12)},
		{competitions.Input{Title: "Региональный дебют · Информационная безопасность / Демо", LevelCode: "regional", DisciplineCode: "security", Format: "individual", StartsAt: now.AddDate(0, 0, -10), EndsAt: now.AddDate(0, 0, -10).Add(3 * time.Hour), RegistrationDeadline: now.AddDate(0, 0, -12), Location: "Кизляр", Description: "Малая сетка: последнее место не даёт рейтинговых баллов.", Status: "running"}, []int{16, 22, 5, 11, 3, 17}, sequence(6)},
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
	secondTeamEvent := competitions.Input{Title: "Межрегиональный командный кубок · Алгоритмы / Демо", LevelCode: "interregional", DisciplineCode: "algorithmic", Format: "team", StartsAt: now.AddDate(0, 0, -55), EndsAt: now.AddDate(0, 0, -55).Add(6 * time.Hour), RegistrationDeadline: now.AddDate(0, 0, -57), Location: "Каспийск", Description: "Четыре команды: очки начисляются каждому участнику опубликованного состава.", Status: "running"}
	if id, fresh, err := create(secondTeamEvent); err != nil {
		return err
	} else if fresh {
		members := [][]int{{8, 12, 20}, {0, 1, 17}, {3, 5, 16}, {2, 10, 15}}
		names := []string{"Горцы кода", "Каспийский стек", "Цифровой Дербент", "Модуль ДГУ"}
		results := make([]competitions.Result, 0, len(members))
		for place, teamMembers := range members {
			memberIDs := make([]int64, 0, len(teamMembers))
			for _, player := range teamMembers {
				if _, err := db.Exec(ctx, `INSERT INTO registrations (competition_id,athlete_id) VALUES ($1,$2)`, id, ids[player]); err != nil {
					return err
				}
				memberIDs = append(memberIDs, ids[player])
			}
			team, err := service.CreateTeam(ctx, id, names[place], memberIDs)
			if err != nil {
				return err
			}
			results = append(results, competitions.Result{TeamID: team.ID, Place: place + 1, ScoreText: fmt.Sprintf("%d баллов", 96-place*7)})
		}
		if err := service.PublishResults(ctx, id, organizerID, results); err != nil {
			return err
		}
	}
	_, _, err := create(competitions.Input{Title: "Code Sprint: алгоритмический зачёт", LevelCode: "regional", DisciplineCode: "algorithmic", Format: "individual", StartsAt: now.Add(-time.Hour), EndsAt: now.Add(5 * time.Hour), RegistrationDeadline: now.Add(3 * time.Hour), Location: "Махачкала · ТехноСпортФест", Description: "Открытый демонстрационный старт. Зарегистрируйтесь, затем организатор сможет опубликовать протокол и обновить рейтинг.", Status: "open"})
	if err != nil {
		return err
	}
	_, _, err = create(competitions.Input{Title: "Межрегиональный кубок по спортивному программированию", LevelCode: "interregional", DisciplineCode: "security", Format: "team", StartsAt: now.AddDate(0, 0, 14), EndsAt: now.AddDate(0, 0, 14).Add(6 * time.Hour), RegistrationDeadline: now.AddDate(0, 0, 12), Location: "Каспийск", Description: "Командный старт по защите информационных систем. Составы формируются из зарегистрированных спортсменов.", Status: "open"})
	if err != nil {
		return err
	}
	openEvents := []struct {
		input   competitions.Input
		players []int
	}{
		{competitions.Input{Title: "Осенний кубок ДГУ · Продуктовое программирование / Демо", LevelCode: "regional", DisciplineCode: "product", Format: "individual", StartsAt: now.AddDate(0, 0, 10), EndsAt: now.AddDate(0, 0, 10).Add(5 * time.Hour), RegistrationDeadline: now.AddDate(0, 0, 8), Location: "Махачкала", Description: "Открыта регистрация на личный зачёт.", Status: "open"}, []int{2, 6, 10, 15, 19, 8, 0, 11}},
		{competitions.Input{Title: "Всероссийский онлайн-турнир · Алгоритмы / Демо", LevelCode: "all_russian", DisciplineCode: "algorithmic", Format: "individual", StartsAt: now.AddDate(0, 0, 30), EndsAt: now.AddDate(0, 0, 30).Add(6 * time.Hour), RegistrationDeadline: now.AddDate(0, 0, 28), Location: "Онлайн", Description: "Всероссийский старт с открытой регистрацией.", Status: "open"}, []int{0, 1, 4, 8, 12, 17, 20, 21, 22, 23, 9, 14}},
		{competitions.Input{Title: "Зимний чемпионат Дагестана · БПЛА / Демо", LevelCode: "rd_championship", DisciplineCode: "uav", Format: "individual", StartsAt: now.AddDate(0, 0, 60), EndsAt: now.AddDate(0, 0, 60).Add(7 * time.Hour), RegistrationDeadline: now.AddDate(0, 0, 58), Location: "Дербент", Description: "Предстоящий республиканский чемпионат.", Status: "open"}, []int{13, 18, 23}},
	}
	for _, event := range openEvents {
		id, fresh, err := create(event.input)
		if err != nil {
			return err
		}
		if !fresh {
			continue
		}
		for _, player := range event.players {
			if _, err := db.Exec(ctx, `INSERT INTO registrations (competition_id,athlete_id) VALUES ($1,$2)`, id, ids[player]); err != nil {
				return err
			}
		}
	}
	bulkIDs, err := seedSyntheticAthletes(ctx, db)
	if err != nil {
		return err
	}
	return seedLargeEvents(ctx, db, organizerID, bulkIDs, create)
}

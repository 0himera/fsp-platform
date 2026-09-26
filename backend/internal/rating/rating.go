package rating

import (
	"context"
	"errors"
	"fmt"
	"math"
	"sort"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

const RulesVersion = "arena-2"

var ErrNotFound = errors.New("athlete not found")

var levelBase = map[string]float64{
	"rf_championship": 1000,
	"all_russian":     650,
	"interregional":   400,
	"rd_championship": 250,
	"regional":        120,
}

var rankBonus = map[string]float64{
	"none": 0, "III": 10, "II": 20, "I": 45,
	"KMS": 80, "MS": 130, "MSMK": 180, "ZMS": 250,
}

type Result struct {
	CompetitionID int64     `json:"competition_id"`
	Competition   string    `json:"competition"`
	Discipline    string    `json:"discipline"`
	Level         string    `json:"level"`
	Stage         string    `json:"stage"`
	EndsAt        time.Time `json:"ends_at"`
	Place         int       `json:"place"`
	ScoreText     string    `json:"score_text"`
	Finishers     int       `json:"finishers"`
	Base          float64   `json:"base"`
	PlaceFactor   float64   `json:"place_factor"`
	SizeFactor    float64   `json:"size_factor"`
	Relative      float64   `json:"relative_factor"`
	Decay         float64   `json:"decay"`
	Points        float64   `json:"points"`
	Included      bool      `json:"included"`
}

type Achievement struct {
	Code        string    `json:"code"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Kind        string    `json:"kind"`
	Date        time.Time `json:"date"`
}

type Athlete struct {
	ID                  int64         `json:"id"`
	FullName            string        `json:"full_name"`
	City                string        `json:"city"`
	Organization        string        `json:"organization"`
	RankCode            string        `json:"rank_code"`
	Disciplines         []string      `json:"disciplines"`
	Place               int           `json:"rating_place"`
	Total               float64       `json:"rating"`
	ResultPoints        float64       `json:"result_points"`
	RankBase            float64       `json:"rank_base"`
	Activity            float64       `json:"activity_factor"`
	RankPoints          float64       `json:"rank_points"`
	Results             []Result      `json:"results"`
	RulesVersion        string        `json:"rules_version"`
	AvatarURL           string        `json:"avatar_url"`
	Achievements        []Achievement `json:"achievements"`
	FeaturedAchievement *Achievement  `json:"featured_achievement"`
	FeaturedCode        string        `json:"-"`
	CodeforcesHandle    string        `json:"codeforces_handle"`
}

func achievements(results []Result) []Achievement {
	items := []Achievement{}
	ordered := append([]Result(nil), results...)
	sort.Slice(ordered, func(i, j int) bool { return ordered[i].EndsAt.Before(ordered[j].EndsAt) })
	if len(ordered) == 0 {
		return items
	}
	items = append(items, Achievement{Code: "first-start", Title: "Первый старт", Description: "Участие в официальном соревновании", Kind: "first", Date: ordered[0].EndsAt})
	for _, result := range ordered {
		if result.Stage == "qualification" {
			continue
		}
		if result.Points > 0 && result.Place == 1 {
			items = append(items, Achievement{Code: fmt.Sprintf("win-%d", result.CompetitionID), Title: "Победа", Description: result.Competition, Kind: "win", Date: result.EndsAt})
		}
		if result.Points > 0 && result.Place > 1 && result.Place <= 3 {
			items = append(items, Achievement{Code: fmt.Sprintf("podium-%d", result.CompetitionID), Title: "Призовое место", Description: result.Competition, Kind: "podium", Date: result.EndsAt})
		}
		if result.Points > 0 && result.Stage == "final" {
			items = append(items, Achievement{Code: fmt.Sprintf("final-%d", result.CompetitionID), Title: "Финалист", Description: result.Competition, Kind: "final", Date: result.EndsAt})
		}
	}
	for milestone := 5; milestone <= len(ordered); milestone += 5 {
		items = append(items, Achievement{Code: fmt.Sprintf("starts-%d", milestone), Title: fmt.Sprintf("%d стартов", milestone), Description: "Опубликованные результаты", Kind: "series", Date: ordered[milestone-1].EndsAt})
	}
	return items
}

func round(v float64) float64 { return math.Round(v*100) / 100 }

func Decay(days float64) float64 {
	if days <= 0 {
		return 1
	}
	if days < 730 {
		return 1 - 0.3*days/365
	}
	if days < 1095 {
		return 0.4 * (1095 - days) / 365
	}
	return 0
}

func Activity(days float64) float64 {
	return math.Max(0, math.Min(1, 1-days/730))
}

func placeFactor(place int) float64 {
	switch place {
	case 1:
		return 1
	case 2:
		return 0.7
	case 3:
		return 0.5
	case 4, 5:
		return 0.3
	default:
		if place >= 6 {
			return 0.15 * 6 / float64(place)
		}
		return 0
	}
}

func Score(result Result, asOf time.Time) Result {
	result.Points = 0
	result.Included = false
	result.Base = levelBase[result.Level]
	result.PlaceFactor = placeFactor(result.Place)
	if result.Finishers < 2 || result.Place < 1 || result.Place > result.Finishers {
		return result
	}
	result.SizeFactor = math.Sqrt(math.Min(float64(result.Finishers), 16) / 16)
	result.Relative = float64(result.Finishers-result.Place) / float64(result.Finishers-1)
	days := math.Max(0, asOf.Sub(result.EndsAt).Hours()/24)
	result.Decay = Decay(days)
	if result.Stage == "qualification" {
		return result
	}
	result.Points = round(result.Base * result.PlaceFactor * result.SizeFactor * result.Relative * result.Decay)
	return result
}

func Calculate(a Athlete, asOf time.Time) Athlete {
	a.RulesVersion = RulesVersion
	a.RankBase = rankBonus[a.RankCode]
	latest := time.Time{}
	for i := range a.Results {
		a.Results[i] = Score(a.Results[i], asOf)
		if a.Results[i].Points > 0 && a.Results[i].EndsAt.After(latest) {
			latest = a.Results[i].EndsAt
		}
	}
	sort.SliceStable(a.Results, func(i, j int) bool {
		if a.Results[i].Points == a.Results[j].Points {
			return a.Results[i].EndsAt.After(a.Results[j].EndsAt)
		}
		return a.Results[i].Points > a.Results[j].Points
	})
	for i := range a.Results {
		if i < 4 && a.Results[i].Points > 0 {
			a.Results[i].Included = true
			a.ResultPoints += a.Results[i].Points
		}
	}
	if !latest.IsZero() {
		a.Activity = Activity(math.Max(0, asOf.Sub(latest).Hours()/24))
	}
	a.RankPoints = round(a.RankBase * a.Activity)
	a.ResultPoints = round(a.ResultPoints)
	a.Total = round(a.ResultPoints + a.RankPoints)
	if a.Disciplines == nil {
		a.Disciplines = []string{}
	}
	if a.Results == nil {
		a.Results = []Result{}
	}
	a.Achievements = achievements(a.Results)
	for i := range a.Achievements {
		if a.Achievements[i].Code == a.FeaturedCode {
			copy := a.Achievements[i]
			a.FeaturedAchievement = &copy
			break
		}
	}
	return a
}

type Service struct{ DB *pgxpool.Pool }

func (s Service) All(ctx context.Context, asOf time.Time) ([]Athlete, error) {
	rows, err := s.DB.Query(ctx, `SELECT a.user_id,a.full_name,a.city,a.organization,a.rank_code,a.avatar_url,a.featured_achievement_code,COALESCE(a.codeforces_handle,'') FROM athletes a ORDER BY a.user_id`)
	if err != nil {
		return nil, err
	}
	athletes := make([]Athlete, 0)
	byID := map[int64]int{}
	for rows.Next() {
		var a Athlete
		if err := rows.Scan(&a.ID, &a.FullName, &a.City, &a.Organization, &a.RankCode, &a.AvatarURL, &a.FeaturedCode, &a.CodeforcesHandle); err != nil {
			rows.Close()
			return nil, err
		}
		byID[a.ID] = len(athletes)
		athletes = append(athletes, a)
	}
	err = rows.Err()
	rows.Close()
	if err != nil {
		return nil, err
	}
	rows, err = s.DB.Query(ctx, `SELECT athlete_id,discipline_code FROM athlete_disciplines ORDER BY discipline_code`)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var id int64
		var code string
		if err := rows.Scan(&id, &code); err != nil {
			rows.Close()
			return nil, err
		}
		if index, ok := byID[id]; ok {
			athletes[index].Disciplines = append(athletes[index].Disciplines, code)
		}
	}
	err = rows.Err()
	rows.Close()
	if err != nil {
		return nil, err
	}
	rows, err = s.DB.Query(ctx, `WITH counts AS (SELECT competition_id, count(*)::integer AS n FROM results GROUP BY competition_id)
			SELECT COALESCE(r.athlete_id,tm.athlete_id),c.id,c.title,c.discipline_code,c.level_code,c.stage,c.ends_at,r.place,r.score_text,counts.n
		FROM results r JOIN competitions c ON c.id=r.competition_id
		JOIN counts ON counts.competition_id=c.id
		LEFT JOIN team_members tm ON tm.team_id=r.team_id
		WHERE c.status='completed'`)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var id int64
		var result Result
		if err := rows.Scan(&id, &result.CompetitionID, &result.Competition, &result.Discipline, &result.Level, &result.Stage, &result.EndsAt, &result.Place, &result.ScoreText, &result.Finishers); err != nil {
			rows.Close()
			return nil, err
		}
		if index, ok := byID[id]; ok {
			athletes[index].Results = append(athletes[index].Results, result)
		}
	}
	err = rows.Err()
	rows.Close()
	if err != nil {
		return nil, err
	}
	for i := range athletes {
		athletes[i] = Calculate(athletes[i], asOf)
	}
	sort.SliceStable(athletes, func(i, j int) bool {
		if athletes[i].Total == athletes[j].Total {
			return athletes[i].FullName < athletes[j].FullName
		}
		return athletes[i].Total > athletes[j].Total
	})
	for i := range athletes {
		if i > 0 && athletes[i].Total == athletes[i-1].Total {
			athletes[i].Place = athletes[i-1].Place
		} else {
			athletes[i].Place = i + 1
		}
	}
	return athletes, nil
}

func (s Service) One(ctx context.Context, id int64, asOf time.Time) (Athlete, error) {
	all, err := s.All(ctx, asOf)
	if err != nil {
		return Athlete{}, err
	}
	for _, a := range all {
		if a.ID == id {
			return a, nil
		}
	}
	return Athlete{}, ErrNotFound
}

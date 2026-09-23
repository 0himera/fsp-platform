package rating

import (
	"math"
	"sort"
	"testing"
	"time"
)

func FuzzScoreInvariants(f *testing.F) {
	f.Add(uint8(0), uint16(1), uint16(1), uint16(0))
	f.Add(uint8(3), uint16(6), uint16(6), uint16(365))
	f.Add(uint8(0), uint16(60), uint16(11), uint16(1095))
	f.Add(uint8(4), uint16(16), uint16(1), uint16(730))
	levels := []string{"rf_championship", "all_russian", "interregional", "rd_championship", "regional"}
	asOf := time.Date(2026, 9, 23, 12, 0, 0, 0, time.UTC)
	f.Fuzz(func(t *testing.T, levelIndex uint8, size, position, age uint16) {
		n := 1 + int(size%128)
		place := 1 + int(position%uint16(n+3))
		stage := "standalone"
		if levelIndex >= 128 {
			stage = "qualification"
		}
		result := Result{Level: levels[int(levelIndex)%len(levels)], Stage: stage, Finishers: n, Place: place, EndsAt: asOf.AddDate(0, 0, -int(age%1400))}
		score := Score(result, asOf)
		if math.IsNaN(score.Points) || math.IsInf(score.Points, 0) || score.Points < 0 || score.Points > score.Base {
			t.Fatalf("score out of range: %+v", score)
		}
		if (n < 2 || place >= n || stage == "qualification") && score.Points != 0 {
			t.Fatalf("single or last finisher scored: %+v", score)
		}
		if place >= n || n < 2 {
			return
		}
		lowerPlace := result
		lowerPlace.Place++
		if next := Score(lowerPlace, asOf).Points; next > score.Points {
			t.Fatalf("worse place earned more: %.2f > %.2f", next, score.Points)
		}
		older := result
		older.EndsAt = older.EndsAt.AddDate(0, 0, -1)
		if next := Score(older, asOf).Points; next > score.Points {
			t.Fatalf("older result earned more: %.2f > %.2f", next, score.Points)
		}
		largerField := result
		largerField.Finishers++
		if next := Score(largerField, asOf).Points; next < score.Points {
			t.Fatalf("larger field earned less: %.2f < %.2f", next, score.Points)
		}
	})
}

func FuzzCalculateBestFour(f *testing.F) {
	f.Add([]byte{})
	f.Add([]byte{0, 16, 1, 0, 16, 2, 10, 16, 3, 50, 16, 4, 100, 16, 5, 200})
	f.Add([]byte{7, 2, 2, 255, 3, 3, 255})
	levels := []string{"rf_championship", "all_russian", "interregional", "rd_championship", "regional"}
	ranks := []string{"none", "III", "II", "I", "KMS", "MS", "MSMK", "ZMS"}
	asOf := time.Date(2026, 9, 23, 12, 0, 0, 0, time.UTC)
	f.Fuzz(func(t *testing.T, data []byte) {
		if len(data) > 193 {
			data = data[:193]
		}
		athlete := Athlete{RankCode: ranks[0]}
		if len(data) > 0 {
			athlete.RankCode = ranks[int(data[0])%len(ranks)]
		}
		points := make([]float64, 0, len(data)/3)
		for i := 1; i+2 < len(data); i += 3 {
			n := 2 + int(data[i]%31)
			place := 1 + int(data[i+1])%n
			stage := "final"
			if data[i+2]%3 == 0 {
				stage = "qualification"
			}
			result := Result{CompetitionID: int64(i), Level: levels[int(data[i+2])%len(levels)], Stage: stage, Finishers: n, Place: place, EndsAt: asOf.AddDate(0, 0, -int(data[i+2])*5)}
			athlete.Results = append(athlete.Results, result)
			points = append(points, Score(result, asOf).Points)
		}
		got := Calculate(athlete, asOf)
		sort.Sort(sort.Reverse(sort.Float64Slice(points)))
		want := 0.0
		for i := 0; i < len(points) && i < 4; i++ {
			want += points[i]
		}
		if got.ResultPoints != round(want) {
			t.Fatalf("top four: got %.2f, want %.2f", got.ResultPoints, want)
		}
		included := 0
		for _, result := range got.Results {
			if result.Included {
				included++
				if result.Points <= 0 {
					t.Fatalf("zero result included: %+v", result)
				}
			}
		}
		if included > 4 || got.RankPoints < 0 || got.RankPoints > got.RankBase || got.Total != round(got.ResultPoints+got.RankPoints) {
			t.Fatalf("invalid total or bonus: %+v", got)
		}
	})
}

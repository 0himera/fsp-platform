package rating

import (
	"math"
	"testing"
	"time"
)

func TestScoreEdgeCases(t *testing.T) {
	now := time.Date(2026, 9, 23, 0, 0, 0, 0, time.UTC)
	cases := []struct {
		name     string
		place, n int
		level    string
		want     float64
	}{
		{"last of six", 6, 6, "rd_championship", 0},
		{"alone", 1, 1, "rf_championship", 0},
		{"eleventh of sixty", 11, 60, "rf_championship", 67.95},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := Score(Result{Level: tc.level, Place: tc.place, Finishers: tc.n, EndsAt: now}, now).Points
			if math.Abs(got-tc.want) > 0.02 {
				t.Fatalf("got %.2f, want %.2f", got, tc.want)
			}
		})
	}
}

func TestDecayAndBestFour(t *testing.T) {
	now := time.Date(2026, 9, 23, 0, 0, 0, 0, time.UTC)
	for _, tc := range []struct {
		days int
		want float64
	}{{0, 1}, {365, .7}, {730, .4}, {1095, 0}} {
		if got := Decay(float64(tc.days)); math.Abs(got-tc.want) > 1e-9 {
			t.Fatalf("decay(%d)=%v", tc.days, got)
		}
	}
	a := Athlete{RankCode: "KMS"}
	for i := 0; i < 5; i++ {
		a.Results = append(a.Results, Result{Level: "regional", Place: 1, Finishers: 16, EndsAt: now})
	}
	a = Calculate(a, now)
	if a.ResultPoints != 480 || a.RankPoints != 80 || a.Total != 560 {
		t.Fatalf("unexpected calculation: %+v", a)
	}
	if a.Results[4].Included {
		t.Fatal("fifth result must not count")
	}
}

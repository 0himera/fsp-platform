package competitions

import (
	"errors"
	"strings"
	"testing"
	"time"
)

func TestValidateProtocolBronzeTie(t *testing.T) {
	results := []Result{
		{AthleteID: 1, Place: 1}, {AthleteID: 2, Place: 2},
		{AthleteID: 3, Place: 3}, {AthleteID: 4, Place: 3}, {AthleteID: 5, Place: 5},
	}
	if err := validateProtocol("individual", results); err != nil {
		t.Fatalf("two bronze places should be valid: %v", err)
	}
}

func TestUnicodeInputLengths(t *testing.T) {
	now := time.Now().UTC()
	input := Input{
		Title: strings.Repeat("Я", 160), LevelCode: "regional", DisciplineCode: "algorithmic", Format: "individual", Status: "open", Stage: "standalone", MaxTeamSize: 5,
		StartsAt: now, EndsAt: now.Add(time.Hour), RegistrationDeadline: now.Add(30 * time.Minute),
		Location: strings.Repeat("Я", 160), Description: strings.Repeat("Я", 3000),
	}
	if !validInput(input) {
		t.Fatal("valid Cyrillic input was rejected")
	}
	input.Title += "Я"
	if validInput(input) {
		t.Fatal("title beyond character limit was accepted")
	}
	results := []Result{{AthleteID: 1, Place: 1, ScoreText: strings.Repeat("Я", 200)}}
	if err := validateProtocol("individual", results); err != nil {
		t.Fatalf("valid Cyrillic result was rejected: %v", err)
	}
	results[0].ScoreText += "Я"
	if err := validateProtocol("individual", results); !errors.Is(err, ErrInvalid) {
		t.Fatalf("result beyond character limit was accepted: %v", err)
	}
}

func FuzzValidateProtocol(f *testing.F) {
	f.Add([]byte{})
	f.Add([]byte{0, 2, 3, 0, 5})
	f.Add([]byte{1, 20, 1, 2, 3, 4})
	f.Fuzz(func(t *testing.T, data []byte) {
		format := "individual"
		if len(data) > 0 && data[0]%2 == 1 {
			format = "team"
		}
		count := 1
		if len(data) > 1 {
			count += int(data[1] % 20)
		}
		results := make([]Result, count)
		for i := range results {
			results[i].Place = i + 1
			if i > 1 && len(data) > i+2 && data[i+2]%4 == 0 {
				results[i].Place = results[i-1].Place
			}
			if format == "team" {
				results[i].TeamID = int64(i + 1)
			} else {
				results[i].AthleteID = int64(i + 1)
			}
		}
		if err := validateProtocol(format, results); err != nil {
			t.Fatalf("valid protocol rejected: %v, format=%s, results=%+v", err, format, results)
		}
		checkRejected := func(name string, mutate func([]Result)) {
			t.Helper()
			changed := append([]Result(nil), results...)
			mutate(changed)
			if err := validateProtocol(format, changed); !errors.Is(err, ErrInvalid) {
				t.Fatalf("%s was accepted: %+v", name, changed)
			}
		}
		checkRejected("zero place", func(items []Result) { items[0].Place = 0 })
		checkRejected("place beyond finishers", func(items []Result) { items[0].Place = count + 1 })
		checkRejected("zero entrant", func(items []Result) {
			if format == "team" {
				items[0].TeamID = 0
			} else {
				items[0].AthleteID = 0
			}
		})
		checkRejected("wrong entrant type", func(items []Result) {
			if format == "team" {
				items[0].AthleteID = 1
			} else {
				items[0].TeamID = 1
			}
		})
		checkRejected("long result", func(items []Result) { items[0].ScoreText = strings.Repeat("x", 201) })
		if count > 1 {
			checkRejected("duplicate entrant", func(items []Result) {
				if format == "team" {
					items[1].TeamID = items[0].TeamID
				} else {
					items[1].AthleteID = items[0].AthleteID
				}
			})
		}
		if err := validateProtocol(format, nil); !errors.Is(err, ErrInvalid) {
			t.Fatal("empty protocol was accepted")
		}
		if err := validateProtocol("unknown", results); !errors.Is(err, ErrInvalid) {
			t.Fatal("unknown format was accepted")
		}
	})
}

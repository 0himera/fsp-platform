package competitions

import (
	"testing"
	"time"
)

func TestCompetitionPhase(t *testing.T) {
	now := time.Date(2026, time.September, 24, 12, 0, 0, 0, time.UTC)
	tests := []struct {
		name, status, phase  string
		start, end, deadline time.Duration
		registrationOpen     bool
	}{
		{"draft", "draft", "draft", time.Hour, 2 * time.Hour, 30 * time.Minute, false},
		{"upcoming", "open", "upcoming", time.Hour, 2 * time.Hour, 30 * time.Minute, true},
		{"upcoming closed registration", "open", "upcoming", time.Hour, 2 * time.Hour, -time.Minute, false},
		{"current", "open", "current", -time.Hour, time.Hour, 30 * time.Minute, true},
		{"current closed registration", "running", "current", -time.Hour, time.Hour, -time.Minute, false},
		{"awaiting results", "open", "awaiting_results", -2 * time.Hour, -time.Hour, -90 * time.Minute, false},
		{"completed", "completed", "completed", -2 * time.Hour, -time.Hour, -90 * time.Minute, false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			c := withPhase(Competition{
				Status: tt.status, StartsAt: now.Add(tt.start), EndsAt: now.Add(tt.end), RegistrationDeadline: now.Add(tt.deadline),
			}, now)
			if c.Phase != tt.phase || c.RegistrationOpen != tt.registrationOpen {
				t.Fatalf("phase=%q, registration_open=%v", c.Phase, c.RegistrationOpen)
			}
		})
	}
}

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

func TestRegistrationWindowBoundaries(t *testing.T) {
	now := time.Date(2026, time.October, 1, 3, 24, 0, 0, time.UTC)
	deadline := now
	endsAt := now.Add(48 * time.Hour)
	if registrationOpen("open", deadline, endsAt, now) {
		t.Fatal("registration must be closed at the exact deadline")
	}
	if registrationOpen("open", deadline.Add(time.Second), endsAt, now) != true {
		t.Fatal("registration should remain open before the deadline")
	}
	if registrationOpen("open", endsAt.Add(time.Hour), endsAt, endsAt) {
		t.Fatal("registration must be closed at the competition end")
	}
	if registrationOpen("running", deadline.Add(time.Hour), endsAt, now) {
		t.Fatal("registration must be closed when competition status is not open")
	}
}

func TestCanCloseEarly(t *testing.T) {
	now := time.Date(2026, time.October, 1, 12, 0, 0, 0, time.UTC)
	tests := []struct {
		name        string
		status      string
		startOffset time.Duration
		endOffset   time.Duration
		want        bool
	}{
		{name: "running competition", status: "running", startOffset: -time.Hour, endOffset: time.Hour, want: true},
		{name: "open competition already started", status: "open", startOffset: -time.Hour, endOffset: time.Hour, want: true},
		{name: "cannot close before start", status: "open", startOffset: time.Hour, endOffset: 2 * time.Hour},
		{name: "already ended", status: "running", startOffset: -2 * time.Hour, endOffset: -time.Second},
		{name: "completed", status: "completed", startOffset: -2 * time.Hour, endOffset: time.Hour},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := canCloseEarly(tt.status, now.Add(tt.startOffset), now.Add(tt.endOffset), now)
			if got != tt.want {
				t.Fatalf("canCloseEarly() = %v, want %v", got, tt.want)
			}
		})
	}
}

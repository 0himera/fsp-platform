package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/0himera/fsp-platform/internal/contest"
	"github.com/0himera/fsp-platform/internal/platform"
)

func main() {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		slog.Error("DATABASE_URL is required")
		os.Exit(1)
	}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	db, err := platform.Open(ctx, databaseURL)
	if err != nil {
		slog.Error("database unavailable", "error", err)
		os.Exit(1)
	}
	defer db.Close()
	service := contest.Service{DB: db}
	slog.Info("contest CSV worker started")
	for ctx.Err() == nil {
		processed, err := service.ProcessOne(ctx)
		if err != nil {
			slog.Error("contest job failed", "error", err)
		}
		if !processed || err != nil {
			select {
			case <-ctx.Done():
			case <-time.After(time.Second):
			}
		}
	}
}

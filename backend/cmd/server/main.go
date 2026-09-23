package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/0himera/fsp-platform/internal/auth"
	"github.com/0himera/fsp-platform/internal/demo"
	"github.com/0himera/fsp-platform/internal/httpapi"
	"github.com/0himera/fsp-platform/internal/platform"
)

func env(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		slog.Error("DATABASE_URL is required")
		os.Exit(1)
	}
	db, err := platform.Open(ctx, databaseURL)
	if err != nil {
		slog.Error("database unavailable", "error", err)
		os.Exit(1)
	}
	defer db.Close()
	if err := platform.Migrate(ctx, db, env("MIGRATIONS_DIR", "migrations")); err != nil {
		slog.Error("migration failed", "error", err)
		os.Exit(1)
	}
	if err := (auth.Service{DB: db}).EnsureOrganizer(ctx, os.Getenv("SEED_ORGANIZER_EMAIL"), os.Getenv("SEED_ORGANIZER_PASSWORD")); err != nil {
		slog.Error("organizer seed failed", "error", err)
		os.Exit(1)
	}
	if os.Getenv("DEMO_SEED") == "1" {
		if err := demo.Seed(ctx, db, os.Getenv("SEED_ORGANIZER_EMAIL")); err != nil {
			slog.Error("demo seed failed", "error", err)
			os.Exit(1)
		}
	}
	addr := env("HTTP_ADDR", ":8080")
	server := &http.Server{Addr: addr, Handler: httpapi.New(db, env("FRONTEND_DIR", "../frontend")).Handler(), ReadHeaderTimeout: 5 * time.Second, IdleTimeout: 60 * time.Second}
	go func() {
		<-ctx.Done()
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		_ = server.Shutdown(shutdownCtx)
	}()
	slog.Info("arena listening", "addr", addr)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		slog.Error("server stopped", "error", err)
		os.Exit(1)
	}
}

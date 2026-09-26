package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/0himera/fsp-platform/internal/httpapi"
	"github.com/0himera/fsp-platform/internal/platform"
)

func main() {
	databaseURL := os.Getenv("DATABASE_URL")
	engineToken := os.Getenv("CONTEST_ENGINE_TOKEN")
	if databaseURL == "" || engineToken == "" {
		slog.Error("DATABASE_URL and CONTEST_ENGINE_TOKEN are required")
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
	api := httpapi.New(db, "", nil, "", "", "")
	api.ContestEngineToken = engineToken
	api.ContestResultsToken = os.Getenv("CONTEST_RESULTS_TOKEN")
	api.PlatformInternalURL = os.Getenv("PLATFORM_INTERNAL_URL")
	api.TrustedContestHeaders = true
	server := &http.Server{Addr: env("CONTEST_ENGINE_ADDR", ":8081"), Handler: api.ContestHandler(), ReadHeaderTimeout: 5 * time.Second, IdleTimeout: 60 * time.Second}
	go func() {
		<-ctx.Done()
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		_ = server.Shutdown(shutdownCtx)
	}()
	slog.Info("contest engine listening", "addr", server.Addr)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		slog.Error("contest engine stopped", "error", err)
		os.Exit(1)
	}
}

func env(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

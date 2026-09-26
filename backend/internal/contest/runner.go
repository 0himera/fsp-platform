package contest

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"math"
	"os/exec"
	"sort"
	"strings"
	"time"
)

type RunResult struct {
	Score      float64
	Verdict    string
	Feedback   string
	DurationMs int64
}

func EvaluatePythonCode(ctx context.Context, source string, tests map[string]string, maxPoints float64) RunResult {
	if strings.TrimSpace(source) == "" {
		return RunResult{Score: 0, Verdict: "Empty Solution", Feedback: "Исходный код пуст"}
	}
	if len(tests) == 0 {
		return checkPythonSyntax(ctx, source, maxPoints)
	}
	keys := make([]string, 0, len(tests))
	for k := range tests {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	passedTests := 0
	var totalDuration int64
	for i, input := range keys {
		expected := strings.TrimSpace(tests[input])
		start := time.Now()
		testCtx, cancel := context.WithTimeout(ctx, 2*time.Second)
		cmd := exec.CommandContext(testCtx, "python3", "-c", source)
		cmd.Stdin = strings.NewReader(input)
		var stdout, stderr bytes.Buffer
		cmd.Stdout = &stdout
		cmd.Stderr = &stderr
		err := cmd.Run()
		cancel()
		duration := time.Since(start).Milliseconds()
		totalDuration += duration
		if errors.Is(testCtx.Err(), context.DeadlineExceeded) {
			return RunResult{
				Score:      0,
				Verdict:    "Time Limit Exceeded",
				Feedback:   fmt.Sprintf("Превышено время ожидания на тесте %d (лимит 2.0s)", i+1),
				DurationMs: totalDuration,
			}
		}
		if err != nil {
			errSnippet := strings.TrimSpace(stderr.String())
			if len(errSnippet) > 200 {
				errSnippet = errSnippet[:200] + "…"
			}
			return RunResult{
				Score:      0,
				Verdict:    "Runtime Error",
				Feedback:   fmt.Sprintf("Ошибка выполнения на тесте %d: %s", i+1, errSnippet),
				DurationMs: totalDuration,
			}
		}
		actual := strings.TrimSpace(stdout.String())
		if actual == expected {
			passedTests++
		} else {
			if len(expected) > 40 {
				expected = expected[:40] + "…"
			}
			if len(actual) > 40 {
				actual = actual[:40] + "…"
			}
			ratio := float64(passedTests) / float64(len(tests))
			score := math.Round(maxPoints*ratio*100) / 100
			return RunResult{
				Score:      score,
				Verdict:    "Wrong Answer",
				Feedback:   fmt.Sprintf("Тест %d не пройден. Ожидалось: %q, получено: %q", i+1, expected, actual),
				DurationMs: totalDuration,
			}
		}
	}
	return RunResult{
		Score:      maxPoints,
		Verdict:    "Accepted",
		Feedback:   fmt.Sprintf("Все тесты пройдены (%d/%d) · Время: %d ms", passedTests, len(tests), totalDuration),
		DurationMs: totalDuration,
	}
}

func checkPythonSyntax(ctx context.Context, source string, maxPoints float64) RunResult {
	start := time.Now()
	testCtx, cancel := context.WithTimeout(ctx, 2*time.Second)
	defer cancel()
	cmd := exec.CommandContext(testCtx, "python3", "-c", "import py_compile, sys; compile(sys.stdin.read(), '<solution>', 'exec')")
	cmd.Stdin = strings.NewReader(source)
	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		snippet := strings.TrimSpace(stderr.String())
		if len(snippet) > 200 {
			snippet = snippet[:200] + "…"
		}
		return RunResult{Score: 0, Verdict: "Compilation Error", Feedback: snippet}
	}
	return RunResult{
		Score:      maxPoints,
		Verdict:    "Accepted",
		Feedback:   fmt.Sprintf("Синтаксис корректен · Время проверки: %d ms", time.Since(start).Milliseconds()),
		DurationMs: time.Since(start).Milliseconds(),
	}
}

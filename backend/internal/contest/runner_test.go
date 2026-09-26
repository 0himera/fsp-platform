package contest

import (
	"context"
	"strings"
	"testing"
)

func TestEvaluatePythonCode(t *testing.T) {
	ctx := context.Background()

	t.Run("correct solution", func(t *testing.T) {
		code := `import sys
lines = sys.stdin.read().split()
if lines:
    a, b = int(lines[0]), int(lines[1])
    print(a + b)
`
		tests := map[string]string{
			"2 3\n":   "5",
			"10 20\n": "30",
		}
		res := EvaluatePythonCode(ctx, code, tests, 100)
		if res.Verdict != "Accepted" {
			t.Fatalf("expected Accepted, got %s: %s", res.Verdict, res.Feedback)
		}
		if res.Score != 100 {
			t.Fatalf("expected score 100, got %v", res.Score)
		}
	})

	t.Run("wrong answer", func(t *testing.T) {
		code := `print(42)`
		tests := map[string]string{
			"1\n": "1",
			"2\n": "2",
		}
		res := EvaluatePythonCode(ctx, code, tests, 100)
		if res.Verdict != "Wrong Answer" {
			t.Fatalf("expected Wrong Answer, got %s", res.Verdict)
		}
		if res.Score != 0 {
			t.Fatalf("expected score 0, got %v", res.Score)
		}
	})

	t.Run("runtime error", func(t *testing.T) {
		code := `x = 1 / 0`
		tests := map[string]string{
			"1\n": "1",
		}
		res := EvaluatePythonCode(ctx, code, tests, 100)
		if res.Verdict != "Runtime Error" {
			t.Fatalf("expected Runtime Error, got %s", res.Verdict)
		}
		if !strings.Contains(res.Feedback, "ZeroDivisionError") {
			t.Fatalf("expected ZeroDivisionError in feedback, got %s", res.Feedback)
		}
	})

	t.Run("syntax check when no tests", func(t *testing.T) {
		validCode := `def add(a, b):
    return a + b
`
		res := EvaluatePythonCode(ctx, validCode, nil, 50)
		if res.Verdict != "Accepted" || res.Score != 50 {
			t.Fatalf("expected Accepted with score 50, got %v %s", res.Score, res.Verdict)
		}

		syntaxErrorCode := `def broken(:`
		resErr := EvaluatePythonCode(ctx, syntaxErrorCode, nil, 50)
		if resErr.Verdict != "Compilation Error" {
			t.Fatalf("expected Compilation Error, got %s", resErr.Verdict)
		}
	})
}

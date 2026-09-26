package contest

import (
	"math"
	"strings"
	"testing"
)

func TestScoreRecall(t *testing.T) {
	tests := []struct {
		name     string
		data     string
		expected map[string]string
		positive string
		want     float64
		wantErr  bool
	}{
		{
			name:     "recall ignores true negatives",
			data:     "id,prediction\na,1\nb,0\nc,0\nd,1\n",
			expected: map[string]string{"a": "1", "b": "0", "c": "1", "d": "0"},
			positive: "1", want: 0.5,
		},
		{
			name:     "supports zero as positive label",
			data:     "ID,PREDICTION\na,0\nb,1\n",
			expected: map[string]string{"a": "0", "b": "1"},
			positive: "0", want: 1,
		},
		{
			name:     "handles utf-8 bom prefix",
			data:     "\xef\xbb\xbfid,prediction\na,1\nb,0\n",
			expected: map[string]string{"a": "1", "b": "0"},
			positive: "1", want: 1,
		},
		{
			name:     "rejects missing rows",
			data:     "id,prediction\na,1\n",
			expected: map[string]string{"a": "1", "b": "0"},
			positive: "1", wantErr: true,
		},
		{
			name:     "rejects duplicate rows",
			data:     "id,prediction\na,1\na,1\n",
			expected: map[string]string{"a": "1"},
			positive: "1", wantErr: true,
		},
		{
			name:     "rejects unknown IDs",
			data:     "id,prediction\nx,1\n",
			expected: map[string]string{"a": "1"},
			positive: "1", wantErr: true,
		},
		{
			name:     "rejects invalid predictions",
			data:     "id,prediction\na,yes\n",
			expected: map[string]string{"a": "1"},
			positive: "1", wantErr: true,
		},
		{
			name:     "rejects missing positive examples",
			data:     "id,prediction\na,0\n",
			expected: map[string]string{"a": "0"},
			positive: "1", wantErr: true,
		},
		{
			name:     "rejects wrong columns",
			data:     "id,label\na,1\n",
			expected: map[string]string{"a": "1"},
			positive: "1", wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, feedback, err := scoreRecall([]byte(tt.data), tt.expected, tt.positive)
			if (err != nil) != tt.wantErr {
				t.Fatalf("scoreRecall() error = %v, wantErr %v", err, tt.wantErr)
			}
			if tt.wantErr {
				return
			}
			if got != tt.want {
				t.Fatalf("scoreRecall() = %v, want %v", got, tt.want)
			}
			if !strings.Contains(feedback, "Recall:") {
				t.Fatalf("feedback %q does not include recall", feedback)
			}
		})
	}
}

func TestValidPublicCSV(t *testing.T) {
	expected := map[string]string{"row-1": "1", "row-2": "0"}
	tests := []struct {
		name string
		csv  string
		want bool
	}{
		{name: "all IDs once", csv: "id,feature\nrow-1,0.2\nrow-2,0.8\n", want: true},
		{name: "handles utf-8 bom", csv: "\ufeffid,feature\nrow-1,0.2\nrow-2,0.8\n", want: true},
		{name: "accepts extra feature columns", csv: "id,x,y\nrow-1,0.2,0.4\nrow-2,0.8,0.1\n", want: true},
		{name: "rejects wrong header", csv: "name,feature\nrow-1,0.2\nrow-2,0.8\n"},
		{name: "rejects unknown ID", csv: "id,feature\nrow-1,0.2\nother,0.8\n"},
		{name: "rejects duplicate ID", csv: "id,feature\nrow-1,0.2\nrow-1,0.8\n"},
		{name: "rejects missing ID", csv: "id,feature\nrow-1,0.2\n"},
		{name: "rejects malformed row", csv: "id,feature\nrow-1\nrow-2,0.8\n"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := validPublicCSV(tt.csv, expected); got != tt.want {
				t.Fatalf("validPublicCSV() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestFilepathBase(t *testing.T) {
	for _, input := range []string{"predictions.csv", "../../predictions.csv", `..\..\predictions.csv`, "/", "////"} {
		got := filepathBase(input)
		if strings.ContainsAny(got, `/\`) {
			t.Errorf("filepathBase(%q) = %q, contains a path separator", input, got)
		}
	}
}

func TestScoreRecallNeverReturnsNonFiniteScore(t *testing.T) {
	data := []byte("id,prediction\na,1\nb,0\n")
	score, _, err := scoreRecall(data, map[string]string{"a": "1", "b": "0"}, "1")
	if err != nil {
		t.Fatal(err)
	}
	if math.IsNaN(score) || math.IsInf(score, 0) || score < 0 || score > 1 {
		t.Fatalf("scoreRecall() returned invalid score %v", score)
	}
}

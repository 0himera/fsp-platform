package contest

import (
	"encoding/csv"
	"io"
	"math"
	"strings"
	"testing"
)

func FuzzScoreRecall(f *testing.F) {
	f.Add([]byte("id,prediction\na,1\nb,0\n"))
	f.Add([]byte("id,prediction\na,0\nb,1\n"))
	f.Add([]byte("id,prediction\na,1\na,0\n"))
	f.Add([]byte{})
	f.Fuzz(func(t *testing.T, data []byte) {
		if len(data) > maxCSVBytes {
			data = data[:maxCSVBytes]
		}
		expected := map[string]string{"a": "1", "b": "0", "c": "1"}
		score, _, err := scoreRecall(data, expected, "1")
		if err != nil {
			return
		}
		if math.IsNaN(score) || math.IsInf(score, 0) || score < 0 || score > 1 {
			t.Fatalf("successful score is outside [0,1]: %v", score)
		}
	})
}

func FuzzValidPublicCSV(f *testing.F) {
	f.Add("id,feature\na,1\nb,0\n")
	f.Add("id,feature\na,1\na,0\n")
	f.Add("name,feature\na,1\nb,0\n")
	f.Add("")
	f.Fuzz(func(t *testing.T, data string) {
		if len(data) > 1<<20 {
			data = data[:1<<20]
		}
		expected := map[string]string{"a": "1", "b": "0"}
		if !validPublicCSV(data, expected) {
			return
		}
		reader := csv.NewReader(strings.NewReader(data))
		header, err := reader.Read()
		if err != nil {
			t.Fatalf("accepted CSV has no readable header: %v", err)
		}
		reader.FieldsPerRecord = len(header)
		seen := make(map[string]bool, len(expected))
		for {
			row, err := reader.Read()
			if err == io.EOF {
				break
			}
			if err != nil {
				t.Fatalf("accepted CSV has an invalid row: %v", err)
			}
			id := strings.TrimSpace(row[0])
			if _, ok := expected[id]; !ok || seen[id] {
				t.Fatalf("accepted CSV contains unknown or duplicate ID %q", id)
			}
			seen[id] = true
		}
		if len(seen) != len(expected) {
			t.Fatalf("accepted CSV has %d unique IDs, want %d", len(seen), len(expected))
		}
	})
}

func FuzzFilepathBase(f *testing.F) {
	f.Add("predictions.csv")
	f.Add("../../predictions.csv")
	f.Add(`..\..\predictions.csv`)
	f.Fuzz(func(t *testing.T, name string) {
		if len(name) > 4096 {
			name = name[:4096]
		}
		if got := filepathBase(name); len(got) > 0 && containsPathSeparator(got) {
			t.Fatalf("filepathBase(%q) = %q, contains a path separator", name, got)
		}
	})
}

func containsPathSeparator(value string) bool {
	for _, r := range value {
		if r == '/' || r == '\\' {
			return true
		}
	}
	return false
}

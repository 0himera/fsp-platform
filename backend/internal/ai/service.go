package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Service struct {
	DB         *pgxpool.Pool
	APIKey     string
	HTTPClient *http.Client
}

func New(db *pgxpool.Pool, apiKey string) *Service {
	return &Service{
		DB:     db,
		APIKey: apiKey,
		HTTPClient: &http.Client{
			Timeout: 45 * time.Second,
		},
	}
}

func (s *Service) Available() bool {
	return s.APIKey != ""
}

// Embedding generates a 768-dimensional vector embedding for the input text using gemini-embedding-001.
func (s *Service) Embedding(ctx context.Context, text string) ([]float32, error) {
	if !s.Available() {
		return nil, fmt.Errorf("gemini api key not configured")
	}

	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=%s", s.APIKey)

	reqBody, _ := json.Marshal(map[string]any{
		"content": map[string]any{
			"parts": []map[string]string{
				{"text": text},
			},
		},
		"outputDimensionality": 768,
	})

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(reqBody))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("embedding api error (%d): %s", resp.StatusCode, string(body))
	}

	var result struct {
		Embedding struct {
			Values []float32 `json:"values"`
		} `json:"embedding"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	if len(result.Embedding.Values) == 0 {
		return nil, fmt.Errorf("empty embedding returned")
	}

	return result.Embedding.Values, nil
}

// IndexText stores text chunks and their embeddings in pgvector.
func (s *Service) IndexText(ctx context.Context, docID *int64, compID *int64, title string, text string) error {
	if !s.Available() || strings.TrimSpace(text) == "" {
		return nil
	}

	// Simple chunking ~800 chars
	chunks := chunkText(text, 800)
	for i, chunk := range chunks {
		emb, err := s.Embedding(ctx, chunk)
		if err != nil {
			return err
		}

		vecStr := formatVector(emb)
		_, err = s.DB.Exec(ctx,
			`INSERT INTO document_embeddings (document_id, competition_id, title, chunk_index, content, embedding)
			 VALUES ($1, $2, $3, $4, $5, $6::vector)`,
			docID, compID, title, i, chunk, vecStr)
		if err != nil {
			return err
		}
	}
	return nil
}

// ChatRequest / ChatResponse structures
type Message struct {
	Role    string `json:"role"` // "user" or "model"
	Content string `json:"content"`
}

type Source struct {
	Title   string `json:"title"`
	Content string `json:"content"`
}

type ChatResult struct {
	Answer  string   `json:"answer"`
	Sources []Source `json:"sources"`
}

// Ask performs RAG retrieval using pgvector + system context + Gemini 3.8 Flash.
func (s *Service) Ask(ctx context.Context, userQuery string, history []Message) (*ChatResult, error) {
	if !s.Available() {
		return nil, fmt.Errorf("ИИ-помощник временно недоступен (не задан GEMINI_API_KEY)")
	}

	// 1. Get embedding for the user query
	qEmb, err := s.Embedding(ctx, userQuery)
	var retrievedSources []Source
	if err == nil {
		vecStr := formatVector(qEmb)
		rows, err := s.DB.Query(ctx,
			`SELECT title, content
			 FROM document_embeddings
			 ORDER BY embedding <=> $1::vector ASC
			 LIMIT 4`, vecStr)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var src Source
				if rows.Scan(&src.Title, &src.Content) == nil {
					retrievedSources = append(retrievedSources, src)
				}
			}
		}
	}

	// 2. Query summary of upcoming/current competitions from database
	compSummary := s.getCompetitionsSummary(ctx)

	// 3. Build system prompt
	systemInstruction := `Ты — официальный ИИ-ассистент Федерации спортивного программирования Республики Дагестан (Арена ФСП РД).
Отвечай вежливо, четко, структурированно и на русском языке.
Используй предоставленный контекст соревнований и найденных регламентов. Если информации нет в контексте, ответь честно, что точных данных в регламентах нет, и предложи обратиться к организаторам.

Формула рейтинга (arena-2):
- Сумма 4 лучших результатов + бонус за высший подтвержденный разряд.
- Баллы зависят от уровня турнира (Чемпионат/Кубок РФ: 1000, Всероссийские: 650, Межрегиональные: 400, Чемпионат РД: 250, Региональные: 120), занятого места, количества участников и давности старта.`

	var contextBuilder strings.Builder
	contextBuilder.WriteString("\n--- АКТУАЛЬНЫЕ СОРЕВНОВАНИЯ ФЕДЕРАЦИИ ---\n")
	contextBuilder.WriteString(compSummary)

	if len(retrievedSources) > 0 {
		contextBuilder.WriteString("\n--- ФРАГМЕНТЫ ИЗ ОФИЦИАЛЬНЫХ ДОКУМЕНТОВ И РЕГЛАМЕНТОВ ---\n")
		for _, src := range retrievedSources {
			contextBuilder.WriteString(fmt.Sprintf("\n[Документ: %s]\n%s\n", src.Title, src.Content))
		}
	}

	// 4. Build Gemini API contents payload
	contents := []map[string]any{}

	// Include conversation history if provided
	for _, h := range history {
		role := "user"
		if h.Role == "model" || h.Role == "assistant" {
			role = "model"
		}
		contents = append(contents, map[string]any{
			"role": role,
			"parts": []map[string]string{
				{"text": h.Content},
			},
		})
	}

	// Append current message with augmented context
	userContent := fmt.Sprintf("%s\n\nКонтекст платформы:\n%s\n\nВопрос пользователя: %s", systemInstruction, contextBuilder.String(), userQuery)
	contents = append(contents, map[string]any{
		"role": "user",
		"parts": []map[string]string{
			{"text": userContent},
		},
	})

	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=%s", s.APIKey)

	reqPayload := map[string]any{
		"contents": contents,
		"generationConfig": map[string]any{
			"temperature":     0.3,
			"maxOutputTokens": 1024,
		},
	}

	payloadBytes, _ := json.Marshal(reqPayload)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(payloadBytes))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("gemini generate error (%d): %s", resp.StatusCode, string(body))
	}

	var geminiResp struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&geminiResp); err != nil {
		return nil, err
	}

	if len(geminiResp.Candidates) == 0 || len(geminiResp.Candidates[0].Content.Parts) == 0 {
		return nil, fmt.Errorf("модель не вернула ответа")
	}

	answer := geminiResp.Candidates[0].Content.Parts[0].Text

	return &ChatResult{
		Answer:  answer,
		Sources: retrievedSources,
	}, nil
}

func (s *Service) getCompetitionsSummary(ctx context.Context) string {
	rows, err := s.DB.Query(ctx,
		`SELECT title, level_code, format, status, starts_at, ends_at, registration_deadline, location, description
		 FROM competitions
		 WHERE status != 'draft'
		 ORDER BY starts_at DESC
		 LIMIT 15`)
	if err != nil {
		return ""
	}
	defer rows.Close()

	var sb strings.Builder
	for rows.Next() {
		var title, level, format, status, location, desc string
		var startsAt, endsAt, regDeadline time.Time
		if err := rows.Scan(&title, &level, &format, &status, &startsAt, &endsAt, &regDeadline, &location, &desc); err == nil {
			sb.WriteString(fmt.Sprintf("- Турнир: %s | Уровень: %s | Формат: %s | Статус: %s | Даты: %s — %s | Регистрация до: %s | Место: %s\n  Описание: %s\n",
				title, level, format, status,
				startsAt.Format("02.01.2006"), endsAt.Format("02.01.2006"),
				regDeadline.Format("02.01.2006 15:04"), location, desc))
		}
	}
	return sb.String()
}

func chunkText(text string, maxLen int) []string {
	var chunks []string
	paragraphs := strings.Split(text, "\n")
	var current strings.Builder

	for _, p := range paragraphs {
		p = strings.TrimSpace(p)
		if p == "" {
			continue
		}
		if current.Len()+len(p) > maxLen && current.Len() > 0 {
			chunks = append(chunks, current.String())
			current.Reset()
		}
		if current.Len() > 0 {
			current.WriteString(" ")
		}
		current.WriteString(p)
	}
	if current.Len() > 0 {
		chunks = append(chunks, current.String())
	}
	if len(chunks) == 0 && len(text) > 0 {
		chunks = append(chunks, text)
	}
	return chunks
}

func formatVector(v []float32) string {
	strs := make([]string, len(v))
	for i, val := range v {
		strs[i] = fmt.Sprintf("%f", val)
	}
	return "[" + strings.Join(strs, ",") + "]"
}

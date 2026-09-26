package httpapi

import (
	"net/http"
	"strings"
	"unicode/utf8"

	"github.com/0himera/fsp-platform/internal/ai"
)

type aiChatRequest struct {
	Message string       `json:"message"`
	History []ai.Message `json:"history"`
}

func (s *Server) aiChat(w http.ResponseWriter, r *http.Request) {
	if s.AI == nil || !s.AI.Available() {
		writeError(w, http.StatusServiceUnavailable, "ИИ-помощник не настроен (задайте GEMINI_API_KEY)")
		return
	}

	var input aiChatRequest
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, "Некорректный запрос")
		return
	}

	msg := strings.TrimSpace(input.Message)
	if msg == "" || utf8.RuneCountInString(msg) > 2000 {
		writeError(w, http.StatusBadRequest, "Вопрос должен быть длиной до 2000 символов")
		return
	}

	result, err := s.AI.Ask(r.Context(), msg, input.History)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, result)
}

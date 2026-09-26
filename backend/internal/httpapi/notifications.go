package httpapi

import (
	"net/http"
	"time"
)

type notificationDTO struct {
	ID        int64      `json:"id"`
	Kind      string     `json:"kind"`
	Title     string     `json:"title"`
	Body      string     `json:"body"`
	Link      string     `json:"link"`
	ReadAt    *time.Time `json:"read_at"`
	CreatedAt time.Time  `json:"created_at"`
}

func (s *Server) listNotifications(w http.ResponseWriter, r *http.Request) {
	user, err := s.currentUser(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "Войдите в аккаунт")
		return
	}
	rows, err := s.DB.Query(r.Context(),
		`SELECT id, kind, title, body, link, read_at, created_at
		 FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50`,
		user.ID)
	if err != nil {
		handleError(w, err)
		return
	}
	defer rows.Close()
	list := []notificationDTO{}
	for rows.Next() {
		var n notificationDTO
		if err := rows.Scan(&n.ID, &n.Kind, &n.Title, &n.Body, &n.Link, &n.ReadAt, &n.CreatedAt); err != nil {
			handleError(w, err)
			return
		}
		list = append(list, n)
	}
	if err := rows.Err(); err != nil {
		handleError(w, err)
		return
	}
	unread := 0
	for _, n := range list {
		if n.ReadAt == nil {
			unread++
		}
	}
	writeJSON(w, http.StatusOK, map[string]any{"notifications": list, "unread": unread})
}

func (s *Server) readNotification(w http.ResponseWriter, r *http.Request) {
	user, err := s.currentUser(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "Войдите в аккаунт")
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	_, err = s.DB.Exec(r.Context(),
		`UPDATE notifications SET read_at=now() WHERE id=$1 AND user_id=$2 AND read_at IS NULL`,
		id, user.ID)
	if err != nil {
		handleError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func (s *Server) readAllNotifications(w http.ResponseWriter, r *http.Request) {
	user, err := s.currentUser(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "Войдите в аккаунт")
		return
	}
	_, err = s.DB.Exec(r.Context(),
		`UPDATE notifications SET read_at=now() WHERE user_id=$1 AND read_at IS NULL`,
		user.ID)
	if err != nil {
		handleError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

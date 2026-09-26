package codeforces

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"
)

var (
	ErrCFUnavailable = errors.New("codeforces api unavailable")
	ErrCFNotFound    = errors.New("codeforces entity not found")
)

type Client struct {
	HTTPClient *http.Client
}

func NewClient() *Client {
	return &Client{
		HTTPClient: &http.Client{Timeout: 15 * time.Second},
	}
}

func (c *Client) FetchStandings(ctx context.Context, contestID int) (*CFStandings, error) {
	url := fmt.Sprintf("https://codeforces.com/api/contest.standings?contestId=%d", contestID)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrCFUnavailable, err)
	}
	defer resp.Body.Close()

	var envelope struct {
		Status  string      `json:"status"`
		Comment string      `json:"comment"`
		Result  CFStandings `json:"result"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&envelope); err != nil {
		return nil, err
	}
	if envelope.Status != "OK" {
		return nil, fmt.Errorf("%w: %s", ErrCFNotFound, envelope.Comment)
	}
	if len(envelope.Result.Rows) > 50 {
		envelope.Result.Rows = envelope.Result.Rows[:50]
	}
	return &envelope.Result, nil
}

func (c *Client) FetchUser(ctx context.Context, handle string) (*CFUser, error) {
	url := fmt.Sprintf("https://codeforces.com/api/user.info?handles=%s", handle)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrCFUnavailable, err)
	}
	defer resp.Body.Close()

	var envelope struct {
		Status  string   `json:"status"`
		Comment string   `json:"comment"`
		Result  []CFUser `json:"result"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&envelope); err != nil {
		return nil, err
	}
	if envelope.Status != "OK" || len(envelope.Result) == 0 {
		return nil, ErrCFNotFound
	}
	return &envelope.Result[0], nil
}

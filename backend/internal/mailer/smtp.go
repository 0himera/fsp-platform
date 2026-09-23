package mailer

import (
	"context"
	"crypto/tls"
	"fmt"
	"mime"
	"net"
	"net/mail"
	"net/smtp"
	"strconv"
	"strings"
	"time"
)

type SMTP struct {
	Host     string
	Port     int
	From     string
	Username string
	Password string
}

func (m SMTP) Send(ctx context.Context, to, subject, body string) error {
	from, err := mail.ParseAddress(m.From)
	if err != nil {
		return fmt.Errorf("invalid SMTP_FROM: %w", err)
	}
	recipient, err := mail.ParseAddress(to)
	if err != nil || recipient.Address != to {
		return fmt.Errorf("invalid recipient address")
	}
	port := m.Port
	if port == 0 {
		port = 587
	}
	address := net.JoinHostPort(m.Host, strconv.Itoa(port))
	dialer := &net.Dialer{Timeout: 10 * time.Second}
	secure := port == 465
	var connection net.Conn
	if secure {
		connection, err = (&tls.Dialer{NetDialer: dialer, Config: &tls.Config{ServerName: m.Host, MinVersion: tls.VersionTLS12}}).DialContext(ctx, "tcp", address)
	} else {
		connection, err = dialer.DialContext(ctx, "tcp", address)
	}
	if err != nil {
		return err
	}
	defer connection.Close()
	_ = connection.SetDeadline(time.Now().Add(15 * time.Second))
	client, err := smtp.NewClient(connection, m.Host)
	if err != nil {
		return err
	}
	defer client.Close()
	if !secure {
		if ok, _ := client.Extension("STARTTLS"); ok {
			if err := client.StartTLS(&tls.Config{ServerName: m.Host, MinVersion: tls.VersionTLS12}); err != nil {
				return err
			}
		} else if m.Username != "" || m.Password != "" {
			return fmt.Errorf("SMTP server does not support STARTTLS")
		}
	}
	if m.Username != "" || m.Password != "" {
		if err := client.Auth(smtp.PlainAuth("", m.Username, m.Password, m.Host)); err != nil {
			return err
		}
	}
	if err := client.Mail(from.Address); err != nil {
		return err
	}
	if err := client.Rcpt(recipient.Address); err != nil {
		return err
	}
	writer, err := client.Data()
	if err != nil {
		return err
	}
	message := strings.Join([]string{
		"From: " + from.String(),
		"To: " + recipient.String(),
		"Subject: " + mime.QEncoding.Encode("utf-8", subject),
		"MIME-Version: 1.0",
		"Content-Type: text/plain; charset=UTF-8",
		"Content-Transfer-Encoding: 8bit",
		"", body,
	}, "\r\n")
	if _, err := writer.Write([]byte(message)); err != nil {
		return err
	}
	if err := writer.Close(); err != nil {
		return err
	}
	return client.Quit()
}

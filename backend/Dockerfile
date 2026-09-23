FROM golang:1.26-alpine AS build
WORKDIR /src/backend
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ .
RUN CGO_ENABLED=0 go build -o /arena ./cmd/server

FROM alpine:3.21
WORKDIR /app
COPY --from=build /arena /app/arena
COPY --from=build /src/backend/migrations /app/migrations
COPY frontend/ /app/frontend/
EXPOSE 8080
CMD ["/app/arena"]

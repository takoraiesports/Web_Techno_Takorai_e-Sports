# Multi-stage Docker build for Golang Backend

# Stage 1: Build
FROM golang:1.27-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git

# Copy dependency files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build binary
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o server ./cmd/server

# Stage 2: Runtime
FROM alpine:3.21

WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata

COPY --from=builder /app/server .
RUN addgroup -S -g 10001 esports && adduser -S -u 10001 -G esports esports && chown esports:esports /app/server
USER 10001:10001

EXPOSE 8080

CMD ["./server"]

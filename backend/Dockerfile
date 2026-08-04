FROM golang:1.25.0-alpine AS build

WORKDIR /app

RUN apk add --no-cache git

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN go build -o /app/server ./cmd/server

FROM alpine:3.22

WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata

# Create non-root user for Choreo (UID 10014 is required by Choreo security policy)
RUN addgroup -g 10014 choreo && \
    adduser -D -u 10014 -G choreo choreouser

COPY --from=build /app/server /app/server

# Set ownership so non-root user can access the binary
RUN chown -R 10014:10014 /app

# Switch to non-root user
USER 10014

EXPOSE 8080

CMD ["/app/server"]
package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL        string
	MaxConnections     int
	MaxIdleConnections int
	ConnMaxLifetime    int
	Port               string
}

func LoadConfig() *Config {
	err := godotenv.Load()
	if err != nil {
		log.Println("Error loading .env file")
	}

	return &Config{
		DatabaseURL:        os.Getenv("DATABASE_URL"),
		MaxConnections:     getEnvAsInt("DATABASE_MAX_CONNECTIONS", 10),
		MaxIdleConnections: getEnvAsInt("DATABASE_MAX_IDLE_CONNECTIONS", 5),
		ConnMaxLifetime:    getEnvAsInt("DATABASE_CONN_MAX_LIFETIME", 300),
		Port:               getEnv("PORT", "8080"),
	}
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

func getEnvAsInt(key string, fallback int) int {
	valueStr := getEnv(key, "")
	if valueStr == "" {
		return fallback
	}
	value, err := strconv.Atoi(valueStr)
	if err != nil {
		return fallback
	}
	return value
}

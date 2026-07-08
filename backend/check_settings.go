package main

import (
	"database/sql"
	"fmt"
	"log"
	"sts-backend/internal/services"

	_ "github.com/lib/pq"
	"sts-backend/internal/database"
)

func main() {
	connStr := "postgresql://postgres.pttatcukzpceljcrwehk:KQ95tJUYdFX251VR@aws-1-us-east-1.pooler.supabase.com:6543/postgres"
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	database.DB = db

	settings, err := services.GetNotificationSettings()
	if err != nil {
		fmt.Printf("Error getting settings: %v\n", err)
	} else {
		fmt.Printf("Settings: %+v\n", settings)
	}
}

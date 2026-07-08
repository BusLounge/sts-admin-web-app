package services

import (
	"sts-backend/internal/config"
	"sts-backend/internal/database"
	"database/sql"
	"log"
)

func TestNotify() {
	connStr := "postgresql://postgres.pttatcukzpceljcrwehk:KQ95tJUYdFX251VR@aws-1-us-east-1.pooler.supabase.com:6543/postgres"
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()
	database.DB = db

	config.LoadConfig()

	notifyApprovalRequest("lounge owner", "Name: Test", "Email: test@test.com")
}

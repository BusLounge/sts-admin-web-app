package main

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/lib/pq"
)

func main() {
	connStr := "postgresql://postgres.pttatcukzpceljcrwehk:KQ95tJUYdFX251VR@aws-1-us-east-1.pooler.supabase.com:6543/postgres"
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal(err)
	}

	query := `SELECT value FROM system_settings WHERE key = 'admin_notification_phones'`
	var value string
	err = db.QueryRow(query).Scan(&value)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	fmt.Println("Value:", value)
}

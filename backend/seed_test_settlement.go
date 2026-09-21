package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	"github.com/google/uuid"
)

func main() {
	godotenv.Load(".env")
	dbUrl := os.Getenv("DATABASE_URL")
	db, err := sql.Open("postgres", dbUrl)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	// 1. Get ANY existing user to use as our test payee
	var userID uuid.UUID
	err = db.QueryRow(`SELECT id FROM public.users LIMIT 1`).Scan(&userID)
	if err != nil {
		log.Fatalf("Could not find any user in the database: %v", err)
	}

	// 2. Insert a settlement that is exactly 14 days old
	earningDate := time.Now().AddDate(0, 0, -14)

	_, err = db.Exec(`
		INSERT INTO public.settlements (
			payee_type, payee_user_id, gross_amount, commission_rate, 
			commission_amount, net_amount, earning_date, status
		) VALUES (
			'driver', $1, 5000, 0.05, 250, 4750, $2, 'pending'
		)
	`, userID, earningDate)
	
	if err != nil {
		log.Fatalf("Failed to insert settlement: %v", err)
	}

	// 3. Ensure the payout tracker exists for this user
	_, err = db.Exec(`
		INSERT INTO public.payout_tracker (payee_user_id, payee_type, payout_frequency_days, is_active)
		VALUES ($1, 'driver', 14, true)
		ON CONFLICT (payee_user_id, payee_type) DO NOTHING
	`, userID)
	if err != nil {
		log.Printf("Failed to insert tracker: %v", err)
	}

	fmt.Println("✅ Successfully inserted a 14-day old test settlement for 4750 LKR!")
	fmt.Println("Go to the UI and click 'Trigger Midnight Process Now'.")
}

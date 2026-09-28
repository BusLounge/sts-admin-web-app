package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

func main() {
	godotenv.Load(".env")
	dbUrl := os.Getenv("DATABASE_URL")
	db, err := sql.Open("postgres", dbUrl)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	_, err = db.Exec(`
		INSERT INTO public.settlement_config (config_key, config_value, description) VALUES
			('bus_owner_share_pct', 70.00, 'Bus owner share of bus fare (%)'),
			('driver_share_pct', 15.00, 'Driver share of bus fare (%)'),
			('conductor_share_pct', 10.00, 'Conductor share of bus fare (%)'),
			('company_commission_pct', 5.00, 'Company commission taken from total bus fare (%)')
		ON CONFLICT (config_key) DO UPDATE SET config_value = EXCLUDED.config_value;
	`)
	if err != nil {
		log.Fatalf("Failed to update config: %v", err)
	}

	fmt.Println("✅ Successfully updated the settlement config in the database!")
}

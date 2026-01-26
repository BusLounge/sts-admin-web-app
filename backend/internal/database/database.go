package database

import (
	"database/sql"
	"log"
	"sts-backend/internal/config"
	"time"

	_ "github.com/lib/pq"
)

var DB *sql.DB

func Init(cfg *config.Config) {
	var err error
	DB, err = sql.Open("postgres", cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Error opening database connection: %v", err)
	}

	DB.SetMaxOpenConns(cfg.MaxConnections)
	DB.SetMaxIdleConns(cfg.MaxIdleConnections)
	DB.SetConnMaxLifetime(time.Duration(cfg.ConnMaxLifetime) * time.Second)

	if err = DB.Ping(); err != nil {
		log.Fatalf("Error connecting to the database: %v", err)
	}

	log.Println("Successfully connected to the database")

	// Auto-migrate tables
	_, err = DB.Exec(`
		CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

		CREATE TABLE IF NOT EXISTS bus_staff (
			id uuid default uuid_generate_v4() primary key,
			staff_type text not null,
			emergency_contact_name text,
			emergency_contact text,
			license_number text,
			license_expiry_date date,
			experience_years int,
			verification_status text default 'Pending',
			verification_notes text,
			created_at timestamp with time zone default timezone('utc'::text, now())
		);

		CREATE TABLE IF NOT EXISTS bus_staff_employment (
			id uuid default uuid_generate_v4() primary key,
			staff_id uuid references bus_staff(id),
			employment_status text default 'Active',
			hire_date date,
			created_at timestamp with time zone default timezone('utc'::text, now())
		);

		CREATE TABLE IF NOT EXISTS lounge_owners (
			id uuid default uuid_generate_v4() primary key,
			manager_full_name text,
			verification_status text default 'Pending',
			verification_notes text
		);

		CREATE TABLE IF NOT EXISTS lounge_marketplace_categories (
			id uuid default uuid_generate_v4() primary key,
			name text
		);

		CREATE TABLE IF NOT EXISTS lounges (
			lounge_id uuid default uuid_generate_v4() primary key,
			owner text,
			owner_nic text,
			owner_email text,
			owner_contact text,
			name text,
			address text,
			lounge_contact text,
			capacity int,
			price_per_hour float,
			lounge_status text default 'open',
			operating_hours text,
			amenities text[],
			services text[],
			images text[],
			created_at timestamp with time zone default timezone('utc'::text, now()),
			verification text default 'Pending',
			verification_note text
		);

		ALTER TABLE lounges ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES lounge_owners(id);
		ALTER TABLE lounges ADD COLUMN IF NOT EXISTS marketplace_category_id uuid REFERENCES lounge_marketplace_categories(id);
		ALTER TABLE lounges ADD COLUMN IF NOT EXISTS is_operational boolean DEFAULT true;

		ALTER TABLE lounge_owners ADD COLUMN IF NOT EXISTS email text;
		ALTER TABLE lounge_owners ADD COLUMN IF NOT EXISTS contact_number text;
		ALTER TABLE lounge_owners ADD COLUMN IF NOT EXISTS nic text;

		-- Add created_at to buses table if it doesn't exist
		ALTER TABLE buses ADD COLUMN IF NOT EXISTS created_at timestamp with time zone default timezone('utc'::text, now());

		-- Lounge Booking Tables
		CREATE TABLE IF NOT EXISTS bookings (
			bus_booking_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
			passenger_name TEXT NOT NULL,
			passenger_phone TEXT,
			booking_reference TEXT UNIQUE,
			scheduled_arrival TIMESTAMP WITH TIME ZONE,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
		);

		CREATE TABLE IF NOT EXISTS lounge_bookings (
			lounge_booking_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
			bus_booking_id UUID REFERENCES bookings(bus_booking_id),
			lounge_name TEXT NOT NULL,
			pricing_type TEXT,
			number_of_guests INT DEFAULT 1,
			selected_amenities JSONB DEFAULT '[]'::jsonb,
			booking_type TEXT,
			total_amount DECIMAL(10, 2) DEFAULT 0,
			payment_status TEXT DEFAULT 'Pending',
			status TEXT DEFAULT 'Pending',
			created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
		);

		CREATE TABLE IF NOT EXISTS lounge_booking_pre_orders (
			pre_order_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
			lounge_booking_id UUID REFERENCES lounge_bookings(lounge_booking_id) ON DELETE CASCADE UNIQUE,
			product_name TEXT,
			quantity INT DEFAULT 1,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
		);

		CREATE INDEX IF NOT EXISTS idx_lounge_bookings_bus_booking ON lounge_bookings(bus_booking_id);
		CREATE INDEX IF NOT EXISTS idx_lounge_bookings_payment_status ON lounge_bookings(payment_status);
		CREATE INDEX IF NOT EXISTS idx_lounge_bookings_status ON lounge_bookings(status);
		CREATE INDEX IF NOT EXISTS idx_lounge_bookings_created_at ON lounge_bookings(created_at DESC);
		CREATE INDEX IF NOT EXISTS idx_lounge_booking_pre_orders_booking ON lounge_booking_pre_orders(lounge_booking_id);
	`)
	if err != nil {
		log.Printf("Error creating/updating tables: %v", err)
	} else {
		log.Println("Database schema updated successfully")
	}
}

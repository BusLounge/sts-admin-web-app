package main

import (
	"fmt"
	"sts-backend/internal/config"
	"sts-backend/internal/database"
)

func main() {
	cfg := config.LoadConfig()
	database.Init(cfg)

	_, err := database.DB.Exec("ALTER TABLE system_settings ADD CONSTRAINT system_settings_setting_key_key UNIQUE (setting_key);")
	if err != nil {
		fmt.Println("Error altering table:", err)
	}

	_, err = database.DB.Exec(`
		INSERT INTO system_settings (setting_key, setting_value)
		VALUES ('admin_notification_phones', '{"lounge_owner": ["94715342627"], "lounge": ["94715342627"], "bus_owner": ["94715342627"], "driver": ["94715342627"], "conductor": ["94715342627"]}'::jsonb)
		ON CONFLICT (setting_key) DO NOTHING;
	`)
	if err != nil {
		fmt.Println("Error inserting data:", err)
	} else {
		fmt.Println("Success fixing database!")
	}
}

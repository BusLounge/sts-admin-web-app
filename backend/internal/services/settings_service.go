package services

import (
	"database/sql"
	"fmt"
	"sts-backend/internal/database"

	"github.com/lib/pq"
)

// NotificationSettings maps a category to a list of phone numbers
type NotificationSettings map[string][]string

// GetNotificationSettings retrieves the notification phone numbers from admin_notification_settings
func GetNotificationSettings() (NotificationSettings, error) {
	query := `
		SELECT lounge_owner_request_mobiles, lounge_request_mobiles, 
			   bus_owner_request_mobiles, driver_request_mobiles, conductor_request_mobiles 
		FROM admin_notification_settings 
		LIMIT 1
	`
	var loungeOwner, lounge, busOwner, driver, conductor pq.StringArray

	err := database.DB.QueryRow(query).Scan(&loungeOwner, &lounge, &busOwner, &driver, &conductor)
	if err != nil {
		if err == sql.ErrNoRows {
			// Return default empty struct if no row exists yet
			return make(NotificationSettings), nil
		}
		return nil, fmt.Errorf("failed to get notification settings: %w", err)
	}

	settings := NotificationSettings{
		"lounge_owner": loungeOwner,
		"lounge":       lounge,
		"bus_owner":    busOwner,
		"driver":       driver,
		"conductor":    conductor,
	}

	return settings, nil
}

// UpdateNotificationSettings updates the notification phone numbers in admin_notification_settings
func UpdateNotificationSettings(settings NotificationSettings) error {
	tx, err := database.DB.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Check if a row exists
	var id string
	err = tx.QueryRow(`SELECT id FROM admin_notification_settings LIMIT 1`).Scan(&id)
	
	loungeOwner := pq.Array(settings["lounge_owner"])
	lounge := pq.Array(settings["lounge"])
	busOwner := pq.Array(settings["bus_owner"])
	driver := pq.Array(settings["driver"])
	conductor := pq.Array(settings["conductor"])

	if err == sql.ErrNoRows {
		// Insert
		insertQuery := `
			INSERT INTO admin_notification_settings (
				lounge_owner_request_mobiles, 
				lounge_request_mobiles, 
				bus_owner_request_mobiles, 
				driver_request_mobiles, 
				conductor_request_mobiles,
				updated_at
			) VALUES ($1, $2, $3, $4, $5, now())
		`
		_, err = tx.Exec(insertQuery, loungeOwner, lounge, busOwner, driver, conductor)
	} else if err == nil {
		// Update
		updateQuery := `
			UPDATE admin_notification_settings 
			SET lounge_owner_request_mobiles = $1,
				lounge_request_mobiles = $2,
				bus_owner_request_mobiles = $3,
				driver_request_mobiles = $4,
				conductor_request_mobiles = $5,
				updated_at = now()
			WHERE id = $6
		`
		_, err = tx.Exec(updateQuery, loungeOwner, lounge, busOwner, driver, conductor, id)
	} else {
		return fmt.Errorf("failed to check existing settings: %w", err)
	}

	if err != nil {
		return fmt.Errorf("failed to save notification settings: %w", err)
	}

	return tx.Commit()
}

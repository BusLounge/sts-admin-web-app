package database

import (
	"database/sql"
	"fmt"
	"sts-backend/internal/models"
)

// GetAllScheduledTrips fetches all scheduled trips joined with route_permits and master_routes.
// If date is non-empty (format "YYYY-MM-DD"), results are filtered to that departure date.
func GetAllScheduledTrips(date string) ([]models.ScheduledTripWithPermit, error) {
	baseQuery := `
		SELECT
			st.id,
			st.departure_datetime,
			st.estimated_duration_minutes,
			st.status,
			COALESCE(st.base_fare, 0),
			COALESCE(st.is_bookable, false),
			COALESCE(st.assigned_driver_id::text, ''),
			COALESCE(st.assigned_conductor_id::text, ''),
			st.created_at,
			COALESCE(st.permit_id::text, ''),
			COALESCE(rp.permit_number, ''),
			COALESCE(rp.bus_registration_number, ''),
			COALESCE(rp.approved_fare, 0),
			COALESCE(rp.status::text, ''),
			COALESCE(rp.expiry_date, '1970-01-01'),
			COALESCE(mr.origin_city, ''),
			COALESCE(mr.destination_city, '')
		FROM scheduled_trips st
		LEFT JOIN route_permits rp ON st.permit_id = rp.id
		LEFT JOIN bus_owner_routes bor ON st.bus_owner_route_id = bor.id
		LEFT JOIN master_routes mr ON mr.id = COALESCE(rp.master_route_id, bor.master_route_id)
	`


	var rows *sql.Rows
	var err error

	if date != "" {
		baseQuery += " WHERE st.departure_datetime::date = $1"
		baseQuery += " ORDER BY st.departure_datetime ASC"
		rows, err = DB.Query(baseQuery, date)
	} else {
		baseQuery += " ORDER BY st.departure_datetime ASC"
		rows, err = DB.Query(baseQuery)
	}

	if err != nil {
		return nil, fmt.Errorf("error querying scheduled trips: %w", err)
	}
	defer rows.Close()

	trips := []models.ScheduledTripWithPermit{}
	for rows.Next() {
		var t models.ScheduledTripWithPermit
		err := rows.Scan(
			&t.ID,
			&t.DepartureDatetime,
			&t.EstimatedDurationMinutes,
			&t.Status,
			&t.BaseFare,
			&t.IsBookable,
			&t.AssignedDriverID,
			&t.AssignedConductorID,
			&t.CreatedAt,
			&t.PermitID,
			&t.PermitNumber,
			&t.BusRegistrationNumber,
			&t.ApprovedFare,
			&t.PermitStatus,
			&t.ExpiryDate,
			&t.OriginCity,
			&t.DestinationCity,
		)
		if err != nil {
			return nil, fmt.Errorf("error scanning scheduled trip: %w", err)
		}
		trips = append(trips, t)
	}
	return trips, nil
}

// StartTrip updates the status of a scheduled trip to 'in_progress'.
// It only allows starting trips that are currently in 'scheduled' status.
func StartTrip(tripID string) error {
	result, err := DB.Exec(
		`UPDATE scheduled_trips SET status = 'in_progress', updated_at = NOW() WHERE id = $1 AND status = 'scheduled'`,
		tripID,
	)
	if err != nil {
		return fmt.Errorf("error updating trip status: %w", err)
	}
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("error checking rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("trip cannot be started: either not found or not in 'scheduled' status")
	}
	return nil
}

// EndTrip updates the status of a trip to 'completed'.
// It only allows ending trips that are currently in 'in_progress' status.
func EndTrip(tripID string) error {
	result, err := DB.Exec(
		`UPDATE scheduled_trips SET status = 'completed', updated_at = NOW() WHERE id = $1 AND status = 'in_progress'`,
		tripID,
	)
	if err != nil {
		return fmt.Errorf("error updating trip status: %w", err)
	}
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("error checking rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("trip cannot be ended: either not found or not currently in 'in_progress' status")
	}
	return nil
}

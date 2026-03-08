package database

import (
	"database/sql"
	"fmt"
	"sts-backend/internal/models"
)

func GetComplaintsByRole(role string) ([]models.Complaint, error) {
	query := `
		SELECT 
			ri.id,
			ri.scheduled_trip_id,
			ri.active_trip_id,
			ri.reported_by_id,
			ri.issue_type,
			ri.priority,
			ri.status,
			ri.description,
			ri.latitude,
			ri.longitude,
			ri.location_address,
			ri.image_url,
			ri.resolved_at,
			ri.resolved_by_id,
			ri.resolution_notes,
			ri.notified_passengers,
			ri.created_at,
			ri.updated_at,
			COALESCE(u.first_name || ' ' || u.last_name, u.first_name, u.last_name, '') as reporter_name,
			COALESCE(u.phone, '') as reporter_phone,
			COALESCE(r.full_name, '') as resolver_name
		FROM report_issues ri
		LEFT JOIN users u ON ri.reported_by_id = u.id
		LEFT JOIN admin_users r ON ri.resolved_by_id::text = r.id::text
		WHERE u.roles && ARRAY[$1]::text[]
		ORDER BY ri.created_at DESC
	`

	rows, err := DB.Query(query, role)
	if err != nil {
		return nil, fmt.Errorf("error querying complaints by role: %w", err)
	}
	defer rows.Close()

	var complaints []models.Complaint
	for rows.Next() {
		var c models.Complaint
		err := rows.Scan(
			&c.ID,
			&c.ScheduledTripID,
			&c.ActiveTripID,
			&c.ReportedByID,
			&c.IssueType,
			&c.Priority,
			&c.Status,
			&c.Description,
			&c.Latitude,
			&c.Longitude,
			&c.LocationAddress,
			&c.ImageURL,
			&c.ResolvedAt,
			&c.ResolvedByID,
			&c.ResolutionNotes,
			&c.NotifiedPassengers,
			&c.CreatedAt,
			&c.UpdatedAt,
			&c.ReporterName,
			&c.ReporterPhone,
			&c.ResolverName,
		)
		if err != nil {
			return nil, fmt.Errorf("error scanning complaint row: %w", err)
		}
		c.ReporterRole = role
		complaints = append(complaints, c)
	}

	return complaints, nil
}

func GetAllComplaints() ([]models.Complaint, error) {
	query := `
		SELECT 
			ri.id,
			ri.scheduled_trip_id,
			ri.active_trip_id,
			ri.reported_by_id,
			ri.issue_type,
			ri.priority,
			ri.status,
			ri.description,
			ri.latitude,
			ri.longitude,
			ri.location_address,
			ri.image_url,
			ri.resolved_at,
			ri.resolved_by_id,
			ri.resolution_notes,
			ri.notified_passengers,
			ri.created_at,
			ri.updated_at,
			COALESCE(u.first_name || ' ' || u.last_name, u.first_name, u.last_name, '') as reporter_name,
			COALESCE(u.phone, '') as reporter_phone,
			CASE 
				WHEN 'driver' = ANY(u.roles) THEN 'driver'
				WHEN 'conductor' = ANY(u.roles) THEN 'conductor'
				WHEN 'bus_owner' = ANY(u.roles) THEN 'bus_owner'
				WHEN 'lounge_owner' = ANY(u.roles) THEN 'lounge_owner'
				WHEN 'passenger' = ANY(u.roles) THEN 'passenger'
				ELSE 'unknown'
			END as reporter_role,
			COALESCE(r.full_name, '') as resolver_name
		FROM report_issues ri
		LEFT JOIN users u ON ri.reported_by_id = u.id
		LEFT JOIN admin_users r ON ri.resolved_by_id::text = r.id::text
		WHERE u.roles && ARRAY['driver', 'conductor', 'bus_owner', 'lounge_owner', 'passenger']::text[]
		ORDER BY ri.created_at DESC
	`

	rows, err := DB.Query(query)
	if err != nil {
		return nil, fmt.Errorf("error querying all complaints: %w", err)
	}
	defer rows.Close()

	var complaints []models.Complaint
	for rows.Next() {
		var c models.Complaint
		err := rows.Scan(
			&c.ID,
			&c.ScheduledTripID,
			&c.ActiveTripID,
			&c.ReportedByID,
			&c.IssueType,
			&c.Priority,
			&c.Status,
			&c.Description,
			&c.Latitude,
			&c.Longitude,
			&c.LocationAddress,
			&c.ImageURL,
			&c.ResolvedAt,
			&c.ResolvedByID,
			&c.ResolutionNotes,
			&c.NotifiedPassengers,
			&c.CreatedAt,
			&c.UpdatedAt,
			&c.ReporterName,
			&c.ReporterPhone,
			&c.ReporterRole,
			&c.ResolverName,
		)
		if err != nil {
			return nil, fmt.Errorf("error scanning complaint row: %w", err)
		}
		complaints = append(complaints, c)
	}

	return complaints, nil
}

func GetComplaintByID(id string) (*models.Complaint, error) {
	query := `
		SELECT 
			ri.id,
			ri.scheduled_trip_id,
			ri.active_trip_id,
			ri.reported_by_id,
			ri.issue_type,
			ri.priority,
			ri.status,
			ri.description,
			ri.latitude,
			ri.longitude,
			ri.location_address,
			ri.image_url,
			ri.resolved_at,
			ri.resolved_by_id,
			ri.resolution_notes,
			ri.notified_passengers,
			ri.created_at,
			ri.updated_at,
			COALESCE(u.first_name || ' ' || u.last_name, u.first_name, u.last_name, '') as reporter_name,
			COALESCE(u.phone, '') as reporter_phone,
			CASE 
				WHEN 'driver' = ANY(u.roles) THEN 'driver'
				WHEN 'conductor' = ANY(u.roles) THEN 'conductor'
				WHEN 'bus_owner' = ANY(u.roles) THEN 'bus_owner'
				WHEN 'lounge_owner' = ANY(u.roles) THEN 'lounge_owner'
				WHEN 'passenger' = ANY(u.roles) THEN 'passenger'
				ELSE 'unknown'
			END as reporter_role,
			COALESCE(r.full_name, '') as resolver_name
		FROM report_issues ri
		LEFT JOIN users u ON ri.reported_by_id = u.id
		LEFT JOIN admin_users r ON ri.resolved_by_id::text = r.id::text
		WHERE ri.id = $1
	`

	var c models.Complaint
	err := DB.QueryRow(query, id).Scan(
		&c.ID,
		&c.ScheduledTripID,
		&c.ActiveTripID,
		&c.ReportedByID,
		&c.IssueType,
		&c.Priority,
		&c.Status,
		&c.Description,
		&c.Latitude,
		&c.Longitude,
		&c.LocationAddress,
		&c.ImageURL,
		&c.ResolvedAt,
		&c.ResolvedByID,
		&c.ResolutionNotes,
		&c.NotifiedPassengers,
		&c.CreatedAt,
		&c.UpdatedAt,
		&c.ReporterName,
		&c.ReporterPhone,
		&c.ReporterRole,
		&c.ResolverName,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("error querying complaint by ID: %w", err)
	}

	return &c, nil
}

func UpdateComplaintStatus(id string, status string, resolvedByID *string, resolutionNotes *string) error {
	query := `
		UPDATE report_issues 
		SET status = $1, 
			resolved_by_id = $2, 
			resolution_notes = $3,
			resolved_at = CASE WHEN $1 = 'resolved' THEN NOW() ELSE resolved_at END,
			updated_at = NOW()
		WHERE id = $4
	`

	_, err := DB.Exec(query, status, resolvedByID, resolutionNotes, id)
	if err != nil {
		return fmt.Errorf("error updating complaint status: %w", err)
	}

	return nil
}

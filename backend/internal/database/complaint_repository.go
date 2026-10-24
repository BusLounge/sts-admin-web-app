package database

import (
	"database/sql"
	"fmt"
	"strings"
	"sts-backend/internal/models"
)

func normalizeAccessValue(value string) string {
	v := strings.ToLower(strings.TrimSpace(value))
	v = strings.ReplaceAll(v, "-", "_")
	v = strings.ReplaceAll(v, " ", "_")
	return v
}

func resolveEffectiveAdminAccess(adminID, role, appScope string) (string, string) {
	effectiveRole := normalizeAccessValue(role)
	effectiveScope := normalizeAccessValue(appScope)

	if adminID == "" {
		return effectiveRole, effectiveScope
	}

	var dbRole string
	var dbScope string
	err := DB.QueryRow(
		`SELECT COALESCE(role, ''), COALESCE(app_scope, '') FROM admin_users WHERE id::text = $1`,
		adminID,
	).Scan(&dbRole, &dbScope)
	if err == nil {
		if normalized := normalizeAccessValue(dbRole); normalized != "" {
			effectiveRole = normalized
		}
		if normalized := normalizeAccessValue(dbScope); normalized != "" {
			effectiveScope = normalized
		}
	}

	return effectiveRole, effectiveScope
}

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
			COALESCE(r.first_name || ' ' || r.last_name, r.first_name, r.last_name, '') as resolver_name
		FROM report_issues ri
		LEFT JOIN users u ON ri.reported_by_id = u.id
		LEFT JOIN users r ON ri.resolved_by_id = r.id
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
			COALESCE(r.first_name || ' ' || r.last_name, r.first_name, r.last_name, '') as resolver_name
		FROM report_issues ri
		LEFT JOIN users u ON ri.reported_by_id = u.id
		LEFT JOIN users r ON ri.resolved_by_id = r.id
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

func GetComplaintsForAdmin(adminID, role, appScope string) ([]models.Complaint, error) {
	effectiveRole, effectiveScope := resolveEffectiveAdminAccess(adminID, role, appScope)

	if effectiveRole == "super_admin" {
		return GetAllComplaints()
	}

	// Driver workflow: driver admin/supervisor can only see complaints assigned to their app-role team.
	if effectiveScope == "driver" && (effectiveRole == "admin" || effectiveRole == "supervisor") {
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
				COALESCE(r.first_name || ' ' || r.last_name, r.first_name, r.last_name, '') as resolver_name
			FROM report_issues ri
			LEFT JOIN users u ON ri.reported_by_id = u.id
			LEFT JOIN users r ON ri.resolved_by_id = r.id
			WHERE 'driver' = ANY(u.roles)
			ORDER BY ri.created_at DESC
		`

		rows, err := DB.Query(query)
		if err != nil {
			return nil, fmt.Errorf("error querying driver complaints: %w", err)
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

	// Non-driver scoped admins retain broad read visibility.
	return GetAllComplaints()
}

func GetComplaintsForAdminPaginated(adminID, role, appScope, reporterRole string, limit, offset int) ([]models.Complaint, int, error) {
	effectiveRole, effectiveScope := resolveEffectiveAdminAccess(adminID, role, appScope)
	reporterRole = normalizeAccessValue(reporterRole)
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}

	if effectiveScope == "driver" && (effectiveRole == "admin" || effectiveRole == "supervisor") {
		countQuery := `
			SELECT COUNT(*)
			FROM report_issues ri
			LEFT JOIN users u ON ri.reported_by_id = u.id
			WHERE 'driver' = ANY(u.roles)
		`
		var total int
		if err := DB.QueryRow(countQuery).Scan(&total); err != nil {
			return nil, 0, fmt.Errorf("error counting paginated driver complaints: %w", err)
		}

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
				COALESCE(r.first_name || ' ' || r.last_name, r.first_name, r.last_name, '') as resolver_name
			FROM report_issues ri
			LEFT JOIN users u ON ri.reported_by_id = u.id
			LEFT JOIN users r ON ri.resolved_by_id = r.id
			WHERE 'driver' = ANY(u.roles)
			ORDER BY ri.created_at DESC
			LIMIT $1 OFFSET $2
		`

		rows, err := DB.Query(query, limit, offset)
		if err != nil {
			return nil, 0, fmt.Errorf("error querying paginated driver complaints: %w", err)
		}
		defer rows.Close()

		complaints := make([]models.Complaint, 0, limit)
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
				return nil, 0, fmt.Errorf("error scanning paginated driver complaint row: %w", err)
			}
			complaints = append(complaints, c)
		}

		return complaints, total, nil
	}

	countQuery := `
		SELECT COUNT(*)
		FROM report_issues ri
		LEFT JOIN users u ON ri.reported_by_id = u.id
		WHERE ($1 = '' OR $1 = ANY(u.roles))
	`
	var total int
	if err := DB.QueryRow(countQuery, reporterRole).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("error counting paginated complaints: %w", err)
	}

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
			COALESCE(r.first_name || ' ' || r.last_name, r.first_name, r.last_name, '') as resolver_name
		FROM report_issues ri
		LEFT JOIN users u ON ri.reported_by_id = u.id
		LEFT JOIN users r ON ri.resolved_by_id = r.id
		WHERE ($1 = '' OR $1 = ANY(u.roles))
		ORDER BY ri.created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := DB.Query(query, reporterRole, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("error querying paginated complaints: %w", err)
	}
	defer rows.Close()

	complaints := make([]models.Complaint, 0, limit)
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
			return nil, 0, fmt.Errorf("error scanning paginated complaint row: %w", err)
		}
		complaints = append(complaints, c)
	}

	return complaints, total, nil
}

func GetComplaintByIDForAdmin(id, adminID, role string) (*models.Complaint, error) {
	effectiveRole, effectiveScope := resolveEffectiveAdminAccess(adminID, role, "")

	if effectiveRole == "super_admin" {
		return GetComplaintByID(id)
	}

	if effectiveScope == "driver" && (effectiveRole == "admin" || effectiveRole == "supervisor") {
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
				COALESCE(r.first_name || ' ' || r.last_name, r.first_name, r.last_name, '') as resolver_name
			FROM report_issues ri
			LEFT JOIN users u ON ri.reported_by_id = u.id
			LEFT JOIN users r ON ri.resolved_by_id = r.id
			WHERE ri.id = $1
			  AND 'driver' = ANY(u.roles)
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
			return nil, fmt.Errorf("error querying complaint by id for driver admin/supervisor: %w", err)
		}

		return &c, nil
	}

	return GetComplaintByID(id)
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
			COALESCE(r.first_name || ' ' || r.last_name, r.first_name, r.last_name, '') as resolver_name
		FROM report_issues ri
		LEFT JOIN users u ON ri.reported_by_id = u.id
		LEFT JOIN users r ON ri.resolved_by_id = r.id
		WHERE ri.id = $1
		  AND u.roles && ARRAY['driver', 'conductor', 'bus_owner', 'lounge_owner', 'passenger']::text[]
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
		SET status = CAST($1 AS VARCHAR), 
			resolved_by_id = CASE
				WHEN CAST($1 AS VARCHAR) IN ('resolved', 'closed') AND CAST($2 AS UUID) IS NOT NULL THEN (
					SELECT u.id
					FROM admin_users au
					JOIN users u ON lower(trim(u.email)) = lower(trim(au.email))
					WHERE au.id = CAST($2 AS UUID)
					LIMIT 1
				)
				ELSE NULL
			END,
			resolution_notes = $3,
			resolved_at = CASE WHEN CAST($1 AS VARCHAR) = 'resolved' THEN NOW() ELSE resolved_at END,
			updated_at = NOW()
		WHERE id = CAST($4 AS UUID)
	`

	_, err := DB.Exec(query, status, resolvedByID, resolutionNotes, id)
	if err != nil {
		return fmt.Errorf("error updating complaint status: %w", err)
	}

	return nil
}


func GetInvolvedPartiesForComplaint(complaintID string) (*models.InvolvedPartiesResponse, error) {
	query := `
		SELECT 
			ri.id::text,
			COALESCE(ri.scheduled_trip_id::text, ''),
			COALESCE(ri.active_trip_id::text, ''),
			ri.issue_type,
			ri.priority,
			ri.status,
			ri.description,
			ri.created_at::text,
			COALESCE(u.id::text, '') as customer_id,
			COALESCE(TRIM(CONCAT(u.first_name, ' ', u.last_name)), u.first_name, '') as customer_name,
			COALESCE(u.phone, '') as customer_phone,
			COALESCE(u.email, '') as customer_email,
			COALESCE(mr.route_name, mr.origin_city || ' - ' || mr.destination_city, '') as route_name,
			COALESCE(rp.bus_registration_number, '') as bus_reg,
			COALESCE(st.departure_datetime::text, '') as departure_dt,
			COALESCE(bo.id::text, '') as owner_id,
			COALESCE(bo.company_name, '') as owner_company,
			COALESCE(bo.contact_person, TRIM(CONCAT(bu.first_name, ' ', bu.last_name)), '') as owner_contact,
			COALESCE(bo.business_phone, bu.phone, '') as owner_phone,
			COALESCE(bo.business_email, bu.email, '') as owner_email,
			COALESCE(du.id::text, '') as driver_id,
			COALESCE(TRIM(CONCAT(du.first_name, ' ', du.last_name)), du.first_name, '') as driver_name,
			COALESCE(du.phone, '') as driver_phone,
			COALESCE(du.email, '') as driver_email,
			COALESCE(cu.id::text, '') as conductor_id,
			COALESCE(TRIM(CONCAT(cu.first_name, ' ', cu.last_name)), cu.first_name, '') as conductor_name,
			COALESCE(cu.phone, '') as conductor_phone,
			COALESCE(cu.email, '') as conductor_email
		FROM report_issues ri
		LEFT JOIN users u ON ri.reported_by_id = u.id
		LEFT JOIN scheduled_trips st ON (ri.scheduled_trip_id = st.id OR ri.active_trip_id IN (SELECT id FROM active_trips WHERE scheduled_trip_id = st.id))
		LEFT JOIN route_permits rp ON st.permit_id = rp.id
		LEFT JOIN master_routes mr ON rp.master_route_id = mr.id
		LEFT JOIN bus_owners bo ON rp.bus_owner_id = bo.id
		LEFT JOIN users bu ON bo.user_id = bu.id
		LEFT JOIN users du ON st.assigned_driver_id = du.id
		LEFT JOIN users cu ON st.assigned_conductor_id = cu.id
		WHERE ri.id = CAST($1 AS UUID)
		LIMIT 1
	`

	var resp models.InvolvedPartiesResponse
	var scheduledTripID, activeTripID, departureDT string
	var customerID, customerName, customerPhone, customerEmail string
	var ownerID, ownerCompany, ownerContact, ownerPhone, ownerEmail string
	var driverID, driverName, driverPhone, driverEmail string
	var conductorID, conductorName, conductorPhone, conductorEmail string

	err := DB.QueryRow(query, complaintID).Scan(
		&resp.ComplaintID,
		&scheduledTripID,
		&activeTripID,
		&resp.IssueType,
		&resp.Priority,
		&resp.Status,
		&resp.Description,
		&resp.CreatedAt,
		&customerID,
		&customerName,
		&customerPhone,
		&customerEmail,
		&resp.RouteName,
		&resp.BusRegistrationNumber,
		&departureDT,
		&ownerID,
		&ownerCompany,
		&ownerContact,
		&ownerPhone,
		&ownerEmail,
		&driverID,
		&driverName,
		&driverPhone,
		&driverEmail,
		&conductorID,
		&conductorName,
		&conductorPhone,
		&conductorEmail,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("error querying involved parties: %w", err)
	}

	if scheduledTripID != "" {
		resp.ScheduledTripID = &scheduledTripID
	}
	if activeTripID != "" {
		resp.ActiveTripID = &activeTripID
	}
	if departureDT != "" {
		resp.DepartureDatetime = &departureDT
	}

	// Format Category
	categoryWords := strings.Split(resp.IssueType, "_")
	for i, w := range categoryWords {
		if len(w) > 0 {
			categoryWords[i] = strings.ToUpper(w[:1]) + strings.ToLower(w[1:])
		}
	}
	resp.Category = strings.Join(categoryWords, " ")

	resp.Customer = models.InvolvedPartyPerson{
		ID:    customerID,
		Name:  customerName,
		Phone: customerPhone,
		Email: customerEmail,
		Role:  "passenger",
	}

	if ownerID != "" || ownerCompany != "" || ownerPhone != "" {
		resp.BusOwner = &models.InvolvedBusOwner{
			ID:            ownerID,
			CompanyName:   ownerCompany,
			ContactPerson: ownerContact,
			BusinessPhone: ownerPhone,
			BusinessEmail: ownerEmail,
		}
	}

	if driverID != "" || driverName != "" || driverPhone != "" {
		resp.Driver = &models.InvolvedPartyPerson{
			ID:    driverID,
			Name:  driverName,
			Phone: driverPhone,
			Email: driverEmail,
			Role:  "driver",
		}
	}

	if conductorID != "" || conductorName != "" || conductorPhone != "" {
		resp.Conductor = &models.InvolvedPartyPerson{
			ID:    conductorID,
			Name:  conductorName,
			Phone: conductorPhone,
			Email: conductorEmail,
			Role:  "conductor",
		}
	}

	return &resp, nil
}

func GetPendingComplaintNotifications() ([]models.PendingComplaintNotification, error) {
	query := `
		SELECT 
			ri.id::text,
			'complaint' as type,
			COALESCE(TRIM(CONCAT(u.first_name, ' ', u.last_name)), u.first_name, 'Passenger') as customer_name,
			COALESCE(u.phone, '') as customer_phone,
			COALESCE(ri.issue_type, 'General') as category,
			COALESCE(ri.priority, 'medium') as priority,
			COALESCE(ri.description, '') as description,
			COALESCE(ri.status, 'reported') as status,
			ri.created_at::text,
			COALESCE(rp.bus_registration_number, '') as bus_number,
			COALESCE(mr.route_name, mr.origin_city || ' - ' || mr.destination_city, '') as route_name
		FROM report_issues ri
		LEFT JOIN users u ON ri.reported_by_id = u.id
		LEFT JOIN scheduled_trips st ON (ri.scheduled_trip_id = st.id OR ri.active_trip_id IN (SELECT id FROM active_trips WHERE scheduled_trip_id = st.id))
		LEFT JOIN route_permits rp ON st.permit_id = rp.id
		LEFT JOIN master_routes mr ON rp.master_route_id = mr.id
		WHERE ri.status IN ('reported', 'pending')
		ORDER BY ri.created_at DESC
		LIMIT 50
	`

	rows, err := DB.Query(query)
	if err != nil {
		return nil, fmt.Errorf("error querying pending complaint notifications: %w", err)
	}
	defer rows.Close()

	var list []models.PendingComplaintNotification
	for rows.Next() {
		var n models.PendingComplaintNotification
		err := rows.Scan(
			&n.ID,
			&n.Type,
			&n.CustomerName,
			&n.CustomerPhone,
			&n.Category,
			&n.Priority,
			&n.Description,
			&n.Status,
			&n.CreatedAt,
			&n.BusNumber,
			&n.RouteName,
		)
		if err != nil {
			return nil, fmt.Errorf("error scanning pending complaint notification: %w", err)
		}

		words := strings.Split(n.Category, "_")
		for i, w := range words {
			if len(w) > 0 {
				words[i] = strings.ToUpper(w[:1]) + strings.ToLower(w[1:])
			}
		}
		n.Category = strings.Join(words, " ")

		list = append(list, n)
	}

	return list, nil
}

func ResolveComplaintDirectly(id string, solutionMessage string, adminID string) error {
	query := `
		UPDATE report_issues
		SET status = 'resolved',
			resolution_notes = $1,
			resolved_at = NOW(),
			resolved_by_id = CASE
				WHEN $2 != '' THEN (
					SELECT u.id
					FROM admin_users au
					JOIN users u ON lower(trim(u.email)) = lower(trim(au.email))
					WHERE au.id = CAST($2 AS UUID)
					LIMIT 1
				)
				ELSE NULL
			END,
			updated_at = NOW()
		WHERE id = CAST($3 AS UUID)
	`
	_, err := DB.Exec(query, solutionMessage, adminID, id)
	if err != nil {
		return fmt.Errorf("error updating report_issues status to resolved: %w", err)
	}

	historyQuery := `
		INSERT INTO complaint_escalation_history (
			complaint_id, level, team_name, escalated_at, escalated_by,
			from_admin_id, to_admin_id, reason, created_at
		)
		VALUES (
			CAST($1 AS UUID),
			COALESCE((SELECT current_level FROM complaint_escalations WHERE complaint_id = CAST($1 AS UUID)), 1),
			COALESCE((SELECT current_team FROM complaint_escalations WHERE complaint_id = CAST($1 AS UUID)), 'admin_support'),
			NOW(),
			'admin',
			CASE WHEN $2 != '' THEN CAST($2 AS UUID) ELSE NULL END,
			NULL,
			$3,
			NOW()
		)
	`
	reason := fmt.Sprintf("Direct Admin Resolution: %s", solutionMessage)
	_, _ = DB.Exec(historyQuery, id, adminID, reason)

	return nil
}

func LogPartiesNotification(id string, proposedSolution string, adminID string, logDetails string) error {
	query := `
		UPDATE report_issues
		SET status = 'in_progress',
			resolution_notes = CASE 
				WHEN resolution_notes IS NULL OR resolution_notes = '' THEN $1
				ELSE resolution_notes || E'\n' || $1
			END,
			updated_at = NOW()
		WHERE id = CAST($2 AS UUID)
	`
	_, err := DB.Exec(query, fmt.Sprintf("[Admin Directive]: %s", proposedSolution), id)
	if err != nil {
		return fmt.Errorf("error updating report_issues for parties notification: %w", err)
	}

	historyQuery := `
		INSERT INTO complaint_escalation_history (
			complaint_id, level, team_name, escalated_at, escalated_by,
			from_admin_id, to_admin_id, reason, created_at
		)
		VALUES (
			CAST($1 AS UUID),
			COALESCE((SELECT current_level FROM complaint_escalations WHERE complaint_id = CAST($1 AS UUID)), 1),
			COALESCE((SELECT current_team FROM complaint_escalations WHERE complaint_id = CAST($1 AS UUID)), 'stakeholder_escalation'),
			NOW(),
			'admin',
			CASE WHEN $2 != '' THEN CAST($2 AS UUID) ELSE NULL END,
			NULL,
			$3,
			NOW()
		)
	`
	_, _ = DB.Exec(historyQuery, id, adminID, logDetails)
	return nil
}

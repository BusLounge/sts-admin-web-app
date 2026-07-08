package database

import (
	"database/sql"
	"fmt"
	"sts-backend/internal/models"
	"time"
)

// RouteRepository handles all database operations for master_routes
type RouteRepository struct {
	db *sql.DB
}

func NewRouteRepository(db *sql.DB) *RouteRepository {
	return &RouteRepository{db: db}
}

// GetAll returns all routes ordered by route_number
func (r *RouteRepository) GetAll() ([]models.MasterRoute, error) {
	query := `
		SELECT id, route_number, route_name, COALESCE(origin_city, ''), COALESCE(destination_city, ''),
		       COALESCE(total_distance_km, '0'), COALESCE(estimated_duration_minutes, 210), COALESCE(encoded_polyline, ''),
		       is_active, created_at, updated_at
		FROM master_routes
		ORDER BY route_number ASC
	`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("query routes: %w", err)
	}
	defer rows.Close()

	var routes []models.MasterRoute
	for rows.Next() {
		var route models.MasterRoute
		err := rows.Scan(
			&route.ID, &route.RouteNumber, &route.RouteName,
			&route.OriginCity, &route.DestinationCity,
			&route.TotalDistanceKm, &route.EstimatedDurationMinutes,
			&route.EncodedPolyline, &route.IsActive,
			&route.CreatedAt, &route.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("scan route: %w", err)
		}
		routes = append(routes, route)
	}
	if routes == nil {
		routes = []models.MasterRoute{}
	}
	return routes, nil
}

// GetByID returns a single route by its UUID
func (r *RouteRepository) GetByID(id string) (*models.MasterRoute, error) {
	query := `
		SELECT id, route_number, route_name, COALESCE(origin_city, ''), COALESCE(destination_city, ''),
		       COALESCE(total_distance_km, '0'), COALESCE(estimated_duration_minutes, 210), COALESCE(encoded_polyline, ''),
		       is_active, created_at, updated_at
		FROM master_routes
		WHERE id = $1
	`
	var route models.MasterRoute
	err := r.db.QueryRow(query, id).Scan(
		&route.ID, &route.RouteNumber, &route.RouteName,
		&route.OriginCity, &route.DestinationCity,
		&route.TotalDistanceKm, &route.EstimatedDurationMinutes,
		&route.EncodedPolyline, &route.IsActive,
		&route.CreatedAt, &route.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get route by id: %w", err)
	}
	return &route, nil
}

// GetRouteStops returns all stops for a specific route
func (r *RouteRepository) GetRouteStops(routeID string) ([]models.RouteStop, error) {
	query := `
		SELECT id, master_route_id, stop_name, stop_order, latitude, longitude, COALESCE(arrival_time_offset_minutes, 0), is_major_stop
		FROM master_route_stops
		WHERE master_route_id = $1
		ORDER BY stop_order ASC
	`
	rows, err := r.db.Query(query, routeID)
	if err != nil {
		return nil, fmt.Errorf("query route stops: %w", err)
	}
	defer rows.Close()

	var stops []models.RouteStop
	for rows.Next() {
		var stop models.RouteStop
		err := rows.Scan(
			&stop.ID, &stop.MasterRouteID, &stop.StopName, &stop.StopOrder,
			&stop.Latitude, &stop.Longitude, &stop.ArrivalTimeOffsetMins, &stop.IsMajorStop,
		)
		if err != nil {
			return nil, fmt.Errorf("scan route stop: %w", err)
		}
		stops = append(stops, stop)
	}
	if stops == nil {
		stops = []models.RouteStop{}
	}
	return stops, nil
}

// Create inserts a new route and its stops using a transaction
func (r *RouteRepository) Create(req *models.CreateRouteRequest) (*models.MasterRoute, error) {
	// If route_number not provided, auto-generate next one
	if req.RouteNumber == "" {
		var maxNum int
		_ = r.db.QueryRow(`SELECT COALESCE(MAX(CAST(route_number AS INTEGER)), 0) FROM master_routes WHERE route_number ~ '^[0-9]+$'`).Scan(&maxNum)
		req.RouteNumber = fmt.Sprintf("%d", maxNum+1)
	}

	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	if req.EstimatedDurationMinutes == 0 {
		req.EstimatedDurationMinutes = 210
	}
	if req.TotalDistanceKm == "" {
		req.TotalDistanceKm = "0"
	}

	tx, err := r.db.Begin()
	if err != nil {
		return nil, fmt.Errorf("begin transaction: %w", err)
	}
	defer tx.Rollback()

	query := `
		INSERT INTO master_routes
		  (route_number, route_name, origin_city, destination_city,
		   total_distance_km, estimated_duration_minutes, encoded_polyline, is_active)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, route_number, route_name, COALESCE(origin_city, ''), COALESCE(destination_city, ''),
		          COALESCE(total_distance_km, '0'), COALESCE(estimated_duration_minutes, 210), COALESCE(encoded_polyline, ''),
		          is_active, created_at, updated_at
	`
	var route models.MasterRoute
	err = tx.QueryRow(query,
		req.RouteNumber, req.RouteName, req.OriginCity, req.DestinationCity,
		req.TotalDistanceKm, req.EstimatedDurationMinutes, req.EncodedPolyline, isActive,
	).Scan(
		&route.ID, &route.RouteNumber, &route.RouteName,
		&route.OriginCity, &route.DestinationCity,
		&route.TotalDistanceKm, &route.EstimatedDurationMinutes,
		&route.EncodedPolyline, &route.IsActive,
		&route.CreatedAt, &route.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("insert route: %w", err)
	}

	// Insert stops
	if len(req.Stops) > 0 {
		stopQuery := `
			INSERT INTO master_route_stops
			  (master_route_id, stop_name, stop_order, latitude, longitude, is_major_stop)
			VALUES ($1, $2, $3, $4, $5, $6)
		`
		for _, stop := range req.Stops {
			_, err = tx.Exec(stopQuery,
				route.ID, stop.StopName, stop.StopOrder, stop.Latitude, stop.Longitude, true,
			)
			if err != nil {
				return nil, fmt.Errorf("insert route stop: %w", err)
			}
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("commit transaction: %w", err)
	}

	return &route, nil
}

// Update modifies an existing route and its stops using a transaction
func (r *RouteRepository) Update(id string, req *models.UpdateRouteRequest) (*models.MasterRoute, error) {
	tx, err := r.db.Begin()
	if err != nil {
		return nil, fmt.Errorf("begin transaction: %w", err)
	}
	defer tx.Rollback()

	query := `
		UPDATE master_routes SET
			route_number              = COALESCE(NULLIF($1,''), route_number),
			route_name                = COALESCE(NULLIF($2,''), route_name),
			origin_city               = COALESCE(NULLIF($3,''), origin_city),
			destination_city          = COALESCE(NULLIF($4,''), destination_city),
			total_distance_km = COALESCE(NULLIF($5,'')::numeric, total_distance_km),
			estimated_duration_minutes= CASE WHEN $6 > 0 THEN $6 ELSE estimated_duration_minutes END,
			encoded_polyline          = COALESCE(NULLIF($7,''), encoded_polyline),
			is_active                 = CASE WHEN $8 THEN $9 ELSE is_active END,
			updated_at                = $10
		WHERE id = $11
		RETURNING id, route_number, route_name, COALESCE(origin_city, ''), COALESCE(destination_city, ''),
		          COALESCE(total_distance_km, '0'), COALESCE(estimated_duration_minutes, 210), COALESCE(encoded_polyline, ''),
		          is_active, created_at, updated_at
	`
	hasIsActive := req.IsActive != nil
	isActive := false
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	var route models.MasterRoute
	err = tx.QueryRow(query,
		req.RouteNumber, req.RouteName, req.OriginCity, req.DestinationCity,
		req.TotalDistanceKm, req.EstimatedDurationMinutes, req.EncodedPolyline,
		hasIsActive, isActive, time.Now(), id,
	).Scan(
		&route.ID, &route.RouteNumber, &route.RouteName,
		&route.OriginCity, &route.DestinationCity,
		&route.TotalDistanceKm, &route.EstimatedDurationMinutes,
		&route.EncodedPolyline, &route.IsActive,
		&route.CreatedAt, &route.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("update route: %w", err)
	}

	// Delete existing stops
	_, err = tx.Exec(`DELETE FROM master_route_stops WHERE master_route_id = $1`, route.ID)
	if err != nil {
		return nil, fmt.Errorf("delete old route stops: %w", err)
	}

	// Insert new stops
	if len(req.Stops) > 0 {
		stopQuery := `
			INSERT INTO master_route_stops
			  (master_route_id, stop_name, stop_order, latitude, longitude, is_major_stop)
			VALUES ($1, $2, $3, $4, $5, $6)
		`
		for _, stop := range req.Stops {
			_, err = tx.Exec(stopQuery,
				route.ID, stop.StopName, stop.StopOrder, stop.Latitude, stop.Longitude, true,
			)
			if err != nil {
				return nil, fmt.Errorf("insert new route stop: %w", err)
			}
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("commit transaction: %w", err)
	}

	return &route, nil
}

// Delete removes a route by ID
func (r *RouteRepository) Delete(id string) error {
	_, err := r.db.Exec(`DELETE FROM master_routes WHERE id = $1`, id)
	return err
}

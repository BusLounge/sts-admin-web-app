package models

import "time"

// ScheduledTripWithPermit is the combined view of a scheduled trip joined with its route permit and master route.
type ScheduledTripWithPermit struct {
	// From scheduled_trips
	ID                       string    `json:"id"`
	DepartureDatetime        time.Time `json:"departure_datetime"`
	EstimatedDurationMinutes int       `json:"estimated_duration_minutes"`
	Status                   string    `json:"status"`
	BaseFare                 float64   `json:"base_fare"`
	IsBookable               bool      `json:"is_bookable"`
	AssignedDriverID         string    `json:"assigned_driver_id"`
	AssignedConductorID      string    `json:"assigned_conductor_id"`
	CreatedAt                time.Time `json:"created_at"`

	// From route_permits (joined via scheduled_trips.permit_id)
	PermitID              string    `json:"permit_id"`
	PermitNumber          string    `json:"permit_number"`
	BusRegistrationNumber string    `json:"bus_registration_number"`
	ApprovedFare          float64   `json:"approved_fare"`
	PermitStatus          string    `json:"permit_status"`
	ExpiryDate            time.Time `json:"expiry_date"`

	// From master_routes (joined via route_permits.master_route_id)
	OriginCity      string `json:"origin_city"`
	DestinationCity string `json:"destination_city"`
}

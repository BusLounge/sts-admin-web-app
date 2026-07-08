package models

import "time"

// MasterRoute represents a bus route with its encoded polyline path
type MasterRoute struct {
	ID                       string    `json:"id"`
	RouteNumber              string    `json:"route_number"`
	RouteName                string    `json:"route_name"`
	OriginCity               string    `json:"origin_city"`
	DestinationCity          string    `json:"destination_city"`
	TotalDistanceKm          string    `json:"total_distance_km"`
	EstimatedDurationMinutes int       `json:"estimated_duration_minutes"`
	EncodedPolyline          string    `json:"encoded_polyline"`
	IsActive                 bool      `json:"is_active"`
	CreatedAt                time.Time `json:"created_at"`
	UpdatedAt                time.Time `json:"updated_at"`
}

// RouteStop represents a point marked as a stop on a master route
type RouteStop struct {
	ID                     string  `json:"id,omitempty"`
	MasterRouteID          string  `json:"master_route_id,omitempty"`
	StopName               string  `json:"stop_name"`
	StopOrder              int     `json:"stop_order"`
	Latitude               float64 `json:"latitude"`
	Longitude              float64 `json:"longitude"`
	ArrivalTimeOffsetMins  int     `json:"arrival_time_offset_minutes,omitempty"`
	IsMajorStop            bool    `json:"is_major_stop"`
}

// CreateRouteRequest is used when creating a new route
type CreateRouteRequest struct {
	RouteNumber              string      `json:"route_number"`
	RouteName                string      `json:"route_name" binding:"required"`
	OriginCity               string      `json:"origin_city" binding:"required"`
	DestinationCity          string      `json:"destination_city" binding:"required"`
	TotalDistanceKm          string      `json:"total_distance_km"`
	EstimatedDurationMinutes int         `json:"estimated_duration_minutes"`
	EncodedPolyline          string      `json:"encoded_polyline" binding:"required"`
	IsActive                 *bool       `json:"is_active"`
	Stops                    []RouteStop `json:"stops"`
}

// UpdateRouteRequest is used when updating an existing route
type UpdateRouteRequest struct {
	RouteNumber              string      `json:"route_number"`
	RouteName                string      `json:"route_name"`
	OriginCity               string      `json:"origin_city"`
	DestinationCity          string      `json:"destination_city"`
	TotalDistanceKm          string      `json:"total_distance_km"`
	EstimatedDurationMinutes int         `json:"estimated_duration_minutes"`
	EncodedPolyline          string      `json:"encoded_polyline"`
	IsActive                 *bool       `json:"is_active"`
	Stops                    []RouteStop `json:"stops"`
}

package services

import (
	"sts-backend/internal/database"
	"sts-backend/internal/models"
)

// GetAllScheduledTrips returns all scheduled trips optionally filtered by date.
func GetAllScheduledTrips(date string) ([]models.ScheduledTripWithPermit, error) {
	return database.GetAllScheduledTrips(date)
}

// StartTrip marks a trip as in_progress. Returns an error if the trip is
// not in 'scheduled' status.
func StartTrip(tripID string) error {
	return database.StartTrip(tripID)
}

// EndTrip marks a trip as completed. Returns an error if the trip is
// not in 'in_progress' status.
func EndTrip(tripID string) error {
	return database.EndTrip(tripID)
}

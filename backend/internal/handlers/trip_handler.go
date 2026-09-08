package handlers

import (
	"net/http"
	"sts-backend/internal/services"

	"github.com/gin-gonic/gin"
)

// GetScheduledTrips returns all scheduled trips joined with route permit and master route data.
// Accepts an optional ?date=YYYY-MM-DD query parameter to filter by departure date.
func GetScheduledTrips(c *gin.Context) {
	date := c.Query("date") // e.g. "2026-09-08"
	trips, err := services.GetAllScheduledTrips(date)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, trips)
}

// StartTrip updates a scheduled trip's status to 'in_progress'.
// Returns 400 if the trip is not in 'scheduled' status.
func StartTrip(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Trip ID is required"})
		return
	}

	if err := services.StartTrip(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Trip started successfully"})
}

// EndTrip updates a trip's status to 'completed'.
// Returns 400 if the trip is not currently 'in_progress'.
func EndTrip(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Trip ID is required"})
		return
	}

	if err := services.EndTrip(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Trip ended successfully"})
}

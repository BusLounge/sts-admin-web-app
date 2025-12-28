package handlers

import (
	"net/http"
	"sts-backend/internal/models"
	"sts-backend/internal/services"

	"github.com/gin-gonic/gin"
)

func GetBuses(c *gin.Context) {
	buses, err := services.GetAllBuses()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, buses)
}

func GetPendingBuses(c *gin.Context) {
	buses, err := services.GetPendingBuses()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, buses)
}

func CreateBus(c *gin.Context) {
	var bus models.Bus
	if err := c.ShouldBindJSON(&bus); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set default values if needed
	if bus.VerificationStatus == "" {
		bus.VerificationStatus = "Pending"
	}
	bus.Status = "Active"

	err := services.CreateBus(&bus)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, bus)
}

func UpdateBus(c *gin.Context) {
	id := c.Param("id")
	var bus models.Bus
	if err := c.ShouldBindJSON(&bus); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	bus.ID = id
	err := services.UpdateBus(&bus)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Bus updated successfully"})
}

type BusVerificationRequest struct {
	Status string `json:"status"`
}

func VerifyBus(c *gin.Context) {
	id := c.Param("id")
	var req BusVerificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := services.UpdateBusVerification(id, req.Status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Bus verification updated"})
}

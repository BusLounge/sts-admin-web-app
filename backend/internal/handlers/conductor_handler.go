package handlers

import (
	"net/http"
	"sts-backend/internal/models"
	"sts-backend/internal/services"

	"github.com/gin-gonic/gin"
)

func GetConductors(c *gin.Context) {
	conductors, err := services.GetConductors()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, conductors)
}

func CreateConductor(c *gin.Context) {
	var conductor models.Conductor
	if err := c.ShouldBindJSON(&conductor); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := services.CreateConductor(&conductor)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, conductor)
}

func UpdateConductor(c *gin.Context) {
	id := c.Param("id")
	var conductor models.Conductor
	if err := c.ShouldBindJSON(&conductor); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	conductor.ID = id
	err := services.UpdateConductor(&conductor)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, conductor)
}

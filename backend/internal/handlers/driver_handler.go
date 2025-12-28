package handlers

import (
	"net/http"
	"sts-backend/internal/models"
	"sts-backend/internal/services"

	"github.com/gin-gonic/gin"
)

func GetDrivers(c *gin.Context) {
	drivers, err := services.GetDrivers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, drivers)
}

func CreateDriver(c *gin.Context) {
	var driver models.Driver
	if err := c.ShouldBindJSON(&driver); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := services.CreateDriver(&driver)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, driver)
}

func UpdateDriver(c *gin.Context) {
	id := c.Param("id")
	var driver models.Driver
	if err := c.ShouldBindJSON(&driver); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	driver.ID = id
	err := services.UpdateDriver(&driver)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, driver)
}

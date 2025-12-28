package handlers

import (
	"net/http"
	"sts-backend/internal/models"
	"sts-backend/internal/services"

	"github.com/gin-gonic/gin"
)

func GetLounges(c *gin.Context) {
	lounges, err := services.GetAllLounges()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, lounges)
}

func CreateLounge(c *gin.Context) {
	var l models.Lounge
	if err := c.ShouldBindJSON(&l); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := services.CreateLounge(l); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "Lounge created successfully"})
}

func UpdateLounge(c *gin.Context) {
	id := c.Param("id")
	var l models.Lounge
	if err := c.ShouldBindJSON(&l); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	l.LoungeID = id
	if err := services.UpdateLounge(l); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Lounge updated successfully"})
}

func DeleteLounge(c *gin.Context) {
	id := c.Param("id")
	if err := services.DeleteLounge(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Lounge deleted successfully"})
}

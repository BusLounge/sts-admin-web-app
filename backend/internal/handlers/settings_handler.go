package handlers

import (
	"net/http"
	"sts-backend/internal/services"

	"github.com/gin-gonic/gin"
)

// GetNotificationSettings godoc
// @Summary Get admin notification settings
// @Description Get phone numbers configured for admin notifications
// @Tags settings
// @Produce json
// @Success 200 {object} services.NotificationSettings
// @Router /api/settings/notifications [get]
func GetNotificationSettings(c *gin.Context) {
	settings, err := services.GetNotificationSettings()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve notification settings"})
		return
	}
	c.JSON(http.StatusOK, settings)
}

// UpdateNotificationSettings godoc
// @Summary Update admin notification settings
// @Description Update phone numbers configured for admin notifications
// @Tags settings
// @Accept json
// @Produce json
// @Param settings body services.NotificationSettings true "Settings object"
// @Success 200 {object} map[string]string
// @Router /api/settings/notifications [put]
func UpdateNotificationSettings(c *gin.Context) {
	var settings services.NotificationSettings
	if err := c.ShouldBindJSON(&settings); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload format"})
		return
	}

	if err := services.UpdateNotificationSettings(settings); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update notification settings"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Notification settings updated successfully"})
}

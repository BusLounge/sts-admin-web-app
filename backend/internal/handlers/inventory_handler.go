package handlers

import (
	"errors"
	"net/http"
	"sts-backend/internal/models"
	"sts-backend/internal/services"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/lib/pq"
)

func GetMasterItems(c *gin.Context) {
	items, err := services.GetMasterItems()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, items)
}

func GetMasterItem(c *gin.Context) {
	id := c.Param("id")
	item, err := services.GetMasterItemByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if item == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Inventory item not found"})
		return
	}
	c.JSON(http.StatusOK, item)
}

func CreateMasterItem(c *gin.Context) {
	var i models.InventoryItem
	if err := c.ShouldBindJSON(&i); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	// Basic validation
	if i.ItemCode == "" || i.Name == "" || i.CategoryID == "" || i.Unit == "" || i.ImageURL == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required fields"})
		return
	}

	claims, err := getJWTClaimsFromRequest(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: " + err.Error()})
		return
	}
	adminID, ok := claims["admin_id"].(string)
	if !ok || adminID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: admin_id not found in token claims"})
		return
	}
	i.CreatedByAdminID = adminID

	err = services.CreateMasterItem(i)
	if err != nil {
		var pqErr *pq.Error
		// Handle Postgres unique violation (error code 23505)
		if errors.As(err, &pqErr) && pqErr.Code == "23505" {
			if strings.Contains(pqErr.Message, "item_code") {
				c.JSON(http.StatusConflict, gin.H{"error": "An item with this Item Code already exists."})
				return
			}
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Inventory item created successfully", "id": i.ID})
}

func UpdateMasterItem(c *gin.Context) {
	id := c.Param("id")
	var i models.InventoryItem
	if err := c.ShouldBindJSON(&i); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	// Basic validation
	if i.Name == "" || i.CategoryID == "" || i.Unit == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required fields"})
		return
	}

	i.ID = id
	if err := services.UpdateMasterItem(i); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Inventory item updated successfully"})
}

func ToggleItemStatus(c *gin.Context) {
	id := c.Param("id")
	var payload struct {
		IsActive bool `json:"is_active"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	if err := services.ToggleItemStatus(id, payload.IsActive); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Inventory item status updated successfully"})
}

func GetCategories(c *gin.Context) {
	categories, err := services.GetCategories()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, categories)
}

func UploadInventoryImage(c *gin.Context) {
	file, header, err := c.Request.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Image file is required"})
		return
	}
	defer file.Close()

	// Upload to cloudinary under the "sts-inventory" folder
	url, err := services.UploadImageToCloudinary(file, "sts-inventory")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload image: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "Image uploaded successfully",
		"image_url": url,
		"filename":  header.Filename,
	})
}

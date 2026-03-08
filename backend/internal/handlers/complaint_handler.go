package handlers

import (
	"net/http"
	"sts-backend/internal/database"
	"sts-backend/internal/services"

	"github.com/gin-gonic/gin"
)

var escalationService *services.EscalationService

// SetEscalationService sets the escalation service for handlers
func SetEscalationService(service *services.EscalationService) {
	escalationService = service
}

func GetComplaints(c *gin.Context) {
	role := c.Query("role")
	
	if role != "" {
		// Get complaints for specific role
		complaints, err := services.GetComplaintsByRole(role)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, complaints)
		return
	}
	
	// Get all complaints
	complaints, err := services.GetAllComplaints()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, complaints)
}

func GetComplaintById(c *gin.Context) {
	id := c.Param("id")
	complaint, err := services.GetComplaintByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if complaint == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Complaint not found"})
		return
	}
	c.JSON(http.StatusOK, complaint)
}

func UpdateComplaintStatus(c *gin.Context) {
	id := c.Param("id")
	
	var req struct {
		Status          string  `json:"status"`
		ResolvedByID    *string `json:"resolved_by_id"`
		ResolutionNotes *string `json:"resolution_notes"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	err := services.UpdateComplaintStatus(id, req.Status, req.ResolvedByID, req.ResolutionNotes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "Complaint status updated successfully"})
}

// ManualEscalateComplaint manually escalates a complaint to the next level
func ManualEscalateComplaint(c *gin.Context) {
	if escalationService == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Escalation service not initialized"})
		return
	}

	id := c.Param("id")
	
	var req struct {
		EscalatedBy string `json:"escalated_by"` // Admin user ID or name
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get complaint details
	complaint, err := database.GetComplaintByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if complaint == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Complaint not found"})
		return
	}

	// Get current escalation level
	escalation, err := escalationService.GetComplaintEscalation(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	currentLevel := 0
	if escalation != nil {
		currentLevel = escalation.CurrentLevel
	}

	// Map issue_type to category
	category := services.MapIssuetypeToCategory(complaint.IssueType)

	// Escalate to next level
	escalatedBy := "manual"
	if req.EscalatedBy != "" {
		escalatedBy = req.EscalatedBy
	}

	err = escalationService.EscalateToNextLevel(id, category, currentLevel, escalatedBy)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Complaint escalated successfully",
		"complaint_id": id,
	})
}

// GetComplaintEscalation returns escalation information for a complaint
func GetComplaintEscalation(c *gin.Context) {
	if escalationService == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Escalation service not initialized"})
		return
	}

	id := c.Param("id")

	escalation, err := escalationService.GetComplaintEscalation(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if escalation == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Escalation info not found"})
		return
	}

	c.JSON(http.StatusOK, escalation)
}

// GetEscalationStats returns escalation statistics
func GetEscalationStats(c *gin.Context) {
	if escalationService == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Escalation service not initialized"})
		return
	}

	stats, err := escalationService.GetEscalationStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

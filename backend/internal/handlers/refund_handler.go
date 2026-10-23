package handlers

import (
	"database/sql"
	"net/http"
	"strconv"
	"sts-backend/internal/models"
	"sts-backend/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type RefundHandler struct {
	service *services.RefundService
}

func NewRefundHandler(db *sql.DB) *RefundHandler {
	return &RefundHandler{
		service: services.NewRefundService(db),
	}
}

// GetRefunds handles GET /api/refunds?status=pending&limit=20&page=1
func (h *RefundHandler) GetRefunds(c *gin.Context) {
	status := c.Query("status")
	limitStr := c.DefaultQuery("limit", "50")
	pageStr := c.DefaultQuery("page", "1")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 50
	}

	page, err := strconv.Atoi(pageStr)
	if err != nil || page <= 0 {
		page = 1
	}

	offset := (page - 1) * limit

	items, total, err := h.service.GetAllRefunds(status, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch refunds: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  items,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

// GetRefundByID handles GET /api/refunds/:id
func (h *RefundHandler) GetRefundByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid refund ID format"})
		return
	}

	detail, err := h.service.GetRefundByID(id)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Refund not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch refund details: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, detail)
}

// ApproveRefund handles POST /api/refunds/:id/approve
func (h *RefundHandler) ApproveRefund(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid refund ID format"})
		return
	}

	var req models.ApproveRefundRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload: " + err.Error()})
		return
	}

	// Extract admin ID if present in token claims
	var adminID uuid.UUID
	if claims, err := getJWTClaimsFromRequest(c); err == nil {
		if idVal, ok := claims["id"].(string); ok {
			adminID, _ = uuid.Parse(idVal)
		} else if subVal, ok := claims["sub"].(string); ok {
			adminID, _ = uuid.Parse(subVal)
		}
	}

	err = h.service.ApproveRefund(id, req, adminID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Refund approved successfully. Settlements clawback executed with minus value flag.",
	})
}

// RejectRefund handles POST /api/refunds/:id/reject
func (h *RefundHandler) RejectRefund(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid refund ID format"})
		return
	}

	var req models.RejectRefundRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Rejection reason is required"})
		return
	}

	var adminID uuid.UUID
	if claims, err := getJWTClaimsFromRequest(c); err == nil {
		if idVal, ok := claims["id"].(string); ok {
			adminID, _ = uuid.Parse(idVal)
		} else if subVal, ok := claims["sub"].(string); ok {
			adminID, _ = uuid.Parse(subVal)
		}
	}

	err = h.service.RejectRefund(id, adminID, req.Reason)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Refund request rejected successfully.",
	})
}

// GetRefundStats handles GET /api/refunds/stats
func (h *RefundHandler) GetRefundStats(c *gin.Context) {
	stats, err := h.service.GetRefundStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch refund stats: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

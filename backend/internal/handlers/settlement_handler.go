package handlers

import (
	"database/sql"
	"net/http"
	"sts-backend/internal/models"
	"sts-backend/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type SettlementHandler struct {
	service *services.SettlementService
}

func NewSettlementHandler(db *sql.DB) *SettlementHandler {
	return &SettlementHandler{
		service: services.NewSettlementService(db),
	}
}

// ProcessNow triggers the midnight process manually for testing
func (h *SettlementHandler) ProcessNow(c *gin.Context) {
	// Manual trigger from admin dashboard bypasses reserve threshold safety check so batches are created
	result, err := h.service.RunMidnightProcess(true)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}

// GetOverview returns stats for dashboard
func (h *SettlementHandler) GetOverview(c *gin.Context) {
	overview, err := h.service.GetSettlementOverview()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, overview)
}

// GetWallet returns the company wallet and transaction history
func (h *SettlementHandler) GetWallet(c *gin.Context) {
	walletData, err := h.service.GetCompanyWalletData()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, walletData)
}

// GetSpecialRequests returns all pending requests for 7-day payout cycles
func (h *SettlementHandler) GetSpecialRequests(c *gin.Context) {
	requests, err := h.service.GetSpecialRequests()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, requests)
}

// HandleSpecialRequestAction approves or rejects a 7-day payout cycle request
func (h *SettlementHandler) HandleSpecialRequestAction(c *gin.Context) {
	trackerIDStr := c.Param("id")
	trackerID, err := uuid.Parse(trackerIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid tracker ID"})
		return
	}

	var req struct {
		Action string `json:"action" binding:"required"` // "approve" or "reject"
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Action is required ('approve' or 'reject')"})
		return
	}

	err = h.service.ProcessSpecialRequestAction(trackerID, req.Action)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Special request " + req.Action + "d successfully",
	})
}

// GetBatchDetails returns detailed data for a specific payout batch
func (h *SettlementHandler) GetBatchDetails(c *gin.Context) {
	batchIDStr := c.Param("id")
	batchID, err := uuid.Parse(batchIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid batch ID"})
		return
	}

	batch, err := h.service.GetBatchDetails(batchID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Payout batch not found: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, batch)
}

// TopUpWallet adds funds to the company treasury balance
func (h *SettlementHandler) TopUpWallet(c *gin.Context) {
	var req struct {
		Amount      float64 `json:"amount" binding:"required"`
		Description string  `json:"description"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Valid amount is required"})
		return
	}

	err := h.service.TopUpCompanyWallet(req.Amount, req.Description)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Company wallet topped up successfully"})
}

// UpdateReserve sets the reserve threshold for the company wallet
func (h *SettlementHandler) UpdateReserve(c *gin.Context) {
	var req struct {
		ReserveThreshold float64 `json:"reserve_threshold" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Valid reserve_threshold is required"})
		return
	}

	err := h.service.UpdateReserveThreshold(req.ReserveThreshold)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Reserve threshold updated successfully"})
}

// GetPricingConfig returns current standard ticket prices and revenue split percentages
func (h *SettlementHandler) GetPricingConfig(c *gin.Context) {
	cfg, err := h.service.GetPricingConfig()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, cfg)
}

// UpdatePricingConfig saves updated ticket prices and split percentages
func (h *SettlementHandler) UpdatePricingConfig(c *gin.Context) {
	var req models.PricingConfig
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid pricing configuration payload: " + err.Error()})
		return
	}

	err := h.service.UpdatePricingConfig(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Pricing and revenue split configuration updated successfully",
		"config":  req,
	})
}

// GetPublicTicketPricing provides public pricing information for passenger app developers
func (h *SettlementHandler) GetPublicTicketPricing(c *gin.Context) {
	pricing, err := h.service.GetPublicTicketPricing()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, pricing)
}



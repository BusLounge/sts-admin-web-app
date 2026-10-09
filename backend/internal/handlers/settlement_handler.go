package handlers

import (
	"database/sql"
	"net/http"
	"sts-backend/internal/services"

	"github.com/gin-gonic/gin"
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
	err := h.service.RunMidnightProcess()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Settlement process completed successfully"})
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

package handlers

import (
	"encoding/json"
	"net/http"
	"sts-backend/internal/models"
	"sts-backend/internal/services"

	"github.com/gin-gonic/gin"
)

type SupabaseWebhookPayload struct {
	Type   string          `json:"type"`
	Table  string          `json:"table"`
	Record json.RawMessage `json:"record"`
}

func HandleSupabaseWebhook(c *gin.Context) {
	var payload SupabaseWebhookPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if payload.Type == "INSERT" || payload.Type == "UPDATE" {
		switch payload.Table {
		case "lounge_owners":
			var rawOwner map[string]interface{}
			if err := json.Unmarshal(payload.Record, &rawOwner); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse lounge_owner record"})
				return
			}
			
			owner := models.LoungeOwner{}
			if val, ok := rawOwner["manager_full_name"].(string); ok { owner.ManagerFullName = val }
			if val, ok := rawOwner["manager_email"].(string); ok { owner.Email = val } else if val, ok := rawOwner["email"].(string); ok { owner.Email = val }
			if val, ok := rawOwner["contact_number"].(string); ok { owner.ContactNumber = val }
			if val, ok := rawOwner["manager_nic_number"].(string); ok { owner.NIC = val } else if val, ok := rawOwner["nic"].(string); ok { owner.NIC = val }
			if val, ok := rawOwner["verification_status"].(string); ok { owner.VerificationStatus = val }

			if err := services.ProcessLoungeOwnerWebhook(owner); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
		case "lounges":
			var rawLounge map[string]interface{}
			if err := json.Unmarshal(payload.Record, &rawLounge); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse lounge record"})
				return
			}

			lounge := models.Lounge{}
			if val, ok := rawLounge["lounge_name"].(string); ok { lounge.LoungeName = val }
			if val, ok := rawLounge["contact_phone"].(string); ok { lounge.LoungeContact = val } else if val, ok := rawLounge["lounge_contact"].(string); ok { lounge.LoungeContact = val }
			if val, ok := rawLounge["address"].(string); ok { lounge.Address = val }
			if val, ok := rawLounge["status"].(string); ok { lounge.Verification = val } else if val, ok := rawLounge["verification"].(string); ok { lounge.Verification = val }

			if err := services.ProcessLoungeWebhook(lounge); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
		case "bus_owners":
			var rawOwner map[string]interface{}
			if err := json.Unmarshal(payload.Record, &rawOwner); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse bus_owner record"})
				return
			}

			owner := models.BusOwner{}
			if val, ok := rawOwner["company_name"].(string); ok { owner.CompanyName = val }
			if val, ok := rawOwner["business_email"].(string); ok { owner.BusinessEmail = val }
			if val, ok := rawOwner["business_phone"].(string); ok { owner.BusinessPhone = val }
			if val, ok := rawOwner["identity_or_incorporation_no"].(string); ok { owner.IdentityOrIncorporationNo = val }
			if val, ok := rawOwner["verification_status"].(string); ok { owner.VerificationStatus = val }

			if err := services.ProcessBusOwnerWebhook(owner); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
		case "bus_staff":
			var rawStaff map[string]interface{}
			if err := json.Unmarshal(payload.Record, &rawStaff); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse bus_staff record"})
				return
			}

			if err := services.ProcessBusStaffWebhook(rawStaff); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Webhook processed successfully"})
}

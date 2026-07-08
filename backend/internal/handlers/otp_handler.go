package handlers

import (
	"log"
	"net/http"
	"sts-backend/internal/database"
	"time"

	"github.com/gin-gonic/gin"
)

type OTPRecord struct {
	ID        string    `json:"id"`
	OTP       string    `json:"otp"`
	Phone     string    `json:"phone"`
	AppName   string    `json:"app_name"`
	CreatedAt time.Time `json:"created_at"`
}

func GetOTPMasterData(c *gin.Context) {
	rows, err := database.DB.Query(`
		SELECT id, otp, phone, app_name, created_at
		FROM otp_master
		ORDER BY created_at DESC
		LIMIT 100
	`)
	if err != nil {
		log.Printf("Error fetching OTP data: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch OTP data"})
		return
	}
	defer rows.Close()

	var data []OTPRecord
	for rows.Next() {
		var record OTPRecord
		if err := rows.Scan(&record.ID, &record.OTP, &record.Phone, &record.AppName, &record.CreatedAt); err != nil {
			log.Printf("Error scanning OTP record: %v", err)
			continue
		}
		data = append(data, record)
	}

	if data == nil {
		data = []OTPRecord{}
	}

	c.JSON(http.StatusOK, data)
}

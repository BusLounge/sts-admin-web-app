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
	query := `
		WITH combined_otps AS (
			-- 1. Direct otp_master entries
			SELECT 
				id::text, 
				otp::text, 
				COALESCE(phone, '') as phone, 
				COALESCE(app_name, 'unknown') as app_name, 
				created_at
			FROM public.otp_master

			UNION ALL

			-- 2. otp_verifications joined with users and bus_owners
			SELECT 
				ov.id::text,
				ov.otp_code as otp,
				COALESCE(ov.phone, '') as phone,
				CASE 
					WHEN 'bus_owner' = ANY(u.roles) OR bo.id IS NOT NULL THEN 'bus_owner'
					WHEN 'driver' = ANY(u.roles) OR 'conductor' = ANY(u.roles) THEN 'driver_conductor'
					WHEN 'lounge_owner' = ANY(u.roles) THEN 'lounge_owner'
					WHEN 'passenger' = ANY(u.roles) THEN 'passenger'
					ELSE 'bus_owner'
				END as app_name,
				ov.created_at
			FROM public.otp_verifications ov
			LEFT JOIN public.users u ON (ov.phone = u.phone OR RIGHT(ov.phone, 9) = RIGHT(u.phone, 9))
			LEFT JOIN public.bus_owners bo ON (bo.user_id = u.id OR ov.phone = bo.business_phone OR RIGHT(ov.phone, 9) = RIGHT(bo.business_phone, 9))
			WHERE NOT EXISTS (
				SELECT 1 FROM public.otp_master om WHERE om.otp::text = ov.otp_code::text AND om.phone = ov.phone::text
			)
		)
		SELECT id, otp, phone, app_name, created_at
		FROM combined_otps
		ORDER BY created_at DESC
		LIMIT 100
	`
	rows, err := database.DB.Query(query)
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

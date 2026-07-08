package main

import (
	"fmt"
	"sts-backend/internal/config"
	"sts-backend/internal/services"
)

func main() {
	cfg := config.LoadConfig()
	cfg.DialogSMSMethod = "api_v2"
	smsService := services.NewSMSService(cfg)
	
	err := smsService.SendApprovalRequestNotification("94715342627", "test")
	if err != nil {
		fmt.Printf("Error sending to 94715342627 using API v2: %v\n", err)
	} else {
		fmt.Println("Successfully sent to 94715342627 using API v2")
	}
}

package main

import (
	"fmt"
	"sts-backend/internal/config"
	"sts-backend/internal/database"
	"sts-backend/internal/services"
)

func main() {
	cfg := config.LoadConfig()
	database.Init(cfg)
	fmt.Printf("SMSMode: %s\n", cfg.SMSMode)

	// Fetch Notification Settings
	settings, err := services.GetNotificationSettings()
	if err != nil {
		fmt.Printf("GetNotificationSettings error: %v\n", err)
	}
	fmt.Printf("Notification settings: %+v\n", settings)

	// Create SMS Service
	smsService := services.NewSMSService(cfg)

	// Find the configured lounge_owner number
	var recipient string
	if len(settings["lounge_owner"]) > 0 {
		recipient = settings["lounge_owner"][0]
	} else {
		recipient = "94715342627" // default
	}
	
	fmt.Printf("Testing SMS to recipient: %s\n", recipient)
	
	err = smsService.SendApprovalRequestNotification(recipient, "lounge owner", "Name: Test User")
	if err != nil {
		fmt.Printf("Error sending SMS: %v\n", err)
	} else {
		fmt.Println("SMS sent successfully (no error returned from service).")
	}
}

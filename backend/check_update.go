package main

import (
	"fmt"
	"sts-backend/internal/config"
	"sts-backend/internal/database"
	"sts-backend/internal/services"
)

func main() {
	cfg := config.LoadConfig()
	database.Init(cfg) // This will print the schema creation error but proceed
	
	settings := services.NotificationSettings{
		"lounge_owner": []string{"94715342627"},
	}
	err := services.UpdateNotificationSettings(settings)
	if err != nil {
		fmt.Println("Update Error:", err)
	} else {
		fmt.Println("Update Success")
	}
}

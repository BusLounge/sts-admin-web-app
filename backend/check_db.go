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
	settings, err := services.GetNotificationSettings()
	if err != nil {
		fmt.Println("Error:", err)
	} else {
		fmt.Printf("Settings fetched: %+v\n", settings)
	}
}

package main

import (
	"fmt"
	"sts-backend/internal/config"
	"sts-backend/internal/database"
)

func main() {
	cfg := config.LoadConfig()
	database.Init(cfg)
	rows, err := database.DB.Query("SELECT column_name FROM information_schema.columns WHERE table_name = 'system_settings'")
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer rows.Close()
	fmt.Println("Columns in system_settings:")
	for rows.Next() {
		var col string
		rows.Scan(&col)
		fmt.Println(col)
	}
}

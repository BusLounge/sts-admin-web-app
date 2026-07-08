package main

import (
	"fmt"
	"log"
	"sts-backend/internal/config"
	"sts-backend/internal/database"
)

func main() {
	config.LoadConfig()
	database.Connect()
	
	repo := database.NewLoungeRepository(database.DB)
	lounges, err := repo.GetLounges()
	if err != nil {
		log.Fatalf("Error getting lounges: %v", err)
	}

	fmt.Printf("Total lounges: %d\n", len(lounges))
	for _, l := range lounges {
		fmt.Printf("Lounge ID: %s, Name: %s, Verification: %s, Created: %s\n", l.LoungeID, l.LoungeName, l.Verification, l.CreatedAt)
	}
}

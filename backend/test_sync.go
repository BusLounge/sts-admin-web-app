package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	
	"sts-backend/internal/services"
)

func main() {
	godotenv.Load(".env")
	db, err := sql.Open("postgres", os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	settlementService := services.NewSettlementService(db)

	fmt.Println("================================================")
	fmt.Printf("🚀 RUNNING MIDNIGHT PROCESS (WITH BOOKING SYNC) \n")
	fmt.Println("================================================")

	result, err := settlementService.RunMidnightProcess(true)
	if err != nil {
		log.Fatalf("❌ Failed to run midnight process: %v", err)
	}
	fmt.Printf("Midnight Result: %s (Batches created: %d, Total paid: %.2f LKR)\n", result.Message, result.BatchesCreated, result.TotalAmountPaid)

	var count int
	db.QueryRow("SELECT count(*) FROM public.settlements").Scan(&count)

	fmt.Printf("\n✅ Sync & Midnight Process Successfully Executed!\n")
	fmt.Printf("Total records in settlements table now: %d\n", count)
	
	fmt.Println("\n📊 FETCHING DASHBOARD OVERVIEW DATA:")
	
	overview, err := settlementService.GetSettlementOverview()
	if err != nil {
		log.Fatalf("❌ Failed to fetch overview: %v", err)
	}

	quickStats := overview["quick_stats"].(map[string]interface{})
	fmt.Printf("Total Pending: %.2f LKR\n", quickStats["total_pending"])
	fmt.Printf("Paid This Month: %.2f LKR\n", quickStats["paid_this_month"])
	fmt.Printf("Company Profit: %.2f LKR\n", quickStats["company_profit"])

	fmt.Println("\n================================================")
}

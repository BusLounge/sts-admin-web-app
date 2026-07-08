package main

import (
	"fmt"
	"sts-backend/internal/config"
)

func main() {
	cfg := config.LoadConfig()
	fmt.Printf("SMSMode: %s\n", cfg.SMSMode)
	fmt.Printf("DialogSMSMethod: %s\n", cfg.DialogSMSMethod)
	fmt.Printf("DialogSMSEsmsqk length: %d\n", len(cfg.DialogSMSEsmsqk))
	fmt.Printf("DialogSMSAccessToken length: %d\n", len(cfg.DialogSMSAccessToken))
	fmt.Printf("DialogSMSUsername length: %d\n", len(cfg.DialogSMSUsername))
	fmt.Printf("ESMSAPIKey length: %d\n", len(cfg.ESMSAPIKey))
}

package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"
)

type PayHereService struct {
	MerchantID     string
	MerchantSecret string
	BaseURL        string
}

func NewPayHereService() *PayHereService {
	return &PayHereService{
		MerchantID:     os.Getenv("PAYHERE_MERCHANT_ID"),
		MerchantSecret: os.Getenv("PAYHERE_MERCHANT_SECRET"),
		BaseURL:        "https://sandbox.payhere.lk/merchant/v1/payment/payout",
	}
}

// PayHerePayoutResponse represents the response from the PayHere Automated Payouts API
type PayHerePayoutResponse struct {
	Status  int    `json:"status"`
	Msg     string `json:"msg"`
	Data    struct {
		PayoutID string `json:"payout_id"`
	} `json:"data"`
}

// ExecutePayout attempts to send money via PayHere
// Note: Since this is an integration, we will simulate the actual HTTP call for now if in sandbox
// or if we do not have full PayHere Payouts API access configured.
func (p *PayHereService) ExecutePayout(accountHolder, accountNumber, bankCode, branchCode string, amount float64, reference string) (string, error) {
	if p.MerchantID == "" || p.MerchantSecret == "" {
		return "", fmt.Errorf("PayHere credentials are not configured in environment")
	}

	// Example PayHere Payout Payload
	payload := map[string]interface{}{
		"merchant_id": p.MerchantID,
		"merchant_secret": p.MerchantSecret, // Some flows require an OAuth token instead
		"amount": amount,
		"currency": "LKR",
		"reference": reference,
		"account_holder": accountHolder,
		"account_number": accountNumber,
		"bank_code": bankCode,
		"branch_code": branchCode,
	}

	bodyBytes, _ := json.Marshal(payload)
	
	// Create request
	req, err := http.NewRequest("POST", p.BaseURL, bytes.NewBuffer(bodyBytes))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")

	// In a real production system, we would execute this via http.DefaultClient.Do(req)
	// For Sandbox/Dev, let's simulate a successful response to prevent actual sandbox spam
	// while we are developing.
	log.Printf("SIMULATING PAYHERE PAYOUT: Sending %.2f LKR to %s (A/C: %s, Bank: %s, Branch: %s)", amount, accountHolder, accountNumber, bankCode, branchCode)
	
	// Simulate Network Delay
	time.Sleep(500 * time.Millisecond)

	// Simulate Success
	simulatedPayoutID := fmt.Sprintf("PAYHERE-%d", time.Now().UnixNano())
	log.Printf("PAYHERE SUCCESS: Payout ID = %s", simulatedPayoutID)

	return simulatedPayoutID, nil
}

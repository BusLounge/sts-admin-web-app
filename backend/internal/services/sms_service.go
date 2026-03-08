package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"sts-backend/internal/config"
)

type SMSService struct {
	config *config.Config
}

// SMSRequest represents the request payload for eSMS API
type SMSRequest struct {
	Recipient string `json:"recipient"`
	SenderID  string `json:"senderId"`
	Message   string `json:"message"`
}

// SMSResponse represents the response from eSMS API
type SMSResponse struct {
	StatusCode int    `json:"statusCode"`
	Message    string `json:"message"`
	Reference  string `json:"reference"`
}

// DialogSMSResponse represents the response from Dialog eSMS API
type DialogSMSResponse struct {
	Status  string      `json:"status"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

func NewSMSService(cfg *config.Config) *SMSService {
	return &SMSService{
		config: cfg,
	}
}

// SendSMS sends an SMS using the configured method
func (s *SMSService) SendSMS(recipient, message string) error {
	// Dev mode - just log, don't send actual SMS
	if s.config.SMSMode == "dev" {
		log.Printf("📱 [DEV MODE] SMS not sent. Recipient: %s, Message: %s", recipient, message)
		return nil
	}

	// Production mode - use Dialog SMS
	if s.config.DialogSMSMethod == "url" {
		return s.sendDialogSMSURL(recipient, message)
	} else if s.config.DialogSMSMethod == "api_v2" {
		return s.sendDialogSMSAPIv2(recipient, message)
	}

	// Fallback to legacy eSMS API if configured
	if s.config.ESMSAPIKey != "" {
		return s.sendLegacyESMS(recipient, message)
	}

	log.Println("⚠️ SMS service not configured - skipping SMS notification")
	return nil
}

// sendDialogSMSURL sends SMS using Dialog eSMS URL method (GET request with esmsqk)
func (s *SMSService) sendDialogSMSURL(recipient, message string) error {
	if s.config.DialogSMSEsmsqk == "" {
		return fmt.Errorf("Dialog SMS esmsqk key not configured")
	}

	// Build URL with query parameters
	baseURL := "https://e-sms.dialog.lk/api/sms/send"
	params := url.Values{}
	params.Add("esmsqk", s.config.DialogSMSEsmsqk)
	params.Add("message", message)
	params.Add("target", recipient)
	params.Add("mask", s.config.DialogSMSMask)

	fullURL := baseURL + "?" + params.Encode()

	// Send GET request
	resp, err := http.Get(fullURL)
	if err != nil {
		return fmt.Errorf("failed to send Dialog SMS: %w", err)
	}
	defer resp.Body.Close()

	// Read response
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read Dialog SMS response: %w", err)
	}

	// Parse response
	var dialogResponse DialogSMSResponse
	if err := json.Unmarshal(body, &dialogResponse); err != nil {
		log.Printf("Failed to parse Dialog SMS response: %v. Raw response: %s", err, string(body))
		// If status is 200, consider it success
		if resp.StatusCode == 200 {
			log.Printf("✅ Dialog SMS sent successfully to %s (Status: %d)", recipient, resp.StatusCode)
			return nil
		}
		return fmt.Errorf("Dialog SMS API returned status %d: %s", resp.StatusCode, string(body))
	}

	// Check response status
	if dialogResponse.Status != "success" && resp.StatusCode != 200 {
		return fmt.Errorf("Dialog SMS API error: %s", dialogResponse.Message)
	}

	log.Printf("✅ Dialog SMS sent successfully to %s", recipient)
	return nil
}

// sendDialogSMSAPIv2 sends SMS using Dialog eSMS API v2 method (POST with username/password)
func (s *SMSService) sendDialogSMSAPIv2(recipient, message string) error {
	if s.config.DialogSMSUsername == "" || s.config.DialogSMSPassword == "" {
		return fmt.Errorf("Dialog SMS API v2 credentials not configured")
	}

	// Prepare request payload
	payload := map[string]interface{}{
		"username": s.config.DialogSMSUsername,
		"password": s.config.DialogSMSPassword,
		"message":  message,
		"msisdn":   recipient,
		"alias":    s.config.DialogSMSMask,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal Dialog SMS request: %w", err)
	}

	// Create HTTP request
	apiURL := s.config.DialogSMSAPIURL + "/sms/send"
	req, err := http.NewRequest("POST", apiURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create Dialog SMS request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	// Send request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send Dialog SMS request: %w", err)
	}
	defer resp.Body.Close()

	// Read response
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read Dialog SMS response: %w", err)
	}

	// Parse response
	var dialogResponse DialogSMSResponse
	if err := json.Unmarshal(body, &dialogResponse); err != nil {
		log.Printf("Failed to parse Dialog SMS response: %v. Raw response: %s", err, string(body))
		if resp.StatusCode == 200 || resp.StatusCode == 201 {
			log.Printf("✅ Dialog SMS sent successfully to %s (Status: %d)", recipient, resp.StatusCode)
			return nil
		}
		return fmt.Errorf("Dialog SMS API returned status %d: %s", resp.StatusCode, string(body))
	}

	// Check response status
	if dialogResponse.Status != "success" && resp.StatusCode != 200 && resp.StatusCode != 201 {
		return fmt.Errorf("Dialog SMS API error: %s", dialogResponse.Message)
	}

	log.Printf("✅ Dialog SMS sent successfully to %s", recipient)
	return nil
}

// sendLegacyESMS sends SMS using legacy eSMS API (for backward compatibility)
func (s *SMSService) sendLegacyESMS(recipient, message string) error {
	// Prepare request payload
	smsRequest := SMSRequest{
		Recipient: recipient,
		SenderID:  s.config.ESMSSenderID,
		Message:   message,
	}

	jsonData, err := json.Marshal(smsRequest)
	if err != nil {
		return fmt.Errorf("failed to marshal SMS request: %w", err)
	}

	// Create HTTP request
	req, err := http.NewRequest("POST", s.config.ESMSAPIURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create SMS request: %w", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.config.ESMSAPIKey)

	// Send request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send SMS request: %w", err)
	}
	defer resp.Body.Close()

	// Read response
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read SMS response: %w", err)
	}

	// Parse response
	var smsResponse SMSResponse
	if err := json.Unmarshal(body, &smsResponse); err != nil {
		log.Printf("Failed to parse SMS response: %v. Raw response: %s", err, string(body))
		// If status is 200, consider it success even if parsing fails
		if resp.StatusCode == 200 || resp.StatusCode == 201 {
			log.Printf("✅ SMS sent successfully to %s (Status: %d)", recipient, resp.StatusCode)
			return nil
		}
		return fmt.Errorf("SMS API returned status %d: %s", resp.StatusCode, string(body))
	}

	// Check response status
	if resp.StatusCode != 200 && resp.StatusCode != 201 {
		return fmt.Errorf("SMS API error: %s (Status: %d)", smsResponse.Message, resp.StatusCode)
	}

	log.Printf("✅ SMS sent successfully to %s (Reference: %s)", recipient, smsResponse.Reference)
	return nil
}

// SendNewComplaintNotification sends SMS notification for new complaint assignment
func (s *SMSService) SendNewComplaintNotification(recipient, assigneeName, complaintID, category string) error {
	message := fmt.Sprintf(
		"Hello %s,\n\nYou have been assigned a new complaint:\n\nComplaint ID: %s\nCategory: %s\n\nPlease review and respond within 5 days.\n\nThank you!",
		assigneeName,
		complaintID,
		category,
	)

	log.Printf("📱 Sending new complaint notification to %s", recipient)
	return s.SendSMS(recipient, message)
}

// SendEscalationNotification sends SMS notification for complaint escalation
func (s *SMSService) SendEscalationNotification(recipient, assigneeName, complaintID, category string, level int) error {
	message := fmt.Sprintf(
		"Hello %s,\n\nA complaint has been escalated to you (Level %d):\n\nComplaint ID: %s\nCategory: %s\n\nThis requires urgent attention. Please review immediately.\n\nThank you!",
		assigneeName,
		level,
		complaintID,
		category,
	)

	log.Printf("📱 Sending escalation notification (Level %d) to %s", level, recipient)
	return s.SendSMS(recipient, message)
}

// SendResolutionNotification sends SMS notification when complaint is resolved
func (s *SMSService) SendResolutionNotification(recipient, customerName, complaintID string) error {
	message := fmt.Sprintf(
		"Dear %s,\n\nYour complaint (ID: %s) has been resolved.\n\nThank you for your patience!\n\nBusLounge Team",
		customerName,
		complaintID,
	)

	log.Printf("📱 Sending resolution notification to %s", recipient)
	return s.SendSMS(recipient, message)
}

// SendBulkSMS sends SMS to multiple recipients (for team notifications)
func (s *SMSService) SendBulkSMS(recipients []string, message string) error {
	if s.config.ESMSAPIKey == "" {
		log.Println("⚠️ SMS service not configured - skipping bulk SMS notification")
		return nil
	}

	var lastError error
	successCount := 0

	for _, recipient := range recipients {
		err := s.SendSMS(recipient, message)
		if err != nil {
			log.Printf("❌ Failed to send SMS to %s: %v", recipient, err)
			lastError = err
		} else {
			successCount++
		}
	}

	if successCount > 0 {
		log.Printf("✅ Successfully sent %d/%d SMS notifications", successCount, len(recipients))
	}

	return lastError
}

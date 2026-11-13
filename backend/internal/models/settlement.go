package models

import (
	"time"

	"github.com/google/uuid"
)

type SettlementStatus string

const (
	SettlementStatusPending   SettlementStatus = "pending"
	SettlementStatusAccounted SettlementStatus = "accounted"
	SettlementStatusPaid      SettlementStatus = "paid"
	SettlementStatusFailed    SettlementStatus = "failed"
)

type PayeeType string

const (
	PayeeTypeBusOwner    PayeeType = "bus_owner"
	PayeeTypeLoungeOwner PayeeType = "lounge_owner"
	PayeeTypeDriver      PayeeType = "driver"
	PayeeTypeConductor   PayeeType = "conductor"
)

type Settlement struct {
	ID                  uuid.UUID        `json:"id"`
	PayeeType           PayeeType        `json:"payee_type"`
	PayeeUserID         uuid.UUID        `json:"payee_user_id"`
	BookingID           *uuid.UUID       `json:"booking_id,omitempty"`
	BookingReference    *string          `json:"booking_reference,omitempty"`
	ScheduledTripID     *uuid.UUID       `json:"scheduled_trip_id,omitempty"`
	LoungeBookingID     *uuid.UUID       `json:"lounge_booking_id,omitempty"`
	GrossAmount         float64          `json:"gross_amount"`
	CommissionRate      float64          `json:"commission_rate"`
	CommissionAmount    float64          `json:"commission_amount"`
	NetAmount           float64          `json:"net_amount"`
	Currency            string           `json:"currency"`
	EarningDate         time.Time        `json:"earning_date"`
	Status              SettlementStatus `json:"status"`
	IsPaid              bool             `json:"is_paid"`
	IsDeduction         bool             `json:"is_deduction"`
	PaidAt              *time.Time       `json:"paid_at,omitempty"`
	SettlementBatchID   *uuid.UUID       `json:"settlement_batch_id,omitempty"`
	Notes               *string          `json:"notes,omitempty"`
	CreatedAt           time.Time        `json:"created_at"`
	UpdatedAt           time.Time        `json:"updated_at"`
}

type PayoutTracker struct {
	ID                   uuid.UUID `json:"id"`
	PayeeUserID          uuid.UUID `json:"payee_user_id"`
	PayeeType            PayeeType `json:"payee_type"`
	PayoutFrequencyDays  int       `json:"payout_frequency_days"`
	LastPayoutDate       *time.Time `json:"last_payout_date,omitempty"`
	NextPayoutDate       *time.Time `json:"next_payout_date,omitempty"`
	DaysAccumulated      int       `json:"days_accumulated"`
	HasSpecialRequest    bool      `json:"has_special_request"`
	SpecialRequestDate   *time.Time `json:"special_request_date,omitempty"`
	IsActive             bool      `json:"is_active"`
	CreatedAt            time.Time `json:"created_at"`
	UpdatedAt            time.Time `json:"updated_at"`
}

type SettlementBatch struct {
	ID                  uuid.UUID `json:"id"`
	PayeeUserID         uuid.UUID `json:"payee_user_id"`
	PayeeType           PayeeType `json:"payee_type"`
	PeriodStart         time.Time `json:"period_start"`
	PeriodEnd           time.Time `json:"period_end"`
	TotalDays           int       `json:"total_days"`
	TotalSettlements    int       `json:"total_settlements"`
	TotalGrossAmount    float64   `json:"total_gross_amount"`
	TotalCommission     float64   `json:"total_commission"`
	TotalNetAmount      float64   `json:"total_net_amount"`
	WalletTransactionID *uuid.UUID `json:"wallet_transaction_id,omitempty"`
	Status              string    `json:"status"`
	ProcessedAt         time.Time `json:"processed_at"`
	CreatedAt           time.Time `json:"created_at"`
}

type WalletTransaction struct {
	ID              uuid.UUID `json:"id"`
	WalletID        uuid.UUID `json:"wallet_id"`
	Amount          float64   `json:"amount"`
	TransactionType string    `json:"transaction_type"` // credit, debit
	ReferenceType   string    `json:"reference_type"`   // settlement, withdrawal, adjustment, refund
	ReferenceID     *uuid.UUID `json:"reference_id,omitempty"`
	BalanceBefore   float64   `json:"balance_before"`
	BalanceAfter    float64   `json:"balance_after"`
	Description     *string   `json:"description,omitempty"`
	Status          string    `json:"status"` // pending, completed, reversed
	CreatedAt       time.Time `json:"created_at"`
}

type SettlementConfig struct {
	ID          uuid.UUID `json:"id"`
	ConfigKey   string    `json:"config_key"`
	ConfigValue float64   `json:"config_value"`
	Description *string   `json:"description,omitempty"`
	UpdatedAt   time.Time `json:"updated_at"`
	CreatedAt   time.Time `json:"created_at"`
}

type Wallet struct {
	ID        uuid.UUID `json:"id"`
	Balance   float64   `json:"balance"` // Computed from transactions or kept in sync
}

type MidnightProcessResult struct {
	Message          string   `json:"message"`
	BatchesCreated   int      `json:"batches_created"`
	BatchesSkipped   int      `json:"batches_skipped"`
	TotalAmountPaid  float64  `json:"total_amount_paid"`
	Details          []string `json:"details"`
}

type SpecialRequestItem struct {
	TrackerID              uuid.UUID  `json:"tracker_id"`
	PayeeUserID            uuid.UUID  `json:"payee_user_id"`
	PayeeName              string     `json:"payee_name"`
	PayeeEmail             string     `json:"payee_email"`
	PayeeType              PayeeType  `json:"payee_type"`
	CurrentFrequencyDays   int        `json:"current_frequency_days"`
	RequestedFrequencyDays int        `json:"requested_frequency_days"`
	SpecialRequestDate     *time.Time `json:"special_request_date,omitempty"`
	DaysAccumulated        int        `json:"days_accumulated"`
	AmountAccumulated      float64    `json:"amount_accumulated"`
}

type BatchDetail struct {
	BatchID          uuid.UUID              `json:"batch_id"`
	PayeeUserID      uuid.UUID              `json:"payee_user_id"`
	PayeeName        string                 `json:"payee_name"`
	PayeeType        PayeeType              `json:"payee_type"`
	PeriodStart      time.Time              `json:"period_start"`
	PeriodEnd        time.Time              `json:"period_end"`
	TotalDays        int                    `json:"total_days"`
	TotalSettlements int                    `json:"total_settlements"`
	TotalGrossAmount float64                `json:"total_gross_amount"`
	TotalCommission  float64                `json:"total_commission"`
	TotalNetAmount   float64                `json:"total_net_amount"`
	Status           string                 `json:"status"`
	ProcessedAt      time.Time              `json:"processed_at"`
	PayHerePayoutID  string                 `json:"payhere_payout_id"`
	BankAccountInfo  map[string]interface{} `json:"bank_account_info,omitempty"`
	Settlements      []Settlement           `json:"settlements"`
}

type PricingConfig struct {
	DefaultTicketPrice   float64   `json:"default_ticket_price"`
	BusOwnerSharePct     float64   `json:"bus_owner_share_pct"`
	DriverSharePct       float64   `json:"driver_share_pct"`
	ConductorSharePct    float64   `json:"conductor_share_pct"`
	CompanyCommissionPct float64   `json:"company_commission_pct"`
	DefaultLoungeFee     float64   `json:"default_lounge_fee"`
	LoungeOwnerSharePct  float64   `json:"lounge_owner_share_pct"`
	LoungeCommissionPct  float64   `json:"lounge_commission_pct"`
	UpdatedAt            time.Time `json:"updated_at"`
}

type PublicTicketPricing struct {
	TicketPrice  float64   `json:"ticket_price"`
	Currency     string    `json:"currency"`
	LoungeFee    float64   `json:"lounge_fee"`
	PricingModel string    `json:"pricing_model"`
	UpdatedAt    time.Time `json:"updated_at"`
}



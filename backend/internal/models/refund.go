package models

import (
	"time"

	"github.com/google/uuid"
)

type RefundStatus string

const (
	RefundStatusPending   RefundStatus = "pending"
	RefundStatusCompleted RefundStatus = "completed"
	RefundStatusFailed    RefundStatus = "failed"
)

type RefundItem struct {
	ID                 uuid.UUID    `json:"id"`
	BookingID          uuid.UUID    `json:"booking_id"`
	BookingReference   string       `json:"booking_reference"`
	PassengerName      string       `json:"passenger_name"`
	PassengerPhone     string       `json:"passenger_phone"`
	TotalFare          float64      `json:"total_fare"`
	RequestedAmount    float64      `json:"requested_amount"`
	SystemCost         float64      `json:"system_cost"`
	FinalRefundAmount  float64      `json:"final_refund_amount"`
	Reason             string       `json:"reason"`
	RefundReference    string       `json:"refund_reference"`
	Status             RefundStatus `json:"status"`
	TierApplied        string       `json:"tier_applied"`
	CreatedAt          time.Time    `json:"created_at"`
	RefundedAt         *time.Time   `json:"refunded_at,omitempty"`
	ScheduledDeparture *time.Time   `json:"scheduled_departure,omitempty"`
	RouteName          string       `json:"route_name"`
	BusNumber          string       `json:"bus_number"`
}

type CriteriaCheck struct {
	IsPaymentPaid       bool    `json:"is_payment_paid"`
	IsTripDeparted      bool    `json:"is_trip_departed"`
	HoursToDeparture    float64 `json:"hours_to_departure"`
	SuggestedTier       string  `json:"suggested_tier"`
	SuggestedRefundPct  float64 `json:"suggested_refund_pct"`
	SuggestedFeePct     float64 `json:"suggested_fee_pct"`
	SuggestedRefundAmt  float64 `json:"suggested_refund_amt"`
	SuggestedFeeAmt     float64 `json:"suggested_fee_amt"`
	HasPriorRefund      bool    `json:"has_prior_refund"`
	IsNonRefundable     bool    `json:"is_non_refundable"`
	RequiresOverride    bool    `json:"requires_override"`
	PolicyDescription   string  `json:"policy_description"`
}

type RefundDetail struct {
	ID                  uuid.UUID      `json:"id"`
	BookingID           uuid.UUID      `json:"booking_id"`
	BookingReference    string         `json:"booking_reference"`
	PassengerName       string         `json:"passenger_name"`
	PassengerPhone      string         `json:"passenger_phone"`
	PassengerEmail      string         `json:"passenger_email"`
	BookingType         string         `json:"booking_type"`
	PaymentStatus       string         `json:"payment_status"`
	BookingStatus       string         `json:"booking_status"`
	TotalFare           float64        `json:"total_fare"`
	RequestedAmount     float64        `json:"requested_amount"`
	SystemCost          float64        `json:"system_cost"`
	FinalRefundAmount   float64        `json:"final_refund_amount"`
	Reason              string         `json:"reason"`
	RefundReference     string         `json:"refund_reference"`
	Status              RefundStatus   `json:"status"`
	TierApplied         string         `json:"tier_applied"`
	AdminNotes          *string        `json:"admin_notes,omitempty"`
	ProcessedByAdminID  *uuid.UUID     `json:"processed_by_admin_id,omitempty"`
	ProcessedByAdminName *string       `json:"processed_by_admin_name,omitempty"`
	CreatedAt           time.Time      `json:"created_at"`
	RefundedAt          *time.Time     `json:"refunded_at,omitempty"`
	ScheduledDeparture  *time.Time     `json:"scheduled_departure,omitempty"`
	RouteName           string         `json:"route_name"`
	BusNumber           string         `json:"bus_number"`
	SeatNumbers         []string       `json:"seat_numbers"`
	Criteria            CriteriaCheck  `json:"criteria"`
	AssociatedSettlements []Settlement `json:"associated_settlements"`
}

type ApproveRefundRequest struct {
	TierApplied string  `json:"tier_applied"`
	SystemCost  float64 `json:"system_cost"`
	AdminNotes  string  `json:"admin_notes"`
	Override    bool    `json:"override"`
}

type RejectRefundRequest struct {
	Reason string `json:"reason" binding:"required"`
}

type RefundStats struct {
	PendingCount   int     `json:"pending_count"`
	CompletedCount int     `json:"completed_count"`
	FailedCount    int     `json:"failed_count"`
	TotalRefunded  float64 `json:"total_refunded"`
	TotalSystemFees float64 `json:"total_system_fees"`
}

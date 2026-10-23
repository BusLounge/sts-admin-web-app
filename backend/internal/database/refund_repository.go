package database

import (
	"database/sql"
	"errors"
	"fmt"
	"sts-backend/internal/models"
	"time"

	"github.com/google/uuid"
)

type RefundRepository struct {
	db *sql.DB
}

func NewRefundRepository(db *sql.DB) *RefundRepository {
	return &RefundRepository{db: db}
}

// GetAllRefunds returns refund items filtered by status (or all if status is empty)
func (r *RefundRepository) GetAllRefunds(status string, limit, offset int) ([]models.RefundItem, int, error) {
	if limit <= 0 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}

	whereClause := ""
	args := []interface{}{}
	argIdx := 1

	if status != "" && status != "all" {
		whereClause = fmt.Sprintf("WHERE r.status = $%d", argIdx)
		args = append(args, status)
		argIdx++
	}

	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM public.refunds r %s", whereClause)
	var totalCount int
	err := r.db.QueryRow(countQuery, args...).Scan(&totalCount)
	if err != nil {
		return nil, 0, err
	}

	query := fmt.Sprintf(`
		SELECT 
			r.id, r.booking_id, r.amount, COALESCE(r.reason, ''), COALESCE(r.refund_reference, ''),
			r.status, r.created_at, r.refunded_at,
			COALESCE(r.system_cost, 0), COALESCE(r.tier_applied, 'tier_1'),
			COALESCE(b.booking_reference, ''),
			COALESCE(b.passenger_name, ''),
			COALESCE(b.passenger_phone, ''),
			COALESCE(b.total_amount, 0),
			COALESCE(mr.route_name, mr.origin_city || ' - ' || mr.destination_city, ''),
			COALESCE(rp.bus_registration_number, ''),
			st.departure_datetime
		FROM public.refunds r
		LEFT JOIN public.bookings b ON r.booking_id = b.id
		LEFT JOIN public.bus_bookings bb ON bb.booking_id = b.id
		LEFT JOIN public.scheduled_trips st ON bb.scheduled_trip_id = st.id
		LEFT JOIN public.route_permits rp ON st.permit_id = rp.id
		LEFT JOIN public.master_routes mr ON rp.master_route_id = mr.id
		%s
		ORDER BY r.created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argIdx, argIdx+1)

	args = append(args, limit, offset)
	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var items []models.RefundItem
	for rows.Next() {
		var item models.RefundItem
		var reason, refundRef, bookingRef, pName, pPhone, routeName, busNumber string
		var systemCost, totalFare float64
		var refundedAt, depTime sql.NullTime

		err := rows.Scan(
			&item.ID, &item.BookingID, &item.RequestedAmount, &reason, &refundRef,
			&item.Status, &item.CreatedAt, &refundedAt,
			&systemCost, &item.TierApplied,
			&bookingRef, &pName, &pPhone, &totalFare,
			&routeName, &busNumber, &depTime,
		)
		if err != nil {
			return nil, 0, err
		}

		item.Reason = reason
		item.RefundReference = refundRef
		item.BookingReference = bookingRef
		item.PassengerName = pName
		item.PassengerPhone = pPhone
		item.TotalFare = totalFare
		item.SystemCost = systemCost
		item.FinalRefundAmount = item.RequestedAmount - systemCost
		if item.FinalRefundAmount < 0 {
			item.FinalRefundAmount = 0
		}
		item.RouteName = routeName
		item.BusNumber = busNumber

		if refundedAt.Valid {
			item.RefundedAt = &refundedAt.Time
		}
		if depTime.Valid {
			item.ScheduledDeparture = &depTime.Time
		}

		items = append(items, item)
	}

	return items, totalCount, nil
}

// GetRefundByID returns full independent detail for a specific refund
func (r *RefundRepository) GetRefundByID(id uuid.UUID) (*models.RefundDetail, error) {
	query := `
		SELECT 
			r.id, r.booking_id, r.amount, COALESCE(r.reason, ''), COALESCE(r.refund_reference, ''),
			r.status, r.created_at, r.refunded_at,
			COALESCE(r.system_cost, 0), COALESCE(r.tier_applied, 'tier_1'),
			r.admin_notes, r.processed_by_admin_id,
			COALESCE(u.full_name, ''),
			COALESCE(b.booking_reference, ''),
			COALESCE(b.passenger_name, ''),
			COALESCE(b.passenger_phone, ''),
			COALESCE(b.passenger_email, ''),
			COALESCE(b.booking_type, 'bus'),
			COALESCE(b.payment_status, 'pending'),
			COALESCE(b.booking_status, 'pending'),
			COALESCE(b.total_amount, 0),
			COALESCE(mr.route_name, mr.origin_city || ' - ' || mr.destination_city, ''),
			COALESCE(rp.bus_registration_number, ''),
			st.departure_datetime,
			bb.boarded_at,
			COALESCE(bb.status, '') as bus_booking_status,
			COALESCE(st.status, 'scheduled') as trip_status,
			COALESCE(st.cancellation_reason, '') as trip_cancellation_reason,
			COALESCE(TRIM(CONCAT(du.first_name, ' ', du.last_name)), '') as driver_name,
			COALESCE(du.phone, '') as driver_phone,
			COALESCE(TRIM(CONCAT(cu.first_name, ' ', cu.last_name)), '') as conductor_name,
			COALESCE(cu.phone, '') as conductor_phone,
			COALESCE(TRIM(CONCAT(bu.first_name, ' ', bu.last_name)), '') as boarded_by_name,
			COALESCE(bu.roles::text, 'Staff') as boarded_by_role
		FROM public.refunds r
		LEFT JOIN public.bookings b ON r.booking_id = b.id
		LEFT JOIN public.bus_bookings bb ON bb.booking_id = b.id
		LEFT JOIN public.scheduled_trips st ON bb.scheduled_trip_id = st.id
		LEFT JOIN public.route_permits rp ON st.permit_id = rp.id
		LEFT JOIN public.master_routes mr ON rp.master_route_id = mr.id
		LEFT JOIN public.admin_users u ON r.processed_by_admin_id = u.id
		LEFT JOIN public.users du ON st.assigned_driver_id = du.id
		LEFT JOIN public.users cu ON st.assigned_conductor_id = cu.id
		LEFT JOIN public.users bu ON bb.boarded_by_user_id = bu.id
		WHERE r.id = $1
	`

	var detail models.RefundDetail
	var reason, refundRef, adminName string
	var bookingRef, pName, pPhone, pEmail, bType, payStatus, bStatus, routeName, busNumber string
	var adminNotes sql.NullString
	var adminID *uuid.UUID
	var refundedAt, depTime, boardedAt sql.NullTime
	var busBookingStatus, tripStatus, tripCancellationReason string
	var driverName, driverPhone, conductorName, conductorPhone, boardedByName, boardedByRole string

	err := r.db.QueryRow(query, id).Scan(
		&detail.ID, &detail.BookingID, &detail.RequestedAmount, &reason, &refundRef,
		&detail.Status, &detail.CreatedAt, &refundedAt,
		&detail.SystemCost, &detail.TierApplied,
		&adminNotes, &adminID, &adminName,
		&bookingRef, &pName, &pPhone, &pEmail, &bType, &payStatus, &bStatus, &detail.TotalFare,
		&routeName, &busNumber, &depTime,
		&boardedAt, &busBookingStatus,
		&tripStatus, &tripCancellationReason,
		&driverName, &driverPhone,
		&conductorName, &conductorPhone,
		&boardedByName, &boardedByRole,
	)
	if err != nil {
		return nil, err
	}

	detail.Reason = reason
	detail.RefundReference = refundRef
	detail.BookingReference = bookingRef
	detail.PassengerName = pName
	detail.PassengerPhone = pPhone
	detail.PassengerEmail = pEmail
	detail.BookingType = bType
	detail.PaymentStatus = payStatus
	detail.BookingStatus = bStatus
	detail.RouteName = routeName
	detail.BusNumber = busNumber
	detail.FinalRefundAmount = detail.RequestedAmount - detail.SystemCost
	if detail.FinalRefundAmount < 0 {
		detail.FinalRefundAmount = 0
	}

	if adminNotes.Valid {
		detail.AdminNotes = &adminNotes.String
	}
	if adminID != nil {
		detail.ProcessedByAdminID = adminID
		if adminName != "" {
			detail.ProcessedByAdminName = &adminName
		}
	}
	if refundedAt.Valid {
		detail.RefundedAt = &refundedAt.Time
	}
	if depTime.Valid {
		detail.ScheduledDeparture = &depTime.Time
	}

	// Populate boarding and crew criteria
	detail.Criteria.IsBoarded = boardedAt.Valid || busBookingStatus == "boarded" || busBookingStatus == "completed"
	if boardedAt.Valid {
		detail.Criteria.BoardedAt = &boardedAt.Time
	}
	detail.Criteria.BoardedByName = boardedByName
	detail.Criteria.BoardedByRole = boardedByRole
	detail.Criteria.IsTripCancelledByOperator = tripStatus == "cancelled" || tripCancellationReason != ""
	detail.Criteria.TripCancellationReason = tripCancellationReason
	detail.Criteria.TripStatus = tripStatus
	detail.Criteria.DriverName = driverName
	detail.Criteria.DriverPhone = driverPhone
	detail.Criteria.ConductorName = conductorName
	detail.Criteria.ConductorPhone = conductorPhone

	// Fetch booked seats
	seatRows, err := r.db.Query(`
		SELECT COALESCE(bbs.seat_number, '')
		FROM public.bus_booking_seats bbs
		JOIN public.bus_bookings bb ON bbs.bus_booking_id = bb.id
		WHERE bb.booking_id = $1
	`, detail.BookingID)
	if err == nil {
		defer seatRows.Close()
		for seatRows.Next() {
			var seat string
			if seatRows.Scan(&seat) == nil && seat != "" {
				detail.SeatNumbers = append(detail.SeatNumbers, seat)
			}
		}
	}

	// Fetch associated settlements
	settlementRows, err := r.db.Query(`
		SELECT 
			id, payee_type, payee_user_id, gross_amount, commission_rate, commission_amount,
			net_amount, currency, earning_date, status, is_paid, is_deduction, COALESCE(notes, '')
		FROM public.settlements
		WHERE booking_id = $1
		ORDER BY created_at ASC
	`, detail.BookingID)
	if err == nil {
		defer settlementRows.Close()
		for settlementRows.Next() {
			var s models.Settlement
			var notes string
			err := settlementRows.Scan(
				&s.ID, &s.PayeeType, &s.PayeeUserID, &s.GrossAmount, &s.CommissionRate, &s.CommissionAmount,
				&s.NetAmount, &s.Currency, &s.EarningDate, &s.Status, &s.IsPaid, &s.IsDeduction, &notes,
			)
			if err == nil {
				s.Notes = &notes
				detail.AssociatedSettlements = append(detail.AssociatedSettlements, s)
			}
		}
	}

	// Automated 4-tier criteria evaluation
	detail.Criteria = evaluateCriteria(detail)

	return &detail, nil
}

// evaluateCriteria performs the automated time-based criteria calculation
func evaluateCriteria(detail models.RefundDetail) models.CriteriaCheck {
	check := detail.Criteria
	check.IsPaymentPaid = detail.PaymentStatus == "paid"

	baseAmount := detail.TotalFare
	if baseAmount <= 0 {
		baseAmount = detail.RequestedAmount
	}

	// 1. Boarding Check (Driver / Conductor Mobile App Scan)
	if check.IsBoarded {
		check.IsRefundBlockedDueToBoarding = true
		check.IsNonRefundable = true
		check.SuggestedTier = "boarded_ineligible"
		check.SuggestedRefundPct = 0.0
		check.SuggestedFeePct = 100.0
		check.SuggestedRefundAmt = 0.0
		check.SuggestedFeeAmt = baseAmount
		timeStr := ""
		if check.BoardedAt != nil {
			timeStr = check.BoardedAt.Format("Jan 02, 2006 03:04 PM")
		} else {
			timeStr = "during trip run"
		}
		check.PolicyDescription = fmt.Sprintf("REFUND BLOCKED: Passenger boarded the bus (%s, verified via Driver/Conductor App). Passengers who consumed the transit service are ineligible for ticket refund.", timeStr)
		return check
	}

	// 2. Bus Operator Trip Cancellation Check
	if check.IsTripCancelledByOperator {
		check.SuggestedTier = "operator_cancelled"
		check.SuggestedRefundPct = 100.0
		check.SuggestedFeePct = 0.0
		check.SuggestedRefundAmt = baseAmount
		check.SuggestedFeeAmt = 0.0
		reasonStr := check.TripCancellationReason
		if reasonStr == "" {
			reasonStr = "Service cancelled by bus operator"
		}
		check.PolicyDescription = fmt.Sprintf("100%% FULL REFUND (0 LKR FEE): Bus trip was cancelled by the bus operator (%s). Passenger is entitled to a full refund.", reasonStr)
		return check
	}

	now := time.Now()
	var departureTime time.Time
	if detail.ScheduledDeparture != nil {
		departureTime = *detail.ScheduledDeparture
	} else {
		// Fallback to booking creation time + 24 hours if departure time is unavailable
		departureTime = detail.CreatedAt.Add(24 * time.Hour)
	}

	diffHours := departureTime.Sub(now).Hours()
	check.HoursToDeparture = diffHours
	check.IsTripDeparted = diffHours <= 0

	switch {
	case diffHours > 24:
		// Tier 1: > 24 hours before trip starts -> 95% passenger refund, 5% company fee
		check.SuggestedTier = "tier_1_advance"
		check.SuggestedRefundPct = 95.0
		check.SuggestedFeePct = 5.0
		check.SuggestedRefundAmt = baseAmount * 0.95
		check.SuggestedFeeAmt = baseAmount * 0.05
		check.PolicyDescription = "Requested >24 hours prior to departure. Eligible for 95% refund (5% company fee deducted)."

	case diffHours >= 0 && diffHours <= 24:
		// Tier 2: Within 24 hours before trip starts -> 90% passenger refund, 10% company fee
		check.SuggestedTier = "tier_2_within_24h"
		check.SuggestedRefundPct = 90.0
		check.SuggestedFeePct = 10.0
		check.SuggestedRefundAmt = baseAmount * 0.90
		check.SuggestedFeeAmt = baseAmount * 0.10
		check.PolicyDescription = "Requested within 24 hours of trip start. Eligible for 90% refund (10% company fee deducted)."

	case diffHours < 0 && diffHours >= -72:
		// Tier 3: 0 to 3 days after trip started -> 0% refund by default; requires discretionary override
		check.SuggestedTier = "tier_3_post_trip"
		check.SuggestedRefundPct = 0.0
		check.SuggestedFeePct = 100.0
		check.SuggestedRefundAmt = 0.0
		check.SuggestedFeeAmt = baseAmount
		check.RequiresOverride = true
		check.PolicyDescription = "Trip already departed (< 3 days ago). 0% refund by default under no-show policy. Admin discretionary override available for verified service failure or breakdown."

	default:
		// Tier 4: More than 3 days after trip -> strictly non-refundable
		check.SuggestedTier = "tier_4_expired"
		check.SuggestedRefundPct = 0.0
		check.SuggestedFeePct = 100.0
		check.SuggestedRefundAmt = 0.0
		check.SuggestedFeeAmt = baseAmount
		check.IsNonRefundable = true
		check.PolicyDescription = "Claim window closed (> 3 days past trip). Strictly non-refundable."
	}

	return check
}

// ApproveRefund updates the refund to completed, updates bookings to refunded, and creates settlement clawback rows with is_deduction = true
func (r *RefundRepository) ApproveRefund(
	refundID uuid.UUID,
	finalRefundAmount, systemCost float64,
	tierApplied string,
	adminID uuid.UUID,
	adminNotes string,
) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// 1. Lock and check refund
	var bookingID uuid.UUID
	var currentStatus string
	var refundRef string
	err = tx.QueryRow(`
		SELECT booking_id, status, COALESCE(refund_reference, '') 
		FROM public.refunds 
		WHERE id = $1 FOR UPDATE
	`, refundID).Scan(&bookingID, &currentStatus, &refundRef)
	if err != nil {
		return err
	}

	if currentStatus != "pending" {
		return errors.New("refund request has already been processed")
	}

	// 2. Update refunds table
	_, err = tx.Exec(`
		UPDATE public.refunds
		SET amount = $1, system_cost = $2, status = 'completed', refunded_at = now(),
		    tier_applied = $3, processed_by_admin_id = $4, admin_notes = $5
		WHERE id = $6
	`, finalRefundAmount, systemCost, tierApplied, adminID, adminNotes, refundID)
	if err != nil {
		return fmt.Errorf("failed to update refund record: %w", err)
	}

	// 3. Update bookings table
	_, err = tx.Exec(`
		UPDATE public.bookings
		SET payment_status = 'refunded', booking_status = 'cancelled', 
		    refund_amount = $1, refunded_at = now(), cancelled_at = now()
		WHERE id = $2
	`, finalRefundAmount, bookingID)
	if err != nil {
		return fmt.Errorf("failed to update booking record: %w", err)
	}

	// 4. Update settlements table with Minus Value Flag (is_deduction = true)
	// Fetch any existing settlements for this booking that are NOT already deductions
	type PendingSettlement struct {
		ID               uuid.UUID
		PayeeType        models.PayeeType
		PayeeUserID      uuid.UUID
		ScheduledTripID  *uuid.UUID
		LoungeBookingID  *uuid.UUID
		GrossAmount      float64
		CommissionRate   float64
		CommissionAmount float64
		NetAmount        float64
		Status           string
		IsPaid           bool
	}

	rows, err := tx.Query(`
		SELECT 
			id, payee_type, payee_user_id, scheduled_trip_id, lounge_booking_id,
			gross_amount, commission_rate, commission_amount, net_amount, status, is_paid
		FROM public.settlements
		WHERE booking_id = $1 AND is_deduction = false
	`, bookingID)
	if err != nil {
		return fmt.Errorf("failed to query existing settlements: %w", err)
	}
	defer rows.Close()

	var existingSettlements []PendingSettlement
	for rows.Next() {
		var s PendingSettlement
		if err := rows.Scan(
			&s.ID, &s.PayeeType, &s.PayeeUserID, &s.ScheduledTripID, &s.LoungeBookingID,
			&s.GrossAmount, &s.CommissionRate, &s.CommissionAmount, &s.NetAmount, &s.Status, &s.IsPaid,
		); err == nil {
			existingSettlements = append(existingSettlements, s)
		}
	}
	rows.Close()

	for _, s := range existingSettlements {
		clawbackNote := fmt.Sprintf("Refund clawback for %s (Ref: %s)", s.PayeeType, refundRef)

		if s.Status == "pending" && !s.IsPaid {
			// If not yet accounted or paid, mark the original settlement as failed with deduction flag
			_, err = tx.Exec(`
				UPDATE public.settlements 
				SET status = 'failed', is_deduction = true, notes = $1, updated_at = now()
				WHERE id = $2
			`, clawbackNote, s.ID)
			if err != nil {
				return fmt.Errorf("failed to cancel pending settlement: %w", err)
			}
		} else {
			// If already accounted or paid, insert an offsetting deduction row with is_deduction = true
			_, err = tx.Exec(`
				INSERT INTO public.settlements (
					payee_type, payee_user_id, booking_id, scheduled_trip_id, lounge_booking_id,
					gross_amount, commission_rate, commission_amount, net_amount, earning_date,
					status, is_paid, is_deduction, notes
				) VALUES (
					$1, $2, $3, $4, $5,
					$6, $7, $8, $9, CURRENT_DATE,
					'accounted', false, true, $10
				)
			`, s.PayeeType, s.PayeeUserID, bookingID, s.ScheduledTripID, s.LoungeBookingID,
				s.GrossAmount, s.CommissionRate, s.CommissionAmount, s.NetAmount, clawbackNote)
			if err != nil {
				return fmt.Errorf("failed to insert settlement clawback: %w", err)
			}
		}
	}

	// 5. If system cost was retained, credit company wallet
	if systemCost > 0 {
		var cwID uuid.UUID
		var balBefore, balAfter float64
		err = tx.QueryRow(`
			UPDATE public.company_wallet 
			SET balance = balance + $1, updated_at = now() 
			RETURNING id, balance - $1, balance
		`, systemCost).Scan(&cwID, &balBefore, &balAfter)

		if err == nil {
			desc := fmt.Sprintf("Refund system fee retained (%s)", refundRef)
			_, _ = tx.Exec(`
				INSERT INTO public.wallet_transactions (
					wallet_id, amount, transaction_type, reference_type, reference_id,
					balance_before, balance_after, description, status
				) VALUES ($1, $2, 'credit', 'refund', $3, $4, $5, $6, 'completed')
			`, cwID, systemCost, refundID, balBefore, balAfter, desc)
		}
	}

	return tx.Commit()
}

// RejectRefund updates refund status to failed with rejection reason
func (r *RefundRepository) RejectRefund(refundID uuid.UUID, adminID uuid.UUID, reason string) error {
	res, err := r.db.Exec(`
		UPDATE public.refunds
		SET status = 'failed', processed_by_admin_id = $1, admin_notes = $2
		WHERE id = $3 AND status = 'pending'
	`, adminID, reason, refundID)
	if err != nil {
		return err
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		return errors.New("refund not found or not in pending status")
	}

	return nil
}

// GetRefundStats calculates counts and totals for dashboard widgets
func (r *RefundRepository) GetRefundStats() (*models.RefundStats, error) {
	stats := &models.RefundStats{}

	err := r.db.QueryRow(`
		SELECT 
			COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
			COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
			COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
			COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as total_refunded,
			COALESCE(SUM(CASE WHEN status = 'completed' THEN system_cost ELSE 0 END), 0) as total_fees
		FROM public.refunds
	`).Scan(&stats.PendingCount, &stats.CompletedCount, &stats.FailedCount, &stats.TotalRefunded, &stats.TotalSystemFees)

	return stats, err
}

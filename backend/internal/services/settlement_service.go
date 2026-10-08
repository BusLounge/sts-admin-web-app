package services

import (
	"database/sql"
	"errors"
	"log"
	"sts-backend/internal/models"
	"time"

	"github.com/google/uuid"
)

type SettlementService struct {
	db *sql.DB
}

func NewSettlementService(db *sql.DB) *SettlementService {
	return &SettlementService{db: db}
}

func (s *SettlementService) GetConfigValue(tx *sql.Tx, key string, defaultValue float64) float64 {
	var val float64
	err := tx.QueryRow("SELECT config_value FROM public.settlement_config WHERE config_key = $1", key).Scan(&val)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return defaultValue
		}
		log.Printf("Error fetching config %s: %v", key, err)
		return defaultValue
	}
	return val
}

// CreateBusSettlements is called when a bus trip completes.
func (s *SettlementService) CreateBusSettlements(bookingID, scheduledTripID uuid.UUID, farePerSeat float64, totalPassengers int) error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	totalRevenue := farePerSeat * float64(totalPassengers)

	// Fetch new simplified configs
	busOwnerSharePct := s.GetConfigValue(tx, "bus_owner_share_pct", 70.0) / 100
	driverSharePct := s.GetConfigValue(tx, "driver_share_pct", 15.0) / 100
	conductorSharePct := s.GetConfigValue(tx, "conductor_share_pct", 10.0) / 100
	companyCommissionPct := s.GetConfigValue(tx, "company_commission_pct", 5.0) / 100

	// Get payees
	var driverUserID, conductorUserID, busOwnerUserID uuid.UUID
	err = tx.QueryRow(`
		SELECT 
			d.user_id as driver_user_id,
			c.user_id as conductor_user_id,
			bo.user_id as bus_owner_user_id
		FROM public.scheduled_trips st
		LEFT JOIN public.bus_staff d ON st.assigned_driver_id = d.id
		LEFT JOIN public.bus_staff c ON st.assigned_conductor_id = c.id
		LEFT JOIN public.bus_owner_routes bor ON st.bus_owner_route_id = bor.id
		LEFT JOIN public.bus_owners bo ON bor.bus_owner_id = bo.id
		WHERE st.id = $1
	`, scheduledTripID).Scan(&driverUserID, &conductorUserID, &busOwnerUserID)
	if err != nil {
		return err
	}

	today := time.Now().Truncate(24 * time.Hour)

	// 1. Bus Owner (Receives 70% net, but we attach the company's 5% cut here for tracking)
	if busOwnerUserID != uuid.Nil {
		ownerGross := totalRevenue * (busOwnerSharePct + companyCommissionPct)
		ownerComm := totalRevenue * companyCommissionPct
		ownerNet := totalRevenue * busOwnerSharePct

		// Commission Rate field can just represent the effective rate out of their gross for tracking
		var effectiveCommRate float64 = 0
		if ownerGross > 0 {
			effectiveCommRate = ownerComm / ownerGross
		}

		err = s.insertSettlement(tx, models.PayeeTypeBusOwner, busOwnerUserID, &bookingID, &scheduledTripID, nil, ownerGross, effectiveCommRate, ownerComm, ownerNet, today)
		if err != nil {
			return err
		}
	}

	// 2. Driver (Receives flat 15%, no individual commission deducted)
	if driverUserID != uuid.Nil {
		driverNet := totalRevenue * driverSharePct

		err = s.insertSettlement(tx, models.PayeeTypeDriver, driverUserID, &bookingID, &scheduledTripID, nil, driverNet, 0, 0, driverNet, today)
		if err != nil {
			return err
		}
	}

	// 3. Conductor (Receives flat 10%, no individual commission deducted)
	if conductorUserID != uuid.Nil {
		conductorNet := totalRevenue * conductorSharePct

		err = s.insertSettlement(tx, models.PayeeTypeConductor, conductorUserID, &bookingID, &scheduledTripID, nil, conductorNet, 0, 0, conductorNet, today)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

// CreateLoungeSettlements processes the earnings for a lounge booking
func (s *SettlementService) CreateLoungeSettlements(loungeBookingID uuid.UUID, loungeName string, totalRevenue float64) error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Get percentages
	loungeOwnerSharePct := s.GetConfigValue(tx, "lounge_owner_share_pct", 95.00) / 100.0
	companyCommissionPct := s.GetConfigValue(tx, "lounge_owner_commission_pct", 5.00) / 100.0

	// Find the lounge owner's user_id
	var loungeOwnerUserID uuid.UUID
	err = tx.QueryRow(`
		SELECT lo.user_id 
		FROM public.lounges l
		JOIN public.lounge_owners lo ON l.owner_id = lo.id
		WHERE l.lounge_name = $1
		LIMIT 1
	`, loungeName).Scan(&loungeOwnerUserID)
	
	if err != nil && err != sql.ErrNoRows {
		return err
	}
	
	// If the lounge doesn't have an owner linked to a user, we can't settle
	if err == sql.ErrNoRows || loungeOwnerUserID == uuid.Nil {
		log.Printf("Warning: Could not find owner for lounge '%s' to settle booking %v", loungeName, loungeBookingID)
		return nil
	}

	today := time.Now().Truncate(24 * time.Hour)
	
	ownerGross := totalRevenue * (loungeOwnerSharePct + companyCommissionPct)
	ownerComm := totalRevenue * companyCommissionPct
	ownerNet := totalRevenue * loungeOwnerSharePct

	var effectiveCommRate float64 = 0
	if ownerGross > 0 {
		effectiveCommRate = ownerComm / ownerGross
	}

	// insert settlement
	err = s.insertSettlement(tx, models.PayeeTypeLoungeOwner, loungeOwnerUserID, nil, nil, &loungeBookingID, ownerGross, effectiveCommRate, ownerComm, ownerNet, today)
	if err != nil {
		return err
	}

	return tx.Commit()
}

func (s *SettlementService) insertSettlement(
	tx *sql.Tx,
	payeeType models.PayeeType,
	payeeUserID uuid.UUID,
	bookingID *uuid.UUID,
	scheduledTripID *uuid.UUID,
	loungeBookingID *uuid.UUID,
	gross float64,
	commRate float64,
	commAmount float64,
	net float64,
	earningDate time.Time,
) error {

	_, err := tx.Exec(`
		INSERT INTO public.settlements (
			payee_type, payee_user_id, booking_id, scheduled_trip_id, lounge_booking_id,
			gross_amount, commission_rate, commission_amount, net_amount, earning_date, status
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending')
	`, payeeType, payeeUserID, bookingID, scheduledTripID, loungeBookingID, gross, commRate, commAmount, net, earningDate)
	if err != nil {
		return err
	}

	// Ensure payout_tracker exists
	_, err = tx.Exec(`
		INSERT INTO public.payout_tracker (payee_user_id, payee_type, payout_frequency_days)
		VALUES ($1, $2, 14)
		ON CONFLICT (payee_user_id, payee_type) DO NOTHING
	`, payeeUserID, payeeType)
	return err
}

// SyncBookingsToSettlements scans the bookings table and creates settlements for any completed bookings that haven't been settled yet.
func (s *SettlementService) SyncBookingsToSettlements(tx *sql.Tx) error {
	log.Printf("Syncing completed bookings into settlements table...")

	// Pre-fetch configs to avoid querying inside a loop
	loungeOwnerSharePct := s.GetConfigValue(tx, "lounge_owner_share_pct", 95.00) / 100.0
	loungeCommissionPct := s.GetConfigValue(tx, "lounge_owner_commission_pct", 5.00) / 100.0
	
	busOwnerSharePct := s.GetConfigValue(tx, "bus_owner_share_pct", 70.00) / 100.0
	driverSharePct := s.GetConfigValue(tx, "driver_share_pct", 15.00) / 100.0
	conductorSharePct := s.GetConfigValue(tx, "conductor_share_pct", 10.00) / 100.0
	busCompanyCommissionPct := s.GetConfigValue(tx, "company_commission_pct", 5.00) / 100.0

	// 1. Process Lounge Bookings
	type LoungeBooking struct {
		ID uuid.UUID
		Name string
		Amount float64
	}
	var lBookings []LoungeBooking

	loungeRows, err := tx.Query(`
		SELECT lb.id, lb.lounge_name, lb.total_amount
		FROM public.lounge_bookings lb
		JOIN public.bookings b ON (lb.master_booking_id = b.id OR lb.bus_booking_id = b.id)
		WHERE b.payment_status = 'paid' 
		  AND lb.total_amount > 0
		  AND NOT EXISTS (
			  SELECT 1 FROM public.settlements s WHERE s.lounge_booking_id = lb.id
		  )
	`)
	if err != nil {
		return err
	}
	for loungeRows.Next() {
		var lb LoungeBooking
		if err := loungeRows.Scan(&lb.ID, &lb.Name, &lb.Amount); err == nil {
			lBookings = append(lBookings, lb)
		}
	}
	loungeRows.Close()

	for _, lb := range lBookings {
		var loungeOwnerUserID sql.NullString
		err = tx.QueryRow(`
			SELECT lo.user_id FROM public.lounges l
			JOIN public.lounge_owners lo ON l.owner_id = lo.id
			WHERE l.lounge_name = $1 LIMIT 1
		`, lb.Name).Scan(&loungeOwnerUserID)
		
		if err == nil && loungeOwnerUserID.Valid {
			ownerID, _ := uuid.Parse(loungeOwnerUserID.String)
			ownerGross := lb.Amount * (loungeOwnerSharePct + loungeCommissionPct)
			ownerComm := lb.Amount * loungeCommissionPct
			ownerNet := lb.Amount * loungeOwnerSharePct
			var effectiveCommRate float64 = 0
			if ownerGross > 0 { effectiveCommRate = ownerComm / ownerGross }
			err := s.insertSettlement(tx, models.PayeeTypeLoungeOwner, ownerID, nil, nil, &lb.ID, ownerGross, effectiveCommRate, ownerComm, ownerNet, time.Now())
			if err != nil { log.Printf("Error inserting lounge owner settlement: %v", err) }
		} else if err != nil {
			log.Printf("QueryRow for lounge owner failed: %v", err)
		}
	}

	// 2. Process Bus Bookings
	type BusBooking struct {
		BookingID uuid.UUID
		TripID uuid.UUID
		Fare float64
	}
	var bBookings []BusBooking

	busRows, err := tx.Query(`
		SELECT bb.booking_id, bb.scheduled_trip_id, bb.total_fare
		FROM public.bus_bookings bb
		JOIN public.bookings b ON bb.booking_id = b.id
		WHERE b.payment_status = 'paid'
		  AND bb.total_fare > 0
		  AND NOT EXISTS (
			  SELECT 1 FROM public.settlements s WHERE s.booking_id = bb.booking_id
		  )
	`)
	if err != nil {
		return err
	}
	for busRows.Next() {
		var bb BusBooking
		if err := busRows.Scan(&bb.BookingID, &bb.TripID, &bb.Fare); err == nil {
			bBookings = append(bBookings, bb)
		}
	}
	busRows.Close()

	for _, bb := range bBookings {
		var busOwnerUserID, driverUserID, conductorUserID sql.NullString
		err = tx.QueryRow(`
			SELECT 
				bo.user_id as bus_owner,
				d.user_id as driver,
				c.user_id as conductor
			FROM public.scheduled_trips st
			LEFT JOIN public.bus_owner_routes bor ON st.bus_owner_route_id = bor.id
			LEFT JOIN public.bus_owners bo ON bor.bus_owner_id = bo.id
			LEFT JOIN public.bus_staff d ON st.assigned_driver_id = d.id
			LEFT JOIN public.bus_staff c ON st.assigned_conductor_id = c.id
			WHERE st.id = $1
		`, bb.TripID).Scan(&busOwnerUserID, &driverUserID, &conductorUserID)
		
		if err == nil {
			today := time.Now().Truncate(24 * time.Hour)
			
			if busOwnerUserID.Valid {
				ownerID, _ := uuid.Parse(busOwnerUserID.String)
				// The platform takes its 5% commission from the Bus Owner's record to account for it.
				ownerGross := bb.Fare * (busOwnerSharePct + busCompanyCommissionPct) // 75%
				ownerComm := bb.Fare * busCompanyCommissionPct                       // 5%
				ownerNet := bb.Fare * busOwnerSharePct                               // 70%
				
				var effectiveCommRate float64 = 0
				if ownerGross > 0 { effectiveCommRate = ownerComm / ownerGross }
				err := s.insertSettlement(tx, models.PayeeTypeBusOwner, ownerID, &bb.BookingID, &bb.TripID, nil, ownerGross, effectiveCommRate, ownerComm, ownerNet, today)
				if err != nil { log.Printf("Error inserting bus owner settlement: %v", err) }
			}
			if driverUserID.Valid {
				dID, _ := uuid.Parse(driverUserID.String)
				driverNet := bb.Fare * driverSharePct // 15%
				err := s.insertSettlement(tx, models.PayeeTypeDriver, dID, &bb.BookingID, &bb.TripID, nil, driverNet, 0, 0, driverNet, today)
				if err != nil { log.Printf("Error inserting driver settlement: %v", err) }
			}
			if conductorUserID.Valid {
				cID, _ := uuid.Parse(conductorUserID.String)
				conductorNet := bb.Fare * conductorSharePct // 10%
				err := s.insertSettlement(tx, models.PayeeTypeConductor, cID, &bb.BookingID, &bb.TripID, nil, conductorNet, 0, 0, conductorNet, today)
				if err != nil { log.Printf("Error inserting conductor settlement: %v", err) }
			}
		} else {
			log.Printf("QueryRow for staff failed: %v", err)
		}
	}

	return nil
}

func (s *SettlementService) RunMidnightProcess() error {
	today := time.Now().Truncate(24 * time.Hour)
	log.Printf("Starting midnight settlement process for %v", today)

	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Step 0: Scan bookings table to sync any completed bookings into the settlements table
	err = s.SyncBookingsToSettlements(tx)
	if err != nil {
		log.Printf("Error syncing bookings to settlements: %v", err)
		// We can still continue with the process for existing settlements
	}

	// Step 1: Mark pending as accounted
	_, err = tx.Exec(`
		UPDATE public.settlements 
		SET status = 'accounted', updated_at = now()
		WHERE status = 'pending' AND earning_date <= $1
	`, today)
	if err != nil {
		return err
	}

	// Step 2: Process Trackers
	rows, err := tx.Query(`
		SELECT id, payee_user_id, payee_type, payout_frequency_days, last_payout_date 
		FROM public.payout_tracker WHERE is_active = true
	`)
	if err != nil {
		return err
	}
	defer rows.Close()

	var trackers []models.PayoutTracker
	for rows.Next() {
		var t models.PayoutTracker
		err := rows.Scan(&t.ID, &t.PayeeUserID, &t.PayeeType, &t.PayoutFrequencyDays, &t.LastPayoutDate)
		if err != nil {
			return err
		}
		trackers = append(trackers, t)
	}
	rows.Close() // Close before running queries in the loop

	for _, t := range trackers {
		var daysSince int
		var periodStart time.Time

		if t.LastPayoutDate == nil {
			// Find cycle start
			var cycleStart sql.NullTime
			err := tx.QueryRow(`
				SELECT MIN(earning_date) FROM public.settlements 
				WHERE payee_user_id = $1 AND status = 'accounted'
			`, t.PayeeUserID).Scan(&cycleStart)
			if err != nil {
				continue // could be no rows, just continue
			}
			if !cycleStart.Valid {
				continue
			}
			daysSince = int(today.Sub(cycleStart.Time).Hours() / 24)
			periodStart = cycleStart.Time
		} else {
			daysSince = int(today.Sub(*t.LastPayoutDate).Hours() / 24)
			periodStart = t.LastPayoutDate.AddDate(0, 0, 1)
		}

		_, err = tx.Exec(`UPDATE public.payout_tracker SET days_accumulated = $1 WHERE id = $2`, daysSince, t.ID)
		if err != nil {
			log.Printf("Error updating days_accumulated for %s: %v", t.ID, err)
			continue
		}

		if daysSince >= t.PayoutFrequencyDays {
			periodEnd := today

			// Aggregate
			var totalGross, totalComm, totalNet float64
			var recordCount int
			err := tx.QueryRow(`
				SELECT COALESCE(SUM(gross_amount), 0), COALESCE(SUM(commission_amount), 0), COALESCE(SUM(net_amount), 0), COUNT(id)
				FROM public.settlements
				WHERE payee_user_id = $1 AND payee_type = $2 AND status = 'accounted'
				AND earning_date >= $3 AND earning_date <= $4
			`, t.PayeeUserID, t.PayeeType, periodStart, periodEnd).Scan(&totalGross, &totalComm, &totalNet, &recordCount)

			if err != nil || recordCount == 0 {
				continue
			}

			// Create Batch
			var batchID uuid.UUID
			err = tx.QueryRow(`
				INSERT INTO public.settlement_batches (
					payee_user_id, payee_type, period_start, period_end, total_days,
					total_settlements, total_gross_amount, total_commission, total_net_amount
				) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id
			`, t.PayeeUserID, t.PayeeType, periodStart, periodEnd, daysSince, recordCount, totalGross, totalComm, totalNet).Scan(&batchID)
			if err != nil {
				log.Printf("Error inserting batch: %v", err)
				continue
			}

			// Get Wallet ID and Balance
			var walletID uuid.UUID
			err = tx.QueryRow(`SELECT wallet_id FROM public.users WHERE id = $1`, t.PayeeUserID).Scan(&walletID)
			if err != nil {
				log.Printf("Error getting wallet_id: %v", err)
				continue
			}

			var currentBalance float64
			err = tx.QueryRow(`
				SELECT COALESCE(
					(SELECT balance_after FROM public.wallet_transactions 
					WHERE wallet_id = $1 ORDER BY created_at DESC LIMIT 1), 
				0)
			`, walletID).Scan(&currentBalance)
			if err != nil {
				log.Printf("Error getting balance: %v", err)
				continue
			}

			// Wallet Transaction
			var txnID uuid.UUID
			desc := "Settlement payout"
			err = tx.QueryRow(`
				INSERT INTO public.wallet_transactions (
					wallet_id, amount, transaction_type, reference_type, reference_id,
					balance_before, balance_after, description
				) VALUES ($1, $2, 'credit', 'settlement', $3, $4, $5, $6) RETURNING id
			`, walletID, totalNet, batchID, currentBalance, currentBalance+totalNet, desc).Scan(&txnID)
			if err != nil {
				log.Printf("Error inserting txn: %v", err)
				continue
			}

			// Mark as Paid
			_, err = tx.Exec(`
				UPDATE public.settlements 
				SET status = 'paid', is_paid = true, paid_at = now(), settlement_batch_id = $1
				WHERE payee_user_id = $2 AND payee_type = $3 AND status = 'accounted'
				AND earning_date >= $4 AND earning_date <= $5
			`, batchID, t.PayeeUserID, t.PayeeType, periodStart, periodEnd)
			if err != nil {
				log.Printf("Error marking paid: %v", err)
				continue
			}

			// Update Batch
			_, err = tx.Exec(`
				UPDATE public.settlement_batches 
				SET status = 'completed', wallet_transaction_id = $1
				WHERE id = $2
			`, txnID, batchID)
			if err != nil {
				log.Printf("Error updating batch: %v", err)
				continue
			}

			// Update Tracker
			nextPayoutDate := today.AddDate(0, 0, t.PayoutFrequencyDays)
			_, err = tx.Exec(`
				UPDATE public.payout_tracker 
				SET last_payout_date = $1, next_payout_date = $2, days_accumulated = 0, updated_at = now()
				WHERE id = $3
			`, today, nextPayoutDate, t.ID)
			if err != nil {
				log.Printf("Error updating tracker: %v", err)
				continue
			}

			log.Printf("✅ PAID %s %s: %f LKR", t.PayeeType, t.PayeeUserID, totalNet)
		}
	}

	return tx.Commit()
}

// GetSettlementOverview fetches summary stats for the dashboard.
func (s *SettlementService) GetSettlementOverview() (map[string]interface{}, error) {
	// 1. Quick Stats
	var totalPending, paidThisMonth, companyProfit float64
	var nextPayoutDate sql.NullTime

	// Total Pending (sum of net_amount where status = pending or accounted)
	s.db.QueryRow(`SELECT COALESCE(SUM(net_amount), 0) FROM public.settlements WHERE status IN ('pending', 'accounted')`).Scan(&totalPending)
	
	// Paid This Month (sum of total_net_amount from batches created this month)
	s.db.QueryRow(`
		SELECT COALESCE(SUM(total_net_amount), 0) FROM public.settlement_batches 
		WHERE date_trunc('month', processed_at) = date_trunc('month', current_date)
	`).Scan(&paidThisMonth)

	// Company Profit (sum of commission_amount from settlements created this month)
	s.db.QueryRow(`
		SELECT COALESCE(SUM(commission_amount), 0) FROM public.settlements 
		WHERE date_trunc('month', earning_date) = date_trunc('month', current_date)
	`).Scan(&companyProfit)

	// Next Payout Date
	s.db.QueryRow(`SELECT MIN(next_payout_date) FROM public.payout_tracker WHERE next_payout_date > current_date`).Scan(&nextPayoutDate)

	// 2. Upcoming Payouts
	upcomingRows, err := s.db.Query(`
		SELECT 
			u.first_name || ' ' || u.last_name as payee_name,
			t.payee_type as role,
			t.days_accumulated,
			t.payout_frequency_days as frequency_days,
			COALESCE(t.next_payout_date, current_date + interval '14 days') as expected_payout_date,
			(SELECT COALESCE(SUM(net_amount), 0) FROM public.settlements s WHERE s.payee_user_id = t.payee_user_id AND s.status IN ('pending', 'accounted')) as amount_accumulated
		FROM public.payout_tracker t
		JOIN public.users u ON t.payee_user_id = u.id
		WHERE t.is_active = true
		ORDER BY t.days_accumulated DESC
		LIMIT 5
	`)
	if err != nil {
		return nil, err
	}
	defer upcomingRows.Close()

	upcomingPayouts := []map[string]interface{}{}
	for upcomingRows.Next() {
		var name, role string
		var daysAcc, freq int
		var expDate time.Time
		var amount float64
		upcomingRows.Scan(&name, &role, &daysAcc, &freq, &expDate, &amount)
		upcomingPayouts = append(upcomingPayouts, map[string]interface{}{
			"payee_name": name,
			"role": role,
			"days_accumulated": daysAcc,
			"frequency_days": freq,
			"expected_payout_date": expDate,
			"amount_accumulated": amount,
		})
	}

	// 3. Recent Payouts
	recentRows, err := s.db.Query(`
		SELECT 
			id,
			processed_at as date_paid,
			total_settlements as total_people, -- Approximation for display
			total_net_amount as total_amount
		FROM public.settlement_batches
		ORDER BY processed_at DESC
		LIMIT 5
	`)
	if err != nil {
		return nil, err
	}
	defer recentRows.Close()

	recentPayouts := []map[string]interface{}{}
	for recentRows.Next() {
		var id string
		var datePaid time.Time
		var totalPeople int
		var totalAmount float64
		recentRows.Scan(&id, &datePaid, &totalPeople, &totalAmount)
		recentPayouts = append(recentPayouts, map[string]interface{}{
			"batch_id": id,
			"date_paid": datePaid,
			"total_people": totalPeople,
			"total_amount": totalAmount,
		})
	}

	// 4. Special Requests (Count)
	var specialRequestsCount int
	s.db.QueryRow(`SELECT COUNT(*) FROM public.payout_tracker WHERE has_special_request = true`).Scan(&specialRequestsCount)

	return map[string]interface{}{
		"quick_stats": map[string]interface{}{
			"total_pending": totalPending,
			"paid_this_month": paidThisMonth,
			"company_profit": companyProfit,
			"next_payout_date": nextPayoutDate.Time,
		},
		"upcoming_payouts": upcomingPayouts,
		"recent_payouts": recentPayouts,
		"special_requests_count": specialRequestsCount,
	}, nil
}


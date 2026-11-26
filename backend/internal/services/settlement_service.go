package services

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"math"
	"sts-backend/internal/models"
	"sync"
	"time"

	"github.com/google/uuid"
)

type SettlementService struct {
	db           *sql.DB
	payHere      *PayHereService
	mu           sync.Mutex
	isProcessing bool
}

func NewSettlementService(db *sql.DB) *SettlementService {
	return &SettlementService{
		db: db,
		payHere: NewPayHereService(),
	}
}

// GetSriLankaLocation returns the time.Location for Sri Lanka (Asia/Colombo UTC+5:30)
func GetSriLankaLocation() *time.Location {
	loc, err := time.LoadLocation("Asia/Colombo")
	if err != nil {
		loc = time.FixedZone("Asia/Colombo", 5*3600+30*60)
	}
	return loc
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

	if farePerSeat <= 0 {
		farePerSeat = s.GetConfigValue(tx, "default_ticket_price", 1000.0)
	}
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

	today := time.Now().In(GetSriLankaLocation()).Truncate(24 * time.Hour)

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
		JOIN public.lounge_owners lo ON (l.owner_id = lo.id OR l.lounge_owner_id = lo.id)
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

	today := time.Now().In(GetSriLankaLocation()).Truncate(24 * time.Hour)
	
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

	// If there is a commission, immediately credit the company wallet!
	if commAmount > 0 {
		var cwID uuid.UUID
		var balBefore, balAfter float64
		err = tx.QueryRow(`
			UPDATE public.company_wallet 
			SET balance = balance + $1, updated_at = now() 
			RETURNING id, balance - $1, balance
		`, commAmount).Scan(&cwID, &balBefore, &balAfter)
		
		if err == nil {
			// Find the best reference ID for the transaction
			var refID *uuid.UUID = bookingID
			if refID == nil {
				refID = loungeBookingID
			}

			_, err = tx.Exec(`
				INSERT INTO public.wallet_transactions (
					wallet_id, amount, transaction_type, reference_type, reference_id,
					balance_before, balance_after, description, status
				) VALUES ($1, $2, 'credit', 'settlement', $3, $4, $5, 'Commission Earned', 'completed')
			`, cwID, commAmount, refID, balBefore, balAfter)
			if err != nil {
				log.Printf("Error tracking company wallet transaction: %v", err)
			}
		} else {
			log.Printf("Error updating company wallet balance: %v", err)
		}
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
	today := time.Now().In(GetSriLankaLocation()).Truncate(24 * time.Hour)
	log.Printf("Syncing completed bookings into settlements table for date %v...", today.Format("2006-01-02"))

	// Pre-fetch configs to avoid querying inside a loop
	loungeOwnerSharePct := s.GetConfigValue(tx, "lounge_owner_share_pct", 95.00) / 100.0
	loungeCommissionPct := s.GetConfigValue(tx, "lounge_owner_commission_pct", 5.00) / 100.0
	
	busOwnerSharePct := s.GetConfigValue(tx, "bus_owner_share_pct", 70.00) / 100.0
	driverSharePct := s.GetConfigValue(tx, "driver_share_pct", 15.00) / 100.0
	conductorSharePct := s.GetConfigValue(tx, "conductor_share_pct", 10.00) / 100.0
	busCompanyCommissionPct := s.GetConfigValue(tx, "company_commission_pct", 5.00) / 100.0

	// 1. Process Lounge Bookings with JOINs (efficient batch query)
	type LoungeBookingSync struct {
		ID uuid.UUID
		Amount float64
		OwnerUserID sql.NullString
	}
	var lBookings []LoungeBookingSync

	loungeRows, err := tx.Query(`
		SELECT 
			lb.id, 
			lb.total_amount,
			lo.user_id
		FROM public.lounge_bookings lb
		JOIN public.bookings b ON (lb.master_booking_id = b.id OR lb.bus_booking_id = b.id)
		LEFT JOIN public.lounges l ON (lb.lounge_id = l.id OR lb.lounge_name = l.lounge_name)
		LEFT JOIN public.lounge_owners lo ON (l.owner_id = lo.id OR l.lounge_owner_id = lo.id)
		WHERE b.payment_status = 'paid' 
		  AND lb.total_amount > 0
		  AND NOT EXISTS (
			  SELECT 1 FROM public.settlements s WHERE s.lounge_booking_id = lb.id
		  )
	`)
	if err != nil {
		log.Printf("Error querying lounge bookings for sync: %v", err)
	} else {
		for loungeRows.Next() {
			var lb LoungeBookingSync
			if err := loungeRows.Scan(&lb.ID, &lb.Amount, &lb.OwnerUserID); err == nil {
				lBookings = append(lBookings, lb)
			}
		}
		loungeRows.Close()

		for _, lb := range lBookings {
			if lb.OwnerUserID.Valid {
				ownerID, err := uuid.Parse(lb.OwnerUserID.String)
				if err == nil {
					ownerGross := lb.Amount * (loungeOwnerSharePct + loungeCommissionPct)
					ownerComm := lb.Amount * loungeCommissionPct
					ownerNet := lb.Amount * loungeOwnerSharePct
					var effectiveCommRate float64 = 0
					if ownerGross > 0 { effectiveCommRate = ownerComm / ownerGross }
					err := s.insertSettlement(tx, models.PayeeTypeLoungeOwner, ownerID, nil, nil, &lb.ID, ownerGross, effectiveCommRate, ownerComm, ownerNet, today)
					if err != nil { log.Printf("Error inserting lounge owner settlement: %v", err) }
				}
			}
		}
	}

	// 2. Process Bus Bookings with JOINs (efficient batch query)
	type BusBookingSync struct {
		BookingID uuid.UUID
		TripID uuid.UUID
		Fare float64
		BusOwnerUserID sql.NullString
		DriverUserID sql.NullString
		ConductorUserID sql.NullString
	}
	var bBookings []BusBookingSync

	busRows, err := tx.Query(`
		SELECT 
			bb.booking_id, 
			bb.scheduled_trip_id, 
			bb.total_fare,
			bo.user_id as bus_owner_user_id,
			d.user_id as driver_user_id,
			c.user_id as conductor_user_id
		FROM public.bus_bookings bb
		JOIN public.bookings b ON bb.booking_id = b.id
		JOIN public.scheduled_trips st ON bb.scheduled_trip_id = st.id
		LEFT JOIN public.bus_owner_routes bor ON st.bus_owner_route_id = bor.id
		LEFT JOIN public.bus_owners bo ON bor.bus_owner_id = bo.id
		LEFT JOIN public.bus_staff d ON st.assigned_driver_id = d.id
		LEFT JOIN public.bus_staff c ON st.assigned_conductor_id = c.id
		WHERE b.payment_status = 'paid'
		  AND bb.total_fare > 0
		  AND NOT EXISTS (
			  SELECT 1 FROM public.settlements s WHERE s.booking_id = bb.booking_id
		  )
	`)
	if err != nil {
		log.Printf("Error querying bus bookings for sync: %v", err)
	} else {
		for busRows.Next() {
			var bb BusBookingSync
			if err := busRows.Scan(&bb.BookingID, &bb.TripID, &bb.Fare, &bb.BusOwnerUserID, &bb.DriverUserID, &bb.ConductorUserID); err == nil {
				bBookings = append(bBookings, bb)
			}
		}
		busRows.Close()

		for _, bb := range bBookings {
			if bb.BusOwnerUserID.Valid {
				ownerID, err := uuid.Parse(bb.BusOwnerUserID.String)
				if err == nil {
					ownerGross := bb.Fare * (busOwnerSharePct + busCompanyCommissionPct) // 75%
					ownerComm := bb.Fare * busCompanyCommissionPct                       // 5%
					ownerNet := bb.Fare * busOwnerSharePct                               // 70%
					
					var effectiveCommRate float64 = 0
					if ownerGross > 0 { effectiveCommRate = ownerComm / ownerGross }
					err := s.insertSettlement(tx, models.PayeeTypeBusOwner, ownerID, &bb.BookingID, &bb.TripID, nil, ownerGross, effectiveCommRate, ownerComm, ownerNet, today)
					if err != nil { log.Printf("Error inserting bus owner settlement: %v", err) }
				}
			}
			if bb.DriverUserID.Valid {
				dID, err := uuid.Parse(bb.DriverUserID.String)
				if err == nil {
					driverNet := bb.Fare * driverSharePct // 15%
					err := s.insertSettlement(tx, models.PayeeTypeDriver, dID, &bb.BookingID, &bb.TripID, nil, driverNet, 0, 0, driverNet, today)
					if err != nil { log.Printf("Error inserting driver settlement: %v", err) }
				}
			}
			if bb.ConductorUserID.Valid {
				cID, err := uuid.Parse(bb.ConductorUserID.String)
				if err == nil {
					conductorNet := bb.Fare * conductorSharePct // 10%
					err := s.insertSettlement(tx, models.PayeeTypeConductor, cID, &bb.BookingID, &bb.TripID, nil, conductorNet, 0, 0, conductorNet, today)
					if err != nil { log.Printf("Error inserting conductor settlement: %v", err) }
				}
			}
		}
	}

	return nil
}

// RunCatchUpIfNeeded verifies if completed bookings, pending settlements, or due payout trackers
// were missed while the server was asleep or offline, and automatically executes them.
func (s *SettlementService) RunCatchUpIfNeeded() {
	s.mu.Lock()
	if s.isProcessing {
		s.mu.Unlock()
		return
	}
	s.isProcessing = true
	s.mu.Unlock()

	defer func() {
		s.mu.Lock()
		s.isProcessing = false
		s.mu.Unlock()
	}()

	loc := GetSriLankaLocation()
	today := time.Now().In(loc).Truncate(24 * time.Hour)

	var pendingCount int
	_ = s.db.QueryRow(`
		SELECT COUNT(*) FROM public.settlements 
		WHERE status = 'pending' AND earning_date <= $1
	`, today).Scan(&pendingCount)

	var dueTrackersCount int
	_ = s.db.QueryRow(`
		SELECT COUNT(*) FROM public.payout_tracker 
		WHERE is_active = true AND days_accumulated >= payout_frequency_days
	`).Scan(&dueTrackersCount)

	var unsyncedBookingsCount int
	_ = s.db.QueryRow(`
		SELECT COUNT(*) FROM public.bookings b
		WHERE b.status = 'completed' AND NOT EXISTS (
			SELECT 1 FROM public.settlements s WHERE s.booking_id = b.id
		)
	`).Scan(&unsyncedBookingsCount)

	if pendingCount > 0 || dueTrackersCount > 0 || unsyncedBookingsCount > 0 {
		log.Printf("⏰ Catch-Up Triggered: Detected %d pending settlements, %d due trackers, %d unsynced bookings. Executing settlement recovery...",
			pendingCount, dueTrackersCount, unsyncedBookingsCount)
		res, err := s.RunMidnightProcess(true)
		if err != nil {
			log.Printf("Error during settlement catch-up recovery: %v", err)
		} else {
			log.Printf("✅ Settlement catch-up recovery completed: %d batches created, %d skipped, total: LKR %.2f",
				res.BatchesCreated, res.BatchesSkipped, res.TotalAmountPaid)
		}
	}
}

func (s *SettlementService) RunMidnightProcess(bypassReserve ...bool) (*models.MidnightProcessResult, error) {
	today := time.Now().In(GetSriLankaLocation()).Truncate(24 * time.Hour)
	log.Printf("Starting midnight settlement process for %v (bypass reserve: %v)", today, bypassReserve)

	result := &models.MidnightProcessResult{
		Details: []string{},
	}

	tx, err := s.db.Begin()
	if err != nil {
		return nil, err
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
		return nil, err
	}

	// Step 2: Process Trackers
	rows, err := tx.Query(`
		SELECT id, payee_user_id, payee_type, payout_frequency_days, last_payout_date 
		FROM public.payout_tracker WHERE is_active = true
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var trackers []models.PayoutTracker
	for rows.Next() {
		var t models.PayoutTracker
		err := rows.Scan(&t.ID, &t.PayeeUserID, &t.PayeeType, &t.PayoutFrequencyDays, &t.LastPayoutDate)
		if err != nil {
			return nil, err
		}
		trackers = append(trackers, t)
	}
	rows.Close() // Close before running queries in the loop

	shouldBypass := len(bypassReserve) > 0 && bypassReserve[0]

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
			if err != nil || !cycleStart.Valid {
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
				SELECT COALESCE(SUM(CASE WHEN is_deduction THEN -gross_amount ELSE gross_amount END), 0), 
				       COALESCE(SUM(CASE WHEN is_deduction THEN -commission_amount ELSE commission_amount END), 0), 
				       COALESCE(SUM(CASE WHEN is_deduction THEN -net_amount ELSE net_amount END), 0), 
				       COUNT(id)
				FROM public.settlements
				WHERE payee_user_id = $1 AND payee_type = $2 AND status = 'accounted'
				AND earning_date >= $3 AND earning_date <= $4
			`, t.PayeeUserID, t.PayeeType, periodStart, periodEnd).Scan(&totalGross, &totalComm, &totalNet, &recordCount)

			if err != nil || recordCount == 0 || totalNet <= 0 {
				continue
			}

			// --- START PAYOUT PROCESS ---
			// 1. Check Company Wallet Reserve Threshold BEFORE creating batch
			var cwID uuid.UUID
			var cwBalance, cwReserve float64
			err = tx.QueryRow(`SELECT id, balance, reserve_threshold FROM public.company_wallet LIMIT 1`).Scan(&cwID, &cwBalance, &cwReserve)
			if err != nil {
				// Seed default company wallet if none exists
				cwID = uuid.New()
				cwBalance = 100000.00
				cwReserve = 10000.00
				_, _ = tx.Exec(`INSERT INTO public.company_wallet (id, balance, reserve_threshold) VALUES ($1, $2, $3)`, cwID, cwBalance, cwReserve)
			}

			if !shouldBypass && (cwBalance-totalNet) < cwReserve {
				log.Printf("Safety Triggered: Cannot payout %f to %s. Wallet balance %f would fall below reserve %f. Holding in accounted status.", totalNet, t.PayeeUserID, cwBalance, cwReserve)
				result.BatchesSkipped++
				continue
			}

			// Ensure company wallet balance can cover the payout debit during manual/bypass executions
			if (cwBalance - totalNet) < 0 {
				neededWorkingCapital := (totalNet - cwBalance) + 50000.00
				_, _ = tx.Exec(`UPDATE public.company_wallet SET balance = balance + $1, updated_at = now() WHERE id = $2`, neededWorkingCapital, cwID)
				_, _ = tx.Exec(`
					INSERT INTO public.wallet_transactions (
						wallet_id, amount, transaction_type, reference_type, description, status
					) VALUES ($1, $2, 'credit', 'adjustment', 'Working Capital Buffer for Payouts', 'completed')
				`, cwID, neededWorkingCapital)
			}

			// 2. Fetch Payee Details
			var payeeFullName, userEmail string
			_ = tx.QueryRow(`
				SELECT COALESCE(NULLIF(TRIM(CONCAT_WS(' ', first_name, last_name)), ''), email, 'Payee'), COALESCE(email, '')
				FROM public.users WHERE id = $1
			`, t.PayeeUserID).Scan(&payeeFullName, &userEmail)

			// 3. Create Batch with status 'processing'
			var batchID uuid.UUID
			err = tx.QueryRow(`
				INSERT INTO public.settlement_batches (
					payee_user_id, payee_type, period_start, period_end, total_days,
					total_settlements, total_gross_amount, total_commission, total_net_amount, status
				) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'processing') RETURNING id
			`, t.PayeeUserID, t.PayeeType, periodStart, periodEnd, daysSince, recordCount, totalGross, totalComm, totalNet).Scan(&batchID)
			if err != nil {
				log.Printf("Error inserting batch: %v", err)
				continue
			}

			// 4. Resolve Bank Details and Execute PayHere Automated Payouts
			var accountName, acctNo, bankCode, branchCode string
			accountName = payeeFullName
			acctNo = "1234567890"
			bankCode = "7010" // BOC default
			branchCode = "001"

			if t.PayeeType == models.PayeeTypeBusOwner {
				var bankDetailsJSON []byte
				err := tx.QueryRow(`SELECT bank_account_details FROM public.bus_owners WHERE user_id = $1`, t.PayeeUserID).Scan(&bankDetailsJSON)
				if err == nil && len(bankDetailsJSON) > 0 {
					var bankMap map[string]interface{}
					if err := json.Unmarshal(bankDetailsJSON, &bankMap); err == nil {
						if val, ok := bankMap["account_name"].(string); ok && val != "" {
							accountName = val
						}
						if val, ok := bankMap["account_number"].(string); ok && val != "" {
							acctNo = val
						}
						if val, ok := bankMap["bank_code"].(string); ok && val != "" {
							bankCode = val
						}
						if val, ok := bankMap["branch_code"].(string); ok && val != "" {
							branchCode = val
						}
					}
				}
			}

			payoutID, payErr := s.payHere.ExecutePayout(accountName, acctNo, bankCode, branchCode, totalNet, batchID.String())
			if payErr != nil {
				log.Printf("PayHere API Failed for %s: %v", t.PayeeUserID, payErr)
				_, _ = tx.Exec(`UPDATE public.settlement_batches SET status = 'failed' WHERE id = $1`, batchID)
				continue
			}

			// 5. Debit Company Wallet
			_, err = tx.Exec(`
				UPDATE public.company_wallet 
				SET balance = balance - $1, updated_at = now() 
				WHERE id = $2
			`, totalNet, cwID)
			if err != nil {
				log.Printf("Error debiting company wallet: %v", err)
				_, _ = tx.Exec(`UPDATE public.settlement_batches SET status = 'failed' WHERE id = $1`, batchID)
				continue
			}
			
			desc := fmt.Sprintf("PayHere Payout Sent to %s (%s)", payeeFullName, t.PayeeType)
			var companyWalletTxnID uuid.UUID
			err = tx.QueryRow(`
				INSERT INTO public.wallet_transactions (
					wallet_id, amount, transaction_type, reference_type, reference_id,
					payhere_payout_id, description, status
				) VALUES ($1, $2, 'debit', 'bank_payout', $3, $4, $5, 'completed')
				RETURNING id
			`, cwID, totalNet, batchID, payoutID, desc).Scan(&companyWalletTxnID)
			if err != nil {
				log.Printf("Error tracking company wallet transaction: %v", err)
			}

			// 6. Credit Payee User Account Wallet
			var payeeWalletID uuid.UUID
			_ = tx.QueryRow(`SELECT wallet_id FROM public.users WHERE id = $1`, t.PayeeUserID).Scan(&payeeWalletID)
			if payeeWalletID != uuid.Nil {
				_, err = tx.Exec(`
					INSERT INTO public.wallet_transactions (
						wallet_id, amount, transaction_type, reference_type, reference_id,
						payhere_payout_id, description, status
					) VALUES ($1, $2, 'credit', 'settlement', $3, $4, $5, 'completed')
				`, payeeWalletID, totalNet, batchID, payoutID, fmt.Sprintf("Settlement payout received for %s (%d bookings)", t.PayeeType, recordCount))
				if err != nil {
					log.Printf("Error crediting payee wallet: %v", err)
				}
			}

			// 7. Mark Individual Settlements as Paid
			_, err = tx.Exec(`
				UPDATE public.settlements 
				SET status = 'paid', is_paid = true, paid_at = now(), settlement_batch_id = $1
				WHERE payee_user_id = $2 AND payee_type = $3 AND status = 'accounted'
				AND earning_date >= $4 AND earning_date <= $5
			`, batchID, t.PayeeUserID, t.PayeeType, periodStart, periodEnd)
			if err != nil {
				log.Printf("Error marking settlements paid: %v", err)
				continue
			}

			// 8. Update Batch to completed
			_, err = tx.Exec(`
				UPDATE public.settlement_batches 
				SET status = 'completed', wallet_transaction_id = $2
				WHERE id = $1
			`, batchID, companyWalletTxnID)
			if err != nil {
				log.Printf("Error updating batch: %v", err)
				continue
			}

			// 9. Update Tracker for next cycle
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

			result.BatchesCreated++
			result.TotalAmountPaid += totalNet
			result.Details = append(result.Details, fmt.Sprintf("Paid LKR %.2f to %s (%s, %d bookings)", totalNet, payeeFullName, t.PayeeType, recordCount))
			log.Printf("✅ PAID %s (%s): %f LKR", payeeFullName, t.PayeeType, totalNet)
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	if result.BatchesCreated > 0 {
		result.Message = fmt.Sprintf("Successfully processed %d payout batch(es) totaling LKR %.2f", result.BatchesCreated, result.TotalAmountPaid)
	} else if result.BatchesSkipped > 0 {
		result.Message = fmt.Sprintf("Sync completed. %d payout(s) held because company wallet balance is below the reserve threshold.", result.BatchesSkipped)
	} else {
		result.Message = "Sync completed. No payees have reached their payout cycle threshold yet."
	}

	return result, nil
}

// GetSettlementOverview fetches summary stats for the dashboard.
func (s *SettlementService) GetSettlementOverview() (map[string]interface{}, error) {
	// 1. Quick Stats
	var totalPending, paidThisMonth, companyProfit float64
	var nextPayoutDate sql.NullTime

	// Total Pending (sum of net_amount where status = pending or accounted, subtracting deductions)
	s.db.QueryRow(`SELECT COALESCE(SUM(CASE WHEN is_deduction THEN -net_amount ELSE net_amount END), 0) FROM public.settlements WHERE status IN ('pending', 'accounted')`).Scan(&totalPending)
	
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
			COALESCE(NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.last_name)), ''), u.email, 'User') as payee_name,
			t.payee_type as role,
			t.days_accumulated,
			t.payout_frequency_days as frequency_days,
			COALESCE(t.next_payout_date, current_date + (t.payout_frequency_days || ' days')::interval) as expected_payout_date,
			(SELECT COALESCE(SUM(CASE WHEN is_deduction THEN -net_amount ELSE net_amount END), 0) FROM public.settlements s WHERE s.payee_user_id = t.payee_user_id AND s.status IN ('pending', 'accounted')) as amount_accumulated
		FROM public.payout_tracker t
		JOIN public.users u ON t.payee_user_id = u.id
		WHERE t.is_active = true AND t.payout_frequency_days > 0
		ORDER BY amount_accumulated DESC, t.days_accumulated DESC
		LIMIT 10
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
		if err := upcomingRows.Scan(&name, &role, &daysAcc, &freq, &expDate, &amount); err == nil {
			upcomingPayouts = append(upcomingPayouts, map[string]interface{}{
				"payee_name": name,
				"role": role,
				"days_accumulated": daysAcc,
				"frequency_days": freq,
				"expected_payout_date": expDate,
				"amount_accumulated": amount,
			})
		}
	}

	// 3. Recent Payouts
	recentRows, err := s.db.Query(`
		SELECT 
			b.id,
			b.processed_at as date_paid,
			b.total_settlements as total_people,
			b.total_net_amount as total_amount,
			COALESCE(NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.last_name)), ''), u.email, 'Payee') as payee_name,
			b.payee_type,
			b.status
		FROM public.settlement_batches b
		JOIN public.users u ON b.payee_user_id = u.id
		ORDER BY b.processed_at DESC
		LIMIT 10
	`)
	if err != nil {
		return nil, err
	}
	defer recentRows.Close()

	recentPayouts := []map[string]interface{}{}
	for recentRows.Next() {
		var id, payeeName, payeeType, status string
		var datePaid time.Time
		var totalPeople int
		var totalAmount float64
		if err := recentRows.Scan(&id, &datePaid, &totalPeople, &totalAmount, &payeeName, &payeeType, &status); err == nil {
			recentPayouts = append(recentPayouts, map[string]interface{}{
				"batch_id": id,
				"date_paid": datePaid,
				"total_people": totalPeople,
				"total_amount": totalAmount,
				"payee_name": payeeName,
				"payee_type": payeeType,
				"status": status,
			})
		}
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

// GetSpecialRequests returns all pending requests for 7-day payout cycles
func (s *SettlementService) GetSpecialRequests() ([]models.SpecialRequestItem, error) {
	rows, err := s.db.Query(`
		SELECT 
			t.id as tracker_id,
			t.payee_user_id,
			COALESCE(NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.last_name)), ''), u.email, 'User') as payee_name,
			COALESCE(u.email, '') as payee_email,
			t.payee_type,
			t.payout_frequency_days as current_frequency,
			7 as requested_frequency,
			t.special_request_date,
			t.days_accumulated,
			(SELECT COALESCE(SUM(CASE WHEN is_deduction THEN -net_amount ELSE net_amount END), 0) 
			 FROM public.settlements s 
			 WHERE s.payee_user_id = t.payee_user_id AND s.status IN ('pending', 'accounted')) as amount_accumulated
		FROM public.payout_tracker t
		JOIN public.users u ON t.payee_user_id = u.id
		WHERE t.has_special_request = true
		ORDER BY t.special_request_date DESC NULLS LAST
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var requests []models.SpecialRequestItem
	for rows.Next() {
		var req models.SpecialRequestItem
		var reqDate sql.NullTime
		err := rows.Scan(
			&req.TrackerID,
			&req.PayeeUserID,
			&req.PayeeName,
			&req.PayeeEmail,
			&req.PayeeType,
			&req.CurrentFrequencyDays,
			&req.RequestedFrequencyDays,
			&reqDate,
			&req.DaysAccumulated,
			&req.AmountAccumulated,
		)
		if err != nil {
			return nil, err
		}
		if reqDate.Valid {
			req.SpecialRequestDate = &reqDate.Time
		}
		requests = append(requests, req)
	}
	if requests == nil {
		requests = []models.SpecialRequestItem{}
	}
	return requests, nil
}

// ProcessSpecialRequestAction handles approving or rejecting a 7-day payout cycle request
func (s *SettlementService) ProcessSpecialRequestAction(trackerID uuid.UUID, action string) error {
	if action == "approve" {
		_, err := s.db.Exec(`
			UPDATE public.payout_tracker 
			SET payout_frequency_days = 7, 
			    has_special_request = false, 
			    updated_at = now() 
			WHERE id = $1
		`, trackerID)
		return err
	} else if action == "reject" {
		_, err := s.db.Exec(`
			UPDATE public.payout_tracker 
			SET has_special_request = false, 
			    updated_at = now() 
			WHERE id = $1
		`, trackerID)
		return err
	}
	return errors.New("invalid action: must be 'approve' or 'reject'")
}

// GetBatchDetails returns detailed data for a specific payout batch
func (s *SettlementService) GetBatchDetails(batchID uuid.UUID) (*models.BatchDetail, error) {
	var detail models.BatchDetail
	err := s.db.QueryRow(`
		SELECT 
			b.id,
			b.payee_user_id,
			COALESCE(NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.last_name)), ''), u.email, 'Payee') as payee_name,
			b.payee_type,
			b.period_start,
			b.period_end,
			b.total_days,
			b.total_settlements,
			b.total_gross_amount,
			b.total_commission,
			b.total_net_amount,
			b.status,
			b.processed_at
		FROM public.settlement_batches b
		JOIN public.users u ON b.payee_user_id = u.id
		WHERE b.id = $1
	`, batchID).Scan(
		&detail.BatchID,
		&detail.PayeeUserID,
		&detail.PayeeName,
		&detail.PayeeType,
		&detail.PeriodStart,
		&detail.PeriodEnd,
		&detail.TotalDays,
		&detail.TotalSettlements,
		&detail.TotalGrossAmount,
		&detail.TotalCommission,
		&detail.TotalNetAmount,
		&detail.Status,
		&detail.ProcessedAt,
	)
	if err != nil {
		return nil, err
	}

	// Fetch PayHere payout ID from wallet transactions if exists
	var payHerePayoutID sql.NullString
	_ = s.db.QueryRow(`
		SELECT payhere_payout_id 
		FROM public.wallet_transactions 
		WHERE reference_id = $1 AND payhere_payout_id IS NOT NULL 
		LIMIT 1
	`, batchID).Scan(&payHerePayoutID)
	if payHerePayoutID.Valid {
		detail.PayHerePayoutID = payHerePayoutID.String
	} else {
		detail.PayHerePayoutID = fmt.Sprintf("PAYHERE-%s", batchID.String()[:8])
	}

	// Fetch Bank Account Details
	detail.BankAccountInfo = make(map[string]interface{})
	if detail.PayeeType == models.PayeeTypeBusOwner {
		var bankDetailsJSON []byte
		err := s.db.QueryRow(`SELECT bank_account_details FROM public.bus_owners WHERE user_id = $1`, detail.PayeeUserID).Scan(&bankDetailsJSON)
		if err == nil && len(bankDetailsJSON) > 0 {
			_ = json.Unmarshal(bankDetailsJSON, &detail.BankAccountInfo)
		}
	}
	if len(detail.BankAccountInfo) == 0 {
		detail.BankAccountInfo = map[string]interface{}{
			"account_name": detail.PayeeName,
			"account_number": "1234567890",
			"bank_name": "Bank of Ceylon (BOC)",
			"branch": "Colombo Main Branch (001)",
		}
	}

	// Fetch associated individual settlements
	sRows, err := s.db.Query(`
		SELECT 
			id, payee_type, payee_user_id, booking_id, booking_reference,
			scheduled_trip_id, lounge_booking_id, gross_amount, commission_rate,
			commission_amount, net_amount, currency, earning_date, status, is_paid,
			is_deduction, paid_at, settlement_batch_id, notes, created_at, updated_at
		FROM public.settlements
		WHERE settlement_batch_id = $1
		ORDER BY earning_date ASC
	`, batchID)
	if err == nil {
		defer sRows.Close()
		detail.Settlements = []models.Settlement{}
		for sRows.Next() {
			var s models.Settlement
			_ = sRows.Scan(
				&s.ID, &s.PayeeType, &s.PayeeUserID, &s.BookingID, &s.BookingReference,
				&s.ScheduledTripID, &s.LoungeBookingID, &s.GrossAmount, &s.CommissionRate,
				&s.CommissionAmount, &s.NetAmount, &s.Currency, &s.EarningDate, &s.Status,
				&s.IsPaid, &s.IsDeduction, &s.PaidAt, &s.SettlementBatchID, &s.Notes,
				&s.CreatedAt, &s.UpdatedAt,
			)
			detail.Settlements = append(detail.Settlements, s)
		}
	}

	return &detail, nil
}

// TopUpCompanyWallet allows manual addition of treasury funds to company balance
func (s *SettlementService) TopUpCompanyWallet(amount float64, description string) error {
	if amount <= 0 {
		return errors.New("top-up amount must be greater than zero")
	}
	if description == "" {
		description = "Manual Treasury Deposit"
	}

	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	var cwID uuid.UUID
	var balBefore, balAfter float64
	err = tx.QueryRow(`
		UPDATE public.company_wallet 
		SET balance = balance + $1, updated_at = now() 
		RETURNING id, balance - $1, balance
	`, amount).Scan(&cwID, &balBefore, &balAfter)
	if err != nil {
		return err
	}

	_, err = tx.Exec(`
		INSERT INTO public.wallet_transactions (
			wallet_id, amount, transaction_type, reference_type,
			balance_before, balance_after, description, status
		) VALUES ($1, $2, 'credit', 'adjustment', $3, $4, $5, 'completed')
	`, cwID, amount, balBefore, balAfter, description)
	if err != nil {
		return err
	}

	return tx.Commit()
}

// UpdateReserveThreshold modifies the company wallet reserve threshold
func (s *SettlementService) UpdateReserveThreshold(reserve float64) error {
	if reserve < 0 {
		return errors.New("reserve threshold cannot be negative")
	}
	_, err := s.db.Exec(`UPDATE public.company_wallet SET reserve_threshold = $1, updated_at = now()`, reserve)
	return err
}

// GetPricingConfig fetches the active standard ticket price, lounge fee, and revenue splits
func (s *SettlementService) GetPricingConfig() (*models.PricingConfig, error) {
	cfg := &models.PricingConfig{
		DefaultTicketPrice:   1000.0,
		BusOwnerSharePct:     70.0,
		DriverSharePct:       15.0,
		ConductorSharePct:    10.0,
		CompanyCommissionPct: 5.0,
		DefaultLoungeFee:     1500.0,
		LoungeOwnerSharePct:  95.0,
		LoungeCommissionPct:  5.0,
		UpdatedAt:            time.Now(),
	}

	rows, err := s.db.Query(`SELECT config_key, config_value, updated_at FROM public.settlement_config`)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var key string
			var val float64
			var updatedAt sql.NullTime
			if err := rows.Scan(&key, &val, &updatedAt); err == nil {
				if updatedAt.Valid && updatedAt.Time.After(cfg.UpdatedAt) {
					cfg.UpdatedAt = updatedAt.Time
				}
				switch key {
				case "default_ticket_price":
					cfg.DefaultTicketPrice = val
				case "bus_owner_share_pct":
					cfg.BusOwnerSharePct = val
				case "driver_share_pct":
					cfg.DriverSharePct = val
				case "conductor_share_pct":
					cfg.ConductorSharePct = val
				case "company_commission_pct":
					cfg.CompanyCommissionPct = val
				case "default_lounge_fee":
					cfg.DefaultLoungeFee = val
				case "lounge_owner_share_pct":
					cfg.LoungeOwnerSharePct = val
				case "lounge_owner_commission_pct", "lounge_commission_pct":
					cfg.LoungeCommissionPct = val
				}
			}
		}
	}

	return cfg, nil
}

// UpdatePricingConfig saves updated standard ticket prices and revenue split percentages
func (s *SettlementService) UpdatePricingConfig(cfg models.PricingConfig) error {
	if cfg.DefaultTicketPrice <= 0 {
		return errors.New("ticket price must be greater than zero")
	}
	if cfg.DefaultLoungeFee <= 0 {
		return errors.New("lounge fee must be greater than zero")
	}

	busTotal := cfg.BusOwnerSharePct + cfg.DriverSharePct + cfg.ConductorSharePct + cfg.CompanyCommissionPct
	if math.Abs(busTotal-100.0) > 0.05 {
		return fmt.Errorf("bus revenue split percentages must total exactly 100%% (current sum: %.2f%%)", busTotal)
	}

	loungeTotal := cfg.LoungeOwnerSharePct + cfg.LoungeCommissionPct
	if math.Abs(loungeTotal-100.0) > 0.05 {
		return fmt.Errorf("lounge revenue split percentages must total exactly 100%% (current sum: %.2f%%)", loungeTotal)
	}

	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	configs := map[string]float64{
		"default_ticket_price":        cfg.DefaultTicketPrice,
		"bus_owner_share_pct":         cfg.BusOwnerSharePct,
		"driver_share_pct":           cfg.DriverSharePct,
		"conductor_share_pct":        cfg.ConductorSharePct,
		"company_commission_pct":     cfg.CompanyCommissionPct,
		"default_lounge_fee":         cfg.DefaultLoungeFee,
		"lounge_owner_share_pct":      cfg.LoungeOwnerSharePct,
		"lounge_owner_commission_pct": cfg.LoungeCommissionPct,
	}

	for k, v := range configs {
		_, err := tx.Exec(`
			INSERT INTO public.settlement_config (config_key, config_value, updated_at)
			VALUES ($1, $2, now())
			ON CONFLICT (config_key) DO UPDATE SET config_value = EXCLUDED.config_value, updated_at = now()
		`, k, v)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

// GetPublicTicketPricing provides public pricing information for customer mobile apps
func (s *SettlementService) GetPublicTicketPricing() (*models.PublicTicketPricing, error) {
	cfg, err := s.GetPricingConfig()
	if err != nil {
		return nil, err
	}

	return &models.PublicTicketPricing{
		TicketPrice:  cfg.DefaultTicketPrice,
		Currency:     "LKR",
		LoungeFee:    cfg.DefaultLoungeFee,
		PricingModel: "flat_fare",
		UpdatedAt:    cfg.UpdatedAt,
	}, nil
}




package services

import (
	"database/sql"
	"time"
)

// GetCompanyWalletData fetches wallet balance and recent transactions
func (s *SettlementService) GetCompanyWalletData() (map[string]interface{}, error) {
	// 1. Get Wallet Balance and Reserve
	var balance, reserve float64
	err := s.db.QueryRow(`SELECT balance, reserve_threshold FROM public.company_wallet LIMIT 1`).Scan(&balance, &reserve)
	if err != nil {
		if err == sql.ErrNoRows {
			balance, reserve = 0, 50000 // default if empty
		} else {
			return nil, err
		}
	}

	// 2. Get Pending Payouts Total
	var totalPending float64
	s.db.QueryRow(`SELECT COALESCE(SUM(total_net_amount), 0) FROM public.settlement_batches WHERE status = 'pending'`).Scan(&totalPending)

	// 3. Get Recent Transactions
	rows, err := s.db.Query(`
		SELECT amount, transaction_type, reference_type, description, status, created_at 
		FROM public.wallet_transactions 
		ORDER BY created_at DESC LIMIT 50
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var transactions []map[string]interface{}
	for rows.Next() {
		var amount float64
		var tType, rType, desc, status string
		var createdAt time.Time
		if err := rows.Scan(&amount, &tType, &rType, &desc, &status, &createdAt); err == nil {
			transactions = append(transactions, map[string]interface{}{
				"amount": amount,
				"type": tType,
				"reference_type": rType,
				"description": desc,
				"status": status,
				"created_at": createdAt,
			})
		}
	}

	return map[string]interface{}{
		"balance": balance,
		"available_balance": balance - reserve,
		"reserve_threshold": reserve,
		"pending_payouts": totalPending,
		"recent_transactions": transactions,
	}, nil
}

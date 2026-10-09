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

	// 4. Get Daily Income for Chart (Last 14 days)
	chartRows, err := s.db.Query(`
		SELECT date_trunc('day', created_at) AS day, SUM(amount) AS daily_income
		FROM public.wallet_transactions
		WHERE transaction_type = 'credit' AND created_at >= (CURRENT_DATE - INTERVAL '14 days')
		GROUP BY 1
		ORDER BY 1 ASC
	`)
	var incomeHistory []map[string]interface{}
	if err == nil {
		defer chartRows.Close()
		for chartRows.Next() {
			var day time.Time
			var dailyIncome float64
			if err := chartRows.Scan(&day, &dailyIncome); err == nil {
				incomeHistory = append(incomeHistory, map[string]interface{}{
					"date": day.Format("2006-01-02"),
					"income": dailyIncome,
				})
			}
		}
	}

	return map[string]interface{}{
		"balance": balance,
		"available_balance": balance - reserve,
		"reserve_threshold": reserve,
		"pending_payouts": totalPending,
		"recent_transactions": transactions,
		"income_history": incomeHistory,
	}, nil
}

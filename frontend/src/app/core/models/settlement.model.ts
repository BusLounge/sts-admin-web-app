export interface SettlementOverview {
  quick_stats: {
    total_pending: number;
    paid_this_month: number;
    company_profit: number;
    next_payout_date: string;
  };
  upcoming_payouts: {
    payee_name: string;
    role: string;
    amount_accumulated: number;
    days_accumulated: number;
    frequency_days: number;
    expected_payout_date: string;
  }[];
  recent_payouts: {
    batch_id: string;
    date_paid: string;
    total_people: number;
    total_amount: number;
  }[];
  special_requests_count: number;
}

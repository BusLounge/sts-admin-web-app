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
    payee_name?: string;
    payee_type?: string;
    status?: string;
  }[];
  special_requests_count: number;
}

export interface SpecialRequestItem {
  tracker_id: string;
  payee_user_id: string;
  payee_name: string;
  payee_email: string;
  payee_type: string;
  current_frequency_days: number;
  requested_frequency_days: number;
  special_request_date?: string;
  days_accumulated: number;
  amount_accumulated: number;
}

export interface SettlementRecord {
  id: string;
  payee_type: string;
  booking_reference?: string;
  gross_amount: number;
  commission_rate: number;
  commission_amount: number;
  net_amount: number;
  currency: string;
  earning_date: string;
  status: string;
  is_paid: boolean;
  is_deduction: boolean;
  paid_at?: string;
}

export interface BatchDetail {
  batch_id: string;
  payee_user_id: string;
  payee_name: string;
  payee_type: string;
  period_start: string;
  period_end: string;
  total_days: number;
  total_settlements: number;
  total_gross_amount: number;
  total_commission: number;
  total_net_amount: number;
  status: string;
  processed_at: string;
  payhere_payout_id: string;
  bank_account_info?: {
    account_name?: string;
    account_number?: string;
    bank_name?: string;
    branch?: string;
    [key: string]: any;
  };
  settlements: SettlementRecord[];
}

export interface ProcessNowResult {
  message: string;
  batches_created: number;
  batches_skipped: number;
  total_amount_paid: number;
  details: string[];
}

export interface PricingConfig {
  default_ticket_price: number;
  bus_owner_share_pct: number;
  driver_share_pct: number;
  conductor_share_pct: number;
  company_commission_pct: number;
  default_lounge_fee: number;
  lounge_owner_share_pct: number;
  lounge_commission_pct: number;
  updated_at?: string;
}



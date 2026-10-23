export type RefundStatus = 'pending' | 'completed' | 'failed';

export interface RefundItem {
  id: string;
  booking_id: string;
  booking_reference: string;
  passenger_name: string;
  passenger_phone: string;
  total_fare: number;
  requested_amount: number;
  system_cost: number;
  final_refund_amount: number;
  reason: string;
  refund_reference: string;
  status: RefundStatus;
  tier_applied: string;
  created_at: string;
  refunded_at?: string;
  scheduled_departure?: string;
  route_name: string;
  bus_number: string;
}

export interface CriteriaCheck {
  is_payment_paid: boolean;
  is_trip_departed: boolean;
  hours_to_departure: number;
  suggested_tier: string;
  suggested_refund_pct: number;
  suggested_fee_pct: number;
  suggested_refund_amt: number;
  suggested_fee_amt: number;
  has_prior_refund: boolean;
  is_non_refundable: boolean;
  requires_override: boolean;
  policy_description: string;
}

export interface SettlementRecord {
  id: string;
  payee_type: string;
  payee_user_id: string;
  gross_amount: number;
  commission_rate: number;
  commission_amount: number;
  net_amount: number;
  currency: string;
  earning_date: string;
  status: string;
  is_paid: boolean;
  is_deduction: boolean;
  notes?: string;
}

export interface RefundDetail {
  id: string;
  booking_id: string;
  booking_reference: string;
  passenger_name: string;
  passenger_phone: string;
  passenger_email: string;
  booking_type: string;
  payment_status: string;
  booking_status: string;
  total_fare: number;
  requested_amount: number;
  system_cost: number;
  final_refund_amount: number;
  reason: string;
  refund_reference: string;
  status: RefundStatus;
  tier_applied: string;
  admin_notes?: string;
  processed_by_admin_id?: string;
  processed_by_admin_name?: string;
  created_at: string;
  refunded_at?: string;
  scheduled_departure?: string;
  route_name: string;
  bus_number: string;
  seat_numbers: string[];
  criteria: CriteriaCheck;
  associated_settlements: SettlementRecord[];
}

export interface ApproveRefundRequest {
  tier_applied: string;
  system_cost: number;
  admin_notes: string;
  override?: boolean;
}

export interface RejectRefundRequest {
  reason: string;
}

export interface RefundStats {
  pending_count: number;
  completed_count: number;
  failed_count: number;
  total_refunded: number;
  total_system_fees: number;
}

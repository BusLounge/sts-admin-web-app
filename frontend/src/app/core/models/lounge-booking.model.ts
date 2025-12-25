export interface LoungeBooking {
  booking_id: string;
  passenger_id: string;
  passenger_name?: string; // Added
  passenger_phone?: string; // Added
  ref_num?: string; // Added
  lounge_name: string;
  start_datetime: string; // ISO string
  duration_hours: number;
  guests: number; // total guests in booking
  adults?: number; // Added
  children?: number; // Added
  additional_features?: string[]; // Added
  capacity_used: number; // derived or provided
  total_amount: number;
  payment_status: 'Pending' | 'Paid' | 'Failed';
  booking_status: 'Confirmed' | 'Pending' | 'Cancelled' | 'Completed';
  created_at: string; // ISO
}
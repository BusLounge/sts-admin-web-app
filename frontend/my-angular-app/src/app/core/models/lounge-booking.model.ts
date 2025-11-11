export interface LoungeBooking {
  booking_id: string;
  passenger_id: string;
  lounge_name: string;
  start_datetime: string; // ISO string
  duration_hours: number;
  guests: number; // total guests in booking
  capacity_used: number; // derived or provided
  total_amount: number;
  payment_status: 'Pending' | 'Paid' | 'Failed';
  booking_status: 'Confirmed' | 'Pending' | 'Cancelled' | 'Completed';
  created_at: string; // ISO
}
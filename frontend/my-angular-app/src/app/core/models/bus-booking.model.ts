export interface BusBooking {
  booking_id: string; // unique identifier
  passenger_id: string;
  passenger_name: string;
  bus_number: string;
  bus_name?: string;
  from: string; // origin
  to: string;   // destination
  journey_datetime: string; // ISO string
  seats_booked: number;
  seat_numbers: string[]; // e.g., ["A1", "A2"]
  total_fare: number;
  payment_status: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
  booking_status: 'Confirmed' | 'Pending' | 'Cancelled' | 'Completed';
  created_at: string; // ISO
}
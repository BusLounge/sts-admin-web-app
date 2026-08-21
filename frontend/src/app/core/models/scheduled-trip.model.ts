export interface ScheduledTrip {
  // From scheduled_trips
  id: string;
  departure_datetime: string;
  estimated_duration_minutes: number;
  status: string;
  base_fare: number;
  is_bookable: boolean;
  assigned_driver_id: string;
  assigned_conductor_id: string;
  created_at: string;

  // From route_permits (joined)
  permit_id: string;
  permit_number: string;
  bus_registration_number: string;
  approved_fare: number;
  permit_status: string;
  expiry_date: string;
}

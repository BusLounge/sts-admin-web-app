export interface Complaint {
  id: string;
  role: string;
  name: string;
  contact: string;
  category: string;
  message: string;
  media: string;
  dateTime: string;
  assignedTeam: string;
  resolvedBy: string;
  activity: string;
  status: string;
  priority: string;
  latitude?: number;
  longitude?: number;
  locationAddress?: string;
  escalation?: ComplaintEscalation;
}

export interface ComplaintEscalation {
  current_level: number;
  current_team: string;
  source_app?: string;
  assigned_to_admin_id?: string;
  previous_assigned_admin_id?: string;
  assigned_to_name?: string;
  last_escalated_at?: string;
  next_escalation_due?: string;
  escalation_history?: EscalationHistoryEntry[];
}

export interface EscalationHistoryEntry {
  level: number;
  team_name: string;
  escalated_at: string;
  escalated_by: string;
  from_admin_id?: string;
  to_admin_id?: string;
  reason: string;
}

export interface PaginatedComplaintsResponse {
  data: Complaint[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}


export interface InvolvedPartyPerson {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: string;
}

export interface InvolvedBusOwner {
  id: string;
  company_name: string;
  contact_person: string;
  business_phone: string;
  business_email: string;
}

export interface InvolvedPartiesResponse {
  complaint_id: string;
  scheduled_trip_id?: string;
  active_trip_id?: string;
  issue_type: string;
  category: string;
  priority: string;
  description: string;
  status: string;
  created_at: string;
  route_name: string;
  bus_registration_number: string;
  departure_datetime?: string;
  customer: InvolvedPartyPerson;
  bus_owner?: InvolvedBusOwner;
  driver?: InvolvedPartyPerson;
  conductor?: InvolvedPartyPerson;
}

export interface ResolveCustomerRequest {
  solution_message: string;
  send_sms: boolean;
  send_email: boolean;
}

export interface NotifyInvolvedPartiesRequest {
  proposed_solution: string;
  notify_bus_owner: boolean;
  notify_driver: boolean;
  notify_conductor: boolean;
  notify_customer: boolean;
  custom_owner_note?: string;
  custom_driver_note?: string;
}

export interface PendingComplaintNotification {
  id: string;
  type: string;
  customer_name: string;
  customer_phone: string;
  category: string;
  priority: string;
  description: string;
  status: string;
  created_at: string;
  bus_number: string;
  route_name: string;
}

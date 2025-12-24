export interface Conductor {
    conductor_id: string; // Auto-generated UUID or auto-increment
    full_name: string;
    nic: string; // National Identity Card number
    phone_number: string;
    experience_years: number;
    // New license fields
    license_number: string;
    license_expiry_date: string; // ISO date string (yyyy-MM-dd)
    // Verification fields
    verification_status: 'Verified' | 'Pending' | 'Rejected';
    verification_note: string;
    status: 'Active' | 'On Leave' | 'Resigned';
    assigned_bus_id: string; // BusNumber reference
    hired_date: string;
}

export interface Lounge {
  lounge_id: string;
  owner: string;
  owner_nic: string;
  owner_email: string;
  owner_contact: string;
  name: string;
  address: string;
  lounge_contact: string;
  capacity: number;
  price_per_hour: number;
  lounge_status: string; // "open" or "close"
  operating_hours: string; // e.g., "08:00-22:00"
  amenities: string[]; // e.g., ["WiFi", "AC"]
  services: string[]; // e.g., ["Food", "Drinks"]
  images: string[]; // base64 encoded images
  created_at: string;
  verification: string; // e.g., "Verified", "Pending", "Rejected"
  verification_note: string;
}



export interface Lounge {
  lounge_id: string;
  owner: string;
  name: string;
  address: string;
  phone: string;
  capacity: number;
  price_per_hour: number;
  operating_hours: string; // e.g., "08:00-22:00"
  amenities: string[]; // e.g., ["WiFi", "AC"]
  services: string[]; // e.g., ["Food", "Drinks"]
  created_at: string;
}



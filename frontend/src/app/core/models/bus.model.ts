export interface Bus {
  bus_id: string;
  bus_number: string;
  company: string;
  contact: string;
  permitNum: string;
  regnum: string;
  capacity: number;
  type: string;
  assigned_route_id: string;
  approvedFare: number;
  is_active: boolean;
  verificationStatus: 'Verified' | 'Pending' | 'Rejected';
  documents?: string[]; // Array of document URLs or file names
}

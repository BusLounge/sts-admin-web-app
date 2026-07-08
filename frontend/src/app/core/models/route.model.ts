export interface MasterRoute {
  id: string;
  route_number: string;
  route_name: string;
  origin_city: string;
  destination_city: string;
  total_distance_km: string;
  estimated_duration_minutes: number;
  encoded_polyline: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RouteStop {
  id?: string;
  master_route_id?: string;
  stop_name: string;
  stop_order: number;
  latitude: number;
  longitude: number;
  arrival_time_offset_minutes?: number;
  is_major_stop?: boolean;
}

export interface CreateRouteRequest {
  route_number?: string;
  route_name: string;
  origin_city: string;
  destination_city: string;
  total_distance_km?: string;
  estimated_duration_minutes?: number;
  encoded_polyline: string;
  is_active?: boolean;
  stops?: RouteStop[];
}

export interface UpdateRouteRequest {
  route_number?: string;
  route_name?: string;
  origin_city?: string;
  destination_city?: string;
  total_distance_km?: string;
  estimated_duration_minutes?: number;
  encoded_polyline?: string;
  is_active?: boolean;
  stops?: RouteStop[];
}

export interface LatLng {
  lat: number;
  lng: number;
  isStop?: boolean;
  stopName?: string;
  stopId?: string;
}

export type EditModeType = 'add' | 'insert' | 'move' | 'select';

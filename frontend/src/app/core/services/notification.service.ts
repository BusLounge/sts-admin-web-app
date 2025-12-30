import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, forkJoin } from 'rxjs';
import { tap, map } from 'rxjs/operators';

export interface BusNotification {
  id: string;
  bus_number: string;
  company_name: string;
  identify_or_incorporation_no: string;
  business_email: string;
  business_phone: string;
  permit_number: string;
  license_plate: string;
  total_seats: number;
  bus_type: string;
  custom_route_name: string;
  fare_per_seat: number;
  status: string;
  verification_status: string;
  verification_documents?: string[];
}

export interface DriverNotification {
  id: string;
  name: string;
  contact_number: string;
  license_number: string;
  license_expiry_date: string;
  experience_years: number;
  verification_status: string;
  verification_notes: string;
  status: string;
  hire_date: string;
}

export interface ConductorNotification {
  id: string;
  name: string;
  contact_number: string;
  license_number: string;
  license_expiry_date: string;
  experience_years: number;
  verification_status: string;
  verification_notes: string;
  status: string;
  hire_date: string;
}

export interface LoungeNotification {
  lounge_id: string;
  lounge_owner: string;
  owner_nic: string;
  owner_email: string;
  owner_contact: string;
  lounge_name: string;
  lounge_contact: string;
  address: string;
  capacity: number;
  price_per_hour: number;
  facilities: string[];
  marketplace: string;
  verification: string;
  verification_note: string;
  operational: boolean;
}

export type AllNotifications = BusNotification | DriverNotification | ConductorNotification | LoungeNotification;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly apiUrl = 'http://localhost:8083/api';
  private readonly _pendingBuses$ = new BehaviorSubject<BusNotification[]>([]);
  private readonly _pendingDrivers$ = new BehaviorSubject<DriverNotification[]>([]);
  private readonly _pendingConductors$ = new BehaviorSubject<ConductorNotification[]>([]);
  private readonly _pendingLounges$ = new BehaviorSubject<LoungeNotification[]>([]);

  readonly pendingBuses$ = this._pendingBuses$.asObservable();
  readonly pendingDrivers$ = this._pendingDrivers$.asObservable();
  readonly pendingConductors$ = this._pendingConductors$.asObservable();
  readonly pendingLounges$ = this._pendingLounges$.asObservable();

  constructor(private http: HttpClient) {
    this.loadAllPendingNotifications();
  }

  get totalPendingCount(): number {
    return this._pendingBuses$.getValue().length +
           this._pendingDrivers$.getValue().length +
           this._pendingConductors$.getValue().length +
           this._pendingLounges$.getValue().length;
  }

  loadAllPendingNotifications(): void {
    forkJoin({
      buses: this.http.get<BusNotification[]>(`${this.apiUrl}/buses/pending`),
      drivers: this.http.get<DriverNotification[]>(`${this.apiUrl}/drivers/pending`),
      conductors: this.http.get<ConductorNotification[]>(`${this.apiUrl}/conductors/pending`),
      lounges: this.http.get<LoungeNotification[]>(`${this.apiUrl}/lounges/pending`)
    }).subscribe({
      next: (data) => {
        this._pendingBuses$.next(data.buses);
        this._pendingDrivers$.next(data.drivers);
        this._pendingConductors$.next(data.conductors);
        this._pendingLounges$.next(data.lounges);
        console.log('Loaded pending notifications:', {
          buses: data.buses.length,
          drivers: data.drivers.length,
          conductors: data.conductors.length,
          lounges: data.lounges.length
        });
      },
      error: (err) => console.error('Error loading pending notifications:', err)
    });
  }

  // Bus methods
  approveBus(busId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/buses/${busId}/verify`, { status: 'Verified' }).pipe(
      tap(() => this.loadAllPendingNotifications())
    );
  }

  rejectBus(busId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/buses/${busId}/verify`, { status: 'Rejected' }).pipe(
      tap(() => this.loadAllPendingNotifications())
    );
  }

  getBusById(busId: string): Observable<BusNotification> {
    return this.http.get<BusNotification>(`${this.apiUrl}/buses/${busId}`);
  }

  // Driver methods
  approveDriver(driverId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/drivers/${driverId}/verify`, { status: 'Verified' }).pipe(
      tap(() => this.loadAllPendingNotifications())
    );
  }

  rejectDriver(driverId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/drivers/${driverId}/verify`, { status: 'Rejected' }).pipe(
      tap(() => this.loadAllPendingNotifications())
    );
  }

  getDriverById(driverId: string): Observable<DriverNotification> {
    return this.http.get<DriverNotification>(`${this.apiUrl}/drivers/${driverId}`);
  }

  // Conductor methods
  approveConductor(conductorId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/conductors/${conductorId}/verify`, { status: 'Verified' }).pipe(
      tap(() => this.loadAllPendingNotifications())
    );
  }

  rejectConductor(conductorId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/conductors/${conductorId}/verify`, { status: 'Rejected' }).pipe(
      tap(() => this.loadAllPendingNotifications())
    );
  }

  getConductorById(conductorId: string): Observable<ConductorNotification> {
    return this.http.get<ConductorNotification>(`${this.apiUrl}/conductors/${conductorId}`);
  }

  // Lounge methods
  approveLounge(loungeId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/lounges/${loungeId}/verify`, { status: 'Verified' }).pipe(
      tap(() => this.loadAllPendingNotifications())
    );
  }

  rejectLounge(loungeId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/lounges/${loungeId}/verify`, { status: 'Rejected' }).pipe(
      tap(() => this.loadAllPendingNotifications())
    );
  }

  getLoungeById(loungeId: string): Observable<LoungeNotification> {
    return this.http.get<LoungeNotification>(`${this.apiUrl}/lounges/${loungeId}`);
  }
}

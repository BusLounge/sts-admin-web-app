import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ScheduledTrip } from '../models/scheduled-trip.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TripService {
  private apiUrl = `${environment.apiUrl}/trips`;

  constructor(private http: HttpClient) {}

  getScheduledTrips(date?: string): Observable<ScheduledTrip[]> {
    let params = new HttpParams();
    if (date) {
      params = params.set('date', date);
    }
    return this.http.get<ScheduledTrip[]>(`${this.apiUrl}/scheduled`, { params });
  }

  startTrip(id: string): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.apiUrl}/scheduled/${id}/start`, {});
  }

  endTrip(id: string): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.apiUrl}/scheduled/${id}/end`, {});
  }
}

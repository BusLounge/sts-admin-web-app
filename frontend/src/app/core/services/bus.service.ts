import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Bus } from '../models/bus.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BusService {
  private apiUrl = `${environment.apiUrl}/buses`;
  private readonly _buses$ = new BehaviorSubject<Bus[]>([]);
  readonly buses$ = this._buses$.asObservable();

  constructor(private http: HttpClient) {
    this.loadBuses();
  }

  get buses(): Bus[] {
    return this._buses$.getValue();
  }

  loadBuses(): void {
    this.http.get<Bus[]>(this.apiUrl).subscribe({
      next: (buses) => this._buses$.next(buses),
      error: (err) => console.error('Failed to load buses', err)
    });
  }

  addBus(bus: Omit<Bus, 'id'>): Observable<Bus> {
    return this.http.post<Bus>(this.apiUrl, bus).pipe(
      tap(newBus => {
        this._buses$.next([...this.buses, newBus]);
      })
    );
  }

  updateBus(updated: Bus): Observable<any> {
    return this.http.put(`${this.apiUrl}/${updated.id}`, updated).pipe(
      tap(() => {
        this._buses$.next(this.buses.map(b => (b.id === updated.id ? updated : b)));
      })
    );
  }

  deleteBus(busId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${busId}`).pipe(
      tap(() => {
        this._buses$.next(this.buses.filter(b => b.id !== busId));
      })
    );
  }

  getById(busId: string): Bus | undefined {
    return this.buses.find(b => b.id === busId);
  }
}

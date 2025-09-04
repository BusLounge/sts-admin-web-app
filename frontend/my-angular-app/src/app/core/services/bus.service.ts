import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Bus } from '../models/bus.model';

@Injectable({ providedIn: 'root' })
export class BusService {
  private readonly _buses$ = new BehaviorSubject<Bus[]>([
    { bus_id: 'BUS001', bus_number: 'NP1234', capacity: 45, type: 'AC', is_active: true, assigned_route_id: 'RT001' },
    { bus_id: 'BUS002', bus_number: 'NP5678', capacity: 50, type: 'Non-AC', is_active: false, assigned_route_id: 'RT002' }
  ]);

  readonly buses$ = this._buses$.asObservable();

  get buses(): Bus[] {
    return this._buses$.getValue();
  }

  addBus(bus: Bus): void {
    this._buses$.next([...this.buses, bus]);
  }

  updateBus(updated: Bus): void {
    this._buses$.next(this.buses.map(b => (b.bus_id === updated.bus_id ? updated : b)));
  }

  deleteBus(busId: string): void {
    this._buses$.next(this.buses.filter(b => b.bus_id !== busId));
  }

  getById(busId: string): Bus | undefined {
    return this.buses.find(b => b.bus_id === busId);
  }
}

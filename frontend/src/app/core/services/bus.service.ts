import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Bus } from '../models/bus.model';

@Injectable({ providedIn: 'root' })
export class BusService {
  private readonly _buses$ = new BehaviorSubject<Bus[]>([
    { bus_id: 'BUS001', bus_number: 'NP1234', company: 'ABC Transport', contact: '123-456-7890', permitNum: 'P12345', regnum: 'REG001', capacity: 45, type: 'AC', assigned_route_id: 'RT001', approvedFare: 1500, is_active: true, verificationStatus: 'Verified' },
    { bus_id: 'BUS002', bus_number: 'NP5678', company: 'XYZ Buses', contact: '987-654-3210', permitNum: 'P67890', regnum: 'REG002', capacity: 50, type: 'Non-AC', assigned_route_id: 'RT002', approvedFare: 1200, is_active: false, verificationStatus: 'Pending' }
  ]);

  readonly buses$ = this._buses$.asObservable();

  get buses(): Bus[] {
    return this._buses$.getValue();
  }

  addBus(bus: Omit<Bus, 'bus_id'>): void {
    const newId = `BUS${(this.buses.length + 1).toString().padStart(3, '0')}`;
    const newBus: Bus = { ...bus, bus_id: newId };
    this._buses$.next([...this.buses, newBus]);
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

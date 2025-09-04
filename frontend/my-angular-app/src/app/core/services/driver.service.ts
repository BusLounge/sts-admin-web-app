import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Driver } from '../models/driver.model';

@Injectable({ providedIn: 'root' })
export class DriverService {
  private readonly _drivers$ = new BehaviorSubject<Driver[]>([
    { 
      driver_id: 'DRV001', 
      first_name: 'John', 
      last_name: 'Doe', 
      email: 'john.doe@example.com', 
      phone: '+977-9841234567', 
      license_number: 'LIC123456', 
      license_expiry: '2025-12-31', 
      experience_years: 5, 
      is_active: true, 
      assigned_bus_id: 'BUS001', 
      hire_date: '2020-01-15' 
    },
    { 
      driver_id: 'DRV002', 
      first_name: 'Jane', 
      last_name: 'Smith', 
      email: 'jane.smith@example.com', 
      phone: '+977-9847654321', 
      license_number: 'LIC789012', 
      license_expiry: '2024-08-15', 
      experience_years: 3, 
      is_active: false, 
      assigned_bus_id: 'BUS002', 
      hire_date: '2021-03-20' 
    },
    { 
      driver_id: 'DRV003', 
      first_name: 'Mike', 
      last_name: 'Johnson', 
      email: 'mike.johnson@example.com', 
      phone: '+977-9849876543', 
      license_number: 'LIC345678', 
      license_expiry: '2026-06-30', 
      experience_years: 8, 
      is_active: true, 
      assigned_bus_id: '', 
      hire_date: '2018-09-10' 
    }
  ]);

  readonly drivers$ = this._drivers$.asObservable();

  get drivers(): Driver[] {
    return this._drivers$.getValue();
  }

  addDriver(driver: Driver): void {
    this._drivers$.next([...this.drivers, driver]);
  }

  updateDriver(updated: Driver): void {
    this._drivers$.next(this.drivers.map(d => (d.driver_id === updated.driver_id ? updated : d)));
  }

  deleteDriver(driverId: string): void {
    this._drivers$.next(this.drivers.filter(d => d.driver_id !== driverId));
  }

  getById(driverId: string): Driver | undefined {
    return this.drivers.find(d => d.driver_id === driverId);
  }
}
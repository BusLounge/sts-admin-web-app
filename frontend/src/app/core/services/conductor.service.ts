import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Conductor } from '../models/conductor.model';

@Injectable({ providedIn: 'root' })
export class ConductorService {
  private readonly _conductors$ = new BehaviorSubject<Conductor[]>([
    {
      conductor_id: 'CON001',
      full_name: 'Raj Kumar Sharma',
      nic: '123456789012',
      phone_number: '9841234567',
      experience_years: 5,
      license_number: 'LIC-NEP-0001',
      license_expiry_date: '2026-01-15',
      verification_status: 'Verified',
      verification_note: 'All documents verified.',
      status: 'Active',
      assigned_bus_id: 'BUS001',
      hired_date: '2020-01-15'
    },
    {
      conductor_id: 'CON002',
      full_name: 'Priya Devi',
      nic: '987654321098',
      phone_number: '9847654321',
      experience_years: 3,
      license_number: 'LIC-NEP-0002',
      license_expiry_date: '2025-11-30',
      verification_status: 'Pending',
      verification_note: 'Waiting for NIC confirmation.',
      status: 'On Leave',
      assigned_bus_id: 'BUS002',
      hired_date: '2021-03-20'
    },
    {
      conductor_id: 'CON003',
      full_name: 'Amit Kumar',
      nic: '456789123456',
      phone_number: '9849876543',
      experience_years: 8,
      license_number: 'LIC-NEP-0003',
      license_expiry_date: '2027-07-01',
      verification_status: 'Verified',
      verification_note: 'Background check completed.',
      status: 'Active',
      assigned_bus_id: 'BUS003',
      hired_date: '2018-09-10'
    },
    {
      conductor_id: 'CON004',
      full_name: 'Sunita Thapa',
      nic: '789123456789',
      phone_number: '9851234567',
      experience_years: 2,
      license_number: 'LIC-NEP-0004',
      license_expiry_date: '2024-12-31',
      verification_status: 'Rejected',
      verification_note: 'License expired.',
      status: 'Resigned',
      assigned_bus_id: '',
      hired_date: '2022-05-15'
    }
  ]);

  readonly conductors$ = this._conductors$.asObservable();

  get conductors(): Conductor[] {
    return this._conductors$.getValue();
  }

  addConductor(conductor: Omit<Conductor, 'conductor_id'>): void {
    const newId = `CON${(this.conductors.length + 1).toString().padStart(3, '0')}`;
    const newConductor: Conductor = { ...conductor, conductor_id: newId };
    this._conductors$.next([...this.conductors, newConductor]);
  }

  updateConductor(updated: Conductor): void {
    this._conductors$.next(this.conductors.map(c => (c.conductor_id === updated.conductor_id ? updated : c)));
  }

  deleteConductor(conductorId: string): void {
    this._conductors$.next(this.conductors.filter(c => c.conductor_id !== conductorId));
  }

  getById(conductorId: string): Conductor | undefined {
    return this.conductors.find(c => c.conductor_id === conductorId);
  }

  // Helper methods for status filtering
  getActiveConductors(): Conductor[] {
    return this.conductors.filter(c => c.status === 'Active');
  }

  getOnLeaveConductors(): Conductor[] {
    return this.conductors.filter(c => c.status === 'On Leave');
  }

  getResignedConductors(): Conductor[] {
    return this.conductors.filter(c => c.status === 'Resigned');
  }
}

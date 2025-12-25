import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Lounge } from '../models/lounge.model';

@Injectable({ providedIn: 'root' })
export class LoungeService {
  private readonly _lounges$ = new BehaviorSubject<Lounge[]>([
    {
      lounge_id: 'LNG001',
      owner: 'Alpha Group',
      name: 'Alpha Lounge',
      address: '1st Floor, Central Terminal, City A',
      lounge_contact: '+94710000001',
      capacity: 40,
      price_per_hour: 15,
      operating_hours: '06:00-22:00',
      amenities: ['WiFi', 'AC', 'TV'],
      services: ['Food', 'Drinks'],
      images: [],
      created_at: '2024-01-10T10:00:00Z',
      verification: 'Verified',
      verification_note: 'All documents verified'
    },
    {
      lounge_id: 'LNG002',
      owner: 'Beta Hospitality',
      name: 'Beta Premium Lounge',
      address: 'East Wing, Terminal 2, City B',
      lounge_contact: '+94710000002',
      capacity: 60,
      price_per_hour: 25,
      operating_hours: '08:00-23:00',
      amenities: ['WiFi', 'AC', 'Charging Ports'],
      services: ['Food', 'Drinks', 'Shower'],
      images: [],
      created_at: '2024-03-05T12:30:00Z',
      verification: 'Pending',
      verification_note: 'Awaiting additional documents'
    },
    {
      lounge_id: 'LNG003',
      owner: 'Gamma Services',
      name: 'Gamma Relax',
      address: 'North Block, City C',
      lounge_contact: '+94710000003',
      capacity: 30,
      price_per_hour: 12,
      operating_hours: '07:00-20:00',
      amenities: ['WiFi', 'Quiet Zone'],
      services: ['Drinks'],
      images: [],
      created_at: '2024-05-20T08:15:00Z',
      verification: 'Rejected',
      verification_note: 'Incomplete application'
    }
  ]);

  readonly lounges$ = this._lounges$.asObservable();

  get lounges(): Lounge[] { return this._lounges$.getValue(); }

  add(l: Lounge): void { this._lounges$.next([...this.lounges, l]); }
  update(updated: Lounge): void { this._lounges$.next(this.lounges.map(x => x.lounge_id === updated.lounge_id ? updated : x)); }
  delete(id: string): void { this._lounges$.next(this.lounges.filter(x => x.lounge_id !== id)); }
  getById(id: string): Lounge | undefined { return this.lounges.find(x => x.lounge_id === id); }

  getAmenitiesCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    this.lounges.forEach(l => l.amenities.forEach(a => counts[a] = (counts[a] || 0) + 1));
    return counts;
  }

  getServicesCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    this.lounges.forEach(l => l.services.forEach(s => counts[s] = (counts[s] || 0) + 1));
    return counts;
  }
}



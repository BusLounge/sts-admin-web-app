import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Lounge } from '../models/lounge.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LoungeService {
  private readonly _lounges$ = new BehaviorSubject<Lounge[]>([]);
  readonly lounges$ = this._lounges$.asObservable();
  private apiUrl = `${environment.apiUrl}/lounges`;

  constructor(private http: HttpClient) {
    this.loadLounges();
  }

  get lounges(): Lounge[] { return this._lounges$.getValue(); }

  loadLounges(): void {
    this.http.get<Lounge[]>(this.apiUrl).subscribe({
      next: (data) => this._lounges$.next(data || []),
      error: (err) => console.error('Failed to load lounges', err)
    });
  }

  add(l: Lounge): Observable<any> {
    return this.http.post(this.apiUrl, l).pipe(
      tap(() => this.loadLounges())
    );
  }

  update(updated: Lounge): Observable<any> {
    return this.http.put(`${this.apiUrl}/${updated.lounge_id}`, updated).pipe(
      tap(() => this.loadLounges())
    );
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.loadLounges())
    );
  }

  getById(id: string): Lounge | undefined {
    return this.lounges.find(x => x.lounge_id === id);
  }

  getAmenitiesCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    this.lounges.forEach(l => {
      if (l.facilities) {
        l.facilities.forEach(a => counts[a] = (counts[a] || 0) + 1);
      }
    });
    return counts;
  }

  getServicesCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    this.lounges.forEach(l => {
      if (l.marketplace) {
        counts[l.marketplace] = (counts[l.marketplace] || 0) + 1;
      }
    });
    return counts;
  }
}



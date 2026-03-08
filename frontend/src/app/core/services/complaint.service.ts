import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Complaint, ComplaintEscalation } from '../models/complaint.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ComplaintService {
  private apiUrl = `${environment.apiUrl}/complaints`;
  private escalationApiUrl = `${environment.apiUrl}/escalation`;
  private readonly _complaints$ = new BehaviorSubject<Complaint[]>([]);

  readonly complaints$ = this._complaints$.asObservable();

  constructor(private http: HttpClient) {}

  get complaints(): Complaint[] {
    return this._complaints$.getValue();
  }

  loadComplaints(): Observable<Complaint[]> {
    return this.http.get<Complaint[]>(this.apiUrl).pipe(
      tap(complaints => {
        console.log('Loaded complaints:', complaints.length);
        this._complaints$.next(complaints);
      })
    );
  }

  loadComplaintsByRole(role: string): Observable<Complaint[]> {
    return this.http.get<Complaint[]>(`${this.apiUrl}?role=${role}`).pipe(
      tap(complaints => {
        console.log(`Loaded ${role} complaints:`, complaints.length);
      })
    );
  }

  getComplaintById(id: string): Observable<Complaint> {
    return this.http.get<Complaint>(`${this.apiUrl}/${id}`);
  }

  updateComplaintStatus(id: string, status: string, resolvedById?: string, resolutionNotes?: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/status`, {
      status,
      resolved_by_id: resolvedById,
      resolution_notes: resolutionNotes
    }).pipe(
      tap(() => this.loadComplaints().subscribe())
    );
  }

  // Escalation methods
  getComplaintEscalation(id: string): Observable<ComplaintEscalation> {
    return this.http.get<ComplaintEscalation>(`${this.apiUrl}/${id}/escalation`);
  }

  manualEscalateComplaint(id: string, escalatedBy: string = 'admin'): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/escalate`, {
      escalated_by: escalatedBy
    }).pipe(
      tap(() => this.loadComplaints().subscribe())
    );
  }

  getEscalationStats(): Observable<any> {
    return this.http.get(`${this.escalationApiUrl}/stats`);
  }

  initializeEscalation(complaintId: string, category: string): Observable<any> {
    return this.http.post(`${this.escalationApiUrl}/complaint/${complaintId}/initialize`, {
      category
    });
  }
}

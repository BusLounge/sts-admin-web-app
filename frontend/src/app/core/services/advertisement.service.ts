import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Advertisement,
  AdvertisementGroup,
  AdvertisementGroupCreateRequest,
  UploadMediaResponse,
  LoungeAdSlotSummary
} from '../models/advertisement.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdvertisementService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ── Media ──────────────────────────────────────────────────────────────────
  uploadMedia(file: File): Observable<UploadMediaResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UploadMediaResponse>(
      `${this.baseUrl}/advertisements/upload-media`,
      formData
    );
  }

  // ── Advertisements ─────────────────────────────────────────────────────────
  getAllAdvertisements(): Observable<Advertisement[]> {
    return this.http.get<Advertisement[]>(`${this.baseUrl}/advertisements`);
  }

  getAdvertisementById(id: string): Observable<Advertisement> {
    return this.http.get<Advertisement>(`${this.baseUrl}/advertisements/${id}`);
  }

  createAdvertisement(ad: any): Observable<Advertisement> {
    return this.http.post<Advertisement>(`${this.baseUrl}/advertisements`, ad);
  }

  updateAdvertisement(id: string, ad: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/advertisements/${id}`, ad);
  }

  deleteAdvertisement(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/advertisements/${id}`);
  }

  checkConflicts(payload: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/advertisements/conflicts`, payload);
  }

  // ── Advertisement Groups ───────────────────────────────────────────────────
  getAllGroups(): Observable<AdvertisementGroup[]> {
    return this.http.get<AdvertisementGroup[]>(`${this.baseUrl}/advertisement-groups`);
  }

  getGroupById(id: string): Observable<AdvertisementGroup> {
    return this.http.get<AdvertisementGroup>(`${this.baseUrl}/advertisement-groups/${id}`);
  }

  createGroup(group: AdvertisementGroupCreateRequest): Observable<AdvertisementGroup> {
    return this.http.post<AdvertisementGroup>(`${this.baseUrl}/advertisement-groups`, group);
  }

  updateGroup(id: string, group: AdvertisementGroupCreateRequest): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/advertisement-groups/${id}`, group);
  }

  deleteGroup(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/advertisement-groups/${id}`);
  }

  // ── Lounge Ad Slots ────────────────────────────────────────────────────────
  getLoungeAdSlots(loungeId: string): Observable<LoungeAdSlotSummary> {
    return this.http.get<LoungeAdSlotSummary>(`${this.baseUrl}/lounge-ads/slots/${loungeId}`);
  }
}

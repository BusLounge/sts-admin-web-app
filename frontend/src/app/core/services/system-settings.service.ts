import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface NotificationSettings {
  lounge_owner: string[];
  lounge: string[];
  bus_owner: string[];
  driver: string[];
  conductor: string[];
}

@Injectable({
  providedIn: 'root'
})
export class SystemSettingsService {
  private apiUrl = `${environment.apiUrl}/settings/notifications`;

  constructor(private http: HttpClient) {}

  getNotificationSettings(): Observable<NotificationSettings> {
    return this.http.get<NotificationSettings>(this.apiUrl);
  }

  updateNotificationSettings(settings: NotificationSettings): Observable<any> {
    return this.http.put(this.apiUrl, settings);
  }
}

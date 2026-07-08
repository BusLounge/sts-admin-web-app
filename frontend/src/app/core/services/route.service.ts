import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MasterRoute, CreateRouteRequest, UpdateRouteRequest } from '../models/route.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RouteService {
  private baseUrl = `${environment.apiUrl}/routes`;

  constructor(private http: HttpClient) {}

  getAllRoutes(): Observable<MasterRoute[]> {
    return this.http.get<MasterRoute[]>(this.baseUrl);
  }

  getRouteById(id: string): Observable<MasterRoute> {
    return this.http.get<MasterRoute>(`${this.baseUrl}/${id}`);
  }

  getRouteStops(id: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${id}/stops`);
  }

  createRoute(req: CreateRouteRequest): Observable<MasterRoute> {
    return this.http.post<MasterRoute>(this.baseUrl, req);
  }

  updateRoute(id: string, req: UpdateRouteRequest): Observable<MasterRoute> {
    return this.http.put<MasterRoute>(`${this.baseUrl}/${id}`, req);
  }

  deleteRoute(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`);
  }
}

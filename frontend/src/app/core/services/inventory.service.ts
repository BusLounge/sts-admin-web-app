import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, switchMap } from 'rxjs';
import { InventoryItem, InventoryCategory } from '../models/inventory.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly _items$ = new BehaviorSubject<InventoryItem[]>([]);
  readonly items$ = this._items$.asObservable();
  
  private readonly _categories$ = new BehaviorSubject<InventoryCategory[]>([]);
  readonly categories$ = this._categories$.asObservable();

  private apiUrl = `${environment.apiUrl}/admin/inventory`;

  constructor(private http: HttpClient) {
    this.loadItems().subscribe();
    this.loadCategories().subscribe();
  }

  get items(): InventoryItem[] { return this._items$.getValue(); }
  get categories(): InventoryCategory[] { return this._categories$.getValue(); }

  loadItems(): Observable<InventoryItem[]> {
    return this.http.get<InventoryItem[]>(`${this.apiUrl}/items`).pipe(
      tap(data => {
        this._items$.next(data || []);
      })
    );
  }

  loadCategories(): Observable<InventoryCategory[]> {
    return this.http.get<InventoryCategory[]>(`${this.apiUrl}/categories`).pipe(
      tap(data => {
        this._categories$.next(data || []);
      })
    );
  }

  add(item: InventoryItem): Observable<any> {
    return this.http.post(`${this.apiUrl}/items`, item).pipe(
      switchMap(() => this.loadItems())
    );
  }

  update(id: string, updated: Partial<InventoryItem>): Observable<any> {
    return this.http.put(`${this.apiUrl}/items/${id}`, updated).pipe(
      switchMap(() => this.loadItems())
    );
  }

  toggleStatus(id: string, isActive: boolean): Observable<any> {
    return this.http.patch(`${this.apiUrl}/items/${id}/status`, { is_active: isActive }).pipe(
      switchMap(() => this.loadItems())
    );
  }

  getById(id: string): Observable<InventoryItem> {
    return this.http.get<InventoryItem>(`${this.apiUrl}/items/${id}`);
  }

  uploadImage(file: File): Observable<{ message: string, image_url: string, filename: string }> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<{ message: string, image_url: string, filename: string }>(`${this.apiUrl}/images`, formData);
  }
}

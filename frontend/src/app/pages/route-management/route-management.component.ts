import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  NgZone,
  PLATFORM_ID,
  Inject,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MasterRoute, LatLng, CreateRouteRequest, UpdateRouteRequest, EditModeType } from '../../core/models/route.model';
import { RouteService } from '../../core/services/route.service';
import { LoungeService } from '../../core/services/lounge.service';
import { Lounge } from '../../core/models/lounge.model';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import {
  decodePolyline,
  encodePolyline,
  totalRouteDistance,
  findInsertIndex,
} from '../../core/utils/polyline.utils';

interface EditableRoute {
  id: string | null;
  routeNumber: string;
  routeName: string;
  originCity: string;
  destinationCity: string;
  points: LatLng[];
  isNew: boolean;
}

@Component({
  selector: 'app-route-management',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './route-management.component.html',
  styleUrls: ['./route-management.component.scss'],
})
export class RouteManagementComponent implements OnInit, OnDestroy, AfterViewInit {
  // ── Data ─────────────────────────────────────────────────────────────
  routes: MasterRoute[] = [];
  filteredRoutes: MasterRoute[] = [];
  searchQuery = '';
  isLoading = false;
  errorMsg = '';
  successMsg = '';
  lounges: Lounge[] = [];

  // ── Map ──────────────────────────────────────────────────────────────
  private map: any = null;
  private L: any = null;
  private polylineLayer: any = null;
  private markersLayer: any[] = [];
  private selectionRect: any = null;
  private loungeFeatureGroup: any = null;
  private isBrowser = false;

  // ── Edit mode ────────────────────────────────────────────────────────
  isEditMode = false;
  isReadOnlyMode = false;
  editableRoute: EditableRoute | null = null;
  editModeType: EditModeType = 'add';
  highlightedIndex: number | null = null;
  generatedPolyline = '';
  selectedIndices = new Set<number>();

  // ── Selection drag ───────────────────────────────────────────────────
  private isDragging = false;
  private dragStart: LatLng | null = null;
  private dragCurrent: LatLng | null = null;

  // ── Forms ────────────────────────────────────────────────────────────
  newRouteName = '';
  newRouteNumber = '';
  newOriginCity = '';
  newDestinationCity = '';
  selectedRouteId = '';
  editRouteNumber = '';

  // ── Coordinate input ─────────────────────────────────────────────────
  coordLat = '';
  coordLng = '';
  coordError = '';

  // ── City search ──────────────────────────────────────────────────────
  cityInput = '';
  cityError = '';
  isCitySearching = false;

  // ── Modals ───────────────────────────────────────────────────────────
  showDeleteModal = false;
  routeToDelete: MasterRoute | null = null;
  showExitModal = false;
  showClearModal = false;

  // ── Sidebar tabs ─────────────────────────────────────────────────────
  activeTab: 'list' | 'create' | 'edit' | 'points' = 'list';

  readonly editModes: EditModeType[] = ['add', 'insert', 'move', 'select'];

  readonly modeIcons: Record<string, string> = {
    add: 'fas fa-plus-circle',
    insert: 'fas fa-code-branch',
    move: 'fas fa-arrows-alt',
    select: 'fas fa-object-group',
  };

  readonly modeLabels: Record<string, string> = {
    add: 'Add',
    insert: 'Insert',
    move: 'Move',
    select: 'Select',
  };

  readonly modeTooltips: Record<string, string> = {
    add: 'Click on the map to append points to the end of the route.',
    insert: 'Click between existing points to insert a new point.',
    move: 'Drag individual markers to reposition them.',
    select: 'Drag a rectangle to select multiple points for deletion.',
  };

  constructor(
    private routeService: RouteService,
    private loungeService: LoungeService,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.loadRoutes();
    this.loungeService.lounges$.subscribe((lounges) => {
      this.lounges = lounges;
      this.renderLounges();
    });
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      // Delay to ensure DOM is ready
      setTimeout(() => this.initMap(), 100);
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  // ── Map Init ─────────────────────────────────────────────────────────
  private async initMap(): Promise<void> {
    try {
      const leaflet = await import('leaflet');
      this.L = leaflet.default || leaflet;

      // Fix default marker icons
      const iconDefault = this.L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });
      this.L.Marker.prototype.options.icon = iconDefault;

      this.map = this.L.map('route-map', {
        center: [6.9271, 79.8612],
        zoom: 8,
        zoomControl: false,
      });

      this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(this.map);

      // Custom zoom control top-right
      this.L.control.zoom({ position: 'topright' }).addTo(this.map);
      this.refreshMapSize();

      // Map click handler
      this.map.on('click', (e: any) => {
        this.ngZone.run(() => {
          if (this.isEditMode && this.editableRoute) {
            if (this.editModeType === 'add') {
              this.addPoint(e.latlng.lat, e.latlng.lng);
            } else if (this.editModeType === 'insert') {
              this.insertPoint(e.latlng.lat, e.latlng.lng);
            }
          }
        });
      });

      // Selection drag
      this.map.on('mousedown', (e: any) => {
        // Only allow selection dragging if NOT in read-only mode (so viewing a route allows panning)
        if (this.isEditMode && this.editModeType === 'select' && !this.isReadOnlyMode) {
          this.ngZone.run(() => {
            this.isDragging = true;
            this.dragStart = { lat: e.latlng.lat, lng: e.latlng.lng };
            this.map.dragging.disable();
          });
        }
      });

      this.map.on('mousemove', (e: any) => {
        if (this.isDragging && this.dragStart && this.editModeType === 'select' && !this.isReadOnlyMode) {
          this.ngZone.run(() => {
            this.dragCurrent = { lat: e.latlng.lat, lng: e.latlng.lng };
            this.updateSelectionRect();
            this.calculateSelectedPoints();
          });
        }
      });

      this.map.on('mouseup', () => {
        if (this.isDragging) {
          this.ngZone.run(() => {
            this.isDragging = false;
            this.dragStart = null;
            this.dragCurrent = null;
            if (this.selectionRect) {
              this.selectionRect.remove();
              this.selectionRect = null;
            }
            this.map.dragging.enable();
          });
        }
      });

      this.loungeFeatureGroup = this.L.featureGroup().addTo(this.map);
      this.renderLounges();

    } catch (err) {
      console.error('Error initializing map:', err);
    }
  }

  // ── Distance Calculation Helpers ─────────────────────────────────────
  private getDistanceToPolyline(lat: number, lng: number, polyline: LatLng[]): number {
    if (!polyline || polyline.length === 0) return Infinity;
    
    // Scale longitude to match latitude distance using cosine of the point's latitude
    const cosLat = Math.cos(lat * Math.PI / 180);
    const p = { x: lng * cosLat, y: lat };

    if (polyline.length === 1) {
      const v = { x: polyline[0].lng * cosLat, y: polyline[0].lat };
      return Math.sqrt((p.x - v.x) ** 2 + (p.y - v.y) ** 2) * 111.32;
    }

    let minDistance = Infinity;
    for (let i = 0; i < polyline.length - 1; i++) {
      const v = { x: polyline[i].lng * cosLat, y: polyline[i].lat };
      const w = { x: polyline[i+1].lng * cosLat, y: polyline[i+1].lat };
      const dist = this.pointToSegmentDistance(p, v, w);
      if (dist < minDistance) {
        minDistance = dist;
      }
    }
    // Convert to km (1 degree latitude is ~111.32 km)
    return minDistance * 111.32;
  }

  private pointToSegmentDistance(p: {x: number, y: number}, v: {x: number, y: number}, w: {x: number, y: number}): number {
    const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
    if (l2 === 0) return Math.sqrt((p.x - v.x) ** 2 + (p.y - v.y) ** 2);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    const proj = { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) };
    return Math.sqrt((p.x - proj.x) ** 2 + (p.y - proj.y) ** 2);
  }

  private renderLounges(): void {
    if (!this.map || !this.L || !this.loungeFeatureGroup) return;

    this.loungeFeatureGroup.clearLayers();

    // Unique icon for lounges
    const loungeIcon = this.L.divIcon({
      className: 'lounge-marker-icon',
      html: `<div class="lounge-marker-inner"><i class="fas fa-coffee"></i></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    const LOUNGE_MAX_DISTANCE_KM = 5;

    this.lounges.forEach(lounge => {
      // Check if coordinates exist and are valid (not 0,0 default if uninitialized)
      if (lounge.latitude && lounge.longitude && (lounge.latitude !== 0 || lounge.longitude !== 0)) {
        
        // Filter based on active route proximity if a route is selected
        if (this.isEditMode && this.editableRoute && this.editableRoute.points && this.editableRoute.points.length > 0) {
          const dist = this.getDistanceToPolyline(lounge.latitude, lounge.longitude, this.editableRoute.points);
          if (dist > LOUNGE_MAX_DISTANCE_KM) {
            return; // Skip rendering this lounge
          }
        }

        const marker = this.L.marker([lounge.latitude, lounge.longitude], {
          icon: loungeIcon,
          title: lounge.lounge_name
        });

        // Implement hover delay for popup
        let hoverTimer: any = null;
        const popupContent = `
          <div class="lounge-popup">
            <h4><i class="fas fa-couch"></i> ${lounge.lounge_name}</h4>
            <p><strong>Capacity:</strong> ${lounge.capacity} persons</p>
            <p><strong>Price:</strong> LKR ${lounge.price_per_hour}/hr</p>
          </div>
        `;

        marker.bindPopup(popupContent, {
          closeButton: false,
          className: 'custom-lounge-popup'
        });

        marker.on('mouseover', () => {
          hoverTimer = setTimeout(() => {
            marker.openPopup();
          }, 2000); // 2-second delay
        });

        marker.on('mouseout', () => {
          if (hoverTimer) clearTimeout(hoverTimer);
          marker.closePopup();
        });

        this.loungeFeatureGroup.addLayer(marker);
      }
    });
  }

  // ── Data Loading ──────────────────────────────────────────────────────
  loadRoutes(): void {
    this.isLoading = true;
    this.routeService.getAllRoutes().subscribe({
      next: (routes) => {
        this.routes = routes;
        this.applyFilter();
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMsg = 'Failed to load routes: ' + (err.message || 'Unknown error');
        this.isLoading = false;
      },
    });
  }

  applyFilter(): void {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) {
      this.filteredRoutes = [...this.routes];
    } else {
      this.filteredRoutes = this.routes.filter(
        (r) =>
          r.route_name.toLowerCase().includes(q) ||
          r.route_number.toLowerCase().includes(q) ||
          r.origin_city.toLowerCase().includes(q) ||
          r.destination_city.toLowerCase().includes(q)
      );
    }
  }

  // ── View route on map ─────────────────────────────────────────────────
  private hydrateStops(routeId: string, points: LatLng[]): void {
    this.routeService.getRouteStops(routeId).subscribe({
      next: (stops) => {
        if (stops && stops.length > 0) {
          points.forEach((point) => {
            for (const stop of stops) {
              const distance = Math.sqrt(
                Math.pow(point.lat - stop.latitude, 2) +
                  Math.pow(point.lng - stop.longitude, 2)
              );
              if (distance < 0.0005) {
                point.isStop = true;
                point.stopName = stop.stop_name;
                point.stopId = stop.id;
                break;
              }
            }
          });
        }
      },
      error: (err) => console.error('Failed to load stops', err)
    });
  }

  viewRouteOnMap(route: MasterRoute): void {
    if (!this.map || !route.encoded_polyline) return;
    try {
      const points = decodePolyline(route.encoded_polyline);
      this.hydrateStops(route.id, points);
      this.editableRoute = {
        id: route.id,
        routeNumber: route.route_number,
        routeName: route.route_name,
        originCity: route.origin_city,
        destinationCity: route.destination_city,
        points,
        isNew: false,
      };
      this.isEditMode = true;
      this.isReadOnlyMode = true;
      this.editModeType = 'select'; // view only
      this.generatedPolyline = route.encoded_polyline;
      this.selectedIndices.clear();
      this.activeTab = 'points';
      this.renderEditableRoute();
    } catch (e) {
      this.showError('Could not decode polyline for this route.');
    }
  }

  // ── Edit mode ─────────────────────────────────────────────────────────
  enterCreateMode(): void {
    if (!this.newRouteName.trim() || !this.newOriginCity.trim() || !this.newDestinationCity.trim()) {
      this.showError('Please fill in Route Name, Origin City, and Destination City.');
      return;
    }
    this.editableRoute = {
      id: null,
      routeNumber: '',
      routeName: this.newRouteName.trim(),
      originCity: this.newOriginCity.trim(),
      destinationCity: this.newDestinationCity.trim(),
      points: [],
      isNew: true,
    };
    this.isEditMode = true;
    this.editModeType = 'add';
    this.generatedPolyline = '';
    this.selectedIndices.clear();
    this.activeTab = 'points';
    this.renderEditableRoute();
  }

  duplicateRoute(route: MasterRoute): void {
    try {
      const points = route.encoded_polyline ? decodePolyline(route.encoded_polyline) : [];
      this.hydrateStops(route.id, points);
      this.editableRoute = {
        id: null,
        routeNumber: '',
        routeName: route.route_name + ' (Copy)',
        originCity: route.origin_city,
        destinationCity: route.destination_city,
        points: [...points],
        isNew: true,
      };
      this.newRouteName = this.editableRoute.routeName;
      this.newOriginCity = this.editableRoute.originCity;
      this.newDestinationCity = this.editableRoute.destinationCity;
      this.newRouteNumber = '';
      
      this.isEditMode = true;
      this.isReadOnlyMode = false;
      this.editModeType = 'add';
      this.generatedPolyline = route.encoded_polyline;
      this.selectedIndices.clear();
      this.activeTab = 'points';
      this.renderEditableRoute();
    } catch {
      this.showError('Failed to load route for duplication.');
    }
  }

  enterEditMode(route: MasterRoute): void {
    try {
      const points = route.encoded_polyline ? decodePolyline(route.encoded_polyline) : [];
      this.hydrateStops(route.id, points);
      this.editableRoute = {
        id: route.id,
        routeNumber: route.route_number,
        routeName: route.route_name,
        originCity: route.origin_city,
        destinationCity: route.destination_city,
        points,
        isNew: false,
      };
      this.editRouteNumber = route.route_number;
      this.isEditMode = true;
      this.isReadOnlyMode = false;
      this.editModeType = 'add';
      this.generatedPolyline = '';
      this.selectedIndices.clear();
      this.activeTab = 'points';
      this.renderEditableRoute();
    } catch {
      this.showError('Failed to load route for editing.');
    }
  }

  exitEditMode(): void {
    if (this.editableRoute && this.editableRoute.points.length > 0 && !this.generatedPolyline) {
      this.showExitModal = true;
      return;
    }
    this.doExitEditMode();
  }

  doExitEditMode(): void {
    this.isEditMode = false;
    this.isReadOnlyMode = false;
    this.editableRoute = null;
    this.generatedPolyline = '';
    this.selectedIndices.clear();
    this.highlightedIndex = null;
    this.showExitModal = false;
    this.clearMapLayers();
    this.newRouteName = '';
    this.newOriginCity = '';
    this.newDestinationCity = '';
    this.newRouteNumber = '';
    this.activeTab = 'list';
    this.refreshMapSize();
    this.renderLounges();
  }

  // ── Points ────────────────────────────────────────────────────────────
  addPoint(lat: number, lng: number): void {
    if (!this.editableRoute) return;
    this.editableRoute.points.push({ lat, lng });
    this.highlightedIndex = this.editableRoute.points.length - 1;
    this.generatedPolyline = '';
    this.renderEditableRoute();
  }

  insertPoint(lat: number, lng: number): void {
    if (!this.editableRoute) return;
    const index = findInsertIndex({ lat, lng }, this.editableRoute.points);
    this.editableRoute.points.splice(index, 0, { lat, lng });
    this.highlightedIndex = index;
    this.generatedPolyline = '';
    this.renderEditableRoute();
  }

  deletePoint(index: number): void {
    if (!this.editableRoute) return;
    this.editableRoute.points.splice(index, 1);
    if (this.highlightedIndex === index) this.highlightedIndex = null;
    else if (this.highlightedIndex !== null && this.highlightedIndex > index)
      this.highlightedIndex--;
    this.generatedPolyline = '';
    this.renderEditableRoute();
  }

  deleteSelectedPoints(): void {
    if (!this.editableRoute || this.selectedIndices.size === 0) return;
    this.editableRoute.points = this.editableRoute.points.filter(
      (_, i) => !this.selectedIndices.has(i)
    );
    this.selectedIndices.clear();
    this.highlightedIndex = null;
    this.generatedPolyline = '';
    this.renderEditableRoute();
  }

  focusOnPoint(index: number): void {
    if (!this.editableRoute || !this.editableRoute.points[index]) return;
    const p = this.editableRoute.points[index];
    this.map?.setView([p.lat, p.lng], 15);
    this.highlightedIndex = index;
    this.renderEditableRoute();
  }

  clearRoute(): void {
    this.showClearModal = true;
  }

  doConfirmClear(): void {
    if (this.editableRoute) {
      this.editableRoute.points = [];
      this.generatedPolyline = '';
      this.highlightedIndex = null;
      this.selectedIndices.clear();
      this.clearMapLayers();
    }
    this.showClearModal = false;
  }

  revertRoute(): void {
    if (!this.editableRoute || this.editableRoute.isNew) return;
    const original = this.routes.find((r) => r.id === this.editableRoute!.id);
    if (!original) return;
    try {
      const points = decodePolyline(original.encoded_polyline);
      this.editableRoute.points = points;
      this.editableRoute.routeName = original.route_name;
      this.editableRoute.originCity = original.origin_city;
      this.editableRoute.destinationCity = original.destination_city;
      this.editableRoute.routeNumber = original.route_number;
      this.editRouteNumber = original.route_number;
      this.generatedPolyline = '';
      this.highlightedIndex = null;
      this.selectedIndices.clear();
      this.renderEditableRoute();
      this.showSuccess('Route reverted to saved state.');
    } catch {
      this.showError('Failed to revert route.');
    }
  }

  // ── Polyline generation ───────────────────────────────────────────────
  generatePolyline(): void {
    if (!this.editableRoute || this.editableRoute.points.length < 2) {
      this.showError('Please add at least 2 points to generate a polyline.');
      return;
    }
    this.generatedPolyline = encodePolyline(this.editableRoute.points);
    this.showSuccess('Encoded polyline generated successfully!');
  }

  copyPolyline(): void {
    if (!this.generatedPolyline) return;
    navigator.clipboard.writeText(this.generatedPolyline);
    this.showSuccess('Polyline copied to clipboard!');
  }

  // ── Save to database ──────────────────────────────────────────────────
  saveRoute(): void {
    if (!this.editableRoute) return;
    if (!this.generatedPolyline) {
      this.showError('Please generate the encoded polyline first.');
      return;
    }

    const dist = totalRouteDistance(this.editableRoute.points);

    let stopOrder = 1;
    const stopsToSave = this.editableRoute.points
      .filter((p) => p.isStop)
      .map((p) => ({
        stop_name: p.stopName || `Stop ${stopOrder}`,
        stop_order: stopOrder++,
        latitude: p.lat,
        longitude: p.lng,
      }));

    if (this.editableRoute.isNew) {
      const req: CreateRouteRequest = {
        route_number: this.newRouteNumber.trim() || undefined,
        route_name: this.editableRoute.routeName,
        origin_city: this.editableRoute.originCity,
        destination_city: this.editableRoute.destinationCity,
        total_distance_km: dist.toFixed(2),
        estimated_duration_minutes: 210,
        encoded_polyline: this.generatedPolyline,
        is_active: true,
        stops: stopsToSave,
      };
      this.routeService.createRoute(req).subscribe({
        next: (route) => {
          this.routes.push(route);
          this.applyFilter();
          this.showSuccess(`Route "${route.route_name}" created successfully!`);
          this.doExitEditMode();
        },
        error: (err) => this.showError('Failed to create route: ' + (err.error?.error || err.message)),
      });
    } else {
      const req: UpdateRouteRequest = {
        route_number: this.editRouteNumber.trim() || this.editableRoute.routeNumber,
        route_name: this.editableRoute.routeName,
        origin_city: this.editableRoute.originCity,
        destination_city: this.editableRoute.destinationCity,
        total_distance_km: dist.toFixed(2),
        encoded_polyline: this.generatedPolyline,
        stops: stopsToSave,
      };
      this.routeService.updateRoute(this.editableRoute.id!, req).subscribe({
        next: (route) => {
          const idx = this.routes.findIndex((r) => r.id === route.id);
          if (idx >= 0) this.routes[idx] = route;
          this.applyFilter();
          this.showSuccess(`Route "${route.route_name}" updated successfully!`);
          this.doExitEditMode();
        },
        error: (err) => this.showError('Failed to update route: ' + (err.error?.error || err.message)),
      });
    }
  }

  // ── Delete route ──────────────────────────────────────────────────────
  confirmDelete(route: MasterRoute): void {
    this.routeToDelete = route;
    this.showDeleteModal = true;
  }

  doDeleteRoute(): void {
    if (!this.routeToDelete) return;
    this.routeService.deleteRoute(this.routeToDelete.id).subscribe({
      next: () => {
        this.routes = this.routes.filter((r) => r.id !== this.routeToDelete!.id);
        this.applyFilter();
        this.showSuccess(`Route "${this.routeToDelete!.route_name}" deleted.`);
        this.showDeleteModal = false;
        this.routeToDelete = null;
      },
      error: (err) => {
        this.showError('Failed to delete route: ' + (err.error?.error || err.message));
        this.showDeleteModal = false;
      },
    });
  }

  // ── Coordinate input ──────────────────────────────────────────────────
  addPointFromCoords(): void {
    const lat = parseFloat(this.coordLat);
    const lng = parseFloat(this.coordLng);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      this.coordError = 'Invalid latitude (must be -90 to 90).';
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      this.coordError = 'Invalid longitude (must be -180 to 180).';
      return;
    }
    this.coordError = '';
    if (this.editModeType === 'insert') {
      this.insertPoint(lat, lng);
    } else {
      this.addPoint(lat, lng);
    }
    this.map?.setView([lat, lng], 15);
    this.coordLat = '';
    this.coordLng = '';
  }

  searchByCoords(): void {
    const lat = parseFloat(this.coordLat);
    const lng = parseFloat(this.coordLng);
    if (!isNaN(lat) && !isNaN(lng)) {
      this.map?.setView([lat, lng], 15);
      this.coordError = '';
    } else {
      this.coordError = 'Enter valid coordinates first.';
    }
  }

  // ── City search ───────────────────────────────────────────────────────
  async searchCity(): Promise<void> {
    if (!this.cityInput.trim()) {
      this.cityError = 'Enter a city name.';
      return;
    }
    this.isCitySearching = true;
    this.cityError = '';
    try {
      const coords = await this.resolveCity(this.cityInput);
      if (coords) {
        this.map?.setView([coords.lat, coords.lng], 13);
      }
    } finally {
      this.isCitySearching = false;
    }
  }

  async addPointFromCity(): Promise<void> {
    if (!this.cityInput.trim()) {
      this.cityError = 'Enter a city name.';
      return;
    }
    this.isCitySearching = true;
    this.cityError = '';
    try {
      const coords = await this.resolveCity(this.cityInput);
      if (coords) {
        if (this.editModeType === 'insert') {
          this.insertPoint(coords.lat, coords.lng);
        } else {
          this.addPoint(coords.lat, coords.lng);
        }
        this.map?.setView([coords.lat, coords.lng], 13);
        this.cityInput = '';
      }
    } finally {
      this.isCitySearching = false;
    }
  }

  private async resolveCity(name: string): Promise<LatLng | null> {
    try {
      const url = `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(name)}&format=json&addressdetails=1&limit=5`;
      const resp = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!resp.ok) {
        this.cityError = 'City lookup failed.';
        return null;
      }
      const results = await resp.json();
      if (!results.length) {
        this.cityError = `No results for "${name}".`;
        return null;
      }
      return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
    } catch {
      this.cityError = 'City search failed. Check your internet connection.';
      return null;
    }
  }

  // ── Map rendering ─────────────────────────────────────────────────────
  private clearMapLayers(): void {
    if (!this.map) return;
    if (this.polylineLayer) {
      this.polylineLayer.remove();
      this.polylineLayer = null;
    }
    this.markersLayer.forEach((m) => m.remove());
    this.markersLayer = [];
    if (this.selectionRect) {
      this.selectionRect.remove();
      this.selectionRect = null;
    }
  }

  private renderViewPolyline(points: LatLng[]): void {
    this.clearMapLayers();
    if (!this.map || points.length < 2) return;
    const latlngs = points.map((p) => [p.lat, p.lng]);
    this.polylineLayer = this.L.polyline(latlngs, {
      color: '#6366f1',
      weight: 4,
      opacity: 0.85,
    }).addTo(this.map);

    // Start/end markers
    this.addStartEndMarkers(points);
    this.refreshMapSize();
  }

  private renderEditableRoute(): void {
    this.clearMapLayers();
    if (!this.map || !this.editableRoute) return;

    const points = this.editableRoute.points;
    if (points.length === 0) return;

    // Draw polyline
    if (points.length >= 2) {
      const latlngs = points.map((p) => [p.lat, p.lng]);
      this.polylineLayer = this.L.polyline(latlngs, {
        color: '#6366f1',
        weight: 3,
        opacity: 0.9,
        dashArray: this.editModeType !== 'add' ? '8,6' : undefined,
      }).addTo(this.map);
    }

    // Draw markers
    points.forEach((point, index) => {
      const isHighlighted = index === this.highlightedIndex;
      const isSelected = this.selectedIndices.has(index);
      const isFirst = index === 0;
      const isLast = index === points.length - 1;

      const color = isHighlighted
        ? '#fbbf24'
        : isSelected
        ? '#ef4444'
        : isFirst
        ? '#10b981'
        : isLast
        ? '#ef4444'
        : '#6366f1';
      const size = isHighlighted ? 16 : isSelected ? 13 : isFirst || isLast ? 14 : 10;

      const icon = this.L.divIcon({
        className: 'custom-point-marker',
        html: `<div style="
          width:${size}px;height:${size}px;
          background:${color};
          border:2px solid white;
          border-radius:50%;
          box-shadow:0 2px 6px rgba(0,0,0,0.35);
          cursor:${this.editModeType === 'move' ? 'move' : 'pointer'};
        "></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = this.L.marker([point.lat, point.lng], {
        icon,
        draggable: this.editModeType === 'move',
      }).addTo(this.map);

      marker.on('click', () => {
        this.ngZone.run(() => {
          this.highlightedIndex = index;
          this.renderEditableRoute();
        });
      });

      if (this.editModeType === 'move') {
        marker.on('dragend', (e: any) => {
          this.ngZone.run(() => {
            const pos = e.target.getLatLng();
            if (this.editableRoute) {
              this.editableRoute.points[index] = { lat: pos.lat, lng: pos.lng };
              this.generatedPolyline = '';
              this.renderEditableRoute();
            }
          });
        });
      }

      this.markersLayer.push(marker);
    });

    // Fit bounds after map size is invalidated
    setTimeout(() => {
      if (!this.map) return;
      this.map.invalidateSize();
      if (points.length >= 2) {
        const bounds = points.map((p) => [p.lat, p.lng] as [number, number]);
        this.map.fitBounds(bounds, { padding: [40, 40] });
      } else if (points.length === 1) {
        this.map.setView([points[0].lat, points[0].lng], 14);
      }
    }, 100);

    this.renderLounges();
  }

  private addStartEndMarkers(points: LatLng[]): void {
    if (points.length === 0) return;
    const makeIcon = (color: string, label: string) =>
      this.L.divIcon({
        className: '',
        html: `<div style="
          background:${color};color:white;font-size:10px;font-weight:700;
          padding:3px 7px;border-radius:12px;
          box-shadow:0 2px 8px rgba(0,0,0,0.3);
          white-space:nowrap;
        ">${label}</div>`,
        iconAnchor: [20, 12],
      });

    const startM = this.L.marker([points[0].lat, points[0].lng], {
      icon: makeIcon('#10b981', 'START'),
    }).addTo(this.map);
    this.markersLayer.push(startM);

    if (points.length > 1) {
      const endM = this.L.marker([points[points.length - 1].lat, points[points.length - 1].lng], {
        icon: makeIcon('#ef4444', 'END'),
      }).addTo(this.map);
      this.markersLayer.push(endM);
    }
  }

  private updateSelectionRect(): void {
    if (!this.dragStart || !this.dragCurrent) return;
    if (this.selectionRect) this.selectionRect.remove();
    this.selectionRect = this.L.rectangle(
      [
        [this.dragStart.lat, this.dragStart.lng],
        [this.dragCurrent.lat, this.dragCurrent.lng],
      ],
      { color: '#6366f1', weight: 1, fillOpacity: 0.1 }
    ).addTo(this.map);
  }

  private calculateSelectedPoints(): void {
    if (!this.editableRoute || !this.dragStart || !this.dragCurrent) return;
    const minLat = Math.min(this.dragStart.lat, this.dragCurrent.lat);
    const maxLat = Math.max(this.dragStart.lat, this.dragCurrent.lat);
    const minLng = Math.min(this.dragStart.lng, this.dragCurrent.lng);
    const maxLng = Math.max(this.dragStart.lng, this.dragCurrent.lng);

    this.selectedIndices.clear();
    this.editableRoute.points.forEach((p, i) => {
      if (p.lat >= minLat && p.lat <= maxLat && p.lng >= minLng && p.lng <= maxLng) {
        this.selectedIndices.add(i);
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────
  get pointCount(): number {
    return this.editableRoute?.points.length ?? 0;
  }

  get estimatedDistance(): string {
    if (!this.editableRoute || this.editableRoute.points.length < 2) return '0.00';
    return totalRouteDistance(this.editableRoute.points).toFixed(2);
  }

  setEditMode(mode: EditModeType): void {
    this.editModeType = mode;
    this.selectedIndices.clear();
    if (mode !== 'select') {
      this.renderEditableRoute();
    }
  }

  private refreshMapSize(): void {
    if (!this.map) return;
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 100);
  }

  private showError(msg: string): void {
    this.errorMsg = msg;
    setTimeout(() => (this.errorMsg = ''), 5000);
  }

  private showSuccess(msg: string): void {
    this.successMsg = msg;
    setTimeout(() => (this.successMsg = ''), 4000);
  }
}

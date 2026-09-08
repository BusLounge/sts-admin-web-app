import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { NotificationPanelComponent } from '../../shared/components/notification-panel/notification-panel.component';
import { TripService } from '../../core/services/trip.service';
import { ScheduledTrip } from '../../core/models/scheduled-trip.model';

@Component({
  selector: 'app-scheduled-trips',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, NotificationPanelComponent, RouterModule],
  templateUrl: './scheduled-trips.component.html',
  styleUrls: ['./scheduled-trips.component.scss']
})
export class ScheduledTripsComponent implements OnInit {
  trips: ScheduledTrip[] = [];
  filteredTrips: ScheduledTrip[] = [];
  isLoading = false;
  errorMessage = '';
  selectedDate = '';
  statusFilter = 'all';
  showNotificationPanel = false;

  readonly statusOptions = [
    { value: 'all',         label: 'All Statuses' },
    { value: 'scheduled',   label: 'Scheduled' },
    { value: 'confirmed',   label: 'Confirmed' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed',   label: 'Completed' },
    { value: 'cancelled',   label: 'Cancelled' },
  ];

  constructor(
    private tripService: TripService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTrips();
  }

  loadTrips(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.tripService.getScheduledTrips(this.selectedDate || undefined).subscribe({
      next: (data) => {
        this.trips = data;
        this.applyStatusFilter();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Failed to load scheduled trips.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyStatusFilter(): void {
    if (this.statusFilter === 'all') {
      this.filteredTrips = this.trips;
    } else {
      this.filteredTrips = this.trips.filter(t => t.status === this.statusFilter);
    }
  }

  onDateChange(): void {
    this.loadTrips();
  }

  onStatusFilterChange(): void {
    this.applyStatusFilter();
    this.cdr.detectChanges();
  }

  clearDateFilter(): void {
    this.selectedDate = '';
    this.loadTrips();
  }

  // A trip can be started only if:
  // 1. Its status is 'scheduled'
  // 2. Its departure_datetime falls on today's local date
  canStart(trip: ScheduledTrip): boolean {
    if (trip.status !== 'scheduled') return false;
    const today = new Date();
    const dep = new Date(trip.departure_datetime);
    return (
      dep.getFullYear() === today.getFullYear() &&
      dep.getMonth() === today.getMonth() &&
      dep.getDate() === today.getDate()
    );
  }

  // A trip can only be ended if it is currently in_progress
  canEnd(trip: ScheduledTrip): boolean {
    return trip.status === 'in_progress';
  }

  startTripDisabledReason(trip: ScheduledTrip): string {
    if (trip.status !== 'scheduled') {
      return `Cannot start: trip status is "${trip.status}"`;
    }
    if (!this.canStart(trip)) {
      return 'Can only start trips scheduled for today';
    }
    return '';
  }

  startTrip(trip: ScheduledTrip): void {
    if (!this.canStart(trip)) {
      const reason = this.startTripDisabledReason(trip);
      alert(reason);
      return;
    }

    const route = trip.origin_city && trip.destination_city
      ? `${trip.origin_city} → ${trip.destination_city}`
      : trip.permit_number || 'N/A';

    if (!confirm(`Are you sure you want to START this trip?\n\nRoute: ${route}\nBus: ${trip.bus_registration_number || 'N/A'}\nDeparture: ${this.formatDate(trip.departure_datetime)}`)) {
      return;
    }

    this.tripService.startTrip(trip.id).subscribe({
      next: () => {
        alert('Trip started successfully!');
        this.loadTrips();
      },
      error: (err) => {
        alert('Failed to start trip: ' + (err.error?.error || 'Unknown error'));
        this.cdr.detectChanges();
      }
    });
  }

  endTrip(trip: ScheduledTrip): void {
    if (!this.canEnd(trip)) {
      alert(`Cannot end this trip. Current status is "${trip.status}". Only in-progress trips can be ended.`);
      return;
    }

    const route = trip.origin_city && trip.destination_city
      ? `${trip.origin_city} → ${trip.destination_city}`
      : trip.permit_number || 'N/A';

    if (!confirm(`Are you sure you want to END this trip?\n\nRoute: ${route}\nBus: ${trip.bus_registration_number || 'N/A'}\n\nThis will mark the trip as completed.`)) {
      return;
    }

    this.tripService.endTrip(trip.id).subscribe({
      next: () => {
        alert('Trip ended successfully!');
        this.loadTrips();
      },
      error: (err) => {
        let msg = 'Unknown error';
        if (typeof err.error === 'string') msg = err.error;
        else if (err.error?.error) msg = err.error.error;
        else if (err.message) msg = err.message;
        
        alert('Failed to end trip: ' + msg);
        this.cdr.detectChanges();
      }
    });
  }

  toggleNotificationPanel(): void {
    this.showNotificationPanel = !this.showNotificationPanel;
    this.cdr.detectChanges();
  }

  closeNotificationPanel(): void {
    this.showNotificationPanel = false;
    this.cdr.detectChanges();
  }

  formatDate(dt: string): string {
    if (!dt) return '—';
    return new Date(dt).toLocaleString();
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'scheduled':   return 'badge-scheduled';
      case 'confirmed':   return 'badge-confirmed';
      case 'in_progress': return 'badge-in-progress';
      case 'completed':   return 'badge-completed';
      case 'cancelled':   return 'badge-cancelled';
      default:            return 'badge-default';
    }
  }
}

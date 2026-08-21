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
  isLoading = false;
  errorMessage = '';
  selectedDate = '';
  showNotificationPanel = false;

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

  onDateChange(): void {
    this.loadTrips();
  }

  clearDateFilter(): void {
    this.selectedDate = '';
    this.loadTrips();
  }

  startTrip(trip: ScheduledTrip): void {
    // Guard: only allow trips in 'scheduled' status
    if (trip.status !== 'scheduled') {
      alert(`Cannot start this trip. Current status is "${trip.status}". Only trips with status "scheduled" can be started.`);
      return;
    }

    if (!confirm(`Are you sure you want to start this trip?\n\nBus: ${trip.bus_registration_number || 'N/A'}\nPermit: ${trip.permit_number || 'N/A'}\nDeparture: ${this.formatDate(trip.departure_datetime)}`)) {
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
      case 'in_progress': return 'badge-in-progress';
      case 'completed':   return 'badge-completed';
      case 'cancelled':   return 'badge-cancelled';
      default:            return 'badge-default';
    }
  }

  canStart(trip: ScheduledTrip): boolean {
    return trip.status === 'scheduled';
  }
}

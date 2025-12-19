import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LoungeBookingService } from '../../core/services/lounge-booking.service';
import { LoungeBooking } from '../../core/models/lounge-booking.model';

@Component({
  selector: 'app-edit-lounge-booking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-lounge-booking.component.html',
  styleUrls: ['./edit-lounge-booking.component.scss']
})
export class EditLoungeBookingComponent implements OnInit {
  booking?: LoungeBooking;

  // Editable fields
  formDurationHours = 1;
  formGuests = 0;
  formCapacityUsed = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private svc: LoungeBookingService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/lounge-booking']); return; }
    const found = this.svc.bookings.find(b => b.booking_id === id);
    if (!found) { this.router.navigate(['/lounge-booking']); return; }
    this.booking = { ...found };

    // Initialize form from existing booking
    this.formDurationHours = this.booking.duration_hours;
    this.formGuests = this.booking.guests;
    this.formCapacityUsed = this.booking.capacity_used;
  }

  save(): void {
    if (!this.booking) return;

    // Only allow changes to duration_hours, guests, capacity_used
    const updated: LoungeBooking = {
      ...this.booking,
      duration_hours: Math.max(1, Number(this.formDurationHours) || 1),
      guests: Math.max(0, Number(this.formGuests) || 0),
      capacity_used: Math.max(0, Number(this.formCapacityUsed) || 0),
      // start_datetime remains unchanged (date/time locked)
    };

    this.svc.update(updated);
    this.router.navigate(['/lounge-booking']);
  }

  cancel(): void {
    this.router.navigate(['/lounge-booking']);
  }

  // Helpers
  get startDateTime(): string {
    if (!this.booking) return '';
    // Display as local datetime string for readability
    const d = new Date(this.booking.start_datetime);
    return d.toLocaleString();
  }
}
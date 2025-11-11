

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BusService } from '../../core/services/bus.service';
import { Bus } from '../../core/models/bus.model';

interface ValidationErrors {
  bus_number?: string | null;
  capacity?: string | null;
  assigned_route_id?: string | null;
}

@Component({
  selector: 'app-edit-bus',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-bus.component.html',
  styleUrls: ['./edit-bus.component.scss']
})
export class EditBusComponent implements OnInit {
  bus: Bus | undefined;
  isSubmitting = false;
  validationErrors: ValidationErrors = {};
  isFormSubmitted = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private busService: BusService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') as string;
    this.bus = this.busService.getById(id);
    if (!this.bus) {
      alert('Bus not found');
      this.router.navigate(['/bus-management']);
    }
  }

  // Validation methods
  validateBusNumber(busNumber: string): string | null {
    if (!busNumber || busNumber.trim() === '') {
      return 'Bus Number is required';
    }
    
    // Check format: 2 letters followed by 4 digits (e.g., ND1234)
    const busNumberPattern = /^[A-Z]{2}\d{4}$/;
    if (!busNumberPattern.test(busNumber.toUpperCase())) {
      return 'Bus Number must be in format: 2 letters followed by 4 digits (e.g., ND1234)';
    }
    
    return null;
  }

  validateCapacity(capacity: number | null): string | null {
    if (capacity === null || capacity === undefined) {
      return 'Capacity is required';
    }
    
    if (!Number.isInteger(capacity) || capacity <= 0) {
      return 'Capacity must be a positive integer';
    }
    
    if (capacity > 54) {
      return 'Capacity cannot exceed 54';
    }
    
    return null;
  }

  validateRouteId(routeId: string): string | null {
    if (!routeId || routeId.trim() === '') {
      return 'Route ID is required';
    }
    
    // Check if it's a string (not just numbers)
    if (!isNaN(Number(routeId))) {
      return 'Route ID must be a string value, not just numbers';
    }
    
    return null;
  }

  // Real-time validation
  onBusNumberChange(): void {
    if (this.bus) {
      this.validationErrors.bus_number = this.validateBusNumber(this.bus.bus_number);
    }
  }

  onCapacityChange(): void {
    if (this.bus) {
      this.validationErrors.capacity = this.validateCapacity(this.bus.capacity);
    }
  }

  onRouteIdChange(): void {
    if (this.bus) {
      this.validationErrors.assigned_route_id = this.validateRouteId(this.bus.assigned_route_id);
    }
  }

  // Check if form is valid
  isFormValid(): boolean {
    if (!this.bus) return false;
    return !this.validateBusNumber(this.bus.bus_number) &&
           !this.validateCapacity(this.bus.capacity) &&
           !this.validateRouteId(this.bus.assigned_route_id);
  }

  save(): void {
    if (!this.bus) return;
    
    this.isFormSubmitted = true;
    
    // Validate all fields
    this.validationErrors = {
      bus_number: this.validateBusNumber(this.bus.bus_number),
      capacity: this.validateCapacity(this.bus.capacity),
      assigned_route_id: this.validateRouteId(this.bus.assigned_route_id)
    };

    if (!this.isFormValid()) {
      return;
    }

    this.isSubmitting = true;
    // Convert bus number to uppercase before saving
    this.bus.bus_number = this.bus.bus_number.toUpperCase();
    this.busService.updateBus(this.bus);
    this.isSubmitting = false;
    this.router.navigate(['/bus-management']);
  }

  cancel(): void {
    this.router.navigate(['/bus-management']);
  }

  goBack(): void {
    this.router.navigate(['/bus-management']);
  }
}

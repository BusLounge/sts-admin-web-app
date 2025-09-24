import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BusService } from '../../core/services/bus.service';
import { Bus } from '../../core/models/bus.model';

interface AddBusForm {
  bus_number: string;
  capacity: number | null;
  type: string;
  is_active: boolean;
  assigned_route_id: string;
}

interface ValidationErrors {
  bus_number?: string | null;
  capacity?: string | null;
  assigned_route_id?: string | null;
}

@Component({
  selector: 'app-add-bus',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-bus.component.html',
  styleUrls: ['./add-bus.component.scss']
})
export class AddBusComponent {
  @Input() isModal = false; // when true, don't navigate, just emit close
  @Output() closed = new EventEmitter<void>();

  form: AddBusForm = {
    bus_number: '',
    capacity: null,
    type: 'AC',
    is_active: true,
    assigned_route_id: ''
  };

  isSubmitting = false;
  validationErrors: ValidationErrors = {};
  isFormSubmitted = false;

  constructor(private router: Router, private busService: BusService) {}

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
    this.validationErrors.bus_number = this.validateBusNumber(this.form.bus_number);
  }

  onCapacityChange(): void {
    this.validationErrors.capacity = this.validateCapacity(this.form.capacity);
  }

  onRouteIdChange(): void {
    this.validationErrors.assigned_route_id = this.validateRouteId(this.form.assigned_route_id);
  }

  // Check if form is valid
  isFormValid(): boolean {
    return !this.validateBusNumber(this.form.bus_number) &&
           !this.validateCapacity(this.form.capacity) &&
           !this.validateRouteId(this.form.assigned_route_id);
  }

  save(): void {
    this.isFormSubmitted = true;
    
    // Validate all fields
    this.validationErrors = {
      bus_number: this.validateBusNumber(this.form.bus_number),
      capacity: this.validateCapacity(this.form.capacity),
      assigned_route_id: this.validateRouteId(this.form.assigned_route_id)
    };

    if (!this.isFormValid()) {
      return;
    }

    this.isSubmitting = true;
    const newBus: Bus = {
      bus_id: this.generateBusId(),
      bus_number: this.form.bus_number.toUpperCase(),
      capacity: this.form.capacity as number,
      type: this.form.type,
      is_active: this.form.is_active,
      assigned_route_id: this.form.assigned_route_id
    };
    this.busService.addBus(newBus);
    this.isSubmitting = false;

    if (this.isModal) {
      this.closed.emit();
    } else {
      this.router.navigate(['/bus-management']);
    }
  }

  cancel(): void {
    if (this.isModal) {
      this.closed.emit();
    } else {
      this.router.navigate(['/bus-management']);
    }
  }

  goBack(): void {
    if (this.isModal) {
      this.closed.emit();
    } else {
      this.router.navigate(['/bus-management']);
    }
  }

  private generateBusId(): string {
    const next = (this.busService.buses.length + 1).toString().padStart(3, '0');
    return `BUS${next}`;
  }
}

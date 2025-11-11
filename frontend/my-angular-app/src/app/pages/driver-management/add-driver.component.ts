import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DriverService } from '../../core/services/driver.service';
import { Driver } from '../../core/models/driver.model';

interface AddDriverForm {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  license_number: string;
  license_expiry: string;
  experience_years: number | null;
  is_active: boolean;
  assigned_bus_id: string;
  hire_date: string;
}

interface ValidationErrors {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  license_number?: string | null;
  license_expiry?: string | null;
  experience_years?: string | null;
  assigned_bus_id?: string | null;
  hire_date?: string | null;
}

@Component({
  selector: 'app-add-driver',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-driver.component.html',
  styleUrls: ['./add-driver.component.scss']
})
export class AddDriverComponent {
  form: AddDriverForm = {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    license_number: '',
    license_expiry: '',
    experience_years: null,
    is_active: true,
    assigned_bus_id: '',
    hire_date: ''
  };

  isSubmitting = false;
  isFormSubmitted = false;
  validationErrors: ValidationErrors = {};

  constructor(private router: Router, private driverService: DriverService) {}

  // Validation methods
  private validateName(name: string, fieldLabel: string): string | null {
    if (!name || name.trim() === '') return `${fieldLabel} is required`;
    if (name.trim().length < 2) return `${fieldLabel} must be at least 2 characters`;
    const pattern = /^[A-Za-z\s'-]{2,50}$/;
    if (!pattern.test(name.trim())) return `${fieldLabel} can only contain letters, spaces, hyphens and apostrophes`;
    return null;
  }

  private validateEmail(email: string): string | null {
    if (!email || email.trim() === '') return 'Email is required';
    return this.isValidEmail(email) ? null : 'Invalid email format';
  }

  private validatePhone(phone: string): string | null {
    if (!phone || phone.trim() === '') return 'Phone is required';
    const pattern = /^[+]?\d[\d\s-]{6,14}\d$/; // 8-16 digits incl. separators
    if (!pattern.test(phone.trim())) return 'Invalid phone number';
    return null;
  }

  private validateLicenseNumber(license: string): string | null {
    if (!license || license.trim() === '') return 'License Number is required';
    const pattern = /^[A-Z0-9]{6,15}$/i;
    if (!pattern.test(license.trim())) return 'License Number must be 6-15 letters/numbers';
    return null;
  }

  private validateLicenseExpiry(dateStr: string): string | null {
    if (!dateStr) return 'License Expiry is required';
    const today = new Date();
    const d = new Date(dateStr);
    // must be strictly in the future
    if (isNaN(d.getTime())) return 'Invalid date';
    if (d <= new Date(today.getFullYear(), today.getMonth(), today.getDate())) return 'License expiry must be in the future';
    return null;
  }

  private validateExperience(exp: number | null): string | null {
    if (exp === null || exp === undefined) return 'Experience is required';
    if (!Number.isInteger(exp) || exp < 0) return 'Experience must be a non-negative integer';
    if (exp > 50) return 'Experience cannot exceed 50 years';
    return null;
  }

  private validateAssignedBusId(busId: string): string | null {
    if (!busId) return null; // optional
    const pattern = /^BUS\d{3,}$/i;
    if (!pattern.test(busId.trim())) return 'Assigned Bus ID must look like BUS001';
    return null;
  }

  private validateHireDate(dateStr: string): string | null {
    if (!dateStr) return 'Hire Date is required';
    const today = new Date();
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Invalid date';
    // cannot be in the future
    if (d > new Date(today.getFullYear(), today.getMonth(), today.getDate())) return 'Hire Date cannot be in the future';
    return null;
  }

  // Real-time handlers
  onFirstNameChange(): void { this.validationErrors.first_name = this.validateName(this.form.first_name, 'First Name'); }
  onLastNameChange(): void { this.validationErrors.last_name = this.validateName(this.form.last_name, 'Last Name'); }
  onEmailChange(): void { this.validationErrors.email = this.validateEmail(this.form.email); }
  onPhoneChange(): void { this.validationErrors.phone = this.validatePhone(this.form.phone); }
  onLicenseNumberChange(): void { this.validationErrors.license_number = this.validateLicenseNumber(this.form.license_number); }
  onLicenseExpiryChange(): void { this.validationErrors.license_expiry = this.validateLicenseExpiry(this.form.license_expiry); }
  onExperienceChange(): void { this.validationErrors.experience_years = this.validateExperience(this.form.experience_years); }
  onAssignedBusIdChange(): void { this.validationErrors.assigned_bus_id = this.validateAssignedBusId(this.form.assigned_bus_id); }
  onHireDateChange(): void { this.validationErrors.hire_date = this.validateHireDate(this.form.hire_date); }

  isFormValid(): boolean {
    return !this.validateName(this.form.first_name, 'First Name') &&
           !this.validateName(this.form.last_name, 'Last Name') &&
           !this.validateEmail(this.form.email) &&
           !this.validatePhone(this.form.phone) &&
           !this.validateLicenseNumber(this.form.license_number) &&
           !this.validateLicenseExpiry(this.form.license_expiry) &&
           !this.validateExperience(this.form.experience_years) &&
           !this.validateAssignedBusId(this.form.assigned_bus_id) &&
           !this.validateHireDate(this.form.hire_date);
  }

  save(): void {
    this.isFormSubmitted = true;

    // validate all
    this.validationErrors = {
      first_name: this.validateName(this.form.first_name, 'First Name'),
      last_name: this.validateName(this.form.last_name, 'Last Name'),
      email: this.validateEmail(this.form.email),
      phone: this.validatePhone(this.form.phone),
      license_number: this.validateLicenseNumber(this.form.license_number),
      license_expiry: this.validateLicenseExpiry(this.form.license_expiry),
      experience_years: this.validateExperience(this.form.experience_years),
      assigned_bus_id: this.validateAssignedBusId(this.form.assigned_bus_id),
      hire_date: this.validateHireDate(this.form.hire_date)
    };

    if (!this.isFormValid()) {
      return;
    }

    this.isSubmitting = true;
    const newDriver: Driver = {
      driver_id: this.generateDriverId(),
      first_name: this.form.first_name.trim(),
      last_name: this.form.last_name.trim(),
      email: this.form.email.trim(),
      phone: this.form.phone.trim(),
      license_number: this.form.license_number.trim().toUpperCase(),
      license_expiry: this.form.license_expiry,
      experience_years: this.form.experience_years as number,
      is_active: this.form.is_active,
      assigned_bus_id: this.form.assigned_bus_id.trim(),
      hire_date: this.form.hire_date
    };
    this.driverService.addDriver(newDriver);
    this.isSubmitting = false;
    this.router.navigate(['/driver-management']);
  }

  cancel(): void {
    this.router.navigate(['/driver-management']);
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private generateDriverId(): string {
    const next = (this.driverService.drivers.length + 1).toString().padStart(3, '0');
    return `DRV${next}`;
  }

  goBack(): void {
    this.router.navigate(['/driver-management']);
  }
}



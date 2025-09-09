
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DriverService } from '../../core/services/driver.service';
import { Driver } from '../../core/models/driver.model';

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
  selector: 'app-edit-driver',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-driver.component.html',
  styleUrls: ['./edit-driver.component.scss']
})
export class EditDriverComponent implements OnInit {
  driver: Driver | undefined;
  isSubmitting = false;
  isFormSubmitted = false;
  validationErrors: ValidationErrors = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private driverService: DriverService
  ) {}

  ngOnInit(): void {
    const driverId = this.route.snapshot.paramMap.get('id');
    if (driverId) {
      this.driver = this.driverService.getById(driverId);
      if (!this.driver) {
        this.router.navigate(['/driver-management']);
      }
    }
  }

  // Validation logic (mirrors add-driver)
  private validateName(name: string, fieldLabel: string): string | null {
    if (!name || name.trim() === '') return `${fieldLabel} is required`;
    if (name.trim().length < 2) return `${fieldLabel} must be at least 2 characters`;
    const pattern = /^[A-Za-z\s'-]{2,50}$/;
    if (!pattern.test(name.trim())) return `${fieldLabel} can only contain letters, spaces, hyphens and apostrophes`;
    return null;
  }

  private validateEmail(email: string): string | null {
    if (!email || email.trim() === '') return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) ? null : 'Invalid email format';
  }

  private validatePhone(phone: string): string | null {
    if (!phone || phone.trim() === '') return 'Phone is required';
    const pattern = /^[+]?\d[\d\s-]{6,14}\d$/;
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
    if (!busId) return null;
    const pattern = /^BUS\d{3,}$/i;
    if (!pattern.test(busId.trim())) return 'Assigned Bus ID must look like BUS001';
    return null;
  }

  private validateHireDate(dateStr: string): string | null {
    if (!dateStr) return 'Hire Date is required';
    const today = new Date();
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Invalid date';
    if (d > new Date(today.getFullYear(), today.getMonth(), today.getDate())) return 'Hire Date cannot be in the future';
    return null;
  }

  // Real-time handlers
  onFirstNameChange(): void { if (this.driver) this.validationErrors.first_name = this.validateName(this.driver.first_name, 'First Name'); }
  onLastNameChange(): void { if (this.driver) this.validationErrors.last_name = this.validateName(this.driver.last_name, 'Last Name'); }
  onEmailChange(): void { if (this.driver) this.validationErrors.email = this.validateEmail(this.driver.email); }
  onPhoneChange(): void { if (this.driver) this.validationErrors.phone = this.validatePhone(this.driver.phone); }
  onLicenseNumberChange(): void { if (this.driver) this.validationErrors.license_number = this.validateLicenseNumber(this.driver.license_number); }
  onLicenseExpiryChange(): void { if (this.driver) this.validationErrors.license_expiry = this.validateLicenseExpiry(this.driver.license_expiry); }
  onExperienceChange(): void { if (this.driver) this.validationErrors.experience_years = this.validateExperience(this.driver.experience_years); }
  onAssignedBusIdChange(): void { if (this.driver) this.validationErrors.assigned_bus_id = this.validateAssignedBusId(this.driver.assigned_bus_id); }
  onHireDateChange(): void { if (this.driver) this.validationErrors.hire_date = this.validateHireDate(this.driver.hire_date); }

  isFormValid(): boolean {
    if (!this.driver) return false;
    return !this.validateName(this.driver.first_name, 'First Name') &&
           !this.validateName(this.driver.last_name, 'Last Name') &&
           !this.validateEmail(this.driver.email) &&
           !this.validatePhone(this.driver.phone) &&
           !this.validateLicenseNumber(this.driver.license_number) &&
           !this.validateLicenseExpiry(this.driver.license_expiry) &&
           !this.validateExperience(this.driver.experience_years) &&
           !this.validateAssignedBusId(this.driver.assigned_bus_id) &&
           !this.validateHireDate(this.driver.hire_date);
  }

  save(): void {
    if (!this.driver) return;

    this.isFormSubmitted = true;
    this.validationErrors = {
      first_name: this.validateName(this.driver.first_name, 'First Name'),
      last_name: this.validateName(this.driver.last_name, 'Last Name'),
      email: this.validateEmail(this.driver.email),
      phone: this.validatePhone(this.driver.phone),
      license_number: this.validateLicenseNumber(this.driver.license_number),
      license_expiry: this.validateLicenseExpiry(this.driver.license_expiry),
      experience_years: this.validateExperience(this.driver.experience_years),
      assigned_bus_id: this.validateAssignedBusId(this.driver.assigned_bus_id),
      hire_date: this.validateHireDate(this.driver.hire_date)
    };

    if (!this.isFormValid()) return;

    this.isSubmitting = true;
    this.driver.license_number = this.driver.license_number.trim().toUpperCase();
    this.driverService.updateDriver(this.driver);
    this.isSubmitting = false;
    this.router.navigate(['/driver-management']);
  }

  cancel(): void {
    this.router.navigate(['/driver-management']);
  }

  goBack(): void {
    this.router.navigate(['/driver-management']);
  }
}


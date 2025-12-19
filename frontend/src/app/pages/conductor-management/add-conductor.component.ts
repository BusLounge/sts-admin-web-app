import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ConductorService } from '../../core/services/conductor.service';
import { Conductor } from '../../core/models/conductor.model';

interface AddConductorForm {
  full_name: string;
  nic: string;
  phone_number: string;
  experience_years: number | null;
  status: 'Active' | 'On Leave' | 'Resigned';
  assigned_bus_id: string;
  hired_date: string;
}

interface ValidationErrors {
  full_name?: string | null;
  nic?: string | null;
  phone_number?: string | null;
  experience_years?: string | null;
  assigned_bus_id?: string | null;
  hired_date?: string | null;
}

@Component({
  selector: 'app-add-conductor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-conductor.component.html',
  styleUrls: ['./add-conductor.component.scss']
})
export class AddConductorComponent {
  form: AddConductorForm = {
    full_name: '',
    nic: '',
    phone_number: '',
    experience_years: null,
    status: 'Active',
    assigned_bus_id: '',
    hired_date: ''
  };

  isSubmitting = false;
  isFormSubmitted = false;
  validationErrors: ValidationErrors = {};

  constructor(private router: Router, private conductorService: ConductorService) {}

  // Validation methods
  private validateFullName(name: string): string | null {
    if (!name || name.trim() === '') return 'Full Name is required';
    if (name.trim().length < 2) return 'Full Name must be at least 2 characters';
    const pattern = /^[A-Za-z\s'-]{2,100}$/;
    if (!pattern.test(name.trim())) return 'Full Name can only contain letters, spaces, hyphens and apostrophes';
    return null;
  }

  private validateNIC(nic: string): string | null {
    if (!nic || nic.trim() === '') return 'NIC is required';
    const pattern = /^\d{9}[Vv]|\d{12}$/; // 9 digits + V or 12 digits
    if (!pattern.test(nic.trim())) return 'NIC must be 9 digits + V or 12 digits';
    return null;
  }

  private validatePhoneNumber(phone: string): string | null {
    if (!phone || phone.trim() === '') return 'Phone Number is required';
    const pattern = /^\d{10}$/; // Exactly 10 digits
    if (!pattern.test(phone.trim())) return 'Phone Number must be exactly 10 digits';
    return null;
  }

  private validateExperience(exp: number | null): string | null {
    if (exp === null || exp === undefined) return 'Experience is required';
    if (!Number.isInteger(exp) || exp < 0) return 'Experience must be a non-negative integer';
    if (exp > 50) return 'Experience cannot exceed 50 years';
    return null;
  }

  private validateAssignedBusId(busId: string): string | null {
    if (!busId) return null; // Optional field
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
  onFullNameChange(): void { this.validationErrors.full_name = this.validateFullName(this.form.full_name); }
  onNICChange(): void { this.validationErrors.nic = this.validateNIC(this.form.nic); }
  onPhoneNumberChange(): void { this.validationErrors.phone_number = this.validatePhoneNumber(this.form.phone_number); }
  onExperienceChange(): void { this.validationErrors.experience_years = this.validateExperience(this.form.experience_years); }
  onAssignedBusIdChange(): void { this.validationErrors.assigned_bus_id = this.validateAssignedBusId(this.form.assigned_bus_id); }
  onHireDateChange(): void { this.validationErrors.hired_date = this.validateHireDate(this.form.hired_date); }

  isFormValid(): boolean {
    return !this.validateFullName(this.form.full_name) &&
           !this.validateNIC(this.form.nic) &&
           !this.validatePhoneNumber(this.form.phone_number) &&
           !this.validateExperience(this.form.experience_years) &&
           !this.validateAssignedBusId(this.form.assigned_bus_id) &&
           !this.validateHireDate(this.form.hired_date);
  }

  save(): void {
    this.isFormSubmitted = true;

    // Validate all fields
    this.validationErrors = {
      full_name: this.validateFullName(this.form.full_name),
      nic: this.validateNIC(this.form.nic),
      phone_number: this.validatePhoneNumber(this.form.phone_number),
      experience_years: this.validateExperience(this.form.experience_years),
      assigned_bus_id: this.validateAssignedBusId(this.form.assigned_bus_id),
      hired_date: this.validateHireDate(this.form.hired_date)
    };

    if (!this.isFormValid()) {
      return;
    }

    this.isSubmitting = true;
    const newConductor: Conductor = {
      conductor_id: this.generateConductorId(),
      full_name: this.form.full_name.trim(),
      nic: this.form.nic.trim().toUpperCase(),
      phone_number: this.form.phone_number.trim(),
      experience_years: this.form.experience_years as number,
      status: this.form.status,
      assigned_bus_id: this.form.assigned_bus_id.trim(),
      hired_date: this.form.hired_date
    };

    this.conductorService.addConductor(newConductor);
    this.isSubmitting = false;
    this.router.navigate(['/conductor-management']);
  }

  cancel(): void {
    this.router.navigate(['/conductor-management']);
  }

  private generateConductorId(): string {
    const next = (this.conductorService.conductors.length + 1).toString().padStart(3, '0');
    return `CON${next}`;
  }

  goBack(): void {
    this.router.navigate(['/conductor-management']);
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConductorService } from '../../core/services/conductor.service';
import { Conductor } from '../../core/models/conductor.model';

interface ValidationErrors {
  full_name?: string | null;
  nic?: string | null;
  phone_number?: string | null;
  experience_years?: string | null;
  assigned_bus_id?: string | null;
  hired_date?: string | null;
}

@Component({
  selector: 'app-edit-conductor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-conductor.component.html',
  styleUrls: ['./edit-conductor.component.scss']
})
export class EditConductorComponent implements OnInit {
  conductor: Conductor | undefined;
  isSubmitting = false;
  isFormSubmitted = false;
  validationErrors: ValidationErrors = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private conductorService: ConductorService
  ) {}

  ngOnInit(): void {
    const conductorId = this.route.snapshot.paramMap.get('id');
    if (conductorId) {
      this.conductor = this.conductorService.getById(conductorId);
      if (!this.conductor) {
        this.router.navigate(['/conductor-management']);
      }
    }
  }

  // Validation methods (same as add-conductor)
  private validateFullName(name: string): string | null {
    if (!name || name.trim() === '') return 'Full Name is required';
    if (name.trim().length < 2) return 'Full Name must be at least 2 characters';
    const pattern = /^[A-Za-z\s'-]{2,100}$/;
    if (!pattern.test(name.trim())) return 'Full Name can only contain letters, spaces, hyphens and apostrophes';
    return null;
  }

  private validateNIC(nic: string): string | null {
    if (!nic || nic.trim() === '') return 'NIC is required';
    const pattern = /^\d{9}[Vv]|\d{12}$/;
    if (!pattern.test(nic.trim())) return 'NIC must be 9 digits + V or 12 digits';
    return null;
  }

  private validatePhoneNumber(phone: string): string | null {
    if (!phone || phone.trim() === '') return 'Phone Number is required';
    const pattern = /^\d{10}$/;
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
  onFullNameChange(): void { if (this.conductor) this.validationErrors.full_name = this.validateFullName(this.conductor.full_name); }
  onNICChange(): void { if (this.conductor) this.validationErrors.nic = this.validateNIC(this.conductor.nic); }
  onPhoneNumberChange(): void { if (this.conductor) this.validationErrors.phone_number = this.validatePhoneNumber(this.conductor.phone_number); }
  onExperienceChange(): void { if (this.conductor) this.validationErrors.experience_years = this.validateExperience(this.conductor.experience_years); }
  onAssignedBusIdChange(): void { if (this.conductor) this.validationErrors.assigned_bus_id = this.validateAssignedBusId(this.conductor.assigned_bus_id); }
  onHireDateChange(): void { if (this.conductor) this.validationErrors.hired_date = this.validateHireDate(this.conductor.hired_date); }

  isFormValid(): boolean {
    if (!this.conductor) return false;
    return !this.validateFullName(this.conductor.full_name) &&
           !this.validateNIC(this.conductor.nic) &&
           !this.validatePhoneNumber(this.conductor.phone_number) &&
           !this.validateExperience(this.conductor.experience_years) &&
           !this.validateAssignedBusId(this.conductor.assigned_bus_id) &&
           !this.validateHireDate(this.conductor.hired_date);
  }

  save(): void {
    if (!this.conductor) return;

    this.isFormSubmitted = true;
    this.validationErrors = {
      full_name: this.validateFullName(this.conductor.full_name),
      nic: this.validateNIC(this.conductor.nic),
      phone_number: this.validatePhoneNumber(this.conductor.phone_number),
      experience_years: this.validateExperience(this.conductor.experience_years),
      assigned_bus_id: this.validateAssignedBusId(this.conductor.assigned_bus_id),
      hired_date: this.validateHireDate(this.conductor.hired_date)
    };

    if (!this.isFormValid()) return;

    this.isSubmitting = true;
    this.conductor.nic = this.conductor.nic.trim().toUpperCase();
    this.conductorService.updateConductor(this.conductor);
    this.isSubmitting = false;
    this.router.navigate(['/conductor-management']);
  }

  cancel(): void {
    this.router.navigate(['/conductor-management']);
  }

  goBack(): void {
    this.router.navigate(['/conductor-management']);
  }
}

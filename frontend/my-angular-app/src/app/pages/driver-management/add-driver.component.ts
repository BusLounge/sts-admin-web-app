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

  constructor(private router: Router, private driverService: DriverService) {}

  save(): void {
    if (!this.form.first_name || !this.form.last_name || !this.form.email || 
        !this.form.phone || !this.form.license_number || !this.form.license_expiry || 
        !this.form.experience_years || !this.form.hire_date) {
      alert('Please fill all required fields.');
      return;
    }

    if (!this.isValidEmail(this.form.email)) {
      alert('Please enter a valid email address.');
      return;
    }

    this.isSubmitting = true;
    const newDriver: Driver = {
      driver_id: this.generateDriverId(),
      first_name: this.form.first_name,
      last_name: this.form.last_name,
      email: this.form.email,
      phone: this.form.phone,
      license_number: this.form.license_number,
      license_expiry: this.form.license_expiry,
      experience_years: this.form.experience_years as number,
      is_active: this.form.is_active,
      assigned_bus_id: this.form.assigned_bus_id,
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
}




import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DriverService } from '../../core/services/driver.service';
import { Driver } from '../../core/models/driver.model';

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

  save(): void {
    if (this.driver) {
      this.isSubmitting = true;
      this.driverService.updateDriver(this.driver);
      this.isSubmitting = false;
      this.router.navigate(['/driver-management']);
    }
  }

  cancel(): void {
    this.router.navigate(['/driver-management']);
  }
}


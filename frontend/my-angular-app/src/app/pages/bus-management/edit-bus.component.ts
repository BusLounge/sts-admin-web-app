

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BusService } from '../../core/services/bus.service';
import { Bus } from '../../core/models/bus.model';

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

  save(): void {
    if (!this.bus) return;
    this.isSubmitting = true;
    this.busService.updateBus(this.bus);
    this.isSubmitting = false;
    this.router.navigate(['/bus-management']);
  }

  cancel(): void {
    this.router.navigate(['/bus-management']);
  }
}

import { Component } from '@angular/core';
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

@Component({
  selector: 'app-add-bus',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-bus.component.html',
  styleUrls: ['./add-bus.component.scss']
})
export class AddBusComponent {
  form: AddBusForm = {
    bus_number: '',
    capacity: null,
    type: 'AC',
    is_active: true,
    assigned_route_id: ''
  };

  isSubmitting = false;

  constructor(private router: Router, private busService: BusService) {}

  save(): void {
    if (!this.form.bus_number || !this.form.capacity || !this.form.assigned_route_id) {
      alert('Please fill all required fields.');
      return;
    }
    this.isSubmitting = true;
    const newBus: Bus = {
      bus_id: this.generateBusId(),
      bus_number: this.form.bus_number,
      capacity: this.form.capacity as number,
      type: this.form.type,
      is_active: this.form.is_active,
      assigned_route_id: this.form.assigned_route_id
    };
    this.busService.addBus(newBus);
    this.isSubmitting = false;
    this.router.navigate(['/bus-management']);
  }

  cancel(): void {
    this.router.navigate(['/bus-management']);
  }

  private generateBusId(): string {
    const next = (this.busService.buses.length + 1).toString().padStart(3, '0');
    return `BUS${next}`;
  }
}

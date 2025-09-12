import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Lounge } from '../../core/models/lounge.model';
import { LoungeService } from '../../core/services/lounge.service';

@Component({
  selector: 'app-add-lounge',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-lounge.component.html',
  styleUrls: ['./add-lounge.component.scss']
})
export class AddLoungeComponent implements OnInit {
  lounge: Lounge = {
    lounge_id: '0',
    owner: '',
    name: '',
    address: '',
    phone: '',
    capacity: 0,
    price_per_hour: 0,
    operating_hours: '',
    amenities: [],
    services: [],
    created_at: new Date().toISOString()
  };

  selectedAmenities: string[] = [];
  selectedServices: string[] = [];

  availableAmenities: string[] = ['WiFi', 'AC', 'TV', 'Charging Ports', 'Quiet Zone'];
  availableServices: string[] = ['Food', 'Drinks', 'Shower'];

  constructor(private router: Router, private loungeService: LoungeService) {}

  ngOnInit(): void {}

  save(): void {
    this.lounge.amenities = this.selectedAmenities;
    this.lounge.services = this.selectedServices;
    this.loungeService.add(this.lounge);
    this.router.navigate(['/lounges-management']);
  }

  cancel(): void {
    this.router.navigate(['/lounges-management']);
  }
}

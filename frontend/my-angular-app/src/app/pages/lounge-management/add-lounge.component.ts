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
    images: [],
    created_at: new Date().toISOString()
  };

  selectedAmenities: string[] = [];
  selectedServices: string[] = [];

  availableAmenities: string[] = ['WiFi', 'AC', 'TV', 'Charging Ports', 'Quiet Zone'];
  availableServices: string[] = ['Food', 'Drinks', 'Shower'];

  imagePreviews: string[] = [];

  constructor(private router: Router, private loungeService: LoungeService) {}

  ngOnInit(): void {}

  save(): void {
    this.lounge.amenities = this.selectedAmenities;
    this.lounge.services = this.selectedServices;
    this.lounge.images = this.imagePreviews;
    this.loungeService.add(this.lounge);
    this.router.navigate(['/lounges-management']);
  }

  cancel(): void {
    this.router.navigate(['/lounges-management']);
  }

  toggleAmenity(amenity: string) {
    const index = this.selectedAmenities.indexOf(amenity);
    if (index > -1) {
      this.selectedAmenities.splice(index, 1);
    } else {
      this.selectedAmenities.push(amenity);
    }
  }

  toggleService(service: string) {
    const index = this.selectedServices.indexOf(service);
    if (index > -1) {
      this.selectedServices.splice(index, 1);
    } else {
      this.selectedServices.push(service);
    }
  }

  // Keep selected files for potential upload via FormData
  private selectedFiles: File[] = [];

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) return;

    // Append to existing selections to allow multiple picks across interactions
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue; // skip non-images
      this.selectedFiles.push(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = (e.target as FileReader).result as string;
        this.imagePreviews.push(result);
      };
      reader.readAsDataURL(file); // create base64 preview
    }

    // Clear the input to allow re-selecting the same files if needed
    input.value = '';
  }
}

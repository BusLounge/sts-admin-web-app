import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { Lounge } from '../../core/models/lounge.model';
import { LoungeService } from '../../core/services/lounge.service';

@Component({
  selector: 'app-edit-lounge',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './edit-lounge.component.html',
  styleUrls: ['./edit-lounge.component.scss']
})
export class EditLoungeComponent implements OnInit {
  lounge?: Lounge;
  amenitiesText = '';
  servicesText = '';
  sidebarOpen = true;
  currentPage = 'lounges';

  constructor(private route: ActivatedRoute, private router: Router, private loungeService: LoungeService) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') || '';
    const found = this.loungeService.getById(id);
    if (!found) { this.router.navigate(['/lounges-management']); return; }
    this.lounge = { ...found };
    this.amenitiesText = this.lounge.amenities.join(', ');
    this.servicesText = this.lounge.services.join(', ');
  }

  save(): void {
    if (!this.lounge) return;
    this.lounge.amenities = this.amenitiesText.split(',').map(x => x.trim()).filter(Boolean);
    this.lounge.services = this.servicesText.split(',').map(x => x.trim()).filter(Boolean);
    this.loungeService.update(this.lounge);
    this.router.navigate(['/lounges-management']);
  }

  cancel(): void { this.router.navigate(['/lounges-management']); }

  navigateTo(page: string): void {
    switch (page) {
      case 'dashboard': this.router.navigate(['/dashboard']); break;
      case 'bus-management': this.router.navigate(['/bus-management']); break;
      case 'driver-management': this.router.navigate(['/driver-management']); break;
      case 'passengers': this.router.navigate(['/passenger-management']); break;
      case 'lounges': this.router.navigate(['/lounges-management']); break;
      case 'lounge-booking': this.router.navigate(['/lounges-management']); break;
      case 'bus-booking': this.router.navigate(['/bus-management']); break;
      default: this.router.navigate(['/dashboard']);
    }
  }
}



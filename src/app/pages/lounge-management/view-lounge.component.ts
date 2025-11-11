import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Lounge } from '../../core/models/lounge.model';
import { LoungeService } from '../../core/services/lounge.service';

@Component({
  selector: 'app-view-lounge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './view-lounge.component.html',
  styleUrls: ['./view-lounge.component.scss']
})
export class ViewLoungeComponent implements OnInit {
  lounge?: Lounge;



  constructor(private route: ActivatedRoute, private router: Router, private loungeService: LoungeService) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') || '';
    const found = this.loungeService.getById(id);
    if (!found) {
      this.router.navigate(['/lounges-management']);
      return;
    }
    this.lounge = found;
  }

  back(): void {
    this.router.navigate(['/lounges-management']);
  }

  // Lightbox state
  isLightboxOpen = false;
  lightboxImage: string | null = null;

  // Open lightbox with clicked image
  openLightbox(img: string): void {
    this.lightboxImage = img;
    this.isLightboxOpen = true;
  }

  // Close lightbox
  closeLightbox(): void {
    this.isLightboxOpen = false;
    this.lightboxImage = null;
  }
}

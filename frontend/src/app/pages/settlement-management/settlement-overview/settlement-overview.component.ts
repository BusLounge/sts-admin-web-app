import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettlementService } from '../../../core/services/settlement.service';

@Component({
  selector: 'app-settlement-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settlement-overview.component.html',
  styleUrls: ['./settlement-overview.component.scss']
})
export class SettlementOverviewComponent implements OnInit {
  overview: any = null;

  constructor(private settlementService: SettlementService) {}

  ngOnInit(): void {
    this.loadOverview();
  }

  loadOverview() {
    this.settlementService.getOverview().subscribe({
      next: (data) => {
        this.overview = data;
      },
      error: (error) => {
        console.error('Error loading overview', error);
      }
    });
  }

  processNow() {
    this.settlementService.processNow().subscribe({
      next: (res) => {
        alert('Process triggered successfully!');
      },
      error: (err) => {
        console.error('Error triggering process', err);
        alert('Error triggering process');
      }
    });
  }
}

import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

// PrimeNG imports
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';

// Shared components
import { SeatSelectorComponent } from '../../shared/components/seat-selector/seat-selector.component';
import { BusLayoutPreviewComponent } from '../../shared/components/bus-layout-preview/bus-layout-preview.component';

interface SeatLayoutTemplate {
  id: string;
  template_name: string;
  total_rows: number;
  total_seats: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

@Component({
  selector: 'app-seat-layouts',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    ToastModule,
    ConfirmDialogModule,
    SeatSelectorComponent,
    BusLayoutPreviewComponent
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './seat-layouts.component.html',
  styleUrls: ['./seat-layouts.component.scss']
})
export class SeatLayoutsComponent implements OnInit {
  templates = signal<SeatLayoutTemplate[]>([]);
  loading = signal<boolean>(false);
  displayDialog = signal<boolean>(false);
  displayPreviewDialog = signal<boolean>(false);

  selectedTemplate: SeatLayoutTemplate | null = null;
  previewTemplate: any = null;

  // Form fields
  templateName: string = '';
  description: string = '';
  totalRows: number = 5;
  seatMap: boolean[][] = [];

  constructor(
    private http: HttpClient,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.loadTemplates();
  }

  loadTemplates() {
    this.loading.set(true);

    this.http.get<{ templates: SeatLayoutTemplate[], count: number }>(
      `${environment.apiUrl}/admin/seat-layouts`
    ).subscribe({
      next: (response) => {
        this.templates.set(response.templates);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load templates:', error);
        const errorMessage = error.status === 401
          ? 'Session expired. Please log in again.'
          : error.error?.error || 'Failed to load seat layout templates';
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage
        });
        this.loading.set(false);
      }
    });
  }

  openCreateDialog() {
    this.templateName = '';
    this.description = '';
    this.totalRows = 5;
    this.seatMap = [];
    this.displayDialog.set(true);
  }

  onSeatMapChange(seatMap: boolean[][]) {
    this.seatMap = seatMap;
  }

  saveTemplate() {
    if (!this.templateName || this.seatMap.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please provide template name and configure seats'
      });
      return;
    }

    const requestBody = {
      template_name: this.templateName,
      total_rows: this.totalRows,
      description: this.description || null,
      seat_map: this.seatMap
    };

    this.http.post(
      `${environment.apiUrl}/admin/seat-layouts`,
      requestBody
    ).subscribe({
      next: (response: any) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Seat layout template created successfully'
        });
        this.displayDialog.set(false);
        this.loadTemplates();
      },
      error: (error) => {
        console.error('Failed to create template:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.error || 'Failed to create template'
        });
      }
    });
  }

  viewTemplate(template: SeatLayoutTemplate) {
    this.http.get(
      `${environment.apiUrl}/admin/seat-layouts/${template.id}`
    ).subscribe({
      next: (response: any) => {
        this.previewTemplate = response;
        this.displayPreviewDialog.set(true);
      },
      error: (error) => {
        console.error('Failed to load template details:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load template details'
        });
      }
    });
  }

  deleteTemplate(template: SeatLayoutTemplate) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${template.template_name}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.http.delete(
          `${environment.apiUrl}/admin/seat-layouts/${template.id}`
        ).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Template deleted successfully'
            });
            this.loadTemplates();
          },
          error: (error) => {
            console.error('Failed to delete template:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to delete template'
            });
          }
        });
      }
    });
  }
}

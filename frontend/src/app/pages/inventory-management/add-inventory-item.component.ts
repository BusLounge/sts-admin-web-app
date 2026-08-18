import { Component, OnInit, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InventoryService } from '../../core/services/inventory.service';
import { InventoryItem, InventoryCategory } from '../../core/models/inventory.model';

@Component({
  selector: 'app-add-inventory-item',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-inventory-item.component.html',
  styleUrls: ['./add-inventory-item.component.scss']
})
export class AddInventoryItemComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  item: InventoryItem = {
    item_code: '',
    name: '',
    description: '',
    category_id: '',
    unit: 'Bottle',
    image_url: '',
    is_active: true
  };
  
  categories: InventoryCategory[] = [];
  selectedImageFile: File | null = null;
  imagePreviewUrl: string | ArrayBuffer | null = null;
  isSubmitting = false;

  constructor(
    private inventoryService: InventoryService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.inventoryService.categories$.subscribe(categories => {
      this.categories = categories;
      this.cdr.detectChanges();
    });
  }

  onImageSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.selectedImageFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreviewUrl = reader.result;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  async saveItem() {
    if (!this.item.item_code || !this.item.name || !this.item.category_id || !this.item.unit) {
      alert('Please fill in all required fields.');
      return;
    }
    if (!this.selectedImageFile) {
      alert('Please select an image.');
      return;
    }

    this.isSubmitting = true;
    this.cdr.detectChanges();

    try {
      // Step 1: Upload image
      const uploadRes = await new Promise<any>((resolve, reject) => {
        this.inventoryService.uploadImage(this.selectedImageFile!).subscribe({
          next: (res) => resolve(res),
          error: (err) => reject(err)
        });
      });

      this.item.image_url = uploadRes.image_url;

      // Step 2: Create item
      this.inventoryService.add(this.item).subscribe({
        next: () => {
          alert('Item created successfully!');
          this.close.emit();
        },
        error: (err) => {
          console.error(err);
          this.isSubmitting = false;
          this.cdr.detectChanges();
          if (err.status === 409) {
            alert('An item with this Item Code already exists.');
          } else {
            alert('Failed to create item. ' + (err.error?.error || ''));
          }
        }
      });
    } catch (err) {
      console.error('Image upload failed', err);
      alert('Failed to upload image. Please try again.');
      this.isSubmitting = false;
      this.cdr.detectChanges();
    }
  }

  cancel() {
    this.close.emit();
  }
}

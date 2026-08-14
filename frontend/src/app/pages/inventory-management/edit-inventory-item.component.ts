import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InventoryService } from '../../core/services/inventory.service';
import { InventoryItem, InventoryCategory } from '../../core/models/inventory.model';

@Component({
  selector: 'app-edit-inventory-item',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-inventory-item.component.html',
  styleUrls: ['./edit-inventory-item.component.scss'] // Reusing the same SCSS as add
})
export class EditInventoryItemComponent implements OnInit {
  item: InventoryItem | null = null;
  categories: InventoryCategory[] = [];
  selectedImageFile: File | null = null;
  imagePreviewUrl: string | ArrayBuffer | null = null;
  isSubmitting = false;

  constructor(
    private inventoryService: InventoryService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.inventoryService.categories$.subscribe(categories => {
      this.categories = categories;
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.inventoryService.getById(id).subscribe({
        next: (res) => {
          this.item = res;
          this.imagePreviewUrl = this.item.image_url;
        },
        error: (err) => {
          console.error(err);
          alert('Failed to load item.');
          this.router.navigate(['/inventory-management']);
        }
      });
    }
  }

  onImageSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.selectedImageFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreviewUrl = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  async saveItem() {
    if (!this.item) return;
    
    if (!this.item.name || !this.item.category_id || !this.item.unit) {
      alert('Please fill in all required fields.');
      return;
    }

    this.isSubmitting = true;

    try {
      if (this.selectedImageFile) {
        // Upload new image
        const uploadRes = await new Promise<any>((resolve, reject) => {
          this.inventoryService.uploadImage(this.selectedImageFile!).subscribe({
            next: (res) => resolve(res),
            error: (err) => reject(err)
          });
        });
        this.item.image_url = uploadRes.image_url;
      }

      // Update item
      this.inventoryService.update(this.item.id!, this.item).subscribe({
        next: () => {
          alert('Item updated successfully!');
          this.router.navigate(['/inventory-management']);
        },
        error: (err) => {
          console.error(err);
          this.isSubmitting = false;
          alert('Failed to update item. ' + (err.error?.error || ''));
        }
      });
    } catch (err) {
      console.error('Image upload failed', err);
      alert('Failed to upload image. Please try again.');
      this.isSubmitting = false;
    }
  }

  cancel() {
    this.router.navigate(['/inventory-management']);
  }
}

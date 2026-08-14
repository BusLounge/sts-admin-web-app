export interface InventoryItem {
  id?: string;
  item_code: string;
  name: string;
  description?: string;
  category_id: string;
  category_name?: string;
  unit: string;
  image_url: string;
  is_active?: boolean;
  created_by_admin_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryCategory {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
}

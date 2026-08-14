package models

import "time"

type InventoryItem struct {
	ID                 string    `json:"id"`
	ItemCode           string    `json:"item_code"`
	Name               string    `json:"name"`
	Description        *string   `json:"description,omitempty"`
	CategoryID         string    `json:"category_id"`
	CategoryName       string    `json:"category_name,omitempty"` // For joining in GET queries
	Unit               string    `json:"unit"`
	ImageURL           string    `json:"image_url"`
	IsActive           bool      `json:"is_active"`
	CreatedByAdminID   string    `json:"created_by_admin_id"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}

type LoungeMarketplaceCategory struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description *string   `json:"description,omitempty"`
	IsActive    bool      `json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`
}

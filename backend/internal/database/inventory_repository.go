package database

import (
	"database/sql"
	"fmt"
	"sts-backend/internal/models"
)

type InventoryRepository struct {
	db *sql.DB
}

func NewInventoryRepository(db *sql.DB) *InventoryRepository {
	return &InventoryRepository{db: db}
}

func (r *InventoryRepository) GetMasterItems() ([]models.InventoryItem, error) {
	query := `
		SELECT 
			i.id::text,
			i.item_code,
			i.name,
			i.description,
			i.category_id::text,
			c.name as category_name,
			i.unit,
			i.image_url,
			i.is_active,
			i.created_by_admin_id::text,
			i.created_at,
			i.updated_at
		FROM lounge_inventory_items i
		LEFT JOIN lounge_marketplace_categories c ON i.category_id = c.id
		ORDER BY i.created_at DESC
	`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("error querying master items: %v", err)
	}
	defer rows.Close()

	items := []models.InventoryItem{}
	for rows.Next() {
		var i models.InventoryItem
		var desc, imgURL, catID, catName, unit, createdBy sql.NullString
		err := rows.Scan(
			&i.ID,
			&i.ItemCode,
			&i.Name,
			&desc,
			&catID,
			&catName,
			&unit,
			&imgURL,
			&i.IsActive,
			&createdBy,
			&i.CreatedAt,
			&i.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("error scanning master item: %v", err)
		}
		if desc.Valid { i.Description = &desc.String }
		if imgURL.Valid { i.ImageURL = imgURL.String }
		if catID.Valid { i.CategoryID = catID.String }
		if catName.Valid { i.CategoryName = catName.String }
		if unit.Valid { i.Unit = unit.String }
		if createdBy.Valid { i.CreatedByAdminID = createdBy.String }
		
		items = append(items, i)
	}

	return items, nil
}

func (r *InventoryRepository) GetMasterItemByID(id string) (*models.InventoryItem, error) {
	query := `
		SELECT 
			i.id::text,
			i.item_code,
			i.name,
			i.description,
			i.category_id::text,
			c.name as category_name,
			i.unit,
			i.image_url,
			i.is_active,
			i.created_by_admin_id::text,
			i.created_at,
			i.updated_at
		FROM lounge_inventory_items i
		LEFT JOIN lounge_marketplace_categories c ON i.category_id = c.id
		WHERE i.id = $1
	`

	var i models.InventoryItem
	var desc, imgURL, catID, catName, unit, createdBy sql.NullString
	err := r.db.QueryRow(query, id).Scan(
		&i.ID,
		&i.ItemCode,
		&i.Name,
		&desc,
		&catID,
		&catName,
		&unit,
		&imgURL,
		&i.IsActive,
		&createdBy,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("error querying master item by ID: %v", err)
	}
	if desc.Valid { i.Description = &desc.String }
	if imgURL.Valid { i.ImageURL = imgURL.String }
	if catID.Valid { i.CategoryID = catID.String }
	if catName.Valid { i.CategoryName = catName.String }
	if unit.Valid { i.Unit = unit.String }
	if createdBy.Valid { i.CreatedByAdminID = createdBy.String }
	
	return &i, nil
}

func (r *InventoryRepository) CreateMasterItem(i models.InventoryItem) error {
	query := `
		INSERT INTO lounge_inventory_items (
			item_code, name, description, category_id, unit, image_url, is_active, created_by_admin_id
		) VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, true), $8)
		RETURNING id, created_at, updated_at
	`
	err := r.db.QueryRow(
		query,
		i.ItemCode, i.Name, i.Description, i.CategoryID, i.Unit, i.ImageURL, i.IsActive, i.CreatedByAdminID,
	).Scan(&i.ID, &i.CreatedAt, &i.UpdatedAt)

	if err != nil {
		return fmt.Errorf("error creating master item: %w", err)
	}
	return nil
}

func (r *InventoryRepository) UpdateMasterItem(i models.InventoryItem) error {
	query := `
		UPDATE lounge_inventory_items SET 
			name = $1, description = $2, category_id = $3, unit = $4, image_url = $5, updated_at = CURRENT_TIMESTAMP
		WHERE id = $6
	`
	_, err := r.db.Exec(query, i.Name, i.Description, i.CategoryID, i.Unit, i.ImageURL, i.ID)
	if err != nil {
		return fmt.Errorf("error updating master item: %v", err)
	}
	return nil
}

func (r *InventoryRepository) ToggleItemStatus(id string, isActive bool) error {
	query := `
		UPDATE lounge_inventory_items SET 
			is_active = $1, updated_at = CURRENT_TIMESTAMP
		WHERE id = $2
	`
	_, err := r.db.Exec(query, isActive, id)
	if err != nil {
		return fmt.Errorf("error updating master item status: %v", err)
	}
	return nil
}

func (r *InventoryRepository) GetCategories() ([]models.LoungeMarketplaceCategory, error) {
	query := `
		SELECT id::text, name, description, is_active, created_at 
		FROM lounge_marketplace_categories
		WHERE is_active = true
		ORDER BY name ASC
	`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("error querying categories: %v", err)
	}
	defer rows.Close()

	categories := []models.LoungeMarketplaceCategory{}
	for rows.Next() {
		var c models.LoungeMarketplaceCategory
		var desc sql.NullString
		err := rows.Scan(&c.ID, &c.Name, &desc, &c.IsActive, &c.CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("error scanning category: %v", err)
		}
		if desc.Valid {
			c.Description = &desc.String
		}
		categories = append(categories, c)
	}

	return categories, nil
}

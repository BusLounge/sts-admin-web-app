package services

import (
	"sts-backend/internal/database"
	"sts-backend/internal/models"
)

func GetMasterItems() ([]models.InventoryItem, error) {
	repo := database.NewInventoryRepository(database.DB)
	return repo.GetMasterItems()
}

func GetMasterItemByID(id string) (*models.InventoryItem, error) {
	repo := database.NewInventoryRepository(database.DB)
	return repo.GetMasterItemByID(id)
}

func CreateMasterItem(i models.InventoryItem) error {
	repo := database.NewInventoryRepository(database.DB)
	return repo.CreateMasterItem(i)
}

func UpdateMasterItem(i models.InventoryItem) error {
	repo := database.NewInventoryRepository(database.DB)
	return repo.UpdateMasterItem(i)
}

func ToggleItemStatus(id string, isActive bool) error {
	repo := database.NewInventoryRepository(database.DB)
	return repo.ToggleItemStatus(id, isActive)
}

func GetCategories() ([]models.LoungeMarketplaceCategory, error) {
	repo := database.NewInventoryRepository(database.DB)
	return repo.GetCategories()
}

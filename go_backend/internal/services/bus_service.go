package services

import (
	"sts-backend/internal/database"
	"sts-backend/internal/models"
)

// GetAllBuses retrieves all buses using the repository
func GetAllBuses() ([]models.Bus, error) {
	repo := database.NewBusRepository(database.DB)
	return repo.GetAllBuses()
}

// GetPendingBuses retrieves all pending buses using the repository
func GetPendingBuses() ([]models.Bus, error) {
	repo := database.NewBusRepository(database.DB)
	return repo.GetPendingBuses()
}

// CreateBus creates a new bus using the repository
func CreateBus(bus *models.Bus) error {
	repo := database.NewBusRepository(database.DB)
	return repo.CreateBus(bus)
}

// UpdateBus updates an existing bus using the repository
func UpdateBus(bus *models.Bus) error {
	repo := database.NewBusRepository(database.DB)
	return repo.UpdateBus(bus)
}

// DeleteBus deletes a bus using the repository
func DeleteBus(id string) error {
	repo := database.NewBusRepository(database.DB)
	return repo.DeleteBus(id)
}

// GetBusByID retrieves a bus by ID using the repository
func GetBusByID(id string) (*models.Bus, error) {
	repo := database.NewBusRepository(database.DB)
	return repo.GetBusByID(id)
}

// UpdateBusVerification updates the verification status of a bus
func UpdateBusVerification(id string, status string, documents string) error {
	repo := database.NewBusRepository(database.DB)
	return repo.UpdateBusVerification(id, status, documents)
}

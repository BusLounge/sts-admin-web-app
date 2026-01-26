package services

import (
	"sts-backend/internal/database"
	"sts-backend/internal/models"
)

func GetAllBusOwners() ([]models.BusOwner, error) {
	return database.GetAllBusOwners()
}

func GetBusOwnerByID(id string) (*models.BusOwner, error) {
	return database.GetBusOwnerByID(id)
}

func GetPendingBusOwners() ([]models.BusOwner, error) {
	return database.GetPendingBusOwners()
}

func CreateBusOwner(owner *models.BusOwner) error {
	return database.CreateBusOwner(owner)
}

func UpdateBusOwner(owner *models.BusOwner) error {
	return database.UpdateBusOwner(owner)
}

func DeleteBusOwner(id string) error {
	return database.DeleteBusOwner(id)
}

func VerifyBusOwner(id string, status string, documents interface{}) error {
	return database.VerifyBusOwner(id, status, documents)
}

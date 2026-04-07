package services

import (
	"sts-backend/internal/database"
	"sts-backend/internal/models"
)

func GetPendingLoungeOwners() ([]models.LoungeOwner, error) {
	return database.GetPendingLoungeOwners()
}

func GetLoungeOwnerByID(id string) (*models.LoungeOwner, error) {
	return database.GetLoungeOwnerByID(id)
}

func VerifyLoungeOwner(id string, status string, notes string) error {
	return database.VerifyLoungeOwner(id, status, notes)
}

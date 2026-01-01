package services

import (
	"sts-backend/internal/database"
	"sts-backend/internal/models"
)

func GetConductors() ([]models.Conductor, error) {
	repo := database.NewStaffRepository(database.DB)
	return repo.GetConductors()
}

func GetPendingConductors() ([]models.Conductor, error) {
	repo := database.NewStaffRepository(database.DB)
	return repo.GetPendingConductors()
}

func GetConductorByID(id string) (*models.Conductor, error) {
	repo := database.NewStaffRepository(database.DB)
	return repo.GetConductorByID(id)
}

func CreateConductor(conductor *models.Conductor) error {
	repo := database.NewStaffRepository(database.DB)
	return repo.CreateConductor(conductor)
}

func UpdateConductor(conductor *models.Conductor) error {
	repo := database.NewStaffRepository(database.DB)
	return repo.UpdateConductor(conductor)
}

func UpdateConductorVerification(id string, status string, documents string) error {
	repo := database.NewStaffRepository(database.DB)
	return repo.UpdateConductorVerification(id, status, documents)
}

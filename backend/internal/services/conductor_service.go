package services

import (
	"sts-backend/internal/database"
	"sts-backend/internal/models"
)

func GetConductors() ([]models.Conductor, error) {
	repo := database.NewStaffRepository(database.DB)
	return repo.GetConductors()
}

func CreateConductor(conductor *models.Conductor) error {
	repo := database.NewStaffRepository(database.DB)
	return repo.CreateConductor(conductor)
}

func UpdateConductor(conductor *models.Conductor) error {
	repo := database.NewStaffRepository(database.DB)
	return repo.UpdateConductor(conductor)
}

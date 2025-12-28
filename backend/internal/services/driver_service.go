package services

import (
	"sts-backend/internal/database"
	"sts-backend/internal/models"
)

func GetDrivers() ([]models.Driver, error) {
	repo := database.NewStaffRepository(database.DB)
	return repo.GetDrivers()
}

func CreateDriver(driver *models.Driver) error {
	repo := database.NewStaffRepository(database.DB)
	return repo.CreateDriver(driver)
}

func UpdateDriver(driver *models.Driver) error {
	repo := database.NewStaffRepository(database.DB)
	return repo.UpdateDriver(driver)
}

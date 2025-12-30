package services

import (
	"sts-backend/internal/database"
	"sts-backend/internal/models"
)

func GetDrivers() ([]models.Driver, error) {
	repo := database.NewStaffRepository(database.DB)
	return repo.GetDrivers()
}

func GetPendingDrivers() ([]models.Driver, error) {
	repo := database.NewStaffRepository(database.DB)
	return repo.GetPendingDrivers()
}

func GetDriverByID(id string) (*models.Driver, error) {
	repo := database.NewStaffRepository(database.DB)
	return repo.GetDriverByID(id)
}

func CreateDriver(driver *models.Driver) error {
	repo := database.NewStaffRepository(database.DB)
	return repo.CreateDriver(driver)
}

func UpdateDriver(driver *models.Driver) error {
	repo := database.NewStaffRepository(database.DB)
	return repo.UpdateDriver(driver)
}

func UpdateDriverVerification(id string, status string) error {
	repo := database.NewStaffRepository(database.DB)
	return repo.UpdateDriverVerification(id, status)
}

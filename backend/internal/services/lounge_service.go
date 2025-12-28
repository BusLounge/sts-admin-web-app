package services

import (
	"sts-backend/internal/database"
	"sts-backend/internal/models"
)

func GetAllLounges() ([]models.Lounge, error) {
	repo := database.NewLoungeRepository(database.DB)
	return repo.GetLounges()
}

func CreateLounge(l models.Lounge) error {
	repo := database.NewLoungeRepository(database.DB)
	return repo.CreateLounge(l)
}

func UpdateLounge(l models.Lounge) error {
	repo := database.NewLoungeRepository(database.DB)
	return repo.UpdateLounge(l)
}

func DeleteLounge(id string) error {
	repo := database.NewLoungeRepository(database.DB)
	return repo.DeleteLounge(id)
}

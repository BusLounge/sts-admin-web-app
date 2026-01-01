package services

import (
	"sts-backend/internal/database"
	"sts-backend/internal/models"
)

func GetAllLounges() ([]models.Lounge, error) {
	repo := database.NewLoungeRepository(database.DB)
	return repo.GetLounges()
}

func GetPendingLounges() ([]models.Lounge, error) {
	repo := database.NewLoungeRepository(database.DB)
	return repo.GetPendingLounges()
}

func GetLoungeByID(id string) (*models.Lounge, error) {
	repo := database.NewLoungeRepository(database.DB)
	return repo.GetLoungeByID(id)
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

func UpdateLoungeVerification(id string, status string, documents string) error {
	repo := database.NewLoungeRepository(database.DB)
	return repo.UpdateLoungeVerification(id, status, documents)
}

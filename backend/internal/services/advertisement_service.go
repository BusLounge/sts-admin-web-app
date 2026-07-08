package services

import (
	"sts-backend/internal/database"
	"sts-backend/internal/models"
)

func GetAllAdvertisements() ([]models.Advertisement, error) {
	repo := database.NewAdvertisementRepository(database.DB)
	return repo.GetAdvertisements()
}

func GetAllAdvertisementGroups() ([]models.AdvertisementGroup, error) {
	repo := database.NewAdvertisementRepository(database.DB)
	return repo.GetAdvertisementGroups()
}

func CreateAdvertisement(a *models.Advertisement) error {
	repo := database.NewAdvertisementRepository(database.DB)
	return repo.CreateAdvertisement(a)
}

func UpdateAdvertisement(id string, a *models.Advertisement) error {
	repo := database.NewAdvertisementRepository(database.DB)
	return repo.UpdateAdvertisement(id, a)
}

func DeleteAdvertisement(id string) error {
	repo := database.NewAdvertisementRepository(database.DB)
	return repo.DeleteAdvertisement(id)
}

func CreateAdvertisementGroup(g *models.AdvertisementGroup) error {
	repo := database.NewAdvertisementRepository(database.DB)
	return repo.CreateAdvertisementGroup(g)
}

func UpdateAdvertisementGroup(id string, g *models.AdvertisementGroup) error {
	repo := database.NewAdvertisementRepository(database.DB)
	return repo.UpdateAdvertisementGroup(id, g)
}

func DeleteAdvertisementGroup(id string) error {
	repo := database.NewAdvertisementRepository(database.DB)
	return repo.DeleteAdvertisementGroup(id)
}

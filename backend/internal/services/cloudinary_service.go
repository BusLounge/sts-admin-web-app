package services

import (
	"context"
	"fmt"
	"mime/multipart"
	"os"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
)

// UploadToCloudinary uploads a file to Cloudinary and returns the secure URL and media type.
func UploadToCloudinary(file multipart.File, filename string) (string, string, error) {
	cloudinaryURL := os.Getenv("CLOUDINARY_URL")
	if cloudinaryURL == "" {
		return "", "", fmt.Errorf("CLOUDINARY_URL environment variable is not set")
	}

	cld, err := cloudinary.NewFromURL(cloudinaryURL)
	if err != nil {
		return "", "", fmt.Errorf("failed to initialize Cloudinary: %v", err)
	}

	ctx := context.Background()

	// Upload the file stream to Cloudinary
	resp, err := cld.Upload.Upload(ctx, file, uploader.UploadParams{
		Folder:       "sts-advertisements",
		ResourceType: "auto", // "auto" allows Cloudinary to detect if it's an image or video
	})
	if err != nil {
		return "", "", fmt.Errorf("failed to upload to Cloudinary: %v", err)
	}

	return resp.SecureURL, resp.ResourceType, nil
}

// UploadImageToCloudinary uploads a file to Cloudinary to a specific folder.
func UploadImageToCloudinary(file multipart.File, folder string) (string, error) {
	cloudinaryURL := os.Getenv("CLOUDINARY_URL")
	if cloudinaryURL == "" {
		return "", fmt.Errorf("CLOUDINARY_URL environment variable is not set")
	}

	cld, err := cloudinary.NewFromURL(cloudinaryURL)
	if err != nil {
		return "", fmt.Errorf("failed to initialize Cloudinary: %v", err)
	}

	ctx := context.Background()

	resp, err := cld.Upload.Upload(ctx, file, uploader.UploadParams{
		Folder:       folder,
		ResourceType: "image",
	})
	if err != nil {
		return "", fmt.Errorf("failed to upload to Cloudinary: %v", err)
	}

	return resp.SecureURL, nil
}

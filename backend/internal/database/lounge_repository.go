package database

import (
	"database/sql"
	"fmt"
	"sts-backend/internal/models"

	"github.com/lib/pq"
)

type LoungeRepository struct {
	db *sql.DB
}

func NewLoungeRepository(db *sql.DB) *LoungeRepository {
	return &LoungeRepository{db: db}
}

func (r *LoungeRepository) GetLounges() ([]models.Lounge, error) {
	query := `
		SELECT 
			l.id::text,
			COALESCE(lo.manager_full_name, ''),
			COALESCE(lo.nic, ''),
			COALESCE(lo.email, ''),
			COALESCE(lo.contact_number, ''),
			COALESCE(l.lounge_name, ''),
			COALESCE(l.contact_phone, ''),
			COALESCE(l.address, ''),
			COALESCE(l.capacity, 0),
			COALESCE(l.price_1_hour, 0),
			'{}',
			COALESCE(lmc.name, ''),
			COALESCE(l.status::text, 'Pending'),
			'',
			COALESCE(l.is_operational, true)
		FROM lounges l
		LEFT JOIN lounge_owners lo ON l.lounge_owner_id = lo.id
		LEFT JOIN lounge_marketplace_categories lmc ON l.marketplace_category_id = lmc.id
	`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("error querying lounges: %v", err)
	}
	defer rows.Close()

	lounges := []models.Lounge{}
	for rows.Next() {
		var l models.Lounge
		var amenities []string
		err := rows.Scan(
			&l.LoungeID,
			&l.LoungeOwner,
			&l.OwnerNIC,
			&l.OwnerEmail,
			&l.OwnerContact,
			&l.LoungeName,
			&l.LoungeContact,
			&l.Address,
			&l.Capacity,
			&l.PricePerHour,
			pq.Array(&amenities),
			&l.Marketplace,
			&l.Verification,
			&l.VerificationNote,
			&l.Operational,
		)
		if err != nil {
			return nil, fmt.Errorf("error scanning lounge: %v", err)
		}
		l.Facilities = amenities
		lounges = append(lounges, l)
	}

	return lounges, nil
}

func (r *LoungeRepository) CreateLounge(l models.Lounge) error {
	// 1. Create Owner
	var ownerID string
	err := r.db.QueryRow(`
		INSERT INTO lounge_owners (manager_full_name, email, contact_number, nic, verification_status)
		VALUES ($1, $2, $3, $4, 'Pending')
		RETURNING id
	`, l.LoungeOwner, l.OwnerEmail, l.OwnerContact, l.OwnerNIC).Scan(&ownerID)
	if err != nil {
		return fmt.Errorf("error creating owner: %v", err)
	}

	// 2. Resolve Marketplace Category ID
	var marketplaceID sql.NullString
	if l.Marketplace != "" {
		err := r.db.QueryRow("SELECT id FROM lounge_marketplace_categories WHERE name = $1", l.Marketplace).Scan(&marketplaceID)
		if err == sql.ErrNoRows {
			err = r.db.QueryRow("INSERT INTO lounge_marketplace_categories (name) VALUES ($1) RETURNING id", l.Marketplace).Scan(&marketplaceID)
		}
		if err != nil && err != sql.ErrNoRows {
			return fmt.Errorf("error resolving marketplace category: %v", err)
		}
	}

	// 3. Create Lounge
	_, err = r.db.Exec(`
		INSERT INTO lounges (
			lounge_owner_id, lounge_name, contact_phone, address, capacity, price_1_hour, 
			is_operational, amenities, status, marketplace_category_id
		) VALUES ($1, $2, $3, $4, $5, $6, $7, '[]', 'Pending', $8)
	`, ownerID, l.LoungeName, l.LoungeContact, l.Address, l.Capacity, l.PricePerHour,
		l.Operational, marketplaceID)

	if err != nil {
		return fmt.Errorf("error creating lounge: %v", err)
	}
	return nil
}

func (r *LoungeRepository) UpdateLounge(l models.Lounge) error {
	// Resolve Marketplace Category ID
	var marketplaceID sql.NullString
	if l.Marketplace != "" {
		err := r.db.QueryRow("SELECT id FROM lounge_marketplace_categories WHERE name = $1", l.Marketplace).Scan(&marketplaceID)
		if err == sql.ErrNoRows {
			err = r.db.QueryRow("INSERT INTO lounge_marketplace_categories (name) VALUES ($1) RETURNING id", l.Marketplace).Scan(&marketplaceID)
		}
		if err != nil && err != sql.ErrNoRows {
			return fmt.Errorf("error resolving marketplace category: %v", err)
		}
	}

	// Update Lounge details
	_, err := r.db.Exec(`
		UPDATE lounges SET 
			lounge_name = $1, contact_phone = $2, address = $3, capacity = $4, 
			price_1_hour = $5, is_operational = $6, 
			status = $7, marketplace_category_id = $8
		WHERE id = $9
	`, l.LoungeName, l.LoungeContact, l.Address, l.Capacity, l.PricePerHour,
		l.Operational, l.Verification, marketplaceID, l.LoungeID)
	if err != nil {
		return fmt.Errorf("error updating lounge: %v", err)
	}

	// Update Owner details
	_, err = r.db.Exec(`
		UPDATE lounge_owners SET
			manager_full_name = $1, email = $2, contact_number = $3, nic = $4
		WHERE id = (SELECT lounge_owner_id FROM lounges WHERE id = $5)
	`, l.LoungeOwner, l.OwnerEmail, l.OwnerContact, l.OwnerNIC, l.LoungeID)

	if err != nil {
		return fmt.Errorf("error updating lounge owner: %v", err)
	}

	return nil
}

func (r *LoungeRepository) DeleteLounge(id string) error {
	_, err := r.db.Exec("DELETE FROM lounges WHERE id = $1", id)
	return err
}

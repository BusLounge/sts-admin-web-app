package database

import (
	"database/sql"
	"fmt"
	"sts-backend/internal/models"
)

type AdvertisementRepository struct {
	db *sql.DB
}

func NewAdvertisementRepository(db *sql.DB) *AdvertisementRepository {
	return &AdvertisementRepository{db: db}
}

func (r *AdvertisementRepository) GetAdvertisements() ([]models.Advertisement, error) {
	query := `
		SELECT 
			id::text,
			COALESCE(advertisement_name, ''),
			COALESCE(description, ''),
			COALESCE(advertisement_category, ''),
			COALESCE(media_duration, 0),
			COALESCE(media_url, ''),
			COALESCE(media_type, ''),
			COALESCE(lounge_group_name, ''),
			COALESCE(priority, ''),
			COALESCE(version, 1),
			COALESCE(schedule_type, ''),
			COALESCE(frequency, ''),
			COALESCE(recurrence_interval, 0),
			occurs_once_at::text,
			COALESCE(occurs_every_interval, 0),
			COALESCE(weekly_days, ''),
			COALESCE(monthly_day_of_month, 0),
			COALESCE(monthly_week, ''),
			COALESCE(monthly_day, ''),
			COALESCE(start_time::text, ''),
			COALESCE(end_time::text, ''),
			COALESCE(max_idle_loop_duration, 0),
			COALESCE(status, 'active'),
			start_date::text,
			end_date::text,
			COALESCE(selected_time_slots, ''),
			COALESCE(created_at::text, ''),
			COALESCE(updated_at::text, '')
		FROM advertisements
	`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("error querying advertisements: %v", err)
	}
	defer rows.Close()

	advertisements := []models.Advertisement{}
	for rows.Next() {
		var a models.Advertisement
		err := rows.Scan(
			&a.ID,
			&a.AdvertisementName,
			&a.Description,
			&a.AdvertisementCategory,
			&a.MediaDuration,
			&a.MediaUrl,
			&a.MediaType,
			&a.LoungeGroupName,
			&a.Priority,
			&a.Version,
			&a.ScheduleType,
			&a.Frequency,
			&a.RecurrenceInterval,
			&a.OccursOnceAt,
			&a.OccursEveryInterval,
			&a.WeeklyDays,
			&a.MonthlyDayOfMonth,
			&a.MonthlyWeek,
			&a.MonthlyDay,
			&a.StartTime,
			&a.EndTime,
			&a.MaxIdleLoopDuration,
			&a.Status,
			&a.StartDate,
			&a.EndDate,
			&a.SelectedTimeSlots,
			&a.CreatedAt,
			&a.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("error scanning advertisement: %v", err)
		}
		advertisements = append(advertisements, a)
	}

	return advertisements, nil
}

func (r *AdvertisementRepository) GetAdvertisementGroups() ([]models.AdvertisementGroup, error) {
	query := `
		SELECT 
			id::text,
			COALESCE(group_name, ''),
			COALESCE(lounges, ''),
			COALESCE(no_of_advertisements, 0),
			COALESCE(created_at::text, ''),
			COALESCE(updated_at::text, '')
		FROM advertisement_groups
	`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("error querying advertisement groups: %v", err)
	}
	defer rows.Close()

	groups := []models.AdvertisementGroup{}
	for rows.Next() {
		var g models.AdvertisementGroup
		err := rows.Scan(
			&g.ID,
			&g.GroupName,
			&g.Lounges,
			&g.NoOfAdvertisements,
			&g.CreatedAt,
			&g.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("error scanning advertisement group: %v", err)
		}
		groups = append(groups, g)
	}

	return groups, nil
}

func (r *AdvertisementRepository) CreateAdvertisement(a *models.Advertisement) error {
	var monthlyDayOfMonth interface{}
	if a.MonthlyDayOfMonth >= 1 && a.MonthlyDayOfMonth <= 31 {
		monthlyDayOfMonth = a.MonthlyDayOfMonth
	}
	query := `
		INSERT INTO advertisements (
			advertisement_name, description, advertisement_category, media_duration,
			media_url, media_type, lounge_group_name, priority, schedule_type,
			frequency, recurrence_interval, occurs_once_at, occurs_every_interval,
			weekly_days, monthly_day_of_month, monthly_week, monthly_day,
			start_time, end_time, max_idle_loop_duration, status, start_date, end_date, selected_time_slots
		) VALUES (
			$1, $2, NULLIF($3, ''), $4, $5, NULLIF($6, ''), $7, NULLIF($8, ''), NULLIF($9, ''), NULLIF($10, ''), $11, $12, $13, $14, $15, NULLIF($16, ''), NULLIF($17, ''),
			NULLIF($18, '')::time, NULLIF($19, '')::time, $20, $21, NULLIF($22, '')::date, NULLIF($23, '')::date, $24
		) RETURNING id
	`
	err := r.db.QueryRow(
		query, a.AdvertisementName, a.Description, a.AdvertisementCategory, a.MediaDuration,
		a.MediaUrl, a.MediaType, a.LoungeGroupName, a.Priority, a.ScheduleType,
		a.Frequency, a.RecurrenceInterval, a.OccursOnceAt, a.OccursEveryInterval,
		a.WeeklyDays, monthlyDayOfMonth, a.MonthlyWeek, a.MonthlyDay,
		a.StartTime, a.EndTime, a.MaxIdleLoopDuration, a.Status, a.StartDate, a.EndDate, a.SelectedTimeSlots,
	).Scan(&a.ID)
	
	if err != nil {
		return fmt.Errorf("error creating advertisement: %v", err)
	}
	return nil
}

func (r *AdvertisementRepository) UpdateAdvertisement(id string, a *models.Advertisement) error {
	var monthlyDayOfMonth interface{}
	if a.MonthlyDayOfMonth >= 1 && a.MonthlyDayOfMonth <= 31 {
		monthlyDayOfMonth = a.MonthlyDayOfMonth
	}
	query := `
		UPDATE advertisements SET
			advertisement_name = $1, description = $2, advertisement_category = NULLIF($3, ''),
			media_duration = $4, media_url = $5, media_type = NULLIF($6, ''), lounge_group_name = $7,
			priority = NULLIF($8, ''), schedule_type = NULLIF($9, ''), frequency = NULLIF($10, ''), recurrence_interval = $11,
			occurs_once_at = $12, occurs_every_interval = $13, weekly_days = $14,
			monthly_day_of_month = $15, monthly_week = NULLIF($16, ''), monthly_day = NULLIF($17, ''),
			start_time = NULLIF($18, '')::time, end_time = NULLIF($19, '')::time, max_idle_loop_duration = $20,
			status = $21, start_date = NULLIF($22, '')::date, end_date = NULLIF($23, '')::date, selected_time_slots = $24,
			updated_at = timezone('utc'::text, now())
		WHERE id = $25
	`
	_, err := r.db.Exec(
		query, a.AdvertisementName, a.Description, a.AdvertisementCategory, a.MediaDuration,
		a.MediaUrl, a.MediaType, a.LoungeGroupName, a.Priority, a.ScheduleType,
		a.Frequency, a.RecurrenceInterval, a.OccursOnceAt, a.OccursEveryInterval,
		a.WeeklyDays, monthlyDayOfMonth, a.MonthlyWeek, a.MonthlyDay,
		a.StartTime, a.EndTime, a.MaxIdleLoopDuration, a.Status, a.StartDate, a.EndDate, a.SelectedTimeSlots,
		id,
	)
	if err != nil {
		return fmt.Errorf("error updating advertisement: %v", err)
	}
	return nil
}

func (r *AdvertisementRepository) DeleteAdvertisement(id string) error {
	_, err := r.db.Exec("DELETE FROM advertisements WHERE id = $1", id)
	return err
}

func (r *AdvertisementRepository) CreateAdvertisementGroup(g *models.AdvertisementGroup) error {
	query := `
		INSERT INTO advertisement_groups (group_name, lounges, no_of_advertisements)
		VALUES ($1, $2, $3) RETURNING id
	`
	err := r.db.QueryRow(query, g.GroupName, g.Lounges, g.NoOfAdvertisements).Scan(&g.ID)
	if err != nil {
		return fmt.Errorf("error creating advertisement group: %v", err)
	}
	return nil
}

func (r *AdvertisementRepository) UpdateAdvertisementGroup(id string, g *models.AdvertisementGroup) error {
	query := `
		UPDATE advertisement_groups SET
			group_name = $1, lounges = $2, no_of_advertisements = $3,
			updated_at = timezone('utc'::text, now())
		WHERE id = $4
	`
	_, err := r.db.Exec(query, g.GroupName, g.Lounges, g.NoOfAdvertisements, id)
	if err != nil {
		return fmt.Errorf("error updating advertisement group: %v", err)
	}
	return nil
}

func (r *AdvertisementRepository) DeleteAdvertisementGroup(id string) error {
	_, err := r.db.Exec("DELETE FROM advertisement_groups WHERE id = $1", id)
	return err
}

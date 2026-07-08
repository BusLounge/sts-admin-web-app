package models

type Advertisement struct {
	ID                    string  `json:"id"`
	AdvertisementName     string  `json:"advertisementName"`
	Description           string  `json:"description"`
	AdvertisementCategory string  `json:"advertisementCategory"`
	MediaDuration         int     `json:"mediaDuration"`
	MediaUrl              string  `json:"mediaUrl"`
	MediaType             string  `json:"mediaType"`
	LoungeGroupName       string  `json:"loungeGroupName"`
	Priority              string  `json:"priority"`
	Version               int     `json:"version"`
	ScheduleType          string  `json:"scheduleType"`
	Frequency             string  `json:"frequency"`
	RecurrenceInterval    int     `json:"recurrenceInterval"`
	OccursOnceAt          *string `json:"occursOnceAt"`
	OccursEveryInterval   int     `json:"occursEveryInterval"`
	WeeklyDays            string  `json:"weeklyDays"`
	MonthlyDayOfMonth     int     `json:"monthlyDayOfMonth"`
	MonthlyWeek           string  `json:"monthlyWeek"`
	MonthlyDay            string  `json:"monthlyDay"`
	StartTime             string  `json:"startTime"`
	EndTime               string  `json:"endTime"`
	MaxIdleLoopDuration   int     `json:"maxIdleLoopDuration"`
	Status                string  `json:"status"`
	StartDate             *string `json:"startDate"`
	EndDate               *string `json:"endDate"`
	SelectedTimeSlots     string  `json:"selectedTimeSlots"`
	CreatedAt             string  `json:"createdAt"`
	UpdatedAt             string  `json:"updatedAt"`
}

type AdvertisementGroup struct {
	ID                 string `json:"id"`
	GroupName          string `json:"groupName"`
	Lounges            string `json:"lounges"`
	NoOfAdvertisements int    `json:"noOfAdvertisements"`
	CreatedAt          string `json:"createdAt"`
	UpdatedAt          string `json:"updatedAt"`
}

package services

import (
	"database/sql"
	"log"
	"time"
)

type SettlementScheduler struct {
	db       *sql.DB
	service  *SettlementService
	stopChan chan struct{}
}

func NewSettlementScheduler(db *sql.DB, interval ...time.Duration) *SettlementScheduler {
	return &SettlementScheduler{
		db:       db,
		service:  NewSettlementService(db),
		stopChan: make(chan struct{}),
	}
}

func (s *SettlementScheduler) Start() {
	log.Println("Starting Sri Lanka Clock-Aligned Settlement Scheduler...")

	go func() {
		for {
			loc := GetSriLankaLocation()
			nowSL := time.Now().In(loc)
			nextMidnight := time.Date(nowSL.Year(), nowSL.Month(), nowSL.Day()+1, 0, 0, 0, 0, loc)
			durationUntilMidnight := nextMidnight.Sub(nowSL)

			log.Printf("⏰ Settlement Scheduler: Next midnight run scheduled at %s (in %v)",
				nextMidnight.Format("2006-01-02 15:04:05 MST"), durationUntilMidnight.Round(time.Second))

			timer := time.NewTimer(durationUntilMidnight)

			select {
			case <-timer.C:
				log.Println("🌙 Triggering scheduled midnight settlement process (Sri Lanka Time)...")
				err := s.service.RunMidnightProcess()
				if err != nil {
					log.Printf("Error running midnight settlement process: %v", err)
				}
			case <-s.stopChan:
				timer.Stop()
				log.Println("Settlement Scheduler stopped.")
				return
			}
		}
	}()
}

func (s *SettlementScheduler) Stop() {
	close(s.stopChan)
}

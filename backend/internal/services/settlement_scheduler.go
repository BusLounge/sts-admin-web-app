package services

import (
	"database/sql"
	"log"
	"time"
)

type SettlementScheduler struct {
	db       *sql.DB
	service  *SettlementService
	interval time.Duration
	stopChan chan struct{}
}

func NewSettlementScheduler(db *sql.DB, interval time.Duration) *SettlementScheduler {
	return &SettlementScheduler{
		db:       db,
		service:  NewSettlementService(db),
		interval: interval,
		stopChan: make(chan struct{}),
	}
}

func (s *SettlementScheduler) Start() {
	log.Println("Starting Settlement Scheduler...")
	ticker := time.NewTicker(s.interval)

	go func() {
		for {
			select {
			case <-ticker.C:
				err := s.service.RunMidnightProcess()
				if err != nil {
					log.Printf("Error running midnight settlement process: %v", err)
				}
			case <-s.stopChan:
				ticker.Stop()
				log.Println("Settlement Scheduler stopped.")
				return
			}
		}
	}()
}

func (s *SettlementScheduler) Stop() {
	close(s.stopChan)
}

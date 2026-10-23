package services

import (
	"database/sql"
	"errors"
	"sts-backend/internal/database"
	"sts-backend/internal/models"

	"github.com/google/uuid"
)

type RefundService struct {
	repo *database.RefundRepository
}

func NewRefundService(db *sql.DB) *RefundService {
	return &RefundService{
		repo: database.NewRefundRepository(db),
	}
}

func (s *RefundService) GetAllRefunds(status string, limit, offset int) ([]models.RefundItem, int, error) {
	return s.repo.GetAllRefunds(status, limit, offset)
}

func (s *RefundService) GetRefundByID(id uuid.UUID) (*models.RefundDetail, error) {
	return s.repo.GetRefundByID(id)
}

func (s *RefundService) ApproveRefund(
	refundID uuid.UUID,
	req models.ApproveRefundRequest,
	adminID uuid.UUID,
) error {
	detail, err := s.repo.GetRefundByID(refundID)
	if err != nil {
		return err
	}

	if detail.Status != models.RefundStatusPending {
		return errors.New("only pending refund requests can be approved")
	}

	// Safety check: Cannot approve if passenger boarded the bus
	if detail.Criteria.IsRefundBlockedDueToBoarding {
		return errors.New("cannot approve refund: passenger boarded the bus and consumed the transit service")
	}

	// Safety check: Cannot approve Tier 4 (expired) refunds
	if detail.Criteria.IsNonRefundable {
		return errors.New("this refund request has exceeded the 3-day post-trip window and is strictly non-refundable")
	}

	// Safety check: Tier 3 requires override
	if detail.Criteria.RequiresOverride && !req.Override {
		return errors.New("this trip has already departed; approving requires explicit override confirmation for verified service failure or breakdown")
	}

	baseFare := detail.TotalFare
	if baseFare <= 0 {
		baseFare = detail.RequestedAmount
	}

	var finalRefundAmount float64
	var systemCost float64
	tier := req.TierApplied
	if tier == "" {
		tier = detail.Criteria.SuggestedTier
	}

	// Apply configured tier percentages unless custom systemCost was provided
	if req.SystemCost > 0 {
		systemCost = req.SystemCost
		finalRefundAmount = baseFare - systemCost
		if finalRefundAmount < 0 {
			finalRefundAmount = 0
		}
	} else {
		switch tier {
		case "operator_cancelled":
			// Full 100% refund on operator cancellation
			systemCost = 0
			finalRefundAmount = baseFare
		case "tier_1_advance":
			// Passenger gets 95%, Company gets 5%
			systemCost = baseFare * 0.05
			finalRefundAmount = baseFare * 0.95
		case "tier_2_within_24h":
			// Passenger gets 90%, Company gets 10%
			systemCost = baseFare * 0.10
			finalRefundAmount = baseFare * 0.90
		case "tier_3_post_trip":
			if req.Override {
				// Default 100% refund on verified breakdown override, or 0%
				finalRefundAmount = baseFare
				systemCost = 0
			} else {
				finalRefundAmount = 0
				systemCost = baseFare
			}
		default:
			systemCost = baseFare * 0.05
			finalRefundAmount = baseFare * 0.95
		}
	}

	return s.repo.ApproveRefund(refundID, finalRefundAmount, systemCost, tier, adminID, req.AdminNotes)
}

func (s *RefundService) RejectRefund(refundID uuid.UUID, adminID uuid.UUID, reason string) error {
	if reason == "" {
		return errors.New("rejection reason is required")
	}
	return s.repo.RejectRefund(refundID, adminID, reason)
}

func (s *RefundService) GetRefundStats() (*models.RefundStats, error) {
	return s.repo.GetRefundStats()
}

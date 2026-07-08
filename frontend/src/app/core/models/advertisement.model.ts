export interface Advertisement {
  id?: string;
  advertisementName: string;
  description?: string;
  advertisementCategory: string;
  mediaDuration?: number;
  mediaUrl?: string;
  mediaType?: string;
  loungeGroupName?: string;
  priority: string;
  version?: number;
  scheduleType: string;
  frequency?: string;
  recurrenceInterval?: number;
  occursOnceAt?: string;
  occursEveryInterval?: number;
  weeklyDays?: string;
  monthlyDayOfMonth?: number;
  monthlyWeek?: string;
  monthlyDay?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  playTimeSlot?: string;
  playTimeSlots?: string[];
  selectedTimeSlots?: string;
  maxIdleLoopDuration?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdvertisementGroup {
  id: string;
  groupName: string;
  lounges: string;
  noOfAdvertisements: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdvertisementGroupCreateRequest {
  groupName: string;
  lounges: string; // <-- Change to string because we will JSON.stringify
}

export interface LoungeAdTimeSlot {
  type: string;
  label: string;
  startSecond: number;
  endSecond: number;
  durationSeconds: number;
  interactive: boolean;
}

export interface UploadMediaResponse {
  fileName: string;
  mediaUrl: string;
  mediaType: string;
}

export interface LoungeAdSlotSummary {
  scheduleWindowSeconds: number;
  adWindowSeconds: number;
  bookedSeconds: number;
  remainingSeconds: number;
  timeSlots?: LoungeAdTimeSlot[];
  availableSlots?: LoungeAdTimeSlot[];
  bookedByScheduleType?: Record<string, number>;
  effectiveLoungeGroups?: string[];
}

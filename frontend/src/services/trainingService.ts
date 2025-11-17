import api from './api';

export interface Training {
  id?: number;
  trainingNumber: string;
  title: string;
  description?: string;
  category: string;
  duration?: number;
  instructor?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'expired';
  scheduledDate: string | Date;
  completedDate?: string | Date;
  expiryMonths?: number;
  createdBy: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TrainingAttendee {
  id?: number;
  trainingId: number;
  userId: number;
  attended: boolean;
  score?: number;
  certificateIssued?: boolean;
  certificateDate?: string | Date;
  expiryDate?: string | Date;
  notes?: string;
  // User info (from JOIN)
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface ExpiringCertificate {
  id: number;
  certificateNumber: string;
  certificateName: string;
  userId: number;
  userFirstName: string;
  userLastName: string;
  userEmail: string;
  expiryDate: string | null;
  issueDate: string;
  status: string;
  certificateType: string;
  competencyArea: string | null;
  daysUntilExpiry: number | null;
  isExpired: boolean;
  requiresRenewal: boolean;
  nextRenewalDate: string | null;
}

export interface ExpiringAttendeeRecord {
  id: number;
  trainingId: number;
  trainingTitle: string;
  trainingNumber: string;
  userId: number;
  userFirstName: string;
  userLastName: string;
  userEmail: string;
  expiryDate: string | null;
  certificateDate: string | null;
  daysUntilExpiry: number | null;
  isExpired: boolean;
}

export interface ExpiringCertificatesResponse {
  data: ExpiringCertificate[];
  count: number;
  threshold: number;
  includeExpired: boolean;
}

export interface ExpiringAttendeeRecordsResponse {
  data: ExpiringAttendeeRecord[];
  count: number;
  threshold: number;
  includeExpired: boolean;
}

/**
 * Get all trainings
 */
export const getTrainings = async (params?: {
  status?: string;
  category?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: Training[]; pagination: { page: number; limit: number; total: number; pages: number } }> => {
  const response = await api.get('/training', { params });
  return response.data;
};

/**
 * Get training by ID
 */
export const getTrainingById = async (id: number): Promise<Training> => {
  const response = await api.get(`/training/${id}`);
  return response.data;
};

/**
 * Create a new training
 */
export const createTraining = async (training: Omit<Training, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ id: number }> => {
  const response = await api.post('/training', training);
  return response.data;
};

/**
 * Update training
 */
export const updateTraining = async (id: number, updates: Partial<Training>): Promise<void> => {
  await api.put(`/training/${id}`, updates);
};

/**
 * Get training attendees
 */
export const getTrainingAttendees = async (trainingId: number): Promise<TrainingAttendee[]> => {
  const response = await api.get(`/training/${trainingId}/attendees`);
  return response.data;
};

/**
 * Get expiring training certificates
 * @param daysThreshold - Number of days to look ahead (default: 90)
 * @param includeExpired - Whether to include expired certificates (default: true)
 */
export const getExpiringCertificates = async (
  daysThreshold: number = 90,
  includeExpired: boolean = true
): Promise<ExpiringCertificatesResponse> => {
  const response = await api.get('/training/certificates/expiring', {
    params: {
      daysThreshold,
      includeExpired: includeExpired.toString(),
    },
  });
  return response.data;
};

/**
 * Get expiring training attendee records
 * @param daysThreshold - Number of days to look ahead (default: 90)
 * @param includeExpired - Whether to include expired records (default: true)
 */
export const getExpiringAttendeeRecords = async (
  daysThreshold: number = 90,
  includeExpired: boolean = true
): Promise<ExpiringAttendeeRecordsResponse> => {
  const response = await api.get('/training/attendees/expiring', {
    params: {
      daysThreshold,
      includeExpired: includeExpired.toString(),
    },
  });
  return response.data;
};

/**
 * Get my expiring certificates (for the authenticated user)
 * @param daysThreshold - Number of days to look ahead (default: 90)
 */
export const getMyExpiringCertificates = async (
  daysThreshold: number = 90
): Promise<{ data: ExpiringCertificate[]; count: number; threshold: number }> => {
  const response = await api.get('/training/my-certificates/expiring', {
    params: {
      daysThreshold,
    },
  });
  return response.data;
};

import api from './api';

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

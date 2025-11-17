import { getConnection, sql } from '../config/database';

export interface ExpiringCertificate {
  id: number;
  certificateNumber: string;
  certificateName: string;
  userId: number;
  userFirstName: string;
  userLastName: string;
  userEmail: string;
  expiryDate: Date | null;
  issueDate: Date;
  status: string;
  certificateType: string;
  competencyArea: string | null;
  daysUntilExpiry: number | null;
  isExpired: boolean;
  requiresRenewal: boolean;
  nextRenewalDate: Date | null;
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
  expiryDate: Date | null;
  certificateDate: Date | null;
  daysUntilExpiry: number | null;
  isExpired: boolean;
}

export class TrainingCertificateService {
  /**
   * Get expiring training certificates
   * @param daysThreshold - Number of days to look ahead for expiring certificates (default: 90)
   * @param includeExpired - Whether to include already expired certificates (default: true)
   */
  static async getExpiringCertificates(
    daysThreshold: number = 90,
    includeExpired: boolean = true
  ): Promise<ExpiringCertificate[]> {
    const pool = await getConnection();

    const query = `
      SELECT 
        tc.id,
        tc.certificateNumber,
        tc.certificateName,
        tc.userId,
        u.firstName AS userFirstName,
        u.lastName AS userLastName,
        u.email AS userEmail,
        tc.expiryDate,
        tc.issueDate,
        tc.status,
        tc.certificateType,
        tc.competencyArea,
        tc.requiresRenewal,
        tc.nextRenewalDate,
        CASE 
          WHEN tc.expiryDate IS NOT NULL THEN DATEDIFF(day, GETDATE(), tc.expiryDate)
          WHEN tc.nextRenewalDate IS NOT NULL THEN DATEDIFF(day, GETDATE(), tc.nextRenewalDate)
          ELSE NULL
        END AS daysUntilExpiry,
        CASE 
          WHEN tc.expiryDate IS NOT NULL AND tc.expiryDate < GETDATE() THEN 1
          WHEN tc.nextRenewalDate IS NOT NULL AND tc.nextRenewalDate < GETDATE() THEN 1
          ELSE 0
        END AS isExpired
      FROM TrainingCertificates tc
      INNER JOIN Users u ON tc.userId = u.id
      WHERE tc.status = 'active'
        AND (
          (tc.expiryDate IS NOT NULL AND tc.expiryDate <= DATEADD(day, @daysThreshold, GETDATE()))
          OR 
          (tc.requiresRenewal = 1 AND tc.nextRenewalDate IS NOT NULL AND tc.nextRenewalDate <= DATEADD(day, @daysThreshold, GETDATE()))
        )
        ${includeExpired ? '' : 'AND (tc.expiryDate >= GETDATE() OR tc.nextRenewalDate >= GETDATE())'}
      ORDER BY 
        CASE 
          WHEN tc.expiryDate IS NOT NULL THEN tc.expiryDate
          WHEN tc.nextRenewalDate IS NOT NULL THEN tc.nextRenewalDate
          ELSE '9999-12-31'
        END ASC
    `;

    const result = await pool
      .request()
      .input('daysThreshold', sql.Int, daysThreshold)
      .query(query);

    return result.recordset.map(record => ({
      ...record,
      isExpired: record.isExpired === 1,
      requiresRenewal: record.requiresRenewal === 1,
    }));
  }

  /**
   * Get expiring training attendee records
   * @param daysThreshold - Number of days to look ahead for expiring records (default: 90)
   * @param includeExpired - Whether to include already expired records (default: true)
   */
  static async getExpiringAttendeeRecords(
    daysThreshold: number = 90,
    includeExpired: boolean = true
  ): Promise<ExpiringAttendeeRecord[]> {
    const pool = await getConnection();

    const query = `
      SELECT 
        ta.id,
        ta.trainingId,
        t.title AS trainingTitle,
        t.trainingNumber,
        ta.userId,
        u.firstName AS userFirstName,
        u.lastName AS userLastName,
        u.email AS userEmail,
        ta.expiryDate,
        ta.certificateDate,
        CASE 
          WHEN ta.expiryDate IS NOT NULL THEN DATEDIFF(day, GETDATE(), ta.expiryDate)
          ELSE NULL
        END AS daysUntilExpiry,
        CASE 
          WHEN ta.expiryDate IS NOT NULL AND ta.expiryDate < GETDATE() THEN 1
          ELSE 0
        END AS isExpired
      FROM TrainingAttendees ta
      INNER JOIN Users u ON ta.userId = u.id
      INNER JOIN Trainings t ON ta.trainingId = t.id
      WHERE ta.attended = 1
        AND ta.expiryDate IS NOT NULL
        AND ta.expiryDate <= DATEADD(day, @daysThreshold, GETDATE())
        ${includeExpired ? '' : 'AND ta.expiryDate >= GETDATE()'}
      ORDER BY ta.expiryDate ASC
    `;

    const result = await pool
      .request()
      .input('daysThreshold', sql.Int, daysThreshold)
      .query(query);

    return result.recordset.map(record => ({
      ...record,
      isExpired: record.isExpired === 1,
    }));
  }

  /**
   * Get expiring certificates for a specific user
   * @param userId - User ID
   * @param daysThreshold - Number of days to look ahead for expiring certificates (default: 90)
   */
  static async getExpiringCertificatesForUser(
    userId: number,
    daysThreshold: number = 90
  ): Promise<ExpiringCertificate[]> {
    const pool = await getConnection();

    const query = `
      SELECT 
        tc.id,
        tc.certificateNumber,
        tc.certificateName,
        tc.userId,
        u.firstName AS userFirstName,
        u.lastName AS userLastName,
        u.email AS userEmail,
        tc.expiryDate,
        tc.issueDate,
        tc.status,
        tc.certificateType,
        tc.competencyArea,
        tc.requiresRenewal,
        tc.nextRenewalDate,
        CASE 
          WHEN tc.expiryDate IS NOT NULL THEN DATEDIFF(day, GETDATE(), tc.expiryDate)
          WHEN tc.nextRenewalDate IS NOT NULL THEN DATEDIFF(day, GETDATE(), tc.nextRenewalDate)
          ELSE NULL
        END AS daysUntilExpiry,
        CASE 
          WHEN tc.expiryDate IS NOT NULL AND tc.expiryDate < GETDATE() THEN 1
          WHEN tc.nextRenewalDate IS NOT NULL AND tc.nextRenewalDate < GETDATE() THEN 1
          ELSE 0
        END AS isExpired
      FROM TrainingCertificates tc
      INNER JOIN Users u ON tc.userId = u.id
      WHERE tc.userId = @userId
        AND tc.status = 'active'
        AND (
          (tc.expiryDate IS NOT NULL AND tc.expiryDate <= DATEADD(day, @daysThreshold, GETDATE()))
          OR 
          (tc.requiresRenewal = 1 AND tc.nextRenewalDate IS NOT NULL AND tc.nextRenewalDate <= DATEADD(day, @daysThreshold, GETDATE()))
        )
      ORDER BY 
        CASE 
          WHEN tc.expiryDate IS NOT NULL THEN tc.expiryDate
          WHEN tc.nextRenewalDate IS NOT NULL THEN tc.nextRenewalDate
          ELSE '9999-12-31'
        END ASC
    `;

    const result = await pool
      .request()
      .input('userId', sql.Int, userId)
      .input('daysThreshold', sql.Int, daysThreshold)
      .query(query);

    return result.recordset.map(record => ({
      ...record,
      isExpired: record.isExpired === 1,
      requiresRenewal: record.requiresRenewal === 1,
    }));
  }
}

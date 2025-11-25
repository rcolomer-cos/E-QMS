import { getConnection, sql } from '../config/database';

export interface Supplier {
  id?: number;
  supplierNumber: string;
  name: string;
  description?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  fax?: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  stateProvince?: string;
  postalCode?: string;
  country?: string;
  category: string;
  supplierType?: string;
  industry?: string;
  productsServices?: string;
  approvalStatus: string;
  approvedDate?: Date;
  approvedBy?: number;
  suspendedDate?: Date;
  suspendedReason?: string;
  active?: boolean;
  rating?: number;
  performanceScore?: number;
  qualityGrade?: string;
  certifications?: string;
  complianceStatus?: string;
  lastEvaluationDate?: Date;
  nextEvaluationDate?: Date;
  evaluationFrequency?: number;
  lastAuditDate?: Date;
  nextAuditDate?: Date;
  auditFrequency?: number;
  riskLevel?: string;
  criticalSupplier?: boolean;
  backupSupplierAvailable?: boolean;
  backupSupplierId?: number;
  businessRegistrationNumber?: string;
  dunsNumber?: string;
  establishedYear?: number;
  employeeCount?: number;
  annualRevenue?: number;
  currency?: string;
  paymentTerms?: string;
  creditLimit?: number;
  bankName?: string;
  bankAccountNumber?: string;
  supplierManager?: number;
  department?: string;
  relationshipStartDate?: Date;
  contractExpiryDate?: Date;
  preferredSupplier?: boolean;
  onTimeDeliveryRate?: number;
  qualityRejectRate?: number;
  responsiveness?: string;
  totalPurchaseValue?: number;
  iso9001Certified?: boolean;
  iso9001CertificateNumber?: string;
  iso9001ExpiryDate?: Date;
  notes?: string;
  internalReference?: string;
  tags?: string;
  createdBy: number;
  createdAt?: Date;
  updatedAt?: Date;
  deactivatedAt?: Date;
  deactivatedBy?: number;
}

export interface SupplierFilters {
  category?: string;
  approvalStatus?: string;
  riskLevel?: string;
  minRating?: number;
  maxRating?: number;
  minPerformanceScore?: number;
  maxPerformanceScore?: number;
  qualityGrade?: string;
  complianceStatus?: string;
  criticalSupplier?: boolean;
  preferredSupplier?: boolean;
  iso9001Certified?: boolean;
  supplierType?: string;
  industry?: string;
  active?: boolean;
  searchTerm?: string;
}

export interface SupplierSortOptions {
  sortBy?: 'name' | 'supplierNumber' | 'performanceScore' | 'rating' | 'lastEvaluationDate' | 'approvedDate';
  sortOrder?: 'ASC' | 'DESC';
}

export class SupplierModel {
  /**
   * Generate next supplier number
   */
  static async generateSupplierNumber(): Promise<string> {
    const pool = await getConnection();

    const result = await pool.request().query(`
      SELECT TOP 1 supplierNumber
      FROM Suppliers
      WHERE supplierNumber LIKE 'SUP%'
      ORDER BY CAST(SUBSTRING(supplierNumber, 4, LEN(supplierNumber)) AS INT) DESC
    `);

    if (result.recordset.length === 0) {
      return 'SUP001';
    }

    const lastNumber = result.recordset[0].supplierNumber;
    const numberPart = parseInt(lastNumber.substring(3), 10);
    const nextNumber = numberPart + 1;

    return `SUP${nextNumber.toString().padStart(3, '0')}`;
  }

  /**
   * Create a new supplier
   */
  static async create(supplier: Supplier): Promise<number> {
    const pool = await getConnection();

    // Generate supplier number if not provided
    if (!supplier.supplierNumber) {
      supplier.supplierNumber = await this.generateSupplierNumber();
    }

    // Helper function to convert empty strings to null
    const toNullIfEmpty = (value: any) => (value === '' ? null : value);

    const result = await pool
      .request()
      .input('supplierNumber', sql.NVarChar, supplier.supplierNumber)
      .input('name', sql.NVarChar, supplier.name)
      .input('description', sql.NVarChar, toNullIfEmpty(supplier.description))
      .input('contactPerson', sql.NVarChar, toNullIfEmpty(supplier.contactPerson))
      .input('email', sql.NVarChar, toNullIfEmpty(supplier.email))
      .input('phone', sql.NVarChar, toNullIfEmpty(supplier.phone))
      .input('alternatePhone', sql.NVarChar, toNullIfEmpty(supplier.alternatePhone))
      .input('fax', sql.NVarChar, toNullIfEmpty(supplier.fax))
      .input('website', sql.NVarChar, toNullIfEmpty(supplier.website))
      .input('addressLine1', sql.NVarChar, toNullIfEmpty(supplier.addressLine1))
      .input('addressLine2', sql.NVarChar, toNullIfEmpty(supplier.addressLine2))
      .input('city', sql.NVarChar, toNullIfEmpty(supplier.city))
      .input('stateProvince', sql.NVarChar, toNullIfEmpty(supplier.stateProvince))
      .input('postalCode', sql.NVarChar, toNullIfEmpty(supplier.postalCode))
      .input('country', sql.NVarChar, toNullIfEmpty(supplier.country))
      .input('category', sql.NVarChar, supplier.category)
      .input('supplierType', sql.NVarChar, toNullIfEmpty(supplier.supplierType))
      .input('industry', sql.NVarChar, toNullIfEmpty(supplier.industry))
      .input('productsServices', sql.NVarChar, toNullIfEmpty(supplier.productsServices))
      .input('approvalStatus', sql.NVarChar, supplier.approvalStatus)
      .input('rating', sql.Int, supplier.rating)
      .input('performanceScore', sql.Decimal(5, 2), supplier.performanceScore)
      .input('qualityGrade', sql.NVarChar, toNullIfEmpty(supplier.qualityGrade))
      .input('certifications', sql.NVarChar, toNullIfEmpty(supplier.certifications))
      .input('complianceStatus', sql.NVarChar, toNullIfEmpty(supplier.complianceStatus))
      .input('riskLevel', sql.NVarChar, toNullIfEmpty(supplier.riskLevel))
      .input('criticalSupplier', sql.Bit, supplier.criticalSupplier || false)
      .input('preferredSupplier', sql.Bit, supplier.preferredSupplier || false)
      .input('businessRegistrationNumber', sql.NVarChar, toNullIfEmpty(supplier.businessRegistrationNumber))
      .input('paymentTerms', sql.NVarChar, toNullIfEmpty(supplier.paymentTerms))
      .input('notes', sql.NVarChar(sql.MAX), toNullIfEmpty(supplier.notes))
      .input('createdBy', sql.Int, supplier.createdBy)
      .query(`
        INSERT INTO Suppliers (
          supplierNumber, name, description, contactPerson, email, phone, alternatePhone, fax, website,
          addressLine1, addressLine2, city, stateProvince, postalCode, country,
          category, supplierType, industry, productsServices, approvalStatus,
          rating, performanceScore, qualityGrade, certifications, complianceStatus,
          riskLevel, criticalSupplier, preferredSupplier, businessRegistrationNumber, paymentTerms, notes, createdBy
        )
        VALUES (
          @supplierNumber, @name, @description, @contactPerson, @email, @phone, @alternatePhone, @fax, @website,
          @addressLine1, @addressLine2, @city, @stateProvince, @postalCode, @country,
          @category, @supplierType, @industry, @productsServices, @approvalStatus,
          @rating, @performanceScore, @qualityGrade, @certifications, @complianceStatus,
          @riskLevel, @criticalSupplier, @preferredSupplier, @businessRegistrationNumber, @paymentTerms, @notes, @createdBy
        );
        SELECT SCOPE_IDENTITY() as id;
      `);

    return result.recordset[0].id;
  }

  /**
   * Find all suppliers with filtering, sorting, and pagination
   */
  static async findAll(
    filters: SupplierFilters = {},
    sortOptions: SupplierSortOptions = {},
    page: number = 1,
    limit: number = 50
  ): Promise<{ suppliers: Supplier[]; total: number; page: number; limit: number; totalPages: number }> {
    const pool = await getConnection();
    const request = pool.request();

    // Build WHERE clause
    const whereClauses: string[] = [];

    if (filters.active !== undefined) {
      whereClauses.push('active = @active');
      request.input('active', sql.Bit, filters.active);
    } else {
      whereClauses.push('active = 1'); // Default to active suppliers
    }

    if (filters.category) {
      whereClauses.push('category = @category');
      request.input('category', sql.NVarChar, filters.category);
    }

    if (filters.approvalStatus) {
      whereClauses.push('approvalStatus = @approvalStatus');
      request.input('approvalStatus', sql.NVarChar, filters.approvalStatus);
    }

    if (filters.riskLevel) {
      whereClauses.push('riskLevel = @riskLevel');
      request.input('riskLevel', sql.NVarChar, filters.riskLevel);
    }

    if (filters.minRating !== undefined) {
      whereClauses.push('rating >= @minRating');
      request.input('minRating', sql.Int, filters.minRating);
    }

    if (filters.maxRating !== undefined) {
      whereClauses.push('rating <= @maxRating');
      request.input('maxRating', sql.Int, filters.maxRating);
    }

    if (filters.minPerformanceScore !== undefined) {
      whereClauses.push('performanceScore >= @minPerformanceScore');
      request.input('minPerformanceScore', sql.Decimal(5, 2), filters.minPerformanceScore);
    }

    if (filters.maxPerformanceScore !== undefined) {
      whereClauses.push('performanceScore <= @maxPerformanceScore');
      request.input('maxPerformanceScore', sql.Decimal(5, 2), filters.maxPerformanceScore);
    }

    if (filters.qualityGrade) {
      whereClauses.push('qualityGrade = @qualityGrade');
      request.input('qualityGrade', sql.NVarChar, filters.qualityGrade);
    }

    if (filters.complianceStatus) {
      whereClauses.push('complianceStatus = @complianceStatus');
      request.input('complianceStatus', sql.NVarChar, filters.complianceStatus);
    }

    if (filters.criticalSupplier !== undefined) {
      whereClauses.push('criticalSupplier = @criticalSupplier');
      request.input('criticalSupplier', sql.Bit, filters.criticalSupplier);
    }

    if (filters.preferredSupplier !== undefined) {
      whereClauses.push('preferredSupplier = @preferredSupplier');
      request.input('preferredSupplier', sql.Bit, filters.preferredSupplier);
    }

    if (filters.iso9001Certified !== undefined) {
      whereClauses.push('iso9001Certified = @iso9001Certified');
      request.input('iso9001Certified', sql.Bit, filters.iso9001Certified);
    }

    if (filters.supplierType) {
      whereClauses.push('supplierType = @supplierType');
      request.input('supplierType', sql.NVarChar, filters.supplierType);
    }

    if (filters.industry) {
      whereClauses.push('industry = @industry');
      request.input('industry', sql.NVarChar, filters.industry);
    }

    if (filters.searchTerm) {
      whereClauses.push(
        '(name LIKE @searchTerm OR supplierNumber LIKE @searchTerm OR contactPerson LIKE @searchTerm OR email LIKE @searchTerm)'
      );
      request.input('searchTerm', sql.NVarChar, `%${filters.searchTerm}%`);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Build ORDER BY clause
    const { sortBy = 'name', sortOrder = 'ASC' } = sortOptions;
    const orderByClause = `ORDER BY ${sortBy} ${sortOrder}`;

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await request.query(`
      SELECT COUNT(*) as total
      FROM Suppliers
      ${whereClause}
    `);
    const total = countResult.recordset[0].total;

    // Get paginated data
    const dataResult = await request
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, limit)
      .query(`
        SELECT 
          id, supplierNumber, name, description, contactPerson, email, phone, alternatePhone,
          fax, website, addressLine1, addressLine2, city, stateProvince, postalCode, country,
          category, supplierType, industry, productsServices, approvalStatus, approvedDate,
          approvedBy, suspendedDate, suspendedReason, active, rating, performanceScore,
          qualityGrade, certifications, complianceStatus, lastEvaluationDate, nextEvaluationDate,
          evaluationFrequency, lastAuditDate, nextAuditDate, auditFrequency, riskLevel,
          criticalSupplier, backupSupplierAvailable, backupSupplierId, businessRegistrationNumber,
          dunsNumber, establishedYear, employeeCount, annualRevenue, currency, paymentTerms,
          creditLimit, bankName, supplierManager, department, relationshipStartDate,
          contractExpiryDate, preferredSupplier, onTimeDeliveryRate, qualityRejectRate,
          responsiveness, totalPurchaseValue, iso9001Certified, iso9001CertificateNumber,
          iso9001ExpiryDate, notes, internalReference, tags, createdBy, createdAt, updatedAt,
          deactivatedAt, deactivatedBy
        FROM Suppliers
        ${whereClause}
        ${orderByClause}
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
      `);

    const totalPages = Math.ceil(total / limit);

    return {
      suppliers: dataResult.recordset,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Find supplier by ID
   */
  static async findById(id: number): Promise<Supplier | null> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        SELECT * FROM Suppliers WHERE id = @id
      `);

    return result.recordset.length > 0 ? result.recordset[0] : null;
  }

  /**
   * Find supplier by supplier number
   */
  static async findBySupplierNumber(supplierNumber: string): Promise<Supplier | null> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('supplierNumber', sql.NVarChar, supplierNumber)
      .query(`
        SELECT * FROM Suppliers WHERE supplierNumber = @supplierNumber
      `);

    return result.recordset.length > 0 ? result.recordset[0] : null;
  }

  /**
   * Update supplier
   */
  static async update(id: number, supplier: Partial<Supplier>): Promise<void> {
    const pool = await getConnection();

    // Helper function to convert empty strings to null
    const toNullIfEmpty = (value: any) => (value === '' ? null : value);

    const setClauses: string[] = [];
    const request = pool.request().input('id', sql.Int, id);

    // Build dynamic SET clause
    Object.keys(supplier).forEach((key) => {
      if (key !== 'id' && key !== 'createdBy' && key !== 'createdAt') {
        let value = (supplier as Record<string, unknown>)[key];
        
        // Convert empty strings to null for string fields
        if (typeof value === 'string' && 
            !key.includes('Date') && 
            !key.includes('At') &&
            key !== 'approvalStatus' &&
            key !== 'category' &&
            key !== 'name') {
          value = toNullIfEmpty(value);
        }
        
        // Convert date strings to Date objects
        if ((key.includes('Date') || key.includes('At')) && value && typeof value === 'string') {
          value = new Date(value);
        }
        
        setClauses.push(`${key} = @${key}`);

        // Determine SQL type based on key
        if (key.includes('Date') || key.includes('At')) {
          request.input(key, sql.DateTime2, value || null);
        } else if (
          key.includes('Score') ||
          key.includes('Rate') ||
          key === 'annualRevenue' ||
          key === 'creditLimit' ||
          key === 'totalPurchaseValue'
        ) {
          request.input(key, sql.Decimal(18, 2), value);
        } else if (
          key === 'rating' ||
          key.endsWith('By') ||
          key === 'supplierManager' ||
          key === 'evaluationFrequency' ||
          key === 'auditFrequency' ||
          key === 'establishedYear' ||
          key === 'employeeCount' ||
          key === 'backupSupplierId'
        ) {
          request.input(key, sql.Int, value);
        } else if (
          key === 'active' ||
          key === 'criticalSupplier' ||
          key === 'backupSupplierAvailable' ||
          key === 'preferredSupplier' ||
          key === 'iso9001Certified'
        ) {
          request.input(key, sql.Bit, value);
        } else if (key === 'notes' || key === 'description' || key === 'productsServices') {
          request.input(key, sql.NVarChar(sql.MAX), value);
        } else {
          request.input(key, sql.NVarChar, value);
        }
      }
    });

    setClauses.push('updatedAt = GETDATE()');

    if (setClauses.length > 0) {
      await request.query(`
        UPDATE Suppliers
        SET ${setClauses.join(', ')}
        WHERE id = @id
      `);
    }
  }

  /**
   * Update supplier approval status
   */
  static async updateApprovalStatus(
    id: number,
    approvalStatus: string,
    approvedBy?: number
  ): Promise<void> {
    const pool = await getConnection();
    const request = pool.request().input('id', sql.Int, id).input('approvalStatus', sql.NVarChar, approvalStatus);

    let additionalFields = '';
    if (approvalStatus === 'approved' && approvedBy) {
      additionalFields = ', approvedDate = GETDATE(), approvedBy = @approvedBy';
      request.input('approvedBy', sql.Int, approvedBy);
    }

    await request.query(`
      UPDATE Suppliers
      SET approvalStatus = @approvalStatus${additionalFields}, updatedAt = GETDATE()
      WHERE id = @id
    `);
  }

  /**
   * Deactivate supplier (soft delete)
   */
  static async deactivate(id: number, deactivatedBy: number): Promise<void> {
    const pool = await getConnection();

    await pool
      .request()
      .input('id', sql.Int, id)
      .input('deactivatedBy', sql.Int, deactivatedBy)
      .query(`
        UPDATE Suppliers
        SET active = 0, deactivatedAt = GETDATE(), deactivatedBy = @deactivatedBy, updatedAt = GETDATE()
        WHERE id = @id
      `);
  }

  /**
   * Reactivate supplier
   */
  static async reactivate(id: number): Promise<void> {
    const pool = await getConnection();

    await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        UPDATE Suppliers
        SET active = 1, deactivatedAt = NULL, deactivatedBy = NULL, updatedAt = GETDATE()
        WHERE id = @id
      `);
  }

  /**
   * Get unique categories
   */
  static async getCategories(): Promise<string[]> {
    const pool = await getConnection();

    const result = await pool.request().query(`
      SELECT name
      FROM SupplierCategories
      WHERE isActive = 1
      ORDER BY displayOrder, name
    `);

    return result.recordset.map((row: { name: string }) => row.name);
  }

  /**
   * Get unique supplier types
   */
  static async getSupplierTypes(): Promise<string[]> {
    const pool = await getConnection();

    const result = await pool.request().query(`
      SELECT name
      FROM SupplierTypes
      WHERE isActive = 1
      ORDER BY displayOrder, name
    `);

    return result.recordset.map((row: { name: string }) => row.name);
  }

  /**
   * Get unique industries
   */
  static async getIndustries(): Promise<string[]> {
    const pool = await getConnection();

    const result = await pool.request().query(`
      SELECT name
      FROM SupplierIndustries
      WHERE isActive = 1
      ORDER BY displayOrder, name
    `);

    return result.recordset.map((row: { name: string }) => row.name);
  }
}

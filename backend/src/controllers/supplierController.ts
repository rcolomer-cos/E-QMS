import { Response } from 'express';
import { SupplierModel, Supplier, SupplierFilters, SupplierSortOptions } from '../models/SupplierModel';
import { AuthRequest } from '../types';
import { validationResult } from 'express-validator';
import { logCreate, logUpdate, logDelete, AuditActionCategory } from '../services/auditLogService';

/**
 * Create a new supplier
 */
export const createSupplier = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const supplier: Supplier = {
      ...req.body,
      createdBy: req.user.id,
    };

    const supplierId = await SupplierModel.create(supplier);

    // Log audit entry
    await logCreate({
      req,
      actionCategory: AuditActionCategory.SUPPLIER,
      entityType: 'Supplier',
      entityId: supplierId,
      entityIdentifier: supplier.supplierNumber,
      newValues: supplier,
    });

    res.status(201).json({
      message: 'Supplier created successfully',
      id: supplierId,
    });
  } catch (error) {
    console.error('Create supplier error:', error);
    res.status(500).json({ error: 'Failed to create supplier' });
  }
};

/**
 * Get all suppliers with filtering, sorting, and pagination
 */
export const getSuppliers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      category,
      approvalStatus,
      riskLevel,
      minRating,
      maxRating,
      minPerformanceScore,
      maxPerformanceScore,
      qualityGrade,
      complianceStatus,
      criticalSupplier,
      preferredSupplier,
      iso9001Certified,
      supplierType,
      industry,
      active,
      searchTerm,
      sortBy = 'name',
      sortOrder = 'ASC',
      page = '1',
      limit = '50',
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    // Validate pagination parameters
    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      res.status(400).json({
        error: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100.',
      });
      return;
    }

    // Validate sort options
    const validSortFields = ['name', 'supplierNumber', 'performanceScore', 'rating', 'lastEvaluationDate', 'approvedDate'];
    if (sortBy && !validSortFields.includes(sortBy as string)) {
      res.status(400).json({
        error: `Invalid sortBy parameter. Must be one of: ${validSortFields.join(', ')}`,
      });
      return;
    }

    const validSortOrders = ['ASC', 'DESC'];
    if (sortOrder && !validSortOrders.includes(sortOrder as string)) {
      res.status(400).json({
        error: 'Invalid sortOrder parameter. Must be ASC or DESC',
      });
      return;
    }

    // Build filters
    const filters: SupplierFilters = {};
    if (category) filters.category = category as string;
    if (approvalStatus) filters.approvalStatus = approvalStatus as string;
    if (riskLevel) filters.riskLevel = riskLevel as string;
    if (minRating) filters.minRating = parseInt(minRating as string, 10);
    if (maxRating) filters.maxRating = parseInt(maxRating as string, 10);
    if (minPerformanceScore) filters.minPerformanceScore = parseFloat(minPerformanceScore as string);
    if (maxPerformanceScore) filters.maxPerformanceScore = parseFloat(maxPerformanceScore as string);
    if (qualityGrade) filters.qualityGrade = qualityGrade as string;
    if (complianceStatus) filters.complianceStatus = complianceStatus as string;
    if (criticalSupplier !== undefined) filters.criticalSupplier = criticalSupplier === 'true';
    if (preferredSupplier !== undefined) filters.preferredSupplier = preferredSupplier === 'true';
    if (iso9001Certified !== undefined) filters.iso9001Certified = iso9001Certified === 'true';
    if (supplierType) filters.supplierType = supplierType as string;
    if (industry) filters.industry = industry as string;
    if (active !== undefined) filters.active = active === 'true';
    if (searchTerm) filters.searchTerm = searchTerm as string;

    // Sort options
    const sortOptions: SupplierSortOptions = {
      sortBy: sortBy as any,
      sortOrder: sortOrder as 'ASC' | 'DESC',
    };

    const result = await SupplierModel.findAll(filters, sortOptions, pageNum, limitNum);

    res.json(result);
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({ error: 'Failed to retrieve suppliers' });
  }
};

/**
 * Get supplier by ID
 */
export const getSupplierById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const supplier = await SupplierModel.findById(parseInt(id, 10));

    if (!supplier) {
      res.status(404).json({ error: 'Supplier not found' });
      return;
    }

    res.json(supplier);
  } catch (error) {
    console.error('Get supplier by ID error:', error);
    res.status(500).json({ error: 'Failed to retrieve supplier' });
  }
};

/**
 * Get supplier by supplier number
 */
export const getSupplierByNumber = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { supplierNumber } = req.params;
    const supplier = await SupplierModel.findBySupplierNumber(supplierNumber);

    if (!supplier) {
      res.status(404).json({ error: 'Supplier not found' });
      return;
    }

    res.json(supplier);
  } catch (error) {
    console.error('Get supplier by number error:', error);
    res.status(500).json({ error: 'Failed to retrieve supplier' });
  }
};

/**
 * Update supplier
 */
export const updateSupplier = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { id } = req.params;
    const supplierId = parseInt(id, 10);

    const existingSupplier = await SupplierModel.findById(supplierId);
    if (!existingSupplier) {
      res.status(404).json({ error: 'Supplier not found' });
      return;
    }

    const updates = req.body;
    await SupplierModel.update(supplierId, updates);

    // Log audit entry
    if (req.user) {
      await logUpdate({
        req,
        actionCategory: AuditActionCategory.SUPPLIER,
        entityType: 'Supplier',
        entityId: supplierId,
        entityIdentifier: existingSupplier.supplierNumber,
        oldValues: existingSupplier,
        newValues: { ...existingSupplier, ...updates },
      });
    }

    res.json({ message: 'Supplier updated successfully' });
  } catch (error) {
    console.error('Update supplier error:', error);
    res.status(500).json({ error: 'Failed to update supplier' });
  }
};

/**
 * Update supplier approval status
 */
export const updateSupplierApprovalStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { id } = req.params;
    const { approvalStatus } = req.body;
    const supplierId = parseInt(id, 10);

    const existingSupplier = await SupplierModel.findById(supplierId);
    if (!existingSupplier) {
      res.status(404).json({ error: 'Supplier not found' });
      return;
    }

    await SupplierModel.updateApprovalStatus(supplierId, approvalStatus, req.user?.id);

    // Log audit entry
    if (req.user) {
      await logUpdate({
        req,
        actionCategory: AuditActionCategory.SUPPLIER,
        entityType: 'Supplier',
        entityId: supplierId,
        entityIdentifier: existingSupplier.supplierNumber,
        oldValues: { approvalStatus: existingSupplier.approvalStatus },
        newValues: { approvalStatus },
      });
    }

    res.json({ message: 'Supplier approval status updated successfully' });
  } catch (error) {
    console.error('Update supplier approval status error:', error);
    res.status(500).json({ error: 'Failed to update supplier approval status' });
  }
};

/**
 * Deactivate supplier
 */
export const deactivateSupplier = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const supplierId = parseInt(id, 10);

    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const existingSupplier = await SupplierModel.findById(supplierId);
    if (!existingSupplier) {
      res.status(404).json({ error: 'Supplier not found' });
      return;
    }

    await SupplierModel.deactivate(supplierId, req.user.id);

    // Log audit entry
    await logDelete({
      req,
      actionCategory: AuditActionCategory.SUPPLIER,
      entityType: 'Supplier',
      entityId: supplierId,
      entityIdentifier: existingSupplier.supplierNumber,
      oldValues: existingSupplier,
    });

    res.json({ message: 'Supplier deactivated successfully' });
  } catch (error) {
    console.error('Deactivate supplier error:', error);
    res.status(500).json({ error: 'Failed to deactivate supplier' });
  }
};

/**
 * Reactivate supplier
 */
export const reactivateSupplier = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const supplierId = parseInt(id, 10);

    const existingSupplier = await SupplierModel.findById(supplierId);
    if (!existingSupplier) {
      res.status(404).json({ error: 'Supplier not found' });
      return;
    }

    await SupplierModel.reactivate(supplierId);

    // Log audit entry
    if (req.user) {
      await logUpdate({
        req,
        actionCategory: AuditActionCategory.SUPPLIER,
        entityType: 'Supplier',
        entityId: supplierId,
        entityIdentifier: existingSupplier.supplierNumber,
        oldValues: { active: false },
        newValues: { active: true },
      });
    }

    res.json({ message: 'Supplier reactivated successfully' });
  } catch (error) {
    console.error('Reactivate supplier error:', error);
    res.status(500).json({ error: 'Failed to reactivate supplier' });
  }
};

/**
 * Get unique categories
 */
export const getCategories = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const categories = await SupplierModel.getCategories();
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to retrieve categories' });
  }
};

/**
 * Get unique supplier types
 */
export const getSupplierTypes = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const types = await SupplierModel.getSupplierTypes();
    res.json(types);
  } catch (error) {
    console.error('Get supplier types error:', error);
    res.status(500).json({ error: 'Failed to retrieve supplier types' });
  }
};

/**
 * Get unique industries
 */
export const getIndustries = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const industries = await SupplierModel.getIndustries();
    res.json(industries);
  } catch (error) {
    console.error('Get industries error:', error);
    res.status(500).json({ error: 'Failed to retrieve industries' });
  }
};

/**
 * Export suppliers to CSV
 */
export const exportSuppliers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      category,
      approvalStatus,
      riskLevel,
      minRating,
      maxRating,
      minPerformanceScore,
      maxPerformanceScore,
      qualityGrade,
      complianceStatus,
      criticalSupplier,
      preferredSupplier,
      iso9001Certified,
      supplierType,
      industry,
      active,
      searchTerm,
    } = req.query;

    // Build filters (same as getSuppliers)
    const filters: SupplierFilters = {};
    if (category) filters.category = category as string;
    if (approvalStatus) filters.approvalStatus = approvalStatus as string;
    if (riskLevel) filters.riskLevel = riskLevel as string;
    if (minRating) filters.minRating = parseInt(minRating as string, 10);
    if (maxRating) filters.maxRating = parseInt(maxRating as string, 10);
    if (minPerformanceScore) filters.minPerformanceScore = parseFloat(minPerformanceScore as string);
    if (maxPerformanceScore) filters.maxPerformanceScore = parseFloat(maxPerformanceScore as string);
    if (qualityGrade) filters.qualityGrade = qualityGrade as string;
    if (complianceStatus) filters.complianceStatus = complianceStatus as string;
    if (criticalSupplier !== undefined) filters.criticalSupplier = criticalSupplier === 'true';
    if (preferredSupplier !== undefined) filters.preferredSupplier = preferredSupplier === 'true';
    if (iso9001Certified !== undefined) filters.iso9001Certified = iso9001Certified === 'true';
    if (supplierType) filters.supplierType = supplierType as string;
    if (industry) filters.industry = industry as string;
    if (active !== undefined) filters.active = active === 'true';
    if (searchTerm) filters.searchTerm = searchTerm as string;

    // Get all suppliers matching filters (no pagination for export)
    const result = await SupplierModel.findAll(filters, { sortBy: 'name', sortOrder: 'ASC' }, 1, 10000);

    // Build CSV
    const headers = [
      'Supplier Number',
      'Name',
      'Category',
      'Approval Status',
      'Risk Level',
      'Rating',
      'Performance Score',
      'Quality Grade',
      'Compliance Status',
      'Critical Supplier',
      'Preferred Supplier',
      'ISO 9001 Certified',
      'Contact Person',
      'Email',
      'Phone',
      'City',
      'Country',
      'Last Evaluation Date',
      'Next Evaluation Date',
    ];

    const csvRows = [headers.join(',')];

    result.suppliers.forEach((supplier) => {
      const row = [
        supplier.supplierNumber,
        `"${(supplier.name || '').replace(/"/g, '""')}"`,
        supplier.category || '',
        supplier.approvalStatus || '',
        supplier.riskLevel || '',
        supplier.rating || '',
        supplier.performanceScore || '',
        supplier.qualityGrade || '',
        supplier.complianceStatus || '',
        supplier.criticalSupplier ? 'Yes' : 'No',
        supplier.preferredSupplier ? 'Yes' : 'No',
        supplier.iso9001Certified ? 'Yes' : 'No',
        `"${(supplier.contactPerson || '').replace(/"/g, '""')}"`,
        supplier.email || '',
        supplier.phone || '',
        supplier.city || '',
        supplier.country || '',
        supplier.lastEvaluationDate ? new Date(supplier.lastEvaluationDate).toLocaleDateString() : '',
        supplier.nextEvaluationDate ? new Date(supplier.nextEvaluationDate).toLocaleDateString() : '',
      ];
      csvRows.push(row.join(','));
    });

    const csv = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=approved-suppliers.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export suppliers error:', error);
    res.status(500).json({ error: 'Failed to export suppliers' });
  }
};

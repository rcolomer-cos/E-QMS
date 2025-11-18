/**
 * Integration tests for Inspection to NCR creation
 */

import { Response } from 'express';
import { createNCRFromInspection } from '../../controllers/inspectionRecordController';
import { InspectionRecordModel } from '../../models/InspectionRecordModel';
import { NCRModel } from '../../models/NCRModel';
import { AuthRequest } from '../../types';

// Mock the models
jest.mock('../../models/InspectionRecordModel');
jest.mock('../../models/NCRModel');
jest.mock('../../services/auditLogService');

describe('Inspection to NCR Integration', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });

    mockReq = {
      params: { id: '123' },
      body: {},
      user: {
        id: 1,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        roles: ['admin'],
        roleIds: [1],
      },
    };

    mockRes = {
      status: mockStatus,
      json: mockJson,
    };

    jest.clearAllMocks();
  });

  describe('createNCRFromInspection', () => {
    it('should create an NCR from a failed inspection', async () => {
      const mockInspection = {
        id: 123,
        equipmentId: 456,
        inspectionDate: new Date('2024-01-01'),
        inspectedBy: 1,
        inspectionType: 'Safety Inspection',
        result: 'failed',
        findings: 'Critical safety issues found',
        defectsFound: 'Broken guard rail',
        passed: false,
        safetyCompliant: false,
        operationalCompliant: true,
        status: 'completed',
        severity: 'critical',
      };

      const mockNCRId = 789;

      (InspectionRecordModel.findById as jest.Mock).mockResolvedValue(mockInspection);
      (NCRModel.create as jest.Mock).mockResolvedValue(mockNCRId);

      await createNCRFromInspection(mockReq as AuthRequest, mockRes as Response);

      // Verify inspection was fetched
      expect(InspectionRecordModel.findById).toHaveBeenCalledWith(123);

      // Verify NCR was created
      expect(NCRModel.create).toHaveBeenCalled();

      const ncrData = (NCRModel.create as jest.Mock).mock.calls[0][0];
      expect(ncrData).toMatchObject({
        source: 'inspection',
        severity: 'critical',
        reportedBy: 1,
        inspectionRecordId: 123,
      });
      expect(ncrData.title).toContain('Equipment 456');
      expect(ncrData.description).toContain('Safety Inspection');
      expect(ncrData.ncrNumber).toContain('NCR-INS-123');

      // Verify response
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'NCR created successfully from inspection record',
          id: mockNCRId,
        })
      );
    });

    it('should return 404 if inspection record not found', async () => {
      (InspectionRecordModel.findById as jest.Mock).mockResolvedValue(null);

      await createNCRFromInspection(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Inspection record not found' });
    });

    it('should allow custom NCR data', async () => {
      const mockInspection = {
        id: 123,
        equipmentId: 456,
        inspectionDate: new Date('2024-01-01'),
        inspectedBy: 1,
        inspectionType: 'Safety Inspection',
        result: 'failed',
        passed: false,
        status: 'completed',
      };

      mockReq.body = {
        title: 'Custom NCR Title',
        description: 'Custom description',
        category: 'safety',
        severity: 'major',
        assignedTo: 5,
      };

      (InspectionRecordModel.findById as jest.Mock).mockResolvedValue(mockInspection);
      (NCRModel.create as jest.Mock).mockResolvedValue(999);

      await createNCRFromInspection(mockReq as AuthRequest, mockRes as Response);

      const ncrData = (NCRModel.create as jest.Mock).mock.calls[0][0];
      expect(ncrData).toMatchObject({
        title: 'Custom NCR Title',
        description: 'Custom description',
        category: 'safety',
        severity: 'major',
        assignedTo: 5,
      });
    });

    it('should return 401 if user not authenticated', async () => {
      mockReq.user = undefined;

      await createNCRFromInspection(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });
  });
});

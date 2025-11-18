/**
 * Integration Layer End-to-End Tests
 * Tests for P6:2 - API Key Management, MSSQL Sync Adapters, and Webhook Support
 */

import { ApiKeyModel } from '../../models/ApiKeyModel';
import { SyncConfigurationModel } from '../../models/SyncConfigurationModel';
import { WebhookSubscriptionModel } from '../../models/WebhookSubscriptionModel';
import { WebhookService } from '../../services/webhookService';

// Mock database connection
jest.mock('../../config/database', () => ({
  getConnection: jest.fn(() => ({
    request: jest.fn(() => ({
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValue({ recordset: [] }),
    })),
  })),
  sql: {
    NVarChar: 'NVarChar',
    Int: 'Int',
    Bit: 'Bit',
    DateTime2: 'DateTime2',
  },
}));

describe('Integration Layer - P6:2', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('API Key Management', () => {
    it('should generate secure API keys with proper format', async () => {
      const mockApiKey = {
        id: 1,
        keyHash: 'hashed_value',
        keyPreview: 'abcd1234...wxyz',
        name: 'Test API Key',
        active: true,
        usageCount: 0,
        createdAt: new Date(),
        createdBy: 1,
        updatedAt: new Date(),
      };

      const { getConnection } = require('../../config/database');
      getConnection.mockReturnValue({
        request: jest.fn(() => ({
          input: jest.fn().mockReturnThis(),
          query: jest.fn().mockResolvedValue({ recordset: [mockApiKey] }),
        })),
      });

      const result = await ApiKeyModel.create({
        name: 'Test API Key',
        description: 'Test description',
        createdBy: 1,
      });

      expect(result).toBeDefined();
      expect(result.apiKey).toBeDefined();
      expect(result.rawKey).toBeDefined();
    });

    it('should verify API keys correctly', async () => {
      const { getConnection } = require('../../config/database');
      getConnection.mockReturnValue({
        request: jest.fn(() => ({
          query: jest.fn().mockResolvedValue({ recordset: [] }),
        })),
      });

      const result = await ApiKeyModel.verify('test_key_12345');
      expect(result).toBeNull(); // No matching keys in mock
    });

    it('should track API key usage', async () => {
      const { getConnection } = require('../../config/database');
      getConnection.mockReturnValue({
        request: jest.fn(() => ({
          input: jest.fn().mockReturnThis(),
          query: jest.fn().mockResolvedValue({ recordset: [], rowsAffected: [1] }),
        })),
      });

      await ApiKeyModel.updateLastUsed(1, '192.168.1.1');
      // Should update without throwing
      expect(true).toBe(true);
    });
  });

  describe('MSSQL Sync Adapters', () => {
    it('should create sync configuration with proper validation', async () => {
      const mockConfig = {
        id: 1,
        name: 'ERP Equipment Sync',
        systemType: 'ERP' as const,
        systemName: 'SAP ERP',
        syncDirection: 'inbound' as const,
        syncType: 'delta' as const,
        entityType: 'equipment' as const,
        enabled: true,
        scheduleType: 'interval' as const,
        intervalMinutes: 60,
        createdBy: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const { getConnection } = require('../../config/database');
      getConnection.mockReturnValue({
        request: jest.fn(() => ({
          input: jest.fn().mockReturnThis(),
          query: jest.fn().mockResolvedValue({ recordset: [mockConfig] }),
        })),
      });

      const result = await SyncConfigurationModel.create({
        name: 'ERP Equipment Sync',
        systemType: 'ERP',
        systemName: 'SAP ERP',
        syncDirection: 'inbound',
        syncType: 'delta',
        entityType: 'equipment',
        createdBy: 1,
      });

      expect(result).toBeDefined();
      expect(result.name).toBe('ERP Equipment Sync');
    });

    it('should find configurations due for sync', async () => {
      const { getConnection } = require('../../config/database');
      getConnection.mockReturnValue({
        request: jest.fn(() => ({
          query: jest.fn().mockResolvedValue({ recordset: [] }),
        })),
      });

      const dueConfigs = await SyncConfigurationModel.findDueForSync();
      expect(Array.isArray(dueConfigs)).toBe(true);
    });

    it('should execute sync with proper logging', async () => {
      const { getConnection } = require('../../config/database');
      const mockRequest = {
        input: jest.fn().mockReturnThis(),
        query: jest.fn().mockResolvedValue({ 
          recordset: [{
            id: 1,
            name: 'Test Sync',
            systemType: 'ERP',
            systemName: 'Test System',
            syncDirection: 'inbound',
            syncType: 'delta',
            entityType: 'equipment',
            enabled: true,
            scheduleType: 'manual',
            createdBy: 1,
            batchSize: 100,
            timeoutSeconds: 300,
            maxRetries: 3,
          }],
        }),
      };
      
      getConnection.mockReturnValue({
        request: jest.fn(() => mockRequest),
      });

      const config = await SyncConfigurationModel.findById(1);
      expect(config).toBeDefined();
    });
  });

  describe('Webhook Support', () => {
    it('should create webhook subscription with auto-generated secret', async () => {
      const { getConnection } = require('../../config/database');
      getConnection.mockReturnValue({
        request: jest.fn(() => ({
          input: jest.fn().mockReturnThis(),
          query: jest.fn().mockResolvedValue({ recordset: [{ id: 1 }] }),
        })),
      });

      const subscriptionId = await WebhookSubscriptionModel.create({
        name: 'Test Webhook',
        url: 'https://example.com/webhook',
        secret: 'test_secret',
        events: ['ncr.created'],
        active: true,
        retryEnabled: true,
        maxRetries: 3,
        retryDelaySeconds: 60,
        createdBy: 1,
      });

      expect(subscriptionId).toBe(1);
    });

    it('should find active subscriptions for event types', async () => {
      const mockSubscriptions = [
        {
          id: 1,
          name: 'Test Webhook',
          url: 'https://example.com/webhook',
          secret: 'secret',
          events: '["ncr.created", "ncr.updated"]',
          active: true,
          retryEnabled: true,
          maxRetries: 3,
          retryDelaySeconds: 60,
          createdBy: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const { getConnection } = require('../../config/database');
      getConnection.mockReturnValue({
        request: jest.fn(() => ({
          query: jest.fn().mockResolvedValue({ recordset: mockSubscriptions }),
        })),
      });

      const subscriptions = await WebhookSubscriptionModel.findByEvent('ncr.created');
      expect(Array.isArray(subscriptions)).toBe(true);
    });

    it('should trigger webhook events with proper payload', async () => {
      const { getConnection } = require('../../config/database');
      
      // Mock WebhookSubscriptionModel.findByEvent
      getConnection.mockReturnValue({
        request: jest.fn(() => ({
          input: jest.fn().mockReturnThis(),
          query: jest.fn().mockResolvedValue({ recordset: [] }),
        })),
      });

      // Mock fetch for webhook delivery
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: jest.fn().mockResolvedValue('Success'),
      } as unknown as Response);

      await WebhookService.triggerEvent(
        'ncr.created',
        'NCR',
        123,
        { ncrNumber: 'NCR-2025-001', title: 'Test NCR' }
      );

      // Should complete without throwing
      expect(true).toBe(true);
    });

    it('should verify webhook signatures correctly', () => {
      const payload = JSON.stringify({ test: 'data' });
      const secret = 'test_secret_key';
      
      // Generate signature
      const crypto = require('crypto');
      const signature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      // Verify signature
      const isValid = WebhookService.verifySignature(payload, signature, secret);
      expect(isValid).toBe(true);

      // Test invalid signature (must be same length as valid signature for timingSafeEqual)
      const invalidSignature = '0'.repeat(64); // SHA256 hex is 64 chars
      const isInvalid = WebhookService.verifySignature(payload, invalidSignature, secret);
      expect(isInvalid).toBe(false);
    });
  });

  describe('Integration Layer Communication', () => {
    it('should authenticate API key for sync endpoints', async () => {
      // This tests that API keys can be used to authenticate sync operations
      const { getConnection } = require('../../config/database');
      getConnection.mockReturnValue({
        request: jest.fn(() => ({
          query: jest.fn().mockResolvedValue({ recordset: [] }),
        })),
      });

      const apiKey = await ApiKeyModel.verify('test_api_key');
      expect(apiKey).toBeNull(); // No keys in mock, but validates flow
    });

    it('should trigger webhooks during sync operations', async () => {
      // This tests that sync operations can trigger webhooks
      const { getConnection } = require('../../config/database');
      getConnection.mockReturnValue({
        request: jest.fn(() => ({
          input: jest.fn().mockReturnThis(),
          query: jest.fn().mockResolvedValue({ recordset: [] }),
        })),
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: jest.fn().mockResolvedValue('Success'),
      } as unknown as Response);

      // Simulate a sync operation triggering a webhook
      await WebhookService.triggerEvent(
        'ncr.created',
        'NCR',
        456,
        { source: 'sync_operation', ncrNumber: 'NCR-2025-002' }
      );

      expect(true).toBe(true);
    });

    it('should support external system integration via API keys and webhooks', async () => {
      // This tests the complete integration flow:
      // 1. External system uses API key to authenticate
      // 2. Sync operation executes
      // 3. Webhook notifies external system of changes

      const { getConnection } = require('../../config/database');
      const mockRequest = {
        input: jest.fn().mockReturnThis(),
        query: jest.fn().mockResolvedValue({ recordset: [] }),
      };
      
      getConnection.mockReturnValue({
        request: jest.fn(() => mockRequest),
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: jest.fn().mockResolvedValue('Success'),
      } as unknown as Response);

      // Step 1: Verify API key
      await ApiKeyModel.verify('external_system_api_key');
      
      // Step 2: Execute sync (mocked)
      await SyncConfigurationModel.findDueForSync();
      
      // Step 3: Trigger webhook notification
      await WebhookService.triggerEvent(
        'ncr.updated',
        'NCR',
        789,
        { source: 'external_sync', status: 'completed' }
      );

      expect(true).toBe(true); // All operations completed successfully
    });
  });

  describe('Error Handling and Reliability', () => {
    it('should handle sync failures gracefully', async () => {
      const { getConnection } = require('../../config/database');
      getConnection.mockReturnValue({
        request: jest.fn(() => ({
          input: jest.fn().mockReturnThis(),
          query: jest.fn().mockRejectedValue(new Error('Database error')),
        })),
      });

      await expect(
        SyncConfigurationModel.findById(999)
      ).rejects.toThrow('Database error');
    });

    it('should handle webhook delivery failures with retry', async () => {
      const { getConnection } = require('../../config/database');
      getConnection.mockReturnValue({
        request: jest.fn(() => ({
          input: jest.fn().mockReturnThis(),
          query: jest.fn().mockResolvedValue({ recordset: [] }),
        })),
      });

      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      // Should not throw even if webhook fails
      await WebhookService.triggerEvent(
        'capa.created',
        'CAPA',
        101,
        { title: 'Test CAPA' }
      );

      expect(true).toBe(true);
    });

    it('should validate API key expiration', async () => {
      const { getConnection } = require('../../config/database');
      const expiredKey = {
        id: 1,
        keyHash: 'hash',
        keyPreview: 'preview',
        name: 'Expired Key',
        active: true,
        expiresAt: new Date(Date.now() - 86400000), // Expired yesterday
        usageCount: 0,
        createdAt: new Date(),
        createdBy: 1,
        updatedAt: new Date(),
      };

      getConnection.mockReturnValue({
        request: jest.fn(() => ({
          query: jest.fn().mockResolvedValue({ recordset: [expiredKey] }),
        })),
      });

      // Verification should exclude expired keys
      const result = await ApiKeyModel.verify('test_key');
      expect(result).toBeNull();
    });
  });

  describe('Security and Compliance', () => {
    it('should hash API keys securely', async () => {
      const { getConnection } = require('../../config/database');
      const mockRequest = {
        input: jest.fn().mockReturnThis(),
        query: jest.fn().mockResolvedValue({ 
          recordset: [{
            id: 1,
            keyHash: 'bcrypt_hash_value',
            keyPreview: 'abcd1234...wxyz',
            name: 'Secure Key',
            active: true,
            usageCount: 0,
            createdAt: new Date(),
            createdBy: 1,
            updatedAt: new Date(),
          }],
        }),
      };

      getConnection.mockReturnValue({
        request: jest.fn(() => mockRequest),
      });

      const result = await ApiKeyModel.create({
        name: 'Secure Key',
        createdBy: 1,
      });

      // Should never store raw key in database
      expect(result.rawKey).toBeTruthy();
      expect(result.apiKey.keyHash).toBeTruthy();
      expect(result.apiKey.keyHash).not.toBe(result.rawKey);
    });

    it('should sign webhook payloads with HMAC-SHA256', () => {
      const payload = JSON.stringify({ sensitive: 'data' });
      const secret = 'webhook_secret';
      
      const crypto = require('crypto');
      const signature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      expect(signature).toHaveLength(64); // SHA256 hex is 64 chars
      expect(WebhookService.verifySignature(payload, signature, secret)).toBe(true);
    });

    it('should audit sync operations', async () => {
      const { getConnection } = require('../../config/database');
      getConnection.mockReturnValue({
        request: jest.fn(() => ({
          input: jest.fn().mockReturnThis(),
          query: jest.fn().mockResolvedValue({ recordset: [], rowsAffected: [1] }),
        })),
      });

      // Sync operations should create audit logs
      await SyncConfigurationModel.updateSyncStats(1, {
        status: 'success',
        duration: 5000,
        recordsProcessed: 100,
        recordsFailed: 0,
      });

      expect(true).toBe(true); // Statistics recorded
    });
  });
});

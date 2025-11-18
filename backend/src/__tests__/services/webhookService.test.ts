import { WebhookService } from '../../services/webhookService';
import { WebhookSubscriptionModel } from '../../models/WebhookSubscriptionModel';
import { WebhookDeliveryModel } from '../../models/WebhookDeliveryModel';

// Mock the models
jest.mock('../../models/WebhookSubscriptionModel');
jest.mock('../../models/WebhookDeliveryModel');

// Mock fetch
global.fetch = jest.fn();

describe('WebhookService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('triggerEvent', () => {
    it('should trigger webhooks for subscribed events', async () => {
      const mockSubscriptions = [
        {
          id: 1,
          name: 'Test Webhook',
          url: 'https://example.com/webhook',
          secret: 'test-secret',
          events: ['ncr.created'],
          active: true,
          retryEnabled: true,
          maxRetries: 3,
          retryDelaySeconds: 60,
          createdBy: 1,
        },
      ];

      (WebhookSubscriptionModel.findByEvent as jest.Mock).mockResolvedValue(mockSubscriptions);
      (WebhookDeliveryModel.create as jest.Mock).mockResolvedValue(1);
      (WebhookSubscriptionModel.updateLastTriggered as jest.Mock).mockResolvedValue(undefined);
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: jest.fn().mockResolvedValue('Success'),
      });

      await WebhookService.triggerEvent('ncr.created', 'NCR', 123, {
        id: 123,
        ncrNumber: 'NCR-001',
        title: 'Test NCR',
      });

      expect(WebhookSubscriptionModel.findByEvent).toHaveBeenCalledWith('ncr.created');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.com/webhook',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Webhook-Event': 'ncr.created',
          }),
        })
      );
      expect(WebhookDeliveryModel.create).toHaveBeenCalled();
    });

    it('should not trigger webhooks if no subscriptions exist', async () => {
      (WebhookSubscriptionModel.findByEvent as jest.Mock).mockResolvedValue([]);

      await WebhookService.triggerEvent('ncr.created', 'NCR', 123, {
        id: 123,
        ncrNumber: 'NCR-001',
      });

      expect(global.fetch).not.toHaveBeenCalled();
      expect(WebhookDeliveryModel.create).not.toHaveBeenCalled();
    });

    it('should handle webhook delivery failures', async () => {
      const mockSubscriptions = [
        {
          id: 1,
          name: 'Test Webhook',
          url: 'https://example.com/webhook',
          secret: 'test-secret',
          events: ['ncr.created'],
          active: true,
          retryEnabled: true,
          maxRetries: 3,
          retryDelaySeconds: 60,
          createdBy: 1,
        },
      ];

      (WebhookSubscriptionModel.findByEvent as jest.Mock).mockResolvedValue(mockSubscriptions);
      (WebhookDeliveryModel.create as jest.Mock).mockResolvedValue(1);
      (WebhookSubscriptionModel.updateLastTriggered as jest.Mock).mockResolvedValue(undefined);
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: jest.fn().mockResolvedValue('Error'),
      });

      await WebhookService.triggerEvent('ncr.created', 'NCR', 123, {
        id: 123,
        ncrNumber: 'NCR-001',
      });

      expect(WebhookDeliveryModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'retrying',
          responseStatus: 500,
        })
      );
    });

    it('should handle network errors', async () => {
      const mockSubscriptions = [
        {
          id: 1,
          name: 'Test Webhook',
          url: 'https://example.com/webhook',
          secret: 'test-secret',
          events: ['ncr.created'],
          active: true,
          retryEnabled: true,
          maxRetries: 3,
          retryDelaySeconds: 60,
          createdBy: 1,
        },
      ];

      (WebhookSubscriptionModel.findByEvent as jest.Mock).mockResolvedValue(mockSubscriptions);
      (WebhookDeliveryModel.create as jest.Mock).mockResolvedValue(1);
      
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await WebhookService.triggerEvent('ncr.created', 'NCR', 123, {
        id: 123,
        ncrNumber: 'NCR-001',
      });

      expect(WebhookDeliveryModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'retrying',
          errorMessage: 'Network error',
        })
      );
    });
  });

  describe('processRetries', () => {
    it('should process pending retries', async () => {
      const mockDeliveries = [
        {
          id: 1,
          subscriptionId: 1,
          eventType: 'ncr.created',
          entityType: 'NCR',
          entityId: 123,
          requestUrl: 'https://example.com/webhook',
          requestPayload: { test: true },
          attempt: 1,
          maxAttempts: 3,
          status: 'retrying',
        },
      ];

      const mockSubscription = {
        id: 1,
        name: 'Test Webhook',
        url: 'https://example.com/webhook',
        secret: 'test-secret',
        events: ['ncr.created'],
        active: true,
        retryEnabled: true,
        maxRetries: 3,
        retryDelaySeconds: 60,
        createdBy: 1,
      };

      (WebhookDeliveryModel.findPendingRetries as jest.Mock).mockResolvedValue(mockDeliveries);
      (WebhookSubscriptionModel.findById as jest.Mock).mockResolvedValue(mockSubscription);
      (WebhookDeliveryModel.update as jest.Mock).mockResolvedValue(undefined);
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: jest.fn().mockResolvedValue('Success'),
      });

      await WebhookService.processRetries();

      expect(WebhookDeliveryModel.findPendingRetries).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalled();
      expect(WebhookDeliveryModel.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          status: 'success',
          attempt: 2,
        })
      );
    });

    it('should mark delivery as failed after max retries', async () => {
      const mockDeliveries = [
        {
          id: 1,
          subscriptionId: 1,
          eventType: 'ncr.created',
          entityType: 'NCR',
          entityId: 123,
          requestUrl: 'https://example.com/webhook',
          requestPayload: { test: true },
          attempt: 3,
          maxAttempts: 3,
          status: 'retrying',
        },
      ];

      const mockSubscription = {
        id: 1,
        name: 'Test Webhook',
        url: 'https://example.com/webhook',
        secret: 'test-secret',
        events: ['ncr.created'],
        active: true,
        retryEnabled: true,
        maxRetries: 3,
        retryDelaySeconds: 60,
        createdBy: 1,
      };

      (WebhookDeliveryModel.findPendingRetries as jest.Mock).mockResolvedValue(mockDeliveries);
      (WebhookSubscriptionModel.findById as jest.Mock).mockResolvedValue(mockSubscription);
      (WebhookDeliveryModel.update as jest.Mock).mockResolvedValue(undefined);
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: jest.fn().mockResolvedValue('Error'),
      });

      await WebhookService.processRetries();

      expect(WebhookDeliveryModel.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          status: 'failed',
          attempt: 4,
        })
      );
    });
  });

  describe('testWebhook', () => {
    it('should test a webhook subscription successfully', async () => {
      const mockSubscription = {
        id: 1,
        name: 'Test Webhook',
        url: 'https://example.com/webhook',
        secret: 'test-secret',
        events: ['ncr.created'],
        active: true,
        retryEnabled: true,
        maxRetries: 3,
        retryDelaySeconds: 60,
        createdBy: 1,
      };

      (WebhookSubscriptionModel.findById as jest.Mock).mockResolvedValue(mockSubscription);
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: jest.fn().mockResolvedValue('Success'),
      });

      const result = await WebhookService.testWebhook(1);

      expect(result.success).toBe(true);
      expect(result.responseStatus).toBe(200);
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should return error if subscription not found', async () => {
      (WebhookSubscriptionModel.findById as jest.Mock).mockResolvedValue(null);

      const result = await WebhookService.testWebhook(999);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Subscription not found');
    });
  });

  describe('verifySignature', () => {
    it('should verify valid webhook signature', () => {
      const payload = '{"test": true}';
      const secret = 'test-secret';
      
      // Generate a valid signature
      const crypto = require('crypto');
      const signature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      const result = WebhookService.verifySignature(payload, signature, secret);

      expect(result).toBe(true);
    });

    it('should reject invalid webhook signature', () => {
      const payload = '{"test": true}';
      const secret = 'test-secret';
      const crypto = require('crypto');
      
      // Generate a valid signature with different payload to get wrong signature
      const invalidSignature = crypto
        .createHmac('sha256', secret)
        .update('{"different": true}')
        .digest('hex');

      const result = WebhookService.verifySignature(payload, invalidSignature, secret);

      expect(result).toBe(false);
    });
  });
});

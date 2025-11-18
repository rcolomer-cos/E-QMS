import { WebhookSubscriptionModel, WebhookSubscription } from '../../models/WebhookSubscriptionModel';
import { getConnection } from '../../config/database';

// Mock database connection
jest.mock('../../config/database');

describe('WebhookSubscriptionModel', () => {
  let mockRequest: jest.Mock;
  let mockQuery: jest.Mock;
  let mockInput: jest.Mock;

  beforeEach(() => {
    mockQuery = jest.fn();
    mockInput = jest.fn().mockReturnThis();
    mockRequest = jest.fn().mockReturnValue({
      input: mockInput,
      query: mockQuery,
    });
    (getConnection as jest.Mock).mockResolvedValue({
      request: mockRequest,
    });
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a webhook subscription successfully', async () => {
      const subscription: WebhookSubscription = {
        name: 'Test Webhook',
        url: 'https://example.com/webhook',
        secret: 'test-secret-key',
        events: ['ncr.created', 'ncr.updated'],
        active: true,
        retryEnabled: true,
        maxRetries: 3,
        retryDelaySeconds: 60,
        createdBy: 1,
      };

      mockQuery.mockResolvedValue({
        recordset: [{ id: 123 }],
      });

      const result = await WebhookSubscriptionModel.create(subscription);

      expect(result).toBe(123);
      expect(mockRequest).toHaveBeenCalled();
      expect(mockQuery).toHaveBeenCalled();
      expect(mockInput).toHaveBeenCalledWith('name', expect.anything(), subscription.name);
      expect(mockInput).toHaveBeenCalledWith('url', expect.anything(), subscription.url);
      expect(mockInput).toHaveBeenCalledWith('events', expect.anything(), JSON.stringify(subscription.events));
    });
  });

  describe('findById', () => {
    it('should retrieve a webhook subscription by ID', async () => {
      const mockSubscription = {
        id: 1,
        name: 'Test Webhook',
        url: 'https://example.com/webhook',
        secret: 'test-secret-key',
        events: '["ncr.created", "ncr.updated"]',
        active: true,
        retryEnabled: true,
        maxRetries: 3,
        retryDelaySeconds: 60,
        customHeaders: null,
        createdBy: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockQuery.mockResolvedValue({
        recordset: [mockSubscription],
      });

      const result = await WebhookSubscriptionModel.findById(1);

      expect(result).toBeDefined();
      expect(result?.id).toBe(1);
      expect(result?.events).toEqual(['ncr.created', 'ncr.updated']);
      expect(mockInput).toHaveBeenCalledWith('id', expect.anything(), 1);
    });

    it('should return null if subscription not found', async () => {
      mockQuery.mockResolvedValue({
        recordset: [],
      });

      const result = await WebhookSubscriptionModel.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should retrieve all webhook subscriptions', async () => {
      const mockSubscriptions = [
        {
          id: 1,
          name: 'Webhook 1',
          url: 'https://example.com/webhook1',
          secret: 'secret1',
          events: '["ncr.created"]',
          active: true,
          retryEnabled: true,
          maxRetries: 3,
          retryDelaySeconds: 60,
          createdBy: 1,
        },
        {
          id: 2,
          name: 'Webhook 2',
          url: 'https://example.com/webhook2',
          secret: 'secret2',
          events: '["capa.created"]',
          active: false,
          retryEnabled: false,
          maxRetries: 5,
          retryDelaySeconds: 120,
          createdBy: 1,
        },
      ];

      mockQuery.mockResolvedValue({
        recordset: mockSubscriptions,
      });

      const result = await WebhookSubscriptionModel.findAll(false);

      expect(result).toHaveLength(2);
      expect(result[0].events).toEqual(['ncr.created']);
      expect(result[1].events).toEqual(['capa.created']);
    });

    it('should retrieve only active subscriptions when activeOnly is true', async () => {
      const mockSubscriptions = [
        {
          id: 1,
          name: 'Active Webhook',
          url: 'https://example.com/webhook',
          secret: 'secret',
          events: '["ncr.created"]',
          active: true,
          retryEnabled: true,
          maxRetries: 3,
          retryDelaySeconds: 60,
          createdBy: 1,
        },
      ];

      mockQuery.mockResolvedValue({
        recordset: mockSubscriptions,
      });

      const result = await WebhookSubscriptionModel.findAll(true);

      expect(result).toHaveLength(1);
      expect(result[0].active).toBe(true);
    });
  });

  describe('update', () => {
    it('should update a webhook subscription', async () => {
      const updates = {
        name: 'Updated Webhook',
        active: false,
      };

      mockQuery.mockResolvedValue({ rowsAffected: [1] });

      await WebhookSubscriptionModel.update(1, updates);

      expect(mockRequest).toHaveBeenCalled();
      expect(mockInput).toHaveBeenCalledWith('id', expect.anything(), 1);
      expect(mockInput).toHaveBeenCalledWith('name', expect.anything(), updates.name);
      expect(mockInput).toHaveBeenCalledWith('active', expect.anything(), updates.active);
    });

    it('should not update if no changes provided', async () => {
      await WebhookSubscriptionModel.update(1, {});

      expect(mockQuery).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete a webhook subscription', async () => {
      mockQuery.mockResolvedValue({ rowsAffected: [1] });

      await WebhookSubscriptionModel.delete(1);

      expect(mockRequest).toHaveBeenCalled();
      expect(mockInput).toHaveBeenCalledWith('id', expect.anything(), 1);
      expect(mockQuery).toHaveBeenCalled();
    });
  });

  describe('updateLastTriggered', () => {
    it('should update the last triggered timestamp', async () => {
      mockQuery.mockResolvedValue({ rowsAffected: [1] });

      await WebhookSubscriptionModel.updateLastTriggered(1);

      expect(mockRequest).toHaveBeenCalled();
      expect(mockInput).toHaveBeenCalledWith('id', expect.anything(), 1);
      expect(mockQuery).toHaveBeenCalled();
    });
  });
});

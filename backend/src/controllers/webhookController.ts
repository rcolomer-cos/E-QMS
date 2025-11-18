import { Response } from 'express';
import { AuthRequest } from '../types';
import { validationResult } from 'express-validator';
import { WebhookSubscriptionModel, WebhookSubscription } from '../models/WebhookSubscriptionModel';
import { WebhookDeliveryModel } from '../models/WebhookDeliveryModel';
import { WebhookService } from '../services/webhookService';
import crypto from 'crypto';

/**
 * Create a new webhook subscription
 */
export const createWebhookSubscription = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { name, url, events, retryEnabled, maxRetries, retryDelaySeconds, customHeaders } = req.body;

    // Generate a random secret for the webhook
    const secret = crypto.randomBytes(32).toString('hex');

    const subscription: WebhookSubscription = {
      name,
      url,
      secret,
      events: Array.isArray(events) ? events : [events],
      active: true,
      retryEnabled: retryEnabled !== undefined ? retryEnabled : true,
      maxRetries: maxRetries || 3,
      retryDelaySeconds: retryDelaySeconds || 60,
      customHeaders: customHeaders || undefined,
      createdBy: req.user.id,
    };

    const subscriptionId = await WebhookSubscriptionModel.create(subscription);

    res.status(201).json({
      message: 'Webhook subscription created successfully',
      id: subscriptionId,
      secret, // Return the secret only on creation
    });
  } catch (error) {
    console.error('Create webhook subscription error:', error);
    res.status(500).json({ error: 'Failed to create webhook subscription' });
  }
};

/**
 * Get all webhook subscriptions
 */
export const getWebhookSubscriptions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { active } = req.query;
    const activeOnly = active === 'true';

    const subscriptions = await WebhookSubscriptionModel.findAll(activeOnly);

    // Remove secrets from response
    const sanitizedSubscriptions = subscriptions.map(sub => ({
      ...sub,
      secret: '***REDACTED***',
    }));

    res.json(sanitizedSubscriptions);
  } catch (error) {
    console.error('Get webhook subscriptions error:', error);
    res.status(500).json({ error: 'Failed to get webhook subscriptions' });
  }
};

/**
 * Get a webhook subscription by ID
 */
export const getWebhookSubscriptionById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const subscription = await WebhookSubscriptionModel.findById(parseInt(id, 10));
    if (!subscription) {
      res.status(404).json({ error: 'Webhook subscription not found' });
      return;
    }

    // Remove secret from response
    const sanitizedSubscription = {
      ...subscription,
      secret: '***REDACTED***',
    };

    res.json(sanitizedSubscription);
  } catch (error) {
    console.error('Get webhook subscription error:', error);
    res.status(500).json({ error: 'Failed to get webhook subscription' });
  }
};

/**
 * Update a webhook subscription
 */
export const updateWebhookSubscription = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { id } = req.params;
    const updates = req.body;

    // Check if subscription exists
    const subscription = await WebhookSubscriptionModel.findById(parseInt(id, 10));
    if (!subscription) {
      res.status(404).json({ error: 'Webhook subscription not found' });
      return;
    }

    // Don't allow updating the secret through this endpoint
    delete updates.secret;
    delete updates.createdBy;
    delete updates.createdAt;

    await WebhookSubscriptionModel.update(parseInt(id, 10), updates);

    res.json({ message: 'Webhook subscription updated successfully' });
  } catch (error) {
    console.error('Update webhook subscription error:', error);
    res.status(500).json({ error: 'Failed to update webhook subscription' });
  }
};

/**
 * Delete a webhook subscription
 */
export const deleteWebhookSubscription = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if subscription exists
    const subscription = await WebhookSubscriptionModel.findById(parseInt(id, 10));
    if (!subscription) {
      res.status(404).json({ error: 'Webhook subscription not found' });
      return;
    }

    await WebhookSubscriptionModel.delete(parseInt(id, 10));

    res.json({ message: 'Webhook subscription deleted successfully' });
  } catch (error) {
    console.error('Delete webhook subscription error:', error);
    res.status(500).json({ error: 'Failed to delete webhook subscription' });
  }
};

/**
 * Regenerate webhook subscription secret
 */
export const regenerateWebhookSecret = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if subscription exists
    const subscription = await WebhookSubscriptionModel.findById(parseInt(id, 10));
    if (!subscription) {
      res.status(404).json({ error: 'Webhook subscription not found' });
      return;
    }

    // Generate a new secret
    const newSecret = crypto.randomBytes(32).toString('hex');

    await WebhookSubscriptionModel.update(parseInt(id, 10), { secret: newSecret });

    res.json({
      message: 'Webhook secret regenerated successfully',
      secret: newSecret, // Return the new secret
    });
  } catch (error) {
    console.error('Regenerate webhook secret error:', error);
    res.status(500).json({ error: 'Failed to regenerate webhook secret' });
  }
};

/**
 * Test a webhook subscription
 */
export const testWebhookSubscription = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if subscription exists
    const subscription = await WebhookSubscriptionModel.findById(parseInt(id, 10));
    if (!subscription) {
      res.status(404).json({ error: 'Webhook subscription not found' });
      return;
    }

    const result = await WebhookService.testWebhook(parseInt(id, 10));

    res.json(result);
  } catch (error) {
    console.error('Test webhook subscription error:', error);
    res.status(500).json({ error: 'Failed to test webhook subscription' });
  }
};

/**
 * Get webhook deliveries for a subscription
 */
export const getWebhookDeliveries = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, limit = '50' } = req.query;

    // Check if subscription exists
    const subscription = await WebhookSubscriptionModel.findById(parseInt(id, 10));
    if (!subscription) {
      res.status(404).json({ error: 'Webhook subscription not found' });
      return;
    }

    const deliveries = await WebhookDeliveryModel.findBySubscription(
      parseInt(id, 10),
      {
        status: status as any,
        limit: parseInt(limit as string, 10),
      }
    );

    res.json(deliveries);
  } catch (error) {
    console.error('Get webhook deliveries error:', error);
    res.status(500).json({ error: 'Failed to get webhook deliveries' });
  }
};

/**
 * Get webhook delivery statistics for a subscription
 */
export const getWebhookStatistics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { days = '7' } = req.query;

    // Check if subscription exists
    const subscription = await WebhookSubscriptionModel.findById(parseInt(id, 10));
    if (!subscription) {
      res.status(404).json({ error: 'Webhook subscription not found' });
      return;
    }

    const statistics = await WebhookDeliveryModel.getStatistics(
      parseInt(id, 10),
      parseInt(days as string, 10)
    );

    res.json(statistics);
  } catch (error) {
    console.error('Get webhook statistics error:', error);
    res.status(500).json({ error: 'Failed to get webhook statistics' });
  }
};

/**
 * Retry failed webhook delivery
 */
export const retryWebhookDelivery = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { deliveryId } = req.params;

    const delivery = await WebhookDeliveryModel.findById(parseInt(deliveryId, 10));
    if (!delivery) {
      res.status(404).json({ error: 'Webhook delivery not found' });
      return;
    }

    // Reset the delivery to retry immediately
    await WebhookDeliveryModel.update(parseInt(deliveryId, 10), {
      status: 'retrying',
      nextRetryAt: new Date(),
    });

    // Trigger retry process
    await WebhookService.processRetries();

    res.json({ message: 'Webhook delivery retry initiated' });
  } catch (error) {
    console.error('Retry webhook delivery error:', error);
    res.status(500).json({ error: 'Failed to retry webhook delivery' });
  }
};

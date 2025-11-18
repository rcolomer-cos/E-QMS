import crypto from 'crypto';
import { WebhookSubscriptionModel, WebhookSubscription } from '../models/WebhookSubscriptionModel';
import { WebhookDeliveryModel, WebhookDelivery, WebhookEntityType } from '../models/WebhookDeliveryModel';

export type WebhookEventType = 
  | 'ncr.created' 
  | 'ncr.updated' 
  | 'ncr.closed'
  | 'capa.created'
  | 'capa.updated'
  | 'capa.closed';

export interface WebhookPayload {
  event: WebhookEventType;
  timestamp: string;
  data: Record<string, unknown>;
}

export class WebhookService {
  /**
   * Trigger webhook for an event
   */
  static async triggerEvent(
    eventType: WebhookEventType,
    entityType: WebhookEntityType,
    entityId: number,
    data: Record<string, unknown>
  ): Promise<void> {
    try {
      // Get active subscriptions for this event
      const subscriptions = await WebhookSubscriptionModel.findByEvent(eventType);

      if (subscriptions.length === 0) {
        console.log(`No active subscriptions for event: ${eventType}`);
        return;
      }

      // Prepare payload
      const payload: WebhookPayload = {
        event: eventType,
        timestamp: new Date().toISOString(),
        data,
      };

      // Trigger webhooks for each subscription
      const deliveryPromises = subscriptions.map(subscription =>
        this.deliverWebhook(subscription, eventType, entityType, entityId, payload)
      );

      await Promise.allSettled(deliveryPromises);
    } catch (error) {
      console.error('Error triggering webhook event:', error);
      // Don't throw - webhook failures should not block the main operation
    }
  }

  /**
   * Deliver webhook to a subscription
   */
  private static async deliverWebhook(
    subscription: WebhookSubscription,
    eventType: WebhookEventType,
    entityType: WebhookEntityType,
    entityId: number,
    payload: WebhookPayload
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // Generate signature for the payload
      const signature = this.generateSignature(JSON.stringify(payload), subscription.secret);

      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': eventType,
        'User-Agent': 'E-QMS-Webhook/1.0',
        ...subscription.customHeaders,
      };

      // Make HTTP request
      const response = await fetch(subscription.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      const responseTime = Date.now() - startTime;
      const responseBody = await response.text().catch(() => '');

      // Create delivery log
      const delivery: WebhookDelivery = {
        subscriptionId: subscription.id!,
        eventType,
        entityType,
        entityId,
        requestUrl: subscription.url,
        requestPayload: payload,
        requestHeaders: headers,
        responseStatus: response.status,
        responseBody: responseBody.substring(0, 5000), // Limit response body size
        responseTime,
        attempt: 1,
        maxAttempts: subscription.maxRetries,
        status: response.ok ? 'success' : 'failed',
        deliveredAt: response.ok ? new Date() : undefined,
        errorMessage: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
      };

      // Schedule retry if failed and retry is enabled
      if (!response.ok && subscription.retryEnabled && subscription.maxRetries > 0) {
        delivery.status = 'retrying';
        delivery.nextRetryAt = new Date(Date.now() + subscription.retryDelaySeconds * 1000);
      }

      await WebhookDeliveryModel.create(delivery);

      // Update subscription's last triggered timestamp
      await WebhookSubscriptionModel.updateLastTriggered(subscription.id!);

      if (response.ok) {
        console.log(`Webhook delivered successfully: ${eventType} to ${subscription.name}`);
      } else {
        console.error(`Webhook delivery failed: ${eventType} to ${subscription.name} - Status: ${response.status}`);
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Create failed delivery log
      const delivery: WebhookDelivery = {
        subscriptionId: subscription.id!,
        eventType,
        entityType,
        entityId,
        requestUrl: subscription.url,
        requestPayload: payload,
        responseTime,
        attempt: 1,
        maxAttempts: subscription.maxRetries,
        status: 'failed',
        errorMessage,
      };

      // Schedule retry if retry is enabled
      if (subscription.retryEnabled && subscription.maxRetries > 0) {
        delivery.status = 'retrying';
        delivery.nextRetryAt = new Date(Date.now() + subscription.retryDelaySeconds * 1000);
      }

      await WebhookDeliveryModel.create(delivery);

      console.error(`Webhook delivery error: ${eventType} to ${subscription.name}`, error);
    }
  }

  /**
   * Process pending retries
   */
  static async processRetries(): Promise<void> {
    try {
      const pendingRetries = await WebhookDeliveryModel.findPendingRetries();

      if (pendingRetries.length === 0) {
        return;
      }

      console.log(`Processing ${pendingRetries.length} pending webhook retries...`);

      for (const delivery of pendingRetries) {
        await this.retryDelivery(delivery);
      }
    } catch (error) {
      console.error('Error processing webhook retries:', error);
    }
  }

  /**
   * Retry a failed webhook delivery
   */
  private static async retryDelivery(delivery: WebhookDelivery): Promise<void> {
    const startTime = Date.now();

    try {
      // Get the subscription
      const subscription = await WebhookSubscriptionModel.findById(delivery.subscriptionId);
      
      if (!subscription || !subscription.active) {
        // Mark as failed if subscription is no longer active
        await WebhookDeliveryModel.update(delivery.id!, {
          status: 'failed',
          errorMessage: 'Subscription no longer active',
        });
        return;
      }

      // Generate signature for the payload
      const signature = this.generateSignature(
        JSON.stringify(delivery.requestPayload),
        subscription.secret
      );

      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': delivery.eventType,
        'X-Webhook-Retry-Attempt': delivery.attempt.toString(),
        'User-Agent': 'E-QMS-Webhook/1.0',
        ...subscription.customHeaders,
      };

      // Make HTTP request
      const response = await fetch(subscription.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(delivery.requestPayload),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      const responseTime = Date.now() - startTime;
      const responseBody = await response.text().catch(() => '');

      const updates: Partial<WebhookDelivery> = {
        responseStatus: response.status,
        responseBody: responseBody.substring(0, 5000),
        responseTime,
        attempt: delivery.attempt + 1,
      };

      if (response.ok) {
        // Success
        updates.status = 'success';
        updates.deliveredAt = new Date();
        console.log(`Webhook retry succeeded: ${delivery.eventType} to ${subscription.name}`);
      } else {
        // Check if we should retry again
        if (delivery.attempt + 1 >= delivery.maxAttempts) {
          // Max retries reached
          updates.status = 'failed';
          updates.errorMessage = `Max retries reached. HTTP ${response.status}: ${response.statusText}`;
          console.error(`Webhook retry failed (max retries): ${delivery.eventType} to ${subscription.name}`);
        } else {
          // Schedule another retry with exponential backoff
          updates.status = 'retrying';
          const backoffMultiplier = Math.pow(2, delivery.attempt); // Exponential backoff
          updates.nextRetryAt = new Date(
            Date.now() + subscription.retryDelaySeconds * 1000 * backoffMultiplier
          );
          updates.errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          console.error(`Webhook retry failed, scheduling next retry: ${delivery.eventType} to ${subscription.name}`);
        }
      }

      await WebhookDeliveryModel.update(delivery.id!, updates);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      const updates: Partial<WebhookDelivery> = {
        responseTime,
        attempt: delivery.attempt + 1,
        errorMessage,
      };

      if (delivery.attempt + 1 >= delivery.maxAttempts) {
        // Max retries reached
        updates.status = 'failed';
        console.error(`Webhook retry failed (max retries): ${delivery.eventType}`, error);
      } else {
        // Schedule another retry with exponential backoff
        updates.status = 'retrying';
        const subscription = await WebhookSubscriptionModel.findById(delivery.subscriptionId);
        const backoffMultiplier = Math.pow(2, delivery.attempt);
        updates.nextRetryAt = new Date(
          Date.now() + (subscription?.retryDelaySeconds || 60) * 1000 * backoffMultiplier
        );
        console.error(`Webhook retry error, scheduling next retry: ${delivery.eventType}`, error);
      }

      await WebhookDeliveryModel.update(delivery.id!, updates);
    }
  }

  /**
   * Generate HMAC signature for webhook payload
   */
  private static generateSignature(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Verify webhook signature
   */
  static verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Test a webhook subscription
   */
  static async testWebhook(subscriptionId: number): Promise<{
    success: boolean;
    message: string;
    responseStatus?: number;
    responseTime?: number;
  }> {
    const startTime = Date.now();

    try {
      const subscription = await WebhookSubscriptionModel.findById(subscriptionId);
      
      if (!subscription) {
        return {
          success: false,
          message: 'Subscription not found',
        };
      }

      // Prepare test payload
      const payload: WebhookPayload = {
        event: 'ncr.created',
        timestamp: new Date().toISOString(),
        data: {
          test: true,
          message: 'This is a test webhook from E-QMS',
        },
      };

      // Generate signature
      const signature = this.generateSignature(JSON.stringify(payload), subscription.secret);

      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': 'test',
        'User-Agent': 'E-QMS-Webhook/1.0',
        ...subscription.customHeaders,
      };

      // Make HTTP request
      const response = await fetch(subscription.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000),
      });

      const responseTime = Date.now() - startTime;

      return {
        success: response.ok,
        message: response.ok 
          ? `Test webhook delivered successfully (${response.status})` 
          : `Test webhook failed: HTTP ${response.status} - ${response.statusText}`,
        responseStatus: response.status,
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        success: false,
        message: `Test webhook failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime,
      };
    }
  }
}

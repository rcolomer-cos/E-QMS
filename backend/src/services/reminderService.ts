import { EquipmentModel } from '../models/EquipmentModel';
import { CAPAModel } from '../models/CAPAModel';
import { TrainingCertificateService } from './trainingCertificateService';
import { ReminderLogModel } from '../models/ReminderLogModel';

export interface ReminderResult {
  success: boolean;
  itemsProcessed: number;
  itemsNotified: number;
  error?: string;
  details?: Record<string, unknown>;
}

export interface ReminderConfig {
  trainingExpiryDays?: number; // Days before expiry to send reminder
  equipmentCalibrationDays?: number; // Days before calibration due
  equipmentMaintenanceDays?: number; // Days before maintenance due
  capaDeadlineDays?: number; // Days before CAPA deadline
}

export class ReminderService {
  private static defaultConfig: ReminderConfig = {
    trainingExpiryDays: 30,
    equipmentCalibrationDays: 30,
    equipmentMaintenanceDays: 30,
    capaDeadlineDays: 7,
  };

  /**
   * Process training expiry reminders
   */
  static async processTrainingExpiryReminders(config?: ReminderConfig): Promise<ReminderResult> {
    const startTime = Date.now();
    const daysThreshold = config?.trainingExpiryDays || this.defaultConfig.trainingExpiryDays || 30;
    
    try {
      // Get expiring certificates
      const expiringCertificates = await TrainingCertificateService.getExpiringCertificates(
        daysThreshold,
        true // Include expired
      );

      // Get expiring attendee records
      const expiringAttendees = await TrainingCertificateService.getExpiringAttendeeRecords(
        daysThreshold,
        true // Include expired
      );

      const totalItems = expiringCertificates.length + expiringAttendees.length;
      
      // In a real implementation, this would send actual notifications
      // For now, we're just counting what would be notified
      const itemsNotified = totalItems;

      // Log the execution
      await ReminderLogModel.create({
        reminderType: 'training_expiry',
        status: 'success',
        itemsProcessed: totalItems,
        itemsNotified: itemsNotified,
        executionDurationMs: Date.now() - startTime,
        configuration: JSON.stringify({ daysThreshold }),
        details: JSON.stringify({
          expiringCertificates: expiringCertificates.length,
          expiringAttendees: expiringAttendees.length,
        }),
      });

      return {
        success: true,
        itemsProcessed: totalItems,
        itemsNotified: itemsNotified,
        details: {
          expiringCertificates: expiringCertificates.length,
          expiringAttendees: expiringAttendees.length,
          daysThreshold,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Log the failure
      await ReminderLogModel.create({
        reminderType: 'training_expiry',
        status: 'failed',
        itemsProcessed: 0,
        itemsNotified: 0,
        errorMessage,
        executionDurationMs: Date.now() - startTime,
        configuration: JSON.stringify({ daysThreshold }),
      });

      return {
        success: false,
        itemsProcessed: 0,
        itemsNotified: 0,
        error: errorMessage,
      };
    }
  }

  /**
   * Process equipment calibration reminders
   */
  static async processEquipmentCalibrationReminders(config?: ReminderConfig): Promise<ReminderResult> {
    const startTime = Date.now();
    const daysThreshold = config?.equipmentCalibrationDays || this.defaultConfig.equipmentCalibrationDays || 30;
    
    try {
      // Get equipment with upcoming calibration
      const upcomingCalibration = await EquipmentModel.findCalibrationDue(daysThreshold);
      
      // Get overdue calibration
      const overdueCalibration = await EquipmentModel.getOverdueCalibration();
      
      const totalItems = upcomingCalibration.length + overdueCalibration.length;
      const itemsNotified = totalItems;

      // Log the execution
      await ReminderLogModel.create({
        reminderType: 'equipment_calibration',
        status: 'success',
        itemsProcessed: totalItems,
        itemsNotified: itemsNotified,
        executionDurationMs: Date.now() - startTime,
        configuration: JSON.stringify({ daysThreshold }),
        details: JSON.stringify({
          upcoming: upcomingCalibration.length,
          overdue: overdueCalibration.length,
        }),
      });

      return {
        success: true,
        itemsProcessed: totalItems,
        itemsNotified: itemsNotified,
        details: {
          upcoming: upcomingCalibration.length,
          overdue: overdueCalibration.length,
          daysThreshold,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Log the failure
      await ReminderLogModel.create({
        reminderType: 'equipment_calibration',
        status: 'failed',
        itemsProcessed: 0,
        itemsNotified: 0,
        errorMessage,
        executionDurationMs: Date.now() - startTime,
        configuration: JSON.stringify({ daysThreshold }),
      });

      return {
        success: false,
        itemsProcessed: 0,
        itemsNotified: 0,
        error: errorMessage,
      };
    }
  }

  /**
   * Process equipment maintenance reminders
   */
  static async processEquipmentMaintenanceReminders(config?: ReminderConfig): Promise<ReminderResult> {
    const startTime = Date.now();
    const daysThreshold = config?.equipmentMaintenanceDays || this.defaultConfig.equipmentMaintenanceDays || 30;
    
    try {
      // Get equipment with upcoming maintenance
      const upcomingMaintenance = await EquipmentModel.getUpcomingDue(daysThreshold);
      
      // Get overdue maintenance
      const overdueMaintenance = await EquipmentModel.getOverdueMaintenance();
      
      const totalItems = upcomingMaintenance.maintenance.length + overdueMaintenance.length;
      const itemsNotified = totalItems;

      // Log the execution
      await ReminderLogModel.create({
        reminderType: 'equipment_maintenance',
        status: 'success',
        itemsProcessed: totalItems,
        itemsNotified: itemsNotified,
        executionDurationMs: Date.now() - startTime,
        configuration: JSON.stringify({ daysThreshold }),
        details: JSON.stringify({
          upcoming: upcomingMaintenance.maintenance.length,
          overdue: overdueMaintenance.length,
        }),
      });

      return {
        success: true,
        itemsProcessed: totalItems,
        itemsNotified: itemsNotified,
        details: {
          upcoming: upcomingMaintenance.maintenance.length,
          overdue: overdueMaintenance.length,
          daysThreshold,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Log the failure
      await ReminderLogModel.create({
        reminderType: 'equipment_maintenance',
        status: 'failed',
        itemsProcessed: 0,
        itemsNotified: 0,
        errorMessage,
        executionDurationMs: Date.now() - startTime,
        configuration: JSON.stringify({ daysThreshold }),
      });

      return {
        success: false,
        itemsProcessed: 0,
        itemsNotified: 0,
        error: errorMessage,
      };
    }
  }

  /**
   * Process CAPA deadline reminders
   */
  static async processCAPADeadlineReminders(config?: ReminderConfig): Promise<ReminderResult> {
    const startTime = Date.now();
    const daysThreshold = config?.capaDeadlineDays || this.defaultConfig.capaDeadlineDays || 7;
    
    try {
      // Get overdue CAPAs
      const overdueCAPAs = await CAPAModel.findOverdue();
      
      // Get all open CAPAs to find ones due soon
      const allCAPAs = await CAPAModel.findAll();
      
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysThreshold);
      
      // Filter CAPAs due within threshold
      const upcomingCAPAs = allCAPAs.filter(capa => {
        const targetDate = new Date(capa.targetDate);
        return targetDate > now && targetDate <= futureDate;
      });
      
      const totalItems = overdueCAPAs.length + upcomingCAPAs.length;
      const itemsNotified = totalItems;

      // Log the execution
      await ReminderLogModel.create({
        reminderType: 'capa_deadline',
        status: 'success',
        itemsProcessed: totalItems,
        itemsNotified: itemsNotified,
        executionDurationMs: Date.now() - startTime,
        configuration: JSON.stringify({ daysThreshold }),
        details: JSON.stringify({
          overdue: overdueCAPAs.length,
          upcoming: upcomingCAPAs.length,
        }),
      });

      return {
        success: true,
        itemsProcessed: totalItems,
        itemsNotified: itemsNotified,
        details: {
          overdue: overdueCAPAs.length,
          upcoming: upcomingCAPAs.length,
          daysThreshold,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Log the failure
      await ReminderLogModel.create({
        reminderType: 'capa_deadline',
        status: 'failed',
        itemsProcessed: 0,
        itemsNotified: 0,
        errorMessage,
        executionDurationMs: Date.now() - startTime,
        configuration: JSON.stringify({ daysThreshold }),
      });

      return {
        success: false,
        itemsProcessed: 0,
        itemsNotified: 0,
        error: errorMessage,
      };
    }
  }

  /**
   * Process all reminder types
   */
  static async processAllReminders(config?: ReminderConfig): Promise<{
    success: boolean;
    results: {
      training: ReminderResult;
      calibration: ReminderResult;
      maintenance: ReminderResult;
      capa: ReminderResult;
    };
  }> {
    const startTime = Date.now();
    
    try {
      const results = {
        training: await this.processTrainingExpiryReminders(config),
        calibration: await this.processEquipmentCalibrationReminders(config),
        maintenance: await this.processEquipmentMaintenanceReminders(config),
        capa: await this.processCAPADeadlineReminders(config),
      };

      const allSuccessful = Object.values(results).every(r => r.success);
      const totalProcessed = Object.values(results).reduce((sum, r) => sum + r.itemsProcessed, 0);
      const totalNotified = Object.values(results).reduce((sum, r) => sum + r.itemsNotified, 0);

      // Log the combined execution
      await ReminderLogModel.create({
        reminderType: 'all_reminders',
        status: allSuccessful ? 'success' : 'partial',
        itemsProcessed: totalProcessed,
        itemsNotified: totalNotified,
        executionDurationMs: Date.now() - startTime,
        configuration: JSON.stringify(config || this.defaultConfig),
        details: JSON.stringify(results),
      });

      return {
        success: allSuccessful,
        results,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Log the failure
      await ReminderLogModel.create({
        reminderType: 'all_reminders',
        status: 'failed',
        itemsProcessed: 0,
        itemsNotified: 0,
        errorMessage,
        executionDurationMs: Date.now() - startTime,
        configuration: JSON.stringify(config || this.defaultConfig),
      });

      throw error;
    }
  }
}

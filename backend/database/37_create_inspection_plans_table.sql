-- =============================================
-- Inspection Plans Table
-- =============================================
-- Stores inspection plans for equipment with scheduling details
-- Supports both recurring and one-time inspection plans
-- Tracks frequency, responsible inspectors, and due dates
-- Supports ISO 9001 inspection planning and monitoring requirements

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'InspectionPlans')
BEGIN
    CREATE TABLE InspectionPlans (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Plan Identification
        planNumber NVARCHAR(100) UNIQUE NOT NULL, -- Unique plan identifier
        planName NVARCHAR(500) NOT NULL, -- Descriptive name for the inspection plan
        description NVARCHAR(2000), -- Detailed description of what will be inspected
        
        -- Asset/Equipment Reference
        equipmentId INT NOT NULL, -- Reference to Equipment table
        
        -- Inspection Classification
        inspectionType NVARCHAR(100) NOT NULL, -- Type of inspection (routine, safety, pre-use, quality, etc.)
        priority NVARCHAR(50) NOT NULL DEFAULT 'normal', -- Priority level (low, normal, high, critical)
        
        -- Scheduling Configuration
        planType NVARCHAR(50) NOT NULL DEFAULT 'recurring', -- 'recurring' or 'one_time'
        frequency NVARCHAR(50), -- Frequency for recurring plans (daily, weekly, monthly, quarterly, semi-annual, annual)
        frequencyInterval INT, -- Interval in days for recurring plans (e.g., 30 for monthly, 90 for quarterly)
        startDate DATETIME2 NOT NULL, -- When the plan starts/becomes active
        endDate DATETIME2, -- When the plan ends (NULL for ongoing plans)
        
        -- Due Date Management
        nextDueDate DATETIME2 NOT NULL, -- Next inspection due date
        lastInspectionDate DATETIME2, -- Last time an inspection was performed under this plan
        reminderDays INT DEFAULT 7, -- Days before due date to send reminder
        
        -- Personnel Assignment
        responsibleInspectorId INT NOT NULL, -- Primary inspector responsible for this plan
        backupInspectorId INT, -- Backup inspector if primary is unavailable
        
        -- Inspection Checklist and Standards
        checklistReference NVARCHAR(500), -- Reference to inspection checklist or procedure document
        inspectionStandard NVARCHAR(200), -- Standard or specification being followed
        requiredCompetencies NVARCHAR(500), -- Required competencies/qualifications for inspectors
        
        -- Estimated Resources
        estimatedDuration INT, -- Estimated time in minutes for inspection
        requiredTools NVARCHAR(500), -- Tools or equipment needed for inspection
        
        -- Status and Lifecycle
        status NVARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'on_hold', 'completed', 'cancelled'
        
        -- Compliance and Regulatory
        regulatoryRequirement BIT DEFAULT 0, -- Flag if inspection is regulatory requirement
        complianceReference NVARCHAR(200), -- Reference to regulation or standard (e.g., ISO 9001:2015 clause)
        
        -- Notifications and Escalation
        autoSchedule BIT DEFAULT 1, -- Automatically create inspection records when due
        notifyOnOverdue BIT DEFAULT 1, -- Send notification if inspection becomes overdue
        escalationDays INT DEFAULT 3, -- Days overdue before escalating to management
        
        -- Additional Information
        criticality NVARCHAR(50), -- How critical this inspection is (low, medium, high, critical)
        safetyRelated BIT DEFAULT 0, -- Flag if inspection is safety-related
        qualityImpact NVARCHAR(50), -- Impact on quality (none, low, medium, high)
        notes NVARCHAR(2000), -- Additional notes or instructions
        
        -- Audit Trail
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        createdBy INT NOT NULL, -- User who created the plan
        updatedBy INT, -- User who last updated the plan
        
        -- Foreign Key Constraints
        CONSTRAINT FK_InspectionPlans_Equipment FOREIGN KEY (equipmentId) REFERENCES Equipment(id),
        CONSTRAINT FK_InspectionPlans_ResponsibleInspector FOREIGN KEY (responsibleInspectorId) REFERENCES Users(id),
        CONSTRAINT FK_InspectionPlans_BackupInspector FOREIGN KEY (backupInspectorId) REFERENCES Users(id),
        CONSTRAINT FK_InspectionPlans_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        CONSTRAINT FK_InspectionPlans_UpdatedBy FOREIGN KEY (updatedBy) REFERENCES Users(id),
        
        -- Constraints
        CONSTRAINT CK_InspectionPlans_PlanType CHECK (planType IN ('recurring', 'one_time')),
        CONSTRAINT CK_InspectionPlans_Frequency CHECK (frequency IS NULL OR frequency IN (
            'daily', 
            'weekly', 
            'bi-weekly', 
            'monthly', 
            'bi-monthly',
            'quarterly', 
            'semi-annual', 
            'annual',
            'bi-annual'
        )),
        CONSTRAINT CK_InspectionPlans_Priority CHECK (priority IN ('low', 'normal', 'high', 'critical')),
        CONSTRAINT CK_InspectionPlans_Status CHECK (status IN (
            'active',
            'inactive',
            'on_hold',
            'completed',
            'cancelled'
        )),
        CONSTRAINT CK_InspectionPlans_Criticality CHECK (criticality IS NULL OR criticality IN (
            'low',
            'medium',
            'high',
            'critical'
        )),
        CONSTRAINT CK_InspectionPlans_QualityImpact CHECK (qualityImpact IS NULL OR qualityImpact IN (
            'none',
            'low',
            'medium',
            'high'
        )),
        CONSTRAINT CK_InspectionPlans_FrequencyInterval CHECK (frequencyInterval IS NULL OR frequencyInterval > 0),
        CONSTRAINT CK_InspectionPlans_EstimatedDuration CHECK (estimatedDuration IS NULL OR estimatedDuration > 0),
        CONSTRAINT CK_InspectionPlans_ReminderDays CHECK (reminderDays IS NULL OR reminderDays >= 0),
        CONSTRAINT CK_InspectionPlans_EscalationDays CHECK (escalationDays IS NULL OR escalationDays >= 0),
        CONSTRAINT CK_InspectionPlans_DateRange CHECK (endDate IS NULL OR endDate >= startDate),
        CONSTRAINT CK_InspectionPlans_RecurringRequirements CHECK (
            (planType = 'one_time') OR 
            (planType = 'recurring' AND frequency IS NOT NULL AND frequencyInterval IS NOT NULL)
        )
    );

    -- Indexes for Performance
    
    -- Primary identifier lookups
    CREATE UNIQUE INDEX IX_InspectionPlans_PlanNumber ON InspectionPlans(planNumber);
    
    -- Equipment lookups
    CREATE INDEX IX_InspectionPlans_EquipmentId ON InspectionPlans(equipmentId);
    CREATE INDEX IX_InspectionPlans_Equipment_Status ON InspectionPlans(equipmentId, status);
    
    -- Personnel tracking
    CREATE INDEX IX_InspectionPlans_ResponsibleInspector ON InspectionPlans(responsibleInspectorId);
    CREATE INDEX IX_InspectionPlans_BackupInspector ON InspectionPlans(backupInspectorId);
    CREATE INDEX IX_InspectionPlans_CreatedBy ON InspectionPlans(createdBy);
    
    -- Due date tracking and scheduling
    CREATE INDEX IX_InspectionPlans_NextDueDate ON InspectionPlans(nextDueDate);
    CREATE INDEX IX_InspectionPlans_LastInspectionDate ON InspectionPlans(lastInspectionDate);
    CREATE INDEX IX_InspectionPlans_StartDate ON InspectionPlans(startDate);
    CREATE INDEX IX_InspectionPlans_EndDate ON InspectionPlans(endDate);
    
    -- Status and priority tracking
    CREATE INDEX IX_InspectionPlans_Status ON InspectionPlans(status);
    CREATE INDEX IX_InspectionPlans_Priority ON InspectionPlans(priority);
    CREATE INDEX IX_InspectionPlans_PlanType ON InspectionPlans(planType);
    
    -- Classification and filtering
    CREATE INDEX IX_InspectionPlans_InspectionType ON InspectionPlans(inspectionType);
    CREATE INDEX IX_InspectionPlans_Frequency ON InspectionPlans(frequency);
    CREATE INDEX IX_InspectionPlans_Criticality ON InspectionPlans(criticality);
    
    -- Compliance and regulatory tracking
    CREATE INDEX IX_InspectionPlans_RegulatoryRequirement ON InspectionPlans(regulatoryRequirement);
    CREATE INDEX IX_InspectionPlans_SafetyRelated ON InspectionPlans(safetyRelated);
    
    -- Audit trail
    CREATE INDEX IX_InspectionPlans_CreatedAt ON InspectionPlans(createdAt);
    CREATE INDEX IX_InspectionPlans_UpdatedAt ON InspectionPlans(updatedAt);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_InspectionPlans_Status_NextDueDate ON InspectionPlans(status, nextDueDate);
    CREATE INDEX IX_InspectionPlans_Equipment_NextDueDate ON InspectionPlans(equipmentId, nextDueDate);
    CREATE INDEX IX_InspectionPlans_ResponsibleInspector_Status ON InspectionPlans(responsibleInspectorId, status);
    CREATE INDEX IX_InspectionPlans_Status_Priority ON InspectionPlans(status, priority);
    CREATE INDEX IX_InspectionPlans_Type_Status ON InspectionPlans(inspectionType, status);
    CREATE INDEX IX_InspectionPlans_Active_DueDate ON InspectionPlans(status, nextDueDate) WHERE status = 'active';
    
    -- Name search
    CREATE INDEX IX_InspectionPlans_PlanName ON InspectionPlans(planName);

    PRINT 'InspectionPlans table created successfully';
END
ELSE
BEGIN
    PRINT 'InspectionPlans table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.37' AND scriptName = '37_create_inspection_plans_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.37',
        'Create InspectionPlans table for inspection planning and scheduling',
        '37_create_inspection_plans_table.sql',
        'SUCCESS',
        'InspectionPlans table supports ISO 9001 inspection planning with both recurring and one-time plans, frequency management, responsible inspector assignment, and full audit trail'
    );
END
GO

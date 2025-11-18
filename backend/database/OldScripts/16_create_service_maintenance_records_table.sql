-- =============================================
-- Service and Maintenance Records Table
-- =============================================
-- Stores service and maintenance records for equipment
-- Tracks maintenance history, costs, and preventive/corrective actions
-- Supports ISO 9001 maintenance management requirements

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ServiceMaintenanceRecords')
BEGIN
    CREATE TABLE ServiceMaintenanceRecords (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Equipment Reference
        equipmentId INT NOT NULL, -- Reference to Equipment table
        
        -- Service/Maintenance Scheduling
        serviceDate DATETIME2 NOT NULL, -- Date service/maintenance was performed
        dueDate DATETIME2, -- Date service/maintenance was originally due
        nextDueDate DATETIME2, -- Date of next service/maintenance due
        
        -- Personnel
        performedBy INT NOT NULL, -- User who performed the service/maintenance
        approvedBy INT, -- User who approved/verified the work
        
        -- Service/Maintenance Details
        serviceType NVARCHAR(100) NOT NULL, -- Type of service (preventive, corrective, emergency, etc.)
        workOrderNumber NVARCHAR(100), -- Work order or job number
        priority NVARCHAR(50), -- Priority level
        
        -- Description and Work Performed
        description NVARCHAR(2000) NOT NULL, -- Description of work required
        workPerformed NVARCHAR(2000), -- Details of work actually performed
        hoursSpent DECIMAL(6,2), -- Hours spent on service/maintenance
        
        -- Parts and Materials
        partsUsed NVARCHAR(2000), -- List of parts used
        partsReplaced NVARCHAR(2000), -- List of parts replaced
        materialsCost DECIMAL(10,2), -- Cost of materials and parts
        
        -- Cost Information
        laborCost DECIMAL(10,2), -- Labor cost
        totalCost DECIMAL(10,2), -- Total cost (materials + labor + other)
        
        -- External Service Provider (if applicable)
        externalProvider NVARCHAR(200), -- External service provider name
        providerContact NVARCHAR(200), -- Provider contact information
        invoiceNumber NVARCHAR(100), -- Invoice or reference number
        
        -- Results and Outcomes
        outcome NVARCHAR(50) NOT NULL DEFAULT 'completed', -- Service outcome
        equipmentCondition NVARCHAR(50), -- Equipment condition after service
        issuesResolved BIT DEFAULT 1, -- Whether issues were resolved
        
        -- Issues and Findings
        problemsIdentified NVARCHAR(2000), -- Problems identified during service
        rootCause NVARCHAR(2000), -- Root cause analysis (if applicable)
        preventiveActions NVARCHAR(2000), -- Preventive actions taken
        
        -- Follow-up and Recommendations
        followUpRequired BIT DEFAULT 0, -- Flag if follow-up needed
        followUpDate DATETIME2, -- Date for follow-up service
        recommendations NVARCHAR(2000), -- Recommendations for future maintenance
        
        -- Testing and Verification
        functionalTestPerformed BIT DEFAULT 0, -- Whether functional test was performed
        testResults NVARCHAR(1000), -- Results of testing
        
        -- Downtime Tracking
        downtimeStart DATETIME2, -- Start of equipment downtime
        downtimeEnd DATETIME2, -- End of equipment downtime
        downtimeHours DECIMAL(6,2), -- Total downtime in hours
        
        -- Documentation
        attachments NVARCHAR(1000), -- File paths to reports/invoices/photos
        
        -- Status and Tracking
        status NVARCHAR(50) NOT NULL DEFAULT 'completed', -- Record status
        
        -- Additional Information
        notes NVARCHAR(2000), -- Additional notes or comments
        
        -- Audit Trail
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        createdBy INT, -- User who created the record
        
        -- Foreign Key Constraints
        CONSTRAINT FK_ServiceMaintenanceRecords_Equipment FOREIGN KEY (equipmentId) REFERENCES Equipment(id),
        CONSTRAINT FK_ServiceMaintenanceRecords_PerformedBy FOREIGN KEY (performedBy) REFERENCES Users(id),
        CONSTRAINT FK_ServiceMaintenanceRecords_ApprovedBy FOREIGN KEY (approvedBy) REFERENCES Users(id),
        CONSTRAINT FK_ServiceMaintenanceRecords_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        
        -- Constraints
        CONSTRAINT CK_ServiceMaintenanceRecords_ServiceType CHECK (serviceType IN (
            'preventive',
            'corrective',
            'predictive',
            'emergency',
            'breakdown',
            'routine',
            'upgrade',
            'installation',
            'decommission'
        )),
        CONSTRAINT CK_ServiceMaintenanceRecords_Priority CHECK (priority IS NULL OR priority IN (
            'low',
            'normal',
            'high',
            'urgent',
            'emergency'
        )),
        CONSTRAINT CK_ServiceMaintenanceRecords_Outcome CHECK (outcome IN (
            'completed',
            'partially_completed',
            'failed',
            'deferred',
            'cancelled'
        )),
        CONSTRAINT CK_ServiceMaintenanceRecords_EquipmentCondition CHECK (equipmentCondition IS NULL OR equipmentCondition IN (
            'excellent',
            'good',
            'fair',
            'poor',
            'failed'
        )),
        CONSTRAINT CK_ServiceMaintenanceRecords_Status CHECK (status IN (
            'scheduled',
            'in_progress',
            'completed',
            'overdue',
            'cancelled',
            'on_hold'
        )),
        CONSTRAINT CK_ServiceMaintenanceRecords_HoursSpent CHECK (hoursSpent IS NULL OR hoursSpent >= 0),
        CONSTRAINT CK_ServiceMaintenanceRecords_MaterialsCost CHECK (materialsCost IS NULL OR materialsCost >= 0),
        CONSTRAINT CK_ServiceMaintenanceRecords_LaborCost CHECK (laborCost IS NULL OR laborCost >= 0),
        CONSTRAINT CK_ServiceMaintenanceRecords_TotalCost CHECK (totalCost IS NULL OR totalCost >= 0),
        CONSTRAINT CK_ServiceMaintenanceRecords_DowntimeHours CHECK (downtimeHours IS NULL OR downtimeHours >= 0)
    );

    -- Indexes for Performance
    
    -- Equipment lookups
    CREATE INDEX IX_ServiceMaintenanceRecords_EquipmentId ON ServiceMaintenanceRecords(equipmentId);
    CREATE INDEX IX_ServiceMaintenanceRecords_Equipment_Date ON ServiceMaintenanceRecords(equipmentId, serviceDate DESC);
    
    -- Date-based queries
    CREATE INDEX IX_ServiceMaintenanceRecords_ServiceDate ON ServiceMaintenanceRecords(serviceDate);
    CREATE INDEX IX_ServiceMaintenanceRecords_DueDate ON ServiceMaintenanceRecords(dueDate);
    CREATE INDEX IX_ServiceMaintenanceRecords_NextDueDate ON ServiceMaintenanceRecords(nextDueDate);
    CREATE INDEX IX_ServiceMaintenanceRecords_FollowUpDate ON ServiceMaintenanceRecords(followUpDate);
    
    -- Status and outcome tracking
    CREATE INDEX IX_ServiceMaintenanceRecords_Status ON ServiceMaintenanceRecords(status);
    CREATE INDEX IX_ServiceMaintenanceRecords_Outcome ON ServiceMaintenanceRecords(outcome);
    CREATE INDEX IX_ServiceMaintenanceRecords_EquipmentCondition ON ServiceMaintenanceRecords(equipmentCondition);
    
    -- Type and priority tracking
    CREATE INDEX IX_ServiceMaintenanceRecords_ServiceType ON ServiceMaintenanceRecords(serviceType);
    CREATE INDEX IX_ServiceMaintenanceRecords_Priority ON ServiceMaintenanceRecords(priority);
    CREATE INDEX IX_ServiceMaintenanceRecords_WorkOrderNumber ON ServiceMaintenanceRecords(workOrderNumber);
    
    -- Follow-up tracking
    CREATE INDEX IX_ServiceMaintenanceRecords_FollowUpRequired ON ServiceMaintenanceRecords(followUpRequired);
    CREATE INDEX IX_ServiceMaintenanceRecords_IssuesResolved ON ServiceMaintenanceRecords(issuesResolved);
    
    -- Personnel tracking
    CREATE INDEX IX_ServiceMaintenanceRecords_PerformedBy ON ServiceMaintenanceRecords(performedBy);
    CREATE INDEX IX_ServiceMaintenanceRecords_ApprovedBy ON ServiceMaintenanceRecords(approvedBy);
    CREATE INDEX IX_ServiceMaintenanceRecords_CreatedBy ON ServiceMaintenanceRecords(createdBy);
    
    -- Cost tracking
    CREATE INDEX IX_ServiceMaintenanceRecords_TotalCost ON ServiceMaintenanceRecords(totalCost);
    
    -- External provider tracking
    CREATE INDEX IX_ServiceMaintenanceRecords_ExternalProvider ON ServiceMaintenanceRecords(externalProvider);
    CREATE INDEX IX_ServiceMaintenanceRecords_InvoiceNumber ON ServiceMaintenanceRecords(invoiceNumber);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_ServiceMaintenanceRecords_Status_DueDate ON ServiceMaintenanceRecords(status, dueDate);
    CREATE INDEX IX_ServiceMaintenanceRecords_Equipment_Status ON ServiceMaintenanceRecords(equipmentId, status);
    CREATE INDEX IX_ServiceMaintenanceRecords_Equipment_Type ON ServiceMaintenanceRecords(equipmentId, serviceType);
    CREATE INDEX IX_ServiceMaintenanceRecords_Type_Status ON ServiceMaintenanceRecords(serviceType, status);
    CREATE INDEX IX_ServiceMaintenanceRecords_Priority_Status ON ServiceMaintenanceRecords(priority, status);
    
    -- Audit trail
    CREATE INDEX IX_ServiceMaintenanceRecords_CreatedAt ON ServiceMaintenanceRecords(createdAt);

    PRINT 'ServiceMaintenanceRecords table created successfully';
END
ELSE
BEGIN
    PRINT 'ServiceMaintenanceRecords table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.16' AND scriptName = '16_create_service_maintenance_records_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.16',
        'Create ServiceMaintenanceRecords table for equipment service and maintenance tracking',
        '16_create_service_maintenance_records_table.sql',
        'SUCCESS',
        'ServiceMaintenanceRecords table supports ISO 9001 maintenance management with comprehensive tracking of preventive, corrective, and emergency maintenance activities'
    );
END
GO

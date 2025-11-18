-- =============================================
-- Equipment Table
-- =============================================
-- Stores equipment metadata, maintenance, and calibration tracking
-- Supports ISO 9001 equipment management requirements

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Equipment')
BEGIN
    CREATE TABLE Equipment (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Equipment Identification
        equipmentNumber NVARCHAR(100) UNIQUE NOT NULL, -- Unique equipment identifier
        name NVARCHAR(500) NOT NULL, -- Equipment name/title
        description NVARCHAR(2000), -- Detailed description
        
        -- Manufacturer Information
        manufacturer NVARCHAR(200), -- Equipment manufacturer
        model NVARCHAR(200), -- Manufacturer model number
        serialNumber NVARCHAR(200), -- Serial number
        
        -- Location and Assignment
        location NVARCHAR(200) NOT NULL, -- Physical location
        department NVARCHAR(100), -- Department or area
        responsiblePerson INT NULL, -- User responsible for this equipment
        
        -- Equipment Status
        status NVARCHAR(50) NOT NULL DEFAULT 'operational', -- Current operational status
        
        -- Purchase Information
        purchaseDate DATETIME2, -- Date equipment was purchased
        
        -- Calibration Management
        lastCalibrationDate DATETIME2, -- Last calibration performed
        nextCalibrationDate DATETIME2, -- Next calibration due date
        calibrationInterval INT, -- Calibration interval in days
        
        -- Maintenance Management
        lastMaintenanceDate DATETIME2, -- Last maintenance performed
        nextMaintenanceDate DATETIME2, -- Next maintenance due date
        maintenanceInterval INT, -- Maintenance interval in days
        
        -- QR Code for Mobile Access
        qrCode NVARCHAR(500), -- QR code for equipment identification
        
        -- Audit Trail
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        
        -- Foreign Key Constraints
        CONSTRAINT FK_Equipment_ResponsiblePerson FOREIGN KEY (responsiblePerson) REFERENCES Users(id),
        
        -- Constraints
        CONSTRAINT CK_Equipment_Status CHECK (status IN (
            'operational', 
            'maintenance', 
            'out_of_service', 
            'calibration_due'
        )),
        CONSTRAINT CK_Equipment_CalibrationInterval CHECK (calibrationInterval IS NULL OR calibrationInterval > 0),
        CONSTRAINT CK_Equipment_MaintenanceInterval CHECK (maintenanceInterval IS NULL OR maintenanceInterval > 0)
    );

    -- Indexes for Performance
    
    -- Primary identifier lookups
    CREATE UNIQUE INDEX IX_Equipment_EquipmentNumber ON Equipment(equipmentNumber);
    CREATE INDEX IX_Equipment_SerialNumber ON Equipment(serialNumber);
    CREATE INDEX IX_Equipment_QRCode ON Equipment(qrCode);
    
    -- Status and operational queries
    CREATE INDEX IX_Equipment_Status ON Equipment(status);
    CREATE INDEX IX_Equipment_Location ON Equipment(location);
    CREATE INDEX IX_Equipment_Department ON Equipment(department);
    CREATE INDEX IX_Equipment_ResponsiblePerson ON Equipment(responsiblePerson);
    
    -- Calibration tracking
    CREATE INDEX IX_Equipment_NextCalibrationDate ON Equipment(nextCalibrationDate);
    CREATE INDEX IX_Equipment_LastCalibrationDate ON Equipment(lastCalibrationDate);
    
    -- Maintenance tracking
    CREATE INDEX IX_Equipment_NextMaintenanceDate ON Equipment(nextMaintenanceDate);
    CREATE INDEX IX_Equipment_LastMaintenanceDate ON Equipment(lastMaintenanceDate);
    
    -- Date-based queries
    CREATE INDEX IX_Equipment_PurchaseDate ON Equipment(purchaseDate);
    CREATE INDEX IX_Equipment_CreatedAt ON Equipment(createdAt);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_Equipment_Status_Department ON Equipment(status, department);
    CREATE INDEX IX_Equipment_Status_Location ON Equipment(status, location);
    CREATE INDEX IX_Equipment_Department_Status ON Equipment(department, status);
    
    -- Name search
    CREATE INDEX IX_Equipment_Name ON Equipment(name);

    PRINT 'Equipment table created successfully';
END
ELSE
BEGIN
    PRINT 'Equipment table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.11' AND scriptName = '11_create_equipment_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.11',
        'Create Equipment table with metadata, calibration, and maintenance tracking',
        '11_create_equipment_table.sql',
        'SUCCESS',
        'Equipment table supports ISO 9001 equipment management with calibration and maintenance scheduling'
    );
END
GO

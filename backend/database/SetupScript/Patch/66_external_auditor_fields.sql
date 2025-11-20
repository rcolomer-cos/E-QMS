-- =============================================
-- Add External Auditor Fields to Audits Table
-- =============================================
-- Adds external auditor information fields to distinguish between
-- internal audits (company employees audit own processes) and
-- external audits (external organization audits company, internal employee coordinates)

-- Check if externalAuditorName column already exists
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('Audits') 
    AND name = 'externalAuditorName'
)
BEGIN
    -- Add external auditor fields (optional, only populated for external audits)
    ALTER TABLE Audits
    ADD externalAuditorName NVARCHAR(200) NULL;
    
    PRINT 'externalAuditorName column added to Audits table';
END
GO

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('Audits') 
    AND name = 'externalAuditorOrganization'
)
BEGIN
    ALTER TABLE Audits
    ADD externalAuditorOrganization NVARCHAR(200) NULL;
    
    PRINT 'externalAuditorOrganization column added to Audits table';
END
GO

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('Audits') 
    AND name = 'externalAuditorEmail'
)
BEGIN
    ALTER TABLE Audits
    ADD externalAuditorEmail NVARCHAR(200) NULL;
    
    PRINT 'externalAuditorEmail column added to Audits table';
END
GO

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('Audits') 
    AND name = 'externalAuditorPhone'
)
BEGIN
    ALTER TABLE Audits
    ADD externalAuditorPhone NVARCHAR(50) NULL;
    
    PRINT 'externalAuditorPhone column added to Audits table';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.66' AND scriptName = '66_external_auditor_fields.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.66',
        'Add external auditor fields to Audits table',
        '66_external_auditor_fields.sql',
        'SUCCESS',
        'Adds externalAuditorName, externalAuditorOrganization, externalAuditorEmail, and externalAuditorPhone fields to support external audit workflows'
    );
END
GO

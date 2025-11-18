-- =============================================
-- Add Inspection Record Link to NCRs
-- =============================================
-- Adds optional link from NCR to InspectionRecord for traceability
-- Supports P4:4:4 - Direct-to-NCR integration for failed inspections

-- Add inspectionRecordId column to NCRs table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'NCRs') AND name = 'inspectionRecordId')
BEGIN
    ALTER TABLE NCRs
    ADD inspectionRecordId INT NULL;

    -- Add foreign key constraint
    ALTER TABLE NCRs
    ADD CONSTRAINT FK_NCRs_InspectionRecord FOREIGN KEY (inspectionRecordId) REFERENCES InspectionRecords(id);

    -- Add index for performance
    CREATE INDEX IX_NCRs_InspectionRecordId ON NCRs(inspectionRecordId);

    PRINT 'Added inspectionRecordId column to NCRs table';
END
ELSE
BEGIN
    PRINT 'inspectionRecordId column already exists in NCRs table';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.40' AND scriptName = '40_add_inspection_link_to_ncr.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.40',
        'Add inspection record link to NCRs table',
        '40_add_inspection_link_to_ncr.sql',
        'SUCCESS',
        'Enables direct-to-NCR integration for failed inspections with full traceability'
    );
END
GO

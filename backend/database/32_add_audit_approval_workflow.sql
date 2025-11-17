-- =============================================
-- Add Audit Approval Workflow Fields
-- =============================================
-- Adds reviewer/approver workflow capabilities to the Audits table
-- Supports submission, review, approval, and rejection workflow states

-- Step 1: Add new columns for review workflow
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Audits') AND name = 'reviewerId')
BEGIN
    ALTER TABLE Audits
    ADD reviewerId INT NULL,
        reviewedAt DATETIME2 NULL,
        reviewComments NVARCHAR(2000) NULL;
    
    PRINT 'Added review workflow columns to Audits table';
END
ELSE
BEGIN
    PRINT 'Review workflow columns already exist in Audits table';
END
GO

-- Step 2: Add foreign key constraint for reviewer
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Audits_Reviewer')
BEGIN
    ALTER TABLE Audits
    ADD CONSTRAINT FK_Audits_Reviewer FOREIGN KEY (reviewerId) REFERENCES Users(id);
    
    PRINT 'Added foreign key constraint for reviewer';
END
ELSE
BEGIN
    PRINT 'Foreign key constraint for reviewer already exists';
END
GO

-- Step 3: Update status check constraint to include new statuses
IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Audits_Status' AND parent_object_id = OBJECT_ID('Audits'))
BEGIN
    ALTER TABLE Audits DROP CONSTRAINT CK_Audits_Status;
    PRINT 'Dropped old status check constraint';
END
GO

ALTER TABLE Audits
ADD CONSTRAINT CK_Audits_Status CHECK (status IN ('planned', 'in_progress', 'completed', 'pending_review', 'approved', 'rejected', 'closed'));
PRINT 'Added new status check constraint with approval workflow statuses';
GO

-- Step 4: Create indexes for new columns
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Audits_ReviewerId')
BEGIN
    CREATE INDEX IX_Audits_ReviewerId ON Audits(reviewerId) WHERE reviewerId IS NOT NULL;
    PRINT 'Created index on reviewerId';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Audits_ReviewedAt')
BEGIN
    CREATE INDEX IX_Audits_ReviewedAt ON Audits(reviewedAt DESC) WHERE reviewedAt IS NOT NULL;
    PRINT 'Created index on reviewedAt';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Audits_Status_ReviewedAt')
BEGIN
    CREATE INDEX IX_Audits_Status_ReviewedAt ON Audits(status, reviewedAt DESC);
    PRINT 'Created composite index on status and reviewedAt';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.32' AND scriptName = '32_add_audit_approval_workflow.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.32',
        'Add audit approval workflow with reviewer fields and new statuses',
        '32_add_audit_approval_workflow.sql',
        'SUCCESS',
        'Added reviewerId, reviewedAt, reviewComments columns and new statuses: pending_review, approved, rejected. Updated status check constraint and added indexes for workflow queries.'
    );
    PRINT 'Recorded database version 1.0.32';
END
ELSE
BEGIN
    PRINT 'Database version 1.0.32 already recorded';
END
GO

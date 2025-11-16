-- =============================================
-- Seed Example Data Script
-- =============================================
-- This script populates example data for all tables except Users
-- Purpose: Provide sample data for development and testing
-- 
-- IMPORTANT: 
-- 1. This script assumes Users table has been populated first
-- 2. User IDs referenced here should match actual user IDs in your Users table
-- 3. Some tables (ProcessOwners, UserRoles, Notifications) require valid user IDs
-- 4. Modify user ID references before running in production
--
-- Execution Order (respects foreign key dependencies):
-- 1. Departments
-- 2. Processes (depends on Departments and Users for createdBy)
-- 3. ProcessOwners (depends on Processes and Users)
-- 4. Documents (depends on Users)
-- 5. DocumentRevisions (depends on Documents and Users)
-- 6. Notifications (depends on Users, Documents, DocumentRevisions)
-- 7. Equipment (depends on Users for responsiblePerson)
-- 8. UserRoles (depends on Users and Roles)
-- =============================================

USE EQMS;
GO

PRINT '========================================';
PRINT 'Starting Seed Data Insertion';
PRINT '========================================';
GO

-- =============================================
-- 1. DEPARTMENTS
-- =============================================
PRINT 'Inserting sample Departments...';

-- Check if sample departments already exist
IF NOT EXISTS (SELECT * FROM Departments WHERE code = 'QA')
BEGIN
    -- Insert sample departments
    INSERT INTO Departments (name, code, description, managerId, active, createdBy)
    VALUES
    ('Quality Assurance', 'QA', 'Responsible for quality management system, audits, and compliance', NULL, 1, 1),
    ('Production', 'PROD', 'Manufacturing and production operations', NULL, 1, 1),
    ('Research and Development', 'RD', 'Product research, development, and innovation', NULL, 1, 1),
    ('Information Technology', 'IT', 'IT infrastructure, systems, and support', NULL, 1, 1),
    ('Human Resources', 'HR', 'Employee management, training, and development', NULL, 1, 1),
    ('Engineering', 'ENG', 'Engineering design and technical support', NULL, 1, 1),
    ('Maintenance', 'MAINT', 'Equipment maintenance and facilities management', NULL, 1, 1),
    ('Supply Chain', 'SC', 'Procurement, logistics, and inventory management', NULL, 1, 1);

    PRINT '  - 8 departments inserted successfully';
END
ELSE
BEGIN
    PRINT '  - Sample departments already exist, skipping...';
END
GO

-- =============================================
-- 2. PROCESSES
-- =============================================
PRINT 'Inserting sample Processes...';

-- Check if sample processes already exist
IF NOT EXISTS (SELECT * FROM Processes WHERE code = 'QMS-001')
BEGIN
    -- Get department IDs for reference
    DECLARE @deptQA INT = (SELECT id FROM Departments WHERE code = 'QA');
    DECLARE @deptPROD INT = (SELECT id FROM Departments WHERE code = 'PROD');
    DECLARE @deptRD INT = (SELECT id FROM Departments WHERE code = 'RD');
    DECLARE @deptIT INT = (SELECT id FROM Departments WHERE code = 'IT');
    DECLARE @deptHR INT = (SELECT id FROM Departments WHERE code = 'HR');
    DECLARE @deptENG INT = (SELECT id FROM Departments WHERE code = 'ENG');
    DECLARE @deptMAINT INT = (SELECT id FROM Departments WHERE code = 'MAINT');
    DECLARE @deptSC INT = (SELECT id FROM Departments WHERE code = 'SC');

    -- Insert sample processes across different categories
    INSERT INTO Processes (name, code, description, departmentId, processCategory, objective, scope, active, createdBy)
    VALUES
    -- Management Processes
    ('Management Review', 'QMS-001', 'Periodic review of QMS effectiveness and improvement opportunities', @deptQA, 'Management', 
     'Ensure QMS continues to be suitable, adequate, and effective', 
     'Review of quality objectives, audit results, customer feedback, and process performance', 1, 1),
    
    ('Strategic Planning', 'QMS-002', 'Strategic direction and quality policy development', @deptQA, 'Management', 
     'Establish organizational direction and quality objectives', 
     'Quality policy, strategic objectives, and resource allocation', 1, 1),
    
    ('Risk Management', 'QMS-003', 'Identification and management of organizational risks and opportunities', @deptQA, 'Management', 
     'Ensure risks are identified and addressed appropriately', 
     'Risk assessment, mitigation strategies, and opportunity management', 1, 1),
    
    -- Core Processes
    ('Product Design', 'PROD-001', 'Design and development of new products', @deptRD, 'Core', 
     'Develop innovative products meeting customer requirements', 
     'Design inputs, design outputs, design verification and validation', 1, 1),
    
    ('Manufacturing Process', 'PROD-002', 'Production and manufacturing operations', @deptPROD, 'Core', 
     'Manufacture products according to specifications', 
     'Production planning, execution, and in-process quality control', 1, 1),
    
    ('Quality Control', 'PROD-003', 'Inspection and testing of products', @deptQA, 'Core', 
     'Ensure products meet quality specifications', 
     'Incoming, in-process, and final product inspection and testing', 1, 1),
    
    ('Customer Order Processing', 'PROD-004', 'Order receipt, review, and processing', @deptSC, 'Core', 
     'Ensure customer orders are processed accurately and timely', 
     'Order entry, review, approval, and fulfillment tracking', 1, 1),
    
    -- Support Processes
    ('Document Control', 'QMS-004', 'Control of quality system documents and records', @deptQA, 'Support', 
     'Ensure documents are current, approved, and accessible', 
     'Document creation, approval, distribution, and revision control', 1, 1),
    
    ('Internal Audit', 'QMS-005', 'Internal auditing of QMS processes', @deptQA, 'Support', 
     'Verify QMS conformity and identify improvement opportunities', 
     'Audit planning, execution, reporting, and follow-up', 1, 1),
    
    ('Corrective and Preventive Action', 'QMS-006', 'CAPA process for nonconformities', @deptQA, 'Support', 
     'Address nonconformities and prevent recurrence', 
     'Problem identification, root cause analysis, corrective action, and verification', 1, 1),
    
    ('Calibration Management', 'QMS-007', 'Equipment calibration and maintenance', @deptMAINT, 'Support', 
     'Ensure measurement equipment accuracy and reliability', 
     'Calibration scheduling, execution, and record maintenance', 1, 1),
    
    ('Training Management', 'QMS-008', 'Employee training and competence development', @deptHR, 'Support', 
     'Ensure employees are competent for their assigned tasks', 
     'Training needs identification, delivery, and effectiveness evaluation', 1, 1),
    
    ('Supplier Management', 'QMS-009', 'Supplier evaluation and monitoring', @deptSC, 'Support', 
     'Ensure suppliers meet quality requirements', 
     'Supplier selection, evaluation, performance monitoring, and development', 1, 1),
    
    ('Change Management', 'QMS-010', 'Control of changes to processes and products', @deptENG, 'Support', 
     'Ensure changes are controlled and evaluated', 
     'Change request, impact assessment, approval, and implementation', 1, 1),
    
    ('IT System Management', 'QMS-011', 'Information technology system support', @deptIT, 'Support', 
     'Maintain reliable and secure IT infrastructure', 
     'System maintenance, security, backup, and user support', 1, 1);

    PRINT '  - 15 processes inserted successfully';
END
ELSE
BEGIN
    PRINT '  - Sample processes already exist, skipping...';
END
GO

-- =============================================
-- 3. PROCESS OWNERS
-- =============================================
PRINT 'Inserting sample Process Owners...';

-- NOTE: This section requires actual user IDs from the Users table
-- The following uses placeholder user IDs (1, 2, 3, etc.)
-- Replace these with actual user IDs after creating users

IF NOT EXISTS (SELECT * FROM ProcessOwners WHERE processId = (SELECT id FROM Processes WHERE code = 'QMS-001'))
BEGIN
    -- Assign process owners (assumes users with IDs 1-5 exist)
    -- Adjust user IDs based on your actual Users table
    
    DECLARE @proc1 INT = (SELECT id FROM Processes WHERE code = 'QMS-001');
    DECLARE @proc2 INT = (SELECT id FROM Processes WHERE code = 'QMS-002');
    DECLARE @proc3 INT = (SELECT id FROM Processes WHERE code = 'QMS-003');
    DECLARE @proc4 INT = (SELECT id FROM Processes WHERE code = 'PROD-001');
    DECLARE @proc5 INT = (SELECT id FROM Processes WHERE code = 'PROD-002');
    DECLARE @proc6 INT = (SELECT id FROM Processes WHERE code = 'PROD-003');
    DECLARE @proc7 INT = (SELECT id FROM Processes WHERE code = 'PROD-004');
    DECLARE @proc8 INT = (SELECT id FROM Processes WHERE code = 'QMS-004');
    DECLARE @proc9 INT = (SELECT id FROM Processes WHERE code = 'QMS-005');
    DECLARE @proc10 INT = (SELECT id FROM Processes WHERE code = 'QMS-006');
    DECLARE @proc11 INT = (SELECT id FROM Processes WHERE code = 'QMS-007');
    DECLARE @proc12 INT = (SELECT id FROM Processes WHERE code = 'QMS-008');
    DECLARE @proc13 INT = (SELECT id FROM Processes WHERE code = 'QMS-009');
    DECLARE @proc14 INT = (SELECT id FROM Processes WHERE code = 'QMS-010');
    DECLARE @proc15 INT = (SELECT id FROM Processes WHERE code = 'QMS-011');

    -- Check if minimum required users exist
    IF EXISTS (SELECT * FROM Users WHERE id IN (1, 2, 3, 4, 5))
    BEGIN
        INSERT INTO ProcessOwners (processId, ownerId, assignedBy, isPrimaryOwner, active, notes)
        VALUES
        (@proc1, 1, 1, 1, 1, 'Quality Manager - Primary owner of Management Review process'),
        (@proc2, 1, 1, 1, 1, 'Quality Manager - Primary owner of Strategic Planning'),
        (@proc3, 1, 1, 1, 1, 'Quality Manager - Primary owner of Risk Management'),
        (@proc4, 2, 1, 1, 1, 'R&D Manager - Primary owner of Product Design'),
        (@proc5, 3, 1, 1, 1, 'Production Manager - Primary owner of Manufacturing'),
        (@proc6, 1, 1, 1, 1, 'Quality Manager - Primary owner of Quality Control'),
        (@proc7, 4, 1, 1, 1, 'Supply Chain Manager - Primary owner of Order Processing'),
        (@proc8, 1, 1, 1, 1, 'Quality Manager - Primary owner of Document Control'),
        (@proc9, 1, 1, 1, 1, 'Quality Manager - Primary owner of Internal Audit'),
        (@proc10, 1, 1, 1, 1, 'Quality Manager - Primary owner of CAPA'),
        (@proc11, 5, 1, 1, 1, 'Maintenance Manager - Primary owner of Calibration'),
        (@proc12, 2, 1, 1, 1, 'HR Manager - Primary owner of Training Management'),
        (@proc13, 4, 1, 1, 1, 'Supply Chain Manager - Primary owner of Supplier Management'),
        (@proc14, 2, 1, 1, 1, 'Engineering Manager - Primary owner of Change Management'),
        (@proc15, 2, 1, 1, 1, 'IT Manager - Primary owner of IT System Management');

        PRINT '  - 15 process owners assigned successfully';
    END
    ELSE
    BEGIN
        PRINT '  - WARNING: Required users (IDs 1-5) do not exist. Skipping ProcessOwners insertion.';
        PRINT '  - Please create users first, then run this section manually.';
    END
END
ELSE
BEGIN
    PRINT '  - Sample process owners already exist, skipping...';
END
GO

-- =============================================
-- 4. DOCUMENTS
-- =============================================
PRINT 'Inserting sample Documents...';

IF NOT EXISTS (SELECT * FROM Documents WHERE title = 'Quality Manual')
BEGIN
    -- Check if minimum required users exist
    IF EXISTS (SELECT * FROM Users WHERE id IN (1, 2))
    BEGIN
        INSERT INTO Documents (title, description, documentType, category, version, status, 
                               ownerId, createdBy, approvedBy, approvedAt, 
                               effectiveDate, reviewDate, filePath, fileName)
        VALUES
        -- Quality Management Documents
        ('Quality Manual', 'Company Quality Manual describing the Quality Management System per ISO 9001:2015', 
         'Policy', 'Quality', '2.0', 'approved', 
         1, 1, 1, DATEADD(MONTH, -6, GETDATE()), 
         DATEADD(MONTH, -6, GETDATE()), DATEADD(MONTH, 6, GETDATE()), 
         '/documents/quality/QM-001-v2.0.pdf', 'Quality_Manual_v2.0.pdf'),
        
        ('Quality Policy', 'Organization quality policy statement', 
         'Policy', 'Quality', '1.0', 'approved', 
         1, 1, 1, DATEADD(YEAR, -1, GETDATE()), 
         DATEADD(YEAR, -1, GETDATE()), DATEADD(YEAR, 1, GETDATE()), 
         '/documents/quality/QP-001-v1.0.pdf', 'Quality_Policy_v1.0.pdf'),
        
        ('Document Control Procedure', 'Procedure for controlling quality documents and records', 
         'Procedure', 'Quality', '1.5', 'approved', 
         1, 1, 1, DATEADD(MONTH, -3, GETDATE()), 
         DATEADD(MONTH, -3, GETDATE()), DATEADD(MONTH, 9, GETDATE()), 
         '/documents/procedures/DC-001-v1.5.pdf', 'Document_Control_Procedure_v1.5.pdf'),
        
        ('Internal Audit Procedure', 'Procedure for conducting internal audits', 
         'Procedure', 'Quality', '2.0', 'approved', 
         1, 1, 1, DATEADD(MONTH, -2, GETDATE()), 
         DATEADD(MONTH, -2, GETDATE()), DATEADD(MONTH, 10, GETDATE()), 
         '/documents/procedures/IA-001-v2.0.pdf', 'Internal_Audit_Procedure_v2.0.pdf'),
        
        ('CAPA Procedure', 'Corrective and Preventive Action procedure', 
         'Procedure', 'Quality', '1.0', 'approved', 
         1, 1, 1, DATEADD(MONTH, -4, GETDATE()), 
         DATEADD(MONTH, -4, GETDATE()), DATEADD(MONTH, 8, GETDATE()), 
         '/documents/procedures/CAPA-001-v1.0.pdf', 'CAPA_Procedure_v1.0.pdf'),
        
        -- Work Instructions
        ('Equipment Calibration Work Instruction', 'Step-by-step instructions for equipment calibration', 
         'Work Instruction', 'Quality', '1.2', 'approved', 
         2, 2, 1, DATEADD(MONTH, -1, GETDATE()), 
         DATEADD(MONTH, -1, GETDATE()), DATEADD(MONTH, 11, GETDATE()), 
         '/documents/work-instructions/WI-CAL-001-v1.2.pdf', 'Calibration_WI_v1.2.pdf'),
        
        ('Product Inspection Work Instruction', 'Instructions for final product inspection', 
         'Work Instruction', 'Quality', '1.0', 'approved', 
         1, 1, 1, DATEADD(WEEK, -2, GETDATE()), 
         DATEADD(WEEK, -2, GETDATE()), DATEADD(MONTH, 6, GETDATE()), 
         '/documents/work-instructions/WI-INSP-001-v1.0.pdf', 'Inspection_WI_v1.0.pdf'),
        
        -- Forms
        ('Non-Conformance Report Form', 'Template for documenting non-conformances', 
         'Form', 'Quality', '1.0', 'approved', 
         1, 1, 1, DATEADD(MONTH, -5, GETDATE()), 
         DATEADD(MONTH, -5, GETDATE()), DATEADD(YEAR, 1, GETDATE()), 
         '/documents/forms/NCR-FORM-001-v1.0.pdf', 'NCR_Form_v1.0.pdf'),
        
        ('Training Record Form', 'Employee training record template', 
         'Form', 'HR', '1.0', 'approved', 
         2, 2, 2, DATEADD(MONTH, -3, GETDATE()), 
         DATEADD(MONTH, -3, GETDATE()), DATEADD(YEAR, 1, GETDATE()), 
         '/documents/forms/TR-FORM-001-v1.0.pdf', 'Training_Record_Form_v1.0.pdf'),
        
        ('Calibration Record Form', 'Equipment calibration record template', 
         'Form', 'Quality', '1.1', 'approved', 
         2, 2, 1, DATEADD(MONTH, -2, GETDATE()), 
         DATEADD(MONTH, -2, GETDATE()), DATEADD(YEAR, 1, GETDATE()), 
         '/documents/forms/CAL-FORM-001-v1.1.pdf', 'Calibration_Record_Form_v1.1.pdf'),
        
        -- Documents in Review
        ('Supplier Evaluation Procedure', 'Procedure for evaluating and monitoring suppliers', 
         'Procedure', 'Supply Chain', '1.0', 'review', 
         2, 2, NULL, NULL, 
         NULL, NULL, 
         '/documents/procedures/SE-001-v1.0-draft.pdf', 'Supplier_Evaluation_Procedure_v1.0_draft.pdf'),
        
        -- Draft Documents
        ('Risk Assessment Procedure', 'Procedure for conducting risk assessments', 
         'Procedure', 'Quality', '0.9', 'draft', 
         1, 1, NULL, NULL, 
         NULL, NULL, 
         '/documents/procedures/RA-001-v0.9-draft.pdf', 'Risk_Assessment_Procedure_v0.9_draft.pdf');

        PRINT '  - 12 documents inserted successfully';
    END
    ELSE
    BEGIN
        PRINT '  - WARNING: Required users do not exist. Skipping Documents insertion.';
        PRINT '  - Please create users first, then run this section manually.';
    END
END
ELSE
BEGIN
    PRINT '  - Sample documents already exist, skipping...';
END
GO

-- =============================================
-- 5. DOCUMENT REVISIONS
-- =============================================
PRINT 'Inserting sample Document Revisions...';

IF NOT EXISTS (SELECT * FROM DocumentRevisions WHERE documentId = (SELECT id FROM Documents WHERE title = 'Quality Manual'))
BEGIN
    IF EXISTS (SELECT * FROM Documents WHERE title = 'Quality Manual')
    BEGIN
        -- Get document IDs
        DECLARE @docQM INT = (SELECT id FROM Documents WHERE title = 'Quality Manual');
        DECLARE @docQP INT = (SELECT id FROM Documents WHERE title = 'Quality Policy');
        DECLARE @docDC INT = (SELECT id FROM Documents WHERE title = 'Document Control Procedure');
        DECLARE @docIA INT = (SELECT id FROM Documents WHERE title = 'Internal Audit Procedure');
        DECLARE @docCAPA INT = (SELECT id FROM Documents WHERE title = 'CAPA Procedure');

        -- Insert revision history
        INSERT INTO DocumentRevisions (documentId, version, revisionNumber, changeDescription, changeType, 
                                       changeReason, authorId, authorName, statusBefore, statusAfter, revisionDate)
        VALUES
        -- Quality Manual revisions
        (@docQM, '1.0', 1, 'Initial creation of Quality Manual', 'create', 
         'Establish baseline QMS documentation', 1, 'System Admin', NULL, 'draft', DATEADD(YEAR, -1, GETDATE())),
        
        (@docQM, '1.0', 2, 'Quality Manual approved for use', 'approve', 
         'Completed management review and approval', 1, 'System Admin', 'draft', 'approved', DATEADD(MONTH, -11, GETDATE())),
        
        (@docQM, '2.0', 3, 'Major revision - Updated for ISO 9001:2015 compliance', 'version', 
         'Align with latest ISO standard requirements', 1, 'System Admin', 'approved', 'approved', DATEADD(MONTH, -6, GETDATE())),
        
        -- Quality Policy revisions
        (@docQP, '1.0', 1, 'Initial creation of Quality Policy', 'create', 
         'Define organizational quality commitment', 1, 'System Admin', NULL, 'draft', DATEADD(YEAR, -1, GETDATE())),
        
        (@docQP, '1.0', 2, 'Quality Policy approved by top management', 'approve', 
         'Executive management approval obtained', 1, 'System Admin', 'draft', 'approved', DATEADD(YEAR, -1, GETDATE())),
        
        -- Document Control Procedure revisions
        (@docDC, '1.0', 1, 'Initial version of Document Control Procedure', 'create', 
         'Establish document control process', 1, 'System Admin', NULL, 'draft', DATEADD(MONTH, -8, GETDATE())),
        
        (@docDC, '1.0', 2, 'Document Control Procedure approved', 'approve', 
         'Reviewed and approved by QA Manager', 1, 'System Admin', 'draft', 'approved', DATEADD(MONTH, -7, GETDATE())),
        
        (@docDC, '1.5', 3, 'Minor revision - Added electronic document procedures', 'update', 
         'Include procedures for electronic document management', 1, 'System Admin', 'approved', 'approved', DATEADD(MONTH, -3, GETDATE())),
        
        -- Internal Audit Procedure revisions
        (@docIA, '1.0', 1, 'Created Internal Audit Procedure', 'create', 
         'Define internal audit process', 1, 'System Admin', NULL, 'draft', DATEADD(MONTH, -6, GETDATE())),
        
        (@docIA, '1.0', 2, 'Internal Audit Procedure approved', 'approve', 
         'Approved after review', 1, 'System Admin', 'draft', 'approved', DATEADD(MONTH, -5, GETDATE())),
        
        (@docIA, '2.0', 3, 'Major revision - Enhanced audit planning and reporting', 'version', 
         'Improve audit effectiveness and reporting format', 1, 'System Admin', 'approved', 'approved', DATEADD(MONTH, -2, GETDATE())),
        
        -- CAPA Procedure revisions
        (@docCAPA, '1.0', 1, 'Initial CAPA Procedure created', 'create', 
         'Establish corrective and preventive action process', 1, 'System Admin', NULL, 'draft', DATEADD(MONTH, -5, GETDATE())),
        
        (@docCAPA, '1.0', 2, 'CAPA Procedure approved for implementation', 'approve', 
         'Approved by Quality Manager', 1, 'System Admin', 'draft', 'approved', DATEADD(MONTH, -4, GETDATE()));

        PRINT '  - 13 document revisions inserted successfully';
    END
    ELSE
    BEGIN
        PRINT '  - WARNING: Required documents do not exist. Skipping DocumentRevisions insertion.';
    END
END
ELSE
BEGIN
    PRINT '  - Sample document revisions already exist, skipping...';
END
GO

-- =============================================
-- 6. NOTIFICATIONS
-- =============================================
PRINT 'Inserting sample Notifications...';

IF NOT EXISTS (SELECT * FROM Notifications WHERE userId = 1 AND type = 'document_approved')
BEGIN
    IF EXISTS (SELECT * FROM Users WHERE id IN (1, 2)) AND EXISTS (SELECT * FROM Documents WHERE title = 'Quality Manual')
    BEGIN
        -- Get document and revision IDs
        DECLARE @docQMNotif INT = (SELECT id FROM Documents WHERE title = 'Quality Manual');
        DECLARE @docIANotif INT = (SELECT id FROM Documents WHERE title = 'Internal Audit Procedure');
        DECLARE @revQM INT = (SELECT TOP 1 id FROM DocumentRevisions WHERE documentId = @docQMNotif ORDER BY revisionDate DESC);

        INSERT INTO Notifications (userId, type, title, message, documentId, revisionId, isRead, readAt)
        VALUES
        -- Approved document notifications
        (1, 'document_approved', 'Document Approved: Quality Manual v2.0', 
         'Your document "Quality Manual" version 2.0 has been approved and is now effective.', 
         @docQMNotif, @revQM, 1, DATEADD(MONTH, -6, GETDATE())),
        
        (1, 'document_approved', 'Document Approved: Internal Audit Procedure v2.0', 
         'Your document "Internal Audit Procedure" version 2.0 has been approved.', 
         @docIANotif, NULL, 1, DATEADD(MONTH, -2, GETDATE())),
        
        -- Pending review notifications
        (2, 'document_changes_requested', 'Changes Requested: Supplier Evaluation Procedure', 
         'The document "Supplier Evaluation Procedure" requires revisions. Please review the comments and update accordingly.', 
         (SELECT id FROM Documents WHERE title = 'Supplier Evaluation Procedure'), NULL, 0, NULL),
        
        -- Unread notifications
        (1, 'document_approved', 'Document Approved: Calibration Record Form v1.1', 
         'The form "Calibration Record Form" version 1.1 has been approved for use.', 
         (SELECT id FROM Documents WHERE title = 'Calibration Record Form'), NULL, 0, NULL);

        PRINT '  - 4 notifications inserted successfully';
    END
    ELSE
    BEGIN
        PRINT '  - WARNING: Required users or documents do not exist. Skipping Notifications insertion.';
    END
END
ELSE
BEGIN
    PRINT '  - Sample notifications already exist, skipping...';
END
GO

-- =============================================
-- 7. EQUIPMENT
-- =============================================
PRINT 'Inserting sample Equipment...';

IF NOT EXISTS (SELECT * FROM Equipment WHERE equipmentNumber = 'EQ-001')
BEGIN
    IF EXISTS (SELECT * FROM Users WHERE id IN (1, 2, 3))
    BEGIN
        INSERT INTO Equipment (equipmentNumber, name, description, manufacturer, model, serialNumber,
                              location, department, responsiblePerson, status,
                              purchaseDate, lastCalibrationDate, nextCalibrationDate, calibrationInterval,
                              lastMaintenanceDate, nextMaintenanceDate, maintenanceInterval, qrCode)
        VALUES
        -- Production Equipment
        ('EQ-001', 'Digital Caliper - Production Line 1', 'High-precision digital caliper for dimensional measurements',
         'Mitutoyo', 'CD-6" CSX', 'SN-MIT-12345', 
         'Production Floor - Line 1', 'PROD', 1, 'operational',
         DATEADD(YEAR, -2, GETDATE()), DATEADD(MONTH, -3, GETDATE()), DATEADD(MONTH, 9, GETDATE()), 365,
         DATEADD(MONTH, -1, GETDATE()), DATEADD(MONTH, 5, GETDATE()), 180, 'QR-EQ-001'),
        
        ('EQ-002', 'Micrometer Set - QC Lab', 'Outside micrometer set 0-6 inches for precision measurements',
         'Starrett', '436.1MXRL-6', 'SN-STR-67890', 
         'Quality Control Lab - Station 2', 'QA', 1, 'operational',
         DATEADD(YEAR, -1, GETDATE()), DATEADD(MONTH, -1, GETDATE()), DATEADD(MONTH, 11, GETDATE()), 365,
         DATEADD(MONTH, -2, GETDATE()), DATEADD(MONTH, 4, GETDATE()), 180, 'QR-EQ-002'),
        
        ('EQ-003', 'Torque Wrench - Assembly Station', 'Digital torque wrench 10-100 Nm',
         'Snap-on', 'ATECH2FR100', 'SN-SNP-11223', 
         'Assembly Floor - Station 5', 'PROD', 2, 'calibration_due',
         DATEADD(MONTH, -18, GETDATE()), DATEADD(MONTH, -6, GETDATE()), DATEADD(MONTH, -1, GETDATE()), 180,
         DATEADD(MONTH, -3, GETDATE()), DATEADD(MONTH, 3, GETDATE()), 180, 'QR-EQ-003'),
        
        ('EQ-004', 'Pressure Gauge - Test Lab', 'Digital pressure gauge 0-1000 PSI',
         'WIKA', 'CPG1500', 'SN-WIK-44556', 
         'Testing Lab - Hydraulics Section', 'ENG', 2, 'operational',
         DATEADD(YEAR, -3, GETDATE()), DATEADD(MONTH, -2, GETDATE()), DATEADD(MONTH, 10, GETDATE()), 365,
         DATEADD(MONTH, -4, GETDATE()), DATEADD(MONTH, 2, GETDATE()), 180, 'QR-EQ-004'),
        
        ('EQ-005', 'Coordinate Measuring Machine', 'CMM for 3D dimensional inspection',
         'Zeiss', 'Contura G2', 'SN-ZEI-99887', 
         'Quality Control Lab - CMM Room', 'QA', 1, 'operational',
         DATEADD(YEAR, -4, GETDATE()), DATEADD(MONTH, -2, GETDATE()), DATEADD(MONTH, 10, GETDATE()), 365,
         DATEADD(WEEK, -2, GETDATE()), DATEADD(MONTH, 3, GETDATE()), 90, 'QR-EQ-005'),
        
        ('EQ-006', 'Spectrophotometer - Lab', 'UV-Vis spectrophotometer for material analysis',
         'Agilent', 'Cary 60', 'SN-AGL-77665', 
         'R&D Lab - Analysis Room', 'RD', 3, 'operational',
         DATEADD(YEAR, -1, GETDATE()), DATEADD(MONTH, -4, GETDATE()), DATEADD(MONTH, 8, GETDATE()), 365,
         DATEADD(MONTH, -1, GETDATE()), DATEADD(MONTH, 5, GETDATE()), 180, 'QR-EQ-006'),
        
        ('EQ-007', 'Environmental Chamber', 'Temperature and humidity controlled test chamber',
         'Thermotron', 'SE-600', 'SN-THM-33221', 
         'Testing Lab - Environmental Testing', 'ENG', 2, 'maintenance',
         DATEADD(YEAR, -5, GETDATE()), DATEADD(MONTH, -12, GETDATE()), DATEADD(MONTH, 6, GETDATE()), 545,
         DATEADD(WEEK, -1, GETDATE()), DATEADD(MONTH, 2, GETDATE()), 90, 'QR-EQ-007'),
        
        ('EQ-008', 'Hardness Tester - Rockwell', 'Rockwell hardness testing machine',
         'Wilson', 'VH3300', 'SN-WIL-55443', 
         'Quality Control Lab - Materials Testing', 'QA', 1, 'operational',
         DATEADD(YEAR, -2, GETDATE()), DATEADD(MONTH, -3, GETDATE()), DATEADD(MONTH, 9, GETDATE()), 365,
         DATEADD(MONTH, -2, GETDATE()), DATEADD(MONTH, 4, GETDATE()), 180, 'QR-EQ-008'),
        
        ('EQ-009', 'Scale - Analytical Balance', 'Precision analytical balance 0.0001g resolution',
         'Mettler Toledo', 'XS204', 'SN-MET-88776', 
         'Quality Control Lab - Weighing Room', 'QA', 1, 'operational',
         DATEADD(YEAR, -1, GETDATE()), DATEADD(MONTH, -1, GETDATE()), DATEADD(MONTH, 11, GETDATE()), 365,
         DATEADD(MONTH, -1, GETDATE()), DATEADD(MONTH, 5, GETDATE()), 180, 'QR-EQ-009'),
        
        ('EQ-010', 'Tensile Testing Machine', 'Universal testing machine for tensile strength testing',
         'Instron', '5969', 'SN-INS-22334', 
         'Materials Lab - Mechanical Testing', 'ENG', 2, 'operational',
         DATEADD(YEAR, -6, GETDATE()), DATEADD(MONTH, -6, GETDATE()), DATEADD(MONTH, 6, GETDATE()), 365,
         DATEADD(MONTH, -3, GETDATE()), DATEADD(MONTH, 3, GETDATE()), 180, 'QR-EQ-010');

        PRINT '  - 10 equipment records inserted successfully';
    END
    ELSE
    BEGIN
        PRINT '  - WARNING: Required users do not exist. Skipping Equipment insertion.';
    END
END
ELSE
BEGIN
    PRINT '  - Sample equipment already exists, skipping...';
END
GO

-- =============================================
-- 8. USER ROLES
-- =============================================
PRINT 'Inserting sample User Roles...';

-- NOTE: This section assigns roles to users
-- Requires actual user IDs from the Users table
-- The following uses placeholder user IDs

IF NOT EXISTS (SELECT * FROM UserRoles WHERE userId = 1)
BEGIN
    IF EXISTS (SELECT * FROM Users WHERE id IN (1, 2, 3, 4, 5))
    BEGIN
        -- Get role IDs
        DECLARE @roleSuperuser INT = (SELECT id FROM Roles WHERE name = 'superuser');
        DECLARE @roleAdmin INT = (SELECT id FROM Roles WHERE name = 'admin');
        DECLARE @roleManager INT = (SELECT id FROM Roles WHERE name = 'manager');
        DECLARE @roleAuditor INT = (SELECT id FROM Roles WHERE name = 'auditor');
        DECLARE @roleUser INT = (SELECT id FROM Roles WHERE name = 'user');
        DECLARE @roleViewer INT = (SELECT id FROM Roles WHERE name = 'viewer');

        -- Assign roles to users
        -- User 1: Superuser (full access)
        -- User 2: Admin (administrative access)
        -- User 3: Manager (process management)
        -- User 4: Auditor (audit and NCR access)
        -- User 5: User (standard user access)
        
        INSERT INTO UserRoles (userId, roleId, assignedBy, active, notes)
        VALUES
        (1, @roleSuperuser, 1, 1, 'System administrator with full access'),
        (2, @roleAdmin, 1, 1, 'Quality manager with administrative access'),
        (2, @roleAuditor, 1, 1, 'Also serves as internal auditor'),
        (3, @roleManager, 1, 1, 'Production manager'),
        (4, @roleManager, 1, 1, 'Supply chain manager'),
        (4, @roleUser, 1, 1, 'Standard user access for document management'),
        (5, @roleUser, 1, 1, 'Engineering staff member');

        PRINT '  - 7 user role assignments inserted successfully';
    END
    ELSE
    BEGIN
        PRINT '  - WARNING: Required users do not exist. Skipping UserRoles insertion.';
        PRINT '  - Please create users first, then run this section manually.';
    END
END
ELSE
BEGIN
    PRINT '  - Sample user roles already exist, skipping...';
END
GO

-- =============================================
-- SEED DATA INSERTION COMPLETE
-- =============================================
PRINT '========================================';
PRINT 'Seed Data Insertion Completed';
PRINT '========================================';
PRINT '';
PRINT 'Summary:';
PRINT '  - Departments: Sample organizational units';
PRINT '  - Processes: ISO 9001 QMS processes (Management, Core, Support)';
PRINT '  - ProcessOwners: Process ownership assignments';
PRINT '  - Documents: Quality documents with versioning';
PRINT '  - DocumentRevisions: Document revision history';
PRINT '  - Notifications: Sample notifications';
PRINT '  - Equipment: Equipment with calibration/maintenance tracking';
PRINT '  - UserRoles: User-role assignments';
PRINT '';
PRINT 'NOTES:';
PRINT '  - User table was excluded as specified';
PRINT '  - Tables with user dependencies assume user IDs 1-5 exist';
PRINT '  - Modify user ID references if your Users table has different IDs';
PRINT '  - All data includes proper ISO 9001 compliance structure';
PRINT '  - Foreign key relationships are maintained';
PRINT '========================================';
GO

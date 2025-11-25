-- =============================================
-- Patch 72: Create WorkRoles Table
-- =============================================
-- Description: Creates WorkRoles table for managing job/work roles within the organization.
-- WorkRoles are connected to the competence matrix and define what competencies 
-- are required for specific positions/roles in the organization.
-- Version: 1.0.72
-- Author: E-QMS System
-- Date: 2025-11-25
-- =============================================

USE EQMS;
GO

PRINT 'Starting Patch 72: Create WorkRoles Table';
PRINT '==========================================';
GO

-- =============================================
-- Create WorkRoles Table
-- =============================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'WorkRoles')
BEGIN
    CREATE TABLE WorkRoles (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Core Information
        name NVARCHAR(200) NOT NULL, -- Role name (e.g., "Quality Manager", "Production Operator")
        code NVARCHAR(50), -- Optional short code for the role (e.g., "QM", "PO")
        description NVARCHAR(2000), -- Detailed description of the role
        
        -- Organizational Structure
        departmentId INT, -- Foreign key to Departments table
        category NVARCHAR(100), -- Category/classification (e.g., "Management", "Technical", "Administrative")
        level NVARCHAR(50), -- Job level (e.g., "Entry", "Mid", "Senior", "Executive")
        
        -- Status and Display
        status NVARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'archived'
        displayOrder INT DEFAULT 0, -- For custom sorting in UI
        active BIT DEFAULT 1, -- Quick active/inactive flag
        
        -- ISO 9001 Compliance Fields
        responsibilitiesAndAuthorities NVARCHAR(MAX), -- Key responsibilities and authorities per ISO 9001:2015 clause 5.3
        requiredQualifications NVARCHAR(2000), -- Minimum qualifications needed
        experienceYears INT, -- Minimum years of experience
        
        -- Documentation and Notes
        notes NVARCHAR(2000), -- Additional notes or comments
        attachmentPath NVARCHAR(500), -- Optional path to role description document
        
        -- Audit Trail
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        createdBy INT NOT NULL, -- User who created this work role
        updatedBy INT, -- User who last updated this work role
        
        -- Foreign Key Constraints
        CONSTRAINT FK_WorkRoles_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        CONSTRAINT FK_WorkRoles_UpdatedBy FOREIGN KEY (updatedBy) REFERENCES Users(id),
        CONSTRAINT FK_WorkRoles_Department FOREIGN KEY (departmentId) REFERENCES Departments(id),
        
        -- Constraints
        CONSTRAINT CK_WorkRoles_Status CHECK (status IN ('active', 'inactive', 'archived')),
        CONSTRAINT CK_WorkRoles_Level CHECK (level IS NULL OR level IN ('Entry', 'Junior', 'Mid', 'Senior', 'Lead', 'Manager', 'Director', 'Executive')),
        CONSTRAINT CK_WorkRoles_ExperienceYears CHECK (experienceYears IS NULL OR experienceYears >= 0),
        
        -- Unique constraint: Role names should be unique within active records
        CONSTRAINT UQ_WorkRoles_Name UNIQUE (name)
    );

    -- Indexes for Performance
    
    -- Primary lookups
    CREATE INDEX IX_WorkRoles_Name ON WorkRoles(name);
    CREATE INDEX IX_WorkRoles_Code ON WorkRoles(code);
    CREATE INDEX IX_WorkRoles_Status ON WorkRoles(status);
    CREATE INDEX IX_WorkRoles_Active ON WorkRoles(active);
    
    -- Organizational filters
    CREATE INDEX IX_WorkRoles_DepartmentId ON WorkRoles(departmentId);
    CREATE INDEX IX_WorkRoles_Category ON WorkRoles(category);
    CREATE INDEX IX_WorkRoles_Level ON WorkRoles(level);
    
    -- Display and sorting
    CREATE INDEX IX_WorkRoles_DisplayOrder ON WorkRoles(displayOrder);
    
    -- Audit trail
    CREATE INDEX IX_WorkRoles_CreatedBy ON WorkRoles(createdBy);
    CREATE INDEX IX_WorkRoles_UpdatedBy ON WorkRoles(updatedBy);
    CREATE INDEX IX_WorkRoles_CreatedAt ON WorkRoles(createdAt);
    CREATE INDEX IX_WorkRoles_UpdatedAt ON WorkRoles(updatedAt);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_WorkRoles_Status_DisplayOrder ON WorkRoles(status, displayOrder);
    CREATE INDEX IX_WorkRoles_Department_Status ON WorkRoles(departmentId, status);
    CREATE INDEX IX_WorkRoles_Active_DisplayOrder ON WorkRoles(active, displayOrder) WHERE active = 1;
    CREATE INDEX IX_WorkRoles_Category_Status ON WorkRoles(category, status);

    PRINT '✓ WorkRoles table created successfully';
END
ELSE
BEGIN
    PRINT '○ WorkRoles table already exists';
END
GO

-- =============================================
-- Insert Sample WorkRoles
-- =============================================

-- Get a valid user ID for createdBy (use first superuser or admin)
DECLARE @createdByUserId INT;
SELECT TOP 1 @createdByUserId = u.id 
FROM Users u
INNER JOIN UserRoles ur ON u.id = ur.userId
INNER JOIN Roles r ON ur.roleId = r.id
WHERE r.name IN ('superuser', 'admin') AND u.active = 1
ORDER BY r.level DESC;

-- If no admin/superuser found, use the first active user
IF @createdByUserId IS NULL
BEGIN
    SELECT TOP 1 @createdByUserId = id FROM Users WHERE active = 1;
END

-- Insert sample work roles if the table is empty
IF NOT EXISTS (SELECT * FROM WorkRoles)
BEGIN
    -- Management Roles
    INSERT INTO WorkRoles (name, code, description, category, level, status, displayOrder, createdBy, responsibilitiesAndAuthorities)
    VALUES 
    ('Quality Manager', 'QM', 'Oversees quality management system, ensures ISO 9001 compliance, and leads continuous improvement initiatives.', 'Management', 'Manager', 'active', 10, @createdByUserId, 
     'Overall responsibility for QMS effectiveness, authority to approve quality procedures, manage quality audits, and implement corrective actions.'),
    
    ('Operations Manager', 'OM', 'Manages day-to-day operations, production planning, and resource allocation.', 'Management', 'Manager', 'active', 20, @createdByUserId,
     'Authority to plan and direct operations, allocate resources, ensure compliance with operational procedures.'),
    
    ('Department Manager', 'DM', 'Leads and manages department activities, personnel, and objectives.', 'Management', 'Manager', 'active', 30, @createdByUserId,
     'Manage department staff, approve departmental procedures, ensure team competency and performance.');

    -- Technical Roles
    INSERT INTO WorkRoles (name, code, description, category, level, status, displayOrder, createdBy, requiredQualifications, experienceYears)
    VALUES 
    ('Quality Engineer', 'QE', 'Develops quality control processes, conducts inspections, and analyzes quality data.', 'Technical', 'Senior', 'active', 40, @createdByUserId,
     'Engineering degree or equivalent, knowledge of quality management systems and statistical process control.', 3),
    
    ('Quality Technician', 'QT', 'Performs quality inspections, testing, and documentation according to established procedures.', 'Technical', 'Mid', 'active', 50, @createdByUserId,
     'Technical diploma or equivalent, basic understanding of quality control methods.', 1),
    
    ('Process Engineer', 'PE', 'Designs and optimizes manufacturing processes, develops work instructions, and implements process improvements.', 'Technical', 'Senior', 'active', 60, @createdByUserId,
     'Engineering degree, process improvement methodologies (Lean, Six Sigma).', 3);

    -- Auditor Roles
    INSERT INTO WorkRoles (name, code, description, category, level, status, displayOrder, createdBy, requiredQualifications, experienceYears)
    VALUES 
    ('Lead Auditor', 'LA', 'Plans and conducts internal audits, leads audit teams, and reports findings to management.', 'Quality Assurance', 'Lead', 'active', 70, @createdByUserId,
     'ISO 9001 Lead Auditor certification, in-depth knowledge of audit principles and techniques.', 5),
    
    ('Internal Auditor', 'IA', 'Conducts internal audits, identifies non-conformances, and verifies corrective actions.', 'Quality Assurance', 'Mid', 'active', 80, @createdByUserId,
     'ISO 9001 Internal Auditor training, understanding of audit procedures.', 2);

    -- Production Roles
    INSERT INTO WorkRoles (name, code, description, category, level, status, displayOrder, createdBy, requiredQualifications)
    VALUES 
    ('Production Supervisor', 'PS', 'Supervises production operations, ensures quality standards, and manages production team.', 'Production', 'Lead', 'active', 90, @createdByUserId,
     'Production management experience, knowledge of manufacturing processes.'),
    
    ('Production Operator', 'PO', 'Operates production equipment, follows work instructions, and maintains quality standards.', 'Production', 'Entry', 'active', 100, @createdByUserId,
     'Basic technical skills, ability to follow written procedures.'),
    
    ('Machine Operator', 'MO', 'Operates specific machinery, performs routine maintenance, and ensures production quality.', 'Production', 'Junior', 'active', 110, @createdByUserId,
     'Machine operation training, basic maintenance skills.');

    -- Administrative Roles
    INSERT INTO WorkRoles (name, code, description, category, level, status, displayOrder, createdBy)
    VALUES 
    ('Document Controller', 'DC', 'Manages document control system, ensures document accuracy and version control.', 'Administrative', 'Mid', 'active', 120, @createdByUserId),
    
    ('Quality Coordinator', 'QC', 'Coordinates quality activities, maintains quality records, and supports audit processes.', 'Administrative', 'Mid', 'active', 130, @createdByUserId),
    
    ('Training Coordinator', 'TC', 'Manages training programs, maintains training records, and tracks competency requirements.', 'Administrative', 'Mid', 'active', 140, @createdByUserId);

    PRINT '✓ Sample work roles inserted successfully';
END
ELSE
BEGIN
    PRINT '○ WorkRoles table already contains data';
END
GO

-- =============================================
-- Record Schema Version
-- =============================================

IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.72' AND scriptName = '72_create_work_roles_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.72',
        'Create WorkRoles table for managing job/work roles',
        '72_create_work_roles_table.sql',
        'SUCCESS',
        'WorkRoles table supports organizational role definitions connected to competence matrix. Includes role hierarchy, qualifications, responsibilities per ISO 9001:2015, and relationship to departments.'
    );
    
    PRINT '✓ Database version recorded';
END
ELSE
BEGIN
    PRINT '○ Database version already recorded';
END
GO

PRINT '';
PRINT 'Patch 72 completed successfully';
PRINT '==========================================';
GO

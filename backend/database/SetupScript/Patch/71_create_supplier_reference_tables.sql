-- =============================================
-- Patch 71: Create Supplier Reference Tables
-- =============================================
-- Description: Creates reference tables for Supplier Categories, Types, and Industries
-- to provide dropdown options in the Approved Supplier List form.
-- Version: 1.0.71
-- Author: E-QMS System
-- Date: 2025-11-25
-- =============================================

USE eqms;
GO

PRINT '======================================';
PRINT 'Patch 71: Creating Supplier Reference Tables';
PRINT '======================================';
PRINT '';

-- =============================================
-- Create SupplierCategories Table
-- =============================================

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SupplierCategories]') AND type in (N'U'))
BEGIN
    CREATE TABLE SupplierCategories (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL UNIQUE,
        description NVARCHAR(500) NULL,
        isActive BIT DEFAULT 1,
        displayOrder INT DEFAULT 0,
        createdAt DATETIME DEFAULT GETDATE(),
        createdBy INT NULL,
        updatedAt DATETIME NULL,
        updatedBy INT NULL
    );
    
    PRINT '✓ SupplierCategories table created';
END
ELSE
BEGIN
    PRINT '○ SupplierCategories table already exists';
END
GO

-- =============================================
-- Create SupplierTypes Table
-- =============================================

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SupplierTypes]') AND type in (N'U'))
BEGIN
    CREATE TABLE SupplierTypes (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL UNIQUE,
        description NVARCHAR(500) NULL,
        isActive BIT DEFAULT 1,
        displayOrder INT DEFAULT 0,
        createdAt DATETIME DEFAULT GETDATE(),
        createdBy INT NULL,
        updatedAt DATETIME NULL,
        updatedBy INT NULL
    );
    
    PRINT '✓ SupplierTypes table created';
END
ELSE
BEGIN
    PRINT '○ SupplierTypes table already exists';
END
GO

-- =============================================
-- Create SupplierIndustries Table
-- =============================================

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SupplierIndustries]') AND type in (N'U'))
BEGIN
    CREATE TABLE SupplierIndustries (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL UNIQUE,
        description NVARCHAR(500) NULL,
        isActive BIT DEFAULT 1,
        displayOrder INT DEFAULT 0,
        createdAt DATETIME DEFAULT GETDATE(),
        createdBy INT NULL,
        updatedAt DATETIME NULL,
        updatedBy INT NULL
    );
    
    PRINT '✓ SupplierIndustries table created';
END
ELSE
BEGIN
    PRINT '○ SupplierIndustries table already exists';
END
GO

-- =============================================
-- Seed Default Supplier Categories
-- =============================================

IF NOT EXISTS (SELECT * FROM SupplierCategories)
BEGIN
    INSERT INTO SupplierCategories (name, description, displayOrder) VALUES
    ('Raw Materials', 'Suppliers providing raw materials for production', 1),
    ('Components', 'Suppliers of components and parts', 2),
    ('Equipment', 'Suppliers of machinery and equipment', 3),
    ('Services', 'Service providers (consulting, maintenance, etc.)', 4),
    ('Software', 'Software and IT service providers', 5),
    ('Packaging', 'Packaging materials suppliers', 6),
    ('Logistics', 'Transportation and logistics providers', 7),
    ('Utilities', 'Utility service providers (electricity, water, etc.)', 8),
    ('Office Supplies', 'Office supplies and consumables', 9),
    ('Professional Services', 'Legal, accounting, and professional services', 10);
    
    PRINT '✓ Default supplier categories seeded (10 categories)';
END
ELSE
BEGIN
    PRINT '○ Supplier categories already seeded';
END
GO

-- =============================================
-- Seed Default Supplier Types
-- =============================================

IF NOT EXISTS (SELECT * FROM SupplierTypes)
BEGIN
    INSERT INTO SupplierTypes (name, description, displayOrder) VALUES
    ('Manufacturer', 'Direct manufacturer of products', 1),
    ('Distributor', 'Distribution and wholesale supplier', 2),
    ('Reseller', 'Retail or resale supplier', 3),
    ('Service Provider', 'Service-based supplier', 4),
    ('Contractor', 'Contract-based service provider', 5),
    ('Consultant', 'Consulting and advisory services', 6),
    ('Agent', 'Sales agent or representative', 7),
    ('OEM', 'Original Equipment Manufacturer', 8),
    ('Subcontractor', 'Subcontracted service provider', 9),
    ('Partner', 'Strategic business partner', 10);
    
    PRINT '✓ Default supplier types seeded (10 types)';
END
ELSE
BEGIN
    PRINT '○ Supplier types already seeded';
END
GO

-- =============================================
-- Seed Default Supplier Industries
-- =============================================

IF NOT EXISTS (SELECT * FROM SupplierIndustries)
BEGIN
    INSERT INTO SupplierIndustries (name, description, displayOrder) VALUES
    ('Manufacturing', 'Manufacturing and production industries', 1),
    ('Technology', 'Technology and IT industries', 2),
    ('Healthcare', 'Healthcare and medical industries', 3),
    ('Construction', 'Construction and building industries', 4),
    ('Automotive', 'Automotive and transportation industries', 5),
    ('Aerospace', 'Aerospace and aviation industries', 6),
    ('Pharmaceuticals', 'Pharmaceutical and biotech industries', 7),
    ('Food & Beverage', 'Food and beverage production', 8),
    ('Electronics', 'Electronics and electrical components', 9),
    ('Chemical', 'Chemical and petrochemical industries', 10),
    ('Textile', 'Textile and apparel industries', 11),
    ('Energy', 'Energy and utilities sector', 12),
    ('Telecommunications', 'Telecommunications and networking', 13),
    ('Retail', 'Retail and consumer goods', 14),
    ('Agriculture', 'Agriculture and farming', 15),
    ('Mining', 'Mining and extraction industries', 16),
    ('Logistics', 'Logistics and supply chain', 17),
    ('Financial Services', 'Banking and financial services', 18),
    ('Professional Services', 'Consulting and professional services', 19),
    ('Other', 'Other industries', 20);
    
    PRINT '✓ Default supplier industries seeded (20 industries)';
END
ELSE
BEGIN
    PRINT '○ Supplier industries already seeded';
END
GO

-- =============================================
-- Create Indexes for Performance
-- =============================================

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SupplierCategories_Active_Order')
BEGIN
    CREATE INDEX IX_SupplierCategories_Active_Order ON SupplierCategories(isActive, displayOrder);
    PRINT '✓ Index created on SupplierCategories';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SupplierTypes_Active_Order')
BEGIN
    CREATE INDEX IX_SupplierTypes_Active_Order ON SupplierTypes(isActive, displayOrder);
    PRINT '✓ Index created on SupplierTypes';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SupplierIndustries_Active_Order')
BEGIN
    CREATE INDEX IX_SupplierIndustries_Active_Order ON SupplierIndustries(isActive, displayOrder);
    PRINT '✓ Index created on SupplierIndustries';
END
GO

-- =============================================
-- Record Database Version
-- =============================================

IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.71' AND scriptName = '71_create_supplier_reference_tables.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.71',
        'Create reference tables for Supplier Categories, Types, and Industries with default seed data',
        '71_create_supplier_reference_tables.sql',
        'SUCCESS',
        'Created SupplierCategories (10 items), SupplierTypes (10 items), and SupplierIndustries (20 items) with indexes for performance'
    );
    PRINT '✓ Database version 1.0.71 recorded';
END
ELSE
BEGIN
    PRINT '○ Database version 1.0.71 already recorded';
END
GO

PRINT '';
PRINT '======================================';
PRINT 'Patch 71: Completed Successfully';
PRINT '======================================';
PRINT '';
PRINT 'Summary:';
PRINT '- SupplierCategories: 10 default categories';
PRINT '- SupplierTypes: 10 default types';
PRINT '- SupplierIndustries: 20 default industries';
PRINT '- All tables indexed for performance';
PRINT '======================================';

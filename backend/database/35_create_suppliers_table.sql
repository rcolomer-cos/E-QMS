-- =============================================
-- Suppliers Table
-- =============================================
-- Stores supplier details including contact info, categories, approval status, and related audit/evaluation data
-- Supports ISO 9001 supplier quality management requirements

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Suppliers')
BEGIN
    CREATE TABLE Suppliers (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Supplier Identification
        supplierNumber NVARCHAR(100) UNIQUE NOT NULL, -- Unique supplier identifier
        name NVARCHAR(500) NOT NULL, -- Supplier company name
        description NVARCHAR(2000), -- Detailed supplier description
        
        -- Contact Information
        contactPerson NVARCHAR(200), -- Primary contact person name
        email NVARCHAR(255), -- Supplier email address
        phone NVARCHAR(50), -- Primary phone number
        alternatePhone NVARCHAR(50), -- Secondary phone number
        fax NVARCHAR(50), -- Fax number
        website NVARCHAR(500), -- Supplier website URL
        
        -- Address Information
        addressLine1 NVARCHAR(500), -- Street address line 1
        addressLine2 NVARCHAR(500), -- Street address line 2
        city NVARCHAR(200), -- City
        stateProvince NVARCHAR(200), -- State or province
        postalCode NVARCHAR(50), -- Postal or ZIP code
        country NVARCHAR(100), -- Country
        
        -- Supplier Classification
        category NVARCHAR(200) NOT NULL, -- Supplier category (Raw Materials, Components, Services, Equipment, etc.)
        supplierType NVARCHAR(100), -- Supplier type (Manufacturer, Distributor, Service Provider, Contractor)
        industry NVARCHAR(200), -- Industry sector
        productsServices NVARCHAR(2000), -- Description of products/services provided
        
        -- Approval and Status Management
        approvalStatus NVARCHAR(50) NOT NULL DEFAULT 'pending', -- Current approval status
        approvedDate DATETIME2, -- Date supplier was approved
        approvedBy INT NULL, -- User who approved the supplier
        suspendedDate DATETIME2, -- Date supplier was suspended (if applicable)
        suspendedReason NVARCHAR(1000), -- Reason for suspension
        active BIT DEFAULT 1, -- Active flag (soft delete support)
        
        -- Quality Management
        rating INT, -- Quality rating (1-5 scale)
        performanceScore DECIMAL(5,2), -- Performance score (0-100)
        qualityGrade NVARCHAR(50), -- Quality grade (A, B, C, D, F)
        certifications NVARCHAR(1000), -- List of certifications held by supplier (ISO 9001, ISO 14001, etc.)
        complianceStatus NVARCHAR(50), -- Compliance status (Compliant, Non-Compliant, Under Review)
        
        -- Evaluation and Audit Tracking
        lastEvaluationDate DATETIME2, -- Date of last supplier evaluation
        nextEvaluationDate DATETIME2, -- Next scheduled evaluation date
        evaluationFrequency INT, -- Evaluation frequency in days
        lastAuditDate DATETIME2, -- Date of last supplier audit
        nextAuditDate DATETIME2, -- Next scheduled audit date
        auditFrequency INT, -- Audit frequency in days
        
        -- Risk Assessment
        riskLevel NVARCHAR(50), -- Risk level (Low, Medium, High, Critical)
        criticalSupplier BIT DEFAULT 0, -- Flag for critical suppliers
        backupSupplierAvailable BIT DEFAULT 0, -- Indicates if backup supplier exists
        backupSupplierId INT NULL, -- Reference to backup supplier
        
        -- Business Information
        businessRegistrationNumber NVARCHAR(200), -- Business registration or tax ID
        dunsNumber NVARCHAR(50), -- Dun & Bradstreet number
        establishedYear INT, -- Year supplier was established
        employeeCount INT, -- Number of employees
        annualRevenue DECIMAL(18,2), -- Annual revenue
        currency NVARCHAR(10), -- Currency code (USD, EUR, etc.)
        
        -- Payment and Terms
        paymentTerms NVARCHAR(200), -- Payment terms (Net 30, Net 60, etc.)
        creditLimit DECIMAL(18,2), -- Credit limit
        bankName NVARCHAR(200), -- Bank name
        bankAccountNumber NVARCHAR(100), -- Bank account number (encrypted in application)
        
        -- Relationship Management
        supplierManager INT NULL, -- User responsible for managing this supplier relationship
        department NVARCHAR(100), -- Department associated with supplier
        relationshipStartDate DATETIME2, -- Date relationship started
        contractExpiryDate DATETIME2, -- Contract expiry date
        preferredSupplier BIT DEFAULT 0, -- Flag for preferred suppliers
        
        -- Performance Metrics
        onTimeDeliveryRate DECIMAL(5,2), -- On-time delivery rate (0-100%)
        qualityRejectRate DECIMAL(5,2), -- Quality reject rate (0-100%)
        responsiveness NVARCHAR(50), -- Responsiveness rating (Excellent, Good, Fair, Poor)
        totalPurchaseValue DECIMAL(18,2), -- Total value of purchases to date
        
        -- ISO 9001 Compliance Fields
        iso9001Certified BIT DEFAULT 0, -- ISO 9001 certification flag
        iso9001CertificateNumber NVARCHAR(200), -- ISO 9001 certificate number
        iso9001ExpiryDate DATETIME2, -- ISO 9001 certificate expiry date
        
        -- Additional Metadata
        notes NVARCHAR(MAX), -- Additional notes or comments
        internalReference NVARCHAR(200), -- Internal reference code
        tags NVARCHAR(500), -- Searchable tags
        
        -- Audit Trail
        createdBy INT NOT NULL, -- User who created the supplier record
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        deactivatedAt DATETIME2, -- Date when supplier was deactivated
        deactivatedBy INT NULL, -- User who deactivated the supplier
        
        -- Foreign Key Constraints
        CONSTRAINT FK_Suppliers_ApprovedBy FOREIGN KEY (approvedBy) REFERENCES Users(id),
        CONSTRAINT FK_Suppliers_SupplierManager FOREIGN KEY (supplierManager) REFERENCES Users(id),
        CONSTRAINT FK_Suppliers_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        CONSTRAINT FK_Suppliers_DeactivatedBy FOREIGN KEY (deactivatedBy) REFERENCES Users(id),
        CONSTRAINT FK_Suppliers_BackupSupplier FOREIGN KEY (backupSupplierId) REFERENCES Suppliers(id),
        
        -- Constraints
        CONSTRAINT CK_Suppliers_ApprovalStatus CHECK (approvalStatus IN (
            'pending',
            'under_review',
            'approved',
            'conditional_approval',
            'rejected',
            'suspended',
            'deactivated'
        )),
        CONSTRAINT CK_Suppliers_Rating CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
        CONSTRAINT CK_Suppliers_PerformanceScore CHECK (performanceScore IS NULL OR performanceScore BETWEEN 0 AND 100),
        CONSTRAINT CK_Suppliers_QualityGrade CHECK (qualityGrade IS NULL OR qualityGrade IN ('A', 'B', 'C', 'D', 'F')),
        CONSTRAINT CK_Suppliers_ComplianceStatus CHECK (complianceStatus IS NULL OR complianceStatus IN (
            'Compliant',
            'Non-Compliant',
            'Under Review',
            'Not Assessed'
        )),
        CONSTRAINT CK_Suppliers_RiskLevel CHECK (riskLevel IS NULL OR riskLevel IN (
            'Low',
            'Medium',
            'High',
            'Critical'
        )),
        CONSTRAINT CK_Suppliers_EvaluationFrequency CHECK (evaluationFrequency IS NULL OR evaluationFrequency > 0),
        CONSTRAINT CK_Suppliers_AuditFrequency CHECK (auditFrequency IS NULL OR auditFrequency > 0),
        CONSTRAINT CK_Suppliers_OnTimeDeliveryRate CHECK (onTimeDeliveryRate IS NULL OR onTimeDeliveryRate BETWEEN 0 AND 100),
        CONSTRAINT CK_Suppliers_QualityRejectRate CHECK (qualityRejectRate IS NULL OR qualityRejectRate BETWEEN 0 AND 100),
        CONSTRAINT CK_Suppliers_Responsiveness CHECK (responsiveness IS NULL OR responsiveness IN (
            'Excellent',
            'Good',
            'Fair',
            'Poor',
            'Not Rated'
        )),
        CONSTRAINT CK_Suppliers_Email CHECK (email IS NULL OR email LIKE '%_@_%._%')
    );

    -- Indexes for Performance
    
    -- Primary identifier lookups
    CREATE UNIQUE INDEX IX_Suppliers_SupplierNumber ON Suppliers(supplierNumber);
    CREATE INDEX IX_Suppliers_Name ON Suppliers(name);
    
    -- Status and classification tracking
    CREATE INDEX IX_Suppliers_ApprovalStatus ON Suppliers(approvalStatus);
    CREATE INDEX IX_Suppliers_Active ON Suppliers(active);
    CREATE INDEX IX_Suppliers_Category ON Suppliers(category);
    CREATE INDEX IX_Suppliers_SupplierType ON Suppliers(supplierType);
    CREATE INDEX IX_Suppliers_Industry ON Suppliers(industry);
    
    -- Quality and performance tracking
    CREATE INDEX IX_Suppliers_Rating ON Suppliers(rating DESC);
    CREATE INDEX IX_Suppliers_PerformanceScore ON Suppliers(performanceScore DESC);
    CREATE INDEX IX_Suppliers_QualityGrade ON Suppliers(qualityGrade);
    CREATE INDEX IX_Suppliers_ComplianceStatus ON Suppliers(complianceStatus);
    CREATE INDEX IX_Suppliers_RiskLevel ON Suppliers(riskLevel);
    
    -- Date-based queries for evaluation and audit scheduling
    CREATE INDEX IX_Suppliers_LastEvaluationDate ON Suppliers(lastEvaluationDate);
    CREATE INDEX IX_Suppliers_NextEvaluationDate ON Suppliers(nextEvaluationDate);
    CREATE INDEX IX_Suppliers_LastAuditDate ON Suppliers(lastAuditDate);
    CREATE INDEX IX_Suppliers_NextAuditDate ON Suppliers(nextAuditDate);
    CREATE INDEX IX_Suppliers_ApprovedDate ON Suppliers(approvedDate);
    CREATE INDEX IX_Suppliers_ContractExpiryDate ON Suppliers(contractExpiryDate);
    CREATE INDEX IX_Suppliers_ISO9001ExpiryDate ON Suppliers(iso9001ExpiryDate);
    
    -- Personnel and department tracking
    CREATE INDEX IX_Suppliers_ApprovedBy ON Suppliers(approvedBy);
    CREATE INDEX IX_Suppliers_SupplierManager ON Suppliers(supplierManager);
    CREATE INDEX IX_Suppliers_CreatedBy ON Suppliers(createdBy);
    CREATE INDEX IX_Suppliers_Department ON Suppliers(department);
    
    -- Special flags
    CREATE INDEX IX_Suppliers_CriticalSupplier ON Suppliers(criticalSupplier);
    CREATE INDEX IX_Suppliers_PreferredSupplier ON Suppliers(preferredSupplier);
    CREATE INDEX IX_Suppliers_ISO9001Certified ON Suppliers(iso9001Certified);
    
    -- Location tracking
    CREATE INDEX IX_Suppliers_City ON Suppliers(city);
    CREATE INDEX IX_Suppliers_Country ON Suppliers(country);
    
    -- Audit trail
    CREATE INDEX IX_Suppliers_CreatedAt ON Suppliers(createdAt DESC);
    CREATE INDEX IX_Suppliers_UpdatedAt ON Suppliers(updatedAt DESC);
    CREATE INDEX IX_Suppliers_DeactivatedAt ON Suppliers(deactivatedAt);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_Suppliers_Active_ApprovalStatus ON Suppliers(active, approvalStatus);
    CREATE INDEX IX_Suppliers_Active_Category ON Suppliers(active, category);
    CREATE INDEX IX_Suppliers_ApprovalStatus_Rating ON Suppliers(approvalStatus, rating DESC);
    CREATE INDEX IX_Suppliers_Category_Rating ON Suppliers(category, rating DESC);
    CREATE INDEX IX_Suppliers_RiskLevel_CriticalSupplier ON Suppliers(riskLevel, criticalSupplier);
    CREATE INDEX IX_Suppliers_SupplierManager_Active ON Suppliers(supplierManager, active);
    CREATE INDEX IX_Suppliers_Department_Active ON Suppliers(department, active);
    CREATE INDEX IX_Suppliers_Active_NextEvaluationDate ON Suppliers(active, nextEvaluationDate ASC);
    CREATE INDEX IX_Suppliers_Active_NextAuditDate ON Suppliers(active, nextAuditDate ASC);
    CREATE INDEX IX_Suppliers_PreferredSupplier_Active ON Suppliers(preferredSupplier, active);
    
    -- Search optimization
    CREATE INDEX IX_Suppliers_ContactPerson ON Suppliers(contactPerson);
    CREATE INDEX IX_Suppliers_Email ON Suppliers(email);
    CREATE INDEX IX_Suppliers_Tags ON Suppliers(tags);

    PRINT 'Suppliers table created successfully';
END
ELSE
BEGIN
    PRINT 'Suppliers table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.35' AND scriptName = '35_create_suppliers_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.35',
        'Create Suppliers table for supplier quality management',
        '35_create_suppliers_table.sql',
        'SUCCESS',
        'Suppliers table supports ISO 9001 supplier management with contact info, approval status, quality metrics, evaluation tracking, and audit scheduling. Includes risk assessment, performance metrics, and ISO 9001 certification tracking.'
    );
END
GO

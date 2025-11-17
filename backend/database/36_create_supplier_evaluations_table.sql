-- =============================================
-- Supplier Evaluations Table
-- =============================================
-- Stores supplier evaluation records with scoring criteria
-- Supports ISO 9001 supplier quality management evaluation requirements

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SupplierEvaluations')
BEGIN
    CREATE TABLE SupplierEvaluations (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Supplier Reference
        supplierId INT NOT NULL, -- Reference to the supplier being evaluated
        
        -- Evaluation Identification
        evaluationNumber NVARCHAR(100) UNIQUE NOT NULL, -- Unique evaluation identifier
        evaluationDate DATETIME2 NOT NULL, -- Date the evaluation was conducted
        evaluationType NVARCHAR(100) NOT NULL, -- Type of evaluation (Annual, Quarterly, Ad-Hoc, Re-evaluation, etc.)
        
        -- Evaluation Period
        evaluationPeriodStart DATETIME2, -- Start date of the evaluation period
        evaluationPeriodEnd DATETIME2, -- End date of the evaluation period
        
        -- Scoring Criteria
        qualityRating INT NOT NULL, -- Quality rating (1-5 scale: 1=Poor, 2=Fair, 3=Good, 4=Very Good, 5=Excellent)
        onTimeDeliveryRate DECIMAL(5,2) NOT NULL, -- On-time delivery rate as percentage (0-100)
        complianceStatus NVARCHAR(50) NOT NULL, -- Compliance status (Compliant, Non-Compliant, Under Review, Not Assessed)
        
        -- Additional Scoring Metrics
        qualityScore DECIMAL(5,2), -- Quality score (0-100), calculated or manually entered
        deliveryScore DECIMAL(5,2), -- Delivery performance score (0-100)
        communicationScore DECIMAL(5,2), -- Communication/responsiveness score (0-100)
        technicalCapabilityScore DECIMAL(5,2), -- Technical capability score (0-100)
        priceCompetitivenessScore DECIMAL(5,2), -- Price competitiveness score (0-100)
        
        -- Overall Evaluation Results
        overallScore DECIMAL(5,2), -- Overall weighted score (0-100)
        overallRating NVARCHAR(50), -- Overall rating (Excellent, Good, Satisfactory, Needs Improvement, Unacceptable)
        approved BIT DEFAULT 0, -- Whether the supplier is approved based on this evaluation
        
        -- Performance Metrics
        defectRate DECIMAL(5,2), -- Defect rate as percentage (0-100)
        returnRate DECIMAL(5,2), -- Return rate as percentage (0-100)
        leadTimeAdherence DECIMAL(5,2), -- Lead time adherence as percentage (0-100)
        documentationAccuracy DECIMAL(5,2), -- Documentation accuracy as percentage (0-100)
        
        -- Evaluation Details
        evaluationMethod NVARCHAR(200), -- Method used for evaluation (Audit, Survey, Performance Data, Document Review)
        evaluationScope NVARCHAR(1000), -- Scope of the evaluation
        evaluationCriteria NVARCHAR(MAX), -- Detailed criteria used for evaluation (can be JSON)
        
        -- Findings and Observations
        strengths NVARCHAR(MAX), -- Key strengths identified
        weaknesses NVARCHAR(MAX), -- Key weaknesses identified
        opportunities NVARCHAR(MAX), -- Opportunities for improvement
        risks NVARCHAR(MAX), -- Identified risks
        
        -- Actions and Recommendations
        correctiveActionsRequired BIT DEFAULT 0, -- Whether corrective actions are required
        correctiveActions NVARCHAR(MAX), -- Required corrective actions
        recommendations NVARCHAR(MAX), -- Recommendations for the supplier
        improvementPlan NVARCHAR(MAX), -- Agreed improvement plan
        
        -- Follow-up
        followUpRequired BIT DEFAULT 0, -- Whether follow-up is required
        followUpDate DATETIME2, -- Scheduled follow-up date
        nextEvaluationDate DATETIME2, -- Next scheduled evaluation date
        
        -- Decision and Status
        evaluationStatus NVARCHAR(50) NOT NULL DEFAULT 'draft', -- Status (draft, completed, approved, rejected)
        decision NVARCHAR(50), -- Final decision (Continue, Conditional Continue, Suspend, Terminate, Probation)
        decisionRationale NVARCHAR(MAX), -- Rationale for the decision
        
        -- Approval Workflow
        evaluatedBy INT NOT NULL, -- User who conducted the evaluation
        reviewedBy INT NULL, -- User who reviewed the evaluation
        reviewedDate DATETIME2, -- Date of review
        approvedBy INT NULL, -- User who approved the evaluation
        approvedDate DATETIME2, -- Date of approval
        
        -- Additional Information
        notes NVARCHAR(MAX), -- Additional notes or comments
        attachments NVARCHAR(MAX), -- References to attached documents (can be JSON array of attachment IDs)
        internalReference NVARCHAR(200), -- Internal reference code
        
        -- Audit Trail
        createdBy INT NOT NULL, -- User who created the evaluation record
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        
        -- Foreign Key Constraints
        CONSTRAINT FK_SupplierEvaluations_Supplier FOREIGN KEY (supplierId) REFERENCES Suppliers(id),
        CONSTRAINT FK_SupplierEvaluations_EvaluatedBy FOREIGN KEY (evaluatedBy) REFERENCES Users(id),
        CONSTRAINT FK_SupplierEvaluations_ReviewedBy FOREIGN KEY (reviewedBy) REFERENCES Users(id),
        CONSTRAINT FK_SupplierEvaluations_ApprovedBy FOREIGN KEY (approvedBy) REFERENCES Users(id),
        CONSTRAINT FK_SupplierEvaluations_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        
        -- Constraints
        CONSTRAINT CK_SupplierEvaluations_QualityRating CHECK (qualityRating BETWEEN 1 AND 5),
        CONSTRAINT CK_SupplierEvaluations_OnTimeDeliveryRate CHECK (onTimeDeliveryRate BETWEEN 0 AND 100),
        CONSTRAINT CK_SupplierEvaluations_ComplianceStatus CHECK (complianceStatus IN (
            'Compliant',
            'Non-Compliant',
            'Under Review',
            'Not Assessed'
        )),
        CONSTRAINT CK_SupplierEvaluations_QualityScore CHECK (qualityScore IS NULL OR qualityScore BETWEEN 0 AND 100),
        CONSTRAINT CK_SupplierEvaluations_DeliveryScore CHECK (deliveryScore IS NULL OR deliveryScore BETWEEN 0 AND 100),
        CONSTRAINT CK_SupplierEvaluations_CommunicationScore CHECK (communicationScore IS NULL OR communicationScore BETWEEN 0 AND 100),
        CONSTRAINT CK_SupplierEvaluations_TechnicalCapabilityScore CHECK (technicalCapabilityScore IS NULL OR technicalCapabilityScore BETWEEN 0 AND 100),
        CONSTRAINT CK_SupplierEvaluations_PriceCompetitivenessScore CHECK (priceCompetitivenessScore IS NULL OR priceCompetitivenessScore BETWEEN 0 AND 100),
        CONSTRAINT CK_SupplierEvaluations_OverallScore CHECK (overallScore IS NULL OR overallScore BETWEEN 0 AND 100),
        CONSTRAINT CK_SupplierEvaluations_OverallRating CHECK (overallRating IS NULL OR overallRating IN (
            'Excellent',
            'Good',
            'Satisfactory',
            'Needs Improvement',
            'Unacceptable'
        )),
        CONSTRAINT CK_SupplierEvaluations_DefectRate CHECK (defectRate IS NULL OR defectRate BETWEEN 0 AND 100),
        CONSTRAINT CK_SupplierEvaluations_ReturnRate CHECK (returnRate IS NULL OR returnRate BETWEEN 0 AND 100),
        CONSTRAINT CK_SupplierEvaluations_LeadTimeAdherence CHECK (leadTimeAdherence IS NULL OR leadTimeAdherence BETWEEN 0 AND 100),
        CONSTRAINT CK_SupplierEvaluations_DocumentationAccuracy CHECK (documentationAccuracy IS NULL OR documentationAccuracy BETWEEN 0 AND 100),
        CONSTRAINT CK_SupplierEvaluations_EvaluationStatus CHECK (evaluationStatus IN (
            'draft',
            'completed',
            'under_review',
            'approved',
            'rejected'
        )),
        CONSTRAINT CK_SupplierEvaluations_Decision CHECK (decision IS NULL OR decision IN (
            'Continue',
            'Conditional Continue',
            'Suspend',
            'Terminate',
            'Probation'
        ))
    );

    -- Indexes for Performance
    
    -- Primary lookups
    CREATE UNIQUE INDEX IX_SupplierEvaluations_EvaluationNumber ON SupplierEvaluations(evaluationNumber);
    CREATE INDEX IX_SupplierEvaluations_SupplierId ON SupplierEvaluations(supplierId);
    
    -- Status and date tracking
    CREATE INDEX IX_SupplierEvaluations_EvaluationStatus ON SupplierEvaluations(evaluationStatus);
    CREATE INDEX IX_SupplierEvaluations_EvaluationDate ON SupplierEvaluations(evaluationDate DESC);
    CREATE INDEX IX_SupplierEvaluations_NextEvaluationDate ON SupplierEvaluations(nextEvaluationDate);
    CREATE INDEX IX_SupplierEvaluations_FollowUpDate ON SupplierEvaluations(followUpDate);
    
    -- Scoring and rating
    CREATE INDEX IX_SupplierEvaluations_QualityRating ON SupplierEvaluations(qualityRating DESC);
    CREATE INDEX IX_SupplierEvaluations_OverallScore ON SupplierEvaluations(overallScore DESC);
    CREATE INDEX IX_SupplierEvaluations_OverallRating ON SupplierEvaluations(overallRating);
    CREATE INDEX IX_SupplierEvaluations_ComplianceStatus ON SupplierEvaluations(complianceStatus);
    
    -- Personnel tracking
    CREATE INDEX IX_SupplierEvaluations_EvaluatedBy ON SupplierEvaluations(evaluatedBy);
    CREATE INDEX IX_SupplierEvaluations_ReviewedBy ON SupplierEvaluations(reviewedBy);
    CREATE INDEX IX_SupplierEvaluations_ApprovedBy ON SupplierEvaluations(approvedBy);
    CREATE INDEX IX_SupplierEvaluations_CreatedBy ON SupplierEvaluations(createdBy);
    
    -- Audit trail
    CREATE INDEX IX_SupplierEvaluations_CreatedAt ON SupplierEvaluations(createdAt DESC);
    CREATE INDEX IX_SupplierEvaluations_UpdatedAt ON SupplierEvaluations(updatedAt DESC);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_SupplierEvaluations_Supplier_EvaluationDate ON SupplierEvaluations(supplierId, evaluationDate DESC);
    CREATE INDEX IX_SupplierEvaluations_Supplier_Status ON SupplierEvaluations(supplierId, evaluationStatus);
    CREATE INDEX IX_SupplierEvaluations_Status_EvaluationDate ON SupplierEvaluations(evaluationStatus, evaluationDate DESC);
    CREATE INDEX IX_SupplierEvaluations_Approved_Score ON SupplierEvaluations(approved, overallScore DESC);

    PRINT 'SupplierEvaluations table created successfully';
END
ELSE
BEGIN
    PRINT 'SupplierEvaluations table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.36' AND scriptName = '36_create_supplier_evaluations_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.36',
        'Create SupplierEvaluations table for supplier evaluation and scoring',
        '36_create_supplier_evaluations_table.sql',
        'SUCCESS',
        'SupplierEvaluations table supports ISO 9001 supplier evaluation with scoring criteria (quality rating, on-time delivery, compliance status), performance metrics, findings, and approval workflow.'
    );
END
GO

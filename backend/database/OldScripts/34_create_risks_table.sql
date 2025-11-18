-- =============================================
-- Risks Table (Risk Register)
-- =============================================
-- Stores risk register items with assessment, mitigation, and review tracking
-- Supports ISO 9001 risk-based thinking and risk management requirements

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Risks')
BEGIN
    CREATE TABLE Risks (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Risk Identification
        riskNumber NVARCHAR(100) UNIQUE NOT NULL, -- Unique risk identifier
        title NVARCHAR(500) NOT NULL, -- Risk title/summary
        description NVARCHAR(2000) NOT NULL, -- Detailed risk description
        
        -- Risk Classification
        category NVARCHAR(200) NOT NULL, -- Risk category (operational, financial, compliance, strategic, etc.)
        source NVARCHAR(200), -- Source of risk identification (audit, process review, incident, etc.)
        
        -- Risk Assessment
        likelihood INT NOT NULL, -- Likelihood score (typically 1-5 scale)
        impact INT NOT NULL, -- Impact score (typically 1-5 scale)
        riskScore AS (likelihood * impact) PERSISTED, -- Calculated risk score (likelihood × impact)
        
        -- Risk Level Classification
        riskLevel NVARCHAR(50), -- Risk level (low, medium, high, critical) based on score
        
        -- Risk Response
        mitigationStrategy NVARCHAR(2000), -- Planned mitigation strategy
        mitigationActions NVARCHAR(2000), -- Specific mitigation actions to be taken
        contingencyPlan NVARCHAR(2000), -- Contingency plan if risk occurs
        
        -- Ownership and Accountability
        riskOwner INT NOT NULL, -- User responsible for managing this risk
        department NVARCHAR(100), -- Department or area associated with the risk
        process NVARCHAR(200), -- Related business process
        
        -- Status and Timeline
        status NVARCHAR(50) NOT NULL DEFAULT 'identified', -- Current status of risk
        identifiedDate DATETIME2 NOT NULL, -- Date risk was identified
        reviewDate DATETIME2, -- Last review date
        nextReviewDate DATETIME2, -- Next scheduled review date
        reviewFrequency INT, -- Review frequency in days
        closedDate DATETIME2, -- Date risk was closed (if mitigated or no longer relevant)
        
        -- Residual Risk Assessment (after mitigation)
        residualLikelihood INT, -- Likelihood after mitigation
        residualImpact INT, -- Impact after mitigation
        residualRiskScore AS (residualLikelihood * residualImpact) PERSISTED, -- Calculated residual risk score
        
        -- Additional Context
        affectedStakeholders NVARCHAR(1000), -- Stakeholders affected by this risk
        regulatoryImplications NVARCHAR(1000), -- Any regulatory or compliance implications
        relatedRisks NVARCHAR(500), -- References to related risk IDs
        
        -- Audit Trail
        createdBy INT NOT NULL, -- User who created the risk entry
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        lastReviewedBy INT, -- User who last reviewed the risk
        
        -- Foreign Key Constraints
        CONSTRAINT FK_Risks_RiskOwner FOREIGN KEY (riskOwner) REFERENCES Users(id),
        CONSTRAINT FK_Risks_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        CONSTRAINT FK_Risks_LastReviewedBy FOREIGN KEY (lastReviewedBy) REFERENCES Users(id),
        
        -- Constraints
        CONSTRAINT CK_Risks_Status CHECK (status IN (
            'identified',
            'assessed',
            'mitigating',
            'monitoring',
            'closed',
            'accepted'
        )),
        CONSTRAINT CK_Risks_Likelihood CHECK (likelihood BETWEEN 1 AND 5),
        CONSTRAINT CK_Risks_Impact CHECK (impact BETWEEN 1 AND 5),
        CONSTRAINT CK_Risks_ResidualLikelihood CHECK (residualLikelihood IS NULL OR residualLikelihood BETWEEN 1 AND 5),
        CONSTRAINT CK_Risks_ResidualImpact CHECK (residualImpact IS NULL OR residualImpact BETWEEN 1 AND 5),
        CONSTRAINT CK_Risks_RiskLevel CHECK (riskLevel IN (
            'low',
            'medium',
            'high',
            'critical'
        ) OR riskLevel IS NULL),
        CONSTRAINT CK_Risks_ReviewFrequency CHECK (reviewFrequency IS NULL OR reviewFrequency > 0)
    );

    -- Indexes for Performance
    
    -- Primary identifier lookups
    CREATE UNIQUE INDEX IX_Risks_RiskNumber ON Risks(riskNumber);
    
    -- Status and level tracking
    CREATE INDEX IX_Risks_Status ON Risks(status);
    CREATE INDEX IX_Risks_RiskLevel ON Risks(riskLevel);
    CREATE INDEX IX_Risks_Status_RiskLevel ON Risks(status, riskLevel);
    
    -- Risk scoring and prioritization
    CREATE INDEX IX_Risks_RiskScore ON Risks(riskScore DESC);
    CREATE INDEX IX_Risks_ResidualRiskScore ON Risks(residualRiskScore DESC);
    CREATE INDEX IX_Risks_Likelihood_Impact ON Risks(likelihood DESC, impact DESC);
    
    -- Date-based queries
    CREATE INDEX IX_Risks_IdentifiedDate ON Risks(identifiedDate DESC);
    CREATE INDEX IX_Risks_ReviewDate ON Risks(reviewDate);
    CREATE INDEX IX_Risks_NextReviewDate ON Risks(nextReviewDate);
    CREATE INDEX IX_Risks_ClosedDate ON Risks(closedDate);
    CREATE INDEX IX_Risks_CreatedAt ON Risks(createdAt DESC);
    
    -- Personnel tracking
    CREATE INDEX IX_Risks_RiskOwner ON Risks(riskOwner);
    CREATE INDEX IX_Risks_CreatedBy ON Risks(createdBy);
    CREATE INDEX IX_Risks_LastReviewedBy ON Risks(lastReviewedBy);
    
    -- Classification tracking
    CREATE INDEX IX_Risks_Category ON Risks(category);
    CREATE INDEX IX_Risks_Department ON Risks(department);
    CREATE INDEX IX_Risks_Process ON Risks(process);
    CREATE INDEX IX_Risks_Source ON Risks(source);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_Risks_Status_RiskScore ON Risks(status, riskScore DESC);
    CREATE INDEX IX_Risks_RiskOwner_Status ON Risks(riskOwner, status);
    CREATE INDEX IX_Risks_Category_Status ON Risks(category, status);
    CREATE INDEX IX_Risks_Department_Status ON Risks(department, status);
    CREATE INDEX IX_Risks_Status_NextReviewDate ON Risks(status, nextReviewDate ASC);
    CREATE INDEX IX_Risks_RiskLevel_Status ON Risks(riskLevel, status);
    
    -- Search optimization
    CREATE INDEX IX_Risks_Title ON Risks(title);

    PRINT 'Risks table created successfully';
END
ELSE
BEGIN
    PRINT 'Risks table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.34' AND scriptName = '34_create_risks_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.34',
        'Create Risks table for risk register and risk management',
        '34_create_risks_table.sql',
        'SUCCESS',
        'Risks table supports ISO 9001 risk-based thinking with assessment, mitigation, and review tracking. Includes likelihood and impact scoring with calculated risk scores.'
    );
END
GO

-- =============================================
-- TrainingCertificates Table
-- =============================================
-- Stores detailed certificate metadata and external certifications
-- Supports both internally issued and externally obtained certificates
-- Tracks certificate lifecycle, renewals, and compliance

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TrainingCertificates')
BEGIN
    CREATE TABLE TrainingCertificates (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Certificate Identification
        certificateNumber NVARCHAR(100) UNIQUE NOT NULL, -- Unique certificate identifier
        certificateName NVARCHAR(500) NOT NULL, -- Certificate name/title
        
        -- Ownership and Association
        userId INT NOT NULL, -- User who holds the certificate
        trainingAttendeeId INT, -- Optional link to training attendee record (NULL for external certs)
        trainingId INT, -- Optional link to training event (NULL for external certs)
        
        -- Issuing Authority
        issuerName NVARCHAR(200) NOT NULL, -- Organization that issued certificate
        issuerContact NVARCHAR(200), -- Contact information for issuer
        accreditationBody NVARCHAR(200), -- Accreditation body (if applicable)
        
        -- Certificate Details
        certificateType NVARCHAR(100) NOT NULL, -- Type (e.g., 'Internal', 'External', 'Professional', 'Regulatory')
        competencyArea NVARCHAR(200), -- Area of competency covered
        level NVARCHAR(100), -- Level (e.g., 'Basic', 'Intermediate', 'Advanced', 'Expert')
        
        -- Date Tracking
        issueDate DATETIME2 NOT NULL, -- Date certificate was issued
        effectiveDate DATETIME2, -- Date certificate becomes effective (may differ from issue date)
        expiryDate DATETIME2, -- Certificate expiration date (NULL = no expiry)
        
        -- Renewal and Maintenance
        requiresRenewal BIT DEFAULT 0, -- Whether certificate requires periodic renewal
        renewalIntervalMonths INT, -- Renewal interval in months
        lastRenewalDate DATETIME2, -- Date of last renewal
        nextRenewalDate DATETIME2, -- Date of next required renewal
        
        -- Status and Lifecycle
        status NVARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'expired', 'suspended', 'revoked', 'renewed'
        revocationDate DATETIME2, -- Date certificate was revoked (if applicable)
        revocationReason NVARCHAR(500), -- Reason for revocation
        
        -- Certificate File Reference
        -- Actual certificate file stored in Attachments table with entityType='training' or 'training_certificate'
        certificateFileId INT, -- Reference to certificate file in Attachments
        
        -- Verification and Validation
        verified BIT DEFAULT 0, -- Whether certificate has been verified
        verifiedBy INT, -- User who verified the certificate
        verifiedAt DATETIME2, -- When verification was done
        verificationMethod NVARCHAR(200), -- Method of verification (e.g., 'Online', 'Email', 'Phone')
        verificationNotes NVARCHAR(1000), -- Notes on verification process
        
        -- Compliance and Requirements
        regulatoryRequirement BIT DEFAULT 0, -- Whether this is a regulatory requirement
        mandatoryForRoles NVARCHAR(500), -- Roles for which this certificate is mandatory
        
        -- Additional Information
        description NVARCHAR(2000), -- Description of certificate and competencies covered
        notes NVARCHAR(1000), -- Additional notes
        
        -- Audit Trail
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        createdBy INT NOT NULL, -- User who created this record
        
        -- Foreign Key Constraints
        CONSTRAINT FK_TrainingCertificates_User FOREIGN KEY (userId) REFERENCES Users(id),
        CONSTRAINT FK_TrainingCertificates_TrainingAttendee FOREIGN KEY (trainingAttendeeId) REFERENCES TrainingAttendees(id),
        CONSTRAINT FK_TrainingCertificates_Training FOREIGN KEY (trainingId) REFERENCES Trainings(id),
        CONSTRAINT FK_TrainingCertificates_CertificateFile FOREIGN KEY (certificateFileId) REFERENCES Attachments(id),
        CONSTRAINT FK_TrainingCertificates_VerifiedBy FOREIGN KEY (verifiedBy) REFERENCES Users(id),
        CONSTRAINT FK_TrainingCertificates_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        
        -- Constraints
        CONSTRAINT CK_TrainingCertificates_Status CHECK (status IN (
            'active',
            'expired',
            'suspended',
            'revoked',
            'renewed'
        )),
        CONSTRAINT CK_TrainingCertificates_CertificateType CHECK (certificateType IN (
            'Internal',
            'External',
            'Professional',
            'Regulatory',
            'Safety',
            'Technical',
            'Compliance'
        )),
        CONSTRAINT CK_TrainingCertificates_RenewalInterval CHECK (renewalIntervalMonths IS NULL OR renewalIntervalMonths > 0)
    );

    -- Indexes for Performance
    
    -- Primary identifier lookups
    CREATE UNIQUE INDEX IX_TrainingCertificates_CertificateNumber ON TrainingCertificates(certificateNumber);
    
    -- User and relationship lookups
    CREATE INDEX IX_TrainingCertificates_UserId ON TrainingCertificates(userId);
    CREATE INDEX IX_TrainingCertificates_TrainingAttendeeId ON TrainingCertificates(trainingAttendeeId);
    CREATE INDEX IX_TrainingCertificates_TrainingId ON TrainingCertificates(trainingId);
    
    -- Status and type filtering
    CREATE INDEX IX_TrainingCertificates_Status ON TrainingCertificates(status);
    CREATE INDEX IX_TrainingCertificates_CertificateType ON TrainingCertificates(certificateType);
    CREATE INDEX IX_TrainingCertificates_CompetencyArea ON TrainingCertificates(competencyArea);
    
    -- Date-based queries
    CREATE INDEX IX_TrainingCertificates_IssueDate ON TrainingCertificates(issueDate);
    CREATE INDEX IX_TrainingCertificates_ExpiryDate ON TrainingCertificates(expiryDate);
    CREATE INDEX IX_TrainingCertificates_EffectiveDate ON TrainingCertificates(effectiveDate);
    CREATE INDEX IX_TrainingCertificates_NextRenewalDate ON TrainingCertificates(nextRenewalDate);
    CREATE INDEX IX_TrainingCertificates_RevocationDate ON TrainingCertificates(revocationDate);
    
    -- Verification tracking
    CREATE INDEX IX_TrainingCertificates_Verified ON TrainingCertificates(verified);
    CREATE INDEX IX_TrainingCertificates_VerifiedBy ON TrainingCertificates(verifiedBy);
    CREATE INDEX IX_TrainingCertificates_VerifiedAt ON TrainingCertificates(verifiedAt);
    
    -- Issuer and accreditation
    CREATE INDEX IX_TrainingCertificates_IssuerName ON TrainingCertificates(issuerName);
    CREATE INDEX IX_TrainingCertificates_AccreditationBody ON TrainingCertificates(accreditationBody);
    
    -- Compliance tracking
    CREATE INDEX IX_TrainingCertificates_RegulatoryRequirement ON TrainingCertificates(regulatoryRequirement);
    CREATE INDEX IX_TrainingCertificates_RequiresRenewal ON TrainingCertificates(requiresRenewal);
    
    -- File references
    CREATE INDEX IX_TrainingCertificates_CertificateFileId ON TrainingCertificates(certificateFileId);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_TrainingCertificates_User_Status ON TrainingCertificates(userId, status);
    CREATE INDEX IX_TrainingCertificates_User_Expiry ON TrainingCertificates(userId, expiryDate) WHERE status = 'active';
    CREATE INDEX IX_TrainingCertificates_Status_ExpiryDate ON TrainingCertificates(status, expiryDate);
    CREATE INDEX IX_TrainingCertificates_User_CompetencyArea ON TrainingCertificates(userId, competencyArea);
    CREATE INDEX IX_TrainingCertificates_Status_NextRenewal ON TrainingCertificates(status, nextRenewalDate) WHERE requiresRenewal = 1;
    CREATE INDEX IX_TrainingCertificates_Regulatory_Status ON TrainingCertificates(regulatoryRequirement, status);
    
    -- Name search
    CREATE INDEX IX_TrainingCertificates_CertificateName ON TrainingCertificates(certificateName);

    PRINT 'TrainingCertificates table created successfully';
END
ELSE
BEGIN
    PRINT 'TrainingCertificates table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.22' AND scriptName = '22_create_training_certificates_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.22',
        'Create TrainingCertificates table for certificate lifecycle management',
        '22_create_training_certificates_table.sql',
        'SUCCESS',
        'TrainingCertificates table supports detailed certificate tracking including external certifications, renewals, and compliance requirements'
    );
END
GO

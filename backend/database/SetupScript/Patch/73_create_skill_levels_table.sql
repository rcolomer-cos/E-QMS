-- =============================================
-- Patch 73: Create SkillLevels Table for Competency Scoring
-- =============================================
-- Description: Creates SkillLevels table to define skill criteria for each level (1-5).
-- This supports employee competency assessment and skill matrix evaluation.
-- Version: 1.0.73
-- Author: E-QMS System
-- Date: 2025-11-25
-- =============================================

USE EQMS;
GO

PRINT 'Starting Patch 73: Create SkillLevels Table';
PRINT '==========================================';
GO

-- =============================================
-- Create SkillLevels Table
-- =============================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SkillLevels')
BEGIN
    CREATE TABLE SkillLevels (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Core Information
        level INT NOT NULL, -- Skill level: 1 (Beginner) to 5 (Expert)
        name NVARCHAR(100) NOT NULL, -- Level name (e.g., "Beginner", "Advanced", "Expert")
        shortName NVARCHAR(50), -- Short name (e.g., "L1", "L2", etc.)
        
        -- Skill Criteria
        description NVARCHAR(2000) NOT NULL, -- Detailed description of competency at this level
        knowledgeCriteria NVARCHAR(2000), -- Knowledge requirements for this level
        skillsCriteria NVARCHAR(2000), -- Skills/abilities required
        experienceCriteria NVARCHAR(2000), -- Experience expectations
        autonomyCriteria NVARCHAR(2000), -- Level of independence/supervision needed
        complexityCriteria NVARCHAR(2000), -- Complexity of tasks handled
        
        -- Visual and Display
        color NVARCHAR(50), -- Color code for UI display (e.g., "#FF5733")
        icon NVARCHAR(100), -- Icon identifier for display
        displayOrder INT DEFAULT 0, -- For custom sorting
        
        -- Examples and Guidance
        exampleBehaviors NVARCHAR(MAX), -- Example behaviors/competencies at this level
        assessmentGuidance NVARCHAR(2000), -- Guidance for assessors on how to evaluate
        
        -- Status
        active BIT DEFAULT 1,
        
        -- Audit Trail
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        createdBy INT NOT NULL,
        updatedBy INT,
        
        -- Foreign Key Constraints
        CONSTRAINT FK_SkillLevels_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        CONSTRAINT FK_SkillLevels_UpdatedBy FOREIGN KEY (updatedBy) REFERENCES Users(id),
        
        -- Constraints
        CONSTRAINT CK_SkillLevels_Level CHECK (level >= 1 AND level <= 5),
        CONSTRAINT UQ_SkillLevels_Level UNIQUE (level)
    );

    -- Indexes for Performance
    CREATE INDEX IX_SkillLevels_Level ON SkillLevels(level);
    CREATE INDEX IX_SkillLevels_Active ON SkillLevels(active);
    CREATE INDEX IX_SkillLevels_DisplayOrder ON SkillLevels(displayOrder);
    CREATE INDEX IX_SkillLevels_CreatedBy ON SkillLevels(createdBy);
    CREATE INDEX IX_SkillLevels_UpdatedBy ON SkillLevels(updatedBy);

    PRINT '✓ SkillLevels table created successfully';
END
ELSE
BEGIN
    PRINT '○ SkillLevels table already exists';
END
GO

-- =============================================
-- Insert Default Skill Levels (1-5)
-- =============================================

-- Get a valid user ID for createdBy
DECLARE @createdByUserId INT;
SELECT TOP 1 @createdByUserId = u.id 
FROM Users u
INNER JOIN UserRoles ur ON u.id = ur.userId
INNER JOIN Roles r ON ur.roleId = r.id
WHERE r.name IN ('superuser', 'admin') AND u.active = 1
ORDER BY r.level DESC;

IF @createdByUserId IS NULL
BEGIN
    SELECT TOP 1 @createdByUserId = id FROM Users WHERE active = 1;
END

-- Insert default skill levels if table is empty
IF NOT EXISTS (SELECT * FROM SkillLevels)
BEGIN
    -- Level 1: Beginner / Novice
    INSERT INTO SkillLevels (
        level, name, shortName, description, 
        knowledgeCriteria, skillsCriteria, experienceCriteria, 
        autonomyCriteria, complexityCriteria,
        color, icon, displayOrder, 
        exampleBehaviors, assessmentGuidance,
        createdBy
    )
    VALUES (
        1, 
        'Beginner', 
        'L1',
        'Entry-level competency with basic understanding. Requires close supervision and guidance to perform tasks.',
        'Has basic theoretical knowledge. Understands fundamental concepts and terminology. May have completed initial training or orientation.',
        'Can perform simple, routine tasks under direct supervision. Follows standard procedures and checklists. Limited problem-solving ability.',
        'Little to no practical experience (0-6 months). May be new to the role or industry.',
        'Requires constant supervision and detailed instructions. Needs guidance for most decisions. Works under close mentorship.',
        'Handles simple, well-defined tasks with clear procedures. Cannot handle exceptions or complex situations independently.',
        '#EF4444',
        '⭐',
        10,
        'Follows step-by-step instructions; Asks frequent questions; Shadows experienced colleagues; Completes basic tasks with supervision; Learns standard operating procedures',
        'Look for basic understanding of concepts, ability to follow procedures, willingness to learn, and appropriate recognition of own limitations.',
        @createdByUserId
    );

    -- Level 2: Advanced Beginner / Developing
    INSERT INTO SkillLevels (
        level, name, shortName, description, 
        knowledgeCriteria, skillsCriteria, experienceCriteria, 
        autonomyCriteria, complexityCriteria,
        color, icon, displayOrder, 
        exampleBehaviors, assessmentGuidance,
        createdBy
    )
    VALUES (
        2, 
        'Advanced Beginner', 
        'L2',
        'Developing competency with growing practical experience. Can perform routine tasks with minimal supervision.',
        'Has working knowledge of key concepts and procedures. Understanding extends beyond basics. Can explain standard processes.',
        'Performs routine tasks independently. Can identify common problems and knows when to seek help. Begins to recognize patterns.',
        'Some practical experience (6 months - 2 years). Has encountered various common situations and learned from them.',
        'Requires occasional supervision and periodic checking. Can work independently on routine tasks. Seeks guidance for non-routine situations.',
        'Handles standard tasks and common variations. Can manage routine problems but needs support for complex issues.',
        '#F97316',
        '⭐⭐',
        20,
        'Works independently on routine tasks; Recognizes common issues; Applies learned procedures; Begins to anticipate problems; Requires less frequent guidance',
        'Assess ability to work independently on routine tasks, recognize when help is needed, and apply learned knowledge to similar situations.',
        @createdByUserId
    );

    -- Level 3: Competent / Proficient
    INSERT INTO SkillLevels (
        level, name, shortName, description, 
        knowledgeCriteria, skillsCriteria, experienceCriteria, 
        autonomyCriteria, complexityCriteria,
        color, icon, displayOrder, 
        exampleBehaviors, assessmentGuidance,
        createdBy
    )
    VALUES (
        3, 
        'Competent', 
        'L3',
        'Fully competent with solid practical experience. Works independently and can handle most situations effectively.',
        'Has comprehensive knowledge of area. Understands underlying principles and can apply them. Can explain complex concepts to others.',
        'Performs all standard tasks proficiently. Can troubleshoot problems effectively. Adapts procedures to different contexts. Makes sound decisions.',
        'Significant practical experience (2-5 years). Has handled diverse situations including challenging scenarios. Builds expertise through practice.',
        'Works independently with minimal supervision. Self-directed in daily work. Seeks input only for unusual or high-impact situations.',
        'Handles complex tasks and non-routine problems. Can prioritize and plan work effectively. Manages multiple responsibilities simultaneously.',
        '#EAB308',
        '⭐⭐⭐',
        30,
        'Completes work independently; Solves most problems without assistance; Trains beginners; Suggests process improvements; Handles multiple priorities effectively',
        'Look for consistent quality of work, effective problem-solving, ability to work without supervision, and capacity to guide others.',
        @createdByUserId
    );

    -- Level 4: Advanced / Highly Proficient
    INSERT INTO SkillLevels (
        level, name, shortName, description, 
        knowledgeCriteria, skillsCriteria, experienceCriteria, 
        autonomyCriteria, complexityCriteria,
        color, icon, displayOrder, 
        exampleBehaviors, assessmentGuidance,
        createdBy
    )
    VALUES (
        4, 
        'Advanced', 
        'L4',
        'Advanced competency with extensive experience. Recognized as skilled practitioner who can handle complex challenges.',
        'Deep, specialized knowledge. Understands nuances and exceptions. Can analyze complex issues and identify root causes. Keeps current with developments.',
        'Masters complex techniques and approaches. Innovates and improves methods. Handles critical situations with confidence. Strong analytical and judgment skills.',
        'Extensive experience (5-10 years). Has successfully managed diverse, complex situations. Recognized as experienced practitioner.',
        'Fully autonomous. Self-managing with strong judgment. Provides guidance and direction to others. Trusted with significant responsibilities.',
        'Excels at complex, ambiguous situations. Handles critical problems and emergencies. Can work across different contexts and adapt approaches.',
        '#22C55E',
        '⭐⭐⭐⭐',
        40,
        'Leads complex projects; Mentors and coaches others; Develops new procedures; Handles critical situations independently; Recognized as subject matter resource',
        'Evaluate depth of expertise, ability to handle complex situations, mentoring capability, innovation, and recognition as go-to person.',
        @createdByUserId
    );

    -- Level 5: Expert / Master
    INSERT INTO SkillLevels (
        level, name, shortName, description, 
        knowledgeCriteria, skillsCriteria, experienceCriteria, 
        autonomyCriteria, complexityCriteria,
        color, icon, displayOrder, 
        exampleBehaviors, assessmentGuidance,
        createdBy
    )
    VALUES (
        5, 
        'Expert', 
        'L5',
        'Expert-level mastery with exceptional depth and breadth. Recognized authority who shapes practices and develops others.',
        'Authoritative, comprehensive knowledge. Deep understanding across breadth and depth. Contributes to field knowledge. Anticipates future trends and needs.',
        'Demonstrates mastery and innovation. Creates new approaches and solutions. Handles unprecedented situations intuitively. Influences standards and practices.',
        'Extensive, diverse experience (10+ years). Has handled full range of situations including rare and critical cases. Proven track record of excellence.',
        'Completely autonomous. Strategic thinker who influences policy and direction. Sets standards for others. Develops organizational capability.',
        'Masters the most complex, ambiguous, and critical situations. Handles organization-wide impacts. Creates frameworks others use.',
        '#3B82F6',
        '⭐⭐⭐⭐⭐',
        50,
        'Recognized as organizational authority; Shapes policies and standards; Develops training programs; Solves unprecedented problems; Influences strategic direction; External expert reputation',
        'Look for exceptional expertise, innovation and thought leadership, strategic impact, development of others and organizational capability, and external recognition.',
        @createdByUserId
    );

    PRINT '✓ Default skill levels (1-5) inserted successfully';
END
ELSE
BEGIN
    PRINT '○ SkillLevels table already contains data';
END
GO

-- =============================================
-- Record Schema Version
-- =============================================

IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.73' AND scriptName = '73_create_skill_levels_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.73',
        'Create SkillLevels table for competency scoring system',
        '73_create_skill_levels_table.sql',
        'SUCCESS',
        'SkillLevels table defines skill criteria for 5 competency levels (Beginner to Expert) to support employee skill assessment and competence matrix evaluation.'
    );
    
    PRINT '✓ Database version recorded';
END
ELSE
BEGIN
    PRINT '○ Database version already recorded';
END
GO

PRINT '';
PRINT 'Patch 73 completed successfully';
PRINT '==========================================';
GO

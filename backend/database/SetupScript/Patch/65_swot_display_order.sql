-- =============================================
-- Add displayOrder column to SwotEntries Table
-- =============================================
-- Adds ordering capability for SWOT entries within each category
-- Enables drag-and-drop reordering functionality in the UI

-- Check if displayOrder column already exists
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('SwotEntries') 
    AND name = 'displayOrder'
)
BEGIN
    -- Add displayOrder column
    ALTER TABLE SwotEntries
    ADD displayOrder INT NULL;
    
    PRINT 'displayOrder column added to SwotEntries table';
END
GO

-- Initialize displayOrder for existing records and finalize schema changes
IF EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('SwotEntries') 
    AND name = 'displayOrder'
)
BEGIN
    -- Set order based on creation date within each category
    WITH OrderedEntries AS (
        SELECT 
            id,
            category,
            ROW_NUMBER() OVER (PARTITION BY category ORDER BY createdAt) as rowNum
        FROM SwotEntries
    )
    UPDATE SwotEntries
    SET displayOrder = oe.rowNum
    FROM OrderedEntries oe
    WHERE SwotEntries.id = oe.id;
    
    PRINT 'Initialized displayOrder for existing SwotEntries';
    
    -- Make displayOrder NOT NULL after initialization
    ALTER TABLE SwotEntries
    ALTER COLUMN displayOrder INT NOT NULL;
    
    PRINT 'displayOrder column set to NOT NULL';
    
    -- Add index for ordering queries
    CREATE INDEX IX_SwotEntries_Category_DisplayOrder 
    ON SwotEntries(category, displayOrder);
    
    PRINT 'Index created for category and displayOrder';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.65' AND scriptName = '65_swot_display_order.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.65',
        'Add displayOrder column to SwotEntries table',
        '65_swot_display_order.sql',
        'SUCCESS',
        'Adds displayOrder field to enable drag-and-drop reordering of SWOT entries within categories'
    );
END
GO

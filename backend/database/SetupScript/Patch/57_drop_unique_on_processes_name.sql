-- =============================================
-- Drop unique constraint(s)/index on Processes.name
-- =============================================

DECLARE @schema sysname = 'dbo';
DECLARE @table sysname = 'Processes';
DECLARE @full nvarchar(300) = QUOTENAME(@schema) + '.' + QUOTENAME(@table);

-- Drop explicit filtered unique index if exists
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Processes_Name' AND object_id = OBJECT_ID(@full))
BEGIN
    PRINT 'Dropping index IX_Processes_Name...';
    EXEC ('DROP INDEX IX_Processes_Name ON ' + @full + ';');
END

-- Drop any unique constraint that only targets the [name] column
;WITH uq AS (
  SELECT kc.name AS constraint_name
  FROM sys.key_constraints kc
  JOIN sys.tables t ON t.object_id = kc.parent_object_id
  JOIN sys.schemas s ON s.schema_id = t.schema_id
  WHERE kc.[type] = 'UQ' AND t.[name] = @table AND s.[name] = @schema
), cols AS (
  SELECT i.name AS index_name,
         COUNT(*) AS col_count,
         SUM(CASE WHEN c.name = 'name' THEN 1 ELSE 0 END) AS name_count
  FROM sys.indexes i
  JOIN sys.index_columns ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id
  JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
  WHERE i.object_id = OBJECT_ID(@full) AND i.is_unique = 1
  GROUP BY i.name
)
SELECT * INTO #toDrop FROM (
  SELECT i.name
  FROM sys.indexes i
  JOIN cols ON cols.index_name = i.name
  WHERE i.object_id = OBJECT_ID(@full)
    AND i.is_unique = 1
    AND cols.col_count = 1 AND cols.name_count = 1
) x;

 DECLARE @sql NVARCHAR(MAX);
 DECLARE @idx NVARCHAR(200);


WHILE EXISTS (SELECT 1 FROM #toDrop)
BEGIN
  SELECT TOP 1 @idx = name FROM #toDrop;
  PRINT 'Dropping unique index/constraint ' + @idx + ' on Processes.name...';

  BEGIN TRY
    SET @sql = N'ALTER TABLE ' + @full + ' DROP CONSTRAINT ' + QUOTENAME(@idx) + ';';
    EXEC(@sql);
  END TRY
  BEGIN CATCH
    SET @sql = N'DROP INDEX ' + QUOTENAME(@idx) + ' ON ' + @full + ';';
    EXEC(@sql);
  END CATCH

  DELETE FROM #toDrop WHERE name = @idx;
END

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.57' AND scriptName = '57_drop_unique_on_processes_name.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.57',
        'Remove unique constraint/index on Processes.name',
        '57_drop_unique_on_processes_name.sql',
        'SUCCESS',
        'Allows duplicate process names; code remains unique'
    );
END
GO
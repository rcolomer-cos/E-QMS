import { Request, Response } from 'express';
import { getConnection, sql } from '../config/database';

export interface WorkRoleKPI {
  id: number;
  name: string;
  code?: string;
  description?: string;
  category?: string;
  level?: string;
  departmentName?: string;
  employeeCount: number;
  avgWorkExperienceYears: number;
  avgSkillLevel: number;
  status: string;
}

/**
 * Get KPI statistics for all work roles
 * Returns employee count, average work experience, and average skill level per role
 */
export const getWorkRoleKPIs = async (_req: Request, res: Response): Promise<void> => {
  try {
    const pool = await getConnection();

    // Query to get work role statistics
    const result = await pool.request().query<WorkRoleKPI>(`
      SELECT 
        wr.id,
        wr.name,
        wr.code,
        wr.description,
        wr.category,
        wr.level,
        d.name as departmentName,
        wr.status,
        
        -- Employee count for this role
        COUNT(DISTINCT uwr.userId) as employeeCount,
        
        -- Average work experience in years
        -- Calculate years from user creation date (could be enhanced with actual hire date if available)
        COALESCE(
          AVG(
            CAST(DATEDIFF(DAY, u.createdAt, GETDATE()) AS FLOAT) / 365.25
          ), 
          0
        ) as avgWorkExperienceYears,
        
        -- Average skill level (1-5 scale)
        COALESCE(AVG(CAST(sl.level AS FLOAT)), 0) as avgSkillLevel
        
      FROM WorkRoles wr
      LEFT JOIN UserWorkRoles uwr ON wr.id = uwr.workRoleId 
        AND uwr.active = 1 
        AND uwr.status = 'active'
      LEFT JOIN Users u ON uwr.userId = u.id AND u.active = 1
      LEFT JOIN SkillLevels sl ON uwr.skillLevelId = sl.id
      LEFT JOIN Departments d ON wr.departmentId = d.id
      WHERE wr.active = 1
      GROUP BY 
        wr.id,
        wr.name,
        wr.code,
        wr.description,
        wr.category,
        wr.level,
        d.name,
        wr.status,
        wr.displayOrder
      ORDER BY wr.displayOrder, wr.name
    `);

    res.json({
      success: true,
      data: result.recordset,
      count: result.recordset.length
    });
  } catch (error) {
    console.error('Error fetching work role KPIs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch work role KPI statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get detailed KPI statistics for a specific work role
 */
export const getWorkRoleKPIById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    // Query to get detailed work role statistics
    const result = await pool.request()
      .input('workRoleId', sql.Int, id)
      .query(`
        SELECT 
          wr.id,
          wr.name,
          wr.code,
          wr.description,
          wr.category,
          wr.level,
          d.name as departmentName,
          wr.status,
          wr.responsibilitiesAndAuthorities,
          wr.requiredQualifications,
          wr.experienceYears as requiredExperienceYears,
          
          -- Employee count for this role
          COUNT(DISTINCT uwr.userId) as employeeCount,
          
          -- Average work experience in years
          COALESCE(
            AVG(
              CAST(DATEDIFF(DAY, u.createdAt, GETDATE()) AS FLOAT) / 365.25
            ), 
            0
          ) as avgWorkExperienceYears,
          
          -- Average skill level
          COALESCE(AVG(CAST(sl.level AS FLOAT)), 0) as avgSkillLevel,
          
          -- Skill level distribution
          SUM(CASE WHEN sl.level = 1 THEN 1 ELSE 0 END) as level1Count,
          SUM(CASE WHEN sl.level = 2 THEN 1 ELSE 0 END) as level2Count,
          SUM(CASE WHEN sl.level = 3 THEN 1 ELSE 0 END) as level3Count,
          SUM(CASE WHEN sl.level = 4 THEN 1 ELSE 0 END) as level4Count,
          SUM(CASE WHEN sl.level = 5 THEN 1 ELSE 0 END) as level5Count
          
        FROM WorkRoles wr
        LEFT JOIN UserWorkRoles uwr ON wr.id = uwr.workRoleId 
          AND uwr.active = 1 
          AND uwr.status = 'active'
        LEFT JOIN Users u ON uwr.userId = u.id AND u.active = 1
        LEFT JOIN SkillLevels sl ON uwr.skillLevelId = sl.id
        LEFT JOIN Departments d ON wr.departmentId = d.id
        WHERE wr.id = @workRoleId AND wr.active = 1
        GROUP BY 
          wr.id,
          wr.name,
          wr.code,
          wr.description,
          wr.category,
          wr.level,
          d.name,
          wr.status,
          wr.responsibilitiesAndAuthorities,
          wr.requiredQualifications,
          wr.experienceYears
      `);

    if (result.recordset.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Work role not found'
      });
      return;
    }

    res.json({
      success: true,
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Error fetching work role KPI details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch work role KPI details',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get summary KPI statistics across all work roles
 */
export const getWorkRoleKPISummary = async (_req: Request, res: Response): Promise<void> => {
  try {
    const pool = await getConnection();

    const result = await pool.request().query(`
      SELECT 
        -- Total counts
        COUNT(DISTINCT wr.id) as totalWorkRoles,
        COUNT(DISTINCT uwr.userId) as totalEmployeesWithRoles,
        
        -- Overall averages
        COALESCE(
          AVG(
            CAST(DATEDIFF(DAY, u.createdAt, GETDATE()) AS FLOAT) / 365.25
          ), 
          0
        ) as overallAvgExperience,
        COALESCE(AVG(CAST(sl.level AS FLOAT)), 0) as overallAvgSkillLevel,
        
        -- Category breakdown
        COUNT(DISTINCT CASE WHEN wr.category IS NOT NULL THEN wr.category END) as categoriesCount,
        
        -- Status breakdown
        SUM(CASE WHEN wr.status = 'active' THEN 1 ELSE 0 END) as activeRolesCount,
        SUM(CASE WHEN wr.status = 'inactive' THEN 1 ELSE 0 END) as inactiveRolesCount
        
      FROM WorkRoles wr
      LEFT JOIN UserWorkRoles uwr ON wr.id = uwr.workRoleId 
        AND uwr.active = 1 
        AND uwr.status = 'active'
      LEFT JOIN Users u ON uwr.userId = u.id AND u.active = 1
      LEFT JOIN SkillLevels sl ON uwr.skillLevelId = sl.id
      WHERE wr.active = 1
    `);

    res.json({
      success: true,
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Error fetching work role KPI summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch work role KPI summary',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

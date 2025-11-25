import { getConnection, sql } from '../config/database';

export interface SkillLevel {
  id?: number;
  level: number;
  name: string;
  shortName?: string;
  description: string;
  knowledgeCriteria?: string;
  skillsCriteria?: string;
  experienceCriteria?: string;
  autonomyCriteria?: string;
  complexityCriteria?: string;
  color?: string;
  icon?: string;
  displayOrder?: number;
  exampleBehaviors?: string;
  assessmentGuidance?: string;
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy: number;
  updatedBy?: number;
  createdByName?: string;
  updatedByName?: string;
}

class SkillLevelModel {
  /**
   * Get all skill levels
   */
  async getAll(): Promise<SkillLevel[]> {
    const pool = await getConnection();
    
    const result = await pool.request().query(`
      SELECT 
        sl.id,
        sl.level,
        sl.name,
        sl.shortName,
        sl.description,
        sl.knowledgeCriteria,
        sl.skillsCriteria,
        sl.experienceCriteria,
        sl.autonomyCriteria,
        sl.complexityCriteria,
        sl.color,
        sl.icon,
        sl.displayOrder,
        sl.exampleBehaviors,
        sl.assessmentGuidance,
        sl.active,
        sl.createdAt,
        sl.updatedAt,
        sl.createdBy,
        sl.updatedBy,
        creator.firstName + ' ' + creator.lastName as createdByName,
        updater.firstName + ' ' + updater.lastName as updatedByName
      FROM SkillLevels sl
      LEFT JOIN Users creator ON sl.createdBy = creator.id
      LEFT JOIN Users updater ON sl.updatedBy = updater.id
      WHERE sl.active = 1
      ORDER BY sl.level ASC
    `);

    return result.recordset;
  }

  /**
   * Get a single skill level by ID
   */
  async getById(id: number): Promise<SkillLevel | null> {
    const pool = await getConnection();
    
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          sl.id,
          sl.level,
          sl.name,
          sl.shortName,
          sl.description,
          sl.knowledgeCriteria,
          sl.skillsCriteria,
          sl.experienceCriteria,
          sl.autonomyCriteria,
          sl.complexityCriteria,
          sl.color,
          sl.icon,
          sl.displayOrder,
          sl.exampleBehaviors,
          sl.assessmentGuidance,
          sl.active,
          sl.createdAt,
          sl.updatedAt,
          sl.createdBy,
          sl.updatedBy,
          creator.firstName + ' ' + creator.lastName as createdByName,
          updater.firstName + ' ' + updater.lastName as updatedByName
        FROM SkillLevels sl
        LEFT JOIN Users creator ON sl.createdBy = creator.id
        LEFT JOIN Users updater ON sl.updatedBy = updater.id
        WHERE sl.id = @id
      `);

    return result.recordset[0] || null;
  }

  /**
   * Get skill level by level number (1-5)
   */
  async getByLevel(level: number): Promise<SkillLevel | null> {
    const pool = await getConnection();
    
    const result = await pool
      .request()
      .input('level', sql.Int, level)
      .query(`
        SELECT 
          sl.id,
          sl.level,
          sl.name,
          sl.shortName,
          sl.description,
          sl.knowledgeCriteria,
          sl.skillsCriteria,
          sl.experienceCriteria,
          sl.autonomyCriteria,
          sl.complexityCriteria,
          sl.color,
          sl.icon,
          sl.displayOrder,
          sl.exampleBehaviors,
          sl.assessmentGuidance,
          sl.active,
          sl.createdAt,
          sl.updatedAt,
          sl.createdBy,
          sl.updatedBy
        FROM SkillLevels sl
        WHERE sl.level = @level AND sl.active = 1
      `);

    return result.recordset[0] || null;
  }

  /**
   * Create a new skill level
   */
  async create(skillLevel: SkillLevel): Promise<SkillLevel> {
    const pool = await getConnection();
    
    const toNullIfEmpty = (value: any) => {
      if (typeof value === 'string' && value.trim() === '') {
        return null;
      }
      return value;
    };

    const result = await pool
      .request()
      .input('level', sql.Int, skillLevel.level)
      .input('name', sql.NVarChar(100), skillLevel.name)
      .input('shortName', sql.NVarChar(50), toNullIfEmpty(skillLevel.shortName))
      .input('description', sql.NVarChar(2000), skillLevel.description)
      .input('knowledgeCriteria', sql.NVarChar(2000), toNullIfEmpty(skillLevel.knowledgeCriteria))
      .input('skillsCriteria', sql.NVarChar(2000), toNullIfEmpty(skillLevel.skillsCriteria))
      .input('experienceCriteria', sql.NVarChar(2000), toNullIfEmpty(skillLevel.experienceCriteria))
      .input('autonomyCriteria', sql.NVarChar(2000), toNullIfEmpty(skillLevel.autonomyCriteria))
      .input('complexityCriteria', sql.NVarChar(2000), toNullIfEmpty(skillLevel.complexityCriteria))
      .input('color', sql.NVarChar(50), toNullIfEmpty(skillLevel.color))
      .input('icon', sql.NVarChar(100), toNullIfEmpty(skillLevel.icon))
      .input('displayOrder', sql.Int, skillLevel.displayOrder || 0)
      .input('exampleBehaviors', sql.NVarChar(sql.MAX), toNullIfEmpty(skillLevel.exampleBehaviors))
      .input('assessmentGuidance', sql.NVarChar(2000), toNullIfEmpty(skillLevel.assessmentGuidance))
      .input('active', sql.Bit, skillLevel.active !== undefined ? skillLevel.active : true)
      .input('createdBy', sql.Int, skillLevel.createdBy)
      .query(`
        INSERT INTO SkillLevels (
          level, name, shortName, description,
          knowledgeCriteria, skillsCriteria, experienceCriteria,
          autonomyCriteria, complexityCriteria,
          color, icon, displayOrder,
          exampleBehaviors, assessmentGuidance,
          active, createdBy, createdAt, updatedAt
        )
        OUTPUT INSERTED.*
        VALUES (
          @level, @name, @shortName, @description,
          @knowledgeCriteria, @skillsCriteria, @experienceCriteria,
          @autonomyCriteria, @complexityCriteria,
          @color, @icon, @displayOrder,
          @exampleBehaviors, @assessmentGuidance,
          @active, @createdBy, GETDATE(), GETDATE()
        )
      `);

    return result.recordset[0];
  }

  /**
   * Update an existing skill level
   */
  async update(id: number, skillLevel: Partial<SkillLevel>): Promise<SkillLevel> {
    const pool = await getConnection();
    
    const toNullIfEmpty = (value: any) => {
      if (typeof value === 'string' && value.trim() === '') {
        return null;
      }
      return value;
    };

    const request = pool.request();
    const updates: string[] = [];

    const fields: { [key: string]: any } = {
      level: skillLevel.level,
      name: skillLevel.name,
      shortName: skillLevel.shortName,
      description: skillLevel.description,
      knowledgeCriteria: skillLevel.knowledgeCriteria,
      skillsCriteria: skillLevel.skillsCriteria,
      experienceCriteria: skillLevel.experienceCriteria,
      autonomyCriteria: skillLevel.autonomyCriteria,
      complexityCriteria: skillLevel.complexityCriteria,
      color: skillLevel.color,
      icon: skillLevel.icon,
      displayOrder: skillLevel.displayOrder,
      exampleBehaviors: skillLevel.exampleBehaviors,
      assessmentGuidance: skillLevel.assessmentGuidance,
      active: skillLevel.active,
      updatedBy: skillLevel.updatedBy,
    };

    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        updates.push(`${key} = @${key}`);
        
        let processedValue = value;
        if (key === 'exampleBehaviors') {
          processedValue = toNullIfEmpty(value);
          request.input(key, sql.NVarChar(sql.MAX), processedValue);
        } else if (key === 'description' || key === 'knowledgeCriteria' || 
                   key === 'skillsCriteria' || key === 'experienceCriteria' ||
                   key === 'autonomyCriteria' || key === 'complexityCriteria' ||
                   key === 'assessmentGuidance') {
          processedValue = toNullIfEmpty(value);
          request.input(key, sql.NVarChar(2000), processedValue);
        } else if (key === 'name') {
          processedValue = toNullIfEmpty(value);
          request.input(key, sql.NVarChar(100), processedValue);
        } else if (key === 'shortName' || key === 'color') {
          processedValue = toNullIfEmpty(value);
          request.input(key, sql.NVarChar(50), processedValue);
        } else if (key === 'icon') {
          processedValue = toNullIfEmpty(value);
          request.input(key, sql.NVarChar(100), processedValue);
        } else if (key === 'level' || key === 'displayOrder' || key === 'updatedBy') {
          request.input(key, sql.Int, processedValue || null);
        } else if (key === 'active') {
          request.input(key, sql.Bit, processedValue);
        }
      }
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    updates.push('updatedAt = GETDATE()');

    request.input('id', sql.Int, id);

    const result = await request.query(`
      UPDATE SkillLevels
      SET ${updates.join(', ')}
      OUTPUT INSERTED.*
      WHERE id = @id
    `);

    if (result.recordset.length === 0) {
      throw new Error('Skill level not found');
    }

    return result.recordset[0];
  }

  /**
   * Delete a skill level (soft delete)
   */
  async delete(id: number, userId: number): Promise<void> {
    const pool = await getConnection();
    
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .input('userId', sql.Int, userId)
      .query(`
        UPDATE SkillLevels
        SET 
          active = 0,
          updatedBy = @userId,
          updatedAt = GETDATE()
        WHERE id = @id
      `);

    if (result.rowsAffected[0] === 0) {
      throw new Error('Skill level not found');
    }
  }

  /**
   * Get skill level summary for quick reference
   */
  async getSummary(): Promise<Array<{level: number, name: string, shortName: string, color: string, icon: string}>> {
    const pool = await getConnection();
    
    const result = await pool.request().query(`
      SELECT 
        level,
        name,
        shortName,
        color,
        icon
      FROM SkillLevels
      WHERE active = 1
      ORDER BY level ASC
    `);

    return result.recordset;
  }
}

export default new SkillLevelModel();

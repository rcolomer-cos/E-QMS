import { getConnection, sql } from '../config/database';

export interface CompanyBranding {
  id?: number;
  companyName: string;
  companyLogoUrl?: string | null;
  companyLogoPath?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  companyWebsite?: string | null;
  companyEmail?: string | null;
  companyPhone?: string | null;
  companyAddress?: string | null;
  companyCity?: string | null;
  companyState?: string | null;
  companyPostalCode?: string | null;
  companyCountry?: string | null;
  tagline?: string | null;
  description?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: number | null;
  updatedBy?: number | null;
}

export class CompanyBrandingModel {
  /**
   * Get company branding information (should only be one record)
   */
  static async get(): Promise<CompanyBranding | null> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .query('SELECT TOP 1 * FROM company_branding WHERE id = 1');

    if (result.recordset.length === 0) {
      return null;
    }

    const row = result.recordset[0];
    return this.mapRowToBranding(row);
  }

  /**
   * Create company branding (should only be called once)
   */
  static async create(
    branding: Omit<CompanyBranding, 'id' | 'createdAt' | 'updatedAt'>,
    userId: number
  ): Promise<number> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('companyName', sql.NVarChar, branding.companyName)
      .input('companyLogoUrl', sql.NVarChar, branding.companyLogoUrl)
      .input('companyLogoPath', sql.NVarChar, branding.companyLogoPath)
      .input('primaryColor', sql.NVarChar, branding.primaryColor || '#1976d2')
      .input('secondaryColor', sql.NVarChar, branding.secondaryColor || '#dc004e')
      .input('companyWebsite', sql.NVarChar, branding.companyWebsite)
      .input('companyEmail', sql.NVarChar, branding.companyEmail)
      .input('companyPhone', sql.NVarChar, branding.companyPhone)
      .input('companyAddress', sql.NVarChar, branding.companyAddress)
      .input('companyCity', sql.NVarChar, branding.companyCity)
      .input('companyState', sql.NVarChar, branding.companyState)
      .input('companyPostalCode', sql.NVarChar, branding.companyPostalCode)
      .input('companyCountry', sql.NVarChar, branding.companyCountry)
      .input('tagline', sql.NVarChar, branding.tagline)
      .input('description', sql.NVarChar, branding.description)
      .input('createdBy', sql.Int, userId)
      .input('updatedBy', sql.Int, userId)
      .query(`
        INSERT INTO company_branding (
          company_name, company_logo_url, company_logo_path,
          primary_color, secondary_color, company_website,
          company_email, company_phone, company_address,
          company_city, company_state, company_postal_code,
          company_country, tagline, description,
          created_by, updated_by
        )
        OUTPUT INSERTED.id
        VALUES (
          @companyName, @companyLogoUrl, @companyLogoPath,
          @primaryColor, @secondaryColor, @companyWebsite,
          @companyEmail, @companyPhone, @companyAddress,
          @companyCity, @companyState, @companyPostalCode,
          @companyCountry, @tagline, @description,
          @createdBy, @updatedBy
        )
      `);

    return result.recordset[0].id;
  }

  /**
   * Update company branding
   */
  static async update(
    branding: Partial<CompanyBranding>,
    userId: number
  ): Promise<boolean> {
    const pool = await getConnection();
    const request = pool.request();

    // Build dynamic update query
    const updates: string[] = [];
    
    if (branding.companyName !== undefined) {
      updates.push('company_name = @companyName');
      request.input('companyName', sql.NVarChar, branding.companyName);
    }
    if (branding.companyLogoUrl !== undefined) {
      updates.push('company_logo_url = @companyLogoUrl');
      request.input('companyLogoUrl', sql.NVarChar, branding.companyLogoUrl);
    }
    if (branding.companyLogoPath !== undefined) {
      updates.push('company_logo_path = @companyLogoPath');
      request.input('companyLogoPath', sql.NVarChar, branding.companyLogoPath);
    }
    if (branding.primaryColor !== undefined) {
      updates.push('primary_color = @primaryColor');
      request.input('primaryColor', sql.NVarChar, branding.primaryColor);
    }
    if (branding.secondaryColor !== undefined) {
      updates.push('secondary_color = @secondaryColor');
      request.input('secondaryColor', sql.NVarChar, branding.secondaryColor);
    }
    if (branding.companyWebsite !== undefined) {
      updates.push('company_website = @companyWebsite');
      request.input('companyWebsite', sql.NVarChar, branding.companyWebsite);
    }
    if (branding.companyEmail !== undefined) {
      updates.push('company_email = @companyEmail');
      request.input('companyEmail', sql.NVarChar, branding.companyEmail);
    }
    if (branding.companyPhone !== undefined) {
      updates.push('company_phone = @companyPhone');
      request.input('companyPhone', sql.NVarChar, branding.companyPhone);
    }
    if (branding.companyAddress !== undefined) {
      updates.push('company_address = @companyAddress');
      request.input('companyAddress', sql.NVarChar, branding.companyAddress);
    }
    if (branding.companyCity !== undefined) {
      updates.push('company_city = @companyCity');
      request.input('companyCity', sql.NVarChar, branding.companyCity);
    }
    if (branding.companyState !== undefined) {
      updates.push('company_state = @companyState');
      request.input('companyState', sql.NVarChar, branding.companyState);
    }
    if (branding.companyPostalCode !== undefined) {
      updates.push('company_postal_code = @companyPostalCode');
      request.input('companyPostalCode', sql.NVarChar, branding.companyPostalCode);
    }
    if (branding.companyCountry !== undefined) {
      updates.push('company_country = @companyCountry');
      request.input('companyCountry', sql.NVarChar, branding.companyCountry);
    }
    if (branding.tagline !== undefined) {
      updates.push('tagline = @tagline');
      request.input('tagline', sql.NVarChar, branding.tagline);
    }
    if (branding.description !== undefined) {
      updates.push('description = @description');
      request.input('description', sql.NVarChar, branding.description);
    }

    if (updates.length === 0) {
      return false;
    }

    updates.push('updated_at = @updatedAt');
    updates.push('updated_by = @updatedBy');
    request.input('updatedAt', sql.DateTime, new Date());
    request.input('updatedBy', sql.Int, userId);

    const result = await request.query(`
      UPDATE company_branding
      SET ${updates.join(', ')}
      WHERE id = 1
    `);

    return result.rowsAffected[0] > 0;
  }

  /**
   * Helper method to map database row to CompanyBranding object
   */
  private static mapRowToBranding(row: any): CompanyBranding {
    return {
      id: row.id,
      companyName: row.company_name,
      companyLogoUrl: row.company_logo_url,
      companyLogoPath: row.company_logo_path,
      primaryColor: row.primary_color,
      secondaryColor: row.secondary_color,
      companyWebsite: row.company_website,
      companyEmail: row.company_email,
      companyPhone: row.company_phone,
      companyAddress: row.company_address,
      companyCity: row.company_city,
      companyState: row.company_state,
      companyPostalCode: row.company_postal_code,
      companyCountry: row.company_country,
      tagline: row.tagline,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
    };
  }
}

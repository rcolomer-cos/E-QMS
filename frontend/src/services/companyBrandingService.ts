import api from './api';

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

export interface UpdateCompanyBrandingPayload {
  companyName?: string;
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
}

export interface CreateCompanyBrandingPayload {
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
}

/**
 * Get company branding information
 */
export const getCompanyBranding = async (): Promise<CompanyBranding> => {
  const { data } = await api.get<CompanyBranding>('/company-branding');
  return data;
};

/**
 * Create company branding (only if it doesn't exist)
 */
export const createCompanyBranding = async (
  payload: CreateCompanyBrandingPayload
): Promise<{ message: string; branding: CompanyBranding }> => {
  const { data } = await api.post<{ message: string; branding: CompanyBranding }>(
    '/company-branding',
    payload
  );
  return data;
};

/**
 * Update company branding
 */
export const updateCompanyBranding = async (
  payload: UpdateCompanyBrandingPayload
): Promise<{ message: string; branding: CompanyBranding }> => {
  const { data } = await api.put<{ message: string; branding: CompanyBranding }>(
    '/company-branding',
    payload
  );
  return data;
};

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { CompanyBranding, getCompanyBranding } from '../services/companyBrandingService';

interface BrandingContextType {
  branding: CompanyBranding | null;
  loading: boolean;
  error: string | null;
  refreshBranding: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<CompanyBranding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBranding = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCompanyBranding();
      setBranding(data);
      
      // Apply brand colors to CSS variables
      if (data.primaryColor) {
        document.documentElement.style.setProperty('--brand-primary-color', data.primaryColor);
      }
      if (data.secondaryColor) {
        document.documentElement.style.setProperty('--brand-secondary-color', data.secondaryColor);
      }
      
      // Update page title with company name
      if (data.companyName) {
        document.title = `${data.companyName} - Quality Management System`;
      }
    } catch (err) {
      console.error('Error loading company branding:', err);
      setError('Failed to load company branding');
      // Set default values even on error
      document.title = 'E-QMS - Quality Management System';
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranding();
  }, []);

  const refreshBranding = async () => {
    await loadBranding();
  };

  return (
    <BrandingContext.Provider value={{ branding, loading, error, refreshBranding }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
}

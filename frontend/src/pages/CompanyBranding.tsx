import { useState, useEffect } from 'react';
import {
  getCompanyBranding,
  updateCompanyBranding,
  CompanyBranding as CompanyBrandingType,
} from '../services/companyBrandingService';
import { useBranding } from '../contexts/BrandingContext';
import '../styles/CompanyBranding.css';

const CompanyBranding = () => {
  const { refreshBranding } = useBranding();
  const [branding, setBranding] = useState<CompanyBrandingType | null>(null);
  const [formData, setFormData] = useState<Partial<CompanyBrandingType>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadBranding();
  }, []);

  const loadBranding = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getCompanyBranding();
      setBranding(data);
      setFormData(data);
    } catch (err) {
      console.error('Error loading company branding:', err);
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to load company branding');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CompanyBrandingType, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (success) setSuccess('');
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const result = await updateCompanyBranding(formData);
      setSuccess(result.message);
      setBranding(result.branding);
      setFormData(result.branding);
      
      // Refresh global branding context to update logo and colors throughout the app
      await refreshBranding();
    } catch (err) {
      console.error('Error saving company branding:', err);
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to save company branding');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setFormData(branding || {});
    setSuccess('');
    setError('');
  };

  if (loading) {
    return <div className="loading">Loading company branding...</div>;
  }

  return (
    <div className="company-branding-page">
      <div className="page-header">
        <h1>Company Branding</h1>
        <p className="subtitle">
          Customize your company's identity and appearance in the system
        </p>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <span className="alert-icon">✓</span>
          {success}
        </div>
      )}

      <div className="branding-form">
        {/* Company Information Section */}
        <section className="form-section">
          <h2>Company Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="companyName">Company Name *</label>
              <input
                type="text"
                id="companyName"
                value={formData.companyName || ''}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="tagline">Tagline</label>
              <input
                type="text"
                id="tagline"
                value={formData.tagline || ''}
                onChange={(e) => handleInputChange('tagline', e.target.value)}
                className="form-input"
                placeholder="Your company slogan or tagline"
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="form-textarea"
                rows={3}
                placeholder="Brief description of your company"
              />
            </div>
          </div>
        </section>

        {/* Visual Branding Section */}
        <section className="form-section">
          <h2>Visual Branding</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="companyLogoUrl">Logo URL</label>
              <input
                type="text"
                id="companyLogoUrl"
                value={formData.companyLogoUrl || ''}
                onChange={(e) => handleInputChange('companyLogoUrl', e.target.value)}
                className="form-input"
                placeholder="https://example.com/logo.png"
              />
              <small className="form-hint">External URL for your company logo</small>
            </div>

            <div className="form-group">
              <label htmlFor="companyLogoPath">Logo Path</label>
              <input
                type="text"
                id="companyLogoPath"
                value={formData.companyLogoPath || ''}
                onChange={(e) => handleInputChange('companyLogoPath', e.target.value)}
                className="form-input"
                placeholder="/uploads/logo.png"
              />
              <small className="form-hint">Server path for uploaded logo</small>
            </div>

            <div className="form-group">
              <label htmlFor="primaryColor">Primary Color</label>
              <div className="color-input-group">
                <input
                  type="color"
                  id="primaryColor"
                  value={formData.primaryColor || '#1976d2'}
                  onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                  className="color-picker"
                />
                <input
                  type="text"
                  value={formData.primaryColor || '#1976d2'}
                  onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                  className="color-text"
                  placeholder="#1976d2"
                />
              </div>
              <small className="form-hint">Main brand color for UI elements</small>
            </div>

            <div className="form-group">
              <label htmlFor="secondaryColor">Secondary Color</label>
              <div className="color-input-group">
                <input
                  type="color"
                  id="secondaryColor"
                  value={formData.secondaryColor || '#dc004e'}
                  onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                  className="color-picker"
                />
                <input
                  type="text"
                  value={formData.secondaryColor || '#dc004e'}
                  onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                  className="color-text"
                  placeholder="#dc004e"
                />
              </div>
              <small className="form-hint">Accent color for highlights</small>
            </div>
          </div>

          {/* Logo Preview */}
          {(formData.companyLogoUrl || formData.companyLogoPath) && (
            <div className="logo-preview">
              <h3>Logo Preview</h3>
              <div className="preview-container">
                <img
                  src={formData.companyLogoUrl || formData.companyLogoPath || ''}
                  alt="Company Logo"
                  className="logo-image"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}
        </section>

        {/* Contact Information Section */}
        <section className="form-section">
          <h2>Contact Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="companyEmail">Email</label>
              <input
                type="email"
                id="companyEmail"
                value={formData.companyEmail || ''}
                onChange={(e) => handleInputChange('companyEmail', e.target.value)}
                className="form-input"
                placeholder="contact@company.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="companyPhone">Phone</label>
              <input
                type="tel"
                id="companyPhone"
                value={formData.companyPhone || ''}
                onChange={(e) => handleInputChange('companyPhone', e.target.value)}
                className="form-input"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="form-group">
              <label htmlFor="companyWebsite">Website</label>
              <input
                type="url"
                id="companyWebsite"
                value={formData.companyWebsite || ''}
                onChange={(e) => handleInputChange('companyWebsite', e.target.value)}
                className="form-input"
                placeholder="https://www.company.com"
              />
            </div>
          </div>
        </section>

        {/* Address Section */}
        <section className="form-section">
          <h2>Address</h2>
          <div className="form-grid">
            <div className="form-group full-width">
              <label htmlFor="companyAddress">Street Address</label>
              <input
                type="text"
                id="companyAddress"
                value={formData.companyAddress || ''}
                onChange={(e) => handleInputChange('companyAddress', e.target.value)}
                className="form-input"
                placeholder="123 Main Street"
              />
            </div>

            <div className="form-group">
              <label htmlFor="companyCity">City</label>
              <input
                type="text"
                id="companyCity"
                value={formData.companyCity || ''}
                onChange={(e) => handleInputChange('companyCity', e.target.value)}
                className="form-input"
                placeholder="New York"
              />
            </div>

            <div className="form-group">
              <label htmlFor="companyState">State/Province</label>
              <input
                type="text"
                id="companyState"
                value={formData.companyState || ''}
                onChange={(e) => handleInputChange('companyState', e.target.value)}
                className="form-input"
                placeholder="NY"
              />
            </div>

            <div className="form-group">
              <label htmlFor="companyPostalCode">Postal Code</label>
              <input
                type="text"
                id="companyPostalCode"
                value={formData.companyPostalCode || ''}
                onChange={(e) => handleInputChange('companyPostalCode', e.target.value)}
                className="form-input"
                placeholder="10001"
              />
            </div>

            <div className="form-group">
              <label htmlFor="companyCountry">Country</label>
              <input
                type="text"
                id="companyCountry"
                value={formData.companyCountry || ''}
                onChange={(e) => handleInputChange('companyCountry', e.target.value)}
                className="form-input"
                placeholder="United States"
              />
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="form-actions">
          <button className="btn btn-secondary" onClick={handleReset} disabled={saving}>
            Reset Changes
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompanyBranding;

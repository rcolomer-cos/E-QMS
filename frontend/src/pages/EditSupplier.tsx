import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getSuppliers,
  updateSupplier,
  getCategories,
  getSupplierTypes,
  getIndustries,
  Supplier,
} from '../services/aslService';
import { getUsers, User } from '../services/userService';
import { useToast } from '../contexts/ToastContext';
import '../styles/AddSupplier.css';

function EditSupplier() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [categories, setCategories] = useState<string[]>([]);
  const [supplierTypes, setSupplierTypes] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [supplier, setSupplier] = useState<Supplier | null>(null);

  const [formData, setFormData] = useState<Partial<Supplier>>({
    name: '',
    description: '',
    category: '',
    supplierType: '',
    industry: '',
    contactPerson: '',
    email: '',
    phone: '',
    alternatePhone: '',
    website: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    stateProvince: '',
    postalCode: '',
    country: '',
    approvalStatus: 'pending',
    productsServices: '',
    riskLevel: 'Medium',
    criticalSupplier: false,
    preferredSupplier: false,
    certifications: '',
    businessRegistrationNumber: '',
    paymentTerms: '',
    notes: '',
    rating: 3,
    qualityGrade: 'C',
    lastEvaluationDate: undefined,
    supplierManager: undefined,
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesData, typesData, industriesData, usersData, suppliersResponse] = await Promise.all([
        getCategories(),
        getSupplierTypes(),
        getIndustries(),
        getUsers(),
        getSuppliers(),
      ]);
      
      setCategories(categoriesData);
      setSupplierTypes(typesData);
      setIndustries(industriesData);
      setUsers(usersData);

      const currentSupplier = suppliersResponse.suppliers.find(s => s.id === parseInt(id || '0'));
      if (currentSupplier) {
        setSupplier(currentSupplier);
        setFormData({
          name: currentSupplier.name || '',
          description: currentSupplier.description || '',
          category: currentSupplier.category || '',
          supplierType: currentSupplier.supplierType || '',
          industry: currentSupplier.industry || '',
          contactPerson: currentSupplier.contactPerson || '',
          email: currentSupplier.email || '',
          phone: currentSupplier.phone || '',
          alternatePhone: currentSupplier.alternatePhone || '',
          website: currentSupplier.website || '',
          addressLine1: currentSupplier.addressLine1 || '',
          addressLine2: currentSupplier.addressLine2 || '',
          city: currentSupplier.city || '',
          stateProvince: currentSupplier.stateProvince || '',
          postalCode: currentSupplier.postalCode || '',
          country: currentSupplier.country || '',
          approvalStatus: currentSupplier.approvalStatus || 'pending',
          productsServices: currentSupplier.productsServices || '',
          riskLevel: currentSupplier.riskLevel || 'Low',
          criticalSupplier: currentSupplier.criticalSupplier || false,
          preferredSupplier: currentSupplier.preferredSupplier || false,
          certifications: currentSupplier.certifications || '',
          businessRegistrationNumber: currentSupplier.businessRegistrationNumber || '',
          paymentTerms: currentSupplier.paymentTerms || '',
          notes: currentSupplier.notes || '',
          rating: currentSupplier.rating || 3,
          qualityGrade: currentSupplier.qualityGrade || 'C',
          lastEvaluationDate: currentSupplier.lastEvaluationDate,
          supplierManager: currentSupplier.supplierManager,
        });
      } else {
        toast.error('Supplier not found');
        navigate('/approved-supplier-list');
      }
    } catch (err) {
      toast.error('Failed to load supplier data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getQualityGrade = (rating: number): string => {
    if (rating >= 5) return 'A';
    if (rating >= 4) return 'B';
    if (rating >= 3) return 'C';
    if (rating >= 2) return 'D';
    return 'F';
  };

  const getRiskLevel = (rating: number): string => {
    if (rating >= 4) return 'Low';
    if (rating >= 3) return 'Medium';
    if (rating >= 2) return 'High';
    return 'Critical';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let newValue: any = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: newValue,
      };

      // Auto-update quality grade and risk level when rating changes
      if (name === 'rating') {
        const ratingNum = parseInt(value, 10);
        if (!isNaN(ratingNum) && ratingNum >= 1 && ratingNum <= 5) {
          updated.qualityGrade = getQualityGrade(ratingNum);
          updated.riskLevel = getRiskLevel(ratingNum);
        }
      }

      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier) return;

    try {
      setSaving(true);
      await updateSupplier(supplier.id, formData);
      toast.showUpdateSuccess('Supplier');
      navigate('/approved-supplier-list');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update supplier');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="page"><div className="loading">Loading supplier...</div></div>;
  }

  if (!supplier) {
    return <div className="page"><div className="loading">Supplier not found</div></div>;
  }

  return (
    <div className="add-supplier-page">
      <div className="page-header">
        <div>
          <button className="btn-secondary" onClick={() => navigate('/approved-supplier-list')}>
            ← Back
          </button>
          <h1>Edit Supplier</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="supplier-form">
        {/* Basic Information */}
        <div className="form-section">
          <h2>Basic Information</h2>
          <div className="form-layout">
            <div className="form-group">
              <label htmlFor="name">Supplier Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="supplierType">Supplier Type</label>
              <select
                id="supplierType"
                name="supplierType"
                value={formData.supplierType}
                onChange={handleChange}
              >
                <option value="">Select Type</option>
                {supplierTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="industry">Industry</label>
              <select
                id="industry"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
              >
                <option value="">Select Industry</option>
                {industries.map(ind => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="criticalSupplier"
                  checked={formData.criticalSupplier || false}
                  onChange={handleChange}
                />
                {' '}Critical Supplier
              </label>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="preferredSupplier"
                  checked={formData.preferredSupplier || false}
                  onChange={handleChange}
                />
                {' '}Preferred Supplier
              </label>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="form-section">
          <h2>Contact Information</h2>
          <div className="form-layout">
            <div className="form-group">
              <label htmlFor="contactPerson">Contact Person</label>
              <input
                type="text"
                id="contactPerson"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="alternatePhone">Alternate Phone</label>
              <input
                type="tel"
                id="alternatePhone"
                name="alternatePhone"
                value={formData.alternatePhone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="website">Website</label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://"
              />
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="form-section">
          <h2>Address</h2>
          <div className="form-layout">
            <div className="form-group">
              <label htmlFor="addressLine1">Address Line 1</label>
              <input
                type="text"
                id="addressLine1"
                name="addressLine1"
                value={formData.addressLine1}
                onChange={handleChange}
                placeholder="Street Address"
              />
            </div>

            <div className="form-group">
              <label htmlFor="addressLine2">Address Line 2</label>
              <input
                type="text"
                id="addressLine2"
                name="addressLine2"
                value={formData.addressLine2}
                onChange={handleChange}
                placeholder="Suite, Unit, Building"
              />
            </div>

            <div className="form-group">
              <label htmlFor="city">City</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="stateProvince">State/Province</label>
              <input
                type="text"
                id="stateProvince"
                name="stateProvince"
                value={formData.stateProvince}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="postalCode">Postal Code</label>
              <input
                type="text"
                id="postalCode"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="country">Country</label>
              <input
                type="text"
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="form-section">
          <h2>Additional Information</h2>
          <div className="form-layout">
            <div className="form-group">
              <label htmlFor="businessRegistrationNumber">Business Registration Number</label>
              <input
                type="text"
                id="businessRegistrationNumber"
                name="businessRegistrationNumber"
                value={formData.businessRegistrationNumber}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="paymentTerms">Payment Terms</label>
              <input
                type="text"
                id="paymentTerms"
                name="paymentTerms"
                value={formData.paymentTerms}
                onChange={handleChange}
                placeholder="e.g., Net 30"
              />
            </div>

            <div className="form-group">
              <label htmlFor="certifications">Certifications</label>
              <input
                type="text"
                id="certifications"
                name="certifications"
                value={formData.certifications}
                onChange={handleChange}
                placeholder="Comma-separated"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="productsServices">Products/Services</label>
            <textarea
              id="productsServices"
              name="productsServices"
              value={formData.productsServices}
              onChange={handleChange}
              rows={3}
              placeholder="Describe the products or services this supplier provides"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Additional information about the supplier"
            />
          </div>
        </div>

        {/* Performance & Evaluation */}
        <div className="form-section">
          <h2>Performance & Evaluation</h2>
          <div className="form-layout">
            <div className="form-group">
              <label htmlFor="approvalStatus">Approval Status *</label>
              <select
                id="approvalStatus"
                name="approvalStatus"
                value={formData.approvalStatus}
                onChange={handleChange}
                required
              >
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="conditional_approval">Conditional Approval</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="rating">Rating (1-5) *</label>
              <input
                type="number"
                id="rating"
                name="rating"
                value={formData.rating || 3}
                onChange={handleChange}
                min="1"
                max="5"
                required
                placeholder="1-5"
              />
            </div>

            <div className="form-group">
              <label htmlFor="qualityGrade">Quality Grade (Auto-calculated)</label>
              <input
                type="text"
                id="qualityGrade"
                name="qualityGrade"
                value={formData.qualityGrade || 'C'}
                readOnly
                style={{ backgroundColor: '#f5f5f5' }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="riskLevel">Risk Level</label>
              <select
                id="riskLevel"
                name="riskLevel"
                value={formData.riskLevel}
                onChange={handleChange}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="lastEvaluationDate">Evaluation Date</label>
              <input
                type="date"
                id="lastEvaluationDate"
                name="lastEvaluationDate"
                value={formData.lastEvaluationDate ? new Date(formData.lastEvaluationDate).toISOString().split('T')[0] : ''}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="supplierManager">Evaluated By</label>
              <select
                id="supplierManager"
                name="supplierManager"
                value={formData.supplierManager || ''}
                onChange={handleChange}
              >
                <option value="">Select User</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Evaluation Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Internal notes about this evaluation"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate('/approved-supplier-list')}
            disabled={saving}
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditSupplier;

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createWorkRole,
  updateWorkRole,
  getWorkRoleById,
  getCategories,
  WorkRole,
} from '../services/workRoleService';
import { getDepartments } from '../services/departmentService';
import { getCurrentUser } from '../services/authService';
import { useToast } from '../contexts/ToastContext';
import '../styles/WorkRoleForm.css';

function WorkRoleForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  const [formData, setFormData] = useState<Partial<WorkRole>>({
    name: '',
    code: '',
    description: '',
    departmentId: undefined,
    category: '',
    level: '',
    status: 'active',
    displayOrder: 0,
    active: true,
    responsibilitiesAndAuthorities: '',
    requiredQualifications: '',
    experienceYears: undefined,
    notes: '',
    createdBy: 0,
  });

  useEffect(() => {
    loadCurrentUser();
    loadCategories();
    loadDepartments();
    if (isEditMode) {
      loadWorkRole();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const hasRole = (user: any, roleNames: string[]) => {
    if (!user) return false;
    const userRoles = user.roleNames || [];
    if (userRoles.length > 0) {
      return roleNames.some(role => userRoles.map((r: string) => r.toLowerCase()).includes(role.toLowerCase()));
    }
    if (user.roles && user.roles.length > 0) {
      const roleNamesFromRoles = user.roles.map((r: any) => r.name.toLowerCase());
      return roleNames.some(role => roleNamesFromRoles.includes(role.toLowerCase()));
    }
    if (user.role) {
      return roleNames.some(role => role.toLowerCase() === user.role?.toLowerCase());
    }
    return false;
  };

  const loadCurrentUser = () => {
    const user = getCurrentUser();
    // Check permissions
    if (user && !hasRole(user, ['superuser', 'manager'])) {
      toast.error('You do not have permission to manage work roles');
      navigate('/work-roles');
    }
  };

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await getDepartments();
      setDepartments(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error('Error loading departments:', err);
    }
  };

  const loadWorkRole = async () => {
    try {
      setLoading(true);
      const workRole = await getWorkRoleById(parseInt(id!));
      setFormData({
        name: workRole.name,
        code: workRole.code || '',
        description: workRole.description || '',
        departmentId: workRole.departmentId,
        category: workRole.category || '',
        level: workRole.level || '',
        status: workRole.status,
        displayOrder: workRole.displayOrder || 0,
        active: workRole.active !== undefined ? workRole.active : true,
        responsibilitiesAndAuthorities: workRole.responsibilitiesAndAuthorities || '',
        requiredQualifications: workRole.requiredQualifications || '',
        experienceYears: workRole.experienceYears,
        notes: workRole.notes || '',
        createdBy: workRole.createdBy,
      });
    } catch (err: any) {
      console.error('Error loading work role:', err);
      toast.error(err.response?.data?.message || 'Failed to load work role');
      navigate('/work-roles');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      const numValue = value === '' ? undefined : parseInt(value, 10);
      setFormData(prev => ({ ...prev, [name]: numValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name?.trim()) {
      toast.error('Please enter a work role name');
      return;
    }

    try {
      setSaving(true);
      
      if (isEditMode) {
        await updateWorkRole(parseInt(id!), formData);
        toast.success('Work role updated successfully');
      } else {
        await createWorkRole(formData as any);
        toast.success('Work role created successfully');
      }
      
      navigate('/work-roles');
    } catch (err: any) {
      console.error('Error saving work role:', err);
      toast.error(err.response?.data?.message || 'Failed to save work role');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/work-roles');
  };

  if (loading) {
    return (
      <div className="work-role-form-page">
        <div className="loading">Loading work role...</div>
      </div>
    );
  }

  return (
    <div className="work-role-form-page">
      <div className="form-header">
        <div>
          <h1>{isEditMode ? 'Edit Work Role' : 'Add Work Role'}</h1>
          <p className="form-description">
            {isEditMode 
              ? 'Update work role details and requirements' 
              : 'Create a new work role for the competence matrix'}
          </p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn-secondary" onClick={handleCancel}>
            ← Back to List
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="work-role-form">
        {/* Basic Information Section */}
        <div className="form-section">
          <div className="section-header">
            <h2>Basic Information</h2>
            <p>Essential details about the work role</p>
          </div>
          <div className="section-content">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">
                  Name <span className="required">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Quality Manager"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="code">Code</label>
                <input
                  id="code"
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="e.g., QM, PE"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Brief description of the work role and its purpose within the organization..."
              />
            </div>
          </div>
        </div>

        {/* Organization & Classification Section */}
        <div className="form-section">
          <div className="section-header">
            <h2>Organization & Classification</h2>
            <p>Department assignment and role categorization</p>
          </div>
          <div className="section-content">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="departmentId">Department</label>
                <select
                  id="departmentId"
                  name="departmentId"
                  value={formData.departmentId || ''}
                  onChange={handleChange}
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="category">Category</label>
                <input
                  id="category"
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="e.g., Management, Technical, Quality Assurance"
                  list="categories-list"
                />
                <datalist id="categories-list">
                  {categories.map(cat => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="level">Level</label>
                <select
                  id="level"
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                >
                  <option value="">Select Level</option>
                  <option value="Entry">Entry</option>
                  <option value="Junior">Junior</option>
                  <option value="Mid">Mid</option>
                  <option value="Senior">Senior</option>
                  <option value="Lead">Lead</option>
                  <option value="Manager">Manager</option>
                  <option value="Director">Director</option>
                  <option value="Executive">Executive</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="experienceYears">Experience Required (years)</label>
                <input
                  id="experienceYears"
                  type="number"
                  name="experienceYears"
                  value={formData.experienceYears || ''}
                  onChange={handleChange}
                  min="0"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ISO 9001 Requirements Section */}
        <div className="form-section">
          <div className="section-header">
            <h2>ISO 9001 Requirements</h2>
            <p>Responsibilities, authorities, and qualifications per ISO 9001:2015</p>
          </div>
          <div className="section-content">
            <div className="form-group">
              <label htmlFor="responsibilitiesAndAuthorities">
                Responsibilities and Authorities
              </label>
              <textarea
                id="responsibilitiesAndAuthorities"
                name="responsibilitiesAndAuthorities"
                value={formData.responsibilitiesAndAuthorities}
                onChange={handleChange}
                rows={6}
                placeholder="Key responsibilities and authorities per ISO 9001:2015 (Clause 5.3)&#10;&#10;• List main duties and decision-making authority&#10;• Define scope of work and accountability&#10;• Specify organizational relationships and reporting structure"
              />
              <small className="field-hint">
                Document the key responsibilities and decision-making authority for this role
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="requiredQualifications">Required Qualifications</label>
              <textarea
                id="requiredQualifications"
                name="requiredQualifications"
                value={formData.requiredQualifications}
                onChange={handleChange}
                rows={5}
                placeholder="Minimum qualifications needed (education, certifications, skills)&#10;&#10;• Educational background (degree, field of study)&#10;• Professional certifications required&#10;• Technical competencies and skills"
              />
              <small className="field-hint">
                Specify the minimum education, certifications, and competencies required
              </small>
            </div>
          </div>
        </div>

        {/* Status & Display Section */}
        <div className="form-section">
          <div className="section-header">
            <h2>Status & Display</h2>
            <p>Control visibility and ordering of this work role</p>
          </div>
          <div className="section-content">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="status">
                  Status <span className="required">*</span>
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="archived">Archived</option>
                </select>
                <small className="field-hint">
                  Active roles are available for assignment
                </small>
              </div>
              <div className="form-group">
                <label htmlFor="displayOrder">Display Order</label>
                <input
                  id="displayOrder"
                  type="number"
                  name="displayOrder"
                  value={formData.displayOrder || 0}
                  onChange={handleChange}
                  min="0"
                  placeholder="0"
                />
                <small className="field-hint">
                  Lower numbers appear first in lists
                </small>
              </div>
            </div>

            <div className="form-group checkbox-group">
              <label htmlFor="active">
                <input
                  id="active"
                  type="checkbox"
                  name="active"
                  checked={formData.active}
                  onChange={handleChange}
                />
                <span>Active (visible in role selection lists)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Additional Notes Section */}
        <div className="form-section">
          <div className="section-header">
            <h2>Additional Notes</h2>
            <p>Any other relevant information about this work role</p>
          </div>
          <div className="section-content">
            <div className="form-group">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                placeholder="Any additional information, special requirements, or comments about this work role..."
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={handleCancel} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Work Role' : 'Create Work Role')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default WorkRoleForm;

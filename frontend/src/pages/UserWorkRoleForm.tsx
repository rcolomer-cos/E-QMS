import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  assignWorkRole,
  updateAssignment,
  getAssignmentById,
  UserWorkRole,
} from '../services/userWorkRoleService';
import { getUsers } from '../services/userService';
import { getWorkRoles } from '../services/workRoleService';
import { getSkillLevels } from '../services/skillLevelService';
import { getCurrentUser } from '../services/authService';
import { useToast } from '../contexts/ToastContext';
import '../styles/UserWorkRoleForm.css';

function UserWorkRoleForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [workRoles, setWorkRoles] = useState<any[]>([]);
  const [skillLevels, setSkillLevels] = useState<any[]>([]);
  const [tenureInfo, setTenureInfo] = useState<{ years: number; months: number; days: number } | null>(null);

  const [formData, setFormData] = useState<Partial<UserWorkRole>>({
    userId: undefined,
    workRoleId: undefined,
    skillLevelId: undefined,
    assignedDate: new Date().toISOString().split('T')[0],
    effectiveDate: new Date().toISOString().split('T')[0],
    expiryDate: undefined,
    status: 'active',
    verified: false,
    verifiedBy: undefined,
    verifiedAt: undefined,
    verificationNotes: '',
    notes: '',
    trainingRequired: false,
    trainingCompleted: false,
    trainingCompletedDate: undefined,
    certificationRequired: false,
    certificationId: undefined,
    lastAssessmentDate: undefined,
    lastAssessmentScore: undefined,
    lastAssessedBy: undefined,
    nextAssessmentDate: undefined,
    assignedBy: 0,
    active: true,
  });

  useEffect(() => {
    checkPermissions();
    loadUsers();
    loadWorkRoles();
    loadSkillLevels();
    if (isEditMode) {
      loadAssignment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const checkPermissions = () => {
    const user = getCurrentUser();
    if (user && !hasRole(user, ['superuser', 'manager'])) {
      toast.error('You do not have permission to manage work role assignments');
      navigate('/user-work-roles');
    }
  };

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

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
      setUsers([]);
    }
  };

  const loadWorkRoles = async () => {
    try {
      const data = await getWorkRoles({});
      setWorkRoles(Array.isArray(data) ? data : (data.workRoles || []));
    } catch (error) {
      console.error('Error loading work roles:', error);
      toast.error('Failed to load work roles');
      setWorkRoles([]);
    }
  };

  const loadSkillLevels = async () => {
    try {
      const data = await getSkillLevels();
      setSkillLevels(Array.isArray(data) ? data : data.skillLevels || []);
    } catch (error) {
      console.error('Error loading skill levels:', error);
      toast.error('Failed to load skill levels');
      setSkillLevels([]);
    }
  };

  const loadAssignment = async () => {
    try {
      setLoading(true);
      const data = await getAssignmentById(parseInt(id!));
      setFormData({
        userId: data.userId,
        workRoleId: data.workRoleId,
        skillLevelId: data.skillLevelId,
        assignedDate: data.assignedDate ? new Date(data.assignedDate).toISOString().split('T')[0] : '',
        effectiveDate: data.effectiveDate ? new Date(data.effectiveDate).toISOString().split('T')[0] : '',
        expiryDate: data.expiryDate ? new Date(data.expiryDate).toISOString().split('T')[0] : undefined,
        status: data.status,
        verified: data.verified,
        verifiedBy: data.verifiedBy,
        verifiedAt: data.verifiedAt ? new Date(data.verifiedAt).toISOString().split('T')[0] : undefined,
        verificationNotes: data.verificationNotes || '',
        notes: data.notes || '',
        trainingRequired: data.trainingRequired,
        trainingCompleted: data.trainingCompleted,
        trainingCompletedDate: data.trainingCompletedDate ? new Date(data.trainingCompletedDate).toISOString().split('T')[0] : undefined,
        certificationRequired: data.certificationRequired,
        certificationId: data.certificationId,
        lastAssessmentDate: data.lastAssessmentDate ? new Date(data.lastAssessmentDate).toISOString().split('T')[0] : undefined,
        lastAssessmentScore: data.lastAssessmentScore,
        lastAssessedBy: data.lastAssessedBy,
        nextAssessmentDate: data.nextAssessmentDate ? new Date(data.nextAssessmentDate).toISOString().split('T')[0] : undefined,
        active: data.active,
      });
      // Set tenure information
      if (data.yearsInRole !== undefined && data.monthsInRole !== undefined && data.daysInRole !== undefined) {
        setTenureInfo({
          years: data.yearsInRole,
          months: data.monthsInRole,
          days: data.daysInRole
        });
      }
    } catch (error: any) {
      console.error('Error loading assignment:', error);
      toast.error('Failed to load assignment details');
      navigate('/user-work-roles');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: value ? parseFloat(value) : undefined }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value || undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.userId) {
      toast.error('Please select a user');
      return;
    }

    if (!formData.workRoleId) {
      toast.error('Please select a work role');
      return;
    }

    try {
      setSaving(true);
      const currentUser = getCurrentUser();
      
      if (isEditMode) {
        await updateAssignment(parseInt(id!), formData);
        toast.success('Work role assignment updated successfully');
      } else {
        const dataToSubmit = {
          ...formData,
          assignedBy: currentUser?.id || 0,
        };
        await assignWorkRole(dataToSubmit);
        toast.success('Work role assigned successfully');
      }
      
      navigate('/user-work-roles');
    } catch (error: any) {
      console.error('Error saving assignment:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save assignment';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/user-work-roles');
  };

  if (loading) {
    return (
      <div className="user-work-role-form-page">
        <div className="loading">Loading assignment details...</div>
      </div>
    );
  }

  return (
    <div className="user-work-role-form-page">
      <div className="form-header">
        <button className="btn-back" onClick={handleCancel}>
          ← Back to List
        </button>
        <h1>{isEditMode ? 'Edit Work Role Assignment' : 'Assign Work Role to User'}</h1>
        <p className="subtitle">
          {isEditMode 
            ? 'Update the work role assignment details and skill level' 
            : 'Select a user and assign them a work role with the appropriate skill level'}
        </p>
        {isEditMode && tenureInfo && (
          <div className="tenure-info-box">
            <strong>Time in Role:</strong> 
            {tenureInfo.years > 0 && ` ${tenureInfo.years} ${tenureInfo.years === 1 ? 'year' : 'years'}`}
            {tenureInfo.months % 12 > 0 && ` ${tenureInfo.months % 12} ${tenureInfo.months % 12 === 1 ? 'month' : 'months'}`}
            {tenureInfo.years === 0 && tenureInfo.months === 0 && ` ${tenureInfo.days} ${tenureInfo.days === 1 ? 'day' : 'days'}`}
            <span className="tenure-total"> ({tenureInfo.days} total days)</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="work-role-form">
        {/* Section 1: User and Work Role Selection */}
        <div className="form-section">
          <div className="section-header">
            <h2>Assignment Details</h2>
            <p>Select the user and work role for this assignment</p>
          </div>
          <div className="section-content">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="userId">
                  User <span className="required">*</span>
                </label>
                <select
                  id="userId"
                  name="userId"
                  value={formData.userId || ''}
                  onChange={handleChange}
                  required
                  disabled={isEditMode}
                >
                  <option value="">Select a user...</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.email})
                    </option>
                  ))}
                </select>
                {isEditMode && (
                  <p className="field-hint">User cannot be changed in edit mode</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="workRoleId">
                  Work Role <span className="required">*</span>
                </label>
                <select
                  id="workRoleId"
                  name="workRoleId"
                  value={formData.workRoleId || ''}
                  onChange={handleChange}
                  required
                  disabled={isEditMode}
                >
                  <option value="">Select a work role...</option>
                  {workRoles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.name} ({role.code})
                    </option>
                  ))}
                </select>
                {isEditMode ? (
                  <p className="field-hint">Work role cannot be changed in edit mode</p>
                ) : (
                  <p className="field-hint">
                    Select the work role to assign. 
                    <a href="/work-roles" target="_blank" rel="noopener noreferrer" style={{marginLeft: '5px', color: '#2196f3', textDecoration: 'underline'}}>
                      View all work roles →
                    </a>
                  </p>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="skillLevelId">Skill Level</label>
                <select
                  id="skillLevelId"
                  name="skillLevelId"
                  value={formData.skillLevelId || ''}
                  onChange={handleChange}
                >
                  <option value="">No skill level assigned</option>
                  {skillLevels.map(level => (
                    <option key={level.id} value={level.id}>
                      Level {level.level} - {level.name}
                    </option>
                  ))}
                </select>
                <p className="field-hint">
                  Select the employee's competency level (1-5) for this role. 
                  <a href="/skill-levels" target="_blank" rel="noopener noreferrer" style={{marginLeft: '5px', color: '#2196f3', textDecoration: 'underline'}}>
                    View skill level classifications →
                  </a>
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status || 'active'}
                  onChange={handleChange}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="expired">Expired</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Dates */}
        <div className="form-section">
          <div className="section-header">
            <h2>Assignment Dates</h2>
            <p>Specify when this assignment is effective</p>
          </div>
          <div className="section-content">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="assignedDate">Assigned Date</label>
                <input
                  type="date"
                  id="assignedDate"
                  name="assignedDate"
                  value={formData.assignedDate || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="effectiveDate">Effective Date</label>
                <input
                  type="date"
                  id="effectiveDate"
                  name="effectiveDate"
                  value={formData.effectiveDate || ''}
                  onChange={handleChange}
                />
                <p className="field-hint">When this assignment becomes active</p>
              </div>

              <div className="form-group">
                <label htmlFor="expiryDate">Expiry Date</label>
                <input
                  type="date"
                  id="expiryDate"
                  name="expiryDate"
                  value={formData.expiryDate || ''}
                  onChange={handleChange}
                />
                <p className="field-hint">Leave empty for no expiry</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Verification */}
        <div className="form-section">
          <div className="section-header">
            <h2>Verification</h2>
            <p>Track verification status of this assignment</p>
          </div>
          <div className="section-content">
            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="verified"
                  checked={formData.verified || false}
                  onChange={handleChange}
                />
                <span>This assignment has been verified</span>
              </label>
            </div>

            {formData.verified && (
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="verifiedAt">Verified Date</label>
                  <input
                    type="date"
                    id="verifiedAt"
                    name="verifiedAt"
                    value={formData.verifiedAt || ''}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="verificationNotes">Verification Notes</label>
                  <textarea
                    id="verificationNotes"
                    name="verificationNotes"
                    value={formData.verificationNotes || ''}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Details about the verification process..."
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Training & Certification */}
        <div className="form-section">
          <div className="section-header">
            <h2>Training & Certification</h2>
            <p>Manage training and certification requirements</p>
          </div>
          <div className="section-content">
            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="trainingRequired"
                  checked={formData.trainingRequired || false}
                  onChange={handleChange}
                />
                <span>Training is required for this role</span>
              </label>
            </div>

            {formData.trainingRequired && (
              <div className="form-subsection">
                <div className="checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="trainingCompleted"
                      checked={formData.trainingCompleted || false}
                      onChange={handleChange}
                    />
                    <span>Training has been completed</span>
                  </label>
                </div>

                {formData.trainingCompleted && (
                  <div className="form-group">
                    <label htmlFor="trainingCompletedDate">Training Completed Date</label>
                    <input
                      type="date"
                      id="trainingCompletedDate"
                      name="trainingCompletedDate"
                      value={formData.trainingCompletedDate || ''}
                      onChange={handleChange}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="certificationRequired"
                  checked={formData.certificationRequired || false}
                  onChange={handleChange}
                />
                <span>Certification is required for this role</span>
              </label>
            </div>
          </div>
        </div>

        {/* Section 5: Assessment */}
        <div className="form-section">
          <div className="section-header">
            <h2>Assessment Information</h2>
            <p>Track competency assessments for this assignment</p>
          </div>
          <div className="section-content">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="lastAssessmentDate">Last Assessment Date</label>
                <input
                  type="date"
                  id="lastAssessmentDate"
                  name="lastAssessmentDate"
                  value={formData.lastAssessmentDate || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastAssessmentScore">Assessment Score</label>
                <input
                  type="number"
                  id="lastAssessmentScore"
                  name="lastAssessmentScore"
                  value={formData.lastAssessmentScore || ''}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="0-100"
                />
                <p className="field-hint">Score from last competency assessment</p>
              </div>

              <div className="form-group">
                <label htmlFor="nextAssessmentDate">Next Assessment Date</label>
                <input
                  type="date"
                  id="nextAssessmentDate"
                  name="nextAssessmentDate"
                  value={formData.nextAssessmentDate || ''}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 6: Additional Notes */}
        <div className="form-section">
          <div className="section-header">
            <h2>Additional Notes</h2>
            <p>Any additional information about this assignment</p>
          </div>
          <div className="section-content">
            <div className="form-group full-width">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes || ''}
                onChange={handleChange}
                rows={4}
                placeholder="Additional comments, requirements, or observations..."
              />
            </div>

            {isEditMode && (
              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="active"
                    checked={formData.active !== false}
                    onChange={handleChange}
                  />
                  <span>Assignment is active</span>
                </label>
                <p className="field-hint">Uncheck to deactivate this assignment</p>
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleCancel}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? 'Saving...' : (isEditMode ? 'Update Assignment' : 'Assign Work Role')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default UserWorkRoleForm;

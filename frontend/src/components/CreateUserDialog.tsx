import { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { createUser, generatePassword, getRoles, Role, CreateUserData } from '../services/userService';
import { getGroups, Group } from '../services/groupService';
import '../styles/CreateUserDialog.css';

interface CreateUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: () => void;
}

interface CredentialsDisplay {
  email: string;
  password: string;
}

const CreateUserDialog = ({ isOpen, onClose, onUserCreated }: CreateUserDialogProps) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [credentials, setCredentials] = useState<CredentialsDisplay | null>(null);

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState<number | ''>('');
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      loadRolesAndGroups();
    }
  }, [isOpen]);

  const loadRolesAndGroups = async () => {
    try {
      const [rolesData, groupsData] = await Promise.all([
        getRoles(),
        getGroups(false, false),
      ]);
      setRoles(rolesData.filter(r => r.active));
      setGroups(groupsData.filter(g => g.active));
    } catch (error: any) {
      console.error('Failed to load roles and groups:', error);
      toast.error('Failed to load roles and groups');
    }
  };

  const handleGeneratePassword = async () => {
    try {
      const generatedPassword = await generatePassword();
      setPassword(generatedPassword);
      toast.success('Password generated successfully');
    } catch (error: any) {
      console.error('Failed to generate password:', error);
      toast.error('Failed to generate password');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (!selectedRoleId) {
      newErrors.role = 'Role is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const userData: CreateUserData = {
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        department: department.trim() || undefined,
        phone: phone.trim() || undefined,
        roleIds: [selectedRoleId as number],
        groupIds: selectedGroupIds.length > 0 ? selectedGroupIds : undefined,
      };

      const response = await createUser(userData);

      // Show credentials dialog
      setCredentials({
        email: response.email,
        password: response.password,
      });

      // Reset form
      resetForm();

      // Notify parent
      onUserCreated();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to create user';
      toast.error(errorMsg);
      
      if (errorMsg.includes('already exists')) {
        setErrors({ email: 'This email is already in use' });
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setDepartment('');
    setPassword('');
    setSelectedRoleId('');
    setSelectedGroupIds([]);
    setErrors({});
  };

  const handleClose = () => {
    if (!credentials) {
      resetForm();
    }
    onClose();
  };

  const handleCloseCredentials = () => {
    setCredentials(null);
    handleClose();
  };

  const handleCopyCredentials = () => {
    if (credentials) {
      const text = `Username: ${credentials.email}\nPassword: ${credentials.password}`;
      navigator.clipboard.writeText(text);
      toast.success('Credentials copied to clipboard');
    }
  };

  const handleGroupToggle = (groupId: number) => {
    setSelectedGroupIds(prev => 
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  if (!isOpen) return null;

  // Show credentials dialog if user was just created
  if (credentials) {
    return (
      <div className="modal-overlay" onClick={handleCloseCredentials}>
        <div className="modal-content credentials-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>User Created Successfully</h2>
          </div>
          <div className="modal-body">
            <div className="credentials-warning">
              <strong>⚠️ Important:</strong> This is the only time you will see this password. 
              Make sure to copy it now.
            </div>
            <div className="credentials-display">
              <div className="credential-field">
                <label>Username (Email):</label>
                <div className="credential-value">{credentials.email}</div>
              </div>
              <div className="credential-field">
                <label>Temporary Password:</label>
                <div className="credential-value password-value">{credentials.password}</div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn-secondary"
              onClick={handleCopyCredentials}
            >
              📋 Copy Credentials
            </button>
            <button 
              type="button" 
              className="btn-primary"
              onClick={handleCloseCredentials}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content create-user-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New User</h2>
          <button className="close-button" onClick={handleClose}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-section">
              <h3>User Information</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">
                    First Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={errors.firstName ? 'error' : ''}
                    disabled={loading}
                  />
                  {errors.firstName && <span className="error-message">{errors.firstName}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="lastName">
                    Last Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={errors.lastName ? 'error' : ''}
                    disabled={loading}
                  />
                  {errors.lastName && <span className="error-message">{errors.lastName}</span>}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">
                  Email (Username) <span className="required">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={errors.email ? 'error' : ''}
                  disabled={loading}
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">Phone (Optional)</label>
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="department">Department (Optional)</label>
                  <input
                    type="text"
                    id="department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Access Controls</h3>
              
              <div className="form-group">
                <label htmlFor="role">
                  Application Role <span className="required">*</span>
                </label>
                <select
                  id="role"
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value ? Number(e.target.value) : '')}
                  className={errors.role ? 'error' : ''}
                  disabled={loading}
                >
                  <option value="">-- Select a role --</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                      {role.description && ` - ${role.description}`}
                    </option>
                  ))}
                </select>
                {errors.role && <span className="error-message">{errors.role}</span>}
              </div>

              <div className="form-group">
                <label>User Groups (Optional)</label>
                <div className="groups-selection">
                  {groups.length === 0 ? (
                    <p className="no-groups">No groups available</p>
                  ) : (
                    groups.map((group) => (
                      <label key={group.id} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={selectedGroupIds.includes(group.id!)}
                          onChange={() => handleGroupToggle(group.id!)}
                          disabled={loading}
                        />
                        <span>{group.name}</span>
                        {group.description && <span className="group-description"> - {group.description}</span>}
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Password Generation</h3>
              
              <div className="form-group">
                <label htmlFor="password">
                  Password <span className="required">*</span>
                </label>
                <div className="password-input-group">
                  <input
                    type="text"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={errors.password ? 'error' : ''}
                    disabled={loading}
                    placeholder="Enter or generate a password"
                  />
                  <button
                    type="button"
                    className="btn-generate"
                    onClick={handleGeneratePassword}
                    disabled={loading}
                  >
                    🎲 Generate
                  </button>
                </div>
                {errors.password && <span className="error-message">{errors.password}</span>}
                <small className="form-hint">
                  Password must be at least 8 characters. Click "Generate" for a secure, memorable password.
                </small>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button 
              type="button" 
              className="btn-secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserDialog;

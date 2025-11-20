import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { createUser, generatePassword, getRoles, Role, CreateUserData } from '../services/userService';
import { getGroups, Group } from '../services/groupService';
import '../styles/CreateUserPage.css';

interface CredentialsDisplay {
  email: string;
  password: string;
}

const CreateUserPage = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
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

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadRolesAndGroups();
  }, []);

  const loadRolesAndGroups = async () => {
    try {
      setRolesLoading(true);
      console.log('Loading roles and groups...');
      
      // Load roles and groups separately to handle authorization errors independently
      let rolesData: Role[] = [];
      let groupsData: Group[] = [];
      
      try {
        rolesData = await getRoles();
        console.log('Roles received:', rolesData);
      } catch (error: any) {
        console.error('Failed to load roles:', error);
        toast.error('Failed to load roles');
      }
      
      try {
        groupsData = await getGroups(false, false);
        console.log('Groups received:', groupsData);
      } catch (error: any) {
        // Groups might not be accessible to all users, don't show error
        console.warn('Groups not accessible or failed to load:', error.response?.status);
      }
      
      // Backend already filters for active roles; sort by level descending (highest level first)
      const sortedRoles = [...rolesData].sort((a,b) => b.level - a.level);
      console.log('Sorted roles:', sortedRoles);
      setRoles(sortedRoles);
      setGroups(groupsData.filter(g => g.active));
    } catch (error: any) {
      console.error('Unexpected error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setRolesLoading(false);
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
    if (!firstName.trim()) newErrors.firstName = 'First name is required';
    if (!lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email format';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (!selectedRoleId) newErrors.role = 'Role is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

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
      setCredentials({ email: response.email, password: response.password });
      toast.success('User created successfully');
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

  const handleGroupToggle = (groupId: number) => {
    setSelectedGroupIds(prev => prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]);
  };

  const handleDone = () => {
    navigate('/settings?tab=users');
  };

  return (
    <div className="create-user-page">
      <div className="page-header">
        <div className="header-block">
          <h1>Create New User</h1>
          <p className="subtitle">Add a new system user, assign role and optional groups.</p>
        </div>
        <button type="button" className="btn-secondary" onClick={() => navigate('/settings?tab=users')}>Back to Users</button>
      </div>

      {credentials ? (
        <div className="credentials-panel">
          <h2>User Created</h2>
          <div className="warning-box"><strong>Important:</strong> Copy this temporary password now.</div>
          <div className="credentials-grid">
            <div className="field"><label>Username (Email)</label><div className="value">{credentials.email}</div></div>
            <div className="field"><label>Temporary Password</label><div className="value password">{credentials.password}</div></div>
          </div>
          <div className="actions-row">
            <button className="btn-secondary" onClick={() => {
              navigator.clipboard.writeText(`Username: ${credentials.email}\nPassword: ${credentials.password}`);
              toast.success('Copied to clipboard');
            }}>Copy Credentials</button>
            <button className="btn-primary" onClick={handleDone}>Done</button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="user-form card">
          <h2 className="section-title">User Details</h2>
          <div className="grid">
            <div className="form-group">
              <label htmlFor="firstName">First Name <span className="required">*</span></label>
              <input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} disabled={loading} className={errors.firstName ? 'error' : ''} />
              {errors.firstName && <span className="error-message">{errors.firstName}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name <span className="required">*</span></label>
              <input id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} disabled={loading} className={errors.lastName ? 'error' : ''} />
              {errors.lastName && <span className="error-message">{errors.lastName}</span>}
            </div>
            <div className="form-group full">
              <label htmlFor="email">Email <span className="required">*</span></label>
              <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} className={errors.email ? 'error' : ''} />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input id="phone" value={phone} onChange={e => setPhone(e.target.value)} disabled={loading} placeholder="Optional" />
            </div>
            <div className="form-group">
              <label htmlFor="department">Department</label>
              <input id="department" value={department} onChange={e => setDepartment(e.target.value)} disabled={loading} placeholder="Optional" />
            </div>
            <div className="form-group">
              <label htmlFor="role">Application Role <span className="required">*</span></label>
              <select
                id="role"
                value={selectedRoleId}
                onChange={e => setSelectedRoleId(e.target.value ? Number(e.target.value) : '')}
                disabled={loading || rolesLoading || roles.length === 0}
                className={errors.role ? 'error' : ''}
              >
                <option value="">{rolesLoading ? 'Loading roles...' : roles.length === 0 ? 'No roles available' : '-- Select Role --'}</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.name.charAt(0).toUpperCase() + role.name.slice(1)}{role.description ? ` – ${role.description}` : ''}
                  </option>
                ))}
              </select>
              {errors.role && <span className="error-message">{errors.role}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="password">Temporary Password <span className="required">*</span></label>
              <div className="password-row">
                <input id="password" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} className={errors.password ? 'error' : ''} placeholder="Minimum 8 characters" />
                <button type="button" className="btn-generate" onClick={handleGeneratePassword} disabled={loading}>Generate</button>
              </div>
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>
            {groups.length > 0 && (
              <div className="form-group full">
                <label>User Groups (Optional)</label>
                <div className="groups-grid">
                  {groups.map(group => (
                    <label key={group.id} className="group-chip">
                      <input type="checkbox" checked={selectedGroupIds.includes(group.id!)} onChange={() => handleGroupToggle(group.id!)} disabled={loading} />
                      <span>{group.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="actions-row">
            <button type="button" className="btn-secondary" onClick={() => navigate('/settings?tab=users')} disabled={loading}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create User'}</button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CreateUserPage;

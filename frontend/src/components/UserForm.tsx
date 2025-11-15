import { useState, useEffect } from 'react';
import { User, CreateUserData, UpdateUserData } from '../services/userService';

interface UserFormProps {
  user?: User | null;
  onSubmit: (data: CreateUserData | UpdateUserData) => Promise<void>;
  onCancel: () => void;
}

function UserForm({ user, onSubmit, onCancel }: UserFormProps) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user',
    firstName: '',
    lastName: '',
    department: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        password: '',
        role: user.role,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        department: user.department || '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (user) {
        // Update existing user (exclude username and password)
        const updateData: UpdateUserData = {
          email: formData.email,
          role: formData.role,
          firstName: formData.firstName || undefined,
          lastName: formData.lastName || undefined,
          department: formData.department || undefined,
        };
        await onSubmit(updateData);
      } else {
        // Create new user
        const createData: CreateUserData = {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          firstName: formData.firstName || undefined,
          lastName: formData.lastName || undefined,
          department: formData.department || undefined,
        };
        await onSubmit(createData);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-form-overlay">
      <div className="user-form-modal">
        <h2>{user ? 'Edit User' : 'Create New User'}</h2>
        
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username *</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              disabled={!!user}
              minLength={3}
              maxLength={50}
            />
            {user && <small>Username cannot be changed</small>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          {!user && (
            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
              />
              <small>Min 8 characters, must include uppercase, lowercase, and number</small>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="role">Role *</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="viewer">Viewer</option>
              <option value="user">User</option>
              <option value="auditor">Auditor</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="firstName">First Name</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label htmlFor="lastName">Last Name</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label htmlFor="department">Department</label>
            <input
              type="text"
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              maxLength={100}
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel} disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading}>
              {loading ? 'Saving...' : user ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserForm;

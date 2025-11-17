import { Outlet, Link, useNavigate } from 'react-router-dom';
import { logout, getCurrentUser } from '../services/authService';
import '../styles/Layout.css';

function Layout() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>E-QMS</h1>
        </div>
        <ul className="navbar-menu">
          <li><Link to="/">Dashboard</Link></li>
          <li><Link to="/documents">Documents</Link></li>
          <li><Link to="/pending-changes">Pending Changes</Link></li>
          <li><Link to="/audits">Audits</Link></li>
          <li><Link to="/ncr">NCR</Link></li>
          <li><Link to="/capa">CAPA</Link></li>
          <li><Link to="/equipment">Equipment</Link></li>
          <li><Link to="/training">Training</Link></li>
          <li><Link to="/training-matrix">Training Matrix</Link></li>
          {user?.role === 'admin' && (
            <>
              <li><Link to="/departments">Departments</Link></li>
              <li><Link to="/processes">Processes</Link></li>
              <li><Link to="/users">Users</Link></li>
              <li><Link to="/audit-logs">Audit Logs</Link></li>
            </>
          )}
          {user?.role === 'manager' && (
            <li><Link to="/audit-logs">Audit Logs</Link></li>
          )}
        </ul>
        <div className="navbar-user">
          <span>{user?.username} ({user?.role})</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;

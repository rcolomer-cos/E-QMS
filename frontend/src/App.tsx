import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import DocumentView from './pages/DocumentView';
import Audits from './pages/Audits';
import NCR from './pages/NCR';
import CAPA from './pages/CAPA';
import Equipment from './pages/Equipment';
import Training from './pages/Training';
import Users from './pages/Users';
import Departments from './pages/Departments';
import Processes from './pages/Processes';
import { useAuth } from './services/authService';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          isAuthenticated ? <Layout /> : <Navigate to="/login" replace />
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="documents" element={<Documents />} />
        <Route path="documents/:id" element={<DocumentView />} />
        <Route path="audits" element={<Audits />} />
        <Route path="ncr" element={<NCR />} />
        <Route path="capa" element={<CAPA />} />
        <Route path="equipment" element={<Equipment />} />
        <Route path="training" element={<Training />} />
        <Route path="users" element={<Users />} />
        <Route path="departments" element={<Departments />} />
        <Route path="processes" element={<Processes />} />
      </Route>
    </Routes>
  );
}

export default App;

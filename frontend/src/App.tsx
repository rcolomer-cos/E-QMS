import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Setup from './pages/Setup';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import DocumentView from './pages/DocumentView';
import PendingChanges from './pages/PendingChanges';
import Audits from './pages/Audits';
import NCR from './pages/NCR';
import NCRDetail from './pages/NCRDetail';
import CAPA from './pages/CAPA';
import Equipment from './pages/Equipment';
import EquipmentReadOnly from './pages/EquipmentReadOnly';
import Training from './pages/Training';
import Users from './pages/Users';
import Departments from './pages/Departments';
import Processes from './pages/Processes';
import CalibrationRecords from './pages/CalibrationRecords';
import CalibrationRecordDetail from './pages/CalibrationRecordDetail';
import InspectionRecords from './pages/InspectionRecords';
import InspectionRecordDetail from './pages/InspectionRecordDetail';
import ServiceRecords from './pages/ServiceRecords';
import ServiceRecordDetail from './pages/ServiceRecordDetail';
import { useAuth } from './services/authService';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/setup" element={<Setup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/equipment/view/:equipmentNumber" element={<EquipmentReadOnly />} />
      
      {/* Protected routes */}
      <Route
        path="/"
        element={
          isAuthenticated ? <Layout /> : <Navigate to="/login" replace />
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="documents" element={<Documents />} />
        <Route path="documents/:id" element={<DocumentView />} />
        <Route path="pending-changes" element={<PendingChanges />} />
        <Route path="audits" element={<Audits />} />
        <Route path="ncr" element={<NCR />} />
        <Route path="ncr/:id" element={<NCRDetail />} />
        <Route path="capa" element={<CAPA />} />
        <Route path="equipment" element={<Equipment />} />
        <Route path="training" element={<Training />} />
        <Route path="users" element={<Users />} />
        <Route path="departments" element={<Departments />} />
        <Route path="processes" element={<Processes />} />
        <Route path="calibration-records" element={<CalibrationRecords />} />
        <Route path="calibration-records/:id" element={<CalibrationRecordDetail />} />
        <Route path="inspection-records" element={<InspectionRecords />} />
        <Route path="inspection-records/:id" element={<InspectionRecordDetail />} />
        <Route path="service-records" element={<ServiceRecords />} />
        <Route path="service-records/:id" element={<ServiceRecordDetail />} />
      </Route>
    </Routes>
  );
}

export default App;

import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Setup from './pages/Setup';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import DocumentView from './pages/DocumentView';
import PendingChanges from './pages/PendingChanges';
import Audits from './pages/Audits';
import AuditExecution from './pages/AuditExecution';
import AuditFindings from './pages/AuditFindings';
import NCR from './pages/NCR';
import NCRDetail from './pages/NCRDetail';
import CAPA from './pages/CAPA';
import CAPADetail from './pages/CAPADetail';
import CAPADashboard from './pages/CAPADashboard';
import Equipment from './pages/Equipment';
import EquipmentReadOnly from './pages/EquipmentReadOnly';
import Training from './pages/Training';
import TrainingMatrix from './pages/TrainingMatrix';
import RoleTrainingRequirements from './pages/RoleTrainingRequirements';
import Users from './pages/Users';
import Departments from './pages/Departments';
import Processes from './pages/Processes';
import CalibrationRecords from './pages/CalibrationRecords';
import CalibrationRecordDetail from './pages/CalibrationRecordDetail';
import InspectionRecords from './pages/InspectionRecords';
import InspectionRecordDetail from './pages/InspectionRecordDetail';
import ServiceRecords from './pages/ServiceRecords';
import ServiceRecordDetail from './pages/ServiceRecordDetail';
import AuditLogs from './pages/AuditLogs';
import ExternalAuditSupport from './pages/ExternalAuditSupport';
import Risks from './pages/Risks';
import RiskDetail from './pages/RiskDetail';
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
        <Route path="audits/:id/execute" element={<AuditExecution />} />
        <Route path="audits/:auditId/findings" element={<AuditFindings />} />
        <Route path="ncr" element={<NCR />} />
        <Route path="ncr/:id" element={<NCRDetail />} />
        <Route path="capa" element={<CAPA />} />
        <Route path="capa/dashboard" element={<CAPADashboard />} />
        <Route path="capa/:id" element={<CAPADetail />} />
        <Route path="equipment" element={<Equipment />} />
        <Route path="training" element={<Training />} />
        <Route path="training-matrix" element={<TrainingMatrix />} />
        <Route path="role-training-requirements" element={<RoleTrainingRequirements />} />
        <Route path="users" element={<Users />} />
        <Route path="departments" element={<Departments />} />
        <Route path="processes" element={<Processes />} />
        <Route path="calibration-records" element={<CalibrationRecords />} />
        <Route path="calibration-records/:id" element={<CalibrationRecordDetail />} />
        <Route path="inspection-records" element={<InspectionRecords />} />
        <Route path="inspection-records/:id" element={<InspectionRecordDetail />} />
        <Route path="service-records" element={<ServiceRecords />} />
        <Route path="service-records/:id" element={<ServiceRecordDetail />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="external-audit-support" element={<ExternalAuditSupport />} />
        <Route path="risks" element={<Risks />} />
        <Route path="risks/:id" element={<RiskDetail />} />
      </Route>
    </Routes>
  );
}

export default App;

import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedModuleRoute from './components/ProtectedModuleRoute';
import Login from './pages/Login';
import Setup from './pages/Setup';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import DocumentView from './pages/DocumentView';
import DocumentEditor from './pages/DocumentEditor';
import PendingChanges from './pages/PendingChanges';
import Audits from './pages/Audits';
import ScheduleAudit from './pages/ScheduleAudit';
import EditAudit from './pages/EditAudit';
import AuditDetail from './pages/AuditDetail';
import AuditExecution from './pages/AuditExecution';
import AuditFindings from './pages/AuditFindings';
import NCR from './pages/NCR';
import NCRDetail from './pages/NCRDetail';
import NCRDashboard from './pages/NCRDashboard';
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
import ProcessOverview from './pages/ProcessOverview';
import ProcessDetail from './pages/ProcessDetail';
import Settings from './pages/Settings';
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
import RiskBoard from './pages/RiskBoard';
import SupplierPerformanceDashboard from './pages/SupplierPerformanceDashboard';
import ApprovedSupplierList from './pages/ApprovedSupplierList';
import InspectionSchedule from './pages/InspectionSchedule';
import InspectionPlanning from './pages/InspectionPlanning';
import MobileInspectionForm from './pages/MobileInspectionForm';
import ChartDemo from './pages/ChartDemo';
import ImprovementIdeas from './pages/ImprovementIdeas';
import ImprovementIdeaDetail from './pages/ImprovementIdeaDetail';
import ImprovementStatusDashboard from './pages/ImprovementStatusDashboard';
import SystemSettings from './pages/SystemSettings';
import GroupManagement from './pages/GroupManagement';
import GroupDetail from './pages/GroupDetail';
import OrganizationalChart from './pages/OrganizationalChart';
import Tags from './pages/Tags';
import SwotAnalysis from './pages/SwotAnalysis';
import DataImport from './pages/DataImport';
import { useAuth } from './services/authService';
import CreateUserPage from './pages/CreateUserPage';

function App() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

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
          isAuthenticated ? <Layout /> : <Navigate to="/login" replace state={{ from: location }} />
        }
      >
        <Route index element={<LandingPage />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="documents" element={<ProtectedModuleRoute moduleKey="documents"><Documents /></ProtectedModuleRoute>} />
        <Route path="documents/:id" element={<ProtectedModuleRoute moduleKey="documents"><DocumentView /></ProtectedModuleRoute>} />
        <Route path="documents/:id/edit" element={<ProtectedModuleRoute moduleKey="documents"><DocumentEditor /></ProtectedModuleRoute>} />
        <Route path="tags" element={<Tags />} />
        <Route path="pending-changes" element={<PendingChanges />} />
        <Route path="audits" element={<ProtectedModuleRoute moduleKey="audits"><Audits /></ProtectedModuleRoute>} />
        <Route path="audits/:id" element={<ProtectedModuleRoute moduleKey="audits"><AuditDetail /></ProtectedModuleRoute>} />
        <Route path="audits/schedule" element={<ProtectedModuleRoute moduleKey="audits"><ScheduleAudit /></ProtectedModuleRoute>} />
        <Route path="audits/:id/edit" element={<ProtectedModuleRoute moduleKey="audits"><EditAudit /></ProtectedModuleRoute>} />
        <Route path="audits/:id/execute" element={<ProtectedModuleRoute moduleKey="audits"><AuditExecution /></ProtectedModuleRoute>} />
        <Route path="audits/:auditId/findings" element={<ProtectedModuleRoute moduleKey="audits"><AuditFindings /></ProtectedModuleRoute>} />
        {/* Swedish route aliases */}
        <Route path="revisioner" element={<ProtectedModuleRoute moduleKey="audits"><Audits /></ProtectedModuleRoute>} />
        <Route path="revisioner/:id" element={<ProtectedModuleRoute moduleKey="audits"><AuditDetail /></ProtectedModuleRoute>} />
        <Route path="revisioner/:id/utfor" element={<ProtectedModuleRoute moduleKey="audits"><AuditExecution /></ProtectedModuleRoute>} />
        <Route path="revisioner/:auditId/observationer" element={<ProtectedModuleRoute moduleKey="audits"><AuditFindings /></ProtectedModuleRoute>} />
        <Route path="ncr" element={<ProtectedModuleRoute moduleKey="ncr"><NCR /></ProtectedModuleRoute>} />
        <Route path="ncr/dashboard" element={<ProtectedModuleRoute moduleKey="ncr"><NCRDashboard /></ProtectedModuleRoute>} />
        <Route path="ncr/:id" element={<ProtectedModuleRoute moduleKey="ncr"><NCRDetail /></ProtectedModuleRoute>} />
        <Route path="capa" element={<ProtectedModuleRoute moduleKey="capa"><CAPA /></ProtectedModuleRoute>} />
        <Route path="capa/dashboard" element={<ProtectedModuleRoute moduleKey="capa"><CAPADashboard /></ProtectedModuleRoute>} />
        <Route path="capa/:id" element={<ProtectedModuleRoute moduleKey="capa"><CAPADetail /></ProtectedModuleRoute>} />
        <Route path="equipment" element={<ProtectedModuleRoute moduleKey="equipment"><Equipment /></ProtectedModuleRoute>} />
        <Route path="training" element={<ProtectedModuleRoute moduleKey="training"><Training /></ProtectedModuleRoute>} />
        <Route path="training-matrix" element={<ProtectedModuleRoute moduleKey="training"><TrainingMatrix /></ProtectedModuleRoute>} />
        <Route path="role-training-requirements" element={<ProtectedModuleRoute moduleKey="training"><RoleTrainingRequirements /></ProtectedModuleRoute>} />
        <Route path="groups/:id" element={<GroupDetail />} />
        <Route path="departments" element={<Departments />} />
        <Route path="users/create" element={<CreateUserPage />} />
        
        {/* Redirects for old routes to settings tabs */}
        <Route path="users" element={<Navigate to="/settings?tab=users" replace />} />
        <Route path="groups" element={<Navigate to="/settings?tab=groups" replace />} />
        <Route path="organizational-chart" element={<OrganizationalChart />} />
        <Route path="processes" element={<ProtectedModuleRoute moduleKey="processes"><Processes /></ProtectedModuleRoute>} />
        <Route path="processes/overview" element={<ProtectedModuleRoute moduleKey="processes"><ProcessOverview /></ProtectedModuleRoute>} />
        <Route path="processes/:id/detail" element={<ProtectedModuleRoute moduleKey="processes"><ProcessDetail /></ProtectedModuleRoute>} />
        <Route path="calibration-records" element={<ProtectedModuleRoute moduleKey="equipment"><CalibrationRecords /></ProtectedModuleRoute>} />
        <Route path="calibration-records/:id" element={<ProtectedModuleRoute moduleKey="equipment"><CalibrationRecordDetail /></ProtectedModuleRoute>} />
        <Route path="inspection-records" element={<ProtectedModuleRoute moduleKey="inspection"><InspectionRecords /></ProtectedModuleRoute>} />
        <Route path="inspection-records/:id" element={<ProtectedModuleRoute moduleKey="inspection"><InspectionRecordDetail /></ProtectedModuleRoute>} />
        <Route path="inspection-mobile" element={<ProtectedModuleRoute moduleKey="inspection"><MobileInspectionForm /></ProtectedModuleRoute>} />
        <Route path="inspection-mobile/:id" element={<ProtectedModuleRoute moduleKey="inspection"><MobileInspectionForm /></ProtectedModuleRoute>} />
        <Route path="inspection-schedule" element={<ProtectedModuleRoute moduleKey="inspection"><InspectionSchedule /></ProtectedModuleRoute>} />
        <Route path="inspection-planning" element={<ProtectedModuleRoute moduleKey="inspection"><InspectionPlanning /></ProtectedModuleRoute>} />
        <Route path="service-records" element={<ProtectedModuleRoute moduleKey="equipment"><ServiceRecords /></ProtectedModuleRoute>} />
        <Route path="service-records/:id" element={<ProtectedModuleRoute moduleKey="equipment"><ServiceRecordDetail /></ProtectedModuleRoute>} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="external-audit-support" element={<ProtectedModuleRoute moduleKey="audits"><ExternalAuditSupport /></ProtectedModuleRoute>} />
        <Route path="risks" element={<ProtectedModuleRoute moduleKey="risks"><Risks /></ProtectedModuleRoute>} />
        <Route path="risks/board" element={<ProtectedModuleRoute moduleKey="risks"><RiskBoard /></ProtectedModuleRoute>} />
        <Route path="risks/:id" element={<ProtectedModuleRoute moduleKey="risks"><RiskDetail /></ProtectedModuleRoute>} />
        <Route path="swot-analysis" element={<ProtectedModuleRoute moduleKey="improvements"><SwotAnalysis /></ProtectedModuleRoute>} />
        <Route path="supplier-performance" element={<SupplierPerformanceDashboard />} />
        <Route path="approved-supplier-list" element={<ApprovedSupplierList />} />
        <Route path="improvement-ideas" element={<ProtectedModuleRoute moduleKey="improvements"><ImprovementIdeas /></ProtectedModuleRoute>} />
        <Route path="improvement-ideas/dashboard" element={<ProtectedModuleRoute moduleKey="improvements"><ImprovementStatusDashboard /></ProtectedModuleRoute>} />
        <Route path="improvement-ideas/:id" element={<ProtectedModuleRoute moduleKey="improvements"><ImprovementIdeaDetail /></ProtectedModuleRoute>} />
        <Route path="settings" element={<Settings />} />
        <Route path="system-settings" element={<SystemSettings />} />
        <Route path="chart-demo" element={<ChartDemo />} />
        
        {/* Redirects for old routes to new tabbed system-settings */}
        <Route path="company-branding" element={<Navigate to="/system-settings?tab=branding" replace />} />
        <Route path="email-templates" element={<Navigate to="/system-settings?tab=email" replace />} />
        <Route path="api-keys" element={<Navigate to="/system-settings?tab=api-keys" replace />} />
        <Route path="backup-management" element={<Navigate to="/system-settings?tab=backup" replace />} />
        <Route path="audit-logs" element={<Navigate to="/system-settings?tab=audit" replace />} />
        <Route path="data-import" element={<Navigate to="/system-settings?tab=import" replace />} />
      </Route>
    </Routes>
  );
}

export default App;

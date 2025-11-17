import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';

// Import routes
import authRoutes from './routes/authRoutes';
import systemRoutes from './routes/systemRoutes';
import userRoutes from './routes/userRoutes';
import roleRoutes from './routes/roleRoutes';
import documentRoutes from './routes/documentRoutes';
import auditRoutes from './routes/auditRoutes';
import auditFindingRoutes from './routes/auditFindingRoutes';
import equipmentRoutes from './routes/equipmentRoutes';
import departmentRoutes from './routes/departmentRoutes';
import processRoutes from './routes/processRoutes';
import notificationRoutes from './routes/notificationRoutes';
import ncrRoutes from './routes/ncrRoutes';
import capaRoutes from './routes/capaRoutes';
import trainingRoutes from './routes/trainingRoutes';
import competencyRoutes from './routes/competencyRoutes';
import roleTrainingRequirementsRoutes from './routes/roleTrainingRequirementsRoutes';
import calibrationRecordRoutes from './routes/calibrationRecordRoutes';
import inspectionRecordRoutes from './routes/inspectionRecordRoutes';
import serviceMaintenanceRecordRoutes from './routes/serviceMaintenanceRecordRoutes';
import attachmentRoutes from './routes/attachmentRoutes';
import auditLogRoutes from './routes/auditLogRoutes';
import checklistRoutes from './routes/checklistRoutes';
import evidencePackRoutes from './routes/evidencePackRoutes';
import auditorAccessTokenRoutes from './routes/auditorAccessTokenRoutes';
import riskRoutes from './routes/riskRoutes';
import supplierEvaluationRoutes from './routes/supplierEvaluationRoutes';

dotenv.config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Rate limiting middleware
app.use('/api/', apiLimiter);

// Logging middleware
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/system', systemRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/audits', auditRoutes);
app.use('/api/audit-findings', auditFindingRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/processes', processRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ncrs', ncrRoutes);
app.use('/api/capas', capaRoutes);
app.use('/api/trainings', trainingRoutes);
app.use('/api/competencies', competencyRoutes);
app.use('/api/role-training-requirements', roleTrainingRequirementsRoutes);
app.use('/api/calibration-records', calibrationRecordRoutes);
app.use('/api/inspection-records', inspectionRecordRoutes);
app.use('/api/service-maintenance-records', serviceMaintenanceRecordRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/checklists', checklistRoutes);
app.use('/api/evidence-pack', evidencePackRoutes);
app.use('/api/auditor-access-tokens', auditorAccessTokenRoutes);
app.use('/api/risks', riskRoutes);
app.use('/api/supplier-evaluations', supplierEvaluationRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${config.nodeEnv}`);
});

export default app;

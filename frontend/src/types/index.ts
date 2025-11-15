export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  department?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Document {
  id: number;
  title: string;
  description?: string;
  documentType: string;
  category: string;
  version: string;
  status: string;
  fileName?: string;
  createdAt: string;
}

export interface Audit {
  id: number;
  auditNumber: string;
  title: string;
  auditType: string;
  status: string;
  scheduledDate: string;
  leadAuditorId: number;
}

export interface NCR {
  id: number;
  ncrNumber: string;
  title: string;
  status: string;
  severity: string;
  detectedDate: string;
}

export interface CAPA {
  id: number;
  capaNumber: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  targetDate: string;
}

export interface Equipment {
  id: number;
  equipmentNumber: string;
  name: string;
  status: string;
  location: string;
  nextCalibrationDate?: string;
}

export interface Training {
  id: number;
  trainingNumber: string;
  title: string;
  status: string;
  scheduledDate: string;
  category: string;
}

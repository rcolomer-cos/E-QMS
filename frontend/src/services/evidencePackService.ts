import api from './api';

export interface EvidencePackFilters {
  startDate?: string;
  endDate?: string;
  includeDocuments?: boolean;
  includeNCRs?: boolean;
  includeCAPAs?: boolean;
  includeTraining?: boolean;
  includeAudits?: boolean;
  includeAttachments?: boolean;
}

export interface EvidencePackOptions {
  options: Record<string, {
    type: string;
    default?: boolean;
    required?: boolean;
    description: string;
  }>;
}

/**
 * Generate and download an evidence pack PDF
 */
export const generateEvidencePack = async (filters: EvidencePackFilters = {}): Promise<Blob> => {
  const response = await api.post('/evidence-pack/generate', filters, {
    responseType: 'blob',
  });
  return response.data;
};

/**
 * Get available options for evidence pack generation
 */
export const getEvidencePackOptions = async (): Promise<EvidencePackOptions> => {
  const response = await api.get('/evidence-pack/options');
  return response.data;
};

/**
 * Download a blob as a file
 */
export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

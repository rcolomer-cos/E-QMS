import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getEquipment, Equipment } from '../services/equipmentService';
import { createInspectionRecord, updateInspectionRecord, getInspectionRecordById, InspectionRecord } from '../services/inspectionRecordService';
import { uploadAttachment } from '../services/attachmentService';
import { useAuth } from '../services/authService';
import ImageUpload from '../components/ImageUpload';
import '../styles/MobileInspectionForm.css';

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  required: boolean;
  notes?: string;
}

interface SignatureData {
  signature: string;
  timestamp: string;
  name: string;
}

function MobileInspectionForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Online/Offline status
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Form state
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  // Form data
  const [formData, setFormData] = useState<Partial<InspectionRecord>>({
    equipmentId: 0,
    inspectionDate: new Date().toISOString().split('T')[0],
    inspectionType: 'routine',
    result: 'pending',
    status: 'in_progress',
    passed: true,
    safetyCompliant: true,
    operationalCompliant: true,
    followUpRequired: false,
  });

  // Checklist items
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([
    { id: '1', label: 'Visual inspection completed', checked: false, required: true },
    { id: '2', label: 'Safety guards in place', checked: false, required: true },
    { id: '3', label: 'Emergency stops functional', checked: false, required: true },
    { id: '4', label: 'No visible damage or wear', checked: false, required: true },
    { id: '5', label: 'Proper labeling present', checked: false, required: false },
    { id: '6', label: 'Area clean and organized', checked: false, required: false },
  ]);

  // Measurements
  const [measurements, setMeasurements] = useState<{ parameter: string; value: string; unit: string }[]>([
    { parameter: '', value: '', unit: '' }
  ]);

  // Signature
  const [signature, setSignature] = useState<SignatureData | null>(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);

  // Images
  const [inspectionImages, setInspectionImages] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Load equipment on mount
  useEffect(() => {
    loadEquipment();
    loadDraft();
    
    // Setup online/offline listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load existing record if editing
  useEffect(() => {
    if (id) {
      loadRecord();
    }
  }, [id]);

  // Auto-save draft to local storage
  useEffect(() => {
    const timer = setTimeout(() => {
      saveDraft();
    }, 2000); // Auto-save after 2 seconds of inactivity
    
    return () => clearTimeout(timer);
  }, [formData, checklistItems, measurements]);

  const loadEquipment = async () => {
    try {
      const data = await getEquipment();
      setEquipment(data);
    } catch (err: any) {
      console.error('Failed to load equipment:', err);
      // If offline, load from cache if available
      const cached = localStorage.getItem('cached_equipment');
      if (cached) {
        setEquipment(JSON.parse(cached));
      }
    }
  };

  const loadRecord = async () => {
    try {
      setLoading(true);
      const record = await getInspectionRecordById(parseInt(id!));
      setFormData(record);
      
      // Parse checklist if available
      if (record.inspectionChecklist) {
        try {
          const parsed = JSON.parse(record.inspectionChecklist);
          setChecklistItems(parsed);
        } catch (e) {
          console.error('Failed to parse checklist');
        }
      }
      
      // Parse measurements if available
      if (record.measurementsTaken) {
        try {
          const parsed = JSON.parse(record.measurementsTaken);
          setMeasurements(parsed);
        } catch (e) {
          console.error('Failed to parse measurements');
        }
      }
      
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load inspection record');
    } finally {
      setLoading(false);
    }
  };

  const saveDraft = () => {
    const draft = {
      formData,
      checklistItems,
      measurements,
      signature,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('inspection_draft', JSON.stringify(draft));
  };

  const loadDraft = () => {
    const draft = localStorage.getItem('inspection_draft');
    if (draft && !id) { // Only load draft if not editing existing record
      try {
        const parsed = JSON.parse(draft);
        if (parsed.formData) setFormData(parsed.formData);
        if (parsed.checklistItems) setChecklistItems(parsed.checklistItems);
        if (parsed.measurements) setMeasurements(parsed.measurements);
        if (parsed.signature) setSignature(parsed.signature);
      } catch (e) {
        console.error('Failed to load draft');
      }
    }
  };

  const clearDraft = () => {
    localStorage.removeItem('inspection_draft');
  };

  const handleInputChange = (field: keyof InspectionRecord, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleChecklistChange = (id: string, checked: boolean) => {
    setChecklistItems(items =>
      items.map(item => item.id === id ? { ...item, checked } : item)
    );
  };

  const handleChecklistNoteChange = (id: string, notes: string) => {
    setChecklistItems(items =>
      items.map(item => item.id === id ? { ...item, notes } : item)
    );
  };

  const addMeasurement = () => {
    setMeasurements([...measurements, { parameter: '', value: '', unit: '' }]);
  };

  const removeMeasurement = (index: number) => {
    setMeasurements(measurements.filter((_, i) => i !== index));
  };

  const handleMeasurementChange = (index: number, field: string, value: string) => {
    const updated = [...measurements];
    updated[index] = { ...updated[index], [field]: value };
    setMeasurements(updated);
  };

  // Signature pad functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setSignature(null);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL();
      setSignature({
        signature: dataUrl,
        timestamp: new Date().toISOString(),
        name: user?.username || 'Unknown',
      });
      setShowSignaturePad(false);
    }
  };

  const initializeSignaturePad = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
      }
    }
  };

  useEffect(() => {
    if (showSignaturePad) {
      initializeSignaturePad();
    }
  }, [showSignaturePad]);

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!formData.equipmentId) {
      errors.push('Equipment is required');
    }
    if (!formData.inspectionDate) {
      errors.push('Inspection date is required');
    }
    if (!formData.inspectionType) {
      errors.push('Inspection type is required');
    }

    // Check required checklist items
    const uncheckedRequired = checklistItems.filter(item => item.required && !item.checked);
    if (uncheckedRequired.length > 0) {
      errors.push(`${uncheckedRequired.length} required checklist item(s) not completed`);
    }

    // Require signature for completion
    if (formData.status === 'completed' && !signature) {
      errors.push('Signature is required to complete the inspection');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleImagesSelect = (images: File[]) => {
    setInspectionImages(images);
  };

  const uploadImages = async (inspectionRecordId: number): Promise<void> => {
    if (inspectionImages.length === 0) return;

    setUploadingImages(true);
    try {
      // Upload each image
      for (const image of inspectionImages) {
        await uploadAttachment(
          image,
          'inspection',
          inspectionRecordId,
          `Inspection photo - ${new Date().toISOString()}`,
          'inspection_photo'
        );
      }
    } catch (err) {
      console.error('Error uploading images:', err);
      throw err;
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setError('Please fix validation errors before submitting');
      return;
    }

    if (!isOnline) {
      setError('Cannot submit while offline. The form will be saved locally.');
      saveDraft();
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const recordData = {
        ...formData,
        inspectedBy: user!.id,
        inspectionChecklist: JSON.stringify(checklistItems),
        measurementsTaken: JSON.stringify(measurements),
        notes: formData.notes || '',
        attachments: signature ? JSON.stringify({ signature: signature.signature }) : undefined,
      };

      let recordId: number;

      if (id) {
        await updateInspectionRecord(parseInt(id), recordData);
        recordId = parseInt(id);
        
        // Upload images if any
        if (inspectionImages.length > 0) {
          await uploadImages(recordId);
        }
        
        setSuccess('Inspection record updated successfully');
      } else {
        const response = await createInspectionRecord(recordData as any);
        recordId = response.id;
        
        // Upload images if any
        if (inspectionImages.length > 0) {
          await uploadImages(recordId);
        }
        
        setSuccess('Inspection record created successfully');
        clearDraft();
      }

      // If inspection failed, offer to create NCR
      if ((formData.result === 'failed' || !formData.passed) && recordId) {
        const createNCR = window.confirm(
          'This inspection failed. Would you like to create a Non-Conformance Report (NCR)?'
        );
        if (createNCR) {
          navigate(`/inspection-records/${recordId}`);
          return;
        }
      }

      setTimeout(() => {
        navigate('/inspection-records');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save inspection record');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAsDraft = () => {
    saveDraft();
    setSuccess('Draft saved locally');
    setTimeout(() => setSuccess(''), 2000);
  };

  if (loading && id) {
    return <div className="mobile-form-loading">Loading inspection...</div>;
  }

  return (
    <div className="mobile-inspection-form">
      {/* Online/Offline Indicator */}
      <div className={`connection-status ${isOnline ? 'online' : 'offline'}`}>
        <span className="status-icon">{isOnline ? '●' : '○'}</span>
        {isOnline ? 'Online' : 'Offline - Changes saved locally'}
      </div>

      <div className="mobile-form-header">
        <button onClick={() => navigate('/inspection-records')} className="back-button" aria-label="Back to list">
          ← Back
        </button>
        <h1>{id ? 'Edit Inspection' : 'New Inspection'}</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      
      {validationErrors.length > 0 && (
        <div className="alert alert-error">
          <strong>Validation Errors:</strong>
          <ul>
            {validationErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mobile-form">
        {/* Equipment Selection */}
        <section className="form-section">
          <h2>Equipment</h2>
          <div className="form-group">
            <label htmlFor="equipment">Equipment *</label>
            <select
              id="equipment"
              value={formData.equipmentId || ''}
              onChange={(e) => handleInputChange('equipmentId', parseInt(e.target.value))}
              className="form-control"
              required
            >
              <option value="">Select Equipment</option>
              {equipment.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.equipmentNumber} - {eq.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Inspection Details */}
        <section className="form-section">
          <h2>Inspection Details</h2>
          
          <div className="form-group">
            <label htmlFor="inspectionDate">Date *</label>
            <input
              type="date"
              id="inspectionDate"
              value={formData.inspectionDate || ''}
              onChange={(e) => handleInputChange('inspectionDate', e.target.value)}
              className="form-control"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="inspectionType">Inspection Type *</label>
            <select
              id="inspectionType"
              value={formData.inspectionType || ''}
              onChange={(e) => handleInputChange('inspectionType', e.target.value)}
              className="form-control"
              required
            >
              <option value="routine">Routine Inspection</option>
              <option value="safety">Safety Inspection</option>
              <option value="pre-use">Pre-Use Inspection</option>
              <option value="post-maintenance">Post-Maintenance</option>
              <option value="calibration">Calibration Check</option>
              <option value="regulatory">Regulatory Inspection</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="duration">Duration (minutes)</label>
            <input
              type="number"
              id="duration"
              value={formData.duration || ''}
              onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
              className="form-control"
              min="1"
              placeholder="e.g., 30"
            />
          </div>
        </section>

        {/* Checklist */}
        <section className="form-section">
          <h2>Inspection Checklist</h2>
          <div className="checklist">
            {checklistItems.map((item) => (
              <div key={item.id} className="checklist-item">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={(e) => handleChecklistChange(item.id, e.target.checked)}
                    className="checkbox-input"
                  />
                  <span className="checkbox-text">
                    {item.label}
                    {item.required && <span className="required-indicator"> *</span>}
                  </span>
                </label>
                {item.checked && (
                  <input
                    type="text"
                    placeholder="Add notes (optional)"
                    value={item.notes || ''}
                    onChange={(e) => handleChecklistNoteChange(item.id, e.target.value)}
                    className="checklist-notes"
                  />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Measurements */}
        <section className="form-section">
          <h2>Measurements & Parameters</h2>
          {measurements.map((measurement, index) => (
            <div key={index} className="measurement-group">
              <div className="measurement-row">
                <input
                  type="text"
                  placeholder="Parameter"
                  value={measurement.parameter}
                  onChange={(e) => handleMeasurementChange(index, 'parameter', e.target.value)}
                  className="form-control measurement-parameter"
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={measurement.value}
                  onChange={(e) => handleMeasurementChange(index, 'value', e.target.value)}
                  className="form-control measurement-value"
                />
                <input
                  type="text"
                  placeholder="Unit"
                  value={measurement.unit}
                  onChange={(e) => handleMeasurementChange(index, 'unit', e.target.value)}
                  className="form-control measurement-unit"
                />
                {measurements.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMeasurement(index)}
                    className="btn-remove"
                    aria-label="Remove measurement"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}
          <button type="button" onClick={addMeasurement} className="btn-add">
            + Add Measurement
          </button>
        </section>

        {/* Results */}
        <section className="form-section">
          <h2>Results</h2>
          
          <div className="form-group">
            <label htmlFor="result">Overall Result</label>
            <select
              id="result"
              value={formData.result || 'pending'}
              onChange={(e) => handleInputChange('result', e.target.value)}
              className="form-control"
            >
              <option value="pending">Pending</option>
              <option value="passed">Passed</option>
              <option value="passed_with_observations">Passed with Observations</option>
              <option value="conditional">Conditional</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div className="toggle-group">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={formData.passed || false}
                onChange={(e) => handleInputChange('passed', e.target.checked)}
                className="toggle-input"
              />
              <span className="toggle-text">Passed Overall</span>
            </label>
          </div>

          <div className="toggle-group">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={formData.safetyCompliant || false}
                onChange={(e) => handleInputChange('safetyCompliant', e.target.checked)}
                className="toggle-input"
              />
              <span className="toggle-text">Safety Compliant</span>
            </label>
          </div>

          <div className="toggle-group">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={formData.operationalCompliant || false}
                onChange={(e) => handleInputChange('operationalCompliant', e.target.checked)}
                className="toggle-input"
              />
              <span className="toggle-text">Operationally Compliant</span>
            </label>
          </div>

          <div className="form-group">
            <label htmlFor="severity">Severity (if issues found)</label>
            <select
              id="severity"
              value={formData.severity || ''}
              onChange={(e) => handleInputChange('severity', e.target.value || undefined)}
              className="form-control"
            >
              <option value="">None / Not Applicable</option>
              <option value="minor">Minor</option>
              <option value="moderate">Moderate</option>
              <option value="major">Major</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </section>

        {/* Findings & Actions */}
        <section className="form-section">
          <h2>Findings & Actions</h2>
          
          <div className="form-group">
            <label htmlFor="findings">Findings</label>
            <textarea
              id="findings"
              value={formData.findings || ''}
              onChange={(e) => handleInputChange('findings', e.target.value)}
              className="form-control"
              rows={4}
              placeholder="Describe any findings or observations..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="defectsFound">Defects Found</label>
            <textarea
              id="defectsFound"
              value={formData.defectsFound || ''}
              onChange={(e) => handleInputChange('defectsFound', e.target.value)}
              className="form-control"
              rows={3}
              placeholder="List any defects identified..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="correctiveAction">Corrective Action Taken</label>
            <textarea
              id="correctiveAction"
              value={formData.correctiveAction || ''}
              onChange={(e) => handleInputChange('correctiveAction', e.target.value)}
              className="form-control"
              rows={3}
              placeholder="Describe corrective actions..."
            />
          </div>

          <div className="toggle-group">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={formData.followUpRequired || false}
                onChange={(e) => handleInputChange('followUpRequired', e.target.checked)}
                className="toggle-input"
              />
              <span className="toggle-text">Follow-up Required</span>
            </label>
          </div>

          {formData.followUpRequired && (
            <div className="form-group">
              <label htmlFor="followUpDate">Follow-up Date</label>
              <input
                type="date"
                id="followUpDate"
                value={formData.followUpDate || ''}
                onChange={(e) => handleInputChange('followUpDate', e.target.value)}
                className="form-control"
              />
            </div>
          )}
        </section>

        {/* Additional Notes */}
        <section className="form-section">
          <h2>Additional Notes</h2>
          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="form-control"
              rows={3}
              placeholder="Any additional notes or comments..."
            />
          </div>
        </section>

        {/* Inspection Photos */}
        <section className="form-section">
          <h2>Inspection Photos</h2>
          <p className="section-description">
            Take photos or upload images to document inspection findings. Images will be automatically compressed.
          </p>
          <ImageUpload
            onImagesSelect={handleImagesSelect}
            maxImages={5}
            maxSizeMB={2}
            disabled={loading || uploadingImages}
          />
          {uploadingImages && (
            <div className="upload-status">
              <p>📤 Uploading images...</p>
            </div>
          )}
        </section>

        {/* Signature */}
        <section className="form-section">
          <h2>Signature</h2>
          {signature ? (
            <div className="signature-preview">
              <img src={signature.signature} alt="Inspector signature" />
              <p>Signed by: {signature.name}</p>
              <p>Date: {new Date(signature.timestamp).toLocaleString()}</p>
              <button type="button" onClick={() => setShowSignaturePad(true)} className="btn-secondary">
                Update Signature
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setShowSignaturePad(true)} className="btn-secondary">
              Add Signature
            </button>
          )}
        </section>

        {/* Status */}
        <section className="form-section">
          <h2>Status</h2>
          <div className="form-group">
            <label htmlFor="status">Inspection Status</label>
            <select
              id="status"
              value={formData.status || 'in_progress'}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="form-control"
            >
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </section>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            onClick={handleSaveAsDraft}
            className="btn-draft"
          >
            Save Draft
          </button>
          <button
            type="submit"
            disabled={loading || !isOnline}
            className="btn-submit"
          >
            {loading ? 'Submitting...' : id ? 'Update' : 'Submit'}
          </button>
        </div>
      </form>

      {/* Signature Pad Modal */}
      {showSignaturePad && (
        <div className="modal-overlay" onClick={() => setShowSignaturePad(false)}>
          <div className="signature-modal" onClick={(e) => e.stopPropagation()}>
            <div className="signature-header">
              <h3>Sign Here</h3>
              <button onClick={() => setShowSignaturePad(false)} className="close-button">
                ✕
              </button>
            </div>
            <canvas
              ref={canvasRef}
              width={400}
              height={200}
              className="signature-canvas"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            <div className="signature-actions">
              <button type="button" onClick={clearSignature} className="btn-secondary">
                Clear
              </button>
              <button type="button" onClick={saveSignature} className="btn-primary">
                Save Signature
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MobileInspectionForm;

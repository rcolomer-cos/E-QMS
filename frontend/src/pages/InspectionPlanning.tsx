import { useState, useEffect } from 'react';
import {
  getInspectionPlans,
  createInspectionPlan,
  updateInspectionPlan,
  deleteInspectionPlan,
  getInspectionTypes,
  InspectionPlan,
} from '../services/inspectionPlanService';
import { getEquipment, Equipment } from '../services/equipmentService';
import { getUsers } from '../services/userService';
import acceptanceCriteriaService, { AcceptanceCriteria } from '../services/acceptanceCriteriaService';
import { User } from '../types';
import '../styles/InspectionPlanning.css';

interface FormData {
  planNumber: string;
  planName: string;
  description: string;
  equipmentId: string;
  inspectionType: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  planType: 'recurring' | 'one_time';
  frequency: string;
  frequencyInterval: string;
  startDate: string;
  endDate: string;
  nextDueDate: string;
  reminderDays: string;
  responsibleInspectorId: string;
  backupInspectorId: string;
  checklistReference: string;
  inspectionStandard: string;
  requiredCompetencies: string;
  estimatedDuration: string;
  requiredTools: string;
  status: 'active' | 'inactive' | 'on_hold' | 'completed' | 'cancelled';
  regulatoryRequirement: boolean;
  complianceReference: string;
  autoSchedule: boolean;
  notifyOnOverdue: boolean;
  escalationDays: string;
  criticality: 'low' | 'medium' | 'high' | 'critical';
  safetyRelated: boolean;
  qualityImpact: 'none' | 'low' | 'medium' | 'high';
  notes: string;
}

function InspectionPlanning() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<InspectionPlan | null>(null);
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);
  const [selectedInspectionType, setSelectedInspectionType] = useState('');

  // Data
  const [plans, setPlans] = useState<InspectionPlan[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [inspectors, setInspectors] = useState<User[]>([]);
  const [inspectionTypes, setInspectionTypes] = useState<string[]>([]);
  const [acceptanceCriteria, setAcceptanceCriteria] = useState<AcceptanceCriteria[]>([]);

  // Form data
  const [formData, setFormData] = useState<FormData>({
    planNumber: '',
    planName: '',
    description: '',
    equipmentId: '',
    inspectionType: '',
    priority: 'normal',
    planType: 'recurring',
    frequency: 'monthly',
    frequencyInterval: '30',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    nextDueDate: new Date().toISOString().split('T')[0],
    reminderDays: '7',
    responsibleInspectorId: '',
    backupInspectorId: '',
    checklistReference: '',
    inspectionStandard: '',
    requiredCompetencies: '',
    estimatedDuration: '',
    requiredTools: '',
    status: 'active',
    regulatoryRequirement: false,
    complianceReference: '',
    autoSchedule: true,
    notifyOnOverdue: true,
    escalationDays: '3',
    criticality: 'medium',
    safetyRelated: false,
    qualityImpact: 'medium',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedInspectionType) {
      loadCriteriaForType(selectedInspectionType);
    }
  }, [selectedInspectionType]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansData, equipmentData, usersData, types] = await Promise.all([
        getInspectionPlans({ limit: 100 }),
        getEquipment(),
        getUsers(),
        getInspectionTypes(),
      ]);

      setPlans(plansData.data);
      setEquipment(equipmentData);
      setInspectors(usersData.filter((u) => ['Admin', 'Manager', 'Auditor'].includes(u.role)));
      setInspectionTypes(types.length > 0 ? types : ['routine', 'safety', 'pre-use', 'quality', 'calibration', 'preventive']);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadCriteriaForType = async (type: string) => {
    try {
      const criteria = await acceptanceCriteriaService.getAcceptanceCriteriaByInspectionType(type);
      setAcceptanceCriteria(criteria);
    } catch (err: any) {
      console.error('Failed to load acceptance criteria:', err);
      setAcceptanceCriteria([]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // If inspection type changes, load relevant criteria
    if (name === 'inspectionType') {
      setSelectedInspectionType(value);
    }

    // Auto-calculate next due date based on start date and frequency
    if (name === 'startDate' || name === 'frequencyInterval') {
      const startDate = name === 'startDate' ? value : formData.startDate;
      const interval = name === 'frequencyInterval' ? parseInt(value) : parseInt(formData.frequencyInterval);

      if (startDate && interval) {
        const nextDue = new Date(startDate);
        nextDue.setDate(nextDue.getDate() + interval);
        setFormData((prev) => ({
          ...prev,
          nextDueDate: nextDue.toISOString().split('T')[0],
        }));
      }
    }
  };

  const generatePlanNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `IP-${year}${month}-${random}`;
  };

  const handleNewPlan = () => {
    setEditingPlan(null);
    setFormData({
      planNumber: generatePlanNumber(),
      planName: '',
      description: '',
      equipmentId: '',
      inspectionType: '',
      priority: 'normal',
      planType: 'recurring',
      frequency: 'monthly',
      frequencyInterval: '30',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      nextDueDate: new Date().toISOString().split('T')[0],
      reminderDays: '7',
      responsibleInspectorId: '',
      backupInspectorId: '',
      checklistReference: '',
      inspectionStandard: '',
      requiredCompetencies: '',
      estimatedDuration: '',
      requiredTools: '',
      status: 'active',
      regulatoryRequirement: false,
      complianceReference: '',
      autoSchedule: true,
      notifyOnOverdue: true,
      escalationDays: '3',
      criticality: 'medium',
      safetyRelated: false,
      qualityImpact: 'medium',
      notes: '',
    });
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleEditPlan = (plan: InspectionPlan) => {
    setEditingPlan(plan);
    setFormData({
      planNumber: plan.planNumber,
      planName: plan.planName,
      description: plan.description || '',
      equipmentId: plan.equipmentId.toString(),
      inspectionType: plan.inspectionType,
      priority: plan.priority,
      planType: plan.planType,
      frequency: plan.frequency || 'monthly',
      frequencyInterval: plan.frequencyInterval?.toString() || '30',
      startDate: plan.startDate.split('T')[0],
      endDate: plan.endDate ? plan.endDate.split('T')[0] : '',
      nextDueDate: plan.nextDueDate.split('T')[0],
      reminderDays: plan.reminderDays?.toString() || '7',
      responsibleInspectorId: plan.responsibleInspectorId.toString(),
      backupInspectorId: plan.backupInspectorId?.toString() || '',
      checklistReference: plan.checklistReference || '',
      inspectionStandard: plan.inspectionStandard || '',
      requiredCompetencies: plan.requiredCompetencies || '',
      estimatedDuration: plan.estimatedDuration?.toString() || '',
      requiredTools: plan.requiredTools || '',
      status: plan.status,
      regulatoryRequirement: plan.regulatoryRequirement || false,
      complianceReference: plan.complianceReference || '',
      autoSchedule: plan.autoSchedule !== false,
      notifyOnOverdue: plan.notifyOnOverdue !== false,
      escalationDays: plan.escalationDays?.toString() || '3',
      criticality: plan.criticality || 'medium',
      safetyRelated: plan.safetyRelated || false,
      qualityImpact: plan.qualityImpact || 'medium',
      notes: plan.notes || '',
    });
    setSelectedInspectionType(plan.inspectionType);
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const planData: any = {
        planNumber: formData.planNumber,
        planName: formData.planName,
        description: formData.description || undefined,
        equipmentId: parseInt(formData.equipmentId),
        inspectionType: formData.inspectionType,
        priority: formData.priority,
        planType: formData.planType,
        frequency: formData.planType === 'recurring' ? formData.frequency : undefined,
        frequencyInterval: formData.planType === 'recurring' ? parseInt(formData.frequencyInterval) : undefined,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        nextDueDate: formData.nextDueDate,
        reminderDays: parseInt(formData.reminderDays),
        responsibleInspectorId: parseInt(formData.responsibleInspectorId),
        backupInspectorId: formData.backupInspectorId ? parseInt(formData.backupInspectorId) : undefined,
        checklistReference: formData.checklistReference || undefined,
        inspectionStandard: formData.inspectionStandard || undefined,
        requiredCompetencies: formData.requiredCompetencies || undefined,
        estimatedDuration: formData.estimatedDuration ? parseInt(formData.estimatedDuration) : undefined,
        requiredTools: formData.requiredTools || undefined,
        status: formData.status,
        regulatoryRequirement: formData.regulatoryRequirement,
        complianceReference: formData.complianceReference || undefined,
        autoSchedule: formData.autoSchedule,
        notifyOnOverdue: formData.notifyOnOverdue,
        escalationDays: parseInt(formData.escalationDays),
        criticality: formData.criticality,
        safetyRelated: formData.safetyRelated,
        qualityImpact: formData.qualityImpact,
        notes: formData.notes || undefined,
      };

      if (editingPlan) {
        await updateInspectionPlan(editingPlan.id!, planData);
        setSuccess('Inspection plan updated successfully!');
      } else {
        await createInspectionPlan(planData);
        setSuccess('Inspection plan created successfully!');
      }

      setShowForm(false);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save inspection plan');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this inspection plan?')) {
      return;
    }

    try {
      await deleteInspectionPlan(id);
      setSuccess('Inspection plan deleted successfully!');
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete inspection plan');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingPlan(null);
    setError('');
    setSuccess('');
  };

  const getPriorityBadgeClass = (priority: string) => {
    const classes: { [key: string]: string } = {
      critical: 'badge-critical',
      high: 'badge-high',
      normal: 'badge-normal',
      low: 'badge-low',
    };
    return classes[priority] || 'badge-normal';
  };

  const getStatusBadgeClass = (status: string) => {
    const classes: { [key: string]: string } = {
      active: 'badge-active',
      inactive: 'badge-inactive',
      on_hold: 'badge-on-hold',
      completed: 'badge-completed',
      cancelled: 'badge-cancelled',
    };
    return classes[status] || 'badge-inactive';
  };

  if (loading) {
    return (
      <div className="inspection-planning-page">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="inspection-planning-page">
      <div className="page-header">
        <h1>Inspection Planning</h1>
        <p className="page-description">
          Create and manage inspection plans with acceptance criteria for equipment, processes, and products
        </p>
        <button className="btn-primary" onClick={handleNewPlan}>
          ➕ Create New Inspection Plan
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {showForm && (
        <div className="form-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingPlan ? 'Edit Inspection Plan' : 'Create New Inspection Plan'}</h2>
              <button className="close-btn" onClick={handleCancel}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="inspection-form">
              {/* Basic Information */}
              <fieldset>
                <legend>Basic Information</legend>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="planNumber">
                      Plan Number <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="planNumber"
                      name="planNumber"
                      value={formData.planNumber}
                      onChange={handleInputChange}
                      required
                      readOnly={!!editingPlan}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="planName">
                      Plan Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="planName"
                      name="planName"
                      value={formData.planName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>
              </fieldset>

              {/* Equipment and Type */}
              <fieldset>
                <legend>Equipment and Inspection Type</legend>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="equipmentId">
                      Equipment <span className="required">*</span>
                    </label>
                    <select
                      id="equipmentId"
                      name="equipmentId"
                      value={formData.equipmentId}
                      onChange={handleInputChange}
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
                  <div className="form-group">
                    <label htmlFor="inspectionType">
                      Inspection Type <span className="required">*</span>
                    </label>
                    <select
                      id="inspectionType"
                      name="inspectionType"
                      value={formData.inspectionType}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Type</option>
                      {inspectionTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    {selectedInspectionType && acceptanceCriteria.length > 0 && (
                      <button
                        type="button"
                        className="btn-link"
                        onClick={() => setShowCriteriaModal(true)}
                      >
                        View {acceptanceCriteria.length} Acceptance Criteria
                      </button>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="priority">Priority</label>
                    <select
                      id="priority"
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="criticality">Criticality</label>
                    <select
                      id="criticality"
                      name="criticality"
                      value={formData.criticality}
                      onChange={handleInputChange}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>
              </fieldset>

              {/* Scheduling */}
              <fieldset>
                <legend>Scheduling</legend>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="planType">Plan Type</label>
                    <select
                      id="planType"
                      name="planType"
                      value={formData.planType}
                      onChange={handleInputChange}
                    >
                      <option value="recurring">Recurring</option>
                      <option value="one_time">One Time</option>
                    </select>
                  </div>
                  {formData.planType === 'recurring' && (
                    <>
                      <div className="form-group">
                        <label htmlFor="frequency">Frequency</label>
                        <select
                          id="frequency"
                          name="frequency"
                          value={formData.frequency}
                          onChange={handleInputChange}
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="bi-weekly">Bi-Weekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="quarterly">Quarterly</option>
                          <option value="semi-annual">Semi-Annual</option>
                          <option value="annual">Annual</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label htmlFor="frequencyInterval">Interval (days)</label>
                        <input
                          type="number"
                          id="frequencyInterval"
                          name="frequencyInterval"
                          value={formData.frequencyInterval}
                          onChange={handleInputChange}
                          min="1"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="startDate">
                      Start Date <span className="required">*</span>
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="nextDueDate">
                      Next Due Date <span className="required">*</span>
                    </label>
                    <input
                      type="date"
                      id="nextDueDate"
                      name="nextDueDate"
                      value={formData.nextDueDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="endDate">End Date</label>
                    <input
                      type="date"
                      id="endDate"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="reminderDays">Reminder Days Before Due</label>
                    <input
                      type="number"
                      id="reminderDays"
                      name="reminderDays"
                      value={formData.reminderDays}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="escalationDays">Escalation Days After Overdue</label>
                    <input
                      type="number"
                      id="escalationDays"
                      name="escalationDays"
                      value={formData.escalationDays}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>
                </div>
              </fieldset>

              {/* Personnel */}
              <fieldset>
                <legend>Personnel Assignment</legend>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="responsibleInspectorId">
                      Primary Inspector <span className="required">*</span>
                    </label>
                    <select
                      id="responsibleInspectorId"
                      name="responsibleInspectorId"
                      value={formData.responsibleInspectorId}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Inspector</option>
                      {inspectors.map((inspector) => (
                        <option key={inspector.id} value={inspector.id}>
                          {inspector.firstName && inspector.lastName
                            ? `${inspector.firstName} ${inspector.lastName}`
                            : inspector.username} ({inspector.role})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="backupInspectorId">Backup Inspector</label>
                    <select
                      id="backupInspectorId"
                      name="backupInspectorId"
                      value={formData.backupInspectorId}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Backup Inspector</option>
                      {inspectors.map((inspector) => (
                        <option key={inspector.id} value={inspector.id}>
                          {inspector.firstName && inspector.lastName
                            ? `${inspector.firstName} ${inspector.lastName}`
                            : inspector.username} ({inspector.role})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="requiredCompetencies">Required Competencies</label>
                  <input
                    type="text"
                    id="requiredCompetencies"
                    name="requiredCompetencies"
                    value={formData.requiredCompetencies}
                    onChange={handleInputChange}
                    placeholder="e.g., Calibration Training, ISO 9001 Auditor"
                  />
                </div>
              </fieldset>

              {/* Standards and References */}
              <fieldset>
                <legend>Standards and References</legend>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="checklistReference">Checklist Reference</label>
                    <input
                      type="text"
                      id="checklistReference"
                      name="checklistReference"
                      value={formData.checklistReference}
                      onChange={handleInputChange}
                      placeholder="e.g., CHK-001"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="inspectionStandard">Inspection Standard</label>
                    <input
                      type="text"
                      id="inspectionStandard"
                      name="inspectionStandard"
                      value={formData.inspectionStandard}
                      onChange={handleInputChange}
                      placeholder="e.g., ISO 9001:2015, ASTM D-1234"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="complianceReference">Compliance Reference</label>
                    <input
                      type="text"
                      id="complianceReference"
                      name="complianceReference"
                      value={formData.complianceReference}
                      onChange={handleInputChange}
                      placeholder="e.g., FDA 21 CFR 820"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="requiredTools">Required Tools</label>
                    <input
                      type="text"
                      id="requiredTools"
                      name="requiredTools"
                      value={formData.requiredTools}
                      onChange={handleInputChange}
                      placeholder="e.g., Calibrated gauge, torque wrench"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="estimatedDuration">Estimated Duration (minutes)</label>
                  <input
                    type="number"
                    id="estimatedDuration"
                    name="estimatedDuration"
                    value={formData.estimatedDuration}
                    onChange={handleInputChange}
                    min="1"
                    placeholder="30"
                  />
                </div>
              </fieldset>

              {/* Flags and Status */}
              <fieldset>
                <legend>Status and Settings</legend>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="status">Status</label>
                    <select id="status" name="status" value={formData.status} onChange={handleInputChange}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="on_hold">On Hold</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="qualityImpact">Quality Impact</label>
                    <select
                      id="qualityImpact"
                      name="qualityImpact"
                      value={formData.qualityImpact}
                      onChange={handleInputChange}
                    >
                      <option value="none">None</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div className="checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="regulatoryRequirement"
                      checked={formData.regulatoryRequirement}
                      onChange={handleInputChange}
                    />
                    Regulatory Requirement
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      name="safetyRelated"
                      checked={formData.safetyRelated}
                      onChange={handleInputChange}
                    />
                    Safety Related
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      name="autoSchedule"
                      checked={formData.autoSchedule}
                      onChange={handleInputChange}
                    />
                    Auto Schedule
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      name="notifyOnOverdue"
                      checked={formData.notifyOnOverdue}
                      onChange={handleInputChange}
                    />
                    Notify On Overdue
                  </label>
                </div>
              </fieldset>

              {/* Notes */}
              <fieldset>
                <legend>Additional Notes</legend>
                <div className="form-group">
                  <label htmlFor="notes">Notes</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Add any additional information or special instructions..."
                  />
                </div>
              </fieldset>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  {editingPlan ? 'Update Plan' : 'Create Plan'}
                </button>
                <button type="button" className="btn-secondary" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Acceptance Criteria Modal */}
      {showCriteriaModal && (
        <div className="form-modal">
          <div className="modal-content criteria-modal">
            <div className="modal-header">
              <h2>Acceptance Criteria for {selectedInspectionType}</h2>
              <button className="close-btn" onClick={() => setShowCriteriaModal(false)}>
                ✕
              </button>
            </div>
            <div className="criteria-list">
              {acceptanceCriteria.length === 0 ? (
                <p className="no-data">No acceptance criteria defined for this inspection type.</p>
              ) : (
                <table className="criteria-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Criteria Name</th>
                      <th>Parameter</th>
                      <th>Rule Type</th>
                      <th>Range/Value</th>
                      <th>Severity</th>
                      <th>Mandatory</th>
                    </tr>
                  </thead>
                  <tbody>
                    {acceptanceCriteria.map((criteria) => (
                      <tr key={criteria.id}>
                        <td>{criteria.criteriaCode}</td>
                        <td>{criteria.criteriaName}</td>
                        <td>
                          {criteria.parameterName} {criteria.unit ? `(${criteria.unit})` : ''}
                        </td>
                        <td>{criteria.ruleType}</td>
                        <td>
                          {criteria.ruleType === 'range' && (
                            <>
                              {criteria.minValue} - {criteria.maxValue}
                            </>
                          )}
                          {criteria.ruleType === 'min' && <>≥ {criteria.minValue}</>}
                          {criteria.ruleType === 'max' && <>≤ {criteria.maxValue}</>}
                          {criteria.ruleType === 'tolerance' && (
                            <>
                              {criteria.targetValue} ±{criteria.tolerancePlus}/-{criteria.toleranceMinus}
                            </>
                          )}
                          {criteria.ruleType === 'exact' && <>{criteria.targetValue}</>}
                          {criteria.ruleType === 'pass_fail' && <>Pass/Fail</>}
                        </td>
                        <td>
                          <span className={`badge badge-${criteria.severity}`}>{criteria.severity}</span>
                        </td>
                        <td>{criteria.mandatory ? '✓' : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowCriteriaModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plans List */}
      <div className="plans-section">
        <h2>Existing Inspection Plans</h2>
        {plans.length === 0 ? (
          <p className="no-data">No inspection plans found. Create one to get started.</p>
        ) : (
          <div className="plans-table-container">
            <table className="plans-table">
              <thead>
                <tr>
                  <th>Plan Number</th>
                  <th>Plan Name</th>
                  <th>Equipment</th>
                  <th>Type</th>
                  <th>Priority</th>
                  <th>Plan Type</th>
                  <th>Next Due</th>
                  <th>Inspector</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr key={plan.id}>
                    <td>{plan.planNumber}</td>
                    <td>{plan.planName}</td>
                    <td>
                      {plan.equipmentNumber} - {plan.equipmentName}
                    </td>
                    <td>{plan.inspectionType}</td>
                    <td>
                      <span className={`badge ${getPriorityBadgeClass(plan.priority)}`}>{plan.priority}</span>
                    </td>
                    <td>{plan.planType}</td>
                    <td>{new Date(plan.nextDueDate).toLocaleDateString()}</td>
                    <td>{plan.responsibleInspectorName}</td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(plan.status)}`}>{plan.status}</span>
                    </td>
                    <td className="actions-cell">
                      <button className="btn-icon" onClick={() => handleEditPlan(plan)} title="Edit">
                        ✏️
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => handleDelete(plan.id!)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default InspectionPlanning;

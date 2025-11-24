import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import imageCompression from 'browser-image-compression';
import {
  getEquipmentById,
  createEquipment,
  updateEquipment,
} from '../services/equipmentService';
import { getUsers } from '../services/userService';
import { useToast } from '../contexts/ToastContext';
import { User } from '../types';
import AttachmentUpload from '../components/AttachmentUpload';
import '../styles/AddEditEquipment.css';

function AddEditEquipment() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(!!id);
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [formData, setFormData] = useState({
    equipmentNumber: '',
    name: '',
    description: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    location: '',
    department: '',
    status: 'operational',
    purchaseDate: '',
    lastCalibrationDate: '',
    calibrationInterval: '',
    lastMaintenanceDate: '',
    maintenanceInterval: '',
    responsiblePerson: '',
  });
  const [nextCalibrationDate, setNextCalibrationDate] = useState<string>('');
  const [nextMaintenanceDate, setNextMaintenanceDate] = useState<string>('');

  useEffect(() => {
    loadUsers();
    if (id) {
      loadEquipment();
    }
  }, [id]);

  // Calculate next dates when last date or interval changes
  useEffect(() => {
    calculateNextDates();
  }, [formData.lastCalibrationDate, formData.calibrationInterval, formData.lastMaintenanceDate, formData.maintenanceInterval]);

  const calculateNextDates = () => {
    // Calculate next calibration date
    if (formData.lastCalibrationDate && formData.calibrationInterval && parseInt(formData.calibrationInterval) > 0) {
      // Parse date in local timezone to avoid timezone offset issues
      const [year, month, day] = formData.lastCalibrationDate.split('-').map(Number);
      const lastDate = new Date(year, month - 1, day);
      const nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + parseInt(formData.calibrationInterval));
      
      // Format as yyyy-MM-dd
      const yyyy = nextDate.getFullYear();
      const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
      const dd = String(nextDate.getDate()).padStart(2, '0');
      setNextCalibrationDate(`${yyyy}-${mm}-${dd}`);
    } else {
      setNextCalibrationDate('');
    }

    // Calculate next maintenance date
    if (formData.lastMaintenanceDate && formData.maintenanceInterval && parseInt(formData.maintenanceInterval) > 0) {
      // Parse date in local timezone to avoid timezone offset issues
      const [year, month, day] = formData.lastMaintenanceDate.split('-').map(Number);
      const lastDate = new Date(year, month - 1, day);
      const nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + parseInt(formData.maintenanceInterval));
      
      // Format as yyyy-MM-dd
      const yyyy = nextDate.getFullYear();
      const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
      const dd = String(nextDate.getDate()).padStart(2, '0');
      setNextMaintenanceDate(`${yyyy}-${mm}-${dd}`);
    } else {
      setNextMaintenanceDate('');
    }
  };

  const loadUsers = async () => {
    try {
      const usersData = await getUsers();
      setUsers(usersData);
    } catch (err) {
      console.error('Misslyckades att ladda användare:', err);
    }
  };

  const loadEquipment = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const equipment = await getEquipmentById(parseInt(id));
      console.log('Loaded equipment:', equipment);
      console.log('Image path from DB:', equipment.imagePath);
      
      setFormData({
        equipmentNumber: equipment.equipmentNumber,
        name: equipment.name,
        description: equipment.description || '',
        manufacturer: equipment.manufacturer || '',
        model: equipment.model || '',
        serialNumber: equipment.serialNumber || '',
        location: equipment.location,
        department: equipment.department || '',
        status: equipment.status,
        purchaseDate: equipment.purchaseDate ? equipment.purchaseDate.split('T')[0] : '',
        lastCalibrationDate: equipment.lastCalibrationDate ? equipment.lastCalibrationDate.split('T')[0] : '',
        calibrationInterval: equipment.calibrationInterval?.toString() || '',
        lastMaintenanceDate: equipment.lastMaintenanceDate ? equipment.lastMaintenanceDate.split('T')[0] : '',
        maintenanceInterval: equipment.maintenanceInterval?.toString() || '',
        responsiblePerson: equipment.responsiblePerson?.toString() || '',
      });

      // Set calculated next dates from backend if available
      if (equipment.nextCalibrationDate) {
        setNextCalibrationDate(equipment.nextCalibrationDate.split('T')[0]);
      }
      if (equipment.nextMaintenanceDate) {
        setNextMaintenanceDate(equipment.nextMaintenanceDate.split('T')[0]);
      }
      
      // Set existing image if available
      if (equipment.imagePath) {
        const backendUrl = window.location.hostname === 'localhost' ? 'http://localhost:3001' : '';
        const imageUrl = `${backendUrl}/${equipment.imagePath}`;
        console.log('Loading image from:', imageUrl);
        setImagePreview(imageUrl);
      } else {
        console.log('No image path in equipment data');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Misslyckades att ladda utrustning');
      navigate('/equipment');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Välj en bildfil');
      return;
    }

    try {
      // Compress image
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);
      
      // Get file extension from original file or determine from mime type
      let extension = '';
      if (file.name.includes('.')) {
        extension = file.name.substring(file.name.lastIndexOf('.'));
      } else {
        // Fallback to mime type
        const mimeExtensions: { [key: string]: string } = {
          'image/jpeg': '.jpg',
          'image/jpg': '.jpg',
          'image/png': '.png',
          'image/gif': '.gif',
          'image/webp': '.webp'
        };
        extension = mimeExtensions[compressedFile.type] || '.jpg';
      }
      
      // Ensure filename has extension
      let fileName = file.name;
      if (!fileName.includes('.')) {
        fileName = fileName + extension;
      }
      
      // Create file with proper name and extension
      const renamedFile = new File([compressedFile], fileName, {
        type: compressedFile.type,
        lastModified: Date.now(),
      });
      
      setImageFile(renamedFile);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(compressedFile);
    } catch (err) {
      console.error('Image compression error:', err);
      toast.error('Misslyckades att behandla bild');
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const submitData = new FormData();
      
      // Append all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '') {
          submitData.append(key, value);
        }
      });

      // Append image if selected
      if (imageFile) {
        submitData.append('image', imageFile);
      }

      if (id) {
        await updateEquipment(parseInt(id), submitData as any);
        toast.showUpdateSuccess('Equipment');
      } else {
        await createEquipment(submitData as any);
        toast.showCreateSuccess('Equipment');
      }

      navigate('/equipment');
    } catch (err: any) {
      toast.error(err.response?.data?.error || `Misslyckades att ${id ? 'uppdatera' : 'skapa'} utrustning`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  return (
    <div className="add-edit-equipment-page">
      <div className="page-header">
        <h1>{id ? t('equipment.editEquipment') : t('equipment.createEquipment')}</h1>
        <button type="button" className="btn-secondary" onClick={() => navigate('/utrustning')}>
          {t('common.cancel')}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="equipment-form">
        {/* Image Upload Section */}
        <div className="form-section image-section">
          <h3>{t('equipment.title')} {t('common.image')}</h3>
          <div className="image-upload-container">
            <div className="image-preview-wrapper">
              {imagePreview ? (
                <div className="image-preview">
                  <img src={imagePreview} alt={t('equipment.title')} className="circular-image" />
                  <button type="button" className="btn-remove-image" onClick={handleRemoveImage}>
                    {t('common.delete')}
                  </button>
                </div>
              ) : (
                <div className="image-placeholder circular-image">
                  <span>{t('common.noImage')}</span>
                </div>
              )}
            </div>
            <div className="image-upload-actions">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className="btn-secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? t('common.change') : t('common.upload')} {t('common.image')}
              </button>
              <p className="image-hint">{t('common.maxSize')}: 1MB</p>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="form-columns">
          {/* Left Column - Basic Information */}
          <div className="form-column">
            <div className="form-section">
              <h3>{t('common.basicInfo')}</h3>
              
              <div className="form-group">
                <label htmlFor="equipmentNumber">{t('equipment.equipmentNumber')} *</label>
                <input
                  type="text"
                  id="equipmentNumber"
                  name="equipmentNumber"
                  value={formData.equipmentNumber}
                  onChange={handleInputChange}
                  required
                  placeholder="EQ-001"
                />
              </div>

              <div className="form-group">
                <label htmlFor="name">{t('equipment.equipmentName')} *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder={t('equipment.equipmentName')}
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">{t('common.description')}</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder={t('common.description')}
                />
              </div>

              <div className="form-group">
                <label htmlFor="status">{t('common.status')} *</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                >
                  <option value="operational">{t('equipment.operational')}</option>
                  <option value="maintenance">{t('equipment.maintenance')}</option>
                  <option value="out_of_service">{t('equipment.outOfService')}</option>
                  <option value="calibration_due">{t('equipment.calibrationDue')}</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="location">{t('equipment.location')} *</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  placeholder={t('equipment.location')}
                />
              </div>

              <div className="form-group">
                <label htmlFor="department">{t('equipment.department')}</label>
                <input
                  type="text"
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  placeholder={t('equipment.department')}
                />
              </div>

              <div className="form-group">
                <label htmlFor="responsiblePerson">{t('common.responsiblePerson')}</label>
                <select
                  id="responsiblePerson"
                  name="responsiblePerson"
                  value={formData.responsiblePerson}
                  onChange={handleInputChange}
                >
                  <option value="">-- {t('common.select')} --</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Right Column - Technical Details */}
          <div className="form-column">
            <div className="form-section">
              <h3>{t('common.technicalDetails')}</h3>
              
              <div className="form-group">
                <label htmlFor="manufacturer">{t('equipment.manufacturer')}</label>
                <input
                  type="text"
                  id="manufacturer"
                  name="manufacturer"
                  value={formData.manufacturer}
                  onChange={handleInputChange}
                  placeholder={t('equipment.manufacturer')}
                />
              </div>

              <div className="form-group">
                <label htmlFor="model">{t('equipment.model')}</label>
                <input
                  type="text"
                  id="model"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  placeholder={t('equipment.model')}
                />
              </div>

              <div className="form-group">
                <label htmlFor="serialNumber">{t('equipment.serialNumber')}</label>
                <input
                  type="text"
                  id="serialNumber"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleInputChange}
                  placeholder={t('equipment.serialNumber')}
                />
              </div>

              <div className="form-group">
                <label htmlFor="purchaseDate">{t('equipment.purchaseDate')}</label>
                <input
                  type="date"
                  id="purchaseDate"
                  name="purchaseDate"
                  value={formData.purchaseDate}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-section">
              <h3>{t('equipment.calibration')} & {t('equipment.maintenance')}</h3>
              
              <div className="form-group">
                <label htmlFor="lastCalibrationDate">{t('equipment.lastCalibration')}</label>
                <input
                  type="date"
                  id="lastCalibrationDate"
                  name="lastCalibrationDate"
                  value={formData.lastCalibrationDate}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="calibrationInterval">{t('equipment.calibrationFrequency')} ({t('common.days')})</label>
                <input
                  type="number"
                  id="calibrationInterval"
                  name="calibrationInterval"
                  value={formData.calibrationInterval}
                  onChange={handleInputChange}
                  min="0"
                  placeholder="365"
                />
                <small className="form-hint">{t('common.setToZero')}</small>
              </div>

              {nextCalibrationDate && (
                <div className="form-group">
                  <label htmlFor="nextCalibrationDate">{t('equipment.nextCalibration')}</label>
                  <input
                    type="date"
                    id="nextCalibrationDate"
                    value={nextCalibrationDate}
                    readOnly
                    className="readonly-field"
                  />
                  <small className="form-hint">{t('common.autoCalculated')}</small>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="lastMaintenanceDate">{t('equipment.lastMaintenance')}</label>
                <input
                  type="date"
                  id="lastMaintenanceDate"
                  name="lastMaintenanceDate"
                  value={formData.lastMaintenanceDate}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="maintenanceInterval">{t('equipment.maintenance')} {t('common.interval')} ({t('common.days')})</label>
                <input
                  type="number"
                  id="maintenanceInterval"
                  name="maintenanceInterval"
                  value={formData.maintenanceInterval}
                  onChange={handleInputChange}
                  min="0"
                  placeholder="180"
                />
                <small className="form-hint">{t('common.setToZero')}</small>
              </div>

              {nextMaintenanceDate && (
                <div className="form-group">
                  <label htmlFor="nextMaintenanceDate">{t('equipment.nextMaintenance')}</label>
                  <input
                    type="date"
                    id="nextMaintenanceDate"
                    value={nextMaintenanceDate}
                    readOnly
                    className="readonly-field"
                  />
                  <small className="form-hint">{t('common.autoCalculated')}</small>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/utrustning')}>
            {t('common.cancel')}
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? t('common.saving') : (id ? t('common.update') : t('common.create'))}
          </button>
        </div>
      </form>

      {/* Attachments Section - Only shown when editing existing equipment */}
      {id && (
        <div className="attachments-container">
          <AttachmentUpload
            entityType="equipment"
            entityId={parseInt(id)}
          />
        </div>
      )}
    </div>
  );
}

export default AddEditEquipment;

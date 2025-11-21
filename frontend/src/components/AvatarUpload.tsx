import { useState, useRef, useCallback } from 'react';
import Avatar from './Avatar';
import { User } from '../types';
import '../styles/AvatarUpload.css';

interface AvatarUploadProps {
  user: User;
  onUploadSuccess: (avatarUrl: string) => void;
}

const AvatarUpload = ({ user, onUploadSuccess }: AvatarUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const cropToCircle = useCallback((imageDataUrl: string): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) {
          reject(new Error('Canvas not found'));
          return;
        }

        // Set canvas size (256x256 for avatar)
        const size = 256;
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Calculate crop dimensions (square from center of image)
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;

        // Draw circular clipping path
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        // Draw image
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        }, 'image/png', 0.95);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = imageDataUrl;
    });
  }, []);

  const handleUpload = async () => {
    if (!previewImage) return;

    setUploading(true);
    setError('');

    try {
      // Crop the image to a circle
      const blob = await cropToCircle(previewImage);

      // Create form data
      const formData = new FormData();
      formData.append('avatar', blob, 'avatar.png');

      // Upload to server
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/users/${user.id}/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to upload avatar');
      }

      const data = await response.json();
      onUploadSuccess(data.avatarUrl);
      setPreviewImage(null);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your avatar?')) {
      return;
    }

    setUploading(true);
    setError('');

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/users/${user.id}/avatar`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete avatar');
      }

      onUploadSuccess('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setPreviewImage(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="avatar-upload">
      <div className="avatar-upload-preview">
        <Avatar user={user} size="xlarge" />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {error && <div className="avatar-upload-error">{error}</div>}

      {previewImage && (
        <div className="avatar-upload-preview-modal">
          <div className="avatar-upload-preview-content">
            <h3>Preview</h3>
            <div className="avatar-upload-preview-image">
              <img src={previewImage} alt="Preview" />
            </div>
            <p className="avatar-upload-hint">
              Image will be cropped to a circle
            </p>
            <div className="avatar-upload-actions">
              <button
                className="btn btn-secondary"
                onClick={handleCancel}
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {!previewImage && (
        <div className="avatar-upload-buttons">
          <button
            className="btn btn-primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {user.avatarUrl ? 'Change Avatar' : 'Upload Avatar'}
          </button>
          {user.avatarUrl && (
            <button
              className="btn btn-danger"
              onClick={handleDelete}
              disabled={uploading}
            >
              Delete Avatar
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AvatarUpload;

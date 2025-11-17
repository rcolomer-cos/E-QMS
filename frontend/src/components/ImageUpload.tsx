import { useState, useRef, ChangeEvent } from 'react';
import imageCompression from 'browser-image-compression';
import '../styles/ImageUpload.css';

interface ImageUploadProps {
  onImagesSelect: (images: File[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
  disabled?: boolean;
}

interface ImagePreview {
  file: File;
  url: string;
  compressed?: boolean;
}

const ImageUpload = ({
  onImagesSelect,
  maxImages = 5,
  maxSizeMB = 2,
  disabled = false,
}: ImageUploadProps) => {
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [compressionProgress, setCompressionProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: maxSizeMB,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      onProgress: (progress: number) => {
        setCompressionProgress(progress);
      },
    };

    try {
      const compressedFile = await imageCompression(file, options);
      return compressedFile;
    } catch (error) {
      console.error('Error compressing image:', error);
      return file; // Return original if compression fails
    }
  };

  const validateImage = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
      return 'Invalid image type. Only JPEG, PNG, GIF, and WebP are allowed.';
    }

    // Check if we've reached max images
    if (images.length >= maxImages) {
      return `Maximum ${maxImages} images allowed.`;
    }

    return null;
  };

  const handleImageSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setError('');
    setUploading(true);
    setCompressionProgress(0);

    const newImages: ImagePreview[] = [];
    const compressedFiles: File[] = [];

    for (let i = 0; i < files.length && images.length + newImages.length < maxImages; i++) {
      const file = files[i];
      
      const validationError = validateImage(file);
      if (validationError) {
        setError(validationError);
        continue;
      }

      try {
        // Compress the image
        const compressedFile = await compressImage(file);
        
        // Create preview URL
        const url = URL.createObjectURL(compressedFile);
        
        newImages.push({
          file: compressedFile,
          url,
          compressed: compressedFile.size < file.size,
        });

        compressedFiles.push(compressedFile);
      } catch (err) {
        console.error('Error processing image:', err);
        setError('Failed to process image');
      }
    }

    if (newImages.length > 0) {
      const updatedImages = [...images, ...newImages];
      setImages(updatedImages);
      onImagesSelect(compressedFiles);
    }

    setUploading(false);
    setCompressionProgress(0);
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleImageSelect(e.target.files);
  };

  const handleCameraCapture = (e: ChangeEvent<HTMLInputElement>) => {
    handleImageSelect(e.target.files);
  };

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    URL.revokeObjectURL(images[index].url);
    setImages(updatedImages);
    
    // Notify parent of updated files
    const files = updatedImages.map(img => img.file);
    onImagesSelect(files);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const formatFileSize = (bytes: number): string => {
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="image-upload-container">
      <div className="image-upload-controls">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          multiple
          onChange={handleFileInputChange}
          disabled={disabled || images.length >= maxImages}
          style={{ display: 'none' }}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleCameraCapture}
          disabled={disabled || images.length >= maxImages}
          style={{ display: 'none' }}
        />

        {images.length < maxImages && (
          <div className="upload-buttons">
            <button
              type="button"
              className="btn-upload-image"
              onClick={handleCameraClick}
              disabled={disabled || uploading}
            >
              📷 Take Photo
            </button>
            <button
              type="button"
              className="btn-upload-image"
              onClick={handleBrowseClick}
              disabled={disabled || uploading}
            >
              🖼️ Choose Image
            </button>
          </div>
        )}

        <p className="upload-hint">
          {images.length}/{maxImages} images • Max {maxSizeMB}MB each • JPEG, PNG, GIF, WebP
        </p>
      </div>

      {compressionProgress > 0 && compressionProgress < 100 && (
        <div className="compression-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${compressionProgress}%` }}
            />
          </div>
          <p className="progress-text">Compressing... {compressionProgress}%</p>
        </div>
      )}

      {error && <div className="upload-error">{error}</div>}

      {images.length > 0 && (
        <div className="image-preview-grid">
          {images.map((image, index) => (
            <div key={index} className="image-preview-item">
              <img src={image.url} alt={`Preview ${index + 1}`} />
              <div className="image-preview-info">
                <span className="image-size">{formatFileSize(image.file.size)}</span>
                {image.compressed && <span className="compressed-badge">✓ Compressed</span>}
              </div>
              <button
                type="button"
                className="remove-image-button"
                onClick={() => removeImage(index)}
                disabled={disabled}
                aria-label="Remove image"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;

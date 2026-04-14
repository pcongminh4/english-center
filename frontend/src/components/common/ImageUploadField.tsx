import { useState, useEffect } from "react";
import { PhotoIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { Typography } from "@material-tailwind/react";

interface ImageUploadFieldProps {
  label: string;
  fieldName: string;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  accept?: string;
  initialImages?: string[];
  onFilesChange: (fieldName: string, files: File[]) => void;
  errors?: string;
  disabled?: boolean;
}

const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  fieldName,
  maxFiles = 1,
  maxFileSize = 5,
  accept = "image/*",
  initialImages = [],
  onFilesChange,
  errors,
  disabled = false,
}) => {
  const [previews, setPreviews] = useState<string[]>(initialImages);
  const [isDragging, setIsDragging] = useState(false);
  const [userHasModified, setUserHasModified] = useState(false);

  // Sync previews with initialImages when it changes, but only if user hasn't modified
  useEffect(() => {
    if (!userHasModified) {
      console.log('Syncing initial images:', initialImages.length, initialImages);
      setPreviews(initialImages);
    }
  }, [initialImages, userHasModified]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const files = Array.from(e.target.files || []);
    processFiles(files);
  };

  const processFiles = async (files: File[]) => {
    console.log('processFiles called with', files.length, 'files');
    
    if (files.length > maxFiles) {
      alert(`Chỉ được phép tải lên tối đa ${maxFiles} ảnh`);
      return;
    }

    const validFiles: File[] = [];

    // Validate files first (synchronous)
    files.forEach((file) => {
      console.log('Validating file:', file.name);
      
      if (!file.type.startsWith("image/")) {
        alert(`File ${file.name} không phải là ảnh`);
        return;
      }

      if (file.size > maxFileSize * 1024 * 1024) {
        alert(`File ${file.name} vượt quá kích thước ${maxFileSize}MB`);
        return;
      }

      validFiles.push(file);
    });

    console.log('Valid files:', validFiles.length);

    if (validFiles.length === 0) {
      console.log('No valid files, returning early');
      return;
    }

    try {
      // Read files with Promise.all - return values directly
      const newPreviews = await Promise.all(
        validFiles.map((file) => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = reader.result as string;
              console.log('File read complete, preview length:', result.length);
              resolve(result);
            };
            reader.onerror = (err) => {
              console.error('FileReader error:', err);
              reject(err);
            };
            reader.readAsDataURL(file);
          });
        })
      );

      console.log('New previews array:', newPreviews);
      console.log('Setting previews with length:', newPreviews.length);
      setPreviews(newPreviews);
      setUserHasModified(true);  // Mark that user has modified
      onFilesChange(fieldName, validFiles);
    } catch (error) {
      console.error('Error in Promise.all:', error);
      alert("Có lỗi xảy ra khi xử lý ảnh. Vui lòng thử lại.");
    }
  };

  const handleRemoveImage = (index: number) => {
    if (disabled) return;
    const newPreviews = previews.filter((_, i) => i !== index);
    setPreviews(newPreviews);
    setUserHasModified(true);  // Mark that user has modified
    onFilesChange(fieldName, []);
  };

  return (
    <div className="w-full">
      <label className="block mb-2 text-sm font-medium text-gray-900">
        {label}
      </label>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-colors duration-200
          ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"}
          ${disabled ? "cursor-not-allowed opacity-50" : "hover:border-blue-400"}
        `}
      >
        <input
          type="file"
          multiple={maxFiles > 1}
          accept={accept}
          onChange={handleFileChange}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          Kéo thả ảnh vào đây hoặc click để chọn
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Tối đa {maxFiles} ảnh, mỗi ảnh tối đa {maxFileSize}MB
        </p>
      </div>

      {/* Image Previews */}
      {previews.length > 0 && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {previews.map((preview, index) => (
            <div key={index} className="relative group">
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="w-full min-h-48 object-contain rounded-lg border border-gray-200 bg-gray-50"
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <XCircleIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Error Message */}
      {errors && (
        <Typography variant="small" color="red" className="mt-1">
          {errors}
        </Typography>
      )}
    </div>
  );
};

export default ImageUploadField;
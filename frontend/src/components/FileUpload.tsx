import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadPDF } from '../services/api';

interface FileUploadProps {
  onUploadSuccess: (documentId: string, filename: string, chunks: number) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const simulateProgress = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);
    return interval;
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a PDF file');
      return;
    }

    setUploadedFile(file);
    setUploading(true);
    setError(null);
    
    const progressInterval = simulateProgress();

    try {
      const result = await uploadPDF(file);
      setUploadProgress(100);
      setTimeout(() => {
        onUploadSuccess(result.document_id || '', result.filename, result.chunks);
      }, 500);
    } catch (err) {
      setError('Failed to upload PDF. Please try again.');
      console.error(err);
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 1000);
    }
  }, [onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    multiple: false,
    maxSize: 50 * 1024 * 1024, // 50MB max
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Main dropzone */}
      <div
        {...getRootProps()}
        className={`
          relative overflow-hidden
          border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
          transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50 scale-105' 
            : isDragReject
            ? 'border-red-500 bg-red-50'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }
          ${uploading ? 'opacity-75 cursor-not-allowed hover:scale-100' : ''}
          ${error ? 'border-red-300 bg-red-50' : ''}
        `}
      >
        <input {...getInputProps()} disabled={uploading} />

        {/* Animated background gradient */}
        {isDragActive && (
          <div className="absolute inset-0 bg-linear-to-r from-blue-400 to-indigo-400 opacity-10 animate-pulse"></div>
        )}

        {/* Upload progress bar */}
        {uploading && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
            <div 
              className="h-full bg-linear-to-r from-blue-500 to-indigo-600 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        )}

        <div className="space-y-4 relative z-10">
          {/* Icon with animation */}
          <div className="flex justify-center">
            <div className={`
              relative transition-all duration-500
              ${isDragActive ? 'scale-110' : ''}
              ${uploading ? 'animate-bounce' : ''}
            `}>
              {/* Background glow */}
              <div className={`
                absolute inset-0 rounded-full blur-xl transition-opacity duration-500
                ${isDragActive ? 'bg-blue-400 opacity-50' : 'bg-blue-200 opacity-0'}
              `}></div>
              
              {/* Icon */}
              <svg
                className={`
                  w-20 h-20 relative transition-colors duration-300
                  ${isDragActive ? 'text-blue-600' : 'text-gray-400'}
                  ${error ? 'text-red-400' : ''}
                `}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
          </div>

          {/* Uploading state */}
          {uploading ? (
            <div className="space-y-3">
              <p className="text-lg font-semibold text-gray-800">
                Uploading {uploadedFile?.name}
              </p>
              <div className="max-w-xs mx-auto">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-linear-to-r from-blue-600 to-indigo-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
              <p className="text-sm text-gray-500 animate-pulse">
                {uploadProgress < 30 && "Reading PDF..."}
                {uploadProgress >= 30 && uploadProgress < 60 && "Chunking text..."}
                {uploadProgress >= 60 && uploadProgress < 90 && "Generating embeddings..."}
                {uploadProgress >= 90 && "Almost done..."}
              </p>
            </div>
          ) : (
            <div>
              {/* Upload prompt */}
              <p className="text-lg font-semibold text-gray-800 mb-2">
                {isDragActive 
                  ? '📂 Drop your PDF here' 
                  : isDragReject
                  ? '❌ Invalid file type'
                  : '📄 Drag & drop your PDF here'
                }
              </p>
              <p className="text-sm text-gray-500 mb-4">
                or <span className="text-blue-600 font-medium">browse</span> from your computer
              </p>
              
              {/* File restrictions */}
              <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  PDF only
                </span>
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                  Max 50MB
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error message with animation */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl animate-slideDown">
          <div className="flex items-start space-x-3">
            <div className="shrink-0">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">{error}</p>
              <p className="text-xs text-red-600 mt-1">
                Please check the file and try again
              </p>
            </div>
            <button
              onClick={() => setError(null)}
              className="shrink-0 text-red-400 hover:text-red-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Success message (shows briefly after upload) */}
      {uploadProgress === 100 && !uploading && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl animate-slideDown">
          <div className="flex items-center space-x-3">
            <div className="shrink-0">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm font-medium text-green-800">
              Upload complete! Redirecting to chat...
            </p>
          </div>
        </div>
      )}

      {/* Recent uploads */}
      {!uploading && !error && uploadedFile && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Last uploaded:</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium text-gray-700 truncate max-w-50">
                {uploadedFile.name}
              </span>
            </div>
            <span className="text-xs text-gray-500">
              {formatFileSize(uploadedFile.size)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
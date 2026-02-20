'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, Upload } from 'lucide-react';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

const ACCEPTED_TYPES = {
  'text/plain': ['.txt'],
  'text/markdown': ['.md'],
  'application/pdf': ['.pdf'],
};

export function FileUploader({ onFileSelect, isProcessing }: FileUploaderProps) {
  const onDrop = useCallback((files: File[]) => {
    if (files.length > 0) onFileSelect(files[0]);
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
    disabled: isProcessing,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
        ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}
    >
      <input {...getInputProps()} />
      <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
      <p className="font-medium">파일을 드래그하거나 클릭하여 업로드</p>
      <p className="text-sm text-muted-foreground mt-1">
        지원 형식: .txt, .md, .pdf (최대 5MB)
      </p>
    </div>
  );
}
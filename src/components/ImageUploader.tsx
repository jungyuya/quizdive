'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Upload, Image, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  onUpload: (file: File) => void;
  isUploading: boolean;
}

export function ImageUploader({ onUpload, isUploading }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        setPreview(URL.createObjectURL(file));
        onUpload(file);
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: isUploading,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-xl mx-auto"
    >
      <div
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50',
          isUploading && 'pointer-events-none opacity-50'
        )}
      >
        <input {...getInputProps()} />

        {preview ? (
          <div className="space-y-4">
            <img
              src={preview}
              alt="Preview"
              className="max-h-64 mx-auto rounded-lg shadow-md"
            />
            {isUploading && (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>업로드 중...</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-8">
            {isDragActive ? (
              <Image className="w-16 h-16 mx-auto text-primary" />
            ) : (
              <Upload className="w-16 h-16 mx-auto text-muted-foreground" />
            )}
            <div>
              <p className="text-lg font-medium">
                {isDragActive
                  ? '여기에 놓으세요!'
                  : '이미지를 드래그하거나 클릭하세요'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                PNG, JPG, JPEG, WEBP (최대 10MB)
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
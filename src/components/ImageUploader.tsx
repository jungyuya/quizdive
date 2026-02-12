'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Upload, Image, Loader2, Camera } from 'lucide-react';
import { useRef } from 'react';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  onUpload: (file: File) => void;
  isUploading: boolean;
}

export function ImageUploader({ onUpload, isUploading }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      onUpload(file);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-xl mx-auto"
    >
      <div
        {...getRootProps()}
        aria-label="이미지 업로드 영역. 클릭하거나 파일을 끌어다 놓으세요."
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
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
      {/* 모바일 카메라 버튼 (md 이상에서 숨김) */}
      <div className="md:hidden">
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleCameraCapture}
          className="hidden"
        />
        <button
          onClick={() => cameraInputRef.current?.click()}
          disabled={isUploading}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors text-muted-foreground hover:text-primary"
        >
          <Camera className="w-5 h-5" />
          <span className="font-medium">카메라로 촬영</span>
        </button>
      </div>
    </motion.div>
  );
}
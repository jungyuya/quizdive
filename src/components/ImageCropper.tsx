'use client';

import { useState, useRef, useCallback } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { motion } from 'framer-motion';
import { Crop as CropIcon, RotateCw, Check, X, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageCropperProps {
    imageSrc: string;
    onCropComplete: (croppedBlob: Blob) => void;
    onSkip: () => void;
    onCancel: () => void;
}

// 크롭 영역으로 이미지 자르기 유틸
async function getCroppedImg(
    image: HTMLImageElement,
    pixelCrop: PixelCrop
): Promise<Blob> {
    const canvas = document.createElement('canvas');
    // 실제 이미지 크기와 표시 크기의 비율 계산
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // 최대 해상도 제한 (OCR 처리 속도 및 용량 최적화)
    const MAX_DIMENSION = 1280;

    let targetWidth = pixelCrop.width * scaleX;
    let targetHeight = pixelCrop.height * scaleY;

    // 비율 유지하며 리사이징
    if (targetWidth > MAX_DIMENSION || targetHeight > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / targetWidth, MAX_DIMENSION / targetHeight);
        targetWidth *= ratio;
        targetHeight *= ratio;
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d')!;

    // 이미지 품질 보정을 위한 스무딩 설정
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
        image,
        pixelCrop.x * scaleX,
        pixelCrop.y * scaleY,
        pixelCrop.width * scaleX,
        pixelCrop.height * scaleY,
        0, 0,
        targetWidth,
        targetHeight
    );

    return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.9);
    });
}

export function ImageCropper({
    imageSrc, onCropComplete, onSkip, onCancel,
}: ImageCropperProps) {
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const imgRef = useRef<HTMLImageElement>(null);

    // 이미지 로드 시 기본 크롭 영역 (중앙 80%)
    const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget;
        const defaultCrop: Crop = {
            unit: '%',
            x: 10,
            y: 10,
            width: 80,
            height: 80,
        };
        setCrop(defaultCrop);
    }, []);

    const handleConfirm = async () => {
        if (!completedCrop || !imgRef.current) return;
        const croppedBlob = await getCroppedImg(imgRef.current, completedCrop);
        onCropComplete(croppedBlob);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-xl mx-auto"
        >
            {/* 안내 */}
            <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                <Move className="w-4 h-4" />
                <span>드래그하여 OCR 범위를 지정하세요</span>
            </div>

            {/* 크롭 영역 */}
            <div className="rounded-xl overflow-hidden mb-4 bg-black/5 dark:bg-black/20">
                <ReactCrop
                    crop={crop}
                    onChange={(c) => setCrop(c)}
                    onComplete={(c) => setCompletedCrop(c)}
                    className="max-h-[60vh]"
                >
                    <img
                        ref={imgRef}
                        src={imageSrc}
                        alt="크롭할 이미지"
                        onLoad={onImageLoad}
                        className="max-w-full max-h-[60vh] mx-auto"
                        style={{ display: 'block' }}
                    />
                </ReactCrop>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3">
                <Button onClick={onCancel} variant="ghost" className="gap-1">
                    <X className="w-4 h-4" /> 취소
                </Button>
                <Button onClick={onSkip} variant="outline" className="flex-1">
                    전체 이미지 사용
                </Button>
                <Button
                    onClick={handleConfirm}
                    disabled={!completedCrop}
                    className="flex-1 gap-1"
                >
                    <CropIcon className="w-4 h-4" /> 크롭 완료
                </Button>
            </div>
        </motion.div>
    );
}
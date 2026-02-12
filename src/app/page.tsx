'use client';

// 1. useState 임포트 추가 및 useRef, useCallback 통합
import { useCallback, useState, useRef, useEffect } from 'react';
import { ImageCropper } from '@/components/ImageCropper';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuizStore } from '@/store/useQuizStore';
import { ImageUploader } from '@/components/ImageUploader';
import { ProcessingSteps } from '@/components/ProcessingSteps';
import { FlashcardList } from '@/components/FlashcardList';
import { Button } from '@/components/ui/button';
import { saveCards } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { HeroSection } from '@/components/HeroSection';
import { ErrorFeedback } from '@/components/ErrorFeedback';

export default function HomePage() {
  const {
    step,
    processingSubStep,
    cards,
    error,
    setStep,
    setProcessingSubStep,
    setImageUrl,
    setOcrText,
    setCards,
    setError,
    reset,
  } = useQuizStore();

  // 상태 선언을 컴포넌트 상단으로 모음
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const uploadRef = useRef<HTMLDivElement>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      try {
        setStep('processing');
        setError(null);

        // 1단계: 업로드
        setProcessingSubStep('uploading');
        const uploadForm = new FormData();
        uploadForm.append('file', file);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: uploadForm,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error);
        setImageUrl(uploadData.imageUrl);

        // 2단계: OCR
        setProcessingSubStep('ocr');
        const ocrRes = await fetch('/api/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: uploadData.imageUrl }),
        });
        const remaining = ocrRes.headers.get('X-RateLimit-Remaining');
        if (remaining) {
          console.log(`오늘 남은 스캔: ${remaining}회`);
          // 선택: UI에 표시
        }
        const ocrData = await ocrRes.json();
        if (!ocrRes.ok) throw new Error(ocrData.error);
        setOcrText(ocrData.text);

        // 3단계: AI 생성
        setProcessingSubStep('generating');
        const genRes = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: ocrData.text }),
        });
        const genData = await genRes.json();
        if (!genRes.ok) throw new Error(genData.error);

        // 카드 생성 및 저장
        const newCards = genData.cards.map(
          (c: { question: string; answer: string }) => ({
            id: uuidv4(),
            question: c.question,
            answer: c.answer,
            createdAt: new Date(),
            reviewCount: 0,
          })
        );

        setCards(newCards);
        await saveCards(newCards);

        setStep('complete');
        setProcessingSubStep(null);
      } catch (err: any) {
        console.error(err);
        setError(err.message || '처리 중 오류가 발생했습니다');
        setStep('upload');
        setProcessingSubStep(null);
      }
    },
    [setStep, setProcessingSubStep, setImageUrl, setOcrText, setCards, setError]
  );

  const scrollToUpload = () => {
    uploadRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleImageSelect = (file: File) => {
    setOriginalFile(file);
    // 기존 URL 메모리 해제 후 생성
    if (cropImage) URL.revokeObjectURL(cropImage);
    setCropImage(URL.createObjectURL(file));
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    const file = new File([croppedBlob], 'cropped.jpg', { type: 'image/jpeg' });
    setCropImage(null);
    await handleUpload(file);
  };

  const handleCropSkip = async () => {
    setCropImage(null);
    if (originalFile) await handleUpload(originalFile);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* 1. 이미지 크로퍼 모달 (최상단) */}
      {cropImage && (
        <ImageCropper
          imageSrc={cropImage}
          onCropComplete={handleCropComplete}
          onSkip={handleCropSkip}
          onCancel={() => {
            setCropImage(null);
            URL.revokeObjectURL(cropImage); // 취소 시 메모리 해제
          }}
        />
      )}

      {/* 2. 히어로 섹션: 업로드 단계에서만 노출 */}
      {step === 'upload' && <HeroSection onScrollToUpload={scrollToUpload} />}

      <div ref={uploadRef} className="max-w-4xl mx-auto p-8">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ErrorFeedback message={error} onRetry={reset} />
            </motion.div>
          )}

          {/* 3. 업로드 섹션: step이 upload일 때만 표시하며 handleImageSelect 호출 */}
          {step === 'upload' && !cropImage && (
            <motion.div
              key="uploader"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ImageUploader onUpload={handleImageSelect} isUploading={false} />
            </motion.div>
          )}

          {/* 4. 처리 중 단계 */}
          {step === 'processing' && processingSubStep && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ProcessingSteps currentStep={processingSubStep} />
            </motion.div>
          )}

          {/* 5. 완료 단계 */}
          {step === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">
                  생성된 카드 ({cards.length}개)
                </h2>
                <Button onClick={reset} variant="outline">
                  새로 만들기
                </Button>
              </div>
              <FlashcardList cards={cards} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
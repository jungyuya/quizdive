'use client';

import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { useQuizStore } from '@/store/useQuizStore';
import { ImageUploader } from '@/components/ImageUploader';
import { ProcessingSteps } from '@/components/ProcessingSteps';
import { FlashcardList } from '@/components/FlashcardList';
import { Button } from '@/components/ui/button';
import { saveCards } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { HeroSection } from '@/components/HeroSection';
import { useRef } from 'react';
import { ErrorFeedback } from '@/components/ErrorFeedback';
import { AnimatePresence } from 'framer-motion';

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

        // 카드에 ID 추가 및 저장
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
        await saveCards(newCards); // IndexedDB 저장

        setStep('complete');
        setProcessingSubStep(null);
      } catch (err: any) {
        console.error(err);
        setError(err.message || '처리 중 오류가 발생했습니다');
        setStep('upload');
        setProcessingSubStep(null);
      }
    },
    [
      setStep,
      setProcessingSubStep,
      setImageUrl,
      setOcrText,
      setCards,
      setError,
    ]
  );

  const uploadRef = useRef<HTMLDivElement>(null);

  const scrollToUpload = () => {
    uploadRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* 히어로: 업로드 전 상태에서만 표시 */}
      {step === 'upload' && <HeroSection onScrollToUpload={scrollToUpload} />}
      <div ref={uploadRef} className="max-w-4xl mx-auto p-8">

        <AnimatePresence mode="wait">
          {error && (
            <ErrorFeedback message={error} onRetry={reset} />
          )}

          {step === 'upload' && (
            <ImageUploader onUpload={handleUpload} isUploading={false} />
          )}

          {step === 'processing' && processingSubStep && (
            <ProcessingSteps currentStep={processingSubStep} />
          )}

          {step === 'complete' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">
                  생성된 카드 ({cards.length}개)
                </h2>
                <Button onClick={reset} variant="outline">
                  새로 만들기
                </Button>
              </div>
              <FlashcardList cards={cards} />
            </div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
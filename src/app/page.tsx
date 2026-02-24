'use client';

// 1. useState 임포트 추가 및 useRef, useCallback 통합
import { useCallback, useState, useRef, useEffect, useMemo } from 'react';
import { ImageCropper } from '@/components/ImageCropper';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuizStore } from '@/store/useQuizStore';
import { ImageUploader } from '@/components/ImageUploader';
import { ManualCardForm } from '@/components/ManualCardForm';
import { FileUploader } from '@/components/FileUploader';
import { parseFile } from '@/lib/file-parser';
import { chunkText } from '@/lib/text-chunker';
import { useStreamCards } from '@/hooks/useStreamCards';
import { toast } from 'sonner';
import { ProcessingSteps } from '@/components/ProcessingSteps';
import { FlashcardList } from '@/components/FlashcardList';
import { Button } from '@/components/ui/button';
// saveCards는 card-service를 통해 호출
import { v4 as uuidv4 } from 'uuid';
import { HeroSection } from '@/components/HeroSection';
import { ErrorFeedback } from '@/components/ErrorFeedback';
import { resizeImage, fileToBase64 } from '@/lib/image-utils';
import { useAuth } from '@/components/AuthProvider';
import { getAllDecks, getDeckWithCards } from '@/lib/supabase/decks';
import type { Deck, Flashcard } from '@/types';
import { createCardService } from '@/lib/card-service';
import { getUserRole, getMaxChunks } from '@/lib/supabase/profiles';

export default function HomePage() {
  const {
    step,
    processingSubStep,
    cards: storeCards,
    error,
    setStep,
    setProcessingSubStep,
    setImageUrl,
    setOcrText,
    setCards,
    setError,
    reset,
  } = useQuizStore();

  const { cards: streamedCards, isStreaming, startStream } = useStreamCards();
  const displayCards = isStreaming ? streamedCards : storeCards;

  // 상태 선언을 컴포넌트 상단으로 모음
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const uploadRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const cardService = useMemo(() => createCardService(user), [user]);
  const [inputMode, setInputMode] = useState<'image' | 'manual' | 'file'>('image');
  const [chunkProgress, setChunkProgress] = useState<{ current: number; total: number } | undefined>(undefined);

  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string>('all');

  const handleUpload = useCallback(async (file: File) => {
    try {
      setStep('processing');
      setError(null);

      // 1단계: 업로드 (기존과 동일)
      setProcessingSubStep('uploading');
      const uploadForm = new FormData();
      uploadForm.append('file', file);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: uploadForm });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error);
      setImageUrl(uploadData.imageUrl);

      // 2단계: OCR (개선 — Base64 직접 전달 복구)
      setProcessingSubStep('ocr');

      const imageBase64 = await fileToBase64(file);  // ✅ 방안 D: File → Base64

      const ocrRes = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: uploadData.imageUrl, // 하위 호환용
          imageBase64,                   // ✅ 복구: 직접 전달하여 서버 COS 다운로드 생략
        }),
      });

      // 504 Gateway Timeout 처리
      if (ocrRes.status === 504) {
        throw new Error('이미지가 너무 크거나 처리가 지연되고 있습니다. (시간 초과)');
      }

      const remaining = ocrRes.headers.get('X-RateLimit-Remaining');
      if (remaining) {
        console.log(`오늘 남은 스캔: ${remaining}회`);
      }

      let ocrData;
      try {
        ocrData = await ocrRes.json();
      } catch (e) {
        throw new Error(`서버 응답을 분석할 수 없습니다. (Status: ${ocrRes.status})`);
      }

      if (!ocrRes.ok) throw new Error(ocrData.error);
      setOcrText(ocrData.text);

      // 3단계: AI 생성 (스트리밍 적용)
      setProcessingSubStep('generating');

      const streamCards = await startStream(ocrData.text);

      setCards(streamCards);
      await cardService.save(streamCards);

      setStep('complete');
      setProcessingSubStep(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || '처리 중 오류가 발생했습니다');
      setStep('upload');
      setProcessingSubStep(null);
    }
  },
    [setStep, setProcessingSubStep, setImageUrl, setOcrText, setCards, setError, cardService]
  );

  const scrollToUpload = () => {
    uploadRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleImageSelect = (file: File) => {
    setOriginalFile(file);
    // 기존 URL 메모리 해제 후 생성
    if (cropImage) URL.revokeObjectURL(cropImage);
    setCropImage(URL.createObjectURL(file));
    // 모바일에서 크로퍼 영역이 보이도록 맨 위로 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    const file = new File([croppedBlob], 'cropped.jpg', { type: 'image/jpeg' });
    setCropImage(null);
    await handleUpload(file);
  };

  const handleCropSkip = async () => {
    setCropImage(null);
    if (originalFile) {
      const optimized = await resizeImage(originalFile);  // ✅ 방안 B: 리사이징
      await handleUpload(optimized);
    }
  };

  // ✅ Step 1.2: 수동 카드 저장 핸들러 — 기존 uuidv4, cardService 재사용
  const handleManualSubmit = async (question: string, answer: string) => {
    const card: Flashcard = {
      id: uuidv4(),
      question,
      answer,
      createdAt: new Date(),
      reviewCount: 0,
      source: 'manual',
    };
    await cardService.save([card]);
  };

  const handleFileSelect = async (file: File) => {
    try {
      setStep('processing');
      setProcessingSubStep('uploading');
      setError(null);
      setChunkProgress(undefined);

      // Step 3.11.3: 비로그인 체크
      if (!user) {
        toast.info('파일 업로드는 로그인 후 이용 가능합니다.');
        setStep('upload');
        return;
      }

      // Step 3.11.3: 사용자 role 조회 → 최대 청크 수 결정
      const role = await getUserRole();
      const maxChunks = getMaxChunks(role);

      // 1. 파일 파싱 (클라이언트)
      const text = await parseFile(file);

      // 2. 청킹 (클라이언트)
      let chunks = chunkText(text);

      // 대용량 파일 제한: role별 최대 청크 수 적용
      if (chunks.length > maxChunks) {
        toast.info(
          `현재 등급에서는 최대 ${maxChunks}개 구간까지 처리 가능합니다. (${chunks.length}→${maxChunks})`
        );
        chunks = chunks.slice(0, maxChunks);
      }

      setProcessingSubStep('generating');
      setChunkProgress({ current: 0, total: chunks.length });

      // 3. 각 청크를 순차적으로 Gemini에 전달 (중간 결과 누적 표시)
      const allCards: Flashcard[] = [];
      for (let i = 0; i < chunks.length; i++) {
        setChunkProgress({ current: i + 1, total: chunks.length });

        const genRes = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: chunks[i] }),
        });
        const genData = await genRes.json();
        if (!genRes.ok) throw new Error(genData.error);

        const newCards = genData.cards.map(
          (c: { question: string; answer: string }) => ({
            id: uuidv4(),
            question: c.question,
            answer: c.answer,
            createdAt: new Date(),
            reviewCount: 0,
            source: 'file' as const,
          })
        );
        allCards.push(...newCards);
        // 중간 결과를 즉시 반영하여 사용자가 진행 상황 확인 가능
        setCards([...allCards]);
      }

      await cardService.save(allCards);
      setStep('complete');
      setProcessingSubStep(null);
      setChunkProgress(undefined);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || '파일 처리 중 오류가 발생했습니다');
      setError(err.message || '파일 처리 중 오류가 발생했습니다');
      setStep('upload');
      setProcessingSubStep(null);
      setChunkProgress(undefined);
    }
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

      <div ref={uploadRef} className="max-w-4xl mx-auto pt-2 pb-8 px-8">
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
              {/* ✅ Step 1.2: 입력 모드 전환 — 세그먼트 컨트롤 */}
              <div className="flex justify-center mb-6">
                <div className="inline-flex items-center p-1 rounded-xl bg-muted gap-1">
                  <button
                    onClick={() => setInputMode('image')}
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${inputMode === 'image'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    <span>📸</span>
                    <span>이미지로 생성</span>
                  </button>
                  <button
                    onClick={() => setInputMode('manual')}
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${inputMode === 'manual'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    <span>✏️</span>
                    <span>직접 생성</span>
                  </button>
                  <button
                    onClick={() => {
                      if (!user) {
                        toast.info('📄 파일 업로드는 로그인 후 이용 가능합니다.');
                        return;
                      }
                      setInputMode('file');
                    }}
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${inputMode === 'file'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    <span>📄</span>
                    <span>파일로 생성</span>
                  </button>
                </div>
              </div>

              {/* ✅ Step 1.2: 모드에 따라 컴포넌트 분기 */}
              <AnimatePresence mode="wait">
                {inputMode === 'image' ? (
                  <motion.div
                    key="image-uploader"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <ImageUploader onUpload={handleImageSelect} isUploading={false} />
                  </motion.div>
                ) : inputMode === 'manual' ? (
                  <motion.div
                    key="manual-form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <ManualCardForm
                      onSubmit={handleManualSubmit}
                      onClose={() => setInputMode('image')}
                    />
                  </motion.div>
                ) : (
                  <motion.div key="file-uploader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <FileUploader onFileSelect={handleFileSelect} isProcessing={false} />
                  </motion.div>
                )}
              </AnimatePresence>
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
              <ProcessingSteps
                currentStep={processingSubStep}
                mode={inputMode === 'file' ? 'file' : 'image'}
                chunkProgress={chunkProgress}
              />

              {/* ✅ Step 4.4: 스트리밍 중 실시간 카드 표시 */}
              {isStreaming && streamedCards.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 space-y-4"
                >
                  <p className="text-sm text-muted-foreground">
                    🃏 생성 중... ({streamedCards.length}장)
                  </p>
                  <FlashcardList cards={streamedCards} />
                </motion.div>
              )}
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
                  생성된 카드 ({displayCards.length}개)
                </h2>
                <Button onClick={reset} variant="outline">
                  새로 만들기
                </Button>
              </div>
              <FlashcardList cards={displayCards} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
import { create } from 'zustand';
import type { Flashcard } from '@/types';

type Step = 'upload' | 'processing' | 'review' | 'complete';
type ProcessingSubStep = 'uploading' | 'ocr' | 'generating';

interface QuizState {
  // 현재 단계
  step: Step;
  processingSubStep: ProcessingSubStep | null;
  
  // 데이터
  imageUrl: string | null;
  ocrText: string;
  cards: Flashcard[];
  
  // 에러
  error: string | null;
  
  // 액션
  setStep: (step: Step) => void;
  setProcessingSubStep: (subStep: ProcessingSubStep | null) => void;
  setImageUrl: (url: string) => void;
  setOcrText: (text: string) => void;
  setCards: (cards: Flashcard[]) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useQuizStore = create<QuizState>((set) => ({
  step: 'upload',
  processingSubStep: null,
  imageUrl: null,
  ocrText: '',
  cards: [],
  error: null,

  setStep: (step) => set({ step }),
  setProcessingSubStep: (processingSubStep) => set({ processingSubStep }),
  setImageUrl: (imageUrl) => set({ imageUrl }),
  setOcrText: (ocrText) => set({ ocrText }),
  setCards: (cards) => set({ cards }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      step: 'upload',
      processingSubStep: null,
      imageUrl: null,
      ocrText: '',
      cards: [],
      error: null,
    }),
}));
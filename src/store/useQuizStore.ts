import { create } from 'zustand';
import type { Flashcard } from '@/types';

type Step = 'upload' | 'processing' | 'review' | 'complete';
type ProcessingSubStep = 'uploading' | 'ocr' | 'generating';

interface ReviewResult {
  cardId: string;
  correct: boolean;
}

interface QuizState {
  // === 기존 상태 (유지) ===
  step: Step;
  processingSubStep: ProcessingSubStep | null;
  imageUrl: string | null;
  ocrText: string;
  cards: Flashcard[];
  error: string | null;

  // === 복습 상태 (추가) ===
  reviewCards: Flashcard[];
  reviewIndex: number;
  reviewResults: ReviewResult[];
  reviewStartTime: number | null;

  // === 기존 액션 (유지) ===
  setStep: (step: Step) => void;
  setProcessingSubStep: (subStep: ProcessingSubStep | null) => void;
  setImageUrl: (url: string) => void;
  setOcrText: (text: string) => void;
  setCards: (cards: Flashcard[]) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  // === 복습 액션 (추가) ===
  startReview: (cards: Flashcard[]) => void;
  nextReviewCard: () => void;
  markReviewResult: (cardId: string, correct: boolean) => void;
  resetReview: () => void;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  // 기존 초기값
  step: 'upload',
  processingSubStep: null,
  imageUrl: null,
  ocrText: '',
  cards: [],
  error: null,

  // 복습 초기값
  reviewCards: [],
  reviewIndex: 0,
  reviewResults: [],
  reviewStartTime: null,

  // 기존 액션 (유지)
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

  // 복습 액션
  startReview: (cards) =>
    set({
      reviewCards: cards,
      reviewIndex: 0,
      reviewResults: [],
      reviewStartTime: Date.now(),
    }),

  nextReviewCard: () =>
    set((state) => ({
      reviewIndex: Math.min(state.reviewIndex + 1, state.reviewCards.length),
    })),

  markReviewResult: (cardId, correct) =>
    set((state) => ({
      reviewResults: [...state.reviewResults, { cardId, correct }],
    })),

  resetReview: () =>
    set({
      reviewCards: [],
      reviewIndex: 0,
      reviewResults: [],
      reviewStartTime: null,
    }),
}));
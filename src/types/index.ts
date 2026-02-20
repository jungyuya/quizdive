export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  createdAt: Date;
  lastReviewedAt?: Date;
  reviewCount: number;
  nextReviewAt?: Date;
  source?: 'ocr' | 'manual' | 'file'; // 카드 생성 출처
}

export interface Deck {
  id: string;
  name: string;
  description?: string;
  cardIds: string[];
  createdAt: Date;
}

export interface UploadResponse {
  imageUrl: string;
}

export interface OcrResponse {
  text: string;
}

export interface GenerateResponse {
  cards: Array<{ question: string; answer: string }>;
}
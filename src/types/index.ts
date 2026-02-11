export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  createdAt: Date;
  lastReviewedAt?: Date;
  reviewCount: number;
  nextReviewAt?: Date;
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
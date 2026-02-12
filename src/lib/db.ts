import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Flashcard, Deck } from '@/types';

interface QuizDB extends DBSchema {
  cards: {
    key: string;
    value: Flashcard;
    indexes: { 'by-created': Date };
  };
  decks: {
    key: string;
    value: Deck;
  };
}

let dbPromise: Promise<IDBPDatabase<QuizDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<QuizDB>('quizdive-db', 1, {
      upgrade(db) {
        const cardStore = db.createObjectStore('cards', { keyPath: 'id' });
        cardStore.createIndex('by-created', 'createdAt');

        db.createObjectStore('decks', { keyPath: 'id' });
      },
    });
  }
  return dbPromise;
}

// ===== 카드 CRUD =====

export async function saveCards(cards: Flashcard[]) {
  const db = await getDB();
  const tx = db.transaction('cards', 'readwrite');
  await Promise.all(cards.map((card) => tx.store.put(card)));
  await tx.done;
}

export async function getAllCards(): Promise<Flashcard[]> {
  const db = await getDB();
  return db.getAllFromIndex('cards', 'by-created');
}

export async function getCard(id: string): Promise<Flashcard | undefined> {
  const db = await getDB();
  return db.get('cards', id);
}

export async function deleteCard(id: string) {
  const db = await getDB();
  return db.delete('cards', id);
}

export async function deleteAllCards() {
  const db = await getDB();
  const tx = db.transaction('cards', 'readwrite');
  await tx.store.clear();
  await tx.done;
}

export async function updateCard(card: Flashcard) {
  const db = await getDB();
  return db.put('cards', card);
}

// ===== 오프라인 지원용 =====

export async function getCardsForReview(): Promise<Flashcard[]> {
  const cards = await getAllCards();
  const now = new Date();

  return cards.filter((card) => {
    if (!card.nextReviewAt) return true;
    return new Date(card.nextReviewAt) <= now;
  });
}
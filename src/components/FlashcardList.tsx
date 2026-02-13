'use client';

import { motion } from 'framer-motion';
import { FlashcardItem } from './FlashcardItem';
import type { Flashcard } from '@/types';

interface FlashcardListProps {
  cards: Flashcard[];
  onDelete?: (id: string) => void;
  onEdit?: (card: Flashcard) => void;
}

export function FlashcardList({ cards, onDelete, onEdit }: FlashcardListProps) {
  if (cards.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        생성된 플래시카드가 없습니다
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-1 gap-4 max-w-2xl mx-auto"
    >
      {cards.map((card, index) => (
        <motion.div
          key={card.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <FlashcardItem card={card} onDelete={onDelete} onEdit={onEdit} />
        </motion.div>
      ))}
    </motion.div>
  );
}
'use client';

import { motion } from 'framer-motion';
import { FlashcardItem } from './FlashcardItem';
import type { Flashcard } from '@/types';

interface FlashcardListProps {
  cards: Flashcard[];
  onDelete?: (id: string) => void;
}

export function FlashcardList({ cards, onDelete }: FlashcardListProps) {
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
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      {cards.map((card, index) => (
        <motion.div
          key={card.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <FlashcardItem card={card} onDelete={onDelete} />
        </motion.div>
      ))}
    </motion.div>
  );
}
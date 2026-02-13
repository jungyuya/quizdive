'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Trash2, Pencil } from 'lucide-react';
import type { Flashcard } from '@/types';

interface FlashcardItemProps {
    card: Flashcard;
    onDelete?: (id: string) => void;
    onEdit?: (card: Flashcard) => void;
}

export function FlashcardItem({ card, onDelete, onEdit }: FlashcardItemProps) {
    const [isFlipped, setIsFlipped] = useState(false);

    const actionButtons = (onDelete || onEdit) && (
        <div className="shrink-0 flex items-center gap-0.5">
            {onEdit && (
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit(card); }}
                    className="p-1.5 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 text-muted-foreground hover:text-blue-500 transition-colors"
                    aria-label="카드 편집"
                >
                    <Pencil className="w-3.5 h-3.5" />
                </button>
            )}
            {onDelete && (
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(card.id); }}
                    className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-500 transition-colors"
                    aria-label="카드 삭제"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileTap={{ scale: 0.98 }}
        >
            <div
                onClick={() => setIsFlipped(!isFlipped)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setIsFlipped(!isFlipped);
                    }
                }}
                role="button"
                tabIndex={0}
                aria-label={isFlipped ? `답변: ${card.answer}` : `질문: ${card.question}. 뒤집으려면 Enter를 누르세요`}
                className="w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
            >
                <AnimatePresence mode="wait" initial={false}>
                    {!isFlipped ? (
                        /* 앞면 (질문) */
                        <motion.div
                            key="question"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Card
                                className="p-5 md:p-6 flex items-start gap-3
                                    bg-gradient-to-br from-primary/5 to-primary/10
                                    dark:from-primary/10 dark:to-primary/20"
                            >
                                <span className="shrink-0 w-7 h-7 rounded-full bg-primary/20 text-primary text-sm font-bold flex items-center justify-center mt-0.5">
                                    Q
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-base md:text-lg font-medium break-words leading-relaxed">
                                        {card.question}
                                    </p>
                                </div>
                                {actionButtons}
                            </Card>
                        </motion.div>
                    ) : (
                        /* 뒷면 (답변) */
                        <motion.div
                            key="answer"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Card
                                className="p-5 md:p-6 flex items-start gap-3
                                    bg-gradient-to-br from-green-50 to-green-100
                                    dark:from-green-900/20 dark:to-green-800/20"
                            >
                                <span className="shrink-0 w-7 h-7 rounded-full bg-green-500/20 text-green-600 dark:text-green-400 text-sm font-bold flex items-center justify-center mt-0.5">
                                    A
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-base md:text-lg break-words leading-relaxed">
                                        {card.answer}
                                    </p>
                                </div>
                                {actionButtons}
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* 클릭 힌트 */}
            <p className="text-center text-xs text-muted-foreground/60 mt-1.5">
                {isFlipped ? '클릭하여 질문 보기' : '클릭하여 답변 보기'}
            </p>
        </motion.div>
    );
}
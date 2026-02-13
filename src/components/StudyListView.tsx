'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Pencil } from 'lucide-react';
import type { Flashcard } from '@/types';

interface StudyListViewProps {
    cards: Flashcard[];
    onEdit?: (card: Flashcard) => void;
}

export function StudyListView({ cards, onEdit }: StudyListViewProps) {
    if (cards.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                표시할 카드가 없습니다
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3 max-w-2xl mx-auto"
        >
            {cards.map((card, index) => (
                <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                >
                    <Card className="overflow-hidden">
                        {/* 질문 */}
                        <div className="px-5 py-4 flex items-start gap-3
                            bg-gradient-to-br from-primary/5 to-primary/10
                            dark:from-primary/10 dark:to-primary/20"
                        >
                            <span className="shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                                Q
                            </span>
                            <p className="flex-1 text-base font-medium break-words leading-relaxed">
                                {card.question}
                            </p>
                            {onEdit && (
                                <button
                                    onClick={() => onEdit(card)}
                                    className="shrink-0 p-1.5 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 text-muted-foreground hover:text-blue-500 transition-colors"
                                    aria-label="카드 편집"
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* 구분선 */}
                        <div className="h-px bg-border/50" />

                        {/* 답변 */}
                        <div className="px-5 py-4 flex items-start gap-3
                            bg-gradient-to-br from-green-50/50 to-green-100/50
                            dark:from-green-900/10 dark:to-green-800/10"
                        >
                            <span className="shrink-0 w-6 h-6 rounded-full bg-green-500/20 text-green-600 dark:text-green-400 text-xs font-bold flex items-center justify-center mt-0.5">
                                A
                            </span>
                            <p className="flex-1 text-base break-words leading-relaxed text-foreground/90">
                                {card.answer}
                            </p>
                        </div>
                    </Card>
                </motion.div>
            ))}
        </motion.div>
    );
}

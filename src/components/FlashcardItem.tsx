'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';
import type { Flashcard } from '@/types';

interface FlashcardItemProps {
    card: Flashcard;
    onDelete?: (id: string) => void;
}

export function FlashcardItem({ card, onDelete }: FlashcardItemProps) {
    const [isFlipped, setIsFlipped] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileTap={{ scale: 0.97 }}  // 터치 시 살짝 줄어드는 피드백
            className="perspective-1000"
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
                className="relative w-full h-48 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
                style={{ transformStyle: 'preserve-3d' }}
            >
                <motion.div
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.5 }}
                    style={{ transformStyle: 'preserve-3d' }}
                    className="w-full h-full"
                >
                    {/* 앞면 (질문) */}
                    <Card
                        className="absolute inset-0 p-4 md:p-6 flex items-center justify-center text-center overflow-hidden
                            bg-gradient-to-br from-primary/5 to-primary/10
                            dark:from-primary/10 dark:to-primary/20"
                        style={{ backfaceVisibility: 'hidden' }}
                    >
                        {onDelete && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(card.id); }}
                                className="absolute top-2 right-2 p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-500 transition-colors"
                                aria-label="카드 삭제"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        )}
                        <div className="w-full max-h-full overflow-y-auto px-1">
                            <p className="text-xs text-muted-foreground mb-2">질문</p>
                            <p className="text-base md:text-lg font-medium break-words">{card.question}</p>
                        </div>
                    </Card>

                    {/* 뒷면 (답변) */}
                    <Card
                        className="absolute inset-0 p-4 md:p-6 flex items-center justify-center text-center overflow-hidden
                            bg-gradient-to-br from-green-50 to-green-100
                            dark:from-green-900/20 dark:to-green-800/20"
                        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                        <div className="w-full max-h-full overflow-y-auto px-1">
                            <p className="text-xs text-muted-foreground mb-2">답변</p>
                            <p className="text-base md:text-lg break-words">{card.answer}</p>
                        </div>
                    </Card>
                </motion.div>
            </div>
        </motion.div>
    );
}
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
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
            className="perspective-1000"
        >
            <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="relative w-full h-48 cursor-pointer"
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
                        className="absolute inset-0 p-6 flex items-center justify-center text-center backface-hidden bg-gradient-to-br from-primary/5 to-primary/10"
                        style={{ backfaceVisibility: 'hidden' }}
                    >
                        <div>
                            <p className="text-xs text-muted-foreground mb-2">질문</p>
                            <p className="text-lg font-medium">{card.question}</p>
                        </div>
                    </Card>

                    {/* 뒷면 (답변) */}
                    <Card
                        className="absolute inset-0 p-6 flex items-center justify-center text-center bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20"
                        style={{
                            backfaceVisibility: 'hidden',
                            transform: 'rotateY(180deg)',
                        }}
                    >
                        <div>
                            <p className="text-xs text-muted-foreground mb-2">답변</p>
                            <p className="text-lg">{card.answer}</p>
                        </div>
                    </Card>
                </motion.div>
            </div>
        </motion.div>
    );
}
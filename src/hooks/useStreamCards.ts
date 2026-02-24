import { useState, useCallback } from 'react';
import type { Flashcard } from '@/types';

export function useStreamCards() {
    const [cards, setCards] = useState<Flashcard[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);

    const startStream = useCallback(async (text: string): Promise<Flashcard[]> => {
        setCards([]);
        setIsStreaming(true);
        const finalCards: Flashcard[] = [];

        try {
            const res = await fetch('/api/generate-stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            });

            const reader = res.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) throw new Error('Stream not available');

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ') && !line.includes('[DONE]')) {
                        try {
                            const card = JSON.parse(line.slice(6));
                            const flashcard: Flashcard = {
                                id: crypto.randomUUID(),
                                question: card.question,
                                answer: card.answer,
                                createdAt: new Date(),
                                reviewCount: 0,
                                source: 'ocr',
                            };
                            finalCards.push(flashcard);
                            setCards([...finalCards]);
                        } catch {
                            // 무시
                        }
                    }
                }
            }
        } finally {
            setIsStreaming(false);
        }
        return finalCards;
    }, []);

    return { cards, isStreaming, startStream };
}
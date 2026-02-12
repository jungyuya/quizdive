'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, BookOpen } from 'lucide-react';
import { FlashcardList } from '@/components/FlashcardList';
import { Button } from '@/components/ui/button';
import { getAllCards, deleteCard, deleteAllCards } from '@/lib/db';
import type { Flashcard } from '@/types';

// 날짜별 그룹핑 헬퍼
function groupByDate(cards: Flashcard[]): Record<string, Flashcard[]> {
    const groups: Record<string, Flashcard[]> = {};
    const now = new Date();
    const today = now.toDateString();
    const yesterday = new Date(now.getTime() - 86400000).toDateString();

    cards
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .forEach((card) => {
            const dateStr = new Date(card.createdAt).toDateString();
            let label: string;

            if (dateStr === today) label = '🗓️ 오늘';
            else if (dateStr === yesterday) label = '🗓️ 어제';
            else label = `🗓️ ${new Date(card.createdAt).toLocaleDateString('ko-KR')}`;

            if (!groups[label]) groups[label] = [];
            groups[label].push(card);
        });

    return groups;
}

export default function HistoryPage() {
    const [cards, setCards] = useState<Flashcard[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadCards = useCallback(async () => {
        setIsLoading(true);
        const allCards = await getAllCards();
        setCards(allCards);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadCards();
    }, [loadCards]);

    const handleDelete = async (id: string) => {
        await deleteCard(id);
        setCards((prev) => prev.filter((c) => c.id !== id));
    };

    const handleDeleteAll = async () => {
        if (!window.confirm('모든 카드를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
        await deleteAllCards();
        setCards([]);
    };

    const grouped = groupByDate(cards);

    return (
        <main className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-8">
            <div className="max-w-4xl mx-auto">
                {/* 헤더 */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-between items-center mb-8"
                >
                    <div className="flex items-center gap-3">
                        <BookOpen className="w-7 h-7 text-primary" />
                        <h1 className="text-2xl font-bold">내 카드</h1>
                        <span className="text-sm text-muted-foreground">
                            ({cards.length}장)
                        </span>
                    </div>
                    {cards.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDeleteAll}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                            <Trash2 className="w-4 h-4 mr-1" />
                            전체 삭제
                        </Button>
                    )}
                </motion.div>

                {/* 로딩 */}
                {isLoading && (
                    <div className="text-center py-12 text-muted-foreground">
                        카드를 불러오는 중...
                    </div>
                )}

                {/* 빈 상태 */}
                {!isLoading && cards.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-16"
                    >
                        <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                        <p className="text-lg text-muted-foreground mb-2">
                            아직 생성된 카드가 없습니다
                        </p>
                        <p className="text-sm text-muted-foreground mb-6">
                            이미지를 업로드하여 첫 번째 플래시카드를 만들어 보세요!
                        </p>
                        <Button asChild>
                            <a href="/">📸 카드 만들러 가기</a>
                        </Button>
                    </motion.div>
                )}

                {/* 날짜별 그룹 */}
                <AnimatePresence>
                    {Object.entries(grouped).map(([dateLabel, groupCards]) => (
                        <motion.section
                            key={dateLabel}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-10"
                        >
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                {dateLabel}
                                <span className="text-sm text-muted-foreground font-normal">
                                    ({groupCards.length}장)
                                </span>
                            </h2>
                            <FlashcardList cards={groupCards} onDelete={handleDelete} />
                        </motion.section>
                    ))}
                </AnimatePresence>
            </div>
        </main>
    );
}
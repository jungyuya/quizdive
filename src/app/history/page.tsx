'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, BookOpen, Layers, List } from 'lucide-react';
import { FlashcardList } from '@/components/FlashcardList';
import { StudyListView } from '@/components/StudyListView';
import { CardEditModal } from '@/components/CardEditModal';
import { Button } from '@/components/ui/button';
import type { Flashcard } from '@/types';
import { useAuth } from '@/components/AuthProvider';
import { createCardService } from '@/lib/card-service';


type ViewMode = 'card' | 'study';

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
    const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('card');
    const { user } = useAuth();
    const cardService = useMemo(() => createCardService(user), [user]);

    // 카드 로드: cardService.getAll()이 로그인 시 Supabase, 비로그인 시 IndexedDB 자동 분기
    useEffect(() => {
        async function loadCards() {
            setIsLoading(true);
            try {
                const allCards = await cardService.getAll();
                setCards(allCards);
            } catch (error) {
                console.error('카드 로드 실패:', error);
            } finally {
                setIsLoading(false);
            }
        }
        loadCards();
    }, [cardService]);
    const handleDelete = async (id: string) => {
        await cardService.remove(id);
        setCards((prev) => prev.filter((c) => c.id !== id));
    };

    const handleDeleteAll = async () => {
        if (!window.confirm('모든 카드를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
        try {
            await cardService.removeAll();
            setCards([]);
        } catch (error: any) {
            console.error('전체 삭제 실패:', error);
            alert(`삭제 중 오류가 발생했습니다: ${error.message || error}`);
        }
    };

    const handleEdit = (card: Flashcard) => {
        setEditingCard(card);
    };

    const handleSaveEdit = async (updated: Flashcard) => {
        await cardService.update(updated);
        setCards((prev) => prev.map((c) => c.id === updated.id ? updated : c));
        setEditingCard(null);
    };

    const grouped = groupByDate(cards);



    return (
        <main className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-8">
            <div className="max-w-4xl mx-auto">
                {/* 헤더 */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-4 mb-8"
                >
                    <div className="flex justify-between items-center">
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
                    </div>

                    {/* 뷰 모드 토글 */}
                    {cards.length > 0 && (
                        <div className="flex bg-muted/50 rounded-lg p-1 w-fit">
                            <button
                                onClick={() => setViewMode('card')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'card'
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                <Layers className="w-4 h-4" />
                                카드 뷰
                            </button>
                            <button
                                onClick={() => setViewMode('study')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'study'
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                <List className="w-4 h-4" />
                                학습 뷰
                            </button>
                        </div>
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
                            {viewMode === 'card' ? (
                                <FlashcardList cards={groupCards} onDelete={handleDelete} onEdit={handleEdit} />
                            ) : (
                                <StudyListView cards={groupCards} onEdit={handleEdit} />
                            )}
                        </motion.section>
                    ))}
                </AnimatePresence>
            </div>

            {/* 편집 모달 */}
            {editingCard && (
                <CardEditModal
                    card={editingCard}
                    onSave={handleSaveEdit}
                    onClose={() => setEditingCard(null)}
                />
            )}
        </main>
    );
}
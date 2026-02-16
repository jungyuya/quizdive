'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Shuffle, Clock, Play, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/AuthProvider';
import { createCardService } from '@/lib/card-service';
import { getAllDecks, getDeckWithCards } from '@/lib/supabase/decks';
import { useQuizStore } from '@/store/useQuizStore';
import { ReviewMode } from '@/components/ReviewMode';
import { ReviewResult } from '@/components/ReviewResult';
import type { Flashcard, Deck } from '@/types';

type ReviewState = 'setup' | 'playing' | 'result';

export default function ReviewPage() {
    const [allCards, setAllCards] = useState<Flashcard[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [reviewState, setReviewState] = useState<ReviewState>('setup');
    const [cardCount, setCardCount] = useState<number>(10);
    const [isRandom, setIsRandom] = useState(true);

    // 모음집 필터 
    const [decks, setDecks] = useState<Deck[]>([]);
    const [selectedDeckId, setSelectedDeckId] = useState<string>('all');

    const { user } = useAuth();
    const cardService = useMemo(() => createCardService(user), [user]);

    const { reviewCards, reviewResults, reviewStartTime, startReview, resetReview } =
        useQuizStore();

    // 카드 로드 + 모음집 목록 로드
    useEffect(() => {
        async function load() {
            setIsLoading(true);
            try {
                const cards = await cardService.getAll();
                setAllCards(cards);

                // 로그인 시 모음집 목록도 로드
                if (user) {
                    const allDecks = await getAllDecks();
                    setDecks(allDecks);
                }
            } catch (error) {
                console.error('카드 로드 실패:', error);
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, [cardService, user]);

    // 모음집 변경 시 해당 카드만 로드
    useEffect(() => {
        async function loadDeckCards() {
            if (selectedDeckId === 'all') {
                // 전체 카드 다시 로드
                const cards = await cardService.getAll();
                setAllCards(cards);
                return;
            }
            // 특정 모음집의 카드만 로드
            try {
                const data = await getDeckWithCards(selectedDeckId);
                const cards: Flashcard[] = (data ?? []).map((row: any) => ({
                    id: row.cards.id,
                    question: row.cards.question,
                    answer: row.cards.answer,
                    createdAt: new Date(row.cards.created_at),
                    reviewCount: row.cards.review_count,
                    lastReviewedAt: row.cards.last_reviewed_at ? new Date(row.cards.last_reviewed_at) : undefined,
                    nextReviewAt: row.cards.next_review_at ? new Date(row.cards.next_review_at) : undefined,
                }));
                setAllCards(cards);
            } catch (error) {
                console.error('모음집 카드 로드 실패:', error);
            }
        }
        if (selectedDeckId !== 'all') {
            loadDeckCards();
        }
    }, [selectedDeckId]);

    const handleStart = () => {
        let selected = [...allCards];

        // 셔플
        if (isRandom) {
            selected = selected.sort(() => Math.random() - 0.5);
        }

        // 카드 수 제한
        selected = selected.slice(0, cardCount);

        startReview(selected);
        setReviewState('playing');
    };

    const handleComplete = () => {
        setReviewState('result');
    };

    const handleRetry = () => {
        resetReview();
        setSelectedDeckId('all');
        setReviewState('setup');
    };

    // 로딩 상태
    if (isLoading) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground">카드를 불러오는 중...</p>
            </main>
        );
    }

    // 카드 없음
    if (allCards.length === 0 && selectedDeckId === 'all') {
        return (
            <main className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-8">
                <div className="max-w-md mx-auto text-center py-16">
                    <GraduationCap className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-lg text-muted-foreground mb-2">복습할 카드가 없습니다</p>
                    <p className="text-sm text-muted-foreground mb-6">
                        먼저 이미지를 업로드하여 카드를 만들어 주세요
                    </p>
                    <Button asChild>
                        <a href="/">📸 카드 만들러 가기</a>
                    </Button>
                </div>
            </main>
        );
    }

    // 복습 진행 중
    if (reviewState === 'playing') {
        return <ReviewMode onComplete={handleComplete} />;
    }

    // 결과 화면
    if (reviewState === 'result') {
        return (
            <ReviewResult
                results={reviewResults}
                cards={reviewCards}
                startTime={reviewStartTime!}
                onRetry={handleRetry}
            />
        );
    }

    // 설정 화면
    return (
        <main className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-8">
            <div className="max-w-md mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <GraduationCap className="w-12 h-12 mx-auto text-primary mb-4" />
                    <h1 className="text-2xl font-bold mb-2">복습 모드</h1>
                    <p className="text-muted-foreground">
                        {selectedDeckId !== 'all'
                            ? `"${decks.find(d => d.id === selectedDeckId)?.name}" 모음집 ${allCards.length}장`
                            : `저장된 카드 ${allCards.length}장`}으로 퀴즈를 시작합니다
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-6"
                >
                    {/* 모음집 선택 (로그인 + 모음집 있을 때만) */}
                    {user && decks.length > 0 && (
                        <div>
                            <label className="text-sm font-medium mb-3 flex items-center gap-2">
                                <FolderOpen className="w-4 h-4" />
                                복습 범위
                            </label>
                            <select
                                value={selectedDeckId}
                                onChange={(e) => setSelectedDeckId(e.target.value)}
                                className="w-full px-3 py-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                            >
                                <option value="all">📚 모든 카드</option>
                                {decks.map((deck) => (
                                    <option key={deck.id} value={deck.id}>
                                        📁 {deck.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* 카드 수 선택 */}
                    <div>
                        <label className="text-sm font-medium mb-3 block">카드 수</label>
                        <div className="flex gap-2">
                            {[5, 10, 20].map((n) => (
                                <button
                                    key={n}
                                    onClick={() => setCardCount(n)}
                                    disabled={allCards.length < n}
                                    className={`flex-1 py-3 rounded-lg text-sm font-medium transition-colors ${cardCount === n
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                                        } ${allCards.length < n ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {n}장
                                </button>
                            ))}
                            <button
                                onClick={() => setCardCount(allCards.length)}
                                className={`flex-1 py-3 rounded-lg text-sm font-medium transition-colors ${cardCount === allCards.length
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                                    }`}
                            >
                                전체
                            </button>
                        </div>
                    </div>

                    {/* 순서 선택 */}
                    <div>
                        <label className="text-sm font-medium mb-3 block">순서</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsRandom(true)}
                                className={`flex-1 py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${isRandom
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                                    }`}
                            >
                                <Shuffle className="w-4 h-4" />
                                랜덤
                            </button>
                            <button
                                onClick={() => setIsRandom(false)}
                                className={`flex-1 py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${!isRandom
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                                    }`}
                            >
                                <Clock className="w-4 h-4" />
                                최신순
                            </button>
                        </div>
                    </div>

                    {/* 카드가 비어있을 때 (모음집 선택 후) */}
                    {allCards.length === 0 && selectedDeckId !== 'all' && (
                        <div className="text-center py-4 text-muted-foreground text-sm">
                            이 모음집에 카드가 없습니다. 다른 모음집을 선택해 주세요.
                        </div>
                    )}

                    {/* 시작 버튼 */}
                    <Button
                        onClick={handleStart}
                        size="lg"
                        className="w-full gap-2 text-lg py-6 rounded-xl"
                        disabled={allCards.length === 0}
                    >
                        <Play className="w-5 h-5" />
                        복습 시작 ({Math.min(cardCount, allCards.length)}장)
                    </Button>
                </motion.div>
            </div>
        </main>
    );
}
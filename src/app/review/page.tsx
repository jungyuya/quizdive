'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Shuffle, Clock, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAllCards } from '@/lib/db';
import { useQuizStore } from '@/store/useQuizStore';
import { ReviewMode } from '@/components/ReviewMode';
import { ReviewResult } from '@/components/ReviewResult';
import type { Flashcard } from '@/types';

type ReviewState = 'setup' | 'playing' | 'result';

export default function ReviewPage() {
    const [allCards, setAllCards] = useState<Flashcard[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [reviewState, setReviewState] = useState<ReviewState>('setup');
    const [cardCount, setCardCount] = useState<number>(10);
    const [isRandom, setIsRandom] = useState(true);

    const { reviewCards, reviewResults, reviewStartTime, startReview, resetReview } =
        useQuizStore();

    useEffect(() => {
        async function load() {
            const cards = await getAllCards();
            setAllCards(cards);
            setIsLoading(false);
        }
        load();
    }, []);

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
    if (allCards.length === 0) {
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
                        저장된 카드 {allCards.length}장으로 퀴즈를 시작합니다
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-6"
                >
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

                    {/* 시작 버튼 */}
                    <Button
                        onClick={handleStart}
                        size="lg"
                        className="w-full gap-2 text-lg py-6 rounded-xl"
                    >
                        <Play className="w-5 h-5" />
                        복습 시작 ({Math.min(cardCount, allCards.length)}장)
                    </Button>
                </motion.div>
            </div>
        </main>
    );
}
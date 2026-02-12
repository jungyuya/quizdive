'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, SkipForward, Check, Eye, EyeOff } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuizStore } from '@/store/useQuizStore';

interface ReviewModeProps {
    onComplete: () => void;
}

export function ReviewMode({ onComplete }: ReviewModeProps) {
    const {
        reviewCards,
        reviewIndex,
        nextReviewCard,
        markReviewResult,
    } = useQuizStore();

    const [isRevealed, setIsRevealed] = useState(false);
    const currentCard = reviewCards[reviewIndex];
    const isFinished = reviewIndex >= reviewCards.length;
    const progress = ((reviewIndex) / reviewCards.length) * 100;

    // 완료 처리 — 렌더링 후 useEffect에서 호출하여
    // "Cannot update a component while rendering" 에러 방지
    useEffect(() => {
        if (isFinished) {
            onComplete();
        }
    }, [isFinished, onComplete]);

    if (isFinished) {
        return null;
    }

    const handleMark = (correct: boolean) => {
        markReviewResult(currentCard.id, correct);
        setIsRevealed(false);
        nextReviewCard();
    };

    const handleSkip = () => {
        markReviewResult(currentCard.id, false);
        setIsRevealed(false);
        nextReviewCard();
    };

    return (
        <main className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 flex flex-col">
            {/* 상단: 진행률 */}
            <div className="max-w-lg mx-auto w-full mb-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-muted-foreground">
                        {reviewIndex + 1} / {reviewCards.length}
                    </span>
                    <span className="text-sm font-medium text-muted-foreground">
                        {Math.round(progress)}%
                    </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-primary rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            </div>

            {/* 카드 영역 */}
            <div className="flex-1 flex items-center justify-center max-w-lg mx-auto w-full">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentCard.id}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="w-full"
                    >
                        <Card
                            onClick={() => setIsRevealed(!isRevealed)}
                            className="w-full min-h-[300px] p-8 cursor-pointer flex flex-col items-center justify-center text-center"
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setIsRevealed(!isRevealed);
                                }
                            }}
                            aria-label={isRevealed ? '답변을 보고 있습니다' : '터치하여 답변 확인'}
                        >
                            {!isRevealed ? (
                                <div>
                                    <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
                                        <EyeOff className="w-3.5 h-3.5" /> 질문
                                    </p>
                                    <p className="text-xl font-medium leading-relaxed">
                                        {currentCard.question}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-6">
                                        터치하여 답변 확인
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-xs text-green-600 dark:text-green-400 mb-4 flex items-center gap-1">
                                        <Eye className="w-3.5 h-3.5" /> 답변
                                    </p>
                                    <p className="text-xl leading-relaxed">
                                        {currentCard.answer}
                                    </p>
                                </div>
                            )}
                        </Card>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* 하단: 버튼 */}
            <div className="max-w-lg mx-auto w-full mt-6 mb-4">
                {isRevealed ? (
                    <div className="flex gap-3">
                        <Button
                            onClick={() => handleMark(false)}
                            variant="outline"
                            className="flex-1 py-6 text-red-500 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                        >
                            <X className="w-5 h-5 mr-2" />
                            모름
                        </Button>
                        <Button
                            onClick={handleSkip}
                            variant="outline"
                            className="py-6 px-4"
                        >
                            <SkipForward className="w-5 h-5" />
                        </Button>
                        <Button
                            onClick={() => handleMark(true)}
                            className="flex-1 py-6 bg-green-600 hover:bg-green-700 text-white"
                        >
                            <Check className="w-5 h-5 mr-2" />
                            정답
                        </Button>
                    </div>
                ) : (
                    <p className="text-center text-sm text-muted-foreground">
                        카드를 터치하여 답변을 확인하세요
                    </p>
                )}
            </div>
        </main>
    );
}
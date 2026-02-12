'use client';

import { motion } from 'framer-motion';
import { Trophy, Clock, RotateCcw, Home, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Flashcard } from '@/types';

interface ReviewResultProps {
  results: { cardId: string; correct: boolean }[];
  cards: Flashcard[];
  startTime: number;
  onRetry: () => void;
}

export function ReviewResult({ results, cards, startTime, onRetry }: ReviewResultProps) {
  const correctCount = results.filter((r) => r.correct).length;
  const totalCount = results.length;
  const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
  const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;

  // 틀린 카드 목록
  const wrongCardIds = results.filter((r) => !r.correct).map((r) => r.cardId);
  const wrongCards = cards.filter((c) => wrongCardIds.includes(c.id));

  // 등급 계산
  const grade =
    percentage >= 90 ? { emoji: '🏆', label: '완벽해요!', color: 'text-yellow-500' }
    : percentage >= 70 ? { emoji: '👏', label: '잘했어요!', color: 'text-green-500' }
    : percentage >= 50 ? { emoji: '💪', label: '조금 더 노력해요!', color: 'text-blue-500' }
    : { emoji: '📖', label: '다시 복습해요!', color: 'text-orange-500' };

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-8">
      <div className="max-w-md mx-auto">
        {/* 결과 요약 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="text-6xl mb-4"
          >
            {grade.emoji}
          </motion.div>
          <h1 className={`text-2xl font-bold mb-2 ${grade.color}`}>
            {grade.label}
          </h1>
        </motion.div>

        {/* 점수 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-3 gap-3 mb-8"
        >
          <div className="text-center p-4 rounded-xl bg-muted/50">
            <Trophy className="w-5 h-5 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{percentage}%</p>
            <p className="text-xs text-muted-foreground">정답률</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-muted/50">
            <CheckCircle className="w-5 h-5 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{correctCount}/{totalCount}</p>
            <p className="text-xs text-muted-foreground">맞춘 수</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-muted/50">
            <Clock className="w-5 h-5 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">
              {minutes > 0 ? `${minutes}분 ${seconds}초` : `${seconds}초`}
            </p>
            <p className="text-xs text-muted-foreground">소요 시간</p>
          </div>
        </motion.div>

        {/* 틀린 카드 목록 */}
        {wrongCards.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              틀린 카드 ({wrongCards.length}장)
            </h2>
            <div className="space-y-2">
              {wrongCards.map((card) => (
                <div
                  key={card.id}
                  className="p-3 rounded-lg bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30"
                >
                  <p className="text-sm font-medium">Q: {card.question}</p>
                  <p className="text-sm text-muted-foreground mt-1">A: {card.answer}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* 버튼 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex gap-3"
        >
          <Button onClick={onRetry} variant="outline" className="flex-1 gap-2">
            <RotateCcw className="w-4 h-4" />
            다시 복습
          </Button>
          <Button asChild className="flex-1 gap-2">
            <a href="/">
              <Home className="w-4 h-4" />
              홈으로
            </a>
          </Button>
        </motion.div>
      </div>
    </main>
  );
}
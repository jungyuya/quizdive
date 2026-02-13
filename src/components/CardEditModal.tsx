'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Flashcard } from '@/types';

interface CardEditModalProps {
    card: Flashcard;
    onSave: (updated: Flashcard) => void;
    onClose: () => void;
}

export function CardEditModal({ card, onSave, onClose }: CardEditModalProps) {
    const [question, setQuestion] = useState(card.question);
    const [answer, setAnswer] = useState(card.answer);

    const handleSave = () => {
        if (!question.trim() || !answer.trim()) return;
        onSave({ ...card, question: question.trim(), answer: answer.trim() });
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="w-full max-w-lg bg-background rounded-2xl shadow-2xl border border-border/50 overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* 헤더 */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
                        <h3 className="text-lg font-semibold">카드 편집</h3>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                            aria-label="닫기"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* 본문 */}
                    <div className="p-6 space-y-5">
                        {/* 질문 */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium">
                                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">Q</span>
                                질문
                            </label>
                            <textarea
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl border border-border/50 bg-muted/30
                                    focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50
                                    text-base leading-relaxed resize-none transition-all"
                                placeholder="질문을 입력하세요"
                            />
                        </div>

                        {/* 답변 */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium">
                                <span className="w-6 h-6 rounded-full bg-green-500/20 text-green-600 dark:text-green-400 text-xs font-bold flex items-center justify-center">A</span>
                                답변
                            </label>
                            <textarea
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                rows={5}
                                className="w-full px-4 py-3 rounded-xl border border-border/50 bg-muted/30
                                    focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50
                                    text-base leading-relaxed resize-none transition-all"
                                placeholder="답변을 입력하세요"
                            />
                        </div>
                    </div>

                    {/* 푸터 */}
                    <div className="flex justify-end gap-3 px-6 py-4 border-t border-border/50 bg-muted/20">
                        <Button variant="ghost" onClick={onClose}>
                            취소
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={!question.trim() || !answer.trim()}
                            className="gap-2"
                        >
                            <Save className="w-4 h-4" />
                            저장
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

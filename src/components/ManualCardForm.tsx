'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, PlusCircle, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ManualCardFormProps {
    onSubmit: (question: string, answer: string) => Promise<void>;
    onClose: () => void;
}

export function ManualCardForm({ onSubmit, onClose }: ManualCardFormProps) {
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [addedCount, setAddedCount] = useState(0);

    const handleSubmit = async () => {
        if (!question.trim() || !answer.trim()) return;
        setIsSubmitting(true);
        try {
            await onSubmit(question.trim(), answer.trim());
            setAddedCount((prev) => prev + 1);
            setQuestion('');
            setAnswer('');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            handleSubmit();
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-3xl mx-auto"
        >
            <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-5">
                {/* 헤더 */}
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Pencil className="w-4 h-4" />
                    <span className="text-sm font-medium">질문과 답변을 직접 입력하세요</span>
                    {addedCount > 0 && (
                        <span className="ml-auto flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                            <Check className="w-4 h-4" />
                            {addedCount}장 추가됨
                        </span>
                    )}
                </div>

                {/* 질문 */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Q. 질문
                    </label>
                    <textarea
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="예: OSI 7계층에서 Transport Layer의 역할은?"
                        className="w-full p-3 rounded-xl border bg-background text-sm resize-none min-h-[88px] focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                        rows={3}
                    />
                </div>

                {/* 구분선 */}
                <div className="relative flex items-center gap-3">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground font-medium">A. 답변</span>
                    <div className="flex-1 h-px bg-border" />
                </div>

                {/* 답변 */}
                <div className="space-y-1.5">
                    <textarea
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="예: 프로세스 간 신뢰성 있는 데이터 전송을 담당 (TCP/UDP)"
                        className="w-full p-3 rounded-xl border bg-background text-sm resize-none min-h-[88px] focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                        rows={3}
                    />
                </div>

                {/* 버튼 & 힌트 */}
                <div className="flex items-center gap-3 pt-1">
                    <Button
                        onClick={handleSubmit}
                        disabled={!question.trim() || !answer.trim() || isSubmitting}
                        className="gap-2"
                    >
                        <PlusCircle className="w-4 h-4" />
                        {isSubmitting ? '추가 중...' : '카드 추가'}
                    </Button>
                    <span className="text-xs text-muted-foreground">
                        또는 <kbd className="px-1.5 py-0.5 rounded border text-xs bg-muted">⌘ Enter</kbd>
                    </span>
                </div>
            </div>
        </motion.div>
    );
}
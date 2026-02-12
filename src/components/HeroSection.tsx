'use client';

import { motion } from 'framer-motion';
import { Camera, ScanSearch, Sparkles, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeroSectionProps {
    onScrollToUpload: () => void;
}

const pipeline = [
    {
        icon: Camera,
        label: '이미지 업로드',
        tech: 'Tencent COS',
        color: 'from-blue-500 to-cyan-500',
    },
    {
        icon: ScanSearch,
        label: 'OCR 텍스트 인식',
        tech: 'GCP Vision',
        color: 'from-green-500 to-emerald-500',
    },
    {
        icon: Sparkles,
        label: 'AI 카드 생성',
        tech: 'Gemini AI',
        color: 'from-purple-500 to-pink-500',
    },
];

export function HeroSection({ onScrollToUpload }: HeroSectionProps) {
    return (
        <section className="relative py-10 md:py-16 overflow-hidden">
            {/* 배경 그라데이션 */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

            <div className="relative max-w-4xl mx-auto px-4 text-center">
                {/* 타이틀 */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-4xl md:text-5xl font-bold mb-4"
                >
                    <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                        사진 한 장
                    </span>
                    으로
                    <br />
                    AI 플래시카드 만들기
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-lg text-muted-foreground mb-8"
                >
                    교과서, 노트, 프린트를 촬영하면 AI가 학습 카드를 자동 생성합니다
                </motion.p>

                {/* 3단계 파이프라인 시각화 */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="flex flex-row items-center justify-center gap-2 md:gap-6 mb-8"
                >
                    {pipeline.map((step, index) => {
                        const Icon = step.icon;
                        return (
                            <div key={step.label} className="flex items-center gap-2 md:gap-4">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.3 + index * 0.15, type: 'spring' }}
                                    className="flex flex-col items-center gap-2"
                                >
                                    <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}>
                                        <Icon className="w-6 h-6 md:w-8 md:h-8 text-white" />
                                    </div>
                                    <span className="text-[11px] md:text-sm font-medium">{step.label}</span>
                                    <span className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                        {step.tech}
                                    </span>
                                </motion.div>

                                {/* 화살표 (마지막 항목 제외) */}
                                {index < pipeline.length - 1 && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.5 + index * 0.15 }}
                                        className="text-muted-foreground text-lg md:text-2xl"
                                    >
                                        →
                                    </motion.div>
                                )}
                            </div>
                        );
                    })}
                </motion.div>

                {/* CTA 버튼 */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                >
                    <Button
                        size="lg"
                        onClick={onScrollToUpload}
                        className="group relative gap-2 text-lg px-8 py-7 rounded-2xl
                            bg-foreground text-background font-semibold tracking-wide
                            hover:bg-foreground/90 transition-all duration-300
                            shadow-[0_0_20px_-5px_rgba(0,0,0,0.3)] dark:shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]
                            hover:-translate-y-1 hover:shadow-[0_0_30px_-5px_rgba(0,0,0,0.4)] dark:hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.4)]
                            overflow-hidden"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            시작하기
                            <ArrowDown className="w-5 h-5 group-hover:translate-y-1 transition-transform duration-300" />
                        </span>
                        {/* 은은한 광택 효과 */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                    </Button>
                </motion.div>
            </div>
        </section>
    );
}
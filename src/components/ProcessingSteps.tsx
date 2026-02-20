'use client';

import { motion } from 'framer-motion';
import { Check, Loader2, Upload, Scan, Sparkles, FileText } from 'lucide-react';

type SubStep = 'uploading' | 'ocr' | 'generating';
type ProcessingMode = 'image' | 'file';

interface ProcessingStepsProps {
  currentStep: SubStep;
  mode?: ProcessingMode;
  chunkProgress?: { current: number; total: number };
}

const imageSteps = [
  { id: 'uploading', label: '이미지 업로드', icon: Upload },
  { id: 'ocr', label: '텍스트 인식 (OCR)', icon: Scan },
  { id: 'generating', label: 'AI 플래시카드 생성', icon: Sparkles },
] as const;

const fileSteps = [
  { id: 'uploading', label: '파일 분석 중', icon: FileText },
  { id: 'generating', label: 'AI 플래시카드 생성', icon: Sparkles },
] as const;

export function ProcessingSteps({ currentStep, mode = 'image', chunkProgress }: ProcessingStepsProps) {
  const steps = mode === 'file' ? fileSteps : imageSteps;
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-md mx-auto"
      role="status"
      aria-live="polite"
      aria-label={`현재 단계: ${steps.find(s => s.id === currentStep)?.label}`}
    >
      <div className="space-y-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isComplete = index < currentIndex;
          const isCurrent = index === currentIndex;

          // 파일 모드에서 generating 단계일 때 청크 진행률 표시
          const label = isCurrent && step.id === 'generating' && chunkProgress
            ? `AI 카드 생성 중 (${chunkProgress.current}/${chunkProgress.total} 청크)`
            : step.label;

          return (
            <motion.div
              key={step.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center gap-4 p-4 rounded-lg ${isCurrent
                ? 'bg-primary/10 border border-primary/20'
                : isComplete
                  ? 'bg-green-50 dark:bg-green-900/20'
                  : 'bg-muted/50'
                }`}
            >
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isComplete
                  ? 'bg-green-500 text-white'
                  : isCurrent
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                  }`}
              >
                {isComplete ? (
                  <Check className="w-5 h-5" />
                ) : isCurrent ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              <span
                className={`font-medium ${isCurrent
                  ? 'text-primary'
                  : isComplete
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-muted-foreground'
                  }`}
              >
                {label}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* 파일 모드 청크 진행 바 */}
      {mode === 'file' && chunkProgress && chunkProgress.total > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 px-1"
        >
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>진행률</span>
            <span>{Math.round((chunkProgress.current / chunkProgress.total) * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(chunkProgress.current / chunkProgress.total) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
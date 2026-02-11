'use client';

import { motion } from 'framer-motion';
import { Check, Loader2, Upload, Scan, Sparkles } from 'lucide-react';

type SubStep = 'uploading' | 'ocr' | 'generating';

interface ProcessingStepsProps {
  currentStep: SubStep;
}

const steps = [
  { id: 'uploading', label: '이미지 업로드', icon: Upload },
  { id: 'ocr', label: '텍스트 인식 (OCR)', icon: Scan },
  { id: 'generating', label: 'AI 플래시카드 생성', icon: Sparkles },
] as const;

export function ProcessingSteps({ currentStep }: ProcessingStepsProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="space-y-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isComplete = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <motion.div
              key={step.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center gap-4 p-4 rounded-lg ${
                isCurrent
                  ? 'bg-primary/10 border border-primary/20'
                  : isComplete
                  ? 'bg-green-50 dark:bg-green-900/20'
                  : 'bg-muted/50'
              }`}
            >
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  isComplete
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
                className={`font-medium ${
                  isCurrent ? 'text-primary' : isComplete ? 'text-green-600' : ''
                }`}
              >
                {step.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
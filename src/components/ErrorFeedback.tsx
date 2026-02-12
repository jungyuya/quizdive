'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCcw, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorFeedbackProps {
  message: string;
  onRetry: () => void;
}

// 에러 메시지를 사용자 친화적으로 매핑
function getErrorInfo(message: string) {
  // OCR 실패
  if (message.includes('텍스트를 인식하지 못했습니다')) {
    return {
      title: '텍스트를 인식하지 못했어요',
      causes: [
        '이미지가 흐릿하거나 너무 어두울 수 있습니다',
        '손글씨는 인식이 어려울 수 있습니다',
        '텍스트가 너무 작을 수 있습니다',
      ],
      tip: '💡 밝은 곳에서 또렷하게 촬영하면 인식률이 높아집니다',
    };
  }

  // 파일 크기 초과
  if (message.includes('10MB')) {
    return {
      title: '파일이 너무 큽니다',
      causes: ['이미지 크기가 10MB를 초과합니다'],
      tip: '💡 이미지를 압축하거나 해상도를 낮춰보세요',
    };
  }

  // API 서버 에러
  if (message.includes('실패') || message.includes('error')) {
    return {
      title: '서버 연결에 문제가 있었어요',
      causes: [
        '일시적인 서버 오류일 수 있습니다',
        '네트워크 연결이 불안정할 수 있습니다',
      ],
      tip: '💡 잠시 후 다시 시도해 주세요',
    };
  }

  // Rate Limit
  if (message.includes('한도') || message.includes('limit')) {
    return {
      title: '오늘 사용 한도에 도달했어요',
      causes: ['하루 최대 스캔 횟수를 초과했습니다'],
      tip: '💡 내일 다시 이용할 수 있습니다',
    };
  }

  // 기본 에러
  return {
    title: '문제가 발생했어요',
    causes: [message],
    tip: '💡 문제가 계속되면 새로고침 후 다시 시도해 주세요',
  };
}

export function ErrorFeedback({ message, onRetry }: ErrorFeedbackProps) {
  const errorInfo = getErrorInfo(message);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-xl mx-auto mb-8"
    >
      <div className="rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-900/10 p-6">
        {/* 제목 */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">
            {errorInfo.title}
          </h3>
        </div>

        {/* 원인 목록 */}
        <div className="mb-4 space-y-1">
          <p className="text-sm font-medium text-muted-foreground mb-2">가능한 원인:</p>
          {errorInfo.causes.map((cause, i) => (
            <p key={i} className="text-sm text-muted-foreground pl-4">
              • {cause}
            </p>
          ))}
        </div>

        {/* 팁 */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-background/50 mb-4">
          <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm">{errorInfo.tip}</p>
        </div>

        {/* 재시도 버튼 */}
        <Button onClick={onRetry} variant="outline" className="w-full gap-2">
          <RefreshCcw className="w-4 h-4" />
          다시 시도
        </Button>
      </div>
    </motion.div>
  );
}
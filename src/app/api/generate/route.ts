import { NextRequest, NextResponse } from 'next/server';
import { generateFlashcards } from '@/lib/gemini';
import { generateLogger } from '@/lib/logger';

export async function POST(req: NextRequest) {
    const timer = generateLogger.startTimer();

    try {
        const { text } = await req.json();

        if (!text || text.length < 10) {
            return NextResponse.json(
                { error: '텍스트가 너무 짧습니다 (최소 10자)' },
                { status: 400 }
            );
        }

        // 텍스트 길이 제한 (비용 절감 목적)
        const truncatedText = text.slice(0, 5000);

        const result = await generateFlashcards(truncatedText);

        const duration = generateLogger.endTimer(timer);
        generateLogger.info('Generate completed', {
            duration_ms: duration,
            text_length: text.length,
            cards_count: result.cards.length,
            status: 'success',
        });

        return NextResponse.json(result);
    } catch (error: any) {
        const duration = generateLogger.endTimer(timer);
        generateLogger.error('Generate failed', {
            duration_ms: duration,
            error: error.message,
            stack: error.stack,
            status: 'error',
        });

        return NextResponse.json(
            { error: `AI 생성에 실패했습니다: ${error.message}` },
            { status: 500 }
        );
    }
}
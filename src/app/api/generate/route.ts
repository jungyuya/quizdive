import { NextRequest, NextResponse } from 'next/server';
import { generateFlashcards } from '@/lib/gemini';

export async function POST(req: NextRequest) {
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

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Generate error details:', {
            message: error.message,
            stack: error.stack,
            // Gemini API 에러 객체 구조에 따라 다를 수 있음
            response: error.response,
        });
        return NextResponse.json(
            { error: `AI 생성에 실패했습니다: ${error.message}` },
            { status: 500 }
        );
    }
}
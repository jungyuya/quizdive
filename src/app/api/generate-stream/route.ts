import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateLogger } from '@/lib/logger';
import { checkGenerateLimit, getClientIP } from '@/lib/rate-limiter';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  const timer = generateLogger.startTimer();

  // Rate Limit 체크 (기존 /api/generate와 동일)
  const clientIP = getClientIP(req);
  const rateLimit = checkGenerateLimit(clientIP);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: '오늘의 AI 생성 한도를 초과했습니다. 내일 다시 시도해주세요.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimit.resetAt.toISOString(),
        },
      }
    );
  }

  try {
    const { text } = await req.json();

    if (!text || text.length < 10) {
      return NextResponse.json(
        { error: '텍스트가 너무 짧습니다 (최소 10자)' },
        { status: 400 }
      );
    }

    // 텍스트 길이 제한 (비용 절감 — 기존과 동일)
    const truncatedText = text.slice(0, 5000);

    // ✅ 기존 gemini.ts와 동일한 모델 + 설정
    // 단, responseMimeType: 'application/json'은 스트리밍 비호환이므로 제거
    // ✅ gemini.ts와 동일한 모델 + 설정
    // thinking 모드 유지 → 고품질 카드 생성 (7~8장)
    // 카드 순차 표시는 FlashcardList의 stagger 애니메이션으로 처리
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
      },
    });

    // ✅ 기존 gemini.ts의 프롬프트 엔지니어링을 SSE 스트리밍용으로 어댑팅
    // - JSON 배열 대신 JSON Lines (줄 단위 JSON 객체) 형식 요청
    // - 이유: 스트리밍 시 불완전한 JSON을 줄 단위로 파싱하기 위함
    const prompt = `당신은 학습 콘텐츠 전문가입니다. 다음 텍스트를 학습용 플래시카드(Q&A)로 변환해주세요.

규칙:
1. 핵심 개념 위주로 5~10개의 카드 생성
2. 질문은 구체적이고 명확하게
3. 답변은 간결하지만 충분한 설명 포함
4. 영어 문서도 질문과 답변은 한글로 작성
5. 각 카드를 별도의 줄에 하나의 JSON 객체로 출력 (JSON Lines 형식)
6. 마크다운 코드블록이나 추가 설명 없이, 순수 JSON 객체만 줄마다 출력

출력 형식 (각 줄에 하나씩):
{"question": "질문1", "answer": "답변1"}
{"question": "질문2", "answer": "답변2"}

텍스트:
${truncatedText}`;

    const result = await model.generateContentStream(prompt);

    const encoder = new TextEncoder();
    let cardCount = 0;

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = '';

        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          buffer += chunkText;

          // 줄 단위로 JSON 파싱 시도
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // 마지막 불완전한 줄은 버퍼에 유지

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            try {
              // JSON 객체 추출 시도
              const match = trimmed.match(/\{[^}]+\}/);
              if (match) {
                const card = JSON.parse(match[0]);
                if (card.question && card.answer) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify(card)}\n\n`)
                  );
                  cardCount++;
                }
              }
            } catch {
              // JSON 파싱 실패 시 무시 (불완전한 데이터)
            }
          }
        }

        // 버퍼에 남은 마지막 줄 처리
        if (buffer.trim()) {
          try {
            const match = buffer.trim().match(/\{[^}]+\}/);
            if (match) {
              const card = JSON.parse(match[0]);
              if (card.question && card.answer) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(card)}\n\n`)
                );
                cardCount++;
              }
            }
          } catch {
            // 무시
          }
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();

        // 로깅
        const duration = generateLogger.endTimer(timer);
        generateLogger.info('Stream generate completed', {
          duration_ms: duration,
          text_length: text.length,
          cards_count: cardCount,
          status: 'success',
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    const duration = generateLogger.endTimer(timer);
    generateLogger.error('Stream generate failed', {
      duration_ms: duration,
      error: error.message,
      status: 'error',
    });

    return NextResponse.json(
      { error: `AI 스트리밍 생성에 실패했습니다: ${error.message}` },
      { status: 500 }
    );
  }
}
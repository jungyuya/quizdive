import { NextRequest, NextResponse } from 'next/server';
import { downloadFromCOS } from '@/lib/cos';
import { ocrLogger } from '@/lib/logger';
import { checkRateLimit, getClientIP } from '@/lib/rate-limiter';

const GCP_VISION_API_KEY = process.env.GCP_VISION_API_KEY;

export async function POST(req: NextRequest) {
    // 1. Rate Limiting 체크
    const clientIP = getClientIP(req);
    const rateLimit = checkRateLimit(clientIP);

    if (!rateLimit.allowed) {
        return NextResponse.json(
            { error: '오늘 사용 한도에 도달했습니다. 내일 다시 이용해 주세요.' },
            {
                status: 429,
                headers: {
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': rateLimit.resetAt.toISOString(),
                },
            }
        );
    }

    const timer = ocrLogger.startTimer();

    try {
        const { imageUrl, imageBase64 } = await req.json();

        if (!imageUrl && !imageBase64) {
            return NextResponse.json({ error: '이미지 URL 또는 Base64 데이터가 필요합니다' }, { status: 400 });
        }

        if (!GCP_VISION_API_KEY) {
            return NextResponse.json({ error: 'GCP Vision API Key가 설정되지 않았습니다' }, { status: 500 });
        }

        // ✅ 방안 D: Base64가 있으면 COS 다운로드 생략
        let base64Content: string;

        if (imageBase64) {
            // 클라이언트에서 직접 받은 Base64 사용 → COS 다운로드 생략!
            base64Content = imageBase64;
            ocrLogger.info('Using direct Base64 (COS download skipped)');
        } else {
            // fallback: 기존 방식 (URL → COS 다운로드 → Base64 변환)
            const urlObj = new URL(imageUrl);
            const key = urlObj.pathname.startsWith('/') ? urlObj.pathname.slice(1) : urlObj.pathname;
            const imageBuffer = await downloadFromCOS(key);
            base64Content = imageBuffer.toString('base64');
            ocrLogger.info('Using COS download fallback');
        }

        // ✅ 추가 개선: TEXT_DETECTION → DOCUMENT_TEXT_DETECTION
        // DOCUMENT_TEXT_DETECTION은 밀집 텍스트(시험 문제, 문서 등)에 최적화
        const visionResponse = await fetch(
            `https://vision.googleapis.com/v1/images:annotate?key=${GCP_VISION_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requests: [{
                        image: { content: base64Content },
                        features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],  // ✅ 변경
                    }],
                }),
            }
        );

        if (!visionResponse.ok) {
            const errorBody = await visionResponse.text();
            console.error('Vision API error:', visionResponse.status, errorBody);
            return NextResponse.json({ error: `Vision API 호출 실패: ${visionResponse.status}` }, { status: 502 });
        }

        const visionResult = await visionResponse.json();
        const annotation = visionResult.responses?.[0];

        if (annotation?.error) {
            return NextResponse.json({ error: `Vision API 오류: ${annotation.error.message}` }, { status: 502 });
        }

        const text = annotation?.fullTextAnnotation?.text || '';

        if (!text) {
            return NextResponse.json({ error: '텍스트를 인식하지 못했습니다' }, { status: 400 });
        }

        // 4. 로깅 및 성공 응답 (헤더 포함)
        const duration = ocrLogger.endTimer(timer);
        ocrLogger.info('OCR completed', {
            duration_ms: duration,
            text_length: text.length,
            status: 'success',
        });

        const response = NextResponse.json({ text });
        response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
        response.headers.set('X-RateLimit-Reset', rateLimit.resetAt.toISOString());

        return response;

    } catch (error: any) {
        const duration = ocrLogger.endTimer(timer);
        ocrLogger.error('OCR failed', {
            duration_ms: duration,
            error: error.message,
            status: 'error',
        });
        return NextResponse.json(
            { error: `OCR 처리에 실패했습니다: ${error.message}` },
            { status: 500 }
        );
    }
}
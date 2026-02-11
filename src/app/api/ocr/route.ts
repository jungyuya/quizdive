import { NextRequest, NextResponse } from 'next/server';
import { downloadFromCOS } from '@/lib/cos';

const GCP_VISION_API_KEY = process.env.GCP_VISION_API_KEY;

export async function POST(req: NextRequest) {
    try {
        const { imageUrl } = await req.json();

        if (!imageUrl) {
            return NextResponse.json(
                { error: '이미지 URL이 필요합니다' },
                { status: 400 }
            );
        }

        if (!GCP_VISION_API_KEY) {
            return NextResponse.json(
                { error: 'GCP Vision API Key가 설정되지 않았습니다' },
                { status: 500 }
            );
        }

        // URL에서 Key 추출
        const urlObj = new URL(imageUrl);
        const key = urlObj.pathname.startsWith('/') ? urlObj.pathname.slice(1) : urlObj.pathname;

        // COS에서 이미지 다운로드 (서버 인증 중계)
        const imageBuffer = await downloadFromCOS(key);

        // GCP Vision REST API 호출 (API Key 인증)
        const visionResponse = await fetch(
            `https://vision.googleapis.com/v1/images:annotate?key=${GCP_VISION_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requests: [
                        {
                            image: {
                                content: imageBuffer.toString('base64'),
                            },
                            features: [
                                { type: 'TEXT_DETECTION' },
                            ],
                        },
                    ],
                }),
            }
        );

        if (!visionResponse.ok) {
            const errorBody = await visionResponse.text();
            console.error('Vision API error:', visionResponse.status, errorBody);
            return NextResponse.json(
                { error: `Vision API 호출 실패: ${visionResponse.status}` },
                { status: 502 }
            );
        }

        const visionResult = await visionResponse.json();
        const annotation = visionResult.responses?.[0];

        if (annotation?.error) {
            console.error('Vision API annotation error:', annotation.error);
            return NextResponse.json(
                { error: `Vision API 오류: ${annotation.error.message}` },
                { status: 502 }
            );
        }

        const text = annotation?.fullTextAnnotation?.text || '';

        if (!text) {
            return NextResponse.json(
                { error: '텍스트를 인식하지 못했습니다' },
                { status: 400 }
            );
        }

        return NextResponse.json({ text });
    } catch (error: any) {
        console.error('OCR error details:', {
            message: error.message,
            stack: error.stack,
            code: error.code,
        });
        return NextResponse.json(
            { error: `OCR 처리에 실패했습니다: ${error.message}` },
            { status: 500 }
        );
    }
}
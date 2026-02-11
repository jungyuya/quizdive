import { NextRequest, NextResponse } from 'next/server';
import vision from '@google-cloud/vision';
import { downloadFromCOS } from '@/lib/cos';

// GCP 인증 - Base64 디코딩 (EdgeOne Pages 500자 제한 우회)
const gcpCredentialsBase64 = [
    process.env.GCP_CREDENTIALS_PART1 || '',
    process.env.GCP_CREDENTIALS_PART2 || '',
    process.env.GCP_CREDENTIALS_PART3 || '',
    process.env.GCP_CREDENTIALS_PART4 || ''
].join('');

const credentials = JSON.parse(
    Buffer.from(gcpCredentialsBase64, 'base64').toString('utf-8')
);

const visionClient = new vision.ImageAnnotatorClient({
    credentials,
});

export async function POST(req: NextRequest) {
    try {
        const { imageUrl } = await req.json();

        if (!imageUrl) {
            return NextResponse.json(
                { error: '이미지 URL이 필요합니다' },
                { status: 400 }
            );
        }

        // URL에서 Key 추출
        const urlObj = new URL(imageUrl);
        const key = urlObj.pathname.startsWith('/') ? urlObj.pathname.slice(1) : urlObj.pathname;

        // COS에서 이미지 다운로드 (서버 인증 중계)
        const imageBuffer = await downloadFromCOS(key);

        // GCP Vision API 호출 (Buffer 전달)
        const [result] = await visionClient.textDetection(imageBuffer);
        const text = result.fullTextAnnotation?.text || '';

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
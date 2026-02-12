import { NextRequest, NextResponse } from 'next/server';
import { uploadToCOS } from '@/lib/cos';
import { uploadLogger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  const timer = uploadLogger.startTimer();

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: '파일이 없습니다' },
        { status: 400 }
      );
    }

    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: '이미지 파일만 업로드 가능합니다' },
        { status: 400 }
      );
    }

    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: '파일 크기는 10MB 이하여야 합니다' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const imageUrl = await uploadToCOS(buffer, file.name);

    const duration = uploadLogger.endTimer(timer);
    uploadLogger.info('Upload completed', {
      duration_ms: duration,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      status: 'success',
    });

    return NextResponse.json({ imageUrl });
  } catch (error: any) {
    const duration = uploadLogger.endTimer(timer);
    uploadLogger.error('Upload failed', {
      duration_ms: duration,
      error: error.message,
      status: 'error',
    });

    return NextResponse.json(
      { error: '업로드에 실패했습니다' },
      { status: 500 }
    );
  }
}
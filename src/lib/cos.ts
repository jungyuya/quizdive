import COS from 'cos-nodejs-sdk-v5';

// 서버 사이드에서만 사용 (API Routes)
export const cos = new COS({
  SecretId: process.env.TENCENT_SECRET_ID!,
  SecretKey: process.env.TENCENT_SECRET_KEY!,
});

export const BUCKET = process.env.TENCENT_BUCKET!;
export const REGION = process.env.TENCENT_REGION!;

/**
 * COS에 이미지 업로드
 */
export async function uploadToCOS(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const key = `uploads/${Date.now()}-${filename}`;

  await new Promise<void>((resolve, reject) => {
    cos.putObject(
      {
        Bucket: BUCKET,
        Region: REGION,
        Key: key,
        Body: buffer,
      },
      (err) => (err ? reject(err) : resolve())
    );
  });

  // 공개 URL 반환
  return `https://${BUCKET}.cos.${REGION}.myqcloud.com/${key}`;
}

/**
 * COS에서 이미지 다운로드 (서버 중계용)
 */
export async function downloadFromCOS(key: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    cos.getObject(
      {
        Bucket: BUCKET,
        Region: REGION,
        Key: key,
      },
      (err, data) => {
        if (err) return reject(err);
        if (!data.Body) return reject(new Error('No body in response'));
        resolve(data.Body as Buffer);
      }
    );
  });
}
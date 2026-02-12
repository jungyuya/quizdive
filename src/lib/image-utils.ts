/**
 * 브라우저에서 이미지를 리사이징하여 최적화된 File 객체로 반환합니다.
 *
 * 동작 원리:
 * 1. File → Image 객체 로드
 * 2. Canvas에 축소된 크기로 그리기
 * 3. Canvas → Blob → File 변환
 *
 * @param file       - 원본 이미지 File 객체
 * @param maxDimension - 가로/세로 중 긴 축의 최대 px (기본 1280)
 * @param quality    - JPEG 압축 품질 0~1 (기본 0.85)
 * @returns          - 리사이징된 File 객체 (원본이 작으면 그대로 반환)
 */
export async function resizeImage(
    file: File,
    maxDimension = 1280,
    quality = 0.85
): Promise<File> {
    return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => {
            let { width, height } = img;

            // ✅ 이미 작은 이미지는 리사이징하지 않음
            if (width <= maxDimension && height <= maxDimension) {
                URL.revokeObjectURL(img.src); // 메모리 해제
                resolve(file);
                return;
            }

            // 비율 유지하며 축소 (긴 쪽을 maxDimension에 맞춤)
            const ratio = Math.min(maxDimension / width, maxDimension / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);

            // Canvas에 리사이징된 이미지 그리기
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d')!;
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);

            // Canvas → Blob → File 변환
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error('이미지 리사이징 실패'));
                        return;
                    }
                    const resizedFile = new File(
                        [blob],
                        file.name.replace(/\.\w+$/, '.jpg'), // 확장자를 jpg로 통일
                        { type: 'image/jpeg' }
                    );
                    URL.revokeObjectURL(img.src); // 메모리 해제
                    resolve(resizedFile);
                },
                'image/jpeg',
                quality
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(img.src);
            reject(new Error('이미지 로드 실패'));
        };

        img.src = URL.createObjectURL(file);
    });
}

/**
 * File 객체를 Base64 문자열로 변환합니다.
 * (방안 D에서 사용: OCR API에 직접 Base64 전송)
 *
 * @param file - 이미지 File 객체
 * @returns Base64 인코딩된 문자열 (data:... 프리픽스 제거됨)
 */
export function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // "data:image/jpeg;base64," 프리픽스 제거 → 순수 Base64만 반환
            resolve(result.split(',')[1]);
        };
        reader.onerror = () => reject(new Error('파일 읽기 실패'));
        reader.readAsDataURL(file);
    });
}
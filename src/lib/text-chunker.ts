/**
 * 대용량 텍스트를 Gemini API에 적합한 크기로 분할
 *
 * 전략:
 * 1. 텍스트를 문단(빈 줄) 기준으로 분리
 * 2. 각 청크가 MAX_CHUNK_SIZE 이내가 되도록 문단을 누적
 * 3. 각 청크를 개별 Gemini 요청으로 처리
 * 4. 결과 카드 배열을 병합
 */

const MAX_CHUNK_SIZE = 3000; // 약 1,000 토큰 (한국어 기준 3자 ≈ 1토큰)
const MIN_CHUNK_SIZE = 100;  // 너무 짧은 청크는 무시

export function chunkText(text: string): string[] {
  const paragraphs = text.split(/\n\s*\n/); // 빈 줄로 분리
  const chunks: string[] = [];
  let current = '';

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    if (current.length + trimmed.length > MAX_CHUNK_SIZE && current.length > 0) {
      chunks.push(current.trim());
      current = '';
    }
    current += (current ? '\n\n' : '') + trimmed;
  }

  if (current.trim().length >= MIN_CHUNK_SIZE) {
    chunks.push(current.trim());
  }

  return chunks;
}
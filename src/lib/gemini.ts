import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const geminiModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    responseMimeType: 'application/json',
    temperature: 0.7,
    maxOutputTokens: 4096,  // ✅ 2048 → 4096으로 증가 (긴 텍스트 대응)
  },
});

/**
 * Gemini API 호출 + JSON 파싱 (1회 시도)
 */
async function callGemini(prompt: string): Promise<any> {
  const result = await geminiModel.generateContent(prompt);
  const response = result.response.text();
  console.log('Gemini raw response:', response);

  // JSON 파싱: ```json ... ``` 또는 { ... } 형태 모두 대응
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Invalid JSON response from Gemini');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * 재시도 래퍼 (Exponential Backoff)
 *
 * 동작 원리:
 * 1회차 실패 → 1초 대기 → 2회차 시도
 * 2회차 실패 → 2초 대기 → 3회차 시도 (최종)
 * 3회차 실패 → 에러 throw
 *
 * @param fn    - 실행할 async 함수
 * @param maxRetries - 최대 재시도 횟수 (기본 2 = 총 3회 시도)
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 2
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      console.warn(
        `[Gemini] 시도 ${attempt + 1}/${maxRetries + 1} 실패: ${error.message}`
      );

      // 마지막 시도가 아니면 대기 후 재시도
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 1초, 2초, 4초...
        console.log(`[Gemini] ${delay / 1000}초 후 재시도...`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw lastError;
}

/**
 * OCR 텍스트를 플래시카드로 변환 (재시도 포함)
 */
export async function generateFlashcards(text: string) {
  const prompt = `
당신은 학습 콘텐츠 전문가입니다. 다음 텍스트를 학습용 플래시카드(Q&A)로 변환해주세요.

규칙:
1. 핵심 개념 위주로 5~10개의 카드 생성 
2. 질문은 구체적이고 명확하게
3. 답변은 간결하지만 충분한 설명 포함
4. 반드시 JSON 형식으로만 응답

출력 형식:
{
  "cards": [
    { "question": "질문1", "answer": "답변1" },
    { "question": "질문2", "answer": "답변2" }
  ]
}

텍스트:
${text}
`;

  // ✅ 재시도 래퍼 적용 (최대 3회 시도)
  const parsed = await withRetry(() => callGemini(prompt));

  // 응답 구조 검증: cards 배열이 있는지 확인
  if (!parsed.cards || !Array.isArray(parsed.cards) || parsed.cards.length === 0) {
    throw new Error('Gemini 응답에 카드 데이터가 없습니다');
  }

  return parsed;
}
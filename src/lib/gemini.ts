import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const geminiModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    responseMimeType: 'application/json',
    temperature: 0.7,
    maxOutputTokens: 2048,
  },
});

/**
 * OCR 텍스트를 플래시카드로 변환
 */
export async function generateFlashcards(text: string) {
  const prompt = `
당신은 학습 콘텐츠 전문가입니다. 다음 텍스트를 학습용 플래시카드(Q&A)로 변환해주세요.

규칙:
1. 핵심 개념 위주로 5~10개의 카드 생성 혹은 요청 개수 만큼 생성
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

  const result = await geminiModel.generateContent(prompt);
  const response = result.response.text();
  console.log('Gemini raw response:', response);

  // JSON 파싱 (Gemini가 마크다운으로 감쌀 수 있음)
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Invalid JSON response from Gemini');
  }

  return JSON.parse(jsonMatch[0]);
}
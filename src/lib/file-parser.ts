/**
 * 파일 형식별 텍스트 추출기
 * - txt/md: FileReader API로 직접 읽기
 * - pdf: pdfjs-dist로 텍스트 추출
 */

export async function parseFile(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'txt':
    case 'md':
      return await readTextFile(file);
    case 'pdf':
      return await readPdfFile(file);
    default:
      throw new Error(`지원하지 않는 파일 형식: .${ext}`);
  }
}

// 텍스트/마크다운 파일 읽기
async function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('파일 읽기 실패'));
    reader.readAsText(file, 'utf-8');
  });
}

// PDF 텍스트 추출 (텍스트 기반 PDF만 지원)
async function readPdfFile(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
  // Worker 설정 (번들 최적화를 위해 동적 임포트)
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;

  const textParts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => item.str)
      .join(' ');
    textParts.push(pageText);
  }

  const fullText = textParts.join('\n\n');

  if (fullText.trim().length < 10) {
    throw new Error(
      '텍스트를 추출할 수 없습니다. 스캔된 PDF는 이미지 업로드 기능을 이용해주세요.'
    );
  }

  return fullText;
}
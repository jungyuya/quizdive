# QuizDive — AI 플래시카드 생성 서비스
> **"Tencent Cloud와 Google AI를 결합하여, 시험 사진 한 장을 지능형 학습 카드로 자동 변환하는 서버리스 웹 서비스"**

## 1. 프로젝트 소개

본 프로젝트는 **Tencent Cloud 크레딧 프로그램**을 활용하여, 중국계 클라우드 인프라를 직접 설계하고 운영한 인프라 엔지니어링 포트폴리오입니다.

사용자가 시험지나 학습 자료의 **사진을 업로드하면**, GCP Vision API가 텍스트를 인식(OCR)하고, **Gemini AI**가 핵심 내용을 분석하여 **복습용 플래시카드(Q&A)** 를 자동 생성합니다. 생성된 카드는 로컬 IndexedDB에 저장되어 오프라인에서도 복습할 수 있으며, 복습 모드에서 자가 평가를 통해 학습 성과를 확인할 수 있습니다.

AWS 기반 프로젝트와 차별화하여, **Tencent COS + EdgeOne Pages**라는 새로운 인프라 환경에서 서버리스 아키텍처를 설계하고, 멀티 클라우드(Tencent + GCP) 간의 통합을 직접 구현한 경험을 담았습니다.

- **Service URL**: [https://quiz.jungyu.store](https://quiz.jungyu.store)
- **Repo**: [https://github.com/jungyuya/quizdive](https://github.com/jungyuya/quizdive)

---

## 2. 시스템 아키텍처

전체 데이터 흐름은 **이미지 업로드 → OCR 인식 → AI 카드 생성 → 로컬 저장 → 복습**의 파이프라인으로 구성됩니다.

<!-- 스크린샷: 전체 시스템 아키텍처 다이어그램 (별도 작성 예정) -->
<!-- 다이어그램에 포함할 구성 요소: 브라우저(Client) → EdgeOne Pages(Next.js Serverless) → Tencent COS(이미지 저장) / GCP Vision API(OCR) / Gemini API(AI 생성) → IndexedDB(로컬 저장) -->

### 핵심 아키텍처 포인트
- **멀티 클라우드 통합**: 호스팅/스토리지는 **Tencent Cloud**, AI 서비스는 **Google Cloud**를 사용하는 이종 클라우드 간의 서비스 오케스트레이션을 직접 설계하고 구현했습니다. 
- **서버리스 아키텍처**: 별도의 서버 인스턴스 없이 EdgeOne Pages의 서버리스 함수(Serverless Functions)로 모든 백엔드 로직을 처리합니다.
- **클라이언트 최적화**: 업로드 전 Canvas API로 이미지를 리사이징하고, OCR 시 COS 재다운로드를 생략하는 최적화로 서버리스 환경의 타임아웃 제한을 극복했습니다.
- **로컬 우선 데이터**: 인증 시스템 없이도 IndexedDB를 활용한 클라이언트 사이드 데이터 저장으로 즉각적인 응답성을 확보했습니다.

---

## 3. 핵심 기능 및 주요 개선사항

### 3.1. OCR + AI 자동 카드 생성 파이프라인
> **"사진 한 장에서 학습 카드까지, 3단계 자동화"**

<!-- 스크린샷: 메인 페이지 — 이미지 업로드 → 처리 중(3단계 프로그레스) → 카드 생성 완료 화면 흐름 -->

- **3단계 파이프라인**: `이미지 업로드(COS) → OCR 텍스트 인식(Vision API) → AI 카드 생성(Gemini)` 과정을 하나의 워크플로우로 자동화했습니다.
- **실시간 상태 피드백**: 각 단계별 진행 상황을 사용자에게 시각적으로 표시하여, 기다리는 시간의 체감 지연을 줄였습니다.
- **프롬프트 엔지니어링**: Gemini에게 "핵심 개념 추출 → Q&A 쌍 생성 → 한국어 변환" 역할을 지시하는 구조화된 프롬프트를 설계하여, 영문 자료에서도 한국어 Q&A를 생성합니다.

### 3.2. 클라이언트 이미지 최적화
> **"서버리스 타임아웃의 한계를 클라이언트에서 해결"**

<!-- 스크린샷: 이미지 크로퍼 UI (크롭 영역 드래그, 원본 크기 비교) -->

- **Canvas 리사이징**: 업로드 전 브라우저에서 이미지를 최대 1280px로 리사이징합니다. 5MB 원본이 **~300KB(95% 감소)** 로 최적화되어 Vision API 처리 시간이 획기적으로 단축됩니다.
- **COS 재다운로드 제거**: 기존에는 `업로드 → COS 저장 → OCR에서 COS 재다운로드`의 불필요한 왕복이 있었습니다. 클라이언트에서 OCR로 Base64를 직접 전달하도록 아키텍처를 개선하여 **1~2초의 네트워크 왕복을 절약**했습니다.
- **이미지 크롭**: `react-image-crop` 라이브러리를 활용하여, 업로드 전 원하는 영역만 잘라내어 불필요한 텍스트 인식을 방지합니다.

### 3.3. 복습 모드 (퀴즈 시스템)
> **"자가 평가 기반의 효율적인 학습 루프"**

<!-- 스크린샷: 복습 모드 — 카드 설정 화면 → 퀴즈 진행(질문 표시 → 답변 공개 → 알아요/몰라요 버튼) → 결과 요약(정답률, 소요 시간, 틀린 카드 목록) -->

- **자가 평가**: 질문을 보고 답변을 직접 떠올린 후, 답변을 공개하여 "알아요/몰라요"를 자가 평가하는 방식으로, 능동적인 학습을 유도합니다.
- **결과 분석**: 복습 완료 후 정답률, 소요 시간, 틀린 카드 목록을 한눈에 보여주어, 약점 파악에 도움을 줍니다.
- **Zustand 상태 관리**: 복습 진행 상태(현재 인덱스, 모든 채점 결과, 시작 시간)를 Zustand 스토어에서 중앙 관리하여, 컴포넌트 간 상태 전달의 복잡성을 줄였습니다.

### 3.4. 학습 뷰 & 카드 편집
> **"학습에 최적화된 뷰와 오개념 즉시 수정"**

<!-- 스크린샷: "내 카드" 탭 — 뷰 모드 토글(카드 뷰 ↔ 학습 뷰), 학습 뷰에서 Q&A가 나란히 표시되는 모습 -->
<!-- 스크린샷: 카드 편집 모달 — 질문/답변 텍스트 에어리어 편집 화면 -->

- **듀얼 뷰 모드**: "내 카드" 페이지에서 **카드 뷰**(뒤집기 인터랙션)와 **학습 뷰**(Q&A 나열 리스트)를 토글로 전환할 수 있습니다. 학습 뷰에서는 모든 Q&A가 한눈에 보여 빠른 학습이 가능합니다.
- **인라인 편집**: AI가 생성한 카드에 오류가 있을 경우, 편집 모달에서 직접 질문/답변을 수정할 수 있습니다. 수정 내용은 IndexedDB에 즉시 반영됩니다.

### 3.5. UI/UX 엔지니어링
> **"모바일 퍼스트, 부드러운 인터랙션"**

<!-- 스크린샷: 모바일/데스크톱 반응형 비교 — 모바일 하단 탭 바 + 데스크톱 상단 네비게이션 -->

- **반응형 디자인**: 모바일 하단 탭 바와 데스크톱 상단 네비게이션을 분리하여, 각 환경에 최적화된 네비게이션을 제공합니다.
- **Framer Motion 애니메이션**: 카드 뒤집기, 페이지 전환, 에러 피드백 등 모든 인터랙션에 부드러운 모션을 적용하여 매끄러운 사용 경험을 구현했습니다.
- **다크 모드**: `next-themes`를 활용하여 시스템 테마를 자동 감지하고, 사용자가 수동으로도 전환할 수 있도록 구현했습니다.
- **에러 처리 UX**: 504 타임아웃, API 에러 등 예외 상황에서 사용자 친화적인 에러 메시지와 재시도 버튼을 제공합니다.

---

## 4. 기술 스택

| 분류 | 기술 | 선정 이유 및 활용 |
|:---:|:---:|---|
| **Frontend** | **Next.js 16** (App Router) | 서버 사이드 렌더링 + 서버리스 API Routes로 풀스택 단일 프레임워크 구성 |
| | **React 19 + TypeScript** | 정적 타입을 통한 안정적인 컴포넌트 개발, API 인터페이스 일관성 유지 |
| | **Tailwind CSS 4** | 유틸리티 퍼스트 스타일링으로 빠른 반응형 UI 개발 |
| | **Framer Motion** | 카드 뒤집기, 페이지 전환 등 고품질 마이크로 인터랙션 구현 |
| | **Zustand** | 복습 모드 등 전역 상태를 경량 스토어로 관리 (Redux 대비 보일러플레이트 최소화) |
| **Backend** | **Next.js API Routes** | 별도 백엔드 서버 없이 서버리스 함수로 3개 엔드포인트 구현 |
| | **Rate Limiter** | 자체 구현한 IP 기반 Rate Limiting으로 API 남용 방지 |
| **AI / ML** | **Google Gemini 2.5 Flash** | OCR 텍스트를 분석하여 구조화된 Q&A JSON을 생성하는 경량 LLM |
| | **GCP Vision API** | 고정밀 OCR로 한국어/영어가 혼합된 시험지도 정확하게 인식 |
| **Storage** | **Tencent COS** | 업로드 이미지의 영구 저장소, CORS 설정으로 프로덕션 URL만 허용 |
| | **IndexedDB** | 브라우저 내 구조화된 카드 데이터 저장, 오프라인 복습 지원 |
| **Infra** | **EdgeOne Pages** | Tencent의 서버리스 호스팅 플랫폼, Git 연동 자동 배포 |
| | **GitHub** | 소스 코드 관리 및 EdgeOne Pages 자동 배포 트리거 |

---

## 5. 데이터 흐름 상세

이미지 업로드에서 카드 생성까지의 전체 요청 흐름입니다.

```
📱 Client (Browser)
│
├─ 1. 이미지 선택 & 크롭
│     ↓ Canvas API로 최대 1280px 리사이징 (5MB → ~300KB)
│
├─ 2. POST /api/upload
│     ↓ FormData(File)
│     ↓ Tencent COS SDK로 업로드
│     ↓ 반환: imageUrl
│
├─ 3. POST /api/ocr
│     ↓ { imageUrl, imageBase64 }
│     ↓ Base64를 직접 GCP Vision API로 전달 (COS 재다운로드 생략)
│     ↓ Rate Limit 검사 (IP 기반, 일 100회)
│     ↓ 반환: { text } (인식된 텍스트)
│
├─ 4. POST /api/generate
│     ↓ { text }
│     ↓ Gemini API에 프롬프트 전달
│     ↓ withRetry(Exponential Backoff, 최대 3회)
│     ↓ JSON 파싱 & 검증
│     ↓ 반환: { cards: [{ question, answer }] }
│
└─ 5. 카드 저장 & 표시
      ↓ IndexedDB에 cards 저장
      ↓ 화면에 FlashcardList 렌더링
```

---

## 6. 트러블슈팅

### Case 1: 504 Gateway Timeout — 대용량 이미지의 OCR 타임아웃
- **상황**: 영문 시험 문제가 포함된 긴 스크린샷(5MB) 업로드 시 EdgeOne Pages의 30초 타임아웃 초과로 504 에러 발생.
- **분석**: 데이터 흐름을 추적한 결과, **COS 재다운로드(1~2초)** + **원본 크기 Base64 전송(6.7MB)** + **Vision API 고해상도 처리(10~30초)**가 합산되어 타임아웃을 초과함을 규명.
- **해결**: ① 클라이언트에서 Canvas API로 이미지를 1280px로 리사이징(95% 감소), ② OCR 호출 시 COS 재다운로드를 건너뛰고 클라이언트의 Base64를 직접 전달하는 아키텍처로 개선. 총 소요 시간 **45초 → 8초 이내**로 단축.

### Case 2: GCP 인증 방식의 3단계 변천
- **상황**: 서버리스 환경(EdgeOne)에서 GCP Service Account JSON으로 Vision API를 인증하려 했으나, 파일 시스템에 JSON을 배치할 수 없는 제약 발생.
- **시도 1**: JSON을 Base64로 인코딩 → 문자열이 ~3,500자로 길어 환경변수 5개로 분할(`GCP_CREDENTIALS_1~5`). 런타임에서 합쳐서 디코딩하는 방식 → 관리 복잡성 증가.
- **최종 해결**: Service Account → **GCP API Key** 방식으로 전환. 환경변수 **1개**(`GCP_VISION_API_KEY`)로 간결하게 해결하고, GCP 콘솔에서 허용 API를 Vision API로 제한하여 보안 확보.

### Case 3: Gemini API JSON 파싱 실패와 할당량 초과
- **상황**: Gemini가 간헐적으로 잘린 JSON 또는 비-JSON 응답을 반환하여 `SyntaxError` 발생. 연속 재시도로 429 Quota Exceeded 에러 추가 발생.
- **해결**: ① `maxOutputTokens`를 2048→4096으로 증가하여 응답 절단 방지, ② Exponential Backoff 재시도 로직(`withRetry`, 최대 3회) 구현, ③ AI Studio 무료 Key → GCP 프로젝트 Key로 교체(RPM 15→1,000회 확대).

### Case 4: 플래시카드 긴 답변 오버플로우
- **상황**: 3D 플립 카드에서 긴 답변이 고정 높이를 넘어 잘리는 현상 발생.
- **분석**: 앞/뒤면 모두 `position: absolute`로 렌더링되어 부모 높이에 영향을 주지 않는 구조적 문제 확인.
- **해결**: 3D 플립 대신 **AnimatePresence 조건부 렌더링**으로 교체하여 카드가 컨텐츠에 맞게 동적으로 높이 조절되도록 개선. 레이아웃도 3열 그리드를 단일 열로 변경하여 가독성 향상.

---

## 7. 비용 최적화 및 운영 전략

### 7.1. 서버리스 + 프리 티어 최대 활용
- **EdgeOne Pages**: Tencent Cloud 크레딧 프로그램 활용으로 호스팅/CDN 비용 제로.
- **GCP API**: Vision API와 Gemini API 모두 무료 사용량 범위 내 운영. GCP 프로젝트 Key로 전환 후 RPM 제한을 1,000회까지 확보.
- **Tencent COS**: 이미지 저장소로 사용하되, 클라이언트 리사이징으로 저장 용량을 95% 절감.

### 7.2. API 비용 방어
- **Rate Limiter**: 자체 구현한 IP 기반 Rate Limiting으로 OCR API 호출을 일 100회로 제한.
- **클라이언트 최적화**: 이미지 리사이징으로 Vision API의 처리 단위(이미지 크기)를 줄여 호출당 비용 절감.
- **API Key 분리**: Vision API와 Gemini API의 Key를 분리하고, 각각 허용 API를 제한하여 Key 탈취 시 피해 범위를 최소화.

### 7.3. CORS 보안
- **Tencent COS CORS**: 프로덕션 도메인(`quiz.jungyu.store`)만 허용하는 화이트리스트 적용.
- **GCP API Key 제한**: HTTP Referrer 제한 설정으로 허용된 도메인에서만 API 호출 가능.

---

## 8. 프로젝트 구조

```
quizdive/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── generate/route.ts    # Gemini AI 카드 생성 API
│   │   │   ├── ocr/route.ts         # GCP Vision OCR API
│   │   │   └── upload/route.ts      # Tencent COS 업로드 API
│   │   ├── history/page.tsx         # 내 카드 (히스토리) 페이지
│   │   ├── review/page.tsx          # 복습 모드 페이지
│   │   ├── layout.tsx               # 전역 레이아웃 (Navbar + Footer)
│   │   └── page.tsx                 # 메인 페이지 (업로드 + 카드 생성)
│   ├── components/
│   │   ├── CardEditModal.tsx        # 카드 편집 모달
│   │   ├── FlashcardItem.tsx        # 개별 카드 (뒤집기 인터랙션)
│   │   ├── FlashcardList.tsx        # 카드 목록 래퍼
│   │   ├── HeroSection.tsx          # 메인 히어로 섹션
│   │   ├── ImageCropper.tsx         # 이미지 크롭 도구
│   │   ├── ImageUploader.tsx        # 드래그앤드롭 업로더
│   │   ├── ReviewMode.tsx           # 퀴즈 인터랙션 (알아요/몰라요)
│   │   ├── ReviewResult.tsx         # 복습 결과 요약
│   │   └── StudyListView.tsx        # Q&A 나열 학습 뷰
│   ├── lib/
│   │   ├── cos.ts                   # Tencent COS SDK 클라이언트
│   │   ├── db.ts                    # IndexedDB CRUD (idb 라이브러리)
│   │   ├── gemini.ts                # Gemini API 클라이언트 + 재시도 로직
│   │   ├── image-utils.ts           # Canvas 리사이징 & Base64 변환
│   │   ├── logger.ts                # 구조화 로깅 (JSON 형식)
│   │   └── rate-limiter.ts          # IP 기반 Rate Limiter
│   ├── store/useQuizStore.ts        # Zustand 전역 상태 관리
│   └── types/index.ts               # TypeScript 타입 정의
├── public/                          # 정적 에셋 (로고 등)
└── package.json
```

---

<!--
## 9. 실행 방법

```bash
# 1. 저장소 클론
git clone https://github.com/jungyuya/quizdive.git
cd quizdive

# 2. 의존성 설치
pnpm install

# 3. 환경 변수 설정
cp .env.example .env.local
# 아래 값 설정 필요:
# - GEMINI_API_KEY         (Gemini AI 생성용 GCP API Key)
# - GCP_VISION_API_KEY     (Vision OCR용 GCP API Key)
# - COS_SECRET_ID          (Tencent COS 인증)
# - COS_SECRET_KEY
# - COS_BUCKET
# - COS_REGION

# 4. 개발 서버 실행
pnpm run dev

# 5. 프로덕션 빌드
pnpm run build
pnpm start
```

---

## 10. 향후 계획

| 항목 | 상세 | 우선순위 |
|------|------|:---:|
| **수동 Q&A 등록** | 이미지 없이 직접 카드를 입력하는 기능 | ⭐⭐⭐ |
| **파일 첨부 변환** | `.txt`, `.md` 파일을 드래그앤드롭으로 AI 카드 변환 | ⭐⭐⭐ |
| **Google OAuth** | 로그인 기반 카드 모음집(Collection) 관리 | ⭐⭐ |
| **AI 스트리밍** | 카드가 하나씩 생성되는 실시간 UX | ⭐⭐ |
| **Anki 내보내기** | 생성된 카드를 Anki 형식으로 다운로드 | ⭐ |
| **시크릿 관리** | GitGuardian + Husky로 커밋 전 시크릿 자동 감지 | ⭐ |
-->
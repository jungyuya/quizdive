# QuizDive 시스템 아키텍처

> 본 문서는 QuizDive의 전체 시스템 구성과 주요 데이터 흐름을 Mermaid 다이어그램으로 시각화합니다.

---

## 1. 전체 시스템 아키텍처

멀티 클라우드(Tencent Cloud + Google Cloud) 환경에서 서버리스로 동작하는 전체 구성도입니다.

```mermaid
graph TB
    subgraph Client["📱 Client (Browser)"]
        UI["Next.js App<br/>React 19 + TypeScript"]
        Canvas["Canvas API<br/>이미지 리사이징"]
        IDB["IndexedDB<br/>카드 로컬 저장"]
        Zustand["Zustand Store<br/>전역 상태 관리"]
    end

    subgraph EdgeOne["🌐 Tencent EdgeOne Pages"]
        CDN["EdgeOne CDN<br/>정적 에셋 전송"]
        subgraph ServerlessFn["Serverless Functions"]
            Upload["/api/upload<br/>이미지 업로드"]
            OCR["/api/ocr<br/>OCR 텍스트 인식"]
            Generate["/api/generate<br/>AI 카드 생성"]
        end
        RL["Rate Limiter<br/>IP 기반 일 100회"]
    end

    subgraph Tencent["☁️ Tencent Cloud"]
        COS["Tencent COS<br/>Object Storage<br/>이미지 영구 저장"]
    end

    subgraph GCP["☁️ Google Cloud Platform"]
        Vision["GCP Vision API<br/>OCR 텍스트 인식<br/>한/영 지원"]
        Gemini["Gemini 2.5 Flash<br/>Q&A 카드 생성<br/>JSON 구조화 응답"]
    end

    subgraph DNS["🌍 DNS / Domain"]
        Domain["quiz.jungyu.store"]
    end

    %% 사용자 흐름
    User((👤 사용자)) --> Domain
    Domain --> CDN
    CDN --> UI

    %% 클라이언트 내부
    UI --> Canvas
    UI --> IDB
    UI --> Zustand

    %% API 호출
    Canvas -->|"리사이징된 이미지"| Upload
    Upload -->|"COS SDK"| COS
    UI -->|"Base64 직접 전달"| OCR
    OCR --> RL
    RL -->|"API Key 인증"| Vision
    UI -->|"OCR 텍스트"| Generate
    Generate -->|"API Key 인증"| Gemini

    %% 응답 흐름
    Gemini -->|"Q&A JSON"| Generate
    Vision -->|"인식된 텍스트"| OCR
    Generate -->|"cards[]"| UI
    UI -->|"카드 저장"| IDB

    %% 스타일
    classDef tencent fill:#0052d9,stroke:#0052d9,color:#fff
    classDef gcp fill:#4285f4,stroke:#4285f4,color:#fff
    classDef client fill:#10b981,stroke:#10b981,color:#fff
    classDef edge fill:#6366f1,stroke:#6366f1,color:#fff

    class COS tencent
    class Vision,Gemini gcp
    class UI,Canvas,IDB,Zustand client
    class CDN,Upload,OCR,Generate,RL edge
```

### 아키텍처 설명

| 계층 | 구성 요소 | 역할 |
|------|---------|------|
| **Client** | Next.js App, Canvas API, IndexedDB, Zustand | 사용자 인터페이스, 이미지 전처리, 로컬 데이터 관리, 전역 상태 |
| **EdgeOne** | CDN + Serverless Functions | 정적 에셋 전송, 3개 API 엔드포인트 서버리스 실행 |
| **Tencent Cloud** | COS (Object Storage) | 업로드된 이미지의 영구 저장 |
| **Google Cloud** | Vision API + Gemini API | OCR 텍스트 인식 + AI 카드 생성 |

**핵심 설계 결정:**
- **멀티 클라우드 분업**: 호스팅/스토리지는 Tencent, AI 서비스는 GCP로 분리. 각 클라우드의 강점을 활용하면서 특정 벤더 종속을 방지.
- **API Key 기반 인증**: 서버리스 환경의 제약(파일 시스템 없음)으로 인해 Service Account JSON 대신 API Key로 인증. GCP 콘솔에서 허용 API를 제한하여 보안 확보.
- **로컬 우선 저장**: 인증 시스템 없이도 사용 가능하도록 IndexedDB에 카드를 저장. 네트워크 없이도 복습 가능.

---

## 2. 이미지 → 카드 생성 파이프라인

사용자가 이미지를 업로드하면 카드가 생성되기까지의 **전체 요청 시퀀스**입니다.

```mermaid
sequenceDiagram
    actor User as 👤 사용자
    participant Browser as 📱 Browser
    participant Canvas as 🎨 Canvas API
    participant Upload as /api/upload
    participant COS as ☁️ Tencent COS
    participant OCR as /api/ocr
    participant RL as 🛡️ Rate Limiter
    participant Vision as 🔍 GCP Vision
    participant Gen as /api/generate
    participant Gemini as 🤖 Gemini AI
    participant IDB as 💾 IndexedDB

    User->>Browser: 이미지 선택 / 촬영
    Browser->>Browser: scrollTo(top:0)
    Browser->>Browser: ImageCropper 표시

    alt 크롭 선택
        User->>Browser: 크롭 영역 지정
        Browser->>Canvas: croppedBlob → File
    else 크롭 건너뛰기
        Browser->>Canvas: resizeImage(원본, 1280px)
    end
    
    Note over Canvas: 5MB → ~300KB (95%↓)

    rect rgb(230, 240, 255)
        Note over Browser,COS: 1단계: 이미지 업로드
        Browser->>Upload: POST FormData(file)
        Upload->>COS: COS SDK putObject()
        COS-->>Upload: 저장 완료
        Upload-->>Browser: { imageUrl }
    end

    rect rgb(230, 255, 240)
        Note over Browser,Vision: 2단계: OCR 텍스트 인식
        Browser->>Browser: fileToBase64(file)
        Browser->>OCR: POST { imageUrl, imageBase64 }
        OCR->>RL: IP 기반 호출 횟수 검사
        RL-->>OCR: 허용 (남은 횟수 반환)
        OCR->>Vision: Base64 직접 전달 (COS 재다운로드 생략!)
        Vision-->>OCR: 인식된 텍스트
        OCR-->>Browser: { text, remaining }
    end

    rect rgb(255, 240, 230)
        Note over Browser,Gemini: 3단계: AI 카드 생성
        Browser->>Gen: POST { text }
        
        loop withRetry (최대 3회, Exponential Backoff)
            Gen->>Gemini: 프롬프트 + OCR 텍스트
            Gemini-->>Gen: JSON 응답
            Gen->>Gen: JSON 파싱 & cards[] 검증
        end
        
        Gen-->>Browser: { cards: [{ question, answer }] }
    end

    Browser->>Browser: uuid() 생성, 카드 객체 구성
    Browser->>IDB: saveCards(newCards)
    Browser->>Browser: FlashcardList 렌더링
    Browser-->>User: 생성된 카드 표시 ✅
```

### 파이프라인 설명

**AS-IS vs TO-BE (504 타임아웃 해결 전후):**

| 단계 | AS-IS (개선 전) | TO-BE (개선 후) |
|------|:---:|:---:|
| 이미지 크기 | 5MB (원본) | ~300KB (Canvas 리사이징) |
| 2단계 OCR | COS에서 이미지 재다운로드 → Base64 변환 → Vision | 클라이언트 Base64 직접 수신 → Vision |
| 불필요한 왕복 | COS 재다운로드 1~2초 | 0초 (제거) |
| 3단계 AI | 1회 시도, 토큰 2048 | 최대 3회 재시도, 토큰 4096 |
| **총 소요** | **20~45초 💥 타임아웃** | **3~8초 ✅** |

**주요 최적화 포인트:**
1. **Canvas 리사이징** (`image-utils.ts`): 브라우저에서 이미지를 최대 1280px로 리사이징. Vision API는 해상도가 아닌 텍스트 인식이 목적이므로 품질 손실 최소화.
2. **Base64 직접 전달**: `/api/ocr`가 `imageBase64` 파라미터를 직접 수신. COS에서 재다운로드하는 불필요한 네트워크 왕복 제거.
3. **Exponential Backoff**: Gemini API의 간헐적 오류에 대비한 재시도 로직. 1초 → 2초 → 4초 대기 후 재시도.

---

## 3. 클라이언트 상태 & 데이터 흐름

브라우저 내부에서의 상태 관리와 데이터 저장 흐름입니다.

```mermaid
flowchart LR
    subgraph Pages["📄 Pages"]
        Home["/ (메인)<br/>업로드 + 카드 생성"]
        History["/history<br/>내 카드"]
        Review["/review<br/>복습 모드"]
    end

    subgraph Store["🧠 Zustand Store"]
        direction TB
        AppState["step | processingSubStep<br/>imageUrl | ocrText<br/>cards | error"]
        ReviewState["reviewCards | reviewIndex<br/>reviewResults<br/>reviewStartTime"]
    end

    subgraph LocalDB["💾 IndexedDB"]
        Cards["cards 스토어<br/>id, question, answer<br/>createdAt, reviewCount"]
        Decks["decks 스토어<br/>id, name, cardIds<br/>(향후 모음집 기능)"]
    end

    subgraph Components["🧩 Components"]
        Uploader["ImageUploader"]
        Cropper["ImageCropper"]
        FList["FlashcardList"]
        FItem["FlashcardItem"]
        Study["StudyListView"]
        EditModal["CardEditModal"]
        RMode["ReviewMode"]
        RResult["ReviewResult"]
    end

    %% 페이지 → 스토어
    Home -->|"setStep, setCards"| AppState
    Review -->|"startReview, markResult"| ReviewState

    %% 페이지 → DB
    Home -->|"saveCards()"| Cards
    History -->|"getAllCards()"| Cards
    History -->|"updateCard()"| Cards
    History -->|"deleteCard()"| Cards
    Review -->|"getCardsForReview()"| Cards

    %% 페이지 → 컴포넌트
    Home --> Uploader
    Home --> Cropper
    Home --> FList
    History --> FList
    History --> Study
    History --> EditModal
    Review --> RMode
    Review --> RResult

    %% 컴포넌트 관계
    FList --> FItem

    classDef page fill:#6366f1,stroke:#6366f1,color:#fff
    classDef store fill:#f59e0b,stroke:#f59e0b,color:#fff
    classDef db fill:#10b981,stroke:#10b981,color:#fff
    classDef comp fill:#8b5cf6,stroke:#8b5cf6,color:#fff

    class Home,History,Review page
    class AppState,ReviewState store
    class Cards,Decks db
    class Uploader,Cropper,FList,FItem,Study,EditModal,RMode,RResult comp
```

### 데이터 흐름 설명

**상태 관리 전략:**

| 데이터 | 관리 방식 | 이유 |
|--------|---------|------|
| 처리 단계 (`step`) | Zustand | 페이지 내 실시간 UI 전환에 사용. 영속 불필요 |
| 처리 중 서브 단계 | Zustand | 프로그레스 UI용 일시 상태 |
| 생성된 카드 | **IndexedDB** | 영속 저장 필요. 새로고침/재방문 후에도 유지 |
| 복습 진행 상태 | Zustand | 복습 세션 동안만 유지. 세션 종료 시 리셋 |
| 뷰 모드 (`card/study`) | `useState` | 페이지 내 로컬 상태. 전역 공유 불필요 |

**IndexedDB 스키마:**

```
quizdive-db (v1)
├── cards (keyPath: id)
│   ├── index: by-created (createdAt)
│   └── Record: { id, question, answer, createdAt, lastReviewedAt?, reviewCount, nextReviewAt? }
└── decks (keyPath: id)
    └── Record: { id, name, description?, cardIds[], createdAt }
```

---

## 4. API 인증 및 보안 구성

멀티 클라우드 환경에서의 인증 흐름과 보안 설정입니다.

```mermaid
flowchart TB
    subgraph Client["📱 Client"]
        Browser["Browser<br/>quiz.jungyu.store"]
    end

    subgraph EdgeOne["🌐 EdgeOne Serverless"]
        ENV["환경변수"]
        API_Upload["/api/upload"]
        API_OCR["/api/ocr"]
        API_Gen["/api/generate"]
    end

    subgraph Keys["🔑 API Keys (환경변수)"]
        COS_KEY["COS_SECRET_ID<br/>COS_SECRET_KEY<br/>COS_BUCKET / COS_REGION"]
        VISION_KEY["GCP_VISION_API_KEY<br/>제한: Vision API만 허용"]
        GEMINI_KEY["GEMINI_API_KEY<br/>제한: Generative Language API만 허용"]
    end

    subgraph Security["🛡️ 보안 설정"]
        CORS["Tencent COS CORS<br/>허용: quiz.jungyu.store"]
        RATE["Rate Limiter<br/>IP 기반 일 100회"]
        RESTRICT["GCP API Key 제한<br/>Referrer: quiz.jungyu.store/*"]
    end

    Browser -->|"CORS 검증"| CORS
    API_Upload -->|"인증"| COS_KEY
    API_OCR -->|"인증"| VISION_KEY
    API_OCR -->|"호출 제한"| RATE
    API_Gen -->|"인증"| GEMINI_KEY

    COS_KEY --> Tencent_COS["☁️ Tencent COS"]
    VISION_KEY --> GCP_Vision["🔍 GCP Vision"]
    GEMINI_KEY --> GCP_Gemini["🤖 Gemini AI"]

    RESTRICT -.->|"보호"| VISION_KEY
    RESTRICT -.->|"보호"| GEMINI_KEY

    classDef key fill:#ef4444,stroke:#ef4444,color:#fff
    classDef sec fill:#f59e0b,stroke:#f59e0b,color:#000
    
    class COS_KEY,VISION_KEY,GEMINI_KEY key
    class CORS,RATE,RESTRICT sec
```

### 보안 설계 원칙

| 원칙 | 구현 |
|------|------|
| **최소 권한** | 각 API Key는 해당 서비스(Vision / Gemini)만 호출 가능하도록 제한 |
| **Key 분리** | Vision용, Gemini용 Key를 분리하여 탈취 시 피해 범위 최소화 |
| **Referrer 제한** | GCP API Key에 HTTP Referrer 화이트리스트 적용 |
| **CORS 제한** | COS 버킷의 CORS 정책을 프로덕션 도메인으로 한정 |
| **Rate Limiting** | IP 기반 일일 호출 횟수 제한으로 API 남용 방지 |
| **환경변수** | 모든 시크릿을 `.env.local`과 배포 환경변수에서 관리. 코드에 하드코딩 금지 |

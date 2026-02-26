import { createClient } from '@supabase/supabase-js';

type LogLevel = 'INFO' | 'WARN' | 'ERROR';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  duration_ms?: number;
  status?: string;
  [key: string]: unknown;
}

// Supabase 서비스 역할 클라이언트 (서버 사이드 전용)
// RLS를 우회하여 api_logs에 직접 INSERT
let supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (supabaseAdmin) return supabaseAdmin;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) return null; // 환경변수 없으면 graceful skip

  supabaseAdmin = createClient(url, serviceKey);
  return supabaseAdmin;
}

class Logger {
  private service: string;

  constructor(service: string) {
    this.service = service;
  }

  private log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.service,
      message,
      ...meta,
    };

    // 개발 환경: 컬러 콘솔
    if (process.env.NODE_ENV === 'development') {
      const color = level === 'ERROR' ? '\x1b[31m' : level === 'WARN' ? '\x1b[33m' : '\x1b[36m';
      console.log(`${color}[${this.service}] ${message}\x1b[0m`, meta || '');
    } else {
      // 프로덕션: JSON 로그 (EdgeOne 런타임 로그용)
      console.log(JSON.stringify(entry));
    }

    // Supabase에 비동기 저장 (프로덕션 전용, fire-and-forget)
    this.persistToSupabase(entry);

    return entry;
  }

  private async persistToSupabase(entry: LogEntry) {
    if (process.env.NODE_ENV === 'development') return;

    const supabase = getSupabaseAdmin();
    if (!supabase) return;

    try {
      // 주요 필드 분리, 나머지는 meta JSONB에 저장
      const { timestamp, level, service, message, duration_ms, status, ...rest } = entry;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- api_logs는 수동 생성 테이블이므로 타입 정의 외
      await (supabase.from as any)('api_logs').insert({
        timestamp,
        level,
        service,
        message,
        duration_ms: duration_ms ?? null,
        status: status ?? null,
        meta: Object.keys(rest).length > 0 ? rest : {},
      });
    } catch (e) {
      // 로그 저장 실패가 API 응답에 영향주지 않도록 무시
      console.error('Log persist failed:', e);
    }
  }

  info(message: string, meta?: Record<string, unknown>) {
    return this.log('INFO', message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>) {
    return this.log('WARN', message, meta);
  }

  error(message: string, meta?: Record<string, unknown>) {
    return this.log('ERROR', message, meta);
  }

  startTimer() {
    return Date.now();
  }

  endTimer(start: number): number {
    return Date.now() - start;
  }
}

// 서비스별 로거 인스턴스
export const uploadLogger = new Logger('upload');
export const ocrLogger = new Logger('ocr');
export const generateLogger = new Logger('generate');
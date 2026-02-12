type LogLevel = 'INFO' | 'WARN' | 'ERROR';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  duration_ms?: number;
  [key: string]: any;
}

class Logger {
  private service: string;

  constructor(service: string) {
    this.service = service;
  }

  private log(level: LogLevel, message: string, meta?: Record<string, any>) {
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
      // 프로덕션: JSON 로그 (CLS 수집용)
      console.log(JSON.stringify(entry));
    }

    return entry;
  }

  info(message: string, meta?: Record<string, any>) {
    return this.log('INFO', message, meta);
  }

  warn(message: string, meta?: Record<string, any>) {
    return this.log('WARN', message, meta);
  }

  error(message: string, meta?: Record<string, any>) {
    return this.log('ERROR', message, meta);
  }

  // 타이머 유틸 (API 호출 시간 측정)
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
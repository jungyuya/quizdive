// 메모리 기반 Rate Limiter (Serverless 환경 적합)
// 주의: Serverless 함수는 콜드 스타트 시 리셋됩니다.
// 완벽한 제한이 필요하면 Redis/KV 사용 (Phase 5에서 검토)

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const DAILY_LIMIT = 50;

export function checkRateLimit(ip: string): {
    allowed: boolean;
    remaining: number;
    resetAt: Date;
} {
    const now = Date.now();
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const resetAt = todayEnd.getTime();

    const entry = rateLimitMap.get(ip);

    // 새 날이거나 첫 요청
    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(ip, { count: 1, resetAt });
        return { allowed: true, remaining: DAILY_LIMIT - 1, resetAt: todayEnd };
    }

    // 한도 초과
    if (entry.count >= DAILY_LIMIT) {
        return { allowed: false, remaining: 0, resetAt: todayEnd };
    }

    // 카운트 증가
    entry.count++;
    return { allowed: true, remaining: DAILY_LIMIT - entry.count, resetAt: todayEnd };
}

// IP 추출 헬퍼
export function getClientIP(req: Request): string {
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();
    const real = req.headers.get('x-real-ip');
    if (real) return real;
    return '127.0.0.1';
}
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const supabase = await createClient();

    // 인증 확인 (로그인 사용자만)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '24h';

    // 시간 범위 계산
    const rangeMap: Record<string, string> = {
        '24h': '24 hours',
        '7d': '7 days',
        '30d': '30 days',
    };
    const interval = rangeMap[range] || '24 hours';

    // 1. 요약 통계
    const { data: summary } = await supabase.rpc('get_log_summary', {
        time_interval: interval,
    });

    // 2. 시간대별 요청 수
    const { data: hourlyRequests } = await supabase.rpc('get_hourly_requests', {
        time_interval: interval,
    });

    // 3. 상태 분포
    const { data: statusDistribution } = await supabase.rpc('get_status_distribution', {
        time_interval: interval,
    });

    // 4. 서비스별 평균 응답 시간
    const { data: serviceAvgDuration } = await supabase.rpc('get_service_avg_duration', {
        time_interval: interval,
    });

    // 5. 최근 에러
    const { data: recentErrors } = await supabase
        .from('api_logs')
        .select('timestamp, service, message, duration_ms, meta')
        .eq('level', 'ERROR')
        .gte('timestamp', new Date(Date.now() - parseDuration(interval)).toISOString())
        .order('timestamp', { ascending: false })
        .limit(20);

    // 6. 일별 카드 생성 수
    const { data: dailyCardCount } = await supabase.rpc('get_daily_card_count', {
        time_interval: interval,
    });

    return NextResponse.json({
        summary: summary?.[0] ?? { total: 0, errors: 0, avg_duration: 0 },
        hourlyRequests: hourlyRequests ?? [],
        statusDistribution: statusDistribution ?? [],
        serviceAvgDuration: serviceAvgDuration ?? [],
        recentErrors: recentErrors ?? [],
        dailyCardCount: dailyCardCount ?? [],
    });
}

function parseDuration(interval: string): number {
    const match = interval.match(/(\d+)\s*(hours?|days?)/);
    if (!match) return 24 * 60 * 60 * 1000;
    const [, num, unit] = match;
    const ms = unit.startsWith('hour') ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    return parseInt(num) * ms;
}
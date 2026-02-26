'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { SummaryCards } from './SummaryCards';
import { HourlyChart } from './HourlyChart';
import { StatusPieChart } from './StatusPieChart';
import { ServiceBarChart } from './ServiceBarChart';
import { ErrorTable } from './ErrorTable';
import { DailyCardChart } from './DailyCardChart';
import { RefreshCw } from 'lucide-react';

type TimeRange = '24h' | '7d' | '30d';

export interface MonitoringData {
    summary: { total: number; errors: number; avg_duration: number };
    hourlyRequests: { hour: string; count: number }[];
    statusDistribution: { level: string; count: number }[];
    serviceAvgDuration: { service: string; avg_ms: number; count: number }[];
    recentErrors: { timestamp: string; service: string; message: string; duration_ms: number; meta: Record<string, unknown> }[];
    dailyCardCount: { day: string; count: number }[];
}

export function MonitoringDashboard() {
    const { user, loading: authLoading } = useAuth();
    const [range, setRange] = useState<TimeRange>('24h');
    const [data, setData] = useState<MonitoringData | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchData = () => {
        if (!user) return;
        setLoading(true);
        fetch(`/api/admin/monitoring?range=${range}`)
            .then(res => res.json())
            .then((d) => {
                setData(d);
                setLastUpdated(new Date());
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [range, user]);

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-muted-foreground animate-pulse">로딩 중...</div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-2">
                    <p className="text-lg font-semibold">🔒 접근 제한</p>
                    <p className="text-muted-foreground">로그인이 필요합니다.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
            {/* 헤더 */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">📊 QuizDive 운영 대시보드</h1>
                    {lastUpdated && (
                        <p className="text-xs text-muted-foreground mt-1">
                            마지막 업데이트: {lastUpdated.toLocaleTimeString('ko-KR')}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {/* 시간 범위 선택 */}
                    {(['24h', '7d', '30d'] as const).map(r => (
                        <button
                            key={r}
                            onClick={() => setRange(r)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${range === r
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {r === '24h' ? '24시간' : r === '7d' ? '7일' : '30일'}
                        </button>
                    ))}
                    {/* 새로고침 */}
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                        aria-label="새로고침"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {loading && !data ? (
                <div className="text-center py-20 text-muted-foreground animate-pulse">
                    데이터 로딩 중...
                </div>
            ) : data ? (
                <>
                    <SummaryCards summary={data.summary} />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <HourlyChart data={data.hourlyRequests} />
                        <StatusPieChart data={data.statusDistribution} />
                        <ServiceBarChart data={data.serviceAvgDuration} />
                        <DailyCardChart data={data.dailyCardCount} />
                    </div>
                    <ErrorTable errors={data.recentErrors} />
                </>
            ) : (
                <div className="text-center py-20 text-muted-foreground">
                    데이터를 불러올 수 없습니다.
                </div>
            )}
        </div>
    );
}

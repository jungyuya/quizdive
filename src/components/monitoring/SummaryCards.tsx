interface Props {
    summary: { total: number; errors: number; avg_duration: number };
}

export function SummaryCards({ summary }: Props) {
    const errorRate = summary.total > 0
        ? ((summary.errors / summary.total) * 100).toFixed(1)
        : '0.0';

    const cards = [
        {
            label: '총 요청 수',
            value: summary.total.toLocaleString(),
            icon: '📡',
            sub: '전체 API 호출',
        },
        {
            label: '에러율',
            value: `${errorRate}%`,
            icon: '🔴',
            sub: `에러 ${summary.errors}건`,
            alert: parseFloat(errorRate) > 5,
        },
        {
            label: '평균 응답 시간',
            value: summary.avg_duration ? `${(summary.avg_duration / 1000).toFixed(1)}s` : '-',
            icon: '⚡',
            sub: `${summary.avg_duration ?? 0}ms`,
            alert: (summary.avg_duration ?? 0) > 10000,
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {cards.map(card => (
                <div
                    key={card.label}
                    className={`rounded-xl border p-5 transition-colors ${card.alert
                            ? 'border-red-500/50 bg-red-500/5 dark:bg-red-500/10'
                            : 'border-border bg-card'
                        }`}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{card.icon}</span>
                            {card.label}
                        </div>
                        {card.alert && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 font-medium">
                                임계치 초과
                            </span>
                        )}
                    </div>
                    <div className="text-2xl font-bold mt-2">{card.value}</div>
                    <div className="text-xs text-muted-foreground mt-1">{card.sub}</div>
                </div>
            ))}
        </div>
    );
}

'use client';

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Cell,
} from 'recharts';

interface Props {
    data: { service: string; avg_ms: number; count: number }[];
}

const SERVICE_COLORS: Record<string, string> = {
    upload: '#3B82F6',
    ocr: '#8B5CF6',
    generate: '#F59E0B',
    'generate-stream': '#EF4444',
};

export function ServiceBarChart({ data }: Props) {
    const formatted = data.map(d => ({
        ...d,
        avg_sec: (d.avg_ms / 1000).toFixed(1),
    }));

    return (
        <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold mb-4">📊 API별 평균 응답 시간</h3>
            {formatted.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                    데이터 없음
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={formatted} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                        <XAxis
                            type="number"
                            tick={{ fontSize: 11 }}
                            stroke="var(--color-muted-foreground)"
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) => `${(v / 1000).toFixed(1)}s`}
                        />
                        <YAxis
                            type="category"
                            dataKey="service"
                            tick={{ fontSize: 12 }}
                            stroke="var(--color-muted-foreground)"
                            tickLine={false}
                            axisLine={false}
                            width={100}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--color-card)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '8px',
                                fontSize: '12px',
                            }}
                            formatter={(value: number | undefined) => [`${((value ?? 0) / 1000).toFixed(2)}s`, '평균 응답']}
                            labelFormatter={(label) => `API: ${label}`}
                        />
                        <Bar dataKey="avg_ms" radius={[0, 6, 6, 0]} barSize={28} name="평균 응답 시간">
                            {formatted.map((entry) => (
                                <Cell
                                    key={entry.service}
                                    fill={SERVICE_COLORS[entry.service] || '#94A3B8'}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}

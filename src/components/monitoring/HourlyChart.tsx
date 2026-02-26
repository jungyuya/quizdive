'use client';

import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from 'recharts';

interface Props {
    data: { hour: string; count: number }[];
}

export function HourlyChart({ data }: Props) {
    const formatted = data.map(d => ({
        ...d,
        label: new Date(d.hour).toLocaleString('ko-KR', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            hour12: false,
        }),
    }));

    return (
        <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold mb-4">📈 시간대별 요청 수</h3>
            {formatted.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                    데이터 없음
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={formatted}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis
                            dataKey="label"
                            tick={{ fontSize: 11 }}
                            stroke="var(--color-muted-foreground)"
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 11 }}
                            stroke="var(--color-muted-foreground)"
                            tickLine={false}
                            axisLine={false}
                            allowDecimals={false}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--color-card)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '8px',
                                fontSize: '12px',
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="count"
                            stroke="#7C3AED"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            activeDot={{ r: 5 }}
                            name="요청 수"
                        />
                    </LineChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}

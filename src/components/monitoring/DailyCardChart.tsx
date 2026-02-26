'use client';

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from 'recharts';

interface Props {
    data: { day: string; count: number }[];
}

export function DailyCardChart({ data }: Props) {
    const formatted = data.map(d => ({
        ...d,
        label: new Date(d.day).toLocaleDateString('ko-KR', {
            month: 'short',
            day: 'numeric',
        }),
    }));

    return (
        <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold mb-4">📈 일별 카드 생성 수</h3>
            {formatted.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                    데이터 없음
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={formatted}>
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
                            formatter={(value: number | undefined) => [value ?? 0, '카드 생성']}
                        />
                        <Bar
                            dataKey="count"
                            fill="#7C3AED"
                            radius={[6, 6, 0, 0]}
                            barSize={32}
                            name="카드 수"
                        />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}

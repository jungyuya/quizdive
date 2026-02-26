'use client';

import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
} from 'recharts';

interface Props {
    data: { level: string; count: number }[];
}

const COLORS: Record<string, string> = {
    INFO: '#22C55E',
    WARN: '#F59E0B',
    ERROR: '#EF4444',
};

export function StatusPieChart({ data }: Props) {
    return (
        <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold mb-4">🥧 로그 레벨 분포</h3>
            {data.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                    데이터 없음
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={4}
                            dataKey="count"
                            nameKey="level"
                            label={({ name, value }: { name?: string; value?: number }) => `${name ?? ''} (${value ?? 0})`}
                            labelLine={false}
                        >
                            {data.map((entry) => (
                                <Cell
                                    key={entry.level}
                                    fill={COLORS[entry.level] || '#94A3B8'}
                                    stroke="none"
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--color-card)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '8px',
                                fontSize: '12px',
                            }}
                        />
                        <Legend
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{ fontSize: '12px' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}

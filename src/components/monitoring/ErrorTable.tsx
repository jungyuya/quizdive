interface Props {
    errors: {
        timestamp: string;
        service: string;
        message: string;
        duration_ms: number;
        meta: Record<string, unknown>;
    }[];
}

export function ErrorTable({ errors }: Props) {
    return (
        <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold mb-4">📋 최근 에러 로그</h3>
            {errors.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                    ✅ 에러 없음 — 정상 운영 중
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border text-left text-muted-foreground">
                                <th className="pb-2 pr-4 font-medium">시간</th>
                                <th className="pb-2 pr-4 font-medium">서비스</th>
                                <th className="pb-2 pr-4 font-medium">메시지</th>
                                <th className="pb-2 font-medium text-right">응답 시간</th>
                            </tr>
                        </thead>
                        <tbody>
                            {errors.map((err, i) => (
                                <tr key={i} className="border-b border-border/50 last:border-0">
                                    <td className="py-2.5 pr-4 text-xs text-muted-foreground whitespace-nowrap">
                                        {new Date(err.timestamp).toLocaleString('ko-KR', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit',
                                            hour12: false,
                                        })}
                                    </td>
                                    <td className="py-2.5 pr-4">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-red-500/10 text-red-500">
                                            {err.service}
                                        </span>
                                    </td>
                                    <td className="py-2.5 pr-4 max-w-xs truncate" title={err.message}>
                                        {err.message}
                                    </td>
                                    <td className="py-2.5 text-right text-xs text-muted-foreground whitespace-nowrap">
                                        {err.duration_ms ? `${(err.duration_ms / 1000).toFixed(1)}s` : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

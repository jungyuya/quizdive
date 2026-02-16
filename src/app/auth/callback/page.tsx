'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [error, setError] = useState<string | null>(null);

    // 컴포넌트 마운트 시 한 번만 클라이언트 생성 (인스턴스 재생성 방지)
    const [supabase] = useState(() => createClient());

    useEffect(() => {
        const code = searchParams.get('code');
        const next = searchParams.get('next') ?? '/';

        if (code) {
            // 이미 세션이 있는지 먼저 확인 (중복 교환 및 경쟁 상태 방지)
            supabase.auth.getSession().then(({ data: { session } }) => {
                if (session) {
                    router.push(next);
                    return;
                }

                // 세션 없으면 코드 교환 시도
                supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
                    if (!error) {
                        router.push(next);
                    } else {
                        console.error('Auth Error:', error);
                        // PKCE 에러인 경우에도 홈으로 보내서 재시도 유도
                        // (이미 로그인된 상태일 수도 있으므로)
                        setError(error.message);
                        setTimeout(() => router.replace('/'), 2000);
                    }
                });
            });
        } else {
            router.replace('/');
        }
    }, [searchParams, router, supabase]);

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <p className="text-red-500 mb-2">로그인 처리 중 오류가 발생했습니다.</p>
                <p className="text-sm text-muted-foreground">{error}</p>
                <p className="text-xs text-muted-foreground mt-4">잠시 후 메인으로 이동합니다...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">로그인 처리 중...</p>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
            <CallbackContent />
        </Suspense>
    );
}

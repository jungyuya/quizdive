'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const code = searchParams.get('code');
        const next = searchParams.get('next') ?? '/';

        if (code) {
            const supabase = createClient();
            supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
                if (!error) {
                    router.push(next);
                } else {
                    setError(error.message);
                    setTimeout(() => router.push('/'), 3000);
                }
            });
        } else {
            router.push('/');
        }
    }, [searchParams, router]);

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

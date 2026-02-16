'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { migrateLocalCardsToRemote } from '@/lib/migration';
import { toast } from 'sonner';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signInWithGoogle: async () => { },
    signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
    const migrationDone = useRef(false); // 중복 마이그레이션 방지

    // 마이그레이션 실행 함수
    const tryMigrate = async (targetUser: User) => {
        if (migrationDone.current) return;
        migrationDone.current = true;
        try {
            const count = await migrateLocalCardsToRemote(targetUser);
            if (count > 0) {
                toast.success(`기존 카드 ${count}장이 계정에 저장되었습니다 ✅`);
            }
        } catch (error) {
            console.error('마이그레이션 실패:', error);
            toast.error('카드 이전 중 오류가 발생했습니다');
            migrationDone.current = false; // 실패 시 다시 시도 가능하도록
        }
    };

    useEffect(() => {
        // 초기 세션 확인
        // Google OAuth 리다이렉트 후 페이지가 새로 로드되면 여기서 유저를 발견함
        supabase.auth.getUser().then(async ({ data: { user: initialUser } }) => {
            if (initialUser) {
                // 마이그레이션을 setUser 전에 실행 (race condition 방지)
                await tryMigrate(initialUser);
            }
            setUser(initialUser);
            setLoading(false);
        });

        // 인증 상태 변경 구독 (탭 전환 시 세션 복구, 토큰 갱신 등)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            // SIGNED_IN: 같은 탭에서 로그인 완료 시 (OAuth 리다이렉트가 아닌 경우)
            // INITIAL_SESSION: 페이지 새로 로드 시 기존 세션 복원
            if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
                await tryMigrate(session.user);
            }

            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        migrationDone.current = false; // 로그아웃 시 리셋 (다음 로그인 시 마이그레이션 허용)
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}
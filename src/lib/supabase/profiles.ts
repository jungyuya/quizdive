import { createClient } from '@/lib/supabase/client';

export type UserRole = 'user' | 'premium' | 'admin';

/**
 * 현재 로그인 사용자의 role을 조회합니다.
 * profiles 테이블에 행이 없으면 'user'를 기본값으로 반환합니다.
 */
export async function getUserRole(): Promise<UserRole> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 'user';

  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return (data?.role as UserRole) ?? 'user';
}

/**
 * 사용자 role에 따른 최대 청크 수를 반환합니다.
 */
export function getMaxChunks(role: UserRole): number {
  switch (role) {
    case 'admin':   return Infinity;
    case 'premium': return 20;
    default:        return 5;
  }
}

/**
 * 사용자 role에 따른 일일 최대 generate 호출 수를 반환합니다.
 */
export function getDailyGenerateLimit(role: UserRole): number {
  switch (role) {
    case 'admin':   return Infinity;
    case 'premium': return 100;
    default:        return 30;
  }
}
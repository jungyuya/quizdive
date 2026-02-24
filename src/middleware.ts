import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // 정적 파일, API, 그리고 auth callback 라우트 제외
    // ⚠️ api 추가 이유: updateSession()이 FormData 업로드를 버퍼링하여
    //    /api/upload에서 50초+ 지연 발생 (Supabase getUser() fetch 타임아웃)
    '/((?!_next/static|_next/image|favicon.ico|api|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
import { getAllCards, deleteAllCards } from '@/lib/db';
import { saveCardsRemote } from '@/lib/supabase/cards';
import type { User } from '@supabase/supabase-js';

export async function migrateLocalCardsToRemote(user: User): Promise<number> {
    // 1. 로컬 카드 조회
    const localCards = await getAllCards();

    if (localCards.length === 0) return 0;

    // 2. Supabase에 upsert (중복 시 무시)
    await saveCardsRemote(localCards, user.id);

    // 3. 로컬 데이터 정리 (서버가 주 저장소가 되므로)
    await deleteAllCards();

    return localCards.length;
}
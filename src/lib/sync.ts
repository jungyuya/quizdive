import { saveCards, deleteAllCards } from '@/lib/db';
import { getAllCardsRemote } from '@/lib/supabase/cards';

/**
 * 원격(Supabase) → 로컬(IndexedDB) 단방향 동기화
 * 서버 데이터를 기준(Single Source of Truth)으로 로컬 캐시를 갱신
 */
export async function syncRemoteToLocal(): Promise<number> {
  // 1. Supabase에서 전체 카드 조회
  const remoteCards = await getAllCardsRemote();

  // 2. 로컬 IndexedDB 초기화 후 서버 데이터로 교체
  await deleteAllCards();
  if (remoteCards.length > 0) {
    await saveCards(remoteCards);
  }

  return remoteCards.length;
}
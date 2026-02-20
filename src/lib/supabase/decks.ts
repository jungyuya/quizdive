import { createClient } from '@/lib/supabase/client';
import type { Deck, Flashcard } from '@/types';
import { nanoid } from 'nanoid';

const supabase = createClient();

export async function createDeck(name: string, userId: string, description?: string) {
    const { data, error } = await supabase
        .from('decks')
        .insert({ name, description, user_id: userId })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getAllDecks(): Promise<Deck[]> {
    const { data, error } = await supabase
        .from('decks')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        cardIds: [], // deck_cards에서 별도 조회
        createdAt: new Date(row.created_at),
    }));
}

export async function getDeckWithCards(deckId: string) {
    const { data, error } = await supabase
        .from('deck_cards')
        .select('card_id, cards(*)')
        .eq('deck_id', deckId);

    if (error) throw error;
    return data;
}

export async function addCardToDeck(deckId: string, cardId: string) {
    const { error } = await supabase
        .from('deck_cards')
        .upsert({ deck_id: deckId, card_id: cardId });

    if (error) throw error;
}

export async function removeCardFromDeck(deckId: string, cardId: string) {
    const { error } = await supabase
        .from('deck_cards')
        .delete()
        .eq('deck_id', deckId)
        .eq('card_id', cardId);

    if (error) throw error;
}

export async function deleteDeck(deckId: string) {
    const { error } = await supabase.from('decks').delete().eq('id', deckId);
    if (error) throw error;
}

// 공유 링크 생성 (토글)
export async function toggleDeckShare(deckId: string): Promise<{
    isPublic: boolean;
    shareUrl: string | null;
}> {
    const supabase = createClient();

    // 현재 상태 조회
    const { data: deck } = await supabase
        .from('decks')
        .select('is_public, share_id')
        .eq('id', deckId)
        .single();

    if (!deck) throw new Error('모음집을 찾을 수 없습니다.');

    const newPublic = !deck.is_public;
    const shareId = newPublic
        ? (deck.share_id || nanoid(8)) // 기존 ID 재사용 또는 새로 생성
        : deck.share_id; // 비공개로 전환해도 ID 유지

    const { error } = await supabase
        .from('decks')
        .update({ is_public: newPublic, share_id: shareId })
        .eq('id', deckId);

    if (error) throw error;

    return {
        isPublic: newPublic,
        shareUrl: newPublic
            ? `${window.location.origin}/shared/${shareId}`
            : null,
    };
}

// 공유 ID로 모음집 조회 (비인증 사용자도 접근 가능)
export async function getSharedDeck(shareId: string) {
    const supabase = createClient();

    const { data: deck, error: deckError } = await supabase
        .from('decks')
        .select('*')
        .eq('share_id', shareId)
        .eq('is_public', true)
        .single();

    if (deckError || !deck) return null;

    const { data: cards } = await supabase
        .from('deck_cards')
        .select('card_id, cards(*)')
        .eq('deck_id', deck.id);

    const flashcards: Flashcard[] = (cards ?? [])
        .map((c): Flashcard | null => {
            const card = Array.isArray(c.cards) ? c.cards[0] : c.cards;
            if (!card) return null;
            return {
                id: card.id,
                question: card.question,
                answer: card.answer,
                createdAt: new Date(card.created_at),
                lastReviewedAt: card.last_reviewed_at ? new Date(card.last_reviewed_at) : undefined,
                reviewCount: card.review_count ?? 0,
                nextReviewAt: card.next_review_at ? new Date(card.next_review_at) : undefined,
                source: card.source ?? undefined,
            };
        })
        .filter((c): c is Flashcard => c !== null);

    return { deck, cards: flashcards };
}
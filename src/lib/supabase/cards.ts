import { createClient } from '@/lib/supabase/client';
import type { Flashcard } from '@/types';

const supabase = createClient();

// ===== Supabase → Flashcard 타입 변환 =====
function toFlashcard(row: any): Flashcard {
    return {
        id: row.id,
        question: row.question,
        answer: row.answer,
        createdAt: new Date(row.created_at),
        lastReviewedAt: row.last_reviewed_at ? new Date(row.last_reviewed_at) : undefined,
        reviewCount: row.review_count,
        nextReviewAt: row.next_review_at ? new Date(row.next_review_at) : undefined,
    };
}

// ===== CRUD =====
export async function saveCardsRemote(cards: Flashcard[], userId: string) {
    const rows = cards.map((card) => ({
        id: card.id,
        user_id: userId,
        question: card.question,
        answer: card.answer,
        created_at: card.createdAt.toISOString(),
        review_count: card.reviewCount,
        last_reviewed_at: card.lastReviewedAt?.toISOString() ?? null,
        next_review_at: card.nextReviewAt?.toISOString() ?? null,
    }));

    const { error } = await supabase.from('cards').upsert(rows);
    if (error) throw new Error(error.message);
}

export async function getAllCardsRemote(): Promise<Flashcard[]> {
    const { data, error } = await supabase
        .from('cards')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map(toFlashcard);
}

export async function updateCardRemote(card: Flashcard) {
    const { error } = await supabase
        .from('cards')
        .update({
            question: card.question,
            answer: card.answer,
            last_reviewed_at: card.lastReviewedAt?.toISOString() ?? null,
            review_count: card.reviewCount,
            next_review_at: card.nextReviewAt?.toISOString() ?? null,
        })
        .eq('id', card.id);

    if (error) throw error;
}

export async function deleteCardRemote(id: string) {
    const { error } = await supabase.from('cards').delete().eq('id', id);
    if (error) throw error;
}

export async function deleteAllCardsRemote() {
    const { error } = await supabase.from('cards').delete().not('id', 'is', null);
    if (error) throw new Error(error.message);
}
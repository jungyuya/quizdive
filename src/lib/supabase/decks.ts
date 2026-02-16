import { createClient } from '@/lib/supabase/client';
import type { Deck } from '@/types';

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
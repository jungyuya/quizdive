import { saveCards, getAllCards, updateCard, deleteCard, deleteAllCards } from '@/lib/db';
import {
    saveCardsRemote, getAllCardsRemote, updateCardRemote,
    deleteCardRemote, deleteAllCardsRemote
} from '@/lib/supabase/cards';
import type { Flashcard } from '@/types';
import type { User } from '@supabase/supabase-js';

// 로그인 상태면 Supabase, 아니면 IndexedDB
export function createCardService(user: User | null) {
    if (user) {
        return {
            save: (cards: Flashcard[]) => saveCardsRemote(cards, user.id),
            getAll: () => getAllCardsRemote(),
            update: (card: Flashcard) => updateCardRemote(card),
            remove: (id: string) => deleteCardRemote(id),
            removeAll: () => deleteAllCardsRemote(),
        };
    }

    return {
        save: (cards: Flashcard[]) => saveCards(cards),
        getAll: () => getAllCards(),
        update: (card: Flashcard) => updateCard(card),
        remove: (id: string) => deleteCard(id),
        removeAll: () => deleteAllCards(),
    };
}
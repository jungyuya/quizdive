'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { FolderOpen, Copy, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getSharedDeck } from '@/lib/supabase/decks';
import type { Flashcard } from '@/types';
import { FlashcardItem } from '@/components/FlashcardItem';

export default function SharedDeckPage() {
    const params = useParams();
    const shareId = params.sharedId as string;
    const [deck, setDeck] = useState<any>(null);
    const [cards, setCards] = useState<Flashcard[]>([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        async function load() {
            const result = await getSharedDeck(shareId);
            if (!result) {
                setNotFound(true);
            } else {
                setDeck(result.deck);
                setCards(result.cards);
            }
            setLoading(false);
        }
        load();
    }, [shareId]);

    if (loading) return <div className="flex justify-center p-12">로딩 중...</div>;
    if (notFound) return (
        <div className="text-center p-12">
            <h2 className="text-xl font-bold mb-2">모음집을 찾을 수 없습니다</h2>
            <p className="text-muted-foreground">링크가 만료되었거나 비공개로 전환되었을 수 있습니다.</p>
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            {/* 공유 모음집 헤더 */}
            <div className="mb-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <FolderOpen className="w-4 h-4" />
                    <span>공유된 모음집</span>
                </div>
                <h1 className="text-2xl font-bold">{deck.name}</h1>
                {deck.description && (
                    <p className="text-muted-foreground mt-1">{deck.description}</p>
                )}
                <p className="text-sm text-muted-foreground mt-2">
                    카드 {cards.length}장
                </p>
            </div>

            {/* 카드 목록 (읽기 전용) */}
            <div className="space-y-3">
                {cards.map((card) => (
                    <FlashcardItem key={card.id} card={card} />
                ))}
            </div>

            {/* 하단 CTA: 내 모음집으로 가져오기 (Phase 6-C에서 구현 예정) */}
            {/* <Button>내 모음집에 추가</Button> */}
        </div>
    );
}
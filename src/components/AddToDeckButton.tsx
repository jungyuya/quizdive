'use client';

import { useState, useEffect, useRef } from 'react';
import { FolderPlus, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/AuthProvider';
import { getAllDecks, addCardToDeck } from '@/lib/supabase/decks';
import { toast } from 'sonner';
import type { Deck } from '@/types';

interface AddToDeckButtonProps {
    cardId: string;
}

export function AddToDeckButton({ cardId }: AddToDeckButtonProps) {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [decks, setDecks] = useState<Deck[]>([]);
    const [addedTo, setAddedTo] = useState<string | null>(null);
    const ref = useRef<HTMLDivElement>(null);

    // 외부 클릭 시 드롭다운 닫기
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    // 비로그인 시 렌더링 안 함
    if (!user) return null;

    const handleOpen = async (e: React.MouseEvent) => {
        e.stopPropagation(); // ← 카드 flip 방지!
        if (!open) {
            try {
                const allDecks = await getAllDecks();
                setDecks(allDecks);
            } catch {
                toast.error('모음집 목록을 불러올 수 없습니다');
            }
        }
        setOpen(!open);
    };

    const handleAdd = async (e: React.MouseEvent, deck: Deck) => {
        e.stopPropagation(); // ← 카드 flip 방지!
        try {
            await addCardToDeck(deck.id, cardId);
            setAddedTo(deck.id);
            toast.success(`"${deck.name}"에 추가되었습니다`);
            setTimeout(() => { setOpen(false); setAddedTo(null); }, 800);
        } catch {
            toast.error('추가에 실패했습니다');
        }
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={handleOpen}
                className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                title="모음집에 추가"
            >
                <FolderPlus className="w-4 h-4 text-muted-foreground" />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-1 w-48 bg-background border border-border rounded-xl shadow-lg z-50 overflow-hidden"
                        onClick={(e) => e.stopPropagation()} // 드롭다운 영역 클릭 시에도 flip 방지
                    >
                        {decks.length === 0 ? (
                            <div className="p-3 text-sm text-muted-foreground text-center">
                                모음집이 없습니다.<br />
                                <span className="text-xs">먼저 모음집 탭에서 생성하세요</span>
                            </div>
                        ) : (
                            decks.map((deck) => (
                                <button
                                    key={deck.id}
                                    onClick={(e) => handleAdd(e, deck)}
                                    className="w-full px-3 py-2.5 text-sm text-left hover:bg-muted flex items-center justify-between transition-colors"
                                >
                                    <span className="truncate">📁 {deck.name}</span>
                                    {addedTo === deck.id && <Check className="w-4 h-4 text-green-500 shrink-0" />}
                                </button>
                            ))
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
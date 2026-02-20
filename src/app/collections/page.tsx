'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen, Plus, Trash2, ChevronRight, LogIn, Share2, Link2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateDeckModal } from '@/components/CreateDeckModal';
import { CardEditModal } from '@/components/CardEditModal';
import { FlashcardList } from '@/components/FlashcardList';
import { useAuth } from '@/components/AuthProvider';
import { createDeck, getAllDecks, getDeckWithCards, deleteDeck, removeCardFromDeck } from '@/lib/supabase/decks';
import { updateCardRemote } from '@/lib/supabase/cards';
import { toast } from 'sonner';
import { toggleDeckShare } from '@/lib/supabase/decks';
import type { Deck, Flashcard } from '@/types';

export default function CollectionsPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [deckCards, setDeckCards] = useState<Flashcard[]>([]);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [copiedDeckId, setCopiedDeckId] = useState<string | null>(null);

  const loadDecks = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const allDecks = await getAllDecks();
      setDecks(allDecks);
    } catch (error) {
      console.error('모음집 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadDecks();
  }, [loadDecks]);

  const handleCreateDeck = async (name: string, description?: string) => {
    if (!user) return;
    await createDeck(name, user.id, description);
    await loadDecks();
  };

  const handleDeleteDeck = async (deckId: string) => {
    if (!window.confirm('이 모음집을 삭제하시겠습니까?')) return;
    await deleteDeck(deckId);
    setDecks((prev) => prev.filter((d) => d.id !== deckId));
    if (selectedDeck?.id === deckId) {
      setSelectedDeck(null);
      setDeckCards([]);
    }
  };

  const handleSelectDeck = async (deck: Deck) => {
    setSelectedDeck(deck);
    try {
      const data = await getDeckWithCards(deck.id);
      // getDeckWithCards 반환 형태: [{ card_id, cards: { ...row } }]
      const cards: Flashcard[] = (data ?? []).map((row: any) => ({
        id: row.cards.id,
        question: row.cards.question,
        answer: row.cards.answer,
        createdAt: new Date(row.cards.created_at),
        reviewCount: row.cards.review_count,
        lastReviewedAt: row.cards.last_reviewed_at ? new Date(row.cards.last_reviewed_at) : undefined,
        nextReviewAt: row.cards.next_review_at ? new Date(row.cards.next_review_at) : undefined,
      }));
      setDeckCards(cards);
    } catch (error) {
      console.error('모음집 카드 로드 실패:', error);
    }
  };

  // 모음집에서 카드 제거
  const handleDeleteFromDeck = async (cardId: string) => {
    if (!selectedDeck) return;
    if (!window.confirm('이 카드를 모음집에서 제거하시겠습니까?')) return;
    try {
      await removeCardFromDeck(selectedDeck.id, cardId);
      setDeckCards((prev) => prev.filter((c) => c.id !== cardId));
      toast.success('모음집에서 제거되었습니다');
    } catch {
      toast.error('제거에 실패했습니다');
    }
  };

  // 카드 편집 저장
  const handleSaveEdit = async (updated: Flashcard) => {
    try {
      await updateCardRemote(updated);
      setDeckCards((prev) => prev.map((c) => c.id === updated.id ? updated : c));
      setEditingCard(null);
      toast.success('카드가 수정되었습니다');
    } catch {
      toast.error('수정에 실패했습니다');
    }
  };

  // 비로그인 상태 화면
  if (!loading && !user) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-8">
        <div className="max-w-4xl mx-auto text-center py-20">
          <FolderOpen className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <h1 className="text-2xl font-bold mb-2">모음집</h1>
          <p className="text-muted-foreground mb-6">
            로그인하면 카드를 모음집으로 정리할 수 있습니다
          </p>
          <Button onClick={signInWithGoogle} className="gap-2">
            <LogIn className="w-4 h-4" />
            Google로 로그인
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-8">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div className="flex items-center gap-3">
            <FolderOpen className="w-7 h-7 text-primary" />
            <h1 className="text-2xl font-bold">
              {selectedDeck ? selectedDeck.name : '내 모음집'}
            </h1>
            {!selectedDeck && (
              <span className="text-sm text-muted-foreground">
                ({decks.length}개)
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {selectedDeck ? (
              <Button variant="outline" onClick={() => { setSelectedDeck(null); setDeckCards([]); }}>
                ← 목록으로
              </Button>
            ) : (
              <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                새 모음집
              </Button>
            )}
          </div>
        </motion.div>

        {/* 로딩 */}
        {isLoading && (
          <div className="text-center py-12 text-muted-foreground">불러오는 중...</div>
        )}

        {/* 모음집 상세 (카드 목록) */}
        {selectedDeck && (
          <AnimatePresence>
            {deckCards.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                이 모음집에 카드가 없습니다. "내 카드"에서 카드를 추가해 보세요.
              </div>
            ) : (
              <FlashcardList
                cards={deckCards}
                onDelete={handleDeleteFromDeck}
                onEdit={(card) => setEditingCard(card)}
              />
            )}
          </AnimatePresence>
        )}

        {/* 모음집 목록 (그리드) */}
        {!selectedDeck && !isLoading && (
          <>
            {decks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <FolderOpen className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-lg text-muted-foreground mb-2">
                  아직 모음집이 없습니다
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  카드를 주제별로 정리해 보세요!
                </p>
                <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  첫 모음집 만들기
                </Button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {decks.map((deck) => (
                  <motion.div
                    key={deck.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group relative bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer"
                    onClick={() => handleSelectDeck(deck)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{deck.name}</h3>
                        {deck.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{deck.description}</p>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex justify-between items-center mt-4 text-xs text-muted-foreground">
                      <span>{new Date(deck.createdAt).toLocaleDateString('ko-KR')}</span>
                      <div className="flex items-center gap-1">
                        {/* 공유 토글 버튼 */}
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              const result = await toggleDeckShare(deck.id);
                              if (result.shareUrl) {
                                await navigator.clipboard.writeText(result.shareUrl);
                                setCopiedDeckId(deck.id);
                                setTimeout(() => setCopiedDeckId(null), 2000);
                                toast.success('공유 링크가 복사되었습니다!');
                              } else {
                                toast.info('공유가 해제되었습니다.');
                              }
                              loadDecks();
                            } catch (err: any) {
                              console.error('공유 토글 실패:', err);
                              toast.error(err.message || '공유 설정에 실패했습니다.');
                            }
                          }}
                          className={`p-1 rounded transition-all ${copiedDeckId === deck.id
                            ? 'text-emerald-500 bg-emerald-500/10'
                            : 'hover:bg-primary/10 hover:text-primary'
                            }`}
                        >
                          {copiedDeckId === deck.id ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Share2 className="w-4 h-4" />
                          )}
                        </button>
                        {/* 삭제 버튼 */}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteDeck(deck.id); }}
                          className="p-1 hover:bg-destructive/10 hover:text-destructive rounded transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* 생성 모달 */}
      {showCreateModal && (
        <CreateDeckModal
          onSave={handleCreateDeck}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* 카드 편집 모달 */}
      {editingCard && (
        <CardEditModal
          card={editingCard}
          onSave={handleSaveEdit}
          onClose={() => setEditingCard(null)}
        />
      )}
    </main>
  );
}
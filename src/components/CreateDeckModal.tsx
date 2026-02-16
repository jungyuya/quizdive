'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CreateDeckModalProps {
  onSave: (name: string, description?: string) => Promise<void>;
  onClose: () => void;
}

export function CreateDeckModal({ onSave, onClose }: CreateDeckModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave(name.trim(), description.trim() || undefined);
      onClose();
    } catch {
      alert('모음집 생성에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-background rounded-2xl border border-border shadow-xl w-full max-w-md mx-4 p-6"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-primary" />
            새 모음집 만들기
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">모음집 이름 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: OS 기말고사, 네트워크 기초"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">설명 (선택)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="예: 2026년 1학기 기말 범위"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            취소
          </Button>
          <Button
            className="flex-1"
            onClick={handleSave}
            disabled={!name.trim() || saving}
          >
            {saving ? '생성 중...' : '만들기'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
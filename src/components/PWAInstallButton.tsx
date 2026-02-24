'use client';

import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

// BeforeInstallPromptEvent 타입 (브라우저 비표준 API)
interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallButton() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // ① 설치 프롬프트 이벤트 캡처 (자동 배너 억제)
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };
        window.addEventListener('beforeinstallprompt', handler);

        // ② 이미 설치된 경우 감지 (standalone 모드)
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        await deferredPrompt.prompt();
        const result = await deferredPrompt.userChoice;
        if (result.outcome === 'accepted') {
            setIsInstalled(true);
        }
        setDeferredPrompt(null);
    };

    // 설치 불가 상태이거나 이미 설치됨 → 버튼 숨김
    if (!deferredPrompt || isInstalled) return null;

    return (
        <button
            onClick={handleInstall}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
            aria-label="앱 설치"
        >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">앱 설치</span>
        </button>
    );
}

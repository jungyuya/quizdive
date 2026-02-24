'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FolderOpen } from 'lucide-react';
import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, BookOpen, GraduationCap, Moon, Sun, LogOut } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PWAInstallButton } from './PWAInstallButton';



export function Navbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  const navItems = useMemo(() => {
    const base = [
      { href: '/', label: '만들기', icon: Camera },
      { href: '/history', label: '내 카드', icon: BookOpen },
    ];

    // 로그인 상태에서만 모음집 탭 표시
    if (user) {
      base.push({ href: '/collections', label: '모음집', icon: FolderOpen });
    }

    base.push({ href: '/review', label: '복습', icon: GraduationCap });
    return base;
  }, [user]);

  // hydration 불일치 방지
  useEffect(() => {
    setMounted(true);
  }, []);

  // 프로필 메뉴 외부 클릭 감지
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileMenu]);

  return (
    <>
      {/* 데스크톱 상단 네비게이션 */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/50">
        <nav className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* 로고 */}
          <Link href="/" className="flex items-center">
            <Image
              src="/homelogo.webp"
              alt="QuizDive"
              width={200}
              height={50}
              className="w-auto h-9 md:h-12 object-contain"
              sizes="(max-width: 768px) 140px, 200px"
              priority
              unoptimized
            />
          </Link>

          {/* 데스크톱 메뉴 */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* 우측 영역: PWA설치 + 다크모드 + 로그인 */}
          <div className="flex items-center gap-2">
            {/* PWA 설치 버튼 (로그인 사용자만) */}
            {user && <PWAInstallButton />}

            {/* 다크모드 토글 */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                aria-label="테마 전환"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
            )}

            {/* 로그인/프로필 */}
            {!loading && (
              user ? (
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
                  >
                    <img
                      src={user.user_metadata.avatar_url}
                      alt="프로필"
                      className="w-7 h-7 rounded-full"
                    />
                    <span className="text-sm hidden lg:inline">
                      {user.user_metadata.name}
                    </span>
                  </button>

                  {/* 드롭다운 메뉴 */}
                  <AnimatePresence>
                    {showProfileMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-background shadow-lg overflow-hidden z-50"
                      >
                        <div className="px-4 py-3 border-b border-border">
                          <p className="text-sm font-medium">{user.user_metadata.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                        <div className="p-1">
                          <button
                            onClick={() => {
                              setShowProfileMenu(false);
                              signOut();
                            }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            로그아웃
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <button
                  onClick={signInWithGoogle}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                  Google로 로그인
                </button>
              )
            )}
          </div>
        </nav>
      </header>

      {/* 모바일 하단 탭 바 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border/50 safe-area-bottom">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[64px] relative',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 w-12 h-0.5 bg-primary rounded-full"
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
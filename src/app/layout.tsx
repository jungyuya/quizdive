import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from '@/components/Navbar';
import { ThemeProvider } from 'next-themes';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: 'QuizDive - AI 플래시카드',
  description: '사진 한 장으로 AI 플래시카드 생성',
  manifest: '/manifest.json',
  themeColor: '#7C3AED',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Navbar />
          <div className="pb-20 md:pb-0"> {/* 모바일 하단 탭 높이만큼 패딩 */}
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}



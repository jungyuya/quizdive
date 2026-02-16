import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/components/AuthProvider';
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
  // manifest: '/manifest.json', // PWA 잠시 숨김
  themeColor: '#7C3AED',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-1">
                {children}
              </main>
              <Footer />
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}



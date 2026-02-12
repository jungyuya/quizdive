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



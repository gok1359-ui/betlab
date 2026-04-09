import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import BetLabBrand from "@/components/site/BetLabBrand";

export const metadata: Metadata = {
  title: "BetLab",
  description: "MLB 분석, 추천, 커뮤니티를 제공하는 BetLab",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <div className="site-shell">
          <header className="site-header">
            <div className="site-header-inner">
              <Link href="/" className="site-brand-wrap" aria-label="BetLab 홈">
                <BetLabBrand />
              </Link>

              <nav className="site-nav" aria-label="주요 메뉴">
                <Link href="/" className="site-nav-link">홈</Link>
                <Link href="/games" className="site-nav-link">경기</Link>
                <Link href="/community" className="site-nav-link">커뮤니티</Link>
                <Link href="/predictions" className="site-nav-link">내 예측</Link>
                <Link href="/rankings" className="site-nav-link">랭킹</Link>
              </nav>
            </div>
          </header>

          <main className="site-main">{children}</main>
        </div>
      </body>
    </html>
  );
}

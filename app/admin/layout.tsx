import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guard";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <main className="space-y-4">
      <div className="card">
        <div className="section-header">
          <h1 className="text-2xl font-bold">관리자 센터</h1>
          <span>운영 / 분석 / 검증 / 범위 / 최적화 / 자동화</span>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "16px" }}>
          <Link href="/admin" className="button" style={{ width: "160px", textAlign: "center", lineHeight: "42px" }}>관리자 홈</Link>
          <Link href="/admin/analytics" className="button" style={{ width: "160px", textAlign: "center", lineHeight: "42px" }}>분석툴</Link>
          <Link href="/admin/validation" className="button" style={{ width: "160px", textAlign: "center", lineHeight: "42px" }}>검증 탭</Link>
          <Link href="/admin/range" className="button" style={{ width: "160px", textAlign: "center", lineHeight: "42px" }}>범위 분석</Link>
          <Link href="/admin/optimize" className="button" style={{ width: "160px", textAlign: "center", lineHeight: "42px" }}>자동 최적화</Link>
          <Link href="/admin/automation" className="button" style={{ width: "160px", textAlign: "center", lineHeight: "42px" }}>자동 운영</Link>
          <Link href="/admin/users" className="button" style={{ width: "160px", textAlign: "center", lineHeight: "42px" }}>유저 관리</Link>
          <Link href="/admin/settings" className="button" style={{ width: "160px", textAlign: "center", lineHeight: "42px" }}>설정</Link>
        </div>
      </div>

      {children}
    </main>
  );
}

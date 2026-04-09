import Link from "next/link";
import AdminDashboardSummary from "@/components/admin/AdminDashboardSummary";

export default function AdminPage() {
  return (
    <main className="space-y-4">
      <div className="card">
        <h1 className="text-3xl font-bold">관리자 대시보드</h1>
        <p className="mt-2 opacity-80">운영 / 분석 / 검증 / 자동화 / 유저 유지 요소를 한 번에 보는 시작 화면.</p>
      </div>

      <AdminDashboardSummary />

      <div className="grid-3">
        <Link href="/admin/analytics" className="card">
          <strong>분석툴</strong>
          <p className="mt-2 opacity-80">경기 불러오기, 분석 실행, 저장</p>
        </Link>

        <Link href="/admin/validation" className="card">
          <strong>검증 탭</strong>
          <p className="mt-2 opacity-80">적중/미적중, 적중률, 고BB 검증</p>
        </Link>

        <Link href="/admin/range" className="card">
          <strong>범위 분석</strong>
          <p className="mt-2 opacity-80">날짜 범위 분석, 범위 검증, 요약</p>
        </Link>

        <Link href="/admin/optimize" className="card">
          <strong>자동 최적화</strong>
          <p className="mt-2 opacity-80">기간 검증 기반 추천 영향도 계산</p>
        </Link>

        <Link href="/admin/automation" className="card">
          <strong>자동 운영</strong>
          <p className="mt-2 opacity-80">자동 분석 저장 / 결과 입력 / 정산 로그</p>
        </Link>

        <Link href="/admin/users" className="card">
          <strong>유저 관리</strong>
          <p className="mt-2 opacity-80">가입자, 상태, 권한 확인</p>
        </Link>
      </div>
    </main>
  );
}

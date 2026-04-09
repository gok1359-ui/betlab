import { requireAdmin } from "@/lib/auth/guard";
import { getAdminUsers } from "@/lib/db/queries";

export default async function AdminUsersPage() {
  await requireAdmin();
  const users = await getAdminUsers();

  return (
    <main className="space-y-4">
      <div className="card">
        <div className="section-header">
          <h1 className="text-2xl font-bold">유저 관리</h1>
          <span>{users.length}명</span>
        </div>
        <p className="mt-2 opacity-80">가입자 목록과 기본 계정 정보를 확인하는 화면.</p>
      </div>

      <div className="card">
        {users.length === 0 ? (
          <p className="opacity-80">표시할 유저가 없다.</p>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <div key={user.id} className="card">
                <div className="flex items-center justify-between gap-3">
                  <strong>{user.nickname || user.username || "이름없음"}</strong>
                  <span className="badge">{user.role}</span>
                </div>
                <p className="mt-2 opacity-80">아이디: {user.username || "-"}</p>
                <p className="mt-1 opacity-80">이메일: {user.email || "-"}</p>
                <p className="mt-1 opacity-70">가입일: {user.createdAt ? user.createdAt.slice(0, 10) : "-"}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

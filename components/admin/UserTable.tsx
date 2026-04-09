type AdminUser = {
  id: string;
  email: string;
  username: string;
  nickname: string;
  role: string;
  createdAt: string;
  points?: number;
  lastLoginAt?: string | null;
  status?: string;
};

type Props = {
  users: AdminUser[];
};

export default function UserTable({ users }: Props) {
  return (
    <div className="card">
      <div className="section-header">
        <h2 className="text-2xl font-bold">유저 목록</h2>
        <span>{users.length}명</span>
      </div>

      {users.length === 0 ? (
        <p className="mt-4 opacity-80">표시할 유저가 없다.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10">
                <th className="py-3 pr-4">닉네임</th>
                <th className="py-3 pr-4">아이디</th>
                <th className="py-3 pr-4">이메일</th>
                <th className="py-3 pr-4">가입일</th>
                <th className="py-3 pr-4">최근 로그인</th>
                <th className="py-3 pr-4">상태</th>
                <th className="py-3 pr-4">권한</th>
                <th className="py-3 pr-4">포인트</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-white/5">
                  <td className="py-3 pr-4 font-semibold">{user.nickname || user.username || "-"}</td>
                  <td className="py-3 pr-4">{user.username || "-"}</td>
                  <td className="py-3 pr-4">{user.email || "-"}</td>
                  <td className="py-3 pr-4">{user.createdAt ? user.createdAt.slice(0, 10) : "-"}</td>
                  <td className="py-3 pr-4">{user.lastLoginAt ?? "-"}</td>
                  <td className="py-3 pr-4">{user.status ?? "active"}</td>
                  <td className="py-3 pr-4">{user.role || "user"}</td>
                  <td className="py-3 pr-4">{Number(user.points ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

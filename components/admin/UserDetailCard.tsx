type AdminUser = {
  id: string;
  email: string;
  username: string;
  nickname: string;
  role: string;
  createdAt: string;
  points: number;
  lastLoginAt?: string | null;
};

type Props = {
  user: AdminUser;
};

export default function UserDetailCard({ user }: Props) {
  return (
    <div className="space-y-4">
      <div className="card">
        <div className="section-header">
          <div>
            <div className="text-sm opacity-70">유저 상세</div>
            <div className="mt-2 text-2xl font-bold">
              {user.nickname || user.username || "이름없음"}
            </div>
          </div>
          <span className="badge">{user.role || "user"}</span>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="text-sm opacity-70">아이디</div>
          <div className="mt-2">{user.username || "-"}</div>
        </div>

        <div className="card">
          <div className="text-sm opacity-70">이메일</div>
          <div className="mt-2">{user.email || "-"}</div>
        </div>

        <div className="card">
          <div className="text-sm opacity-70">가입일</div>
          <div className="mt-2">{user.createdAt ? user.createdAt.slice(0, 10) : "-"}</div>
        </div>

        <div className="card">
          <div className="text-sm opacity-70">최근 로그인</div>
          <div className="mt-2">{user.lastLoginAt ?? "-"}</div>
        </div>

        <div className="card">
          <div className="text-sm opacity-70">상태 / 권한</div>
          <div className="mt-2">{user.role || "user"}</div>
        </div>

        <div className="card">
          <div className="text-sm opacity-70">포인트</div>
          <div className="mt-2">{Number(user.points ?? 0)}</div>
        </div>
      </div>
    </div>
  );
}

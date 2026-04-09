import { AdminUser } from "@/lib/db/queries";

type Props = {
  user: AdminUser;
};

export default function UserDetailCard({ user }: Props) {
  return (
    <div className="card">
      <h2 className="text-xl font-bold">{user.nickname}</h2>
      <div className="mt-4 grid-2">
        <div className="card">
          <div className="text-sm opacity-70">이메일</div>
          <div className="mt-2">{user.email}</div>
        </div>
        <div className="card">
          <div className="text-sm opacity-70">가입일</div>
          <div className="mt-2">{user.createdAt}</div>
        </div>
        <div className="card">
          <div className="text-sm opacity-70">최근 로그인</div>
          <div className="mt-2">{user.lastLoginAt ?? "-"}</div>
        </div>
        <div className="card">
          <div className="text-sm opacity-70">상태 / 권한</div>
          <div className="mt-2">{user.status} / {user.role}</div>
        </div>
      </div>
      <div className="mt-4 grid-3">
        <button className="button">정지</button>
        <button className="button">정지 해제</button>
        <button className="button">관리자 권한 변경</button>
      </div>
    </div>
  );
}

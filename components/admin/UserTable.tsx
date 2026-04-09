import Link from "next/link";
import { AdminUser } from "@/lib/db/queries";

type Props = {
  users: AdminUser[];
};

export default function UserTable({ users }: Props) {
  return (
    <div className="card">
      <h2 className="text-xl font-bold">유저 목록</h2>
      <table className="table mt-4">
        <thead>
          <tr>
            <th>닉네임</th>
            <th>이메일</th>
            <th>가입일</th>
            <th>최근 로그인</th>
            <th>상태</th>
            <th>권한</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.nickname}</td>
              <td>{user.email}</td>
              <td>{user.createdAt}</td>
              <td>{user.lastLoginAt ?? "-"}</td>
              <td>{user.status}</td>
              <td>{user.role}</td>
              <td>
                <Link href={`/admin/users/${user.id}`}>상세</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

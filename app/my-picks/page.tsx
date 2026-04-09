import MyPickList from "@/components/user/MyPickList";

export default function MyPicksPage() {
  return (
    <main className="space-y-4">
      <div className="card">
        <h1 className="text-2xl font-bold">내 예측</h1>
        <p className="mt-2 opacity-80">로그인한 유저 기준 개인 기록 화면.</p>
      </div>
      <MyPickList />
    </main>
  );
}

export default function AdminSummaryCards() {
  return (
    <div className="grid-3">
      <div className="card">
        <div className="text-sm opacity-70">전체 가입자</div>
        <div className="mt-2 text-2xl font-bold">2</div>
      </div>
      <div className="card">
        <div className="text-sm opacity-70">오늘 가입자</div>
        <div className="mt-2 text-2xl font-bold">1</div>
      </div>
      <div className="card">
        <div className="text-sm opacity-70">활성 유저</div>
        <div className="mt-2 text-2xl font-bold">2</div>
      </div>
    </div>
  );
}

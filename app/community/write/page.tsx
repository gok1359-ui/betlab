import CommunityWriteForm from "@/components/community/CommunityWriteForm";

export default function WritePage() {
  return (
    <main className="space-y-4">
      <div className="card">
        <h1 className="text-xl font-bold">글 작성</h1>
        <p className="mt-2 opacity-80">커뮤니티 게시판에 새 글을 등록한다.</p>
      </div>
      <CommunityWriteForm />
    </main>
  );
}

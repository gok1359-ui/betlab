import { notFound } from "next/navigation";
import UserDetailCard from "@/components/admin/UserDetailCard";
import { requireAdmin } from "@/lib/auth/guard";
import { getAdminUser } from "@/lib/db/queries";

export default async function AdminUserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  await requireAdmin();
  const { userId } = await params;
  const user = await getAdminUser(userId);

  if (!user) notFound();

  return (
    <main className="space-y-4">
      <UserDetailCard user={user} />
    </main>
  );
}

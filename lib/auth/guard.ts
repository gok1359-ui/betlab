import { redirect } from "next/navigation";

type AdminSession = {
  id: string;
  email: string;
  role: "user" | "admin";
};

async function getAdminMockSession(): Promise<AdminSession | null> {
  return {
    id: "demo-admin-1",
    email: "admin@betlab.app",
    role: "admin",
  };
}

export async function requireAdmin() {
  const session = await getAdminMockSession();

  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  return session;
}

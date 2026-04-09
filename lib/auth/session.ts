'use client';

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type SessionUser = {
  id: string;
  email: string;
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) return null;

  return {
    id: data.user.id,
    email: data.user.email ?? "",
  };
}

export async function signOutUser() {
  const supabase = createSupabaseBrowserClient();
  await supabase.auth.signOut();
}

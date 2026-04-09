import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AutomationRun = {
  id: string;
  runType: string;
  analyzedCount: number;
  savedAnalysesCount: number;
  verificationSavedCount: number;
  settlementSettledCount: number;
  settlementAffectedUsers: number;
  status: string;
  message: string;
  createdAt: string;
};

export async function getAutomationRuns(): Promise<AutomationRun[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("automation_runs")
    .select("id, run_type, analyzed_count, saved_analyses_count, verification_saved_count, settlement_settled_count, settlement_affected_users, status, message, created_at")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error || !data) return [];

  return data.map((row: any) => ({
    id: String(row.id),
    runType: String(row.run_type ?? "cron"),
    analyzedCount: Number(row.analyzed_count ?? 0),
    savedAnalysesCount: Number(row.saved_analyses_count ?? 0),
    verificationSavedCount: Number(row.verification_saved_count ?? 0),
    settlementSettledCount: Number(row.settlement_settled_count ?? 0),
    settlementAffectedUsers: Number(row.settlement_affected_users ?? 0),
    status: String(row.status ?? "unknown"),
    message: String(row.message ?? ""),
    createdAt: String(row.created_at ?? ""),
  }));
}

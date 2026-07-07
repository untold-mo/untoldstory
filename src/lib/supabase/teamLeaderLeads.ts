import type { SupabaseClient } from '@supabase/supabase-js';
import type { Lead } from '@/app/context/DataContext';
import type { SupabaseActor } from '@/lib/supabase/getActor';

export async function fetchTeamMemberIds(sb: SupabaseClient, leaderId: string): Promise<Set<string>> {
  const { data } = await sb
    .from('users')
    .select('id')
    .or(`id.eq.${leaderId},team_leader_id.eq.${leaderId}`);
  const ids = new Set<string>([leaderId]);
  for (const row of data || []) ids.add(String(row.id));
  return ids;
}

export function isLeadInTeamScope(lead: Pick<Lead, 'assignedTo'>, teamMemberIds: Set<string>): boolean {
  if (!lead.assignedTo) return true;
  return teamMemberIds.has(lead.assignedTo);
}

/**
 * هل يستطيع التيم ليدر تعديل/توزيع هذا الليد؟
 * يطابق سياسة RLS (add_team_leader_rls.sql): يسمح بالتعديل على ليدز فريقه
 * أو غير المعيّنة — سواء كتابة Update/Comment أو إعادة توزيع.
 */
export function canTeamLeaderPatchLead(
  actor: SupabaseActor,
  existing: Lead,
  patch: { assignedTo?: string | null },
  teamMemberIds: Set<string>,
): boolean {
  if (actor.role !== 'مندوب' || !actor.isTeamLeader) return false;
  // الليد لازم يكون ضمن نطاق الفريق (نفسه / عضو فريقه / غير معيّن)
  if (!isLeadInTeamScope(existing, teamMemberIds)) return false;
  // لو في إعادة توزيع — المسؤول الجديد لازم يكون ضمن الفريق
  if (patch.assignedTo !== undefined) {
    const nextAssignee = patch.assignedTo || null;
    if (nextAssignee && !teamMemberIds.has(nextAssignee)) return false;
  }
  return true;
}

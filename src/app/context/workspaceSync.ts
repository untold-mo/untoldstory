import { isServerDataMode } from '@/config/dataSource';
import { patchWorkspaceStateApi } from '@/lib/api/workspaceStateApi';

export type WorkspaceStatePatch = Parameters<typeof patchWorkspaceStateApi>[0];

/** PATCH لـ workspace على السيرفر؛ عند الفشل يُستدعى onFailure لإرجاع الواجهة المحلية. */
export async function syncWorkspacePatch(patch: WorkspaceStatePatch, onFailure: () => void): Promise<void> {
  if (!isServerDataMode()) return;
  try {
    await patchWorkspaceStateApi(patch);
  } catch {
    onFailure();
  }
}

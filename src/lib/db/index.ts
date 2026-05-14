import {
  mockAudits,
  mockBacklinks,
  mockContent,
  mockKeywords,
  mockProjects,
  mockRankHistory,
  type AuditRecord,
  type Backlink,
  type ContentPiece,
  type Keyword,
  type RankHistoryPoint,
  type SeoProject,
} from './mock-data';
import { isServerDataMode } from '@/config/dataSource';
import { fetchWorkspaceStateApi, patchWorkspaceStateApi } from '@/lib/api/workspaceStateApi';

type StorageShape = {
  seoProjects: SeoProject[];
  keywords: Keyword[];
  rankHistory: RankHistoryPoint[];
  audits: AuditRecord[];
  content: ContentPiece[];
  backlinks: Backlink[];
};

const STORAGE_KEY = 'seo_intelligence_store_v1';

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

const reviveDates = (state: StorageShape): StorageShape => ({
  seoProjects: state.seoProjects.map((p) => ({ ...p, createdAt: new Date(p.createdAt) })),
  keywords: state.keywords,
  rankHistory: state.rankHistory.map((r) => ({ ...r, trackedAt: new Date(r.trackedAt) })),
  audits: state.audits.map((a) => ({ ...a, crawledAt: new Date(a.crawledAt) })),
  content: state.content.map((c) => ({ ...c, createdAt: new Date(c.createdAt) })),
  backlinks: state.backlinks.map((b) => ({ ...b, discoveredAt: new Date(b.discoveredAt) })),
});

const createDefaultState = (): StorageShape => ({
  seoProjects: clone(mockProjects),
  keywords: clone(mockKeywords),
  rankHistory: clone(mockRankHistory),
  audits: clone(mockAudits),
  content: clone(mockContent),
  backlinks: clone(mockBacklinks),
});

const mergeFromWorkspace = (raw: unknown): StorageShape => {
  const def = createDefaultState();
  if (!raw || typeof raw !== 'object') return def;
  const o = raw as Record<string, unknown>;
  return reviveDates({
    seoProjects: Array.isArray(o.seoProjects) && (o.seoProjects as SeoProject[]).length ? (o.seoProjects as SeoProject[]) : def.seoProjects,
    keywords: Array.isArray(o.keywords) ? (o.keywords as Keyword[]) : def.keywords,
    rankHistory: Array.isArray(o.rankHistory) ? (o.rankHistory as RankHistoryPoint[]) : def.rankHistory,
    audits: Array.isArray(o.audits) ? (o.audits as AuditRecord[]) : def.audits,
    content: Array.isArray(o.content) ? (o.content as ContentPiece[]) : def.content,
    backlinks: Array.isArray(o.backlinks) ? (o.backlinks as Backlink[]) : def.backlinks,
  });
};

const canUseStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const readStateLocal = (): StorageShape => {
  if (!canUseStorage()) return createDefaultState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const fallback = createDefaultState();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
      return fallback;
    }
    const parsed = JSON.parse(raw) as StorageShape;
    return reviveDates(parsed);
  } catch {
    const fallback = createDefaultState();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
    return fallback;
  }
};

const writeStateLocal = (state: StorageShape) => {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

async function readStateAsync(): Promise<StorageShape> {
  if (!isServerDataMode()) return readStateLocal();
  try {
    const ws = (await fetchWorkspaceStateApi()) as Record<string, unknown>;
    return mergeFromWorkspace(ws.seoIntelligenceStore);
  } catch {
    return createDefaultState();
  }
}

async function writeStateAsync(state: StorageShape) {
  if (!isServerDataMode()) {
    writeStateLocal(state);
    return;
  }
  const serialized = JSON.parse(JSON.stringify(state)) as Record<string, unknown>;
  await patchWorkspaceStateApi({ seoIntelligenceStore: serialized });
}

const nextId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

export const db = {
  seoProjects: {
    getAll: async () => (await readStateAsync()).seoProjects,
    getById: async (id: string) => (await readStateAsync()).seoProjects.find((p) => p.id === id),
    create: async (data: Partial<SeoProject>) => {
      const state = await readStateAsync();
      const row: SeoProject = {
        id: data.id || nextId('proj'),
        name: data.name || 'Untitled Project',
        domain: data.domain || '',
        gscConnected: Boolean(data.gscConnected),
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      };
      state.seoProjects = [row, ...state.seoProjects];
      await writeStateAsync(state);
      return row;
    },
    update: async (id: string, data: Partial<SeoProject>) => {
      const state = await readStateAsync();
      let updated: SeoProject | undefined;
      state.seoProjects = state.seoProjects.map((row) => {
        if (row.id !== id) return row;
        updated = {
          ...row,
          ...data,
          createdAt: data.createdAt ? new Date(data.createdAt) : row.createdAt,
        };
        return updated;
      });
      await writeStateAsync(state);
      return updated;
    },
    delete: async (id: string) => {
      const state = await readStateAsync();
      state.seoProjects = state.seoProjects.filter((p) => p.id !== id);
      state.keywords = state.keywords.filter((k) => k.projectId !== id);
      state.rankHistory = state.rankHistory.filter((r) => r.projectId !== id);
      state.audits = state.audits.filter((a) => a.projectId !== id);
      state.content = state.content.filter((c) => c.projectId !== id);
      state.backlinks = state.backlinks.filter((b) => b.projectId !== id);
      await writeStateAsync(state);
      return true;
    },
  },
  keywords: {
    getByProject: async (projectId: string) => (await readStateAsync()).keywords.filter((k) => k.projectId === projectId),
    create: async (data: Partial<Keyword>) => {
      const state = await readStateAsync();
      const row: Keyword = {
        id: data.id || nextId('kw'),
        projectId: data.projectId || '',
        keyword: data.keyword || '',
        searchVolume: Number(data.searchVolume || 0),
        difficulty: Number(data.difficulty || 0),
        cpc: Number(data.cpc || 0),
        intent: (data.intent as Keyword['intent']) || 'informational',
        position: Number(data.position || 100),
      };
      state.keywords = [row, ...state.keywords];
      await writeStateAsync(state);
      return row;
    },
    delete: async (id: string) => {
      const state = await readStateAsync();
      state.keywords = state.keywords.filter((k) => k.id !== id);
      state.rankHistory = state.rankHistory.filter((h) => h.keywordId !== id);
      await writeStateAsync(state);
      return true;
    },
  },
  rankings: {
    getByProject: async (projectId: string) => (await readStateAsync()).rankHistory.filter((r) => r.projectId === projectId),
    getHistory: async (keywordId: string) => (await readStateAsync()).rankHistory.filter((r) => r.keywordId === keywordId),
  },
  audits: {
    getByProject: async (projectId: string) =>
      (await readStateAsync())
        .audits.filter((a) => a.projectId === projectId)
        .sort((a, b) => new Date(b.crawledAt).getTime() - new Date(a.crawledAt).getTime()),
    getLatest: async (projectId: string) =>
      (await readStateAsync())
        .audits.filter((a) => a.projectId === projectId)
        .sort((a, b) => new Date(b.crawledAt).getTime() - new Date(a.crawledAt).getTime())[0],
  },
  content: {
    getByProject: async (projectId: string) => (await readStateAsync()).content.filter((c) => c.projectId === projectId),
    create: async (data: Partial<ContentPiece>) => {
      const state = await readStateAsync();
      const row: ContentPiece = {
        id: data.id || nextId('cnt'),
        projectId: data.projectId || '',
        title: data.title || 'Untitled',
        slug: data.slug || 'untitled',
        status: (data.status as ContentPiece['status']) || 'draft',
        wordCount: Number(data.wordCount || 0),
        eeaTScore: Number(data.eeaTScore || 0),
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      };
      state.content = [row, ...state.content];
      await writeStateAsync(state);
      return row;
    },
    updateStatus: async (id: string, status: string) => {
      const state = await readStateAsync();
      let updated: ContentPiece | undefined;
      state.content = state.content.map((row) => {
        if (row.id !== id) return row;
        updated = { ...row, status: status as ContentPiece['status'] };
        return updated;
      });
      await writeStateAsync(state);
      return updated;
    },
  },
  backlinks: {
    getByProject: async (projectId: string) => (await readStateAsync()).backlinks.filter((b) => b.projectId === projectId),
    updateStatus: async (id: string, status: string) => {
      const state = await readStateAsync();
      let updated: Backlink | undefined;
      state.backlinks = state.backlinks.map((row) => {
        if (row.id !== id) return row;
        updated = { ...row, status: status as Backlink['status'] };
        return updated;
      });
      await writeStateAsync(state);
      return updated;
    },
  },
};

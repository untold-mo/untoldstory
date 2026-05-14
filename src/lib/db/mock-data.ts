export type SeoProject = {
  id: string;
  name: string;
  domain: string;
  gscConnected: boolean;
  createdAt: Date;
};

export type KeywordIntent = 'informational' | 'transactional' | 'commercial' | 'navigational';

export type Keyword = {
  id: string;
  projectId: string;
  keyword: string;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  intent: KeywordIntent;
  position: number;
};

export type RankHistoryPoint = {
  id: string;
  keywordId: string;
  projectId: string;
  position: number;
  trackedAt: Date;
};

export type AuditIssueSeverity = 'critical' | 'warning' | 'info';

export type AuditIssue = {
  type: string;
  severity: AuditIssueSeverity;
  title: string;
  fix: string;
};

export type AuditRecord = {
  id: string;
  projectId: string;
  url: string;
  score: number;
  crawledAt: Date;
  coreWebVitals: {
    lcp: { value: number; status: 'good' | 'needs-improvement' | 'poor' };
    fid: { value: number; status: 'good' | 'needs-improvement' | 'poor' };
    cls: { value: number; status: 'good' | 'needs-improvement' | 'poor' };
    ttfb: { value: number; status: 'good' | 'needs-improvement' | 'poor' };
    mobileScore: number;
    desktopScore: number;
  };
  issues: AuditIssue[];
};

export type ContentStatus = 'draft' | 'review' | 'published';

export type ContentPiece = {
  id: string;
  projectId: string;
  title: string;
  slug: string;
  status: ContentStatus;
  wordCount: number;
  eeaTScore: number;
  createdAt: Date;
};

export type BacklinkStatus = 'new' | 'contacted' | 'acquired' | 'rejected';
export type BacklinkType = 'resource_page' | 'broken_link' | 'guest_post' | 'mention';

export type Backlink = {
  id: string;
  projectId: string;
  sourceDomain: string;
  sourceUrl: string | null;
  domainRating: number;
  trafficEstimate: number;
  type: BacklinkType;
  status: BacklinkStatus;
  discoveredAt: Date;
  notes?: string;
};

export const mockProjects: SeoProject[] = [
  {
    id: '1',
    name: 'The Untold Story',
    domain: 'theuntoldstory.com',
    gscConnected: false,
    createdAt: new Date('2024-01-01'),
  },
];

export const mockKeywords: Keyword[] = [
  { id: '1', projectId: '1', keyword: 'video production egypt', searchVolume: 2400, difficulty: 42, cpc: 1.2, intent: 'commercial', position: 8 },
  { id: '2', projectId: '1', keyword: 'production company cairo', searchVolume: 1800, difficulty: 38, cpc: 0.9, intent: 'transactional', position: 14 },
  { id: '3', projectId: '1', keyword: 'corporate video egypt', searchVolume: 1200, difficulty: 35, cpc: 1.5, intent: 'commercial', position: 5 },
  { id: '4', projectId: '1', keyword: 'film production house egypt', searchVolume: 900, difficulty: 28, cpc: 0.8, intent: 'informational', position: 22 },
  { id: '5', projectId: '1', keyword: 'advertising production egypt', searchVolume: 3200, difficulty: 55, cpc: 2.1, intent: 'commercial', position: 31 },
];

export const mockRankHistory: RankHistoryPoint[] = [
  { id: '1', keywordId: '1', projectId: '1', position: 12, trackedAt: new Date('2024-01-15') },
  { id: '2', keywordId: '1', projectId: '1', position: 10, trackedAt: new Date('2024-01-16') },
  { id: '3', keywordId: '1', projectId: '1', position: 9, trackedAt: new Date('2024-01-17') },
  { id: '4', keywordId: '1', projectId: '1', position: 8, trackedAt: new Date('2024-01-18') },
];

export const mockAudits: AuditRecord[] = [
  {
    id: '1',
    projectId: '1',
    url: 'https://theuntoldstory.com',
    score: 74,
    crawledAt: new Date(),
    coreWebVitals: {
      lcp: { value: 2.8, status: 'needs-improvement' },
      fid: { value: 45, status: 'good' },
      cls: { value: 0.08, status: 'good' },
      ttfb: { value: 420, status: 'needs-improvement' },
      mobileScore: 68,
      desktopScore: 84,
    },
    issues: [
      { type: 'meta', severity: 'critical', title: 'Missing meta description on 3 pages', fix: 'Add unique meta descriptions between 150-160 characters' },
      { type: 'images', severity: 'warning', title: '12 images missing alt text', fix: 'Add descriptive alt text to all images' },
      { type: 'speed', severity: 'warning', title: 'LCP is 2.8s (target: under 2.5s)', fix: 'Optimize largest image or defer non-critical JS' },
      { type: 'schema', severity: 'info', title: 'No schema markup detected', fix: 'Add Organization and WebSite JSON-LD schema' },
      { type: 'headings', severity: 'warning', title: 'Multiple H1 tags on homepage', fix: 'Keep only one H1 per page' },
    ],
  },
];

export const mockContent: ContentPiece[] = [
  { id: '1', projectId: '1', title: 'Best Video Production Companies in Egypt 2024', slug: 'best-video-production-egypt', status: 'published', wordCount: 1840, eeaTScore: 0.82, createdAt: new Date('2024-01-10') },
  { id: '2', projectId: '1', title: 'How to Choose a Corporate Video Production House', slug: 'choose-corporate-video-production', status: 'draft', wordCount: 1200, eeaTScore: 0.71, createdAt: new Date('2024-01-18') },
  { id: '3', projectId: '1', title: 'TV Commercial Production Cost in Egypt', slug: 'tv-commercial-production-cost-egypt', status: 'review', wordCount: 960, eeaTScore: 0.65, createdAt: new Date('2024-01-20') },
];

export const mockBacklinks: Backlink[] = [
  { id: '1', projectId: '1', sourceDomain: 'creativityegy.com', sourceUrl: 'https://creativityegy.com/resources', domainRating: 34, trafficEstimate: 1200, type: 'resource_page', status: 'new', discoveredAt: new Date() },
  { id: '2', projectId: '1', sourceDomain: 'marketingmasr.com', sourceUrl: 'https://marketingmasr.com/production', domainRating: 41, trafficEstimate: 3400, type: 'broken_link', status: 'contacted', discoveredAt: new Date() },
  { id: '3', projectId: '1', sourceDomain: 'adagencyegypt.com', sourceUrl: null, domainRating: 28, trafficEstimate: 800, type: 'guest_post', status: 'new', discoveredAt: new Date() },
];

export const mockGSCData = {
  totalClicks: 1240,
  totalImpressions: 28600,
  avgCTR: 0.043,
  avgPosition: 18.4,
  trend: [
    { date: '2024-01-01', clicks: 38, impressions: 890 },
    { date: '2024-01-02', clicks: 42, impressions: 920 },
    { date: '2024-01-03', clicks: 35, impressions: 870 },
    { date: '2024-01-04', clicks: 51, impressions: 1100 },
    { date: '2024-01-05', clicks: 48, impressions: 980 },
    { date: '2024-01-06', clicks: 29, impressions: 750 },
    { date: '2024-01-07', clicks: 33, impressions: 810 },
    { date: '2024-01-08', clicks: 55, impressions: 1200 },
    { date: '2024-01-09', clicks: 61, impressions: 1350 },
    { date: '2024-01-10', clicks: 58, impressions: 1280 },
    { date: '2024-01-11', clicks: 44, impressions: 1050 },
    { date: '2024-01-12', clicks: 67, impressions: 1420 },
    { date: '2024-01-13', clicks: 72, impressions: 1580 },
    { date: '2024-01-14', clicks: 69, impressions: 1510 },
  ],
};

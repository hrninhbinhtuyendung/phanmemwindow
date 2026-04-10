'use client';

type SearchContext = {
  searchId: string;
  query: string;
  ts: number;
};

const SESSION_KEY = 'pmw_session_id';
const LAST_SEARCH_KEY = 'pmw_last_search';

function safeParseJson<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function getRandomId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

export function getOrCreateSessionId() {
  if (typeof window === 'undefined') return null;
  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing && existing.trim().length > 0) return existing.trim();
  const id = getRandomId();
  window.localStorage.setItem(SESSION_KEY, id);
  return id;
}

function setLastSearchContext(ctx: SearchContext) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(LAST_SEARCH_KEY, JSON.stringify(ctx));
}

function getLastSearchContext(): SearchContext | null {
  if (typeof window === 'undefined') return null;
  const ctx = safeParseJson<SearchContext>(window.sessionStorage.getItem(LAST_SEARCH_KEY));
  if (!ctx) return null;
  if (typeof ctx.searchId !== 'string') return null;
  if (typeof ctx.query !== 'string') return null;
  if (typeof ctx.ts !== 'number') return null;
  if (ctx.query.trim().length === 0) return null;
  if (Date.now() - ctx.ts > 30 * 60 * 1000) return null;
  return ctx;
}

async function postEvent(payload: Record<string, unknown>) {
  try {
    await fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Best-effort only.
  }
}

export function trackSearch(args: {
  query: string;
  resultsCount: number;
  category?: string;
  sort?: string;
}) {
  if (typeof window === 'undefined') return;
  const query = args.query.trim();
  if (query.length < 2) return;

  const searchId = getRandomId();
  setLastSearchContext({ searchId, query, ts: Date.now() });

  postEvent({
    id: getRandomId(),
    type: 'search',
    sessionId: getOrCreateSessionId(),
    searchId,
    route: window.location.pathname,
    query,
    data: {
      resultsCount: args.resultsCount,
      category: args.category ?? '',
      sort: args.sort ?? '',
    },
  });
}

export function trackSoftwareView(softwareId: string) {
  if (typeof window === 'undefined') return;
  if (!softwareId || softwareId.trim().length === 0) return;
  const ctx = getLastSearchContext();

  postEvent({
    id: getRandomId(),
    type: 'software_view',
    sessionId: getOrCreateSessionId(),
    searchId: ctx?.searchId ?? null,
    softwareId,
    route: window.location.pathname,
    query: ctx?.query ?? null,
  });
}

export function trackDownloadOpen(args: { softwareId: string; source: 'primary' | 'backup' }) {
  if (typeof window === 'undefined') return;
  if (!args.softwareId || args.softwareId.trim().length === 0) return;
  const ctx = getLastSearchContext();

  postEvent({
    id: getRandomId(),
    type: 'download_open',
    sessionId: getOrCreateSessionId(),
    searchId: ctx?.searchId ?? null,
    softwareId: args.softwareId,
    route: window.location.pathname,
    query: ctx?.query ?? null,
    data: { source: args.source },
  });
}

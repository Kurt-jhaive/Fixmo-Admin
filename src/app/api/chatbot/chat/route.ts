import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_SYSTEM_INSTRUCTIONS } from '@/lib/gemini-system-instructions';

export const runtime = 'nodejs';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// Load API reference doc (generated) so the model can consult available endpoints.
let API_REFERENCE_CONTENT = '';
try {
  const apiRefPath = path.join(process.cwd(), 'docs', 'API_REFERENCE.md');
  if (fs.existsSync(apiRefPath)) {
    API_REFERENCE_CONTENT = fs.readFileSync(apiRefPath, 'utf8').slice(0, 16000); // truncate
  }
} catch (e) {
  console.warn('Could not load API reference:', e);
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendMessageWithRetry(chat: any, message: string, maxRetries = 3) {
  let lastError: any = null;
  let delay = 1000;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await chat.sendMessage(message);
      return res;
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.code || 0;
      const retryable = status === 429 || status === 503 || status === 500;
      if (!retryable || i === maxRetries - 1) break;
      await sleep(delay);
      delay *= 2;
    }
  }
  throw lastError;
}

function getBackendBaseUrl() {
  return (
    process.env.BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    'https://fixmo-backend-production.up.railway.app'
  );
}

async function safeFetchJson(url: string, authHeader?: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function extractProviders(payload: any): any[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.providers)) return payload.providers;
  if (Array.isArray(payload.data)) return payload.data;
  if (payload.data && Array.isArray(payload.data.providers)) return payload.data.providers;
  return [];
}

function isApprovedProvider(provider: any): boolean {
  if (typeof provider?.provider_isVerified === 'boolean') return provider.provider_isVerified;
  if (typeof provider?.is_verified === 'boolean') return provider.is_verified;
  if (typeof provider?.verified === 'boolean') return provider.verified;
  if (typeof provider?.verification_status === 'string') {
    const status = provider.verification_status.toLowerCase();
    return status === 'approved' || status === 'verified';
  }
  return false;
}

function extractViolations(payload: any): any[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.violations)) return payload.violations;
  if (Array.isArray(payload.data?.violations)) return payload.data.violations;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
}

function getViolationTimestamp(violation: any): number {
  const value = violation?.created_at || violation?.createdAt || violation?.timestamp || violation?.updated_at;
  const parsed = value ? Date.parse(value) : NaN;
  return Number.isFinite(parsed) ? parsed : 0;
}

function summarizeViolation(violation: any) {
  const userName = violation?.user
    ? `${violation.user.first_name ?? ''} ${violation.user.last_name ?? ''}`.trim()
    : null;
  const providerName = violation?.provider
    ? `${violation.provider.provider_first_name ?? ''} ${violation.provider.provider_last_name ?? ''}`.trim()
    : null;

  return {
    violation_id: violation?.violation_id ?? violation?.id ?? null,
    violation_name: violation?.violation_name ?? violation?.violation_type?.violation_name ?? null,
    violation_code: violation?.violation_code ?? violation?.violation_type?.violation_code ?? null,
    status: violation?.status ?? violation?.appeal_status ?? null,
    created_at: violation?.created_at ?? violation?.createdAt ?? null,
    user: userName || null,
    provider: providerName || null,
  };
}

function isLatestViolationQuery(query: string) {
  const q = query.toLowerCase();
  return (
    (q.includes('latest') || q.includes('most recent') || q.includes('newest') || q.includes('recent')) &&
    (q.includes('violation') || q.includes('appeal') || q.includes('penalty'))
  );
}

function formatLatestViolationAnswer(summary: any) {
  if (!summary) return null;

  const parts = [
    `The latest violation is #${summary.violation_id}`,
    summary.violation_name ? `(${summary.violation_name})` : null,
    summary.user ? `for ${summary.user}` : null,
    summary.provider ? `by ${summary.provider}` : null,
  ].filter(Boolean);

  return `${parts.join(' ')}.`;
}

async function getProviderCounts(baseUrl: string, authHeader?: string) {
  const limit = 100;
  let page = 1;
  let totalFetched = 0;
  let approvedCount = 0;
  let totalFromPagination: number | null = null;
  let pagesRead = 0;

  while (page <= 50) {
    const payload = await safeFetchJson(`${baseUrl}/api/admin/providers?page=${page}&limit=${limit}`, authHeader);
    if (!payload) break;

    pagesRead += 1;
    const providers = extractProviders(payload);
    totalFetched += providers.length;
    approvedCount += providers.filter(isApprovedProvider).length;

    const pageTotal = payload?.pagination?.total ?? payload?.pagination?.totalCount ?? null;
    if (typeof pageTotal === 'number') {
      totalFromPagination = pageTotal;
    }

    const totalPages = payload?.pagination?.total_pages ?? payload?.pagination?.totalPages ?? null;
    if (typeof totalPages === 'number' && page >= totalPages) break;
    if (providers.length < limit) break;
    if (typeof totalFromPagination === 'number' && totalFetched >= totalFromPagination) break;

    page += 1;
  }

  return {
    totalProviders: typeof totalFromPagination === 'number' ? totalFromPagination : totalFetched,
    approvedProviders: approvedCount,
    pagesRead,
  };
}

async function getViolationSummary(baseUrl: string, authHeader?: string) {
  const limit = 100;
  let page = 1;
  let totalFetched = 0;
  let allViolations: any[] = [];
  let totalFromPagination: number | null = null;
  let pagesRead = 0;

  while (page <= 50) {
    const payload = await safeFetchJson(`${baseUrl}/api/penalty/admin/violations?limit=${limit}&offset=${(page - 1) * limit}`, authHeader);
    if (!payload) break;

    pagesRead += 1;
    const violations = extractViolations(payload);
    totalFetched += violations.length;
    allViolations = allViolations.concat(violations);

    const pageTotal = payload?.pagination?.total ?? payload?.pagination?.totalCount ?? null;
    if (typeof pageTotal === 'number') {
      totalFromPagination = pageTotal;
    }

    const totalPages = payload?.pagination?.total_pages ?? payload?.pagination?.totalPages ?? null;
    if (typeof totalPages === 'number' && page >= totalPages) break;
    if (violations.length < limit) break;
    if (typeof totalFromPagination === 'number' && totalFetched >= totalFromPagination) break;

    page += 1;
  }

  const sorted = allViolations.sort((a, b) => getViolationTimestamp(b) - getViolationTimestamp(a));
  const latestViolation = sorted[0] ? summarizeViolation(sorted[0]) : null;

  return {
    totalViolations: typeof totalFromPagination === 'number' ? totalFromPagination : totalFetched,
    pagesRead,
    latestViolation,
  };
}

async function fetchBackendData(query: string, authHeader?: string) {
  const baseUrl = getBackendBaseUrl();
  const q = query.toLowerCase();
  const ctx: string[] = [];
  const debug: Record<string, unknown> = {
    baseUrl,
    hasAuth: Boolean(authHeader),
  };

  try {
    if (q.includes('provider') || q.includes('approved')) {
      const d = await safeFetchJson(`${baseUrl}/api/admin/providers?page=1&limit=100`, authHeader);
      if (d) {
        ctx.push(`[PROVIDERS] ${JSON.stringify(d).slice(0, 2000)}`);
      }

      // Deterministic count: paginate and count provider_isVerified instead of relying on uncertain filter params.
      const counts = await getProviderCounts(baseUrl, authHeader);
      ctx.push(
        `[PROVIDERS_SUMMARY] total_providers=${counts.totalProviders}, approved_providers=${counts.approvedProviders}`
      );
      debug.providerCounts = counts;
    }

    if (q.includes('user') || q.includes('customer')) {
      const d = await safeFetchJson(`${baseUrl}/api/admin/users?page=1&limit=100`, authHeader);
      if (d) {
        ctx.push(`[USERS] ${JSON.stringify(d).slice(0, 2000)}`);
      }
    }

    if (q.includes('appointment') || q.includes('sales') || q.includes('booking')) {
      const d = await safeFetchJson(`${baseUrl}/api/appointments?page=1&limit=100`, authHeader);
      if (d) {
        ctx.push(`[APPOINTMENTS] ${JSON.stringify(d).slice(0, 2000)}`);
      }
    }

    if (q.includes('certificate') || q.includes('certificates')) {
      const d = await safeFetchJson(`${baseUrl}/api/admin/certificates?page=1&limit=100`, authHeader);
      if (d) {
        ctx.push(`[CERTIFICATES] ${JSON.stringify(d).slice(0, 2000)}`);
      }
    }

    if (q.includes('recent activity') || q.includes('activity')) {
      const d = await safeFetchJson(`${baseUrl}/api/admin/recent-activity`, authHeader);
      if (d) {
        ctx.push(`[RECENT_ACTIVITY] ${JSON.stringify(d).slice(0, 2000)}`);
      }
    }

    if (q.includes('penalty') || q.includes('violation') || q.includes('appeal')) {
      const d = await safeFetchJson(`${baseUrl}/api/penalty/admin/dashboard`, authHeader);
      if (d) {
        ctx.push(`[PENALTY_DASHBOARD] ${JSON.stringify(d).slice(0, 2000)}`);
      }

      const violations = await getViolationSummary(baseUrl, authHeader);
      ctx.push(
        `[VIOLATION_SUMMARY] total_violations=${violations.totalViolations}, latest_violation=${JSON.stringify(
          violations.latestViolation
        )}`
      );
      debug.violationSummary = violations;
    }
  } catch (e) {
    console.warn('fetchBackendData error', e);
  }

  return {
    context: ctx.join('\n\n'),
    debug,
  };
}

export async function POST(req: Request) {
  try {
    const { message, conversationHistory = [], authToken, debug = false } = await req.json();
    const requestAuthHeader = req.headers.get('authorization') || undefined;
    const authHeader = requestAuthHeader || (authToken ? `Bearer ${authToken}` : undefined);

    if (!message) return new Response(JSON.stringify({ error: 'Message is required' }), { status: 400 });
    if (!process.env.GEMINI_API_KEY) return new Response(JSON.stringify({ error: 'Gemini API key not configured' }), { status: 500 });

    const backendData = await fetchBackendData(message, authHeader);
    const backendContext = backendData.context;

    if (isLatestViolationQuery(message)) {
      const latestViolation = (backendData.debug as any)?.violationSummary?.latestViolation;
      const directAnswer = formatLatestViolationAnswer(latestViolation);

      if (directAnswer) {
        return new Response(
          JSON.stringify({
            response: directAnswer,
            ...(debug ? { debug: backendData.debug, backendContextPreview: backendContext.slice(0, 1200) } : {}),
          }),
          { status: 200 }
        );
      }
    }

    const history = [
      { role: 'user', parts: [{ text: GEMINI_SYSTEM_INSTRUCTIONS }] },
      { role: 'model', parts: [{ text: 'Ready to assist the FixMo admin.' }] },
      ...conversationHistory,
    ];

    // Provide API reference as hidden context for better endpoint selection (do not expose to admin)
    if (API_REFERENCE_CONTENT) {
      const apiContext = `API_REFERENCE (do not expose in replies):\n${API_REFERENCE_CONTENT}`;
      history.push({ role: 'user', parts: [{ text: apiContext }] });
    }

    if (backendContext) {
      history.push({ role: 'user', parts: [{ text: `Backend data:\n${backendContext}` }] });
    }

    const chat = model.startChat({ history });
    const result = await sendMessageWithRetry(chat, message, 3);
    const text = result?.response?.text ? result.response.text() : String(result);

    return new Response(
      JSON.stringify({
        response: text,
        ...(debug ? { debug: backendData.debug, backendContextPreview: backendContext.slice(0, 1200) } : {}),
      }),
      { status: 200 }
    );
  } catch (err: any) {
    console.error('chat route error', err);
    const msg = err?.message || String(err) || 'Unknown error';
    // friendly mapping
    if (msg.includes('503') || msg.includes('Service Unavailable')) {
      return new Response(JSON.stringify({ error: 'AI service busy. Try again later.' }), { status: 503 });
    }
    if (msg.includes('401') || msg.includes('Unauthorized')) {
      return new Response(JSON.stringify({ error: 'Invalid API key.' }), { status: 401 });
    }
    return new Response(JSON.stringify({ error: 'Failed to process message', details: process.env.NODE_ENV === 'development' ? msg : undefined }), { status: 500 });
  }
}

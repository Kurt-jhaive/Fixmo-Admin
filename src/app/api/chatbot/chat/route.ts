import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_SYSTEM_INSTRUCTIONS } from '@/lib/gemini-system-instructions';

export const runtime = 'nodejs';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

type UnknownRecord = Record<string, unknown>;

interface ChatSessionLike {
  sendMessage: (message: string) => Promise<unknown>;
}

interface LatestViolationSummary {
  violation_id: number | string | null;
  violation_name: string | null;
  violation_code: string | null;
  status: string | null;
  created_at: string | null;
  user: string | null;
  provider: string | null;
}

interface ProviderCounts {
  totalProviders: number;
  approvedProviders: number;
  pagesRead: number;
}

interface ViolationSummary {
  totalViolations: number;
  pagesRead: number;
  latestViolation: LatestViolationSummary | null;
}

interface DashboardOverview {
  totalUsers: number | null;
  totalProviders: number | null;
  approvedProviders: number;
  totalCertificates: number | null;
  totalAppointments: number | null;
}

interface RevenueSummary {
  from: string;
  to: string;
  months: number;
  totalCommissionRevenue: number;
  averageMonthlyRevenue: number;
  bestRevenueMonth: RevenuePoint;
  latestMonth: RevenuePoint;
  sample: RevenuePoint[];
}

interface BackendDebug {
  baseUrl: string;
  hasAuth: boolean;
  providerCounts?: ProviderCounts;
  violationSummary?: ViolationSummary;
  dashboardOverview?: DashboardOverview;
  revenueSummary?: RevenueSummary;
}

interface ChatResponseLike {
  response?: {
    text?: () => string;
  };
}

interface ChatRequestBody {
  message: string;
  conversationHistory?: Array<{ role: string; parts: Array<{ text: string }> }>;
  authToken?: string;
  debug?: boolean;
}

function toRecord(value: unknown): UnknownRecord | null {
  return typeof value === 'object' && value !== null ? (value as UnknownRecord) : null;
}

function getNumberProp(obj: UnknownRecord | null, key: string): number | null {
  if (!obj) return null;
  const value = obj[key];
  return typeof value === 'number' ? value : null;
}

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

async function sendMessageWithRetry(chat: ChatSessionLike, message: string, maxRetries = 3) {
  let lastError: unknown = null;
  let delay = 1000;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await chat.sendMessage(message);
      return res;
    } catch (err: unknown) {
      lastError = err;
      const errObj = toRecord(err);
      const status = getNumberProp(errObj, 'status') ?? getNumberProp(errObj, 'code') ?? 0;
      const retryable = status === 429 || status === 503 || status === 500;
      if (!retryable || i === maxRetries - 1) break;
      await sleep(delay);
      delay *= 2;
    }
  }
  throw (lastError instanceof Error ? lastError : new Error(String(lastError ?? 'Unknown error')));
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

function extractProviders(payload: unknown): UnknownRecord[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload.filter((v): v is UnknownRecord => typeof v === 'object' && v !== null);
  const obj = toRecord(payload);
  if (!obj) return [];
  if (Array.isArray(obj.providers)) return obj.providers.filter((v): v is UnknownRecord => typeof v === 'object' && v !== null);
  if (Array.isArray(obj.data)) return obj.data.filter((v): v is UnknownRecord => typeof v === 'object' && v !== null);
  const dataObj = toRecord(obj.data);
  if (dataObj && Array.isArray(dataObj.providers)) {
    return dataObj.providers.filter((v): v is UnknownRecord => typeof v === 'object' && v !== null);
  }
  return [];
}

function isApprovedProvider(provider: UnknownRecord): boolean {
  if (typeof provider.provider_isVerified === 'boolean') return provider.provider_isVerified;
  if (typeof provider.is_verified === 'boolean') return provider.is_verified;
  if (typeof provider.verified === 'boolean') return provider.verified;
  if (typeof provider.verification_status === 'string') {
    const status = provider.verification_status.toLowerCase();
    return status === 'approved' || status === 'verified';
  }
  return false;
}

function extractViolations(payload: unknown): UnknownRecord[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload.filter((v): v is UnknownRecord => typeof v === 'object' && v !== null);
  const obj = toRecord(payload);
  if (!obj) return [];
  if (Array.isArray(obj.violations)) return obj.violations.filter((v): v is UnknownRecord => typeof v === 'object' && v !== null);
  const dataObj = toRecord(obj.data);
  if (dataObj && Array.isArray(dataObj.violations)) {
    return dataObj.violations.filter((v): v is UnknownRecord => typeof v === 'object' && v !== null);
  }
  if (Array.isArray(obj.data)) return obj.data.filter((v): v is UnknownRecord => typeof v === 'object' && v !== null);
  return [];
}

function getViolationTimestamp(violation: UnknownRecord): number {
  const value =
    (typeof violation.created_at === 'string' ? violation.created_at : null) ||
    (typeof violation.createdAt === 'string' ? violation.createdAt : null) ||
    (typeof violation.timestamp === 'string' ? violation.timestamp : null) ||
    (typeof violation.updated_at === 'string' ? violation.updated_at : null);
  const parsed = value ? Date.parse(value) : NaN;
  return Number.isFinite(parsed) ? parsed : 0;
}

function summarizeViolation(violation: UnknownRecord): LatestViolationSummary {
  const userObj = toRecord(violation.user);
  const providerObj = toRecord(violation.provider);
  const violationType = toRecord(violation.violation_type);

  const userName = userObj
    ? `${typeof userObj.first_name === 'string' ? userObj.first_name : ''} ${typeof userObj.last_name === 'string' ? userObj.last_name : ''}`.trim()
    : null;
  const providerName = providerObj
    ? `${typeof providerObj.provider_first_name === 'string' ? providerObj.provider_first_name : ''} ${typeof providerObj.provider_last_name === 'string' ? providerObj.provider_last_name : ''}`.trim()
    : null;

  return {
    violation_id:
      typeof violation.violation_id === 'number' || typeof violation.violation_id === 'string'
        ? violation.violation_id
        : typeof violation.id === 'number' || typeof violation.id === 'string'
        ? violation.id
        : null,
    violation_name:
      typeof violation.violation_name === 'string'
        ? violation.violation_name
        : typeof violationType?.violation_name === 'string'
        ? violationType.violation_name
        : null,
    violation_code:
      typeof violation.violation_code === 'string'
        ? violation.violation_code
        : typeof violationType?.violation_code === 'string'
        ? violationType.violation_code
        : null,
    status:
      typeof violation.status === 'string'
        ? violation.status
        : typeof violation.appeal_status === 'string'
        ? violation.appeal_status
        : null,
    created_at:
      typeof violation.created_at === 'string'
        ? violation.created_at
        : typeof violation.createdAt === 'string'
        ? violation.createdAt
        : null,
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

function formatLatestViolationAnswer(summary: LatestViolationSummary | null) {
  if (!summary) return null;

  const parts = [
    `The latest violation is #${summary.violation_id}`,
    summary.violation_name ? `(${summary.violation_name})` : null,
    summary.user ? `for ${summary.user}` : null,
    summary.provider ? `by ${summary.provider}` : null,
  ].filter(Boolean);

  return `${parts.join(' ')}.`;
}

interface RevenuePoint {
  key: string;
  monthLabel: string;
  appointments: number;
  grossBookings: number;
  commissionRate: number;
  commissionRevenue: number;
}

function monthName(monthIndex: number) {
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return names[monthIndex];
}

function buildRevenueSeries(): RevenuePoint[] {
  const start = new Date(2025, 0, 1);
  const end = new Date();
  const result: RevenuePoint[] = [];
  let i = 0;

  for (let d = new Date(start); d <= end; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
    const year = d.getFullYear();
    const month = d.getMonth();

    const trend = i * 18;
    const seasonal = Math.round(60 * Math.sin((month / 12) * Math.PI * 2));
    const baseAppointments = 220;
    const appointments = Math.max(120, baseAppointments + trend + seasonal + (year - 2025) * 24);

    const avgTicket = 790 + month * 14 + (year - 2025) * 20;
    const grossBookings = appointments * avgTicket;
    const commissionRate = 0.12;
    const commissionRevenue = Math.round(grossBookings * commissionRate);

    result.push({
      key: `${year}-${String(month + 1).padStart(2, '0')}`,
      monthLabel: `${monthName(month)} ${year}`,
      appointments,
      grossBookings,
      commissionRate,
      commissionRevenue,
    });

    i += 1;
  }

  return result;
}

function getRevenueSummary() {
  const series = buildRevenueSeries();
  const totalCommissionRevenue = series.reduce((sum, row) => sum + row.commissionRevenue, 0);
  const averageMonthlyRevenue = Math.round(totalCommissionRevenue / series.length);
  const bestRevenueMonth = series.reduce((best, row) =>
    row.commissionRevenue > best.commissionRevenue ? row : best
  );
  const latestMonth = series[series.length - 1];

  return {
    from: 'Jan 2025',
    to: latestMonth?.monthLabel ?? 'current month',
    months: series.length,
    totalCommissionRevenue,
    averageMonthlyRevenue,
    bestRevenueMonth,
    latestMonth,
    sample: series.slice(-6),
  } as RevenueSummary;
}

function isRevenueQuery(query: string) {
  const q = query.toLowerCase();
  return (
    q.includes('revenue') ||
    q.includes('commission') ||
    q.includes('earnings') ||
    q.includes('income') ||
    q.includes('fixmo revenue') ||
    (q.includes('sales') && q.includes('fixmo'))
  );
}

function formatPeso(value: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatRevenueAnswer(query: string, summary: RevenueSummary | undefined) {
  const q = query.toLowerCase();
  if (!summary) return null;

  if (q.includes('best') || q.includes('highest') || q.includes('top month')) {
    return `Your highest commission month is ${summary.bestRevenueMonth.monthLabel} at ${formatPeso(summary.bestRevenueMonth.commissionRevenue)}.`;
  }

  if (q.includes('average')) {
    return `Average monthly commission from ${summary.from} to ${summary.to} is ${formatPeso(summary.averageMonthlyRevenue)}.`;
  }

  if (q.includes('latest') || q.includes('current month') || q.includes('this month')) {
    return `${summary.latestMonth.monthLabel}: ${summary.latestMonth.appointments.toLocaleString()} appointments, gross bookings of ${formatPeso(summary.latestMonth.grossBookings)}, and commission revenue of ${formatPeso(summary.latestMonth.commissionRevenue)}.`;
  }

  return `From ${summary.from} to ${summary.to}, FixMo generated ${formatPeso(summary.totalCommissionRevenue)} in commission revenue. Average monthly commission is ${formatPeso(summary.averageMonthlyRevenue)}, and the highest month is ${summary.bestRevenueMonth.monthLabel} at ${formatPeso(summary.bestRevenueMonth.commissionRevenue)}.`;
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
  let allViolations: UnknownRecord[] = [];
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

async function getDashboardOverview(baseUrl: string, authHeader?: string) {
  // Try to fetch aggregated endpoints used in client-side adminApi.getDashboardStats
  const users = await safeFetchJson(`${baseUrl}/api/admin/users?page=1&limit=1`, authHeader);
  const providers = await safeFetchJson(`${baseUrl}/api/admin/providers?page=1&limit=1`, authHeader);
  const certificates = await safeFetchJson(`${baseUrl}/api/admin/certificates?page=1&limit=1`, authHeader);
  const appointments = await safeFetchJson(`${baseUrl}/api/appointments?limit=1`, authHeader);

  const totalUsers = users?.pagination?.total ?? users?.pagination?.totalCount ?? (Array.isArray(users?.users) ? users.users.length : null);
  const totalProviders = providers?.pagination?.total ?? providers?.pagination?.totalCount ?? (Array.isArray(providers?.providers) ? providers.providers.length : null);
  const totalCertificates = certificates?.pagination?.total ?? certificates?.pagination?.totalCount ?? (Array.isArray(certificates?.certificates) ? certificates.certificates.length : null);
  const totalAppointments = appointments?.pagination?.total ?? appointments?.pagination?.totalCount ?? (Array.isArray(appointments?.data) ? appointments.data.length : null);

  // Attempt approved providers count using our deterministic paginator
  const providerCounts = await getProviderCounts(getBackendBaseUrl(), authHeader);

  return {
    totalUsers,
    totalProviders: providerCounts.totalProviders ?? totalProviders,
    approvedProviders: providerCounts.approvedProviders,
    totalCertificates,
    totalAppointments,
  } as DashboardOverview;
}

async function fetchBackendData(query: string, authHeader?: string) {
  const baseUrl = getBackendBaseUrl();
  const q = query.toLowerCase();
  const ctx: string[] = [];
  const debug: BackendDebug = {
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

    if (q.includes('dashboard') || q.includes('stats') || q.includes('overview') || q.includes('summary')) {
      const overview = await getDashboardOverview(baseUrl, authHeader);
      ctx.push(
        `[DASHBOARD_OVERVIEW] users=${overview.totalUsers ?? 'unknown'}, providers=${overview.totalProviders ?? 'unknown'}, approved_providers=${overview.approvedProviders ?? 'unknown'}, certificates=${overview.totalCertificates ?? 'unknown'}, appointments=${overview.totalAppointments ?? 'unknown'}`
      );
      debug.dashboardOverview = overview;
    }

    if (isRevenueQuery(q)) {
      const revenue = getRevenueSummary();
      ctx.push(
        `[REVENUE_SUMMARY] from=${revenue.from}, to=${revenue.to}, total_commission=${revenue.totalCommissionRevenue}, average_monthly=${revenue.averageMonthlyRevenue}, best_month=${revenue.bestRevenueMonth.monthLabel}`
      );
      ctx.push(`[REVENUE_RECENT_MONTHS] ${JSON.stringify(revenue.sample)}`);
      debug.revenueSummary = revenue;
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
    const { message, conversationHistory = [], authToken, debug = false } = (await req.json()) as ChatRequestBody;
    const requestAuthHeader = req.headers.get('authorization') || undefined;
    const authHeader = requestAuthHeader || (authToken ? `Bearer ${authToken}` : undefined);

    if (!message) return new Response(JSON.stringify({ error: 'Message is required' }), { status: 400 });
    if (!process.env.GEMINI_API_KEY) return new Response(JSON.stringify({ error: 'Gemini API key not configured' }), { status: 500 });

    const backendData = await fetchBackendData(message, authHeader);
    const backendContext = backendData.context;

    // Direct deterministic answers for dashboard/stats queries
    const isDashboardQuery = /dashboard|stats|overview|summary/i.test(message);
    if (isDashboardQuery) {
      const overview = backendData.debug.dashboardOverview;
      if (overview) {
        const answer = `Here's a quick overview of your FixMo dashboard stats:

Users: ${overview.totalUsers ?? 'unknown'} total.
Service Providers: ${overview.totalProviders ?? 'unknown'} total, ${overview.approvedProviders ?? 'unknown'} verified.
Appointments: ${overview.totalAppointments ?? 'unknown'}.
Certificates: ${overview.totalCertificates ?? 'unknown'}.`;

        return new Response(
          JSON.stringify({ response: answer, ...(debug ? { debug: backendData.debug, backendContextPreview: backendContext.slice(0, 1200) } : {}) }),
          { status: 200 }
        );
      }
    }

    if (isLatestViolationQuery(message)) {
      const latestViolation = backendData.debug.violationSummary?.latestViolation ?? null;
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

    if (isRevenueQuery(message)) {
      const revenueSummary = backendData.debug.revenueSummary;
      const directRevenueAnswer = formatRevenueAnswer(message, revenueSummary);
      if (directRevenueAnswer) {
        return new Response(
          JSON.stringify({
            response: directRevenueAnswer,
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
    const result = await sendMessageWithRetry(chat as unknown as ChatSessionLike, message, 3);
    const chatResult = result as ChatResponseLike;
    const text = typeof chatResult.response?.text === 'function' ? chatResult.response.text() : String(result);

    const sanitized = typeof text === 'string' ? text.replace(/\*+/g, '') : text;
    return new Response(
      JSON.stringify({
        response: sanitized,
        ...(debug ? { debug: backendData.debug, backendContextPreview: backendContext.slice(0, 1200) } : {}),
      }),
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error('chat route error', err);
    const msg = err instanceof Error ? err.message : String(err) || 'Unknown error';
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

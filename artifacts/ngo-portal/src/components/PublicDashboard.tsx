import React, { useEffect, useMemo, useState } from "react";
import { Droplet, Heart, Layers } from "lucide-react";

type EventType = "donation" | "transfer" | "ngo_add" | "cash_donation" | string;

type PublicEvent = {
  id?: number | string;
  type: EventType;
  amount: number;
  user?: string | null;
  ngo?: string | null;
  toNgo?: string | null;
  notes?: string | null;
  createdAt: string;
};

export type PublicDashboardProps = {
  apiBaseUrl?: string;
  pollIntervalMs?: number;
};

function useEvents(apiBaseUrl?: string, pollIntervalMs = 30000) {
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const url = (apiBaseUrl || "").replace(/\/+$/, "") + "/api/public/events";

    async function fetchEvents() {
      try {
        setLoading(true);
        const res = await fetch(url);
        if (!res.ok) {
          const bodyText = await res.text().catch(() => "");
          throw new Error(`Unable to load public events: ${res.status} ${res.statusText} ${bodyText}`);
        }
        const json = await res.json();
        if (!mounted) return;
        setEvents(Array.isArray(json.events) ? json.events : json.events || []);
        setError(null);
      } catch (err: any) {
        if (!mounted) return;
        // Surface the attempted URL in logs and user-visible error to aid debugging
        // eslint-disable-next-line no-console
        console.error("PublicDashboard fetch failed", { url, error: err });
        setError(`${err.message || "Failed to load public dashboard data."} (${url})`);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchEvents();
    const interval = window.setInterval(fetchEvents, pollIntervalMs);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [apiBaseUrl, pollIntervalMs]);

  return { events, loading, error };
}

const monthLabels = (count = 6) => {
  const today = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() - (count - 1 - index), 1);
    return date.toLocaleString(undefined, { month: "short" });
  });
};

function formatWhen(iso: string) {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function generateEventText(event: PublicEvent) {
  if (event.type === "donation") {
    return `${event.user || "A user"} donated ${event.amount} pads to ${event.toNgo || "public stock"}.`;
  }

  if (event.type === "transfer") {
    return `CycleCare Charity donated ${event.amount} pads to ${event.toNgo || "an NGO"}.`;
  }

  if (event.type === "ngo_add") {
    return `${event.ngo || "CycleCare Charity"} donated ${event.amount} pads.`;
  }

  if (event.type === "cash_donation") {
    return `${event.user || "A donor"} made a cash donation of ₦${event.amount}.${event.notes ? ` ${event.notes}` : ""}`;
  }

  return `${event.user || "A user"} donated ${event.amount} pads.`;
}

function eventSubtitle(event: PublicEvent) {
  if (event.notes) return event.notes;
  if (event.type === "donation") return "Public stock";
  if (event.type === "transfer") return event.toNgo || "NGO transfer";
  if (event.type === "ngo_add") return "NGO donation";
  if (event.type === "cash_donation") return "Cash donation";
  return "Public event";
}

function eventBadgeLabel(type: EventType) {
  if (type === "donation") return "User Donations";
  if (type === "transfer") return "Charity Grants";
  if (type === "ngo_add") return "NGO Stock";
  if (type === "cash_donation") return "Cash Donations";
  return type;
}

function isPadEvent(event: PublicEvent) {
  return event.type === "donation" || event.type === "transfer" || event.type === "ngo_add";
}

function chartValues(events: PublicEvent[]) {
  const labels = monthLabels();
  const buckets = labels.map((label) => ({ label, value: 0 }));

  events.forEach((event) => {
    if (!isPadEvent(event)) return;
    const eventDate = new Date(event.createdAt);
    const label = eventDate.toLocaleString(undefined, { month: "short" });
    const bucket = buckets.find((item) => item.label === label);
    if (bucket) bucket.value += event.amount || 0;
  });

  return buckets;
}

function sourceTotals(events: PublicEvent[]) {
  const totals = { donation: 0, transfer: 0, ngo_add: 0 };
  events.forEach((event) => {
    if (!isPadEvent(event)) return;
    totals[event.type as keyof typeof totals] += event.amount || 0;
  });
  return totals;
}

function topContributors(events: PublicEvent[]) {
  const contributors: Record<string, number> = {};
  events.forEach((event) => {
    if (!isPadEvent(event)) return;
    const name = event.toNgo || event.ngo || "CycleCare Charity";
    contributors[name] = (contributors[name] || 0) + event.amount;
  });

  return Object.entries(contributors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));
}

export default function PublicDashboard({ apiBaseUrl, pollIntervalMs }: PublicDashboardProps) {
  const { events, loading, error } = useEvents(apiBaseUrl, pollIntervalMs);
  const recent = useMemo(() => events.slice(0, 12), [events]);
  const totals = useMemo(
    () => ({
      totalPads: events.filter(isPadEvent).reduce((sum, event) => sum + event.amount, 0),
      partners: new Set(events.filter((event) => event.toNgo).map((event) => event.toNgo as string)).size,
      users: new Set(events.filter((event) => event.user).map((event) => event.user as string)).size,
    }),
    [events]
  );

  const months = useMemo(() => chartValues(events), [events]);
  const sources = useMemo(() => sourceTotals(events), [events]);
  const contributors = useMemo(() => topContributors(events), [events]);
  const topTotal = Math.max(...contributors.map((item) => item.value), 1);

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[40px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#E96C8A]/10 px-4 py-2 text-sm font-semibold text-[#E96C8A]">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#E96C8A]" />
                Public
              </div>
              <div className="flex items-center gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-3xl bg-[#E96C8A]/10 text-[#E96C8A]">
                  <Droplet className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-900">CycleCare Impact Dashboard</h1>
                  <p className="mt-2 text-sm text-slate-500">Every pad donated makes a difference.</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                <p className="text-2xl font-bold text-slate-900">{totals.totalPads}</p>
                <p className="mt-2 text-sm text-slate-500">Total Pads</p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                <p className="text-2xl font-bold text-slate-900">{totals.partners}</p>
                <p className="mt-2 text-sm text-slate-500">Partners</p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                <p className="text-2xl font-bold text-slate-900">{totals.users}</p>
                <p className="mt-2 text-sm text-slate-500">Users</p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                <p className="text-2xl font-bold text-slate-900">{totals.totalPads * 7}</p>
                <p className="mt-2 text-sm text-slate-500">Reached</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.7fr_1fr]">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <p className="text-lg font-semibold text-slate-900">Recent Donations</p>
                <p className="mt-1 text-sm text-slate-500">Live public activity and funding movement.</p>
              </div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Activity
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {loading ? (
                <div className="py-14 text-center text-sm text-slate-500">Loading dashboard data…</div>
              ) : error ? (
                <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
              ) : recent.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">No public donations available yet.</div>
              ) : (
                recent.map((event) => (
                  <div key={String(event.id ?? event.createdAt)} className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-[#E96C8A] shadow-sm">
                            <Heart className="h-5 w-5" />
                          </div>
                          <p className="text-base font-semibold text-slate-900">{generateEventText(event)}</p>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                          <span>{formatWhen(event.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center rounded-full bg-[#E96C8A]/10 px-4 py-2 text-sm font-semibold text-[#E96C8A] shadow-sm">
                        {event.type === "cash_donation" ? `+₦${event.amount}` : `+${event.amount} pads`}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3 pb-4">
                <div>
                  <p className="text-lg font-semibold text-slate-900">Donation Sources</p>
                  <p className="mt-1 text-sm text-slate-500">Breakdown by source type.</p>
                </div>
                <Layers className="h-5 w-5 text-fuchsia-500" />
              </div>
              <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="h-48 rounded-[28px] bg-[#E96C8A]/10">
                  <SourceChart sources={sources} />
                </div>
                <div className="space-y-3">
                  <SourceLegend label="NGO Donations" value={sources.ngo_add} color="bg-[#E96C8A]" />
                  <SourceLegend label="User Donations" value={sources.donation} color="bg-emerald-500" />
                  <SourceLegend label="Charity Grants" value={sources.transfer} color="bg-violet-500" />
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-lg font-semibold text-slate-900">Monthly Trend</p>
              <p className="mt-2 text-sm text-slate-500">Pads donated over the last 6 months.</p>
              <div className="mt-6 space-y-4">
                <TrendChart months={months} />
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-lg font-semibold text-slate-900">Top NGO Contributors</p>
              <div className="mt-4 space-y-3">
                {contributors.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E96C8A]/10 text-[#E96C8A]">{index + 1}</div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                        <p className="text-xs text-slate-500">Contributor</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-slate-900">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SourceLegend({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className={`inline-flex h-3.5 w-3.5 rounded-full ${color}`} />
        <span className="text-sm text-slate-700">{label}</span>
      </div>
      <span className="text-sm font-semibold text-slate-900">{value} pads</span>
    </div>
  );
}

function SourceChart({ sources }: { sources: { donation: number; transfer: number; ngo_add: number } }) {
  const total = Math.max(sources.donation + sources.transfer + sources.ngo_add, 1);
  const segments = [
    { value: sources.ngo_add, color: "#E96C8A" },
    { value: sources.donation, color: "#10b981" },
    { value: sources.transfer, color: "#7c3aed" },
  ];
  let startAngle = 0;

  return (
    <svg viewBox="0 0 220 220" className="mx-auto h-full w-full" preserveAspectRatio="xMidYMid meet">
      {segments.map((segment, index) => {
        const value = Math.max(segment.value, 0);
        const sweep = (value / total) * 360;
        const endAngle = startAngle + sweep;
        const largeArcFlag = sweep > 180 ? 1 : 0;
        const radius = 80;
        const cx = 110;
        const cy = 110;
        const x1 = cx + radius * Math.cos((Math.PI / 180) * startAngle);
        const y1 = cy + radius * Math.sin((Math.PI / 180) * startAngle);
        const x2 = cx + radius * Math.cos((Math.PI / 180) * endAngle);
        const y2 = cy + radius * Math.sin((Math.PI / 180) * endAngle);
        const path = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
        startAngle = endAngle;
        return <path key={index} d={path} fill={segment.color} />;
      })}
      <circle cx="110" cy="110" r="40" fill="#f8fafc" />
    </svg>
  );
}

function TrendChart({ months }: { months: { label: string; value: number }[] }) {
  const max = Math.max(...months.map((item) => item.value), 1);

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        {months.map((item) => {
          const height = Math.max((item.value / max) * 180, 24);
          return (
            <div key={item.label} className="flex-1 text-center">
              <div className="mx-auto flex h-[180px] w-full items-end justify-center">
                <div className="w-full rounded-[18px] bg-[#E96C8A]" style={{ height }} />
              </div>
              <p className="mt-3 text-sm text-slate-500">{item.label}</p>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>0</span>
        <span>{Math.ceil(max / 2)}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

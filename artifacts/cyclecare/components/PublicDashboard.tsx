import React, { useEffect, useMemo, useState } from 'react';

type EventType = 'donation' | 'transfer' | 'ngo_add' | string;

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
  apiBaseUrl?: string; // optional, defaults to same-origin '/api'
  pollIntervalMs?: number;
};

function useEvents(apiBaseUrl?: string, pollIntervalMs = 30000) {
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const url = (apiBaseUrl || '').replace(/\/+$/, '') + '/api/public/events';

    async function fetchEvents() {
      try {
        setLoading(true);
        const res = await fetch(url);
        if (!res.ok) throw new Error('Network response was not ok');
        const json = await res.json();
        if (!mounted) return;
        setEvents(Array.isArray(json.events) ? json.events : json.events || []);
        setError(null);
      } catch (err: any) {
        if (!mounted) return;
        setError(err.message || 'Failed to load');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchEvents();
    const id = setInterval(fetchEvents, pollIntervalMs);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [apiBaseUrl, pollIntervalMs]);

  return { events, loading, error };
}

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function generateEventText(event: PublicEvent) {
  if (event.type === 'donation') {
    return `${event.user || 'A user'} donated ${event.amount} pads to ${event.toNgo || 'public stock'}.`;
  }
  if (event.type === 'transfer') {
    // explicit wording requested by the project
    return `Cyclecare Charity donated ${event.amount} pads to ${event.toNgo || 'an NGO'}.`;
  }
  if (event.type === 'ngo_add') {
    return `${event.ngo || 'CycleCare Charity'} donated ${event.amount} pads.`;
  }
  return `${event.type}: ${event.amount} pads.`;
}

export default function PublicDashboard({ apiBaseUrl, pollIntervalMs }: PublicDashboardProps) {
  const { events, loading, error } = useEvents(apiBaseUrl, pollIntervalMs);

  const recent = useMemo(() => events.slice(0, 12), [events]);

  const totals = useMemo(() => {
    const acc = { totalPads: 0, partners: new Set<string>(), users: new Set<string>() } as {
      totalPads: number;
      partners: Set<string>;
      users: Set<string>;
    };
    events.forEach((e) => {
      acc.totalPads += e.amount || 0;
      if (e.toNgo) acc.partners.add(e.toNgo);
      if (e.user) acc.users.add(e.user);
    });
    return acc;
  }, [events]);

  // simple month buckets for last 6 months (labels are placeholders)
  const months = useMemo(() => {
    const now = new Date();
    const buckets: { label: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ label: d.toLocaleString(undefined, { month: 'short' }), value: 0 });
    }
    events.forEach((ev) => {
      const d = new Date(ev.createdAt);
      const idx = buckets.findIndex((b) => b.label === d.toLocaleString(undefined, { month: 'short' }));
      if (idx >= 0) buckets[idx].value += ev.amount || 0;
    });
    return buckets;
  }, [events]);

  const sources = useMemo(() => {
    const s: Record<string, number> = { donation: 0, transfer: 0, ngo_add: 0 };
    events.forEach((e) => { s[e.type] = (s[e.type] || 0) + (e.amount || 0); });
    return s;
  }, [events]);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 16 }}>
      <header style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'inline-block', padding: '6px 10px', borderRadius: 999, background: '#eef2ff', color: '#4338ca', fontWeight: 700, fontSize: 12 }}>Public</div>
            <h1 style={{ margin: '8px 0 6px' }}>CycleCare Impact Dashboard</h1>
            <p style={{ margin: 0, color: '#6b7280' }}>Every pad donated makes a difference. Live public donations and transfers.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
          <Stat label="Total Pads" value={totals.totalPads} />
          <Stat label="Partners" value={totals.partners.size} />
          <Stat label="Users" value={totals.users.size} />
          <Stat label="Reached" value={totals.totalPads * 7} />
        </div>
      </header>

      <main style={{ display: 'grid', gap: 16 }}>
        <section style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16 }}>
          <div style={{ padding: 12, borderRadius: 12, background: '#fff', boxShadow: '0 1px 0 rgba(0,0,0,0.03)' }}>
            <h2>Recent Donations</h2>
            <div>
              {loading && <div style={{ color: '#6b7280' }}>Loading...</div>}
              {error && <div style={{ color: '#b91c1c' }}>{error}</div>}
              {!loading && recent.length === 0 && <div style={{ color: '#6b7280' }}>No public events yet.</div>}
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {recent.map((ev) => (
                  <li key={String(ev.id || ev.createdAt)} style={{ padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <div style={{ fontWeight: 700 }}>{generateEventText(ev)}</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#6b7280', fontSize: 13, marginTop: 6 }}>
                      <Badge type={ev.type} />
                      <div>{formatWhen(ev.createdAt)}</div>
                      {ev.notes && <div style={{ marginLeft: 'auto', color: '#374151' }}>{ev.notes}</div>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div style={{ padding: 12, borderRadius: 12, background: '#fff' }}>
            <h2>Donation Sources</h2>
            <SourcesPie sources={sources} />
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
          <div style={{ padding: 12, borderRadius: 12, background: '#fff' }}>
            <h2>Monthly Trend</h2>
            <BarSpark months={months} />
          </div>

          <div style={{ padding: 12, borderRadius: 12, background: '#fff' }}>
            <h2>Top NGO Contributors</h2>
            <TopContributors events={events} />
          </div>
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ minWidth: 140, padding: 12, borderRadius: 12, background: '#f8fafc', border: '1px solid #e6e9ef' }}>
      <div style={{ fontSize: 20, fontWeight: 800 }}>{value}</div>
      <div style={{ color: '#6b7280' }}>{label}</div>
    </div>
  );
}

function Badge({ type }: { type: EventType }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    donation: { bg: '#ecfdf5', color: '#166534', label: 'User Donations' },
    transfer: { bg: '#eef2ff', color: '#4338ca', label: 'Charity Grants' },
    ngo_add: { bg: '#fffbeb', color: '#92400e', label: 'NGO Stock' },
  };
  const info = map[type] || { bg: '#f3f4f6', color: '#111827', label: type };
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 999, background: info.bg, color: info.color, fontWeight: 700, fontSize: 12 }}>{info.label}</div>
  );
}

function BarSpark({ months }: { months: { label: string; value: number }[] }) {
  const max = Math.max(...months.map((m) => m.value), 1);
  return (
    <svg viewBox="0 0 380 180" width="100%" height={180} preserveAspectRatio="none" style={{ background: 'transparent' }}>
      {months.map((m, i) => {
        const width = 380 / months.length - 18;
        const padding = 28;
        const x = padding + i * (width + 12);
        const barH = (m.value / max) * (180 - padding * 1.6);
        const y = 180 - padding - barH;
        return (
          <g key={m.label}>
            <rect x={x} y={y} width={width} height={barH} rx={8} fill="#ec4899" />
            <text x={x + width / 2} y={y - 8} textAnchor="middle" fontSize={11} fill="#111827">{m.value}</text>
            <text x={x + width / 2} y={170} textAnchor="middle" fontSize={11} fill="#6b7280">{m.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function SourcesPie({ sources }: { sources: Record<string, number> }) {
  const vals = [sources.donation || 0, sources.transfer || 0, sources.ngo_add || 0];
  const total = Math.max(vals.reduce((a, b) => a + b, 0), 1);
  const angles = vals.map((v) => (v / total) * 360);
  const colors = ['#be185d', '#4338ca', '#92400e'];
  let start = 0;
  const paths = angles.map((a, i) => {
    const end = start + a;
    const large = a > 180 ? 1 : 0;
    const r = 72;
    const cx = 190;
    const cy = 90;
    const rad = (deg: number) => (Math.PI / 180) * deg;
    const x1 = cx + r * Math.cos(rad(start));
    const y1 = cy + r * Math.sin(rad(start));
    const x2 = cx + r * Math.cos(rad(end));
    const y2 = cy + r * Math.sin(rad(end));
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
    start = end;
    return <path key={i} d={path} fill={colors[i]} />;
  });

  return (
    <div>
      <svg viewBox="0 0 380 180" width="100%" height={180} preserveAspectRatio="none"> 
        <rect x="0" y="0" width="380" height="180" fill="transparent" />
        {paths}
      </svg>
      <div style={{ marginTop: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>User Donations</strong><span>{sources.donation || 0} pads</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>Charity Grants</strong><span>{sources.transfer || 0} pads</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>NGO Stock</strong><span>{sources.ngo_add || 0} pads</span></div>
        </div>
      </div>
    </div>
  );
}

function TopContributors({ events }: { events: PublicEvent[] }) {
  const contributors: Record<string, number> = {};
  events.forEach((e) => {
    const name = e.toNgo || e.ngo || 'Unknown NGO';
    contributors[name] = (contributors[name] || 0) + (e.amount || 0);
  });
  const sorted = Object.entries(contributors).sort((a, b) => b[1] - a[1]).slice(0, 5);
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {sorted.map(([name, val], i) => (
        <li key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{i + 1}</div>
            <div>{name}</div>
          </div>
          <div style={{ fontWeight: 700 }}>{val}</div>
        </li>
      ))}
    </ul>
  );
}

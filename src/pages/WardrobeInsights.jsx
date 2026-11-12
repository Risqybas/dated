import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  Cell, LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis, YAxis
} from "recharts";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";

// ─── Styles ───────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .wi-root {
    --ink:    #0d0b08;
    --cream:  #f5f0e8;
    --dust:   #8a8178;
    --gold:   #b8955a;
    --gold2:  #d4aa6e;
    --green:  #4a7c6b;
    --red:    #8b3a3a;
    --muted:  rgba(245,240,232,0.06);
    font-family: 'DM Sans', sans-serif;
    min-height: 100svh;
    background: var(--ink);
    color: var(--cream);
    padding-bottom: max(2rem, calc(env(safe-area-inset-bottom) + 80px));
  }

  /* ── Header ── */
  .wi-header {
    position: sticky; top: 0; z-index: 20;
    display: flex; align-items: center; gap: 0.75rem;
    padding: 0.9rem 1.25rem;
    padding-top: max(0.9rem, env(safe-area-inset-top));
    background: rgba(13,11,8,0.92);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    border-bottom: 0.5px solid rgba(255,255,255,0.06);
  }

  .wi-back-btn {
    width: 34px; height: 34px; border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.12);
    background: transparent; color: var(--cream);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; -webkit-tap-highlight-color: transparent;
    transition: background 0.2s; flex-shrink: 0;
  }
  .wi-back-btn:hover { background: rgba(255,255,255,0.07); }

  .wi-header-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.2rem; font-weight: 300;
    letter-spacing: 0.1em; color: var(--cream);
  }

  /* ── Body ── */
  .wi-body {
    padding: 1.5rem 1.25rem 0;
    animation: fadeUp 0.5s cubic-bezier(0.22,0.68,0,1.2) both;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Stat cards ── */
  .wi-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.65rem;
    margin-bottom: 1.75rem;
  }

  .wi-stat-card {
    background: var(--muted);
    border: 0.5px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    padding: 1rem 0.75rem;
    display: flex; flex-direction: column;
    gap: 4px; align-items: center; text-align: center;
    animation: fadeUp 0.5s cubic-bezier(0.22,0.68,0,1.2) both;
  }

  .wi-stat-value {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.8rem; font-weight: 400;
    color: var(--cream); line-height: 1;
  }

  .wi-stat-label {
    font-size: 0.62rem; font-weight: 500;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--dust);
  }

  .wi-stat-card.gold .wi-stat-value { color: var(--gold); }
  .wi-stat-card.green .wi-stat-value { color: #7ec8b0; }

  /* ── Section heading ── */
  .wi-section-heading {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.25rem; font-weight: 300;
    letter-spacing: 0.04em; color: var(--cream);
    margin-bottom: 0.35rem;
  }

  .wi-section-sub {
    font-size: 0.75rem; color: var(--dust);
    font-weight: 300; margin-bottom: 1.1rem; line-height: 1.5;
  }

  /* ── Chart container ── */
  .wi-chart-wrap {
    background: var(--muted);
    border: 0.5px solid rgba(255,255,255,0.07);
    border-radius: 14px;
    padding: 1.25rem 0.5rem 0.75rem;
    margin-bottom: 1.75rem;
    overflow: hidden;
  }

  .wi-chart-legend {
    display: flex; gap: 1.25rem;
    justify-content: flex-end;
    padding: 0 1rem 0.75rem;
  }

  .wi-legend-item {
    display: flex; align-items: center; gap: 6px;
    font-size: 0.68rem; font-weight: 400;
    letter-spacing: 0.06em; color: var(--dust);
  }

  .wi-legend-dot {
    width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0;
  }

  /* ── Tab filter ── */
  .wi-tabs {
    display: flex; gap: 0.4rem;
    margin-bottom: 1.1rem;
  }

  .wi-tab {
    flex: 1; padding: 0.55rem;
    border-radius: 8px;
    border: 0.5px solid rgba(255,255,255,0.1);
    background: transparent;
    color: var(--dust);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.72rem; font-weight: 500;
    letter-spacing: 0.06em; text-transform: uppercase;
    cursor: pointer; -webkit-tap-highlight-color: transparent;
    transition: all 0.2s;
  }
  .wi-tab.active {
    background: rgba(184,149,90,0.12);
    border-color: rgba(184,149,90,0.35);
    color: var(--gold);
  }

  /* ── Item list ── */
  .wi-item-list { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.75rem; }

  .wi-item-row {
    display: flex; align-items: center; gap: 0.85rem;
    background: var(--muted);
    border: 0.5px solid rgba(255,255,255,0.07);
    border-radius: 10px;
    padding: 0.75rem 1rem;
    animation: fadeUp 0.35s cubic-bezier(0.22,0.68,0,1.2) both;
    cursor: default;
    transition: border-color 0.2s;
  }
  .wi-item-row:hover { border-color: rgba(184,149,90,0.25); }

  .wi-item-rank {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.1rem; font-weight: 300;
    color: var(--dust); min-width: 22px; text-align: center;
  }

  .wi-item-info { flex: 1; min-width: 0; }

  .wi-item-name {
    font-size: 0.875rem; font-weight: 500;
    color: var(--cream); white-space: nowrap;
    overflow: hidden; text-overflow: ellipsis;
  }

  .wi-item-meta {
    display: flex; align-items: center; gap: 0.5rem; margin-top: 3px; flex-wrap: wrap;
  }

  .wi-item-category {
    font-size: 0.65rem; font-weight: 400;
    letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--dust);
  }

  .wi-item-color-dot {
    width: 8px; height: 8px; border-radius: 50%;
    flex-shrink: 0;
    border: 1px solid rgba(255,255,255,0.15);
  }

  .wi-item-brand {
    font-size: 0.65rem; color: var(--dust); font-weight: 300;
    font-style: italic;
  }

  /* wear count */
  .wi-item-worn {
    display: flex; flex-direction: column;
    align-items: flex-end; gap: 2px; flex-shrink: 0;
  }

  .wi-item-worn-count {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.35rem; font-weight: 400;
    line-height: 1;
  }
  .wi-item-worn-label {
    font-size: 0.6rem; font-weight: 400;
    letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--dust);
  }

  /* progress bar */
  .wi-item-bar-wrap {
    margin-top: 6px;
    height: 2px;
    background: rgba(255,255,255,0.07);
    border-radius: 2px;
    overflow: hidden;
  }
  .wi-item-bar {
    height: 100%; border-radius: 2px;
    transition: width 0.8s cubic-bezier(0.22,0.68,0,1.2);
  }

  /* ── Dormant items ── */
  .wi-dormant-label {
    font-size: 0.65rem; font-weight: 500;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--dust); margin-bottom: 0.6rem;
    margin-top: 0.25rem;
  }

  .wi-dormant-chip {
    display: inline-flex; align-items: center; gap: 5px;
    background: rgba(139,58,58,0.12);
    border: 0.5px solid rgba(139,58,58,0.25);
    border-radius: 999px;
    padding: 4px 10px;
    font-size: 0.72rem; color: #e07070;
    cursor: default; margin: 0 0.35rem 0.35rem 0;
  }

  /* ── Sustainability score ── */
  .wi-sustain {
    background: rgba(74,124,107,0.08);
    border: 0.5px solid rgba(74,124,107,0.2);
    border-radius: 14px;
    padding: 1.25rem 1.25rem;
    margin-bottom: 1.75rem;
    display: flex; align-items: center; gap: 1.25rem;
  }

  .wi-sustain-ring {
    position: relative; flex-shrink: 0;
    width: 64px; height: 64px;
  }

  .wi-sustain-ring svg { transform: rotate(-90deg); }

  .wi-sustain-ring-track {
    fill: none;
    stroke: rgba(74,124,107,0.15);
    stroke-width: 5;
  }

  .wi-sustain-ring-fill {
    fill: none;
    stroke: #4a7c6b;
    stroke-width: 5;
    stroke-linecap: round;
    transition: stroke-dashoffset 1s cubic-bezier(0.22,0.68,0,1.2);
  }

  .wi-sustain-ring-label {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Cormorant Garamond', serif;
    font-size: 1rem; font-weight: 400; color: #7ec8b0;
  }

  .wi-sustain-copy {}
  .wi-sustain-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.1rem; font-weight: 300; color: var(--cream);
    margin-bottom: 4px;
  }
  .wi-sustain-body {
    font-size: 0.78rem; color: var(--dust); line-height: 1.55; font-weight: 300;
  }

  /* ── Loading ── */
  .wi-loading {
    min-height: 60svh; display: flex;
    align-items: center; justify-content: center;
    flex-direction: column; gap: 1rem;
  }
  .wi-spinner {
    width: 26px; height: 26px;
    border: 2px solid rgba(184,149,90,0.2);
    border-top-color: var(--gold); border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .wi-loading-text { font-size: 0.8rem; color: var(--dust); font-weight: 300; }

  /* ── Empty ── */
  .wi-empty {
    min-height: 50svh; display: flex;
    align-items: center; justify-content: center;
    flex-direction: column; gap: 1rem; padding: 2rem; text-align: center;
  }
  .wi-empty-icon {
    width: 60px; height: 60px; border-radius: 50%;
    border: 1.5px dashed rgba(184,149,90,0.25);
    display: flex; align-items: center; justify-content: center;
    color: rgba(184,149,90,0.4);
  }
  .wi-empty-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.35rem; font-weight: 300; color: var(--cream);
  }
  .wi-empty-body { font-size: 0.82rem; color: var(--dust); line-height: 1.6; max-width: 240px; }
  .wi-empty-cta {
    padding: 0.65rem 1.5rem; background: var(--gold); border: none;
    border-radius: 8px; color: var(--ink);
    font-family: 'DM Sans', sans-serif; font-size: 0.82rem; font-weight: 500;
    cursor: pointer; transition: opacity 0.2s;
  }
  .wi-empty-cta:hover { opacity: 0.85; }

  /* ── Custom tooltip ── */
  .wi-tooltip {
    background: #1a1713;
    border: 0.5px solid rgba(255,255,255,0.12);
    border-radius: 8px;
    padding: 8px 12px;
    font-family: 'DM Sans', sans-serif;
  }
  .wi-tooltip-name { font-size: 0.78rem; color: var(--cream); font-weight: 500; margin-bottom: 3px; }
  .wi-tooltip-val  { font-size: 0.72rem; color: var(--gold); }
`;

// ─── Custom tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="wi-tooltip">
      <div className="wi-tooltip-name">{d.name}</div>
      <div className="wi-tooltip-val">Worn {d.times_worn}×</div>
      {d.category && <div style={{ fontSize: "0.68rem", color: "var(--dust)", marginTop: 2 }}>{d.category}</div>}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const RING_R    = 27;
const RING_CIRC = 2 * Math.PI * RING_R;

function sustainScore(items) {
  if (!items.length) return 0;
  const avg = items.reduce((s, i) => s + (i.times_worn ?? 0), 0) / items.length;
  // Score 0–100: avg 10+ wears = 100
  return Math.min(100, Math.round((avg / 10) * 100));
}

function sustainLabel(score) {
  if (score >= 80) return "Excellent — you're rewearing like a pro.";
  if (score >= 55) return "Good — most of your wardrobe gets regular use.";
  if (score >= 30) return "Fair — some items could use more love.";
  return "Low — many pieces are barely worn. Time to reshuffle.";
}

const CATEGORY_COLORS = {
  tops:       "#b8955a",
  bottoms:    "#7ec8b0",
  dresses:    "#c4a882",
  outerwear:  "#8aacb8",
  shoes:      "#a89070",
  accessories:"#9ab88a",
  other:      "#8a8178",
};

function colorFor(item) {
  return item.color
    ? item.color
    : (CATEGORY_COLORS[item.category?.toLowerCase()] ?? "#8a8178");
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function WardrobeInsights() {
  const navigate      = useNavigate();
  const { user }      = useAuth();

  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState("most"); // "most" | "least" | "all"

  // ── Fetch wardrobe items ────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("wardrobe_items")
        .select("id, name, category, color, brand, times_worn")
        .eq("user_id", user.id)
        .order("times_worn", { ascending: false });

      if (error) console.error("[WardrobeInsights]", error);
      setItems(data ?? []);
      setLoading(false);
    })();
  }, [user]);

  // ── Derived data ───────────────────────────────────────────────────────
  const totalItems   = items.length;
  const totalWears   = items.reduce((s, i) => s + (i.times_worn ?? 0), 0);
  const avgWears     = totalItems ? (totalWears / totalItems).toFixed(1) : 0;
  const dormant      = items.filter(i => (i.times_worn ?? 0) === 0);
  const score        = sustainScore(items);
  const ringOffset   = RING_CIRC * (1 - score / 100);

  const maxWorn = items[0]?.times_worn ?? 1;

  // Chart data per tab
  const chartData = (() => {
    const sorted = [...items];
    if (tab === "most")  return sorted.slice(0, 10);
    if (tab === "least") return sorted.sort((a, b) => (a.times_worn ?? 0) - (b.times_worn ?? 0)).slice(0, 10);
    return sorted.slice(0, 15);
  })();

  // List data — always most → least
  const listData = [...items].slice(0, 12);

  // ── States ─────────────────────────────────────────────────────────────
  if (loading) return (
    <>
      <style>{STYLES}</style>
      <div className="wi-root">
        <div className="wi-header">
          <button className="wi-back-btn" onClick={() => navigate(-1)}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div className="wi-header-title">Wardrobe Insights</div>
        </div>
        <div className="wi-loading">
          <div className="wi-spinner" />
          <div className="wi-loading-text">Analysing your wardrobe…</div>
        </div>
      </div>
    </>
  );

  if (!loading && totalItems === 0) return (
    <>
      <style>{STYLES}</style>
      <div className="wi-root">
        <div className="wi-header">
          <button className="wi-back-btn" onClick={() => navigate(-1)}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div className="wi-header-title">Wardrobe Insights</div>
        </div>
        <div className="wi-empty">
          <div className="wi-empty-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
              <path d="M12 3 L4 7.5v13h16V7.5L12 3z"/>
              <path d="M12 3v17"/>
            </svg>
          </div>
          <div className="wi-empty-title">No wardrobe items yet</div>
          <div className="wi-empty-body">Add items to your wardrobe to see wear analytics and insights.</div>
          <button className="wi-empty-cta" onClick={() => navigate("/wardrobe")}>Go to Wardrobe</button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{STYLES}</style>
      <div className="wi-root">

        {/* Header */}
        <div className="wi-header">
          <button className="wi-back-btn" onClick={() => navigate(-1)} aria-label="Back">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div className="wi-header-title">Wardrobe Insights</div>
        </div>

        <div className="wi-body">

          {/* ── Stat cards ── */}
          <div className="wi-stats">
            <div className="wi-stat-card" style={{ animationDelay: "0s" }}>
              <div className="wi-stat-value">{totalItems}</div>
              <div className="wi-stat-label">Items</div>
            </div>
            <div className="wi-stat-card gold" style={{ animationDelay: "0.07s" }}>
              <div className="wi-stat-value">{totalWears}</div>
              <div className="wi-stat-label">Total wears</div>
            </div>
            <div className="wi-stat-card green" style={{ animationDelay: "0.14s" }}>
              <div className="wi-stat-value">{avgWears}</div>
              <div className="wi-stat-label">Avg wears</div>
            </div>
          </div>

          {/* ── Sustainability ring ── */}
          <div className="wi-sustain">
            <div className="wi-sustain-ring">
              <svg width="64" height="64" viewBox="0 0 64 64">
                <circle className="wi-sustain-ring-track" cx="32" cy="32" r={RING_R} />
                <circle
                  className="wi-sustain-ring-fill"
                  cx="32" cy="32" r={RING_R}
                  strokeDasharray={RING_CIRC}
                  strokeDashoffset={ringOffset}
                />
              </svg>
              <div className="wi-sustain-ring-label">{score}</div>
            </div>
            <div className="wi-sustain-copy">
              <div className="wi-sustain-title">Rewear Score</div>
              <div className="wi-sustain-body">{sustainLabel(score)}</div>
            </div>
          </div>

          {/* ── Bar chart ── */}
          <div className="wi-section-heading">Wear frequency</div>
          <div className="wi-section-sub">How often each item gets worn.</div>

          {/* Tab filter */}
          <div className="wi-tabs">
            {[
              { key: "most",  label: "Most worn"  },
              { key: "least", label: "Least worn" },
              { key: "all",   label: "All items"  },
            ].map(t => (
              <button
                key={t.key}
                className={`wi-tab${tab === t.key ? " active" : ""}`}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="wi-chart-wrap">
            <div className="wi-chart-legend">
              <div className="wi-legend-item">
                <div className="wi-legend-dot" style={{ background: "var(--gold)" }} />
                Times worn
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={chartData}
                margin={{ top: 4, right: 16, left: -18, bottom: 4 }}
                barSize={18}
              >
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#8a8178", fontSize: 10, fontFamily: "DM Sans" }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  tickFormatter={v => v.length > 7 ? v.slice(0, 7) + "…" : v}
                />
                <YAxis
                  tick={{ fill: "#8a8178", fontSize: 10, fontFamily: "DM Sans" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "rgba(255,255,255,0.04)", radius: 4 }}
                />
                <Bar dataKey="times_worn" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={entry.id}
                      fill={
                        tab === "most"
                          ? `rgba(184,149,90,${1 - (index / chartData.length) * 0.55})`
                          : tab === "least"
                            ? `rgba(139,58,58,${0.4 + (index / chartData.length) * 0.5})`
                            : colorFor(entry)
                      }
                    />
                  ))}
                  <LabelList
                    dataKey="times_worn"
                    position="top"
                    style={{ fill: "#8a8178", fontSize: 9, fontFamily: "DM Sans" }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ── Item rankings ── */}
          <div className="wi-section-heading">Item rankings</div>
          <div className="wi-section-sub">Your most-used pieces, ranked by wear count.</div>

          <div className="wi-item-list">
            {listData.map((item, i) => {
              const pct = maxWorn > 0 ? ((item.times_worn ?? 0) / maxWorn) * 100 : 0;
              const barColor =
                i === 0 ? "var(--gold2)" :
                i === 1 ? "var(--gold)"  :
                i === 2 ? "#a07840"      :
                "rgba(184,149,90,0.4)";

              return (
                <div
                  key={item.id}
                  className="wi-item-row"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <div className="wi-item-rank">{i + 1}</div>

                  <div className="wi-item-info">
                    <div className="wi-item-name">{item.name}</div>
                    <div className="wi-item-meta">
                      {item.category && (
                        <span className="wi-item-category">{item.category}</span>
                      )}
                      {item.color && (
                        <span
                          className="wi-item-color-dot"
                          style={{ background: item.color }}
                          title={item.color}
                        />
                      )}
                      {item.brand && (
                        <span className="wi-item-brand">{item.brand}</span>
                      )}
                    </div>
                    <div className="wi-item-bar-wrap">
                      <div
                        className="wi-item-bar"
                        style={{ width: `${pct}%`, background: barColor }}
                      />
                    </div>
                  </div>

                  <div className="wi-item-worn">
                    <div className="wi-item-worn-count" style={{ color: i < 3 ? "var(--gold)" : "var(--cream)" }}>
                      {item.times_worn ?? 0}
                    </div>
                    <div className="wi-item-worn-label">wears</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Dormant items ── */}
          {dormant.length > 0 && (
            <>
              <div className="wi-section-heading">Never worn</div>
              <div className="wi-section-sub">
                {dormant.length} item{dormant.length > 1 ? "s" : ""} that {dormant.length > 1 ? "have" : "has"} never made it into an outfit.
              </div>
              <div className="wi-dormant-label">Re-style or donate?</div>
              <div style={{ marginBottom: "1.75rem" }}>
                {dormant.map(item => (
                  <span key={item.id} className="wi-dormant-chip">
                    <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                      <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2"/>
                      <path d="M6 3.5v3M6 8.5v.3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                    {item.name}
                    {item.category && ` · ${item.category}`}
                  </span>
                ))}
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}

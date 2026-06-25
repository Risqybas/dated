import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

// ─── Styles ───────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .cal-root {
    --ink:    #0d0b08;
    --cream:  #f5f0e8;
    --dust:   #8a8178;
    --gold:   #b8955a;
    --green:  #4a7c6b;
    font-family: 'DM Sans', sans-serif;
    min-height: 100svh;
    background: var(--ink);
    color: var(--cream);
    padding: 1rem 1rem;
    padding-top: max(1rem, env(safe-area-inset-top));
    padding-bottom: max(1rem, calc(env(safe-area-inset-bottom) + 80px));
  }

  /* ── Header ── */
  .cal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
  }

  .cal-month-year {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.6rem;
    font-weight: 300;
    letter-spacing: 0.04em;
    color: var(--cream);
  }

  .cal-nav-btns {
    display: flex;
    gap: 0.5rem;
  }

  .cal-nav-btn {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.04);
    color: var(--cream);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: border-color 0.2s, background 0.2s;
  }

  .cal-nav-btn:hover {
    border-color: rgba(255,255,255,0.25);
    background: rgba(255,255,255,0.08);
  }

  .cal-nav-btn:active {
    background: rgba(255,255,255,0.12);
  }

  /* ── Weekday headers ── */
  .cal-weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .cal-weekday {
    text-align: center;
    font-size: 0.7rem;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--dust);
    padding: 0.5rem;
  }

  /* ── Day grid ── */
  .cal-days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 0.5rem;
    animation: fadeIn 0.3s ease both;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Day cell ── */
  .cal-day {
    aspect-ratio: 3/6;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.03);
    position: relative;
    overflow: hidden;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: border-color 0.2s, background 0.2s, transform 0.15s;
  }

  .cal-day:hover:not(.empty) {
    border-color: rgba(184,149,90,0.5);
    background: rgba(184,149,90,0.08);
    transform: translateY(-2px);
  }

  .cal-day.empty {
    background: transparent;
    border-color: transparent;
    cursor: default;
  }

  .cal-day.today {
    border-color: var(--gold);
    background: rgba(184,149,90,0.12);
  }

  /* day number */
  .cal-day-num {
    position: absolute;
    top: 4px;
    right: 5px;
    font-size: 0.65rem;
    font-weight: 500;
    color: var(--dust);
    z-index: 2;
    opacity: 0.7;
  }

  .cal-day.today .cal-day-num {
    color: var(--gold);
    opacity: 1;
  }

  /* outfit thumbnail */
  .cal-outfit {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 1;
    transition: transform 0.3s cubic-bezier(0.22, 0.68, 0, 1.2);
  }

  .cal-day:hover .cal-outfit {
    transform: scale(1.08);
  }

  /* overlay on hover */
  .cal-day-overlay {
    position: absolute;
    inset: 0;
    background: rgba(13,11,8,0.0);
    z-index: 3;
    transition: background 0.2s;
  }

  .cal-day:hover .cal-day-overlay {
    background: rgba(13,11,8,0.35);
  }

  /* count badge */
  .cal-count-badge {
    position: absolute;
    bottom: 4px;
    right: 5px;
    background: rgba(184,149,90,0.85);
    color: var(--ink);
    font-size: 0.6rem;
    font-weight: 600;
    padding: 2px 5px;
    border-radius: 4px;
    z-index: 4;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .cal-day:hover .cal-count-badge {
    opacity: 1;
  }

  /* processing indicator on today's cell */
  .cal-processing-dot {
    position: absolute;
    bottom: 4px;
    left: 5px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--gold);
    z-index: 4;
    animation: pulse 1.2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.4; transform: scale(0.8); }
    50%       { opacity: 1;   transform: scale(1.2); }
  }

  /* ── Empty state ── */
  .cal-empty {
    grid-column: 1 / -1;
    text-align: center;
    padding: 2rem 1rem;
    color: var(--dust);
  }

  .cal-empty-icon {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    opacity: 0.4;
  }

  .cal-empty-text {
    font-size: 0.9rem;
    font-weight: 300;
    line-height: 1.6;
  }

  /* ── Loading ── */
  .cal-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 2rem;
  }

  .cal-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(184,149,90,0.2);
    border-top-color: var(--gold);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .cal-loading-text {
    font-size: 0.9rem;
    color: var(--dust);
    font-weight: 300;
  }

  /* ── Detail modal ── */
  .cal-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 100;
    background: rgba(13,11,8,0.7);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    display: flex;
    align-items: flex-end;
    animation: fadeIn 0.2s ease both;
  }

  .cal-modal {
    width: 100%;
    max-width: 500px;
    margin: 0 auto;
    background: var(--ink);
    border: 1px solid rgba(255,255,255,0.1);
    border-bottom: none;
    border-radius: 20px 20px 0 0;
    padding: 1.5rem;
    padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 64px);
    animation: slideUp 0.3s cubic-bezier(0.22, 0.68, 0, 1.2) both;
    max-height: 80svh;
    overflow-y: auto;
  }

  @keyframes slideUp {
    from { transform: translateY(100%); }
    to   { transform: translateY(0); }
  }

  .cal-modal-close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.15);
    background: rgba(255,255,255,0.05);
    color: var(--cream);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    -webkit-tap-highlight-color: transparent;
    transition: background 0.2s;
  }

  .cal-modal-close:hover {
    background: rgba(255,255,255,0.1);
  }

  .cal-modal-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.5rem;
    font-weight: 300;
    margin-bottom: 1rem;
    color: var(--cream);
  }

  .cal-modal-outfits {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .cal-outfit-card {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px;
    overflow: hidden;
  }

  .cal-outfit-card-img {
    width: 100%;
    aspect-ratio: 3/4;
    object-fit: cover;
    display: block;
  }

  .cal-outfit-card-info {
    padding: 0.75rem 1rem;
  }

  .cal-outfit-card-caption {
    font-size: 0.85rem;
    color: var(--cream);
    line-height: 1.5;
    font-weight: 300;
  }

  .cal-outfit-card-date {
    font-size: 0.7rem;
    color: var(--dust);
    margin-top: 0.4rem;
    font-weight: 300;
    letter-spacing: 0.04em;
  }

  /* ── No data for date ── */
  .cal-modal-empty {
    text-align: center;
    padding: 2rem 1rem;
    color: var(--dust);
  }

  .cal-modal-empty-text {
    font-size: 0.9rem;
    font-weight: 300;
    line-height: 1.6;
  }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function isToday(year, month, day) {
  const now = new Date();
  return (
    now.getFullYear() === year &&
    now.getMonth() === month &&
    now.getDate() === day
  );
}

function formatDate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Calendar() {
  const navigate          = useNavigate();
  const location          = useLocation();
  const { user }          = useAuth();

  const now               = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const [outfits, setOutfits]               = useState({});
  const [loading, setLoading]               = useState(true);
  const [selectedDate, setSelectedDate]     = useState(null);
  const [selectedOutfits, setSelectedOutfits] = useState([]);

  // ── Inject the just-saved outfit immediately from navigation state ────────
  useEffect(() => {
    const newOutfit = location.state?.newOutfit;
    if (!newOutfit || !newOutfit.capture_date) return;

    setOutfits(prev => {
      const date = newOutfit.capture_date;
      const existing = prev[date] ?? [];
      // Avoid duplicates if the fetch also returns it
      if (existing.some(o => o.id === newOutfit.id)) return prev;
      return { ...prev, [date]: [newOutfit, ...existing] };
    });
  }, []);

  // ── Fetch outfits for current month ──────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    (async () => {
      setLoading(true);
      const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
      const end   = formatDate(year, month, getDaysInMonth(year, month));

      const { data, error } = await supabase
        .from("outfits")
        .select("id, raw_image_url, processed_image_url, caption, capture_date")
        .eq("user_id", user.id)
        .eq("is_deleted", false)
        .gte("capture_date", start)
        .lte("capture_date", end)
        .order("capture_date", { ascending: false });

      if (error) {
        console.error("[Calendar] fetch error:", error);
      } else {
        const grouped = {};
        data.forEach(outfit => {
          if (!grouped[outfit.capture_date]) grouped[outfit.capture_date] = [];
          grouped[outfit.capture_date].push(outfit);
        });
        setOutfits(grouped);
      }
      setLoading(false);
    })();
  }, [user, year, month]);

  // ── Poll processed_image_url for any today outfits still processing ───────
  useEffect(() => {
    const today = formatDate(now.getFullYear(), now.getMonth(), now.getDate());
    const todayOutfits = outfits[today];
    if (!todayOutfits || todayOutfits.length === 0) return;

    const pending = todayOutfits.filter(o => !o.processed_image_url);
    if (pending.length === 0) return;

    const interval = setInterval(async () => {
      const ids = pending.map(o => o.id);
      const { data, error } = await supabase
        .from("outfits")
        .select("id, processed_image_url")
        .in("id", ids)
        .not("processed_image_url", "is", null);

      if (error || !data || data.length === 0) return;

      setOutfits(prev => {
        const updated = { ...prev };
        updated[today] = updated[today].map(outfit => {
          const fresh = data.find(d => d.id === outfit.id);
          return fresh ? { ...outfit, processed_image_url: fresh.processed_image_url } : outfit;
        });
        return updated;
      });

      // Stop polling once all are done
      const allResolved = data.length === pending.length;
      if (allResolved) clearInterval(interval);
    }, 3000);

    return () => clearInterval(interval);
  }, [outfits]);

  // ── Navigate months ───────────────────────────────────────────────────────
  function handlePrevMonth() {
    if (month === 0) { setYear(year - 1); setMonth(11); }
    else setMonth(month - 1);
  }

  function handleNextMonth() {
    if (month === 11) { setYear(year + 1); setMonth(0); }
    else setMonth(month + 1);
  }

  // ── Open day detail ───────────────────────────────────────────────────────
  function handleDayClick(day) {
    const dateStr    = formatDate(year, month, day);
    const dayOutfits = outfits[dateStr] || [];
    if (dayOutfits.length > 0) {
      setSelectedDate(dateStr);
      setSelectedOutfits(dayOutfits);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay    = getFirstDayOfMonth(year, month);
  const monthNames  = ["January","February","March","April","May","June",
                       "July","August","September","October","November","December"];
  const weekdays    = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let day = 1; day <= daysInMonth; day++) days.push(day);

  const hasOutfits = Object.keys(outfits).length > 0;

  return (
    <>
      <style>{STYLES}</style>
      <div className="cal-root">

        {/* Header */}
        <div className="cal-header">
          <div className="cal-month-year">{monthNames[month]} {year}</div>
          <div className="cal-nav-btns">
            <button className="cal-nav-btn" onClick={handlePrevMonth} aria-label="Previous month">
              <ChevronLeft size={18} />
            </button>
            <button className="cal-nav-btn" onClick={handleNextMonth} aria-label="Next month">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="cal-weekdays">
          {weekdays.map(day => (
            <div key={day} className="cal-weekday">{day}</div>
          ))}
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="cal-loading">
            <div className="cal-spinner" />
            <div className="cal-loading-text">Loading outfits…</div>
          </div>
        ) : !hasOutfits ? (
          <div className="cal-empty">
            <div className="cal-empty-icon">📷</div>
            <div className="cal-empty-text">
              No outfits captured yet.<br />
              Tap the camera to capture today's outfit.
            </div>
          </div>
        ) : (
          <div className="cal-days">
            {days.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="cal-day empty" />;
              }

              const dateStr    = formatDate(year, month, day);
              const dayOutfits = outfits[dateStr] || [];
              const thumbnail  = dayOutfits[0];
              const isCurrentDay = isToday(year, month, day);
              const hasOutfit    = dayOutfits.length > 0;
              const isProcessing = hasOutfit && !thumbnail?.processed_image_url && isCurrentDay;

              return (
                <button
                  key={day}
                  className={`cal-day${isCurrentDay ? " today" : ""}${!hasOutfit ? " empty" : ""}`}
                  onClick={() => handleDayClick(day)}
                  disabled={!hasOutfit}
                  aria-label={`${monthNames[month]} ${day}${hasOutfit ? ` - ${dayOutfits.length} outfit(s)` : ""}`}
                >
                  <div className="cal-day-num">{day}</div>
                  {thumbnail && (
                    <>
                      <img
                        src={thumbnail.processed_image_url || thumbnail.raw_image_url}
                        alt={`Outfit on ${dateStr}`}
                        className="cal-outfit"
                      />
                      <div className="cal-day-overlay" />
                      {dayOutfits.length > 1 && (
                        <div className="cal-count-badge">+{dayOutfits.length - 1}</div>
                      )}
                      {isProcessing && <div className="cal-processing-dot" />}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Detail modal */}
        {selectedDate && (
          <div className="cal-modal-overlay" onClick={() => setSelectedDate(null)}>
            <div className="cal-modal" onClick={e => e.stopPropagation()}>
              <button
                className="cal-modal-close"
                onClick={() => setSelectedDate(null)}
                aria-label="Close"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M1 1l14 14M15 1L1 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>

              {(() => {
                const [selYear, selMonthNum, selDay] = selectedDate.split("-").map(Number);
                return (
                  <div className="cal-modal-title">
                    {monthNames[selMonthNum - 1]} {selDay}, {selYear}
                  </div>
                );
              })()}

              {selectedOutfits.length > 0 ? (
                <div className="cal-modal-outfits">
                  {selectedOutfits.map(outfit => (
                    <div
                      key={outfit.id}
                      className="cal-outfit-card"
                      style={{ cursor: "pointer" }}
                      onClick={() => navigate(`/outfit/${outfit.id}`)}
                    >
                      <img
                        src={outfit.processed_image_url || outfit.raw_image_url}
                        alt="Outfit"
                        className="cal-outfit-card-img"
                      />
                      {outfit.caption && (
                        <div className="cal-outfit-card-info">
                          <div className="cal-outfit-card-caption">{outfit.caption}</div>
                          <div className="cal-outfit-card-date">
                            {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="cal-modal-empty">
                  <div className="cal-modal-empty-text">No outfits captured this day.</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
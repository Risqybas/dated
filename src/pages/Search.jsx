import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

// ─── Styles ───────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .srch-root {
    --ink:   #0d0b08;
    --cream: #f5f0e8;
    --dust:  #8a8178;
    --gold:  #b8955a;
    font-family: 'DM Sans', sans-serif;
    min-height: 100svh;
    background: var(--ink);
    color: var(--cream);
    padding-bottom: max(1rem, calc(env(safe-area-inset-bottom) + 80px));
  }

  .srch-header {
    position: sticky;
    top: 0; z-index: 20;
    padding: 0.9rem 1.25rem 0;
    padding-top: max(0.9rem, env(safe-area-inset-top));
    background: rgba(13,11,8,0.92);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    border-bottom: 0.5px solid rgba(255,255,255,0.06);
  }

  .srch-header-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.35rem;
    font-weight: 300;
    letter-spacing: 0.08em;
    color: var(--cream);
    margin-bottom: 0.75rem;
  }

  .srch-bar {
    position: relative;
    margin-bottom: 0.85rem;
  }

  .srch-icon {
    position: absolute;
    left: 0.9rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--dust);
    pointer-events: none;
    transition: color 0.2s;
  }

  .srch-bar:focus-within .srch-icon { color: var(--gold); }

  .srch-input {
    width: 100%;
    padding: 0.75rem 2.5rem 0.75rem 2.6rem;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 10px;
    color: var(--cream);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    font-weight: 300;
    outline: none;
    transition: border-color 0.2s, background 0.2s;
  }
  .srch-input::placeholder { color: rgba(200,191,175,0.3); }
  .srch-input:focus {
    border-color: rgba(184,149,90,0.45);
    background: rgba(184,149,90,0.04);
  }

  .srch-clear {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    width: 20px; height: 20px;
    border-radius: 50%;
    background: rgba(255,255,255,0.12);
    border: none;
    color: var(--dust);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s;
  }
  .srch-clear.visible { opacity: 1; pointer-events: auto; }
  .srch-clear:hover { background: rgba(255,255,255,0.2); }

  .srch-indicator {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    width: 14px; height: 14px;
    border: 1.5px solid rgba(184,149,90,0.25);
    border-top-color: var(--gold);
    border-radius: 50%;
    animation: srchSpin 0.7s linear infinite;
    display: none;
    margin-top: -7px;
  }
  .srch-indicator.visible { display: block; }
  @keyframes srchSpin { to { transform: rotate(360deg); } }

  .srch-suggestions {
    display: flex;
    gap: 0.5rem;
    overflow-x: auto;
    padding: 0 0 0.85rem;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .srch-suggestions::-webkit-scrollbar { display: none; }

  .srch-chip {
    flex-shrink: 0;
    padding: 4px 12px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.04);
    color: var(--dust);
    font-size: 0.75rem;
    font-weight: 400;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: border-color 0.2s, background 0.2s, color 0.2s;
    white-space: nowrap;
  }
  .srch-chip:hover, .srch-chip.active {
    border-color: rgba(184,149,90,0.4);
    background: rgba(184,149,90,0.08);
    color: var(--gold);
  }

  .srch-body { padding: 0; }

  .srch-section-label {
    padding: 1rem 1.25rem 0.5rem;
    font-size: 0.65rem;
    font-weight: 500;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--dust);
  }

  .srch-user-row {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    padding: 0.7rem 1.25rem;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: background 0.15s;
    animation: rowReveal 0.3s cubic-bezier(0.22,0.68,0,1.2) both;
  }

  @keyframes rowReveal {
    from { opacity: 0; transform: translateX(-8px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  .srch-user-row:hover { background: rgba(255,255,255,0.03); }

  .srch-user-avatar {
    width: 44px; height: 44px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
    border: 1.5px solid rgba(255,255,255,0.09);
  }

  .srch-user-avatar-placeholder {
    width: 44px; height: 44px;
    border-radius: 50%;
    background: rgba(255,255,255,0.05);
    border: 1.5px solid rgba(255,255,255,0.09);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.1rem; font-weight: 300;
    color: var(--gold);
    flex-shrink: 0;
  }

  .srch-user-info { flex: 1; min-width: 0; }

  .srch-user-username {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--cream);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .srch-user-name {
    font-size: 0.75rem;
    color: var(--dust);
    font-weight: 300;
    margin-top: 1px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .srch-user-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 3px;
  }

  .srch-private {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 0.6rem;
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--dust);
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 999px;
    padding: 2px 6px;
  }

  .srch-follow-btn {
    flex-shrink: 0;
    padding: 6px 14px;
    border-radius: 999px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.75rem;
    font-weight: 500;
    letter-spacing: 0.04em;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: opacity 0.2s, transform 0.12s, background 0.2s, border-color 0.2s;
    display: flex; align-items: center; gap: 4px;
  }
  .srch-follow-btn:active { transform: scale(0.93); }

  .srch-follow-btn.follow {
    background: var(--gold);
    border: none;
    color: var(--ink);
  }
  .srch-follow-btn.follow:hover { opacity: 0.85; }

  .srch-follow-btn.following {
    background: transparent;
    border: 1px solid rgba(255,255,255,0.18);
    color: var(--cream);
  }
  .srch-follow-btn.following:hover {
    border-color: rgba(192,57,43,0.5);
    color: #e07070;
    background: rgba(192,57,43,0.07);
  }

  .srch-follow-btn.self {
    background: transparent;
    border: 1px solid rgba(255,255,255,0.08);
    color: var(--dust);
    cursor: default;
    pointer-events: none;
  }

  .srch-divider {
    height: 0.5px;
    background: rgba(255,255,255,0.05);
    margin: 0 1.25rem;
  }

  .srch-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3.5rem 2rem;
    gap: 0.9rem;
    text-align: center;
    animation: fadeUp 0.35s ease both;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .srch-state-icon {
    width: 56px; height: 56px;
    border-radius: 50%;
    border: 1.5px dashed rgba(184,149,90,0.25);
    display: flex; align-items: center; justify-content: center;
    color: rgba(184,149,90,0.4);
  }

  .srch-state-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.3rem;
    font-weight: 300;
    color: var(--cream);
  }

  .srch-state-body {
    font-size: 0.8rem;
    color: var(--dust);
    line-height: 1.7;
    max-width: 240px;
  }

  .srch-match {
    color: var(--gold);
    font-weight: 500;
  }
`;

// ─── useDebounce hook ─────────────────────────────────────────────────────────
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── Highlight matched substring ─────────────────────────────────────────────
function highlightMatch(text, query) {
  if (!query || !text) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="srch-match">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}

const SUGGESTION_CHIPS = ["style", "fashion", "minimal", "vintage", "street"];

// ─── Component ────────────────────────────────────────────────────────────────
export default function Search() {
  const navigate    = useNavigate();
  const { user }    = useAuth();
  const inputRef    = useRef(null);

  const [query,     setQuery]     = useState("");
  const [results,   setResults]   = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched,  setSearched]  = useState(false);
  const [followMap, setFollowMap] = useState({});

  const debouncedQuery = useDebounce(query.trim(), 350);

  // ── Load suggestions on mount ───────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: follows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      const followingIds = (follows ?? []).map(f => f.following_id);
      followingIds.push(user.id);

      // Seed follow map
      const map = {};
      (follows ?? []).forEach(f => { map[f.following_id] = true; });
      setFollowMap(map);

      const exclusion = followingIds.length > 0
        ? followingIds.join(",")
        : user.id;

      const { data } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, is_private")
        .not("id", "in", `(${exclusion})`)
        .limit(8);

      setSuggested(data ?? []);
    })();
  }, [user]);

  // ── Search on debounced query ───────────────────────────────────────────
  useEffect(() => {
    if (!debouncedQuery || !user) {
      setResults([]);
      setSearched(false);
      return;
    }
    (async () => {
      setSearching(true);

      const { data } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, is_private, bio")
        .or(`username.ilike.%${debouncedQuery}%,display_name.ilike.%${debouncedQuery}%`)
        .neq("id", user.id)
        .limit(20);

      if (data && data.length > 0) {
        const ids = data.map(u => u.id);
        const { data: follows } = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", user.id)
          .in("following_id", ids);

        const followSet = new Set((follows ?? []).map(f => f.following_id));
        setFollowMap(prev => {
          const next = { ...prev };
          ids.forEach(id => { next[id] = followSet.has(id); });
          return next;
        });
      }

      setResults(data ?? []);
      setSearching(false);
      setSearched(true);
    })();
  }, [debouncedQuery, user]);

  // ── Follow / unfollow ───────────────────────────────────────────────────
  async function handleFollow(e, targetUser) {
    e.stopPropagation();
    if (!user || targetUser.id === user.id) return;

    const isFollowing = !!followMap[targetUser.id];
    setFollowMap(prev => ({ ...prev, [targetUser.id]: !isFollowing }));

    if (isFollowing) {
      await supabase.from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", targetUser.id);
    } else {
      await supabase.from("follows").insert({
        follower_id:  user.id,
        following_id: targetUser.id,
      });
    }
  }

  // ── User row ────────────────────────────────────────────────────────────
  function UserRow({ u, idx, q }) {
    const isSelf      = u.id === user?.id;
    const isFollowing = !!followMap[u.id];

    return (
      <div>
        <div
          className="srch-user-row"
          onClick={() => navigate(`/profile/${u.username}`)}
          style={{ animationDelay: `${idx * 0.04}s` }}
        >
          {u.avatar_url
            ? <img src={u.avatar_url} alt={u.username} className="srch-user-avatar" />
            : <div className="srch-user-avatar-placeholder">
                {u.username?.[0]?.toUpperCase() ?? "?"}
              </div>
          }

          <div className="srch-user-info">
            <div className="srch-user-username">
              @{q ? highlightMatch(u.username, q) : u.username}
            </div>
            {u.display_name && (
              <div className="srch-user-name">
                {q ? highlightMatch(u.display_name, q) : u.display_name}
              </div>
            )}
            {u.is_private && (
              <div className="srch-user-meta">
                <span className="srch-private">
                  <svg width="8" height="8" viewBox="0 0 16 16" fill="none">
                    <rect x="3" y="7" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
                    <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                  Private
                </span>
              </div>
            )}
          </div>

          {isSelf ? (
            <span className="srch-follow-btn self">You</span>
          ) : (
            <button
              className={`srch-follow-btn ${isFollowing ? "following" : "follow"}`}
              onClick={e => handleFollow(e, u)}
              aria-label={isFollowing ? "Unfollow" : "Follow"}
            >
              {isFollowing ? (
                <>
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                    <path d="M2 8l4 4 8-8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Following
                </>
              ) : (
                <>
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                  Follow
                </>
              )}
            </button>
          )}
        </div>
        <div className="srch-divider" />
      </div>
    );
  }

  const showResults   = debouncedQuery.length > 0;
  const showSuggested = !showResults;

  return (
    <>
      <style>{STYLES}</style>
      <div className="srch-root">

        {/* Header */}
        <div className="srch-header">
          <div className="srch-header-title">Find people</div>

          <div className="srch-bar">
            <svg className="srch-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>

            <input
              ref={inputRef}
              className="srch-input"
              type="search"
              placeholder="Search by username or name…"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              value={query}
              onChange={e => setQuery(e.target.value)}
            />

            <div className={`srch-indicator${searching ? " visible" : ""}`} />

            <button
              className={`srch-clear${query.length > 0 && !searching ? " visible" : ""}`}
              onClick={() => { setQuery(""); inputRef.current?.focus(); }}
              aria-label="Clear"
            >
              <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Quick-filter chips */}
          <div className="srch-suggestions">
            {SUGGESTION_CHIPS.map(s => (
              <button
                key={s}
                className={`srch-chip${query === s ? " active" : ""}`}
                onClick={() => setQuery(q => q === s ? "" : s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="srch-body">

          {/* ── Search results ── */}
          {showResults && (
            <>
              {searching && results.length === 0 && (
                <div style={{ display:"flex", justifyContent:"center", padding:"3rem" }}>
                  <div style={{ width:20, height:20, border:"2px solid rgba(184,149,90,0.2)", borderTopColor:"var(--gold)", borderRadius:"50%", animation:"srchSpin 0.7s linear infinite" }} />
                </div>
              )}

              {!searching && searched && results.length === 0 && (
                <div className="srch-state">
                  <div className="srch-state-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="M21 21l-4.35-4.35"/>
                    </svg>
                  </div>
                  <div className="srch-state-title">No results</div>
                  <div className="srch-state-body">
                    No users found for <strong style={{ color:"var(--cream)" }}>"{debouncedQuery}"</strong>.
                    Try a different username.
                  </div>
                </div>
              )}

              {results.length > 0 && (
                <>
                  <div className="srch-section-label">
                    {results.length} result{results.length !== 1 ? "s" : ""} for "{debouncedQuery}"
                  </div>
                  {results.map((u, i) => (
                    <UserRow key={u.id} u={u} idx={i} q={debouncedQuery} />
                  ))}
                </>
              )}
            </>
          )}

          {/* ── Suggested users ── */}
          {showSuggested && (
            <>
              {suggested.length > 0 ? (
                <>
                  <div className="srch-section-label">Suggested for you</div>
                  {suggested.map((u, i) => (
                    <UserRow key={u.id} u={u} idx={i} q="" />
                  ))}
                </>
              ) : (
                <div className="srch-state">
                  <div className="srch-state-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <div className="srch-state-title">Find your people</div>
                  <div className="srch-state-body">
                    Search for friends by username to see their daily outfits in your feed.
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

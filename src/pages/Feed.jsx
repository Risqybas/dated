import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";

// ─── Styles ───────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .feed-root {
    --ink:    #0d0b08;
    --cream:  #f5f0e8;
    --dust:   #8a8178;
    --gold:   #b8955a;
    --card:   #111009;
    font-family: 'DM Sans', sans-serif;
    min-height: 100svh;
    background: var(--ink);
    color: var(--cream);
    padding-bottom: max(1rem, calc(env(safe-area-inset-bottom) + 80px));
  }

  /* ── Header ── */
  .feed-header {
    position: sticky;
    top: 0; z-index: 30;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.9rem 1.25rem;
    padding-top: max(0.9rem, env(safe-area-inset-top));
    background: rgba(13,11,8,0.9);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    border-bottom: 0.5px solid rgba(255,255,255,0.06);
  }

  .feed-wordmark {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.4rem;
    font-weight: 300;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--cream);
  }

  .feed-header-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .feed-icon-btn {
    width: 34px; height: 34px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.1);
    background: transparent;
    color: var(--cream);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: background 0.2s;
  }
  .feed-icon-btn:hover { background: rgba(255,255,255,0.07); }

  /* live dot */
  .feed-live-dot {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 0.65rem;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--dust);
    opacity: 0;
    transition: opacity 0.4s;
  }
  .feed-live-dot.visible { opacity: 1; }
  .feed-live-dot-ring {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: #4a7c6b;
    box-shadow: 0 0 0 0 rgba(74,124,107,0.5);
    animation: livePulse 2s ease-in-out infinite;
  }
  @keyframes livePulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(74,124,107,0.4); }
    50%       { box-shadow: 0 0 0 5px rgba(74,124,107,0); }
  }

  /* ── Date divider ── */
  .feed-date-divider {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1.2rem 1.25rem 0.6rem;
  }
  .feed-date-divider-line {
    flex: 1;
    height: 0.5px;
    background: rgba(255,255,255,0.07);
  }
  .feed-date-label {
    font-size: 0.65rem;
    font-weight: 500;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--dust);
    white-space: nowrap;
  }

  /* ── Card ── */
  .feed-card {
    background: var(--card);
    margin: 0 0 2px;
    animation: cardReveal 0.5s cubic-bezier(0.22,0.68,0,1.2) both;
  }

  @keyframes cardReveal {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* card header */
  .feed-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.85rem 1rem 0.6rem;
  }

  .feed-card-owner {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  .feed-avatar {
    width: 34px; height: 34px;
    border-radius: 50%;
    object-fit: cover;
    border: 1.5px solid rgba(255,255,255,0.1);
    flex-shrink: 0;
  }

  .feed-avatar-placeholder {
    width: 34px; height: 34px;
    border-radius: 50%;
    background: rgba(255,255,255,0.06);
    border: 1.5px solid rgba(255,255,255,0.1);
    display: flex; align-items: center; justify-content: center;
    font-size: 0.8rem; font-weight: 500; color: var(--dust);
    flex-shrink: 0;
  }

  .feed-owner-username {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--cream);
    line-height: 1;
  }

  .feed-owner-time {
    font-size: 0.7rem;
    color: var(--dust);
    font-weight: 300;
    margin-top: 2px;
  }

  .feed-card-more {
    width: 30px; height: 30px;
    border-radius: 50%;
    border: none;
    background: transparent;
    color: var(--dust);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  /* photo */
  .feed-card-photo {
    position: relative;
    width: 100%;
    aspect-ratio: 4/5;
    overflow: hidden;
    background: #0a0908;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  .feed-card-img {
    width: 100%; height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.6s cubic-bezier(0.22,0.68,0,1);
  }

  .feed-card-photo:active .feed-card-img {
    transform: scale(1.02);
  }

  /* double-tap heart */
  .feed-heart-burst {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%) scale(0);
    pointer-events: none;
    z-index: 10;
    color: #fff;
    opacity: 0;
  }
  .feed-heart-burst.burst {
    animation: heartBurst 0.55s cubic-bezier(0.22,0.68,0,1.4) forwards;
  }
  @keyframes heartBurst {
    0%   { transform: translate(-50%,-50%) scale(0); opacity: 1; }
    60%  { transform: translate(-50%,-50%) scale(1.4); opacity: 1; }
    100% { transform: translate(-50%,-50%) scale(1.1); opacity: 0; }
  }

  /* ── Action bar ── */
  .feed-card-actions {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.65rem 0.85rem 0.5rem;
  }

  .feed-action-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    background: none;
    border: none;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    color: var(--dust);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.8rem;
    font-weight: 400;
    padding: 5px 8px;
    border-radius: 6px;
    transition: color 0.15s, background 0.15s, transform 0.12s;
  }
  .feed-action-btn:active { transform: scale(0.9); }
  .feed-action-btn:hover { background: rgba(255,255,255,0.04); color: var(--cream); }
  .feed-action-btn.liked { color: #e07070; }
  .feed-action-btn.liked svg { fill: #e07070; }

  @keyframes heartPop {
    0%   { transform: scale(1); }
    35%  { transform: scale(1.4); }
    65%  { transform: scale(0.88); }
    100% { transform: scale(1); }
  }
  .feed-action-btn.just-liked svg {
    animation: heartPop 0.38s ease both;
  }

  .feed-action-spacer { flex: 1; }

  /* emoji reaction strip */
  .feed-emoji-strip {
    display: flex;
    gap: 2px;
    padding: 0 0.85rem 0;
    flex-wrap: wrap;
    row-gap: 4px;
  }

  .feed-emoji-btn {
    display: flex;
    align-items: center;
    gap: 3px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 999px;
    padding: 3px 8px;
    font-size: 0.82rem;
    color: var(--dust);
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: background 0.15s, border-color 0.15s, transform 0.12s;
    line-height: 1.4;
  }
  .feed-emoji-btn:active { transform: scale(0.88); }
  .feed-emoji-btn:hover {
    background: rgba(255,255,255,0.08);
    border-color: rgba(255,255,255,0.16);
  }
  .feed-emoji-btn.reacted {
    background: rgba(184,149,90,0.12);
    border-color: rgba(184,149,90,0.3);
    color: var(--gold);
  }
  .feed-emoji-count {
    font-size: 0.7rem;
    font-weight: 500;
  }

  /* ── Caption ── */
  .feed-card-caption {
    padding: 0.5rem 1rem 0;
  }

  .feed-caption-username {
    font-size: 0.82rem;
    font-weight: 500;
    color: var(--cream);
    margin-right: 0.4rem;
  }

  .feed-caption-text {
    font-size: 0.82rem;
    color: rgba(245,240,232,0.7);
    font-weight: 300;
    line-height: 1.5;
    font-family: 'Cormorant Garamond', serif;
    font-style: italic;
  }

  /* comment count */
  .feed-card-comment-count {
    padding: 0.35rem 1rem 0.85rem;
    font-size: 0.75rem;
    color: var(--dust);
    font-weight: 300;
    cursor: pointer;
  }
  .feed-card-comment-count:hover { color: var(--cream); }

  /* ── Empty state ── */
  .feed-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60svh;
    gap: 1rem;
    padding: 2rem;
    text-align: center;
  }

  .feed-empty-icon {
    width: 68px; height: 68px;
    border-radius: 50%;
    border: 1.5px dashed rgba(184,149,90,0.3);
    display: flex; align-items: center; justify-content: center;
  }

  .feed-empty-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.5rem;
    font-weight: 300;
    color: var(--cream);
  }

  .feed-empty-body {
    font-size: 0.82rem;
    color: var(--dust);
    line-height: 1.7;
    max-width: 260px;
  }

  .feed-empty-cta {
    padding: 0.7rem 1.5rem;
    background: var(--gold);
    border: none;
    border-radius: 8px;
    color: var(--ink);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.82rem;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.2s;
  }
  .feed-empty-cta:hover { opacity: 0.85; }

  /* ── Loading ── */
  .feed-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 50svh;
    gap: 1rem;
  }
  .feed-spinner {
    width: 26px; height: 26px;
    border: 2px solid rgba(184,149,90,0.2);
    border-top-color: var(--gold);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .feed-loading-text {
    font-size: 0.8rem;
    color: var(--dust);
    font-weight: 300;
  }

  /* ── New post toast ── */
  .feed-new-toast {
    position: fixed;
    top: max(4.5rem, calc(env(safe-area-inset-top) + 3.5rem));
    left: 50%;
    transform: translateX(-50%) translateY(-10px);
    z-index: 50;
    background: rgba(74,124,107,0.92);
    backdrop-filter: blur(8px);
    border-radius: 999px;
    padding: 0.5rem 1.1rem;
    font-size: 0.78rem;
    font-weight: 500;
    color: #fff;
    cursor: pointer;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.25s, transform 0.25s;
    white-space: nowrap;
  }
  .feed-new-toast.visible {
    opacity: 1;
    pointer-events: auto;
    transform: translateX(-50%) translateY(0);
  }

  /* ── Own outfit include toggle ── */
  .feed-own-row {
    padding: 0.6rem 1.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-size: 0.72rem;
    color: var(--dust);
    border-bottom: 0.5px solid rgba(255,255,255,0.06);
  }

  .feed-toggle {
    width: 34px; height: 18px;
    border-radius: 999px;
    background: rgba(255,255,255,0.1);
    border: none;
    cursor: pointer;
    position: relative;
    -webkit-tap-highlight-color: transparent;
    transition: background 0.2s;
  }
  .feed-toggle.on { background: var(--gold); }
  .feed-toggle-thumb {
    position: absolute;
    top: 2px; left: 2px;
    width: 14px; height: 14px;
    border-radius: 50%;
    background: white;
    transition: transform 0.2s;
  }
  .feed-toggle.on .feed-toggle-thumb { transform: translateX(16px); }
`;

// ─── Constants ────────────────────────────────────────────────────────────────
const EMOJIS = ["🔥", "✨", "💅", "😍", "👏"];
const PAGE_SIZE = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function relativeTime(dateStr) {
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)    return "just now";
  if (mins < 60)   return `${mins}m`;
  if (hours < 24)  return `${hours}h`;
  if (days < 7)    return `${days}d`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function groupByDay(outfits) {
  const groups = {};
  outfits.forEach(o => {
    const day = o.capture_date || o.created_at?.split("T")[0] || "Unknown";
    if (!groups[day]) groups[day] = [];
    groups[day].push(o);
  });
  return groups;
}

function dayLabel(dateStr) {
  const today     = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const d         = new Date(dateStr + "T12:00:00");
  if (d.toDateString() === today.toDateString())     return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

// ─── FeedCard ─────────────────────────────────────────────────────────────────
function FeedCard({ outfit, currentUserId, onNavigate, idx }) {
  const [liked,      setLiked]     = useState(outfit._liked    ?? false);
  const [likeCount,  setLikeCount] = useState(outfit._likes    ?? 0);
  const [justLiked,  setJustLiked] = useState(false);
  const [myReaction, setMyReaction]= useState(outfit._reaction ?? null);
  const [reactions,  setReactions] = useState(outfit._reactions ?? {});
  const [burst,      setBurst]     = useState(false);

  const tapRef = useRef(null);
  const lastTap = useRef(0);

  // Double-tap to like
  function handlePhotoTap() {
    const now = Date.now();
    if (now - lastTap.current < 350) {
      clearTimeout(tapRef.current);
      if (!liked) triggerLike();
      setBurst(true);
      setTimeout(() => setBurst(false), 600);
    } else {
      tapRef.current = setTimeout(() => {
        onNavigate(`/outfit/${outfit.id}`);
      }, 360);
    }
    lastTap.current = now;
  }

  async function triggerLike() {
    if (liked) {
      setLiked(false); setLikeCount(c => c - 1);
      await supabase.from("likes").delete()
        .eq("outfit_id", outfit.id).eq("user_id", currentUserId);
    } else {
      setLiked(true); setJustLiked(true); setLikeCount(c => c + 1);
      await supabase.from("likes").insert({ outfit_id: outfit.id, user_id: currentUserId });
      setTimeout(() => setJustLiked(false), 450);
    }
  }

  async function handleReaction(emoji) {
    const isRemoving = myReaction === emoji;
    const prev = myReaction;

    // Optimistic
    setMyReaction(isRemoving ? null : emoji);
    setReactions(r => {
      const next = { ...r };
      if (prev)              next[prev]  = Math.max(0, (next[prev]  ?? 1) - 1);
      if (!isRemoving)       next[emoji] = (next[emoji] ?? 0) + 1;
      return next;
    });

    if (isRemoving) {
      await supabase.from("reactions").delete()
        .eq("outfit_id", outfit.id).eq("user_id", currentUserId);
    } else {
      // Delete any existing reaction first, then insert new one
      await supabase.from("reactions").delete()
        .eq("outfit_id", outfit.id).eq("user_id", currentUserId);
      await supabase.from("reactions").insert({
        outfit_id: outfit.id,
        user_id:   currentUserId,
        emoji,
      });
    }
  }

  const owner = outfit.profiles;

  return (
    <div
      className="feed-card"
      style={{ animationDelay: `${Math.min(idx, 5) * 0.07}s` }}
    >
      {/* Card header */}
      <div className="feed-card-header">
        <div
          className="feed-card-owner"
          onClick={() => owner?.username && onNavigate(`/profile/${owner.username}`)}
        >
          {owner?.avatar_url
            ? <img src={owner.avatar_url} alt={owner.username} className="feed-avatar" />
            : <div className="feed-avatar-placeholder">
                {owner?.username?.[0]?.toUpperCase() ?? "?"}
              </div>
          }
          <div>
            <div className="feed-owner-username">@{owner?.username ?? "unknown"}</div>
            <div className="feed-owner-time">{relativeTime(outfit.created_at)}</div>
          </div>
        </div>
        <button className="feed-card-more" aria-label="More options">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="3" r="1.2" fill="currentColor"/>
            <circle cx="8" cy="8" r="1.2" fill="currentColor"/>
            <circle cx="8" cy="13" r="1.2" fill="currentColor"/>
          </svg>
        </button>
      </div>

      {/* Photo */}
      <div className="feed-card-photo" onClick={handlePhotoTap}>
        <img
          src={outfit.processed_image_url || outfit.image_url}
          alt={outfit.caption || "Outfit"}
          className="feed-card-img"
          loading="lazy"
        />
        <div className={`feed-heart-burst${burst ? " burst" : ""}`}>
          <svg width="72" height="72" viewBox="0 0 24 24" fill="white">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </div>
      </div>

      {/* Actions */}
      <div className="feed-card-actions">
        <button
          className={`feed-action-btn${liked ? " liked" : ""}${justLiked ? " just-liked" : ""}`}
          onClick={triggerLike}
          aria-label={liked ? "Unlike" : "Like"}
        >
          <svg width="18" height="18" viewBox="0 0 24 24"
            fill={liked ? "currentColor" : "none"}
            stroke="currentColor" strokeWidth="1.6"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>

        <button
          className="feed-action-btn"
          onClick={() => onNavigate(`/outfit/${outfit.id}`)}
          aria-label="Comment"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          {outfit._commentCount > 0 && <span>{outfit._commentCount}</span>}
        </button>

        <div className="feed-action-spacer" />

        {/* Wear badge */}
        {(outfit.times_worn ?? 0) > 1 && (
          <div style={{
            fontSize: "0.68rem", color: "var(--gold)",
            display: "flex", alignItems: "center", gap: 4,
            padding: "3px 8px",
            background: "rgba(184,149,90,0.08)",
            borderRadius: 999,
            border: "1px solid rgba(184,149,90,0.2)"
          }}>
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
              <path d="M8 1L10 5.5H15L11 8.5L12.5 13L8 10.5L3.5 13L5 8.5L1 5.5H6L8 1Z"
                stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
            </svg>
            {outfit.times_worn}×
          </div>
        )}
      </div>

      {/* Emoji reactions */}
      <div className="feed-emoji-strip">
        {EMOJIS.map(emoji => {
          const count   = reactions[emoji] ?? 0;
          const reacted = myReaction === emoji;
          return (
            <button
              key={emoji}
              className={`feed-emoji-btn${reacted ? " reacted" : ""}`}
              onClick={() => handleReaction(emoji)}
              aria-label={`React with ${emoji}`}
            >
              {emoji}
              {count > 0 && <span className="feed-emoji-count">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Caption */}
      {outfit.caption && (
        <div className="feed-card-caption">
          <span className="feed-caption-username">@{owner?.username}</span>
          <span className="feed-caption-text">{outfit.caption}</span>
        </div>
      )}

      {/* Comment count */}
      {outfit._commentCount > 0 && (
        <div
          className="feed-card-comment-count"
          onClick={() => onNavigate(`/outfit/${outfit.id}`)}
        >
          View all {outfit._commentCount} comments
        </div>
      )}
    </div>
  );
}

// ─── Main Feed component ──────────────────────────────────────────────────────
export default function Feed() {
  const navigate           = useNavigate();
  const { user }           = useAuth();

  const [outfits,      setOutfits]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [loadingMore,  setLoadingMore]  = useState(false);
  const [hasMore,      setHasMore]      = useState(true);
  const [showOwn,      setShowOwn]      = useState(true);
  const [newCount,     setNewCount]     = useState(0);
  const [liveReady,    setLiveReady]    = useState(false);
  const offsetRef = useRef(0);
  const channelRef = useRef(null);

  const showOwnRef    = useRef(showOwn);
  const hasMoreRef    = useRef(true);
  const loadingMoreRef = useRef(false);

  // Keep refs in sync with state
  useEffect(() => { showOwnRef.current = showOwn; }, [showOwn]);
  useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);
  useEffect(() => { loadingMoreRef.current = loadingMore; }, [loadingMore]);

  // ── Fetch a page of feed outfits ──────────────────────────────────────
  const fetchFeed = useRef(null);
  fetchFeed.current = async (reset = false) => {
    if (!user) return;
    reset ? setLoading(true) : setLoadingMore(true);

    const offset = reset ? 0 : offsetRef.current;

    // Step 1: get IDs of people I follow
    const { data: follows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);

    const followingIds = (follows ?? []).map(f => f.following_id);
    if (showOwnRef.current) followingIds.push(user.id);

    if (followingIds.length === 0) {
      setOutfits([]);
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    // Step 2: fetch outfits (no join — fetch profiles separately)
    const { data: outfitData } = await supabase
      .from("outfits")
      .select(`
        id, raw_image_url, processed_image_url, caption,
        capture_date, created_at, wear_count, user_id
      `)
      .in("user_id", followingIds)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (!outfitData || outfitData.length === 0) {
      if (reset) setOutfits([]);
      setHasMore(false);
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    const ids = outfitData.map(o => o.id);

    // Fetch profiles for all outfit owners
    const ownerIds = [...new Set(outfitData.map(o => o.user_id))];
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .in("id", ownerIds);
    const profileMap = {};
    (profilesData ?? []).forEach(p => { profileMap[p.id] = p; });

    // Step 3: like counts + did I like each
    const [{ data: likesData }, { data: myLikes },
           { data: commentsData }, { data: reactionsData }, { data: myReactions }] =
      await Promise.all([
        supabase.from("likes").select("outfit_id").in("outfit_id", ids),
        supabase.from("likes").select("outfit_id").in("outfit_id", ids).eq("user_id", user.id),
        supabase.from("comments").select("outfit_id").in("outfit_id", ids),
        supabase.from("reactions").select("outfit_id, emoji").in("outfit_id", ids),
        supabase.from("reactions").select("outfit_id, emoji").in("outfit_id", ids).eq("user_id", user.id),
      ]);

    const likeMap     = {};
    const myLikeSet   = new Set((myLikes    ?? []).map(l => l.outfit_id));
    const commentMap  = {};
    const reactionMap = {};
    const myReactMap  = {};

    (likesData ?? []).forEach(l => { likeMap[l.outfit_id] = (likeMap[l.outfit_id] ?? 0) + 1; });
    (commentsData ?? []).forEach(c => { commentMap[c.outfit_id] = (commentMap[c.outfit_id] ?? 0) + 1; });
    (reactionsData ?? []).forEach(r => {
      if (!reactionMap[r.outfit_id]) reactionMap[r.outfit_id] = {};
      reactionMap[r.outfit_id][r.emoji] = (reactionMap[r.outfit_id][r.emoji] ?? 0) + 1;
    });
    (myReactions ?? []).forEach(r => { myReactMap[r.outfit_id] = r.emoji; });

    const enriched = outfitData.map(o => ({
      ...o,
      image_url:     o.raw_image_url,   // alias for FeedCard compatibility
      times_worn:    o.wear_count,
      profiles:      profileMap[o.user_id] ?? null,
      _likes:        likeMap[o.id]     ?? 0,
      _liked:        myLikeSet.has(o.id),
      _commentCount: commentMap[o.id]  ?? 0,
      _reactions:    reactionMap[o.id] ?? {},
      _reaction:     myReactMap[o.id]  ?? null,
    }));

    if (reset) {
      setOutfits(enriched);
    } else {
      setOutfits(prev => [...prev, ...enriched]);
    }

    offsetRef.current = offset + outfitData.length;
    setHasMore(outfitData.length === PAGE_SIZE);
    setLoading(false);
    setLoadingMore(false);
  };

  useEffect(() => {
    offsetRef.current = 0;
    setHasMore(true);
    fetchFeed.current(true);
  }, [user, showOwn]); // re-fetch when user or showOwn changes

  // ── Real-time subscription ────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("feed-outfits")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "outfits",
      }, payload => {
        // Only notify if it's from someone I might follow
        if (payload.new.user_id !== user.id) {
          setNewCount(c => c + 1);
        }
      })
      .subscribe(status => {
        if (status === "SUBSCRIBED") setLiveReady(true);
      });

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // ── Load more on scroll ───────────────────────────────────────────────
  useEffect(() => {
    function handleScroll() {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      if (scrollHeight - scrollTop - clientHeight < 300 && hasMoreRef.current && !loadingMoreRef.current) {
        fetchFeed.current(false);
      }
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []); // no deps — uses refs internally

  function handleRefresh() {
    offsetRef.current = 0;
    setHasMore(true);
    setNewCount(0);
    fetchFeed.current(true);
  }

  const grouped = groupByDay(outfits);
  const sortedDays = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <>
      <style>{STYLES}</style>
      <div className="feed-root">

        {/* ── Header ── */}
        <div className="feed-header">
          <div className="feed-wordmark">Dated</div>
          <div className="feed-header-right">
            <div className={`feed-live-dot${liveReady ? " visible" : ""}`}>
              <div className="feed-live-dot-ring" />
              Live
            </div>
            <button className="feed-icon-btn" onClick={handleRefresh} aria-label="Refresh feed">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M1 4v6h6"/>
                <path d="M3.51 15a9 9 0 1 0 .49-4"/>
              </svg>
            </button>
            <button
              className="feed-icon-btn"
              onClick={() => navigate("/search")}
              aria-label="Find friends"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── Show own toggle ── */}
        <div className="feed-own-row">
          <span>Include my outfits</span>
          <button
            className={`feed-toggle${showOwn ? " on" : ""}`}
            onClick={() => setShowOwn(v => !v)}
            aria-label="Toggle own outfits"
          >
            <div className="feed-toggle-thumb" />
          </button>
        </div>

        {/* ── New posts toast ── */}
        <div
          className={`feed-new-toast${newCount > 0 ? " visible" : ""}`}
          onClick={handleRefresh}
        >
          ↑ {newCount} new outfit{newCount > 1 ? "s" : ""}
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="feed-loading">
            <div className="feed-spinner" />
            <div className="feed-loading-text">Loading your feed…</div>
          </div>
        ) : outfits.length === 0 ? (
          <div className="feed-empty">
            <div className="feed-empty-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(184,149,90,0.5)" strokeWidth="1.4" strokeLinecap="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div className="feed-empty-title">No outfits yet</div>
            <div className="feed-empty-body">
              Follow some friends to see their daily outfits here, or capture your own to get started.
            </div>
            <button className="feed-empty-cta" onClick={() => navigate("/search")}>
              Find friends
            </button>
          </div>
        ) : (
          <>
            {sortedDays.map(day => (
              <div key={day}>
                <div className="feed-date-divider">
                  <div className="feed-date-divider-line" />
                  <div className="feed-date-label">{dayLabel(day)}</div>
                  <div className="feed-date-divider-line" />
                </div>
                {grouped[day].map((outfit, i) => (
                  <FeedCard
                    key={`${outfit.id}-${i}`}
                    outfit={outfit}
                    currentUserId={user.id}
                    onNavigate={navigate}
                    idx={i}
                  />
                ))}
              </div>
            ))}

            {/* Load more / end */}
            {loadingMore && (
              <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
                <div className="feed-spinner" />
              </div>
            )}
            {!hasMore && outfits.length > 0 && (
              <div style={{ textAlign: "center", padding: "2rem 1rem", fontSize: "0.75rem", color: "var(--dust)", fontStyle: "italic", letterSpacing: "0.08em" }}>
                You're all caught up ✦
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useRemoveBg } from "../hooks/useRemoveBg";
import { supabase } from "../lib/supabase";

// ─── Styles ───────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .od-root {
    --ink:   #0d0b08;
    --cream: #f5f0e8;
    --dust:  #8a8178;
    --gold:  #b8955a;
    --red:   #c0392b;
    font-family: 'DM Sans', sans-serif;
    min-height: 100svh;
    background: var(--ink);
    color: var(--cream);
    padding-bottom: max(1rem, calc(env(safe-area-inset-bottom) + 80px));
  }

  /* ── Hero image ── */
  .od-hero {
    position: relative;
    width: 100%;
    aspect-ratio: 3/4;
    max-height: 72svh;
    overflow: visible;
    background: #111;
  }

  .od-hero-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    animation: imgReveal 0.6s cubic-bezier(0.22,0.68,0,1) both;
  }

  @keyframes imgReveal {
    from { opacity: 0; transform: scale(1.04); }
    to   { opacity: 1; transform: scale(1); }
  }

  /* gradient fade bottom of hero */
  .od-hero-fade {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 45%;
    background: linear-gradient(to top, rgba(13,11,8,1) 0%, transparent 100%);
    pointer-events: none;
  }

  /* back button */
  .od-back {
    position: absolute;
    top: max(1rem, env(safe-area-inset-top));
    left: 1rem;
    z-index: 10;
    width: 38px; height: 38px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.18);
    background: rgba(13,11,8,0.55);
    backdrop-filter: blur(8px);
    color: var(--cream);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: background 0.2s;
  }
  .od-back:hover { background: rgba(255,255,255,0.12); }

  /* date chip */
  .od-date-chip {
    position: absolute;
    bottom: 1.2rem; left: 1.2rem;
    font-family: 'Cormorant Garamond', serif;
    font-size: 0.85rem;
    font-weight: 300;
    letter-spacing: 0.12em;
    color: rgba(245,240,232,0.6);
    z-index: 2;
  }

  /* ── Content ── */
  .od-content {
    padding: 1.25rem 1.25rem 0;
    animation: fadeUp 0.45s 0.15s cubic-bezier(0.22,0.68,0,1.2) both;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Owner row ── */
  .od-owner-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  .od-owner {
    display: flex;
    align-items: center;
    gap: 0.65rem;
  }

  .od-avatar {
    width: 36px; height: 36px;
    border-radius: 50%;
    object-fit: cover;
    border: 1.5px solid rgba(255,255,255,0.1);
  }

  .od-avatar-placeholder {
    width: 36px; height: 36px;
    border-radius: 50%;
    background: rgba(255,255,255,0.07);
    border: 1.5px solid rgba(255,255,255,0.1);
    display: flex; align-items: center; justify-content: center;
    font-size: 0.85rem; font-weight: 500; color: var(--dust);
  }

  .od-username {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--cream);
  }

  .od-display-name {
    font-size: 0.72rem;
    color: var(--dust);
    font-weight: 300;
    margin-top: 1px;
  }

  /* wear badge */
  .od-wear-badge {
    display: flex;
    align-items: center;
    gap: 5px;
    background: rgba(184,149,90,0.12);
    border: 1px solid rgba(184,149,90,0.25);
    border-radius: 999px;
    padding: 4px 10px;
    font-size: 0.72rem;
    font-weight: 500;
    letter-spacing: 0.05em;
    color: var(--gold);
  }

  /* ── Caption ── */
  .od-caption {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.2rem;
    font-weight: 300;
    line-height: 1.5;
    color: var(--cream);
    margin-bottom: 1.2rem;
    font-style: italic;
  }

  /* ── Tags ── */
  .od-tags-section {
    margin-bottom: 1.2rem;
  }

  .od-tags-label {
    font-size: 0.65rem;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--dust);
    margin-bottom: 0.6rem;
  }

  .od-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .od-tag {
    font-size: 0.75rem;
    font-weight: 400;
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.04);
    color: var(--dust);
    letter-spacing: 0.04em;
    animation: tagPop 0.3s cubic-bezier(0.22,0.68,0,1.4) both;
  }

  @keyframes tagPop {
    from { opacity: 0; transform: scale(0.85); }
    to   { opacity: 1; transform: scale(1); }
  }

  .od-tag.ai {
    border-color: rgba(184,149,90,0.2);
    background: rgba(184,149,90,0.07);
    color: var(--gold);
  }

  /* ── Divider ── */
  .od-divider {
    height: 1px;
    background: rgba(255,255,255,0.07);
    margin: 1.2rem 0;
  }

  /* ── Action bar ── */
  .od-actions {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    margin-bottom: 1.2rem;
  }

  .od-action-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: none;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    color: var(--dust);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.85rem;
    font-weight: 400;
    padding: 4px 0;
    transition: color 0.2s, transform 0.15s;
  }

  .od-action-btn:hover { color: var(--cream); }
  .od-action-btn:active { transform: scale(0.93); }

  .od-action-btn.liked {
    color: #e07070;
  }

  .od-action-btn.liked svg {
    fill: #e07070;
  }

  /* heart beat on like */
  @keyframes heartBeat {
    0%   { transform: scale(1); }
    35%  { transform: scale(1.35); }
    65%  { transform: scale(0.9); }
    100% { transform: scale(1); }
  }
  .od-action-btn.just-liked svg {
    animation: heartBeat 0.4s ease both;
  }

  /* ── Comments ── */
  .od-comments-section {
    margin-top: 0.5rem;
  }

  .od-comments-title {
    font-size: 0.65rem;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--dust);
    margin-bottom: 0.9rem;
  }

  .od-comment {
    display: flex;
    gap: 0.65rem;
    margin-bottom: 0.9rem;
    animation: fadeUp 0.25s ease both;
  }

  .od-comment-avatar {
    width: 28px; height: 28px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
    border: 1px solid rgba(255,255,255,0.08);
  }

  .od-comment-avatar-placeholder {
    width: 28px; height: 28px;
    border-radius: 50%;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.08);
    display: flex; align-items: center; justify-content: center;
    font-size: 0.7rem; color: var(--dust);
    flex-shrink: 0;
  }

  .od-comment-body {}

  .od-comment-user {
    font-size: 0.78rem;
    font-weight: 500;
    color: var(--cream);
    margin-bottom: 2px;
  }

  .od-comment-text {
    font-size: 0.82rem;
    color: rgba(245,240,232,0.75);
    line-height: 1.5;
    font-weight: 300;
  }

  .od-comment-time {
    font-size: 0.65rem;
    color: var(--dust);
    margin-top: 3px;
    font-weight: 300;
  }

  .od-no-comments {
    font-size: 0.82rem;
    color: var(--dust);
    font-weight: 300;
    font-style: italic;
    padding: 0.5rem 0;
  }

  /* ── Comment input ── */
  .od-comment-input-row {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(255,255,255,0.07);
  }

  .od-comment-input {
    flex: 1;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 999px;
    padding: 0.6rem 1rem;
    color: var(--cream);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.85rem;
    font-weight: 300;
    outline: none;
    transition: border-color 0.2s;
  }
  .od-comment-input::placeholder { color: rgba(200,191,175,0.3); }
  .od-comment-input:focus { border-color: var(--gold); }

  .od-comment-send {
    width: 36px; height: 36px;
    border-radius: 50%;
    border: none;
    background: var(--gold);
    color: var(--ink);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
    -webkit-tap-highlight-color: transparent;
    transition: opacity 0.2s, transform 0.15s;
  }
  .od-comment-send:hover:not(:disabled) { opacity: 0.85; }
  .od-comment-send:active:not(:disabled) { transform: scale(0.92); }
  .od-comment-send:disabled { opacity: 0.35; cursor: not-allowed; }

  /* ── Loading / error ── */
  .od-loading {
    min-height: 100svh;
    display: flex; align-items: center; justify-content: center;
    flex-direction: column; gap: 1rem;
    color: var(--dust);
  }

  .od-spinner {
    width: 28px; height: 28px;
    border: 2px solid rgba(184,149,90,0.2);
    border-top-color: var(--gold);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes od-spin { to { transform: rotate(360deg); } }

  /* ── Options menu ── */
  .od-menu-btn {
    position: absolute;
    top: max(1rem, env(safe-area-inset-top));
    right: 1rem;
    z-index: 20;
    width: 38px; height: 38px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.18);
    background: rgba(13,11,8,0.55);
    backdrop-filter: blur(8px);
    color: var(--cream);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; -webkit-tap-highlight-color: transparent;
    transition: background 0.2s;
  }
  .od-menu-btn:hover { background: rgba(255,255,255,0.12); }

  .od-menu-overlay {
    position: fixed; inset: 0; z-index: 50;
  }

  .od-menu-dropdown {
    position: fixed;
    top: max(4.5rem, calc(env(safe-area-inset-top) + 3.5rem));
    right: 1rem;
    z-index: 51;
    background: #1a1815;
    border: 0.5px solid rgba(255,255,255,0.12);
    border-radius: 10px;
    overflow: hidden;
    min-width: 160px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    animation: fadeUp 0.15s ease both;
  }

  .od-menu-item {
    display: flex; align-items: center; gap: 10px;
    padding: 0.85rem 1rem;
    background: none; border: none;
    width: 100%; text-align: left;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.875rem; font-weight: 400;
    cursor: pointer; -webkit-tap-highlight-color: transparent;
    transition: background 0.15s;
  }
  .od-menu-item:hover { background: rgba(255,255,255,0.05); }
  .od-menu-item.danger { color: #e07070; }
  .od-menu-item.normal { color: var(--cream); }
  .od-menu-item:disabled { opacity: 0.5; cursor: not-allowed; }

  .od-error-box {
    min-height: 100svh;
    display: flex; align-items: center; justify-content: center;
    flex-direction: column; gap: 1rem; padding: 2rem; text-align: center;
  }

  .od-error-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.5rem; font-weight: 300; color: var(--cream);
  }

  .od-error-body {
    font-size: 0.85rem; color: var(--dust); line-height: 1.6;
  }

  .od-error-btn {
    padding: 0.7rem 1.5rem;
    background: transparent; border: 1px solid rgba(255,255,255,0.15);
    border-radius: 8px; color: var(--cream);
    font-family: 'DM Sans', sans-serif; font-size: 0.85rem; cursor: pointer;
    transition: border-color 0.2s;
  }
  .od-error-btn:hover { border-color: rgba(255,255,255,0.35); }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatCaptureDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function OutfitDetail() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const { user, profile } = useAuth();

  // ── ALL hooks must be declared here before any return ─────────────────────
  const { removeBg, loading: bgLoading } = useRemoveBg();

  const [outfit,        setOutfit]        = useState(null);
  const [owner,         setOwner]         = useState(null);
  const [tags,          setTags]          = useState([]);
  const [likes,         setLikes]         = useState(0);
  const [liked,         setLiked]         = useState(false);
  const [justLiked,     setJustLiked]     = useState(false);
  const [comments,      setComments]      = useState([]);
  const [newComment,    setNewComment]    = useState("");
  const [sendingComment,setSendingComment]= useState(false);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [showMenu,      setShowMenu]      = useState(false);
  const [deleting,      setDeleting]      = useState(false);

  // ── Fetch everything ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!id || !user) return;

    (async () => {
      setLoading(true);

      // 1. Outfit row
      const { data: outfitData, error: outfitErr } = await supabase
        .from("outfits")
        .select("*")
        .eq("id", id)
        .single();

      if (outfitErr || !outfitData) {
        setError("Outfit not found.");
        setLoading(false);
        return;
      }
      setOutfit(outfitData);

      // 2. Owner profile
      const { data: ownerData } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .eq("id", outfitData.user_id)
        .single();
      setOwner(ownerData);

      // 3. AI tags
      const { data: tagData } = await supabase
        .from("outfit_tags")
        .select("tag_value, tag_type, confidence")
        .eq("outfit_id", id)
        .order("confidence", { ascending: false });
      setTags(tagData || []);

      // 4. Like count + did current user like it
      const { count: likeCount } = await supabase
        .from("likes")
        .select("id", { count: "exact", head: true })
        .eq("outfit_id", id);
      setLikes(likeCount ?? 0);

      const { data: myLike } = await supabase
        .from("likes")
        .select("id")
        .eq("outfit_id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      setLiked(!!myLike);

      // 5. Comments — fetch separately then join profiles
      const { data: commentData } = await supabase
        .from("comments")
        .select("id, body, created_at, user_id")
        .eq("outfit_id", id)
        .order("created_at", { ascending: true });

      if (commentData && commentData.length > 0) {
        const commenterIds = [...new Set(commentData.map(c => c.user_id))];
        const { data: commentProfiles } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", commenterIds);
        const cpMap = {};
        (commentProfiles ?? []).forEach(p => { cpMap[p.id] = p; });
        setComments(commentData.map(c => ({ ...c, profiles: cpMap[c.user_id] ?? null })));
      } else {
        setComments([]);
      }

      setLoading(false);
    })();
  }, [id, user]);

  // ── Toggle like ────────────────────────────────────────────────────────
  async function handleLike() {
    if (!user) return;

    if (liked) {
      setLiked(false);
      setLikes(l => l - 1);
      await supabase.from("likes").delete()
        .eq("outfit_id", id).eq("user_id", user.id);
    } else {
      setLiked(true);
      setJustLiked(true);
      setLikes(l => l + 1);
      await supabase.from("likes").insert({ outfit_id: id, user_id: user.id });
      setTimeout(() => setJustLiked(false), 500);
    }
  }

  // ── Post comment ───────────────────────────────────────────────────────
  async function handleComment() {
    const text = newComment.trim();
    if (!text || !user) return;

    setSendingComment(true);
    const { data, error: commentErr } = await supabase
      .from("comments")
      .insert({ outfit_id: id, user_id: user.id, body: text })
      .select("id, body, created_at, user_id")
      .single();

    if (!commentErr && data) {
      setComments(prev => [...prev, {
        ...data,
        profiles: { username: profile?.username, avatar_url: profile?.avatar_url }
      }]);
      setNewComment("");
    }
    setSendingComment(false);
  }

  // ── States ─────────────────────────────────────────────────────────────
  if (loading) return (
    <>
      <style>{STYLES}</style>
      <div className="od-loading">
        <div className="od-spinner" />
      </div>
    </>
  );

  if (error || !outfit) return (
    <>
      <style>{STYLES}</style>
      <div className="od-error-box">
        <div className="od-error-title">Not found</div>
        <p className="od-error-body">{error || "This outfit doesn't exist or you don't have access."}</p>
        <button className="od-error-btn" onClick={() => navigate(-1)}>Go back</button>
      </div>
    </>
  );

  const isOwner = user?.id === outfit?.user_id;

  async function handleDelete() {
    if (!isOwner) return;
    setDeleting(true);
    try {
      await supabase.from("outfits").update({ is_deleted: true }).eq("id", id);
      navigate(-1);
    } catch (err) {
      console.error("[OutfitDetail] delete error:", err);
      setDeleting(false);
    }
  }

  async function handleRemoveBg() {
    const result = await removeBg(outfit.id, outfit.raw_image_url);
    if (result?.processed_image_url) {
      setOutfit(o => ({ ...o, processed_image_url: result.processed_image_url }));
    }
  }

  return (
    <>
      <style>{STYLES}</style>
      <div className="od-root">

        {/* ── Hero image ── */}
        <div className="od-hero">
          <img
            src={outfit.processed_image_url || outfit.raw_image_url}
            alt={outfit.caption || "Outfit"}
            className="od-hero-img"
          />
          <div className="od-hero-fade" />

          {/* Back button */}
          <button className="od-back" onClick={() => navigate(-1)} aria-label="Go back">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Date chip */}
          {outfit.capture_date && (
            <div className="od-date-chip">{formatCaptureDate(outfit.capture_date)}</div>
          )}

          {/* Three dots menu — owner only */}
          {isOwner && (
            <>
              <button
                className="od-menu-btn"
                onClick={() => setShowMenu(v => !v)}
                aria-label="Options"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="3" r="1.2" fill="currentColor"/>
                  <circle cx="8" cy="8" r="1.2" fill="currentColor"/>
                  <circle cx="8" cy="13" r="1.2" fill="currentColor"/>
                </svg>
              </button>

              {showMenu && (
                <>
                  <div className="od-menu-overlay" onClick={() => setShowMenu(false)} />
                  <div className="od-menu-dropdown">
                    <button
                      className="od-menu-item danger"
                      onClick={handleDelete}
                      disabled={deleting}
                    >
                      {deleting ? (
                        <span style={{ width:14, height:14, border:"1.5px solid rgba(224,112,112,0.3)", borderTopColor:"#e07070", borderRadius:"50%", display:"inline-block", animation:"od-spin 0.7s linear infinite" }} />
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                          <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      {deleting ? "Deleting…" : "Delete outfit"}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* ── Content ── */}
        <div className="od-content">

          {/* Owner row */}
          <div className="od-owner-row">
            <div className="od-owner">
              {owner?.avatar_url
                ? <img src={owner.avatar_url} alt={owner.username} className="od-avatar" />
                : <div className="od-avatar-placeholder">
                    {owner?.username?.[0]?.toUpperCase() ?? "?"}
                  </div>
              }
              <div>
                <div className="od-username">@{owner?.username ?? "unknown"}</div>
                {owner?.display_name && (
                  <div className="od-display-name">{owner.display_name}</div>
                )}
              </div>
            </div>

            {/* Wear count */}
            <div className="od-wear-badge">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L10 5.5H15L11 8.5L12.5 13L8 10.5L3.5 13L5 8.5L1 5.5H6L8 1Z"
                  stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
              </svg>
              Worn {outfit.wear_count ?? 1}×
            </div>
          </div>

          {/* Caption */}
          {outfit.caption && (
            <div className="od-caption">"{outfit.caption}"</div>
          )}

          {/* AI Tags */}
          {tags.length > 0 && (
            <div className="od-tags-section">
              <div className="od-tags-label">Style tags</div>
              <div className="od-tags">
                {tags.map((t, i) => (
                  <span
                    key={t.tag_value}
                    className="od-tag ai"
                    style={{ animationDelay: `${i * 0.04}s` }}
                  >
                    {t.tag_value}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="od-divider" />

          {/* Action bar */}
          <div className="od-actions">
            {/* Like */}
            <button
              className={`od-action-btn${liked ? " liked" : ""}${justLiked ? " just-liked" : ""}`}
              onClick={handleLike}
              aria-label={liked ? "Unlike" : "Like"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              {likes > 0 && <span>{likes}</span>}
              <span>{liked ? "Liked" : "Like"}</span>
            </button>

            {/* Comment count */}
            <button
              className="od-action-btn"
              onClick={() => document.getElementById("od-comment-input")?.focus()}
              aria-label="Comment"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              {comments.length > 0 && <span>{comments.length}</span>}
              <span>Comment</span>
            </button>

            {/* Remove BG — owner only, only if not already processed */}
            {isOwner && !outfit.processed_image_url && (
              <button
                className="od-action-btn"
                onClick={handleRemoveBg}
                disabled={bgLoading}
                aria-label="Remove background"
                style={{ marginLeft: "auto" }}
              >
                {bgLoading ? (
                  <span style={{
                    width: 14, height: 14,
                    border: "1.5px solid rgba(200,191,175,0.2)",
                    borderTopColor: "var(--dust)",
                    borderRadius: "50%",
                    display: "inline-block",
                    animation: "od-spin 0.7s linear infinite"
                  }} />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                    <path d="M3 6h18M3 12h18M3 18h18"/>
                  </svg>
                )}
                <span>{bgLoading ? "Processing…" : "Remove BG"}</span>
              </button>
            )}

            {/* Already processed badge */}
            {isOwner && outfit.processed_image_url && (
              <span style={{
                marginLeft: "auto", fontSize: "0.68rem",
                color: "var(--green)", display: "flex",
                alignItems: "center", gap: 4,
                padding: "3px 8px",
                background: "rgba(74,124,107,0.1)",
                borderRadius: 999,
                border: "1px solid rgba(74,124,107,0.2)"
              }}>
                ✓ BG removed
              </span>
            )}
          </div>

          <div className="od-divider" />

          {/* Comments */}
          <div className="od-comments-section">
            <div className="od-comments-title">
              {comments.length > 0 ? `${comments.length} comment${comments.length > 1 ? "s" : ""}` : "Comments"}
            </div>

            {comments.length === 0 && (
              <div className="od-no-comments">Be the first to comment.</div>
            )}

            {comments.map(c => (
              <div key={c.id} className="od-comment">
                {c.profiles?.avatar_url
                  ? <img src={c.profiles.avatar_url} alt={c.profiles.username} className="od-comment-avatar" />
                  : <div className="od-comment-avatar-placeholder">
                      {c.profiles?.username?.[0]?.toUpperCase() ?? "?"}
                    </div>
                }
                <div className="od-comment-body">
                  <div className="od-comment-user">@{c.profiles?.username ?? "user"}</div>
                  <div className="od-comment-text">{c.body}</div>
                  <div className="od-comment-time">{relativeTime(c.created_at)}</div>
                </div>
              </div>
            ))}

            {/* Comment input */}
            <div className="od-comment-input-row">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt={profile.username} className="od-comment-avatar" />
                : <div className="od-comment-avatar-placeholder">
                    {profile?.username?.[0]?.toUpperCase() ?? "?"}
                  </div>
              }
              <input
                id="od-comment-input"
                className="od-comment-input"
                type="text"
                placeholder="Add a comment…"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !sendingComment && handleComment()}
                maxLength={500}
              />
              <button
                className="od-comment-send"
                onClick={handleComment}
                disabled={!newComment.trim() || sendingComment}
                aria-label="Send comment"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

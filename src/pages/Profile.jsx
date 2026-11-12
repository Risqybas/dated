import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";

// ─── Styles ───────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .pro-root {
    --ink:    #0d0b08;
    --cream:  #f5f0e8;
    --dust:   #8a8178;
    --gold:   #b8955a;
    --muted:  rgba(245,240,232,0.08);
    font-family: 'DM Sans', sans-serif;
    min-height: 100svh;
    background: var(--ink);
    color: var(--cream);
    padding-bottom: max(2rem, calc(env(safe-area-inset-bottom) + 80px));
    overflow-x: hidden;
  }

  /* ── Header bar ── */
  .pro-header {
    position: sticky;
    top: 0; z-index: 30;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.9rem 1.25rem;
    padding-top: max(0.9rem, env(safe-area-inset-top));
    background: rgba(13,11,8,0.88);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-bottom: 0.5px solid rgba(255,255,255,0.07);
  }

  .pro-header-username {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.15rem;
    font-weight: 300;
    letter-spacing: 0.12em;
    color: var(--cream);
  }

  .pro-header-btn {
    width: 34px; height: 34px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.12);
    background: transparent;
    color: var(--cream);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: background 0.2s;
  }
  .pro-header-btn:hover { background: rgba(255,255,255,0.08); }

  /* ── Identity section ── */
  .pro-identity {
    position: relative;
    padding: 2rem 1.5rem 0;
  }

  /* subtle grain texture */
  .pro-identity::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 180px;
    background:
      radial-gradient(ellipse 80% 100% at 15% 0%, rgba(184,149,90,0.1) 0%, transparent 60%),
      radial-gradient(ellipse 60% 80% at 85% 20%, rgba(184,149,90,0.06) 0%, transparent 55%);
    pointer-events: none;
  }

  .pro-identity-inner {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
    animation: fadeUp 0.5s cubic-bezier(0.22,0.68,0,1.2) both;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* avatar + stats row */
  .pro-top-row {
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }

  /* avatar */
  .pro-avatar-wrap {
    position: relative;
    flex-shrink: 0;
  }

  .pro-avatar {
    width: 80px; height: 80px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(184,149,90,0.35);
    display: block;
  }

  .pro-avatar-placeholder {
    width: 80px; height: 80px;
    border-radius: 50%;
    background: rgba(255,255,255,0.05);
    border: 2px solid rgba(184,149,90,0.25);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Cormorant Garamond', serif;
    font-size: 2rem; font-weight: 300;
    color: var(--gold);
  }

  .pro-avatar-edit {
    position: absolute;
    bottom: 0; right: 0;
    width: 26px; height: 26px;
    border-radius: 50%;
    background: var(--gold);
    border: 2px solid var(--ink);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: opacity 0.2s;
  }
  .pro-avatar-edit:hover { opacity: 0.82; }

  /* stats */
  .pro-stats {
    display: flex;
    gap: 1.5rem;
    flex: 1;
  }

  .pro-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .pro-stat-value {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.5rem;
    font-weight: 400;
    color: var(--cream);
    line-height: 1;
  }

  .pro-stat-label {
    font-size: 0.65rem;
    font-weight: 400;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--dust);
  }

  /* name + bio */
  .pro-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.35rem;
    font-weight: 400;
    color: var(--cream);
    line-height: 1.2;
  }

  .pro-handle {
    font-size: 0.8rem;
    font-weight: 300;
    color: var(--dust);
    margin-top: 2px;
  }

  .pro-bio {
    font-size: 0.875rem;
    font-weight: 300;
    color: rgba(245,240,232,0.7);
    line-height: 1.6;
  }

  .pro-private-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 0.65rem;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--dust);
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 999px;
    padding: 3px 8px;
  }

  /* ── Action buttons ── */
  .pro-actions {
    display: flex;
    gap: 0.65rem;
    margin-top: 0.25rem;
  }

  .pro-btn {
    flex: 1;
    padding: 0.65rem 1rem;
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.8rem;
    font-weight: 500;
    letter-spacing: 0.05em;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: opacity 0.2s, transform 0.12s;
    display: flex; align-items: center; justify-content: center; gap: 6px;
  }
  .pro-btn:active { transform: scale(0.97); }

  .pro-btn-primary {
    background: var(--gold);
    border: none;
    color: var(--ink);
  }
  .pro-btn-primary:hover { opacity: 0.88; }

  .pro-btn-secondary {
    background: transparent;
    border: 1px solid rgba(255,255,255,0.15);
    color: var(--cream);
  }
  .pro-btn-secondary:hover { border-color: rgba(255,255,255,0.3); background: rgba(255,255,255,0.04); }

  .pro-btn-follow {
    background: var(--gold);
    border: none;
    color: var(--ink);
  }
  .pro-btn-unfollow {
    background: transparent;
    border: 1px solid rgba(255,255,255,0.2);
    color: var(--cream);
  }

  /* ── Divider ── */
  .pro-divider {
    height: 1px;
    background: rgba(255,255,255,0.07);
    margin: 1.5rem 0 0;
  }

  /* ── Grid tab bar ── */
  .pro-tabs {
    display: flex;
    border-bottom: 0.5px solid rgba(255,255,255,0.07);
  }

  .pro-tab {
    flex: 1;
    padding: 0.85rem 0;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--dust);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.72rem;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    display: flex; align-items: center; justify-content: center; gap: 6px;
    transition: color 0.2s, border-color 0.2s;
    margin-bottom: -0.5px;
  }
  .pro-tab.active {
    color: var(--cream);
    border-bottom-color: var(--gold);
  }

  /* ── Outfit grid ── */
  .pro-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2px;
    padding: 2px;
  }

  .pro-grid-cell {
    position: relative;
    aspect-ratio: 1;
    overflow: hidden;
    background: rgba(255,255,255,0.03);
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  .pro-grid-cell:hover .pro-grid-img { transform: scale(1.06); }
  .pro-grid-cell:hover .pro-grid-overlay { opacity: 1; }

  .pro-grid-img {
    width: 100%; height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.35s cubic-bezier(0.22,0.68,0,1.2);
    animation: cellReveal 0.4s ease both;
  }

  @keyframes cellReveal {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .pro-grid-overlay {
    position: absolute; inset: 0;
    background: rgba(13,11,8,0.45);
    opacity: 0;
    transition: opacity 0.2s;
    display: flex; align-items: center; justify-content: center;
    gap: 1rem;
  }

  .pro-grid-stat {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--cream);
    font-size: 0.8rem;
    font-weight: 500;
  }

  /* date chip on cell */
  .pro-grid-date {
    position: absolute;
    bottom: 5px; left: 6px;
    font-size: 0.6rem;
    color: rgba(245,240,232,0.55);
    font-weight: 300;
    letter-spacing: 0.04em;
    pointer-events: none;
  }

  /* ── Empty grid state ── */
  .pro-empty {
    grid-column: 1 / -1;
    padding: 3rem 2rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .pro-empty-ring {
    width: 64px; height: 64px;
    border-radius: 50%;
    border: 1.5px dashed rgba(184,149,90,0.3);
    display: flex; align-items: center; justify-content: center;
  }

  .pro-empty-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.3rem;
    font-weight: 300;
    color: var(--cream);
  }

  .pro-empty-body {
    font-size: 0.82rem;
    color: var(--dust);
    line-height: 1.6;
    max-width: 240px;
  }

  .pro-empty-cta {
    padding: 0.65rem 1.5rem;
    background: var(--gold);
    border: none;
    border-radius: 8px;
    color: var(--ink);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.82rem;
    font-weight: 500;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: opacity 0.2s;
  }
  .pro-empty-cta:hover { opacity: 0.85; }

  /* ── Loading ── */
  .pro-loading {
    min-height: 100svh;
    display: flex; align-items: center; justify-content: center;
    flex-direction: column; gap: 1rem;
  }

  .pro-spinner {
    width: 28px; height: 28px;
    border: 2px solid rgba(184,149,90,0.2);
    border-top-color: var(--gold);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Edit modal ── */
  .pro-modal-overlay {
    position: fixed; inset: 0; z-index: 100;
    background: rgba(13,11,8,0.75);
    backdrop-filter: blur(4px);
    display: flex; align-items: flex-end;
    animation: fadeIn 0.2s ease both;
  }

  @keyframes fadeIn {
    from { opacity: 0; } to { opacity: 1; }
  }

  .pro-modal {
    width: 100%;
    max-width: 500px;
    margin: 0 auto;
    background: #141210;
    border: 1px solid rgba(255,255,255,0.1);
    border-bottom: none;
    border-radius: 20px 20px 0 0;
    padding: 1.5rem;
    padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 64px);
    animation: slideUp 0.3s cubic-bezier(0.22,0.68,0,1.2) both;
  }

  @keyframes slideUp {
    from { transform: translateY(100%); }
    to   { transform: translateY(0); }
  }

  .pro-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
  }

  .pro-modal-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.4rem;
    font-weight: 300;
    color: var(--cream);
  }

  .pro-modal-close {
    width: 32px; height: 32px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.12);
    background: transparent;
    color: var(--cream);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
  }

  .pro-edit-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 1rem;
  }

  .pro-edit-label {
    font-size: 0.68rem;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--dust);
  }

  .pro-edit-input,
  .pro-edit-textarea {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    padding: 0.75rem 1rem;
    color: var(--cream);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    font-weight: 300;
    outline: none;
    transition: border-color 0.2s;
  }

  .pro-edit-input:focus,
  .pro-edit-textarea:focus { border-color: var(--gold); }

  .pro-edit-textarea {
    resize: none;
    line-height: 1.5;
  }

  .pro-edit-save {
    width: 100%;
    padding: 0.8rem;
    background: var(--gold);
    border: none;
    border-radius: 8px;
    color: var(--ink);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.875rem;
    font-weight: 500;
    letter-spacing: 0.05em;
    cursor: pointer;
    margin-top: 0.5rem;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: opacity 0.2s;
  }
  .pro-edit-save:hover:not(:disabled) { opacity: 0.88; }
  .pro-edit-save:disabled { opacity: 0.45; cursor: not-allowed; }

  /* ── Sign out button ── */
  .pro-signout-btn {
    width: 100%;
    padding: 0.8rem;
    background: transparent;
    border: 1px solid rgba(220,60,60,0.25);
    border-radius: 8px;
    color: #d95f5f;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.875rem;
    font-weight: 500;
    letter-spacing: 0.05em;
    cursor: pointer;
    margin-top: 0.75rem;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: background 0.2s, border-color 0.2s;
    -webkit-tap-highlight-color: transparent;
  }
  .pro-signout-btn:hover:not(:disabled) {
    background: rgba(220,60,60,0.07);
    border-color: rgba(220,60,60,0.45);
  }
  .pro-signout-btn:active { transform: scale(0.97); }
  .pro-signout-btn:disabled { opacity: 0.45; cursor: not-allowed; }

  /* ── Confirm dialog ── */
  .pro-confirm-overlay {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(13,11,8,0.7);
    backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    padding: 1.5rem;
    animation: fadeIn 0.15s ease both;
  }

  .pro-confirm-box {
    width: 100%;
    max-width: 320px;
    background: #1c1a16;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px;
    padding: 1.75rem 1.5rem 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    text-align: center;
    animation: popIn 0.2s cubic-bezier(0.22,0.68,0,1.2) both;
  }

  @keyframes popIn {
    from { opacity: 0; transform: scale(0.92); }
    to   { opacity: 1; transform: scale(1); }
  }

  .pro-confirm-icon {
    width: 44px; height: 44px;
    border-radius: 50%;
    background: rgba(220,60,60,0.1);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 0.5rem;
  }

  .pro-confirm-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.2rem;
    font-weight: 400;
    color: var(--cream);
  }

  .pro-confirm-body {
    font-size: 0.8rem;
    font-weight: 300;
    color: var(--dust);
    line-height: 1.5;
    margin-bottom: 0.75rem;
  }

  .pro-confirm-actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
  }

  .pro-confirm-yes {
    width: 100%;
    padding: 0.75rem;
    background: #c0392b;
    border: none;
    border-radius: 10px;
    color: #fff;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: opacity 0.2s;
    -webkit-tap-highlight-color: transparent;
  }
  .pro-confirm-yes:hover:not(:disabled) { opacity: 0.88; }
  .pro-confirm-yes:disabled { opacity: 0.5; cursor: not-allowed; }

  .pro-confirm-no {
    width: 100%;
    padding: 0.75rem;
    background: transparent;
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 10px;
    color: var(--cream);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.875rem;
    font-weight: 400;
    cursor: pointer;
    transition: background 0.2s;
    -webkit-tap-highlight-color: transparent;
  }
  .pro-confirm-no:hover { background: rgba(255,255,255,0.05); }

  .pro-inline-spinner {
    width: 14px; height: 14px;
    border: 2px solid rgba(13,11,8,0.25);
    border-top-color: var(--ink);
    border-radius: 50%;
    animation: spin 0.65s linear infinite;
  }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(d) {
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric"
  });
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Profile() {
  const { username: paramUsername } = useParams();
  const navigate  = useNavigate();
  const { user, profile: myProfile, refreshProfile } = useAuth();

  const fileInputRef = useRef(null);

  const [profile,   setProfile]   = useState(null);
  const [outfits,   setOutfits]   = useState([]);
  const [stats,     setStats]     = useState({ outfits: 0, followers: 0, following: 0 });
  const [isOwner,   setIsOwner]   = useState(false);
  const [following, setFollowing] = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState("grid"); // grid | liked

  // Edit modal
  const [editOpen,      setEditOpen]      = useState(false);
  const [editName,      setEditName]      = useState("");
  const [editBio,       setEditBio]       = useState("");
  const [editUsername,  setEditUsername]  = useState("");
  const [editPrivate,   setEditPrivate]   = useState(false); // ← NEW
  const [saving,        setSaving]        = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [signingOut,    setSigningOut]    = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  // ── Fetch profile + outfits ────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    (async () => {
      setLoading(true);

      // Determine whose profile to show
      let targetProfile;
      if (paramUsername) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("username", paramUsername)
          .single();
        targetProfile = data;
      } else {
        targetProfile = myProfile;
      }

      if (!targetProfile) { setLoading(false); return; }

      setProfile(targetProfile);
      setIsOwner(targetProfile.id === user.id);

      // Outfits
      const { data: outfitData } = await supabase
        .from("outfits")
        .select("id, raw_image_url, processed_image_url, capture_date, caption")
        .eq("user_id", targetProfile.id)
        .eq("is_deleted", false)
        .order("capture_date", { ascending: false });
      setOutfits(outfitData || []);

      // Follower / following counts
      const [{ count: followerCount }, { count: followingCount }] = await Promise.all([
        supabase.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", targetProfile.id),
        supabase.from("follows").select("follower_id", { count: "exact", head: true }).eq("follower_id", targetProfile.id),
      ]);

      setStats({
        outfits:   outfitData?.length ?? 0,
        followers: followerCount ?? 0,
        following: followingCount ?? 0,
      });

      // Am I following them?
      if (targetProfile.id !== user.id) {
        const { data: followData } = await supabase
          .from("follows")
          .select("follower_id")
          .eq("follower_id", user.id)
          .eq("following_id", targetProfile.id)
          .maybeSingle();
        setFollowing(!!followData);
      }

      setLoading(false);
    })();
  }, [user, paramUsername, myProfile]);

  // ── Follow / unfollow ─────────────────────────────────────────────────
  async function handleFollow() {
    if (!profile) return;
    if (following) {
      setFollowing(false);
      setStats(s => ({ ...s, followers: s.followers - 1 }));
      await supabase.from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", profile.id);
    } else {
      setFollowing(true);
      setStats(s => ({ ...s, followers: s.followers + 1 }));
      await supabase.from("follows").insert({
        follower_id:  user.id,
        following_id: profile.id,
      });
    }
  }

  // ── Open edit modal ────────────────────────────────────────────────────
  function openEdit() {
    setEditName(profile?.display_name ?? "");
    setEditBio(profile?.bio ?? "");
    setEditUsername(profile?.username ?? "");
    setEditPrivate(profile?.is_private ?? false); // ← NEW
    setEditOpen(true);
  }

  // ── Save profile edits ─────────────────────────────────────────────────
  async function handleSaveEdit() {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: editName.trim() || null,
        bio:          editBio.trim()  || null,
        username:     editUsername.trim() || profile.username,
        is_private:   editPrivate,           // ← NEW
        updated_at:   new Date().toISOString(),
      })
      .eq("id", user.id);

    if (!error) {
      await refreshProfile();
      setProfile(p => ({ ...p,
        display_name: editName.trim() || null,
        bio:          editBio.trim()  || null,
        username:     editUsername.trim() || p.username,
        is_private:   editPrivate,           // ← NEW
      }));
      setEditOpen(false);
    }
    setSaving(false);
  }

  // ── Avatar upload ──────────────────────────────────────────────────────
  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingAvatar(true);
    const ext      = file.name.split(".").pop();
    const filePath = `${user.id}/avatar.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("outfit-photos-raw")
      .upload(filePath, file, { upsert: true, contentType: file.type });

    if (!upErr) {
      const { data } = supabase.storage.from("outfit-photos-raw").getPublicUrl(filePath);
      const avatarUrl = data?.publicUrl + `?t=${Date.now()}`;

      await supabase.from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", user.id);

      await refreshProfile();
      setProfile(p => ({ ...p, avatar_url: avatarUrl }));
    }
    setUploadingAvatar(false);
  }

  // ── Sign out ───────────────────────────────────────────────────────────
  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    navigate("/login");
  }

  // ── Loading state ──────────────────────────────────────────────────────
  if (loading) return (
    <>
      <style>{STYLES}</style>
      <div className="pro-loading">
        <div className="pro-spinner" />
      </div>
    </>
  );

  if (!profile) return (
    <>
      <style>{STYLES}</style>
      <div className="pro-loading">
        <div style={{ color: "var(--dust)", fontSize: "0.9rem" }}>Profile not found.</div>
      </div>
    </>
  );

  return (
    <>
      <style>{STYLES}</style>
      <div className="pro-root">

        {/* ── Header bar ── */}
        <div className="pro-header">
          {!isOwner && (
            <button className="pro-header-btn" onClick={() => navigate(-1)} aria-label="Back">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
          <div className="pro-header-username" style={isOwner ? {} : { flex: 1, textAlign: "center" }}>
            @{profile.username}
          </div>
          {isOwner && (
            <button className="pro-header-btn" onClick={openEdit} aria-label="Settings">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
          )}
          {!isOwner && <div style={{ width: 34 }} />}
        </div>

        {/* ── Identity ── */}
        <div className="pro-identity">
          <div className="pro-identity-inner">

            {/* Avatar + stats */}
            <div className="pro-top-row">
              <div className="pro-avatar-wrap">
                {profile.avatar_url
                  ? <img src={profile.avatar_url} alt={profile.username} className="pro-avatar" />
                  : <div className="pro-avatar-placeholder">
                      {profile.username?.[0]?.toUpperCase() ?? "?"}
                    </div>
                }
                {isOwner && (
                  <>
                    <div
                      className="pro-avatar-edit"
                      onClick={() => fileInputRef.current?.click()}
                      style={uploadingAvatar ? { opacity: 0.5, pointerEvents: "none" } : {}}
                    >
                      {uploadingAvatar
                        ? <div style={{ width: 10, height: 10, border: "1.5px solid rgba(13,11,8,0.4)", borderTopColor: "var(--ink)", borderRadius: "50%", animation: "spin 0.65s linear infinite" }} />
                        : <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                            <path d="M11 2L14 5M2 14l.75-3 8.25-8.25L14 5.75 5.75 14 2 14z" stroke="var(--ink)" strokeWidth="1.4" strokeLinejoin="round"/>
                          </svg>
                      }
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleAvatarUpload}
                    />
                  </>
                )}
              </div>

              {/* Stats */}
              <div className="pro-stats">
                {[
                  { value: stats.outfits,   label: "Outfits"   },
                  { value: stats.followers, label: "Followers" },
                  { value: stats.following, label: "Following" },
                ].map(s => (
                  <div key={s.label} className="pro-stat">
                    <div className="pro-stat-value">{s.value}</div>
                    <div className="pro-stat-label">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Name + bio */}
            <div>
              <div className="pro-name">
                {profile.display_name || profile.username}
                {profile.is_private && (
                  <span className="pro-private-badge" style={{ marginLeft: "0.6rem", verticalAlign: "middle" }}>
                    <svg width="9" height="9" viewBox="0 0 16 16" fill="none">
                      <rect x="3" y="7" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
                      <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                    </svg>
                    Private
                  </span>
                )}
              </div>
              <div className="pro-handle">@{profile.username}</div>
              {profile.bio && (
                <div className="pro-bio" style={{ marginTop: "0.5rem" }}>{profile.bio}</div>
              )}
            </div>

            {/* Action buttons */}
            <div className="pro-actions">
              {isOwner ? (
                <>
                  <button className="pro-btn pro-btn-secondary" onClick={openEdit}>
                    Edit profile
                  </button>
                  <button
                    className="pro-btn pro-btn-secondary"
                    onClick={() => navigate("/capture")}
                    style={{ flexBasis: "auto", flexGrow: 0, paddingLeft: "1rem", paddingRight: "1rem" }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <circle cx="12" cy="12" r="3.5"/>
                      <path d="M8.5 3h7l1.5 2h3a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 20 19H4a1.5 1.5 0 0 1-1.5-1.5v-11A1.5 1.5 0 0 1 4 5h3L8.5 3z"/>
                    </svg>
                    Capture
                  </button>
                </>
              ) : (
                <>
                  <button
                    className={`pro-btn ${following ? "pro-btn-unfollow" : "pro-btn-follow"}`}
                    onClick={handleFollow}
                  >
                    {following ? "Following" : "Follow"}
                  </button>
                  <button className="pro-btn pro-btn-secondary" style={{ flexGrow: 0, paddingLeft: "1rem", paddingRight: "1rem" }}>
                    Message
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="pro-divider" />
        </div>

        {/* ── Tab bar ── */}
        <div className="pro-tabs">
          <button className={`pro-tab${tab === "grid" ? " active" : ""}`} onClick={() => setTab("grid")}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/>
              <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/>
              <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/>
              <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/>
            </svg>
            Grid
          </button>
          <button className={`pro-tab${tab === "liked" ? " active" : ""}`} onClick={() => setTab("liked")}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 13.5S1.5 9.5 1.5 5.5a3 3 0 0 1 6-1 3 3 0 0 1 6 1c0 4-6.5 8-6.5 8z" stroke="currentColor" strokeWidth="1.3"/>
            </svg>
            Liked
          </button>
        </div>

        {/* ── Outfit grid ── */}
        {tab === "grid" && (
          <div className="pro-grid">
            {outfits.length === 0 ? (
              <div className="pro-empty">
                <div className="pro-empty-ring">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(184,149,90,0.5)" strokeWidth="1.4" strokeLinecap="round">
                    <circle cx="12" cy="12" r="3.5"/>
                    <path d="M8.5 3h7l1.5 2h3a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 20 19H4a1.5 1.5 0 0 1-1.5-1.5v-11A1.5 1.5 0 0 1 4 5h3L8.5 3z"/>
                  </svg>
                </div>
                <div className="pro-empty-title">No outfits yet</div>
                <div className="pro-empty-body">
                  {isOwner
                    ? "Start capturing your daily outfits to build your style journal."
                    : "This user hasn't captured any outfits yet."
                  }
                </div>
                {isOwner && (
                  <button className="pro-empty-cta" onClick={() => navigate("/capture")}>
                    Capture today's outfit
                  </button>
                )}
              </div>
            ) : (
              outfits.map((outfit, i) => (
                <div
                  key={outfit.id}
                  className="pro-grid-cell"
                  onClick={() => navigate(`/outfit/${outfit.id}`)}
                  style={{ animationDelay: `${i * 0.03}s` }}
                >
                  <img
                    src={outfit.processed_image_url || outfit.raw_image_url}
                    alt={outfit.caption || "Outfit"}
                    className="pro-grid-img"
                    loading="lazy"
                  />
                  <div className="pro-grid-overlay">
                    <div className="pro-grid-stat">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1.5">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                    </div>
                  </div>
                  {outfit.capture_date && (
                    <div className="pro-grid-date">{formatDate(outfit.capture_date)}</div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {tab === "liked" && (
          <div className="pro-grid">
            <div className="pro-empty">
              <div className="pro-empty-title">Coming soon</div>
              <div className="pro-empty-body">Liked outfits will appear here.</div>
            </div>
          </div>
        )}

        {/* ── Edit profile modal ── */}
        {editOpen && (
          <div className="pro-modal-overlay" onClick={() => setEditOpen(false)}>
            <div className="pro-modal" onClick={e => e.stopPropagation()}>
              <div className="pro-modal-header">
                <div className="pro-modal-title">Edit profile</div>
                <button className="pro-modal-close" onClick={() => setEditOpen(false)}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              <div className="pro-edit-field">
                <label className="pro-edit-label">Username</label>
                <input
                  className="pro-edit-input"
                  value={editUsername}
                  onChange={e => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ""))}
                  placeholder="your_handle"
                  maxLength={30}
                />
              </div>

              <div className="pro-edit-field">
                <label className="pro-edit-label">Display name</label>
                <input
                  className="pro-edit-input"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Your Name"
                  maxLength={50}
                />
              </div>

              <div className="pro-edit-field">
                <label className="pro-edit-label">Bio</label>
                <textarea
                  className="pro-edit-textarea"
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  placeholder="A short bio…"
                  rows={3}
                  maxLength={160}
                />
              </div>

              {/* ── is_private toggle ── */}
              <div className="pro-edit-field" style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div className="pro-edit-label">Private account</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--dust)", fontWeight: 300, marginTop: 3 }}>
                    Only followers can see your outfits
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditPrivate(p => !p)}
                  style={{
                    width: 44, height: 26,
                    borderRadius: 999,
                    border: "none",
                    background: editPrivate ? "var(--gold)" : "rgba(255,255,255,0.12)",
                    position: "relative",
                    cursor: "pointer",
                    flexShrink: 0,
                    transition: "background 0.2s",
                  }}
                  aria-label="Toggle private account"
                >
                  <span style={{
                    position: "absolute",
                    top: 3, left: editPrivate ? 21 : 3,
                    width: 20, height: 20,
                    borderRadius: "50%",
                    background: "var(--cream)",
                    transition: "left 0.2s",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                  }} />
                </button>
              </div>

              <button
                className="pro-edit-save"
                onClick={handleSaveEdit}
                disabled={saving}
              >
                {saving ? <><div className="pro-inline-spinner" /> Saving…</> : "Save changes"}
              </button>

              <button
                className="pro-signout-btn"
                onClick={() => setConfirmSignOut(true)}
                disabled={signingOut}
              >
                {signingOut
                  ? <><div className="pro-inline-spinner" style={{ borderColor: "rgba(220,60,60,0.2)", borderTopColor: "#d95f5f" }} /> Signing out…</>
                  : <>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <polyline points="16 17 21 12 16 7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                      Sign out
                    </>
                }
              </button>
            </div>
          </div>
        )}

        {/* ── Sign out confirm dialog ── */}
        {confirmSignOut && (
          <div className="pro-confirm-overlay" onClick={() => !signingOut && setConfirmSignOut(false)}>
            <div className="pro-confirm-box" onClick={e => e.stopPropagation()}>
              <div className="pro-confirm-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d95f5f" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </div>
              <div className="pro-confirm-title">Sign out?</div>
              <div className="pro-confirm-body">You'll be returned to the login screen.</div>
              <div className="pro-confirm-actions">
                <button
                  className="pro-confirm-yes"
                  onClick={handleSignOut}
                  disabled={signingOut}
                >
                  {signingOut
                    ? <><div className="pro-inline-spinner" style={{ borderColor: "rgba(255,255,255,0.2)", borderTopColor: "#fff" }} /> Signing out…</>
                    : "Yes, sign out"
                  }
                </button>
                <button
                  className="pro-confirm-no"
                  onClick={() => setConfirmSignOut(false)}
                  disabled={signingOut}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

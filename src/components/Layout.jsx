import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// ─── Styles ───────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&display=swap');

  .layout-root {
    --ink:      #0d0b08;
    --cream:    #f5f0e8;
    --dust:     #8a8178;
    --gold:     #b8955a;
    --nav-h:    64px;
    --safe-b:   env(safe-area-inset-bottom, 0px);

    font-family: 'DM Sans', sans-serif;
    background: var(--ink);
    color: var(--cream);
    min-height: 100svh;
    display: flex;
    flex-direction: column;
  }

  /* ── Page content ── */
  .layout-page {
    flex: 1;
    overflow-y: auto;
    padding-bottom: calc(var(--nav-h) + var(--safe-b) + 8px);
    /* smooth momentum scroll on iOS */
    -webkit-overflow-scrolling: touch;
  }

  /* ── Nav bar ── */
  .layout-nav {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    z-index: 100;
    height: calc(var(--nav-h) + var(--safe-b));
    padding-bottom: var(--safe-b);
    background: rgba(13,11,8,0.92);
    backdrop-filter: blur(18px) saturate(140%);
    -webkit-backdrop-filter: blur(18px) saturate(140%);
    border-top: 0.5px solid rgba(255,255,255,0.07);
  }

  .layout-nav-inner {
    height: var(--nav-h);
    max-width: 480px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    align-items: center;
  }

  /* ── Each tab ── */
  .nav-tab {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    text-decoration: none;
    color: var(--dust);
    padding: 8px 4px;
    border-radius: 10px;
    transition: color 0.18s;
    -webkit-tap-highlight-color: transparent;
    position: relative;
  }

  .nav-tab:active { opacity: 0.7; }

  .nav-tab.active {
    color: var(--cream);
  }

  .nav-tab-icon {
    width: 24px; height: 24px;
    display: flex; align-items: center; justify-content: center;
    position: relative;
  }

  /* active dot indicator */
  .nav-tab.active .nav-tab-icon::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 50%; transform: translateX(-50%);
    width: 3px; height: 3px;
    border-radius: 50%;
    background: var(--gold);
  }

  .nav-tab-label {
    font-size: 10px;
    font-weight: 400;
    letter-spacing: 0.04em;
    line-height: 1;
    text-transform: uppercase;
  }

  /* ── Capture tab — elevated gold pill ── */
  .nav-tab-capture {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    text-decoration: none;
    color: var(--ink);
    padding: 4px;
    -webkit-tap-highlight-color: transparent;
    position: relative;
  }

  .nav-capture-pill {
    width: 44px; height: 44px;
    border-radius: 14px;
    background: var(--gold);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 16px rgba(184,149,90,0.35);
    transition: transform 0.15s, box-shadow 0.15s;
    margin-top: -12px; /* lift above nav bar */
  }

  .nav-tab-capture:active .nav-capture-pill {
    transform: scale(0.93);
    box-shadow: 0 2px 8px rgba(184,149,90,0.25);
  }

  .nav-capture-label {
    font-size: 10px;
    font-weight: 400;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--dust);
    line-height: 1;
    margin-top: 2px;
  }

  .nav-tab-capture.active .nav-capture-label {
    color: var(--gold);
  }

  /* profile avatar in nav */
  .nav-avatar {
    width: 22px; height: 22px;
    border-radius: 50%;
    object-fit: cover;
    border: 1.5px solid rgba(255,255,255,0.15);
  }
  .nav-avatar-placeholder {
    width: 22px; height: 22px;
    border-radius: 50%;
    background: rgba(255,255,255,0.08);
    border: 1.5px solid rgba(255,255,255,0.12);
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; color: var(--dust); font-weight: 500;
  }
  .nav-tab.active .nav-avatar,
  .nav-tab.active .nav-avatar-placeholder {
    border-color: var(--gold);
  }
`;

// ─── SVG icons (hand-tuned, no library dependency) ───────────────────────────
const icons = {
  feed: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="12" y="2" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="2" y="12" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="12" y="12" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  ),
  calendar: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2.5" y="4" width="17" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M7 2v4M15 2v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M2.5 9h17" stroke="currentColor" strokeWidth="1.4"/>
      <circle cx="7.5" cy="14" r="1" fill="currentColor"/>
      <circle cx="11" cy="14" r="1" fill="currentColor"/>
      <circle cx="14.5" cy="14" r="1" fill="currentColor"/>
    </svg>
  ),
  capture: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="11" cy="11" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8.5 3h5l1.5 2h3a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 18 19H4a1.5 1.5 0 0 1-1.5-1.5v-11A1.5 1.5 0 0 1 4 5h3L8.5 3z" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  ),
  wardrobe: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11 3 L4 7.5v11.5h14V7.5L11 3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M11 3v16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M7.5 13h2M12.5 13h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function Layout() {
  const { profile } = useAuth();
  // const location    = useLocation();
  // const isCapture   = location.pathname === "/capture";

  return (
    <>
      <style>{STYLES}</style>
      <div className="layout-root">

        {/* Page content rendered here via React Router's <Outlet> */}
        <main className="layout-page">
          <Outlet />
        </main>

        <nav className="layout-nav" aria-label="Main navigation">
          <div className="layout-nav-inner">

            {/* Feed */}
            <NavLink to="/feed" className={({ isActive }) => `nav-tab${isActive ? " active" : ""}`}>
              <span className="nav-tab-icon">{icons.feed}</span>
              <span className="nav-tab-label">Feed</span>
            </NavLink>

            {/* Calendar */}
            <NavLink to="/calendar" className={({ isActive }) => `nav-tab${isActive ? " active" : ""}`}>
              <span className="nav-tab-icon">{icons.calendar}</span>
              <span className="nav-tab-label">Calendar</span>
            </NavLink>

            {/* Capture — elevated centre button */}
            <NavLink
              to="/capture"
              className={({ isActive }) => `nav-tab-capture${isActive ? " active" : ""}`}
              aria-label="Capture today's outfit"
            >
              <span className="nav-capture-pill">{icons.capture}</span>
              <span className="nav-capture-label">Capture</span>
            </NavLink>

            {/* Wardrobe */}
            <NavLink to="/wardrobe" className={({ isActive }) => `nav-tab${isActive ? " active" : ""}`}>
              <span className="nav-tab-icon">{icons.wardrobe}</span>
              <span className="nav-tab-label">Wardrobe</span>
            </NavLink>

            {/* Profile */}
            <NavLink to="/profile" className={({ isActive }) => `nav-tab${isActive ? " active" : ""}`}>
              <span className="nav-tab-icon">
                {profile?.avatar_url
                  ? <img className="nav-avatar" src={profile.avatar_url} alt={profile.username} />
                  : <span className="nav-avatar-placeholder">
                      {profile?.username?.[0]?.toUpperCase() ?? "?"}
                    </span>
                }
              </span>
              <span className="nav-tab-label">Profile</span>
            </NavLink>

          </div>
        </nav>
      </div>
    </>
  );
}

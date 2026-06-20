// src/components/PWAInstallPrompt.jsx
// Shows an "Add to Home Screen" banner on Android Chrome.
// iOS shows the native Safari share sheet instead (handled separately).

import { useEffect, useState } from "react";

const STYLES = `
  .pwa-banner {
    position: fixed;
    bottom: calc(env(safe-area-inset-bottom) + 80px);
    left: 1rem; right: 1rem;
    z-index: 200;
    background: #1a1713;
    border: 0.5px solid rgba(184,149,90,0.3);
    border-radius: 14px;
    padding: 1rem 1.25rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    animation: bannerSlide 0.4s cubic-bezier(0.22,0.68,0,1.2) both;
  }

  @keyframes bannerSlide {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .pwa-banner-icon {
    width: 44px; height: 44px;
    border-radius: 10px;
    background: #0d0b08;
    border: 1px solid rgba(184,149,90,0.2);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    font-family: 'Cormorant Garamond', serif;
    font-size: 1rem; font-weight: 300;
    letter-spacing: 0.1em;
    color: #b8955a;
  }

  .pwa-banner-text { flex: 1; min-width: 0; }

  .pwa-banner-title {
    font-size: 0.875rem;
    font-weight: 500;
    color: #f5f0e8;
    margin-bottom: 2px;
  }

  .pwa-banner-sub {
    font-size: 0.72rem;
    color: #8a8178;
    font-weight: 300;
  }

  .pwa-banner-btns {
    display: flex; gap: 0.5rem; flex-shrink: 0;
  }

  .pwa-banner-dismiss {
    width: 30px; height: 30px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.1);
    background: transparent;
    color: #8a8178;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  .pwa-banner-install {
    padding: 6px 14px;
    background: #b8955a;
    border: none;
    border-radius: 999px;
    color: #0d0b08;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    white-space: nowrap;
  }

  /* iOS hint */
  .pwa-ios-hint {
    position: fixed;
    bottom: calc(env(safe-area-inset-bottom) + 80px);
    left: 1rem; right: 1rem;
    z-index: 200;
    background: #1a1713;
    border: 0.5px solid rgba(184,149,90,0.3);
    border-radius: 14px;
    padding: 1rem 1.25rem;
    font-family: 'DM Sans', sans-serif;
    animation: bannerSlide 0.4s cubic-bezier(0.22,0.68,0,1.2) both;
  }

  .pwa-ios-title {
    font-size: 0.875rem; font-weight: 500;
    color: #f5f0e8; margin-bottom: 6px;
    display: flex; align-items: center;
    justify-content: space-between;
  }

  .pwa-ios-body {
    font-size: 0.78rem; color: #8a8178;
    line-height: 1.6; font-weight: 300;
  }

  .pwa-ios-close {
    background: none; border: none;
    color: #8a8178; cursor: pointer;
    padding: 0; line-height: 1;
  }
`;

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandaloneMode() {
  return window.matchMedia("(display-mode: standalone)").matches
    || window.navigator.standalone === true;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showAndroid,    setShowAndroid]    = useState(false);
  const [showIOS,        setShowIOS]        = useState(false);

  useEffect(() => {
    // Already installed
    if (isInStandaloneMode()) return;

    // iOS — show manual hint after 3 seconds
    if (isIOS()) {
      const shown = localStorage.getItem("pwa-ios-hint-shown");
      if (!shown) {
        setTimeout(() => setShowIOS(true), 3000);
      }
      return;
    }

    // Android — listen for beforeinstallprompt
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowAndroid(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setShowAndroid(false);
    setDeferredPrompt(null);
  }

  function dismissAndroid() {
    setShowAndroid(false);
    localStorage.setItem("pwa-android-dismissed", "true");
  }

  function dismissIOS() {
    setShowIOS(false);
    localStorage.setItem("pwa-ios-hint-shown", "true");
  }

  if (!showAndroid && !showIOS) return null;

  return (
    <>
      <style>{STYLES}</style>

      {/* Android install banner */}
      {showAndroid && (
        <div className="pwa-banner">
          <div className="pwa-banner-icon">D</div>
          <div className="pwa-banner-text">
            <div className="pwa-banner-title">Install Dated</div>
            <div className="pwa-banner-sub">Add to your home screen</div>
          </div>
          <div className="pwa-banner-btns">
            <button className="pwa-banner-dismiss" onClick={dismissAndroid}>
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
            <button className="pwa-banner-install" onClick={handleInstall}>
              Install
            </button>
          </div>
        </div>
      )}

      {/* iOS hint */}
      {showIOS && (
        <div className="pwa-ios-hint">
          <div className="pwa-ios-title">
            Install Dated
            <button className="pwa-ios-close" onClick={dismissIOS}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          <div className="pwa-ios-body">
            Tap the <strong style={{color:"#f5f0e8"}}>Share</strong> button in Safari, then <strong style={{color:"#f5f0e8"}}>"Add to Home Screen"</strong> to install Dated as an app.
          </div>
        </div>
      )}
    </>
  );
}

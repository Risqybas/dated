import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

// ─── tiny keyframe injection ──────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .dated-login-root {
    --cream: #f5f0e8;
    --ink:   #0d0b08;
    --dust:  #c8bfaf;
    --gold:  #b8955a;
    --error: #c0392b;
    font-family: 'DM Sans', sans-serif;
    min-height: 100svh;
    background: var(--ink);
    color: var(--cream);
    display: grid;
    grid-template-columns: 1fr 1fr;
    overflow: hidden;
  }

  @media (max-width: 768px) {
    .dated-login-root { grid-template-columns: 1fr; }
    .dated-login-left  { display: none !important; }
  }

  /* ── left panel ── */
  .dated-login-left {
    position: relative;
    overflow: hidden;
    border-right: 1px solid rgba(255,255,255,0.06);
  }
  .dated-login-left-bg {
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 80% 60% at 30% 40%, rgba(184,149,90,0.12) 0%, transparent 70%),
      radial-gradient(ellipse 60% 80% at 70% 80%, rgba(184,149,90,0.06) 0%, transparent 60%),
      #0d0b08;
  }
  .dated-login-left-noise {
    position: absolute; inset: 0;
    opacity: 0.03;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    background-size: 200px 200px;
  }
  .dated-login-left-content {
    position: relative; z-index: 1;
    height: 100%;
    display: flex; flex-direction: column;
    justify-content: space-between;
    padding: 3rem;
  }
  .dated-wordmark {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.75rem;
    font-weight: 300;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: var(--cream);
  }
  .dated-tagline {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(2.8rem, 5vw, 4.5rem);
    font-weight: 300;
    line-height: 1.1;
    color: var(--cream);
  }
  .dated-tagline em {
    font-style: italic;
    color: var(--gold);
  }
  .dated-caption {
    font-size: 0.8rem;
    font-weight: 300;
    letter-spacing: 0.08em;
    color: var(--dust);
    line-height: 1.6;
  }

  /* ── right panel ── */
  .dated-login-right {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 2.5rem;
  }
  .dated-login-form-wrap {
    width: 100%;
    max-width: 380px;
    animation: fadeUp 0.55s cubic-bezier(.22,.68,0,1.2) both;
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .dated-form-heading {
    font-family: 'Cormorant Garamond', serif;
    font-size: 2.2rem;
    font-weight: 300;
    letter-spacing: 0.02em;
    color: var(--cream);
    margin-bottom: 0.35rem;
  }
  .dated-form-sub {
    font-size: 0.8rem;
    font-weight: 300;
    color: var(--dust);
    margin-bottom: 2rem;
  }
  .dated-form-sub a {
    color: var(--gold);
    text-decoration: none;
    font-weight: 400;
  }
  .dated-form-sub a:hover { text-decoration: underline; }

  /* divider */
  .dated-divider {
    display: flex; align-items: center; gap: 12px;
    margin: 1.4rem 0;
  }
  .dated-divider-line {
    flex: 1; height: 1px;
    background: rgba(255,255,255,0.08);
  }
  .dated-divider-text {
    font-size: 0.7rem;
    font-weight: 400;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--dust);
  }

  /* google button */
  .dated-btn-google {
    width: 100%;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    padding: 0.78rem 1.2rem;
    background: transparent;
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 6px;
    color: var(--cream);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.875rem;
    font-weight: 400;
    letter-spacing: 0.02em;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
    margin-bottom: 0.5rem;
  }
  .dated-btn-google:hover:not(:disabled) {
    border-color: rgba(255,255,255,0.28);
    background: rgba(255,255,255,0.04);
  }
  .dated-btn-google:disabled { opacity: 0.5; cursor: not-allowed; }

  /* field */
  .dated-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 1rem; }
  .dated-label {
    font-size: 0.72rem;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--dust);
  }
  .dated-input {
    width: 100%;
    padding: 0.78rem 1rem;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 6px;
    color: var(--cream);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    font-weight: 300;
    outline: none;
    transition: border-color 0.2s, background 0.2s;
  }
  .dated-input::placeholder { color: rgba(200,191,175,0.35); }
  .dated-input:focus {
    border-color: var(--gold);
    background: rgba(184,149,90,0.05);
  }
  .dated-input.error { border-color: var(--error); }

  /* error box */
  .dated-error {
    display: flex; align-items: flex-start; gap: 8px;
    background: rgba(192,57,43,0.1);
    border: 1px solid rgba(192,57,43,0.3);
    border-radius: 6px;
    padding: 0.7rem 0.9rem;
    margin-bottom: 1rem;
    font-size: 0.82rem;
    color: #e07070;
    line-height: 1.5;
    animation: fadeUp 0.2s ease both;
  }

  /* submit */
  .dated-btn-submit {
    width: 100%;
    padding: 0.82rem 1.2rem;
    background: var(--gold);
    border: none;
    border-radius: 6px;
    color: var(--ink);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.875rem;
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    cursor: pointer;
    margin-top: 0.25rem;
    transition: opacity 0.2s, transform 0.15s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .dated-btn-submit:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
  .dated-btn-submit:active:not(:disabled) { transform: translateY(0); }
  .dated-btn-submit:disabled { opacity: 0.55; cursor: not-allowed; }

  /* spinner */
  .dated-spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(13,11,8,0.3);
    border-top-color: var(--ink);
    border-radius: 50%;
    animation: spin 0.65s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* footer */
  .dated-form-footer {
    margin-top: 1.8rem;
    text-align: center;
    font-size: 0.72rem;
    letter-spacing: 0.05em;
    color: rgba(200,191,175,0.4);
  }
`;

// ─── Google SVG icon ──────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [error, setError]       = useState("");

  async function handleEmailLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (authError) {
      // Humanise common Supabase error messages
      if (authError.message.includes("Invalid login")) {
        setError("Email or password is incorrect. Please try again.");
      } else if (authError.message.includes("Email not confirmed")) {
        setError("Please check your inbox and confirm your email before signing in.");
      } else {
        setError(authError.message);
      }
      return;
    }

    navigate("/feed");
  }

  async function handleGoogleLogin() {
    setError("");
    setGLoading(true);

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/feed`,
      },
    });

    // signInWithOAuth redirects, so we only reach here on error
    if (authError) {
      setError(authError.message);
      setGLoading(false);
    }
  }

  const busy = loading || gLoading;

  return (
    <>
      <style>{STYLES}</style>
      <div className="dated-login-root">

        {/* ── Left panel ── */}
        <div className="dated-login-left">
          <div className="dated-login-left-bg" />
          <div className="dated-login-left-noise" />
          <div className="dated-login-left-content">
            <div className="dated-wordmark">Dated</div>
            <div>
              <div className="dated-tagline">
                Your style,<br />
                <em>captured daily.</em>
              </div>
            </div>
            <div className="dated-caption">
              A private wardrobe journal.<br />
              Track what you wear. Discover what you love.
            </div>
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="dated-login-right">
          <div className="dated-login-form-wrap">

            <h1 className="dated-form-heading">Welcome back</h1>
            <p className="dated-form-sub">
              New here?{" "}
              <Link to="/register">Create an account</Link>
            </p>

            {/* Google OAuth */}
            <button
              className="dated-btn-google"
              onClick={handleGoogleLogin}
              disabled={busy}
              type="button"
            >
              {gLoading
                ? <><span className="dated-spinner" /> Connecting…</>
                : <><GoogleIcon /> Continue with Google</>
              }
            </button>

            <div className="dated-divider">
              <div className="dated-divider-line" />
              <span className="dated-divider-text">or</span>
              <div className="dated-divider-line" />
            </div>

            {/* Error message */}
            {error && (
              <div className="dated-error" role="alert">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{flexShrink:0,marginTop:'1px'}}>
                  <circle cx="7.5" cy="7.5" r="7" stroke="#e07070" strokeWidth="1"/>
                  <path d="M7.5 4v4M7.5 10.5v.5" stroke="#e07070" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                {error}
              </div>
            )}

            {/* Email + password form */}
            <form onSubmit={handleEmailLogin} noValidate>
              <div className="dated-field">
                <label className="dated-label" htmlFor="email">Email</label>
                <input
                  id="email"
                  className={`dated-input${error ? " error" : ""}`}
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={busy}
                />
              </div>

              <div className="dated-field">
                <label className="dated-label" htmlFor="password">Password</label>
                <input
                  id="password"
                  className={`dated-input${error ? " error" : ""}`}
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={busy}
                />
              </div>

              <button
                className="dated-btn-submit"
                type="submit"
                disabled={busy || !email || !password}
              >
                {loading
                  ? <><span className="dated-spinner" /> Signing in…</>
                  : "Sign in"
                }
              </button>
            </form>

            <p className="dated-form-footer">
              By continuing you agree to Dated's Terms &amp; Privacy Policy.
            </p>
          </div>
        </div>

      </div>
    </>
  );
}

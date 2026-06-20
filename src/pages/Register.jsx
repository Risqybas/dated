import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

// ─── Styles ───────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .reg-root {
    --cream: #f5f0e8;
    --ink:   #0d0b08;
    --dust:  #c8bfaf;
    --gold:  #b8955a;
    --green: #4a7c6b;
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
    .reg-root { grid-template-columns: 1fr; }
    .reg-left  { display: none !important; }
  }

  /* ── left panel ── */
  .reg-left {
    position: relative; overflow: hidden;
    border-right: 1px solid rgba(255,255,255,0.06);
  }
  .reg-left-bg {
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 70% 70% at 20% 60%, rgba(74,124,107,0.14) 0%, transparent 65%),
      radial-gradient(ellipse 80% 50% at 80% 20%, rgba(184,149,90,0.09) 0%, transparent 60%),
      #0d0b08;
  }
  .reg-left-noise {
    position: absolute; inset: 0; opacity: 0.03;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    background-size: 200px 200px;
  }
  .reg-left-content {
    position: relative; z-index: 1; height: 100%;
    display: flex; flex-direction: column;
    justify-content: space-between; padding: 3rem;
  }
  .reg-wordmark {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.75rem; font-weight: 300;
    letter-spacing: 0.25em; text-transform: uppercase;
    color: var(--cream);
  }
  .reg-steps {
    display: flex; flex-direction: column; gap: 1.5rem;
  }
  .reg-step {
    display: flex; align-items: flex-start; gap: 1rem;
    opacity: 0.55; transition: opacity 0.3s;
  }
  .reg-step.active { opacity: 1; }
  .reg-step-num {
    width: 28px; height: 28px; flex-shrink: 0;
    border-radius: 50%;
    border: 1px solid rgba(200,191,175,0.25);
    display: flex; align-items: center; justify-content: center;
    font-size: 0.72rem; font-weight: 500; color: var(--dust);
    margin-top: 1px;
  }
  .reg-step.active .reg-step-num {
    background: var(--gold); border-color: var(--gold);
    color: var(--ink);
  }
  .reg-step-label {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.2rem; font-weight: 300; color: var(--cream);
  }
  .reg-step-sub {
    font-size: 0.75rem; color: var(--dust);
    font-weight: 300; margin-top: 2px; line-height: 1.5;
  }
  .reg-tagline {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(1.6rem, 3vw, 2.4rem);
    font-weight: 300; line-height: 1.3;
    color: var(--cream);
  }
  .reg-tagline em { font-style: italic; color: var(--gold); }

  /* ── right panel ── */
  .reg-right {
    display: flex; flex-direction: column;
    justify-content: center; align-items: center;
    padding: 2.5rem;
  }
  .reg-form-wrap {
    width: 100%; max-width: 380px;
    animation: fadeUp 0.55s cubic-bezier(.22,.68,0,1.2) both;
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .reg-heading {
    font-family: 'Cormorant Garamond', serif;
    font-size: 2.2rem; font-weight: 300;
    letter-spacing: 0.02em; color: var(--cream);
    margin-bottom: 0.35rem;
  }
  .reg-sub {
    font-size: 0.8rem; font-weight: 300; color: var(--dust);
    margin-bottom: 2rem;
  }
  .reg-sub a { color: var(--gold); text-decoration: none; font-weight: 400; }
  .reg-sub a:hover { text-decoration: underline; }

  /* field */
  .reg-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 0.9rem; }
  .reg-field-row { display: flex; align-items: center; justify-content: space-between; }
  .reg-label {
    font-size: 0.72rem; font-weight: 500;
    letter-spacing: 0.1em; text-transform: uppercase; color: var(--dust);
  }
  .reg-input {
    width: 100%; padding: 0.78rem 1rem;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 6px; color: var(--cream);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem; font-weight: 300; outline: none;
    transition: border-color 0.2s, background 0.2s;
  }
  .reg-input::placeholder { color: rgba(200,191,175,0.35); }
  .reg-input:focus { border-color: var(--gold); background: rgba(184,149,90,0.05); }
  .reg-input.field-error { border-color: var(--error); }
  .reg-input.field-ok    { border-color: #4a7c6b; }

  /* username availability badge */
  .reg-avail {
    font-size: 0.7rem; font-weight: 400;
    letter-spacing: 0.04em; padding: 2px 7px;
    border-radius: 999px; white-space: nowrap;
  }
  .reg-avail.checking { color: var(--dust); background: rgba(200,191,175,0.1); }
  .reg-avail.taken    { color: #e07070;    background: rgba(192,57,43,0.12); }
  .reg-avail.free     { color: #7ec8b0;    background: rgba(74,124,107,0.15); }

  /* password strength */
  .reg-strength-bar {
    display: flex; gap: 4px; margin-top: 6px;
  }
  .reg-strength-seg {
    flex: 1; height: 3px; border-radius: 2px;
    background: rgba(255,255,255,0.08);
    transition: background 0.3s;
  }
  .reg-strength-seg.s1 { background: #c0392b; }
  .reg-strength-seg.s2 { background: #e67e22; }
  .reg-strength-seg.s3 { background: #f1c40f; }
  .reg-strength-seg.s4 { background: #4a7c6b; }
  .reg-strength-label {
    font-size: 0.68rem; color: var(--dust); margin-top: 4px;
    font-weight: 300; letter-spacing: 0.04em;
  }

  /* field-level hint */
  .reg-hint { font-size: 0.72rem; color: #e07070; margin-top: 4px; }

  /* error box */
  .reg-error {
    display: flex; align-items: flex-start; gap: 8px;
    background: rgba(192,57,43,0.1);
    border: 1px solid rgba(192,57,43,0.3);
    border-radius: 6px; padding: 0.7rem 0.9rem;
    margin-bottom: 1rem;
    font-size: 0.82rem; color: #e07070; line-height: 1.5;
    animation: fadeUp 0.2s ease both;
  }

  /* success state */
  .reg-success {
    text-align: center; padding: 2rem 0;
    animation: fadeUp 0.4s ease both;
  }
  .reg-success-icon {
    width: 52px; height: 52px; border-radius: 50%;
    background: rgba(74,124,107,0.15);
    border: 1px solid rgba(74,124,107,0.35);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 1.2rem;
  }
  .reg-success-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.8rem; font-weight: 300; color: var(--cream);
    margin-bottom: 0.5rem;
  }
  .reg-success-body {
    font-size: 0.82rem; color: var(--dust); line-height: 1.6;
  }

  /* submit */
  .reg-btn-submit {
    width: 100%; padding: 0.82rem 1.2rem;
    background: var(--gold); border: none; border-radius: 6px;
    color: var(--ink);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.875rem; font-weight: 500;
    letter-spacing: 0.06em; text-transform: uppercase;
    cursor: pointer; margin-top: 0.5rem;
    transition: opacity 0.2s, transform 0.15s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .reg-btn-submit:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
  .reg-btn-submit:active:not(:disabled) { transform: translateY(0); }
  .reg-btn-submit:disabled { opacity: 0.45; cursor: not-allowed; }

  /* spinner */
  .reg-spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(13,11,8,0.3);
    border-top-color: var(--ink); border-radius: 50%;
    animation: spin 0.65s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .reg-footer {
    margin-top: 1.8rem; text-align: center;
    font-size: 0.72rem; letter-spacing: 0.05em;
    color: rgba(200,191,175,0.35);
  }
`;

// ─── helpers ──────────────────────────────────────────────────────────────────
function passwordStrength(pw) {
  let score = 0;
  if (pw.length >= 8)            score++;
  if (/[A-Z]/.test(pw))         score++;
  if (/[0-9]/.test(pw))         score++;
  if (/[^A-Za-z0-9]/.test(pw))  score++;
  return score; // 0–4
}

const STRENGTH_LABELS = ["", "Too simple", "Getting there", "Almost strong", "Strong ✓"];
const STRENGTH_COLORS = ["", "s1", "s2", "s3", "s4"];

let usernameTimer = null;

// ─── Component ────────────────────────────────────────────────────────────────
export default function Register() {
  const navigate = useNavigate();

  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [username, setUsername]     = useState("");
  const [showPw, setShowPw]         = useState(false);

  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState(false);

  // username availability
  const [usernameStatus, setUsernameStatus] = useState("idle"); // idle | checking | free | taken
  const [usernameTouched, setUsernameTouched] = useState(false);

  // ── username check (debounced) ──────────────────────────────────────────────
  function handleUsernameChange(e) {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, "");
    setUsername(val);
    setUsernameTouched(true);
    setUsernameStatus("idle");

    clearTimeout(usernameTimer);
    if (val.length < 3) return;

    setUsernameStatus("checking");
    usernameTimer = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", val)
        .maybeSingle();

      setUsernameStatus(data ? "taken" : "free");
    }, 450);
  }

  // ── submit ──────────────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // client-side guards
    if (username.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (usernameStatus === "taken") {
      setError("That username is already taken.");
      return;
    }
    if (passwordStrength(password) < 2) {
      setError("Please choose a stronger password (min 8 chars, mix of letters & numbers).");
      return;
    }

    setLoading(true);

    const { data, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { username }, // stored in raw_user_meta_data → picked up by trigger
      },
    });

    if (authError) {
      setLoading(false);
      if (authError.message.includes("already registered")) {
        setError("An account with this email already exists. Try signing in instead.");
      } else {
        setError(authError.message);
      }
      return;
    }

    // If email confirmation is disabled in Supabase → session exists immediately
    if (data?.session) {
      navigate("/feed");
      return;
    }

    // Email confirmation required → show success screen
    setLoading(false);
    setSuccess(true);
  }

  const pwScore   = passwordStrength(password);
  const canSubmit = email && password && username.length >= 3 &&
                    usernameStatus !== "taken" && !loading;

  // ── success state ───────────────────────────────────────────────────────────
  if (success) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="reg-root" style={{ gridTemplateColumns: "1fr" }}>
          <div className="reg-right">
            <div className="reg-form-wrap">
              <div className="reg-success">
                <div className="reg-success-icon">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M4 11.5l5 5 9-9" stroke="#7ec8b0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="reg-success-title">Check your inbox</div>
                <p className="reg-success-body">
                  We've sent a confirmation link to <strong style={{color:"var(--cream)"}}>{email}</strong>.<br/>
                  Click it to activate your account and start your wardrobe journal.
                </p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── main form ───────────────────────────────────────────────────────────────
  return (
    <>
      <style>{STYLES}</style>
      <div className="reg-root">

        {/* Left panel */}
        <div className="reg-left">
          <div className="reg-left-bg" />
          <div className="reg-left-noise" />
          <div className="reg-left-content">
            <div className="reg-wordmark">Dated</div>

            <div className="reg-steps">
              {[
                { label: "Create your account",  sub: "Email, username & password" },
                { label: "Verify your email",     sub: "One-click confirmation" },
                { label: "Capture day one",        sub: "Open the camera & start your journal" },
              ].map((s, i) => (
                <div key={i} className={`reg-step${i === 0 ? " active" : ""}`}>
                  <div className="reg-step-num">{i + 1}</div>
                  <div>
                    <div className="reg-step-label">{s.label}</div>
                    <div className="reg-step-sub">{s.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="reg-tagline">
              Every outfit tells<br />
              <em>a story worth keeping.</em>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="reg-right">
          <div className="reg-form-wrap">

            <h1 className="reg-heading">Create account</h1>
            <p className="reg-sub">
              Already have one? <Link to="/login">Sign in</Link>
            </p>

            {error && (
              <div className="reg-error" role="alert">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{flexShrink:0,marginTop:"1px"}}>
                  <circle cx="7.5" cy="7.5" r="7" stroke="#e07070" strokeWidth="1"/>
                  <path d="M7.5 4v4M7.5 10.5v.5" stroke="#e07070" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>

              {/* Username */}
              <div className="reg-field">
                <div className="reg-field-row">
                  <label className="reg-label" htmlFor="username">Username</label>
                  {usernameTouched && username.length >= 3 && (
                    <span className={`reg-avail ${usernameStatus === "checking" ? "checking" : usernameStatus === "taken" ? "taken" : "free"}`}>
                      {usernameStatus === "checking" ? "checking…"
                       : usernameStatus === "taken"  ? "taken"
                       : "available ✓"}
                    </span>
                  )}
                </div>
                <input
                  id="username"
                  className={`reg-input${usernameStatus === "taken" ? " field-error" : usernameStatus === "free" ? " field-ok" : ""}`}
                  type="text"
                  placeholder="your_handle"
                  autoComplete="username"
                  value={username}
                  onChange={handleUsernameChange}
                  maxLength={30}
                  disabled={loading}
                />
                {usernameTouched && username.length > 0 && username.length < 3 && (
                  <span className="reg-hint">At least 3 characters</span>
                )}
              </div>

              {/* Email */}
              <div className="reg-field">
                <label className="reg-label" htmlFor="email">Email</label>
                <input
                  id="email"
                  className="reg-input"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {/* Password */}
              <div className="reg-field">
                <label className="reg-label" htmlFor="password">Password</label>
                <div style={{position:"relative"}}>
                  <input
                    id="password"
                    className="reg-input"
                    type={showPw ? "text" : "password"}
                    placeholder="Min 8 characters"
                    autoComplete="new-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    style={{paddingRight:"2.8rem"}}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    style={{
                      position:"absolute", right:"0.75rem", top:"50%",
                      transform:"translateY(-50%)", background:"none", border:"none",
                      cursor:"pointer", color:"var(--dust)", padding:"4px",
                      display:"flex", alignItems:"center",
                    }}
                    tabIndex={-1}
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw
                      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
                {password.length > 0 && (
                  <>
                    <div className="reg-strength-bar">
                      {[1,2,3,4].map(n => (
                        <div key={n} className={`reg-strength-seg${pwScore >= n ? " " + STRENGTH_COLORS[pwScore] : ""}`} />
                      ))}
                    </div>
                    <div className="reg-strength-label">{STRENGTH_LABELS[pwScore]}</div>
                  </>
                )}
              </div>

              <button className="reg-btn-submit" type="submit" disabled={!canSubmit}>
                {loading
                  ? <><span className="reg-spinner" /> Creating account…</>
                  : "Create account"
                }
              </button>
            </form>

            <p className="reg-footer">
              By continuing you agree to Dated's Terms &amp; Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

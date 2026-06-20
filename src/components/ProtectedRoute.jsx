import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Wrap any route that requires authentication.
 *
 * Usage in App.jsx:
 *   <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
 *
 * While the session is loading (page refresh / OAuth redirect returning),
 * renders a minimal full-screen spinner so the user never sees a flash to /login.
 */
export default function ProtectedRoute({ children }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  // Still hydrating — don't redirect yet
  if (loading) return <AuthLoadingScreen />;

  // Not authenticated → send to login, preserving the intended path
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// ─── Minimal loading screen ───────────────────────────────────────────────────
const SPINNER_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300&display=swap');
  .auth-loading {
    min-height: 100svh;
    background: #0d0b08;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 1.5rem;
  }
  .auth-loading-wordmark {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.5rem; font-weight: 300;
    letter-spacing: 0.3em; text-transform: uppercase;
    color: #f5f0e8; opacity: 0.6;
  }
  .auth-loading-ring {
    width: 28px; height: 28px;
    border: 1.5px solid rgba(184,149,90,0.2);
    border-top-color: #b8955a;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

function AuthLoadingScreen() {
  return (
    <>
      <style>{SPINNER_STYLES}</style>
      <div className="auth-loading">
        <div className="auth-loading-wordmark">Dated</div>
        <div className="auth-loading-ring" />
      </div>
    </>
  );
}

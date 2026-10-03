import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import AuthCard from "../components/AuthCard";
import { useAuth } from "../context/AuthContext";

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="7" r="4.2" fill="currentColor" />
      <path d="M3.5 21c.55-4.65 3.35-7 8.5-7s7.95 2.35 8.5 7H3.5Z" fill="currentColor" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7.25 10V7.2a4.75 4.75 0 0 1 9.5 0V10h1.1c.92 0 1.65.73 1.65 1.65v8.7c0 .92-.73 1.65-1.65 1.65H6.15c-.92 0-1.65-.73-1.65-1.65v-8.7c0-.92.73-1.65 1.65-1.65h1.1Zm2.1 0h5.3V7.2a2.65 2.65 0 0 0-5.3 0V10Zm2.65 3.1a1.65 1.65 0 0 0-.9 3.03v1.72h1.8v-1.72a1.65 1.65 0 0 0-.9-3.03Z" fill="currentColor" />
    </svg>
  );
}

function EyeIcon({ hidden }) {
  return hidden ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m3 3 18 18" />
      <path d="M10.6 6.2A10.8 10.8 0 0 1 12 6c6.5 0 10 6 10 6a18 18 0 0 1-3.1 3.7" />
      <path d="M6.2 6.2C3.6 8 2 12 2 12s3.5 6 10 6c1.3 0 2.5-.2 3.5-.7" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const session = await signIn(email, password);
      setIsAuthenticating(true);
      window.setTimeout(() => navigate(session.profile.role === "admin" ? "/admin" : (location.state?.from?.pathname || "/")), 1350);
    } catch (error) {
      setErrorMessage(error.message || "Unable to log in.");
      setIsSubmitting(false);
    }
  };

  return (
    <main className={`login-page ${isAuthenticating ? "login-is-authenticating" : ""}`}>
      <aside className="login-visual" aria-label="West Rand Judo Association">
        <div className="login-visual-content">
          <p className="login-kicker">WEST RAND JUDO ASSOCIATION</p>
          <h1>Strength is built<br /><span>one throw at a time.</span></h1>
          <p className="login-visual-copy">
            Train with purpose, grow with your club, and find your place on the mat.
          </p>
          <div className="login-visual-rule" aria-hidden="true" />
          <p className="login-visual-caption">JUDO • DISCIPLINE • COMMUNITY</p>
        </div>
      </aside>
      <AuthCard
        title="Welcome back"
        subtitle="Sign in to continue your journey on the mat."
        footer={
          <p>
            Don&apos;t have an account? <Link to="/signup">Sign Up</Link>
          </p>
        }
      >
        {location.state?.justSignedUp && (
          <p className="auth-success">
            Account created! Check your email to confirm, then log in below.
          </p>
        )}

        <form className="reference-auth-form login-reference-form" onSubmit={handleSubmit}>
          <div className="reference-input login-field login-field-0">
            <span className="reference-input-icon"><UserIcon /></span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email or Username"
              aria-label="Email address"
              required
            />
          </div>

          <div className="reference-input login-field login-field-1">
            <span className="reference-input-icon"><LockIcon /></span>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              aria-label="Password"
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <EyeIcon hidden={!showPassword} />
            </button>
          </div>

          <div className="reference-form-options">
            <label className="reference-remember">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>
            <Link to="/forgot-password" className="reference-forgot">
              Forgot Password?
            </Link>
          </div>

          {errorMessage && <p className="auth-error">{errorMessage}</p>}

          <button
            type="submit"
            className="reference-login-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
          {isAuthenticating && <p className="login-auth-signal" role="status">Securing your club access...</p>}
        </form>

      </AuthCard>
    </main>
  );
}

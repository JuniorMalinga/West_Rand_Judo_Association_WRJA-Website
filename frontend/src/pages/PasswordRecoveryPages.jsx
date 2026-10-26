import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import AuthCard from "../components/AuthCard";
import { api } from "../lib/api";

function PasswordRecoveryLayout({ title, subtitle, footer, children }) {
  return (
    <main className="login-page password-recovery-page">
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
      <AuthCard title={title} subtitle={subtitle} footer={footer}>
        {children}
      </AuthCard>
    </main>
  );
}

export function ForgotPasswordPage() {
  const location = useLocation();
  const [stage, setStage] = useState("details");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(location.state?.email || "");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [accountNotFound, setAccountNotFound] = useState(false);
  const [expiresAt, setExpiresAt] = useState(0);
  const [nextResendAt, setNextResendAt] = useState(0);
  const [clock, setClock] = useState(Date.now());

  useEffect(() => {
    if (stage !== "code") return undefined;
    const interval = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [stage]);

  useEffect(() => {
    if (!errorMessage && !statusMessage) return undefined;
    const timeout = window.setTimeout(() => {
      setErrorMessage("");
      setStatusMessage("");
      setAccountNotFound(false);
    }, 15_000);
    return () => window.clearTimeout(timeout);
  }, [errorMessage, statusMessage]);

  const secondsUntilExpiry = Math.max(0, Math.ceil((expiresAt - clock) / 1000));
  const secondsUntilResend = Math.max(0, Math.ceil((nextResendAt - clock) / 1000));
  const formatTimer = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  const requestCode = async () => {
    setBusy(true);
    setErrorMessage("");
    setStatusMessage("");
    setAccountNotFound(false);
    try {
      const response = await api("/api/auth/password-reset-request", {
        method: "POST",
        body: { fullName, email, phone },
      });
      setStatusMessage(response.message);
      setCode("");
      setExpiresAt(Date.parse(response.expiresAt));
      setNextResendAt(Date.parse(response.nextResendAt));
      setClock(Date.now());
      setStage("code");
    } catch (error) {
      setErrorMessage(error.message || "Unable to request a reset code. Please try again.");
      setAccountNotFound(error.status === 404);
      if (error.status === 429 && error.data?.retryAfterSeconds) {
        setNextResendAt(Date.now() + error.data.retryAfterSeconds * 1000);
      }
    } finally {
      setBusy(false);
    }

  };

  const handleRequest = async (event) => {
    event.preventDefault();
    await requestCode();
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    setBusy(true);
    setErrorMessage("");
    setStatusMessage("");
    try {
      if (secondsUntilExpiry <= 0) {
        setErrorMessage("This reset code has expired. Request another code when the resend timer allows.");
        return;
      }
      const response = await api("/api/auth/password-reset-verify", {
        method: "POST",
        body: { email, code },
      });
      setResetToken(response.resetToken);
      setStage("password");
    } catch (error) {
      setErrorMessage(error.message || "That code could not be verified. Request a new one and try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setStatusMessage("");
    if (newPassword !== confirmPassword) {
      setErrorMessage("Your passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      await api("/api/auth/password-reset-complete", {
        method: "POST",
        body: { email, resetToken, newPassword },
      });
      setStage("done");
    } catch (error) {
      setErrorMessage(error.message || "Unable to reset your password. Request a new code and try again.");
    } finally {
      setBusy(false);
    }
  };

  const footer = <p><Link to="/login">Back to login</Link></p>;

  if (stage === "done") {
    return (
      <PasswordRecoveryLayout
        title="Password updated"
        subtitle="Your password has been reset. You can now sign in with your new password."
        footer={footer}
      >
        <Link className="reference-login-button recovery-button-link" to="/login">Return to sign in</Link>
      </PasswordRecoveryLayout>
    );
  }

  if (stage === "password") {
    return (
      <PasswordRecoveryLayout
        title="Choose a new password"
        subtitle="Set a password you have not used for this account before."
        footer={footer}
      >
        <form className="reference-auth-form recovery-form" onSubmit={handleReset}>
          <label className="recovery-field-label" htmlFor="recovery-new-password">New password</label>
          <div className="reference-input">
            <input
              id="recovery-new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              minLength={8}
              maxLength={128}
              required
            />
          </div>
          <label className="recovery-field-label" htmlFor="recovery-confirm-password">Confirm new password</label>
          <div className="reference-input">
            <input
              id="recovery-confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              minLength={8}
              maxLength={128}
              required
            />
          </div>
          <p className="recovery-hint">Use at least 8 characters, including a letter and a number.</p>
          {errorMessage && <p className="auth-error" role="alert">{errorMessage}</p>}
          <button type="submit" className="reference-login-button" disabled={busy}>
            {busy ? "Updating password…" : "Reset password"}
          </button>
        </form>
      </PasswordRecoveryLayout>
    );
  }

  if (stage === "code") {
    return (
      <PasswordRecoveryLayout
        title="Check your email"
        subtitle="Enter the code sent to the email address on your WRJA account."
        footer={footer}
      >
        <form className="reference-auth-form recovery-form" onSubmit={handleVerify}>
          {statusMessage && <p className="auth-success" role="status">{statusMessage}</p>}
          <label className="recovery-field-label" htmlFor="recovery-code">Code from email</label>
          <div className="reference-input">
            <input
              id="recovery-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6,12}"
              maxLength={12}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 12))}
              placeholder="Enter code"
              required
            />
          </div>
          <p className="recovery-hint" role="timer" aria-live="off">
            {secondsUntilExpiry > 0
              ? `This code expires in ${formatTimer(secondsUntilExpiry)}.`
              : "This code has expired."}
            {" "}{secondsUntilResend > 0
              ? `You can request another in ${formatTimer(secondsUntilResend)}.`
              : "You can request another code now."}
          </p>
          {errorMessage && <p className="auth-error" role="alert">{errorMessage}</p>}
          <button type="submit" className="reference-login-button" disabled={busy || code.length < 6 || secondsUntilExpiry <= 0}>
            {busy ? "Checking code…" : "Verify code"}
          </button>
          <button type="button" className="recovery-text-button" onClick={requestCode} disabled={busy || secondsUntilResend > 0}>
            {busy ? "Sending…" : secondsUntilResend > 0 ? `Resend code in ${formatTimer(secondsUntilResend)}` : "Resend code"}
          </button>
          <button
            type="button"
            className="recovery-text-button"
            onClick={() => { setStage("details"); setErrorMessage(""); setStatusMessage(""); }}
          >
            Use different account details
          </button>
        </form>
      </PasswordRecoveryLayout>
    );
  }

  return (
    <PasswordRecoveryLayout
      title="Reset your password"
      subtitle="Enter the account details below. If they match an active account, we’ll email you a one-time code."
      footer={footer}
    >
      <form className="reference-auth-form recovery-form" onSubmit={handleRequest}>
        <label className="recovery-field-label" htmlFor="recovery-name">Full name</label>
        <div className="reference-input">
          <input
            id="recovery-name"
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Your full name"
            required
          />
        </div>
        <label className="recovery-field-label" htmlFor="recovery-email">Account email</label>
        <div className="reference-input">
          <input
            id="recovery-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="The email used for your account"
            required
          />
        </div>
        <label className="recovery-field-label" htmlFor="recovery-phone">Phone number (optional)</label>
        <div className="reference-input">
          <input
            id="recovery-phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Phone number on your WRJA account"
          />
        </div>
        {errorMessage && <p className="auth-error" role="alert">{errorMessage}</p>}
        {accountNotFound && <p className="recovery-hint">Need an account? <Link className="recovery-signup-link" to="/signup">Create one here</Link>.</p>}
        <button type="submit" className="reference-login-button" disabled={busy}>
          {busy ? "Sending code…" : "Send reset code"}
        </button>
      </form>
    </PasswordRecoveryLayout>
  );
}

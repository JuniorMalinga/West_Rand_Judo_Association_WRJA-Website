import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthCard from "../components/AuthCard";
import { useAuth } from "../context/AuthContext";

function calculateAge(dateOfBirth) {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

function FieldIcon({ type }) {
  if (type === "lock") return <svg className="signup-icon signup-icon-lock" viewBox="0 0 24 24" aria-hidden="true"><path d="M7.25 10V7.2a4.75 4.75 0 0 1 9.5 0V10h1.1c.92 0 1.65.73 1.65 1.65v8.7c0 .92-.73 1.65-1.65 1.65H6.15c-.92 0-1.65-.73-1.65-1.65v-8.7c0-.92.73-1.65 1.65-1.65h1.1Zm2.1 0h5.3V7.2a2.65 2.65 0 0 0-5.3 0V10Z" fill="currentColor" /></svg>;
  if (type === "calendar") return <svg className="signup-icon signup-icon-calendar" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="16" rx="2" fill="none" /><path d="M7 3.5v4M17 3.5v4M3.5 9h17" fill="none" /></svg>;
  return <svg className="signup-icon signup-icon-person" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="4.2" fill="currentColor" /><path d="M3.5 21c.55-4.65 3.35-7 8.5-7s7.95 2.35 8.5 7H3.5Z" fill="currentColor" /></svg>;
}

function SignupField({ icon, label, type = "text", value, onChange, placeholder, required = true, animationIndex }) {
  return <label className={`signup-field signup-field-${animationIndex}`}><span className="signup-label">{label}</span><span className="reference-input"><span className="reference-input-icon"><FieldIcon type={icon} /></span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} /></span></label>;
}

export default function SignupPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [role, setRole] = useState("athlete");
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", dateOfBirth: "", password: "", confirmPassword: "" });
  const [accepted, setAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const update = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    if (form.password !== form.confirmPassword) return setErrorMessage("Passwords don't match.");
    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) return setErrorMessage("Your password must be at least 8 characters and include a letter and a number.");
    if (!accepted) return setErrorMessage("Please accept the club's terms and privacy policy.");
    if (role === "athlete") {
      if (!form.dateOfBirth) return setErrorMessage("Please enter your date of birth.");
      if (calculateAge(form.dateOfBirth) < 18) return setErrorMessage('Athletes under 18 need a parent or guardian to create the account instead — select "Parent / Guardian" above.');
    }
    setIsSubmitting(true);
    try {
      await signUp({ firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone || null, dateOfBirth: role === "athlete" ? form.dateOfBirth : null, password: form.password, role });
      setIsConfirming(true);
      window.setTimeout(() => setShowSuccess(true), 1500);
    } catch (error) {
      setErrorMessage(error.message || "Unable to create your account.");
      setIsSubmitting(false);
    }
  };

  return <main className={`signup-page login-page ${isConfirming ? "signup-is-confirming" : ""} ${showSuccess ? "signup-is-success" : ""}`}>
    <aside className="login-visual" aria-label="West Rand Judo Association">
      <div className="login-visual-content"><p className="login-kicker">WEST RAND JUDO ASSOCIATION</p><h1>Find your<br /><span>place on the mat.</span></h1><p className="login-visual-copy">Join a club built on discipline, confidence, and community.</p><div className="login-visual-rule" aria-hidden="true" /><p className="login-visual-caption">JUDO • DISCIPLINE • COMMUNITY</p></div>
    </aside>
    <AuthCard title={showSuccess ? "You're in" : "Join the club"} subtitle={showSuccess ? "Your WRJA account is ready. Welcome to the club." : "Create your WRJA account and start your journey on the mat."} footer={showSuccess ? <p><Link to="/login" state={{ justSignedUp: true }}>Continue to login</Link></p> : <p>Already have an account? <Link to="/login">Log in</Link></p>}>
      {showSuccess ? <div className="signup-success-content" role="status"><div className="signup-success-mark">✓</div><p>Your account has been created successfully.</p><button type="button" className="reference-login-button" onClick={() => navigate("/login", { state: { justSignedUp: true } })}>Continue</button></div> : <form className="reference-auth-form signup-reference-form" onSubmit={handleSubmit}>
        <div className="auth-role-toggle reference-role-toggle" role="radiogroup" aria-label="Account type"><button type="button" className={role === "athlete" ? "auth-role-active" : ""} onClick={() => setRole("athlete")}>Athlete (18+)</button><button type="button" className={role === "guardian" ? "auth-role-active" : ""} onClick={() => setRole("guardian")}>Parent / Guardian</button></div>
        <div className="signup-grid-two"><SignupField animationIndex="0" icon="person" label="First name" value={form.firstName} onChange={update("firstName")} placeholder="First name" /><SignupField animationIndex="1" icon="person" label="Last name" value={form.lastName} onChange={update("lastName")} placeholder="Last name" /></div>
        <div className="signup-grid-two"><SignupField animationIndex="2" icon="person" label="Email address" type="email" value={form.email} onChange={update("email")} placeholder="you@example.com" /><SignupField animationIndex="3" icon="person" label="Phone number" type="tel" value={form.phone} onChange={update("phone")} placeholder="Optional" required={false} /></div>
        {role === "athlete" && <SignupField animationIndex="4" icon="calendar" label="Date of birth" type="date" value={form.dateOfBirth} onChange={update("dateOfBirth")} />}
        <div className="signup-grid-two"><SignupField animationIndex="5" icon="lock" label="Password" type="password" value={form.password} onChange={update("password")} placeholder="At least 8 characters" /><SignupField animationIndex="6" icon="lock" label="Confirm password" type="password" value={form.confirmPassword} onChange={update("confirmPassword")} placeholder="Repeat password" /></div>
        <label className="reference-remember signup-terms"><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} required /><span>I agree to the club&apos;s terms and privacy policy.</span></label>
        {errorMessage && <p className="auth-error">{errorMessage}</p>}
        <button type="submit" className="reference-login-button" disabled={isSubmitting}>{isSubmitting ? "Creating account..." : "Create account"}</button>
      </form>}
    </AuthCard>
  </main>;
}

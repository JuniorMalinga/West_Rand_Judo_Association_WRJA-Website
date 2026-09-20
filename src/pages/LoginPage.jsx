import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import AuthCard from "../components/AuthCard";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const result = await signIn(email, password);
      setIsSubmitting(false);
      navigate(result?.profile?.role === "administrator" ? "/admin" : "/");
    } catch (error) {
      setIsSubmitting(false);
      setErrorMessage(error.message);
      return;
    }
  };

  return (
    <div className="login-page">
      <PageHeader title="Login" />

      <AuthCard
        title="Welcome back"
        subtitle="Log in to manage your registrations, view grading history, and stay up to date with the club."
        footer={
          <p>
            Don&apos;t have an account? <Link to="/signup">Sign up</Link>
          </p>
        }
      >
        {location.state?.justSignedUp && (
          <p className="auth-success">
            Account created! Check your email to confirm, then log in below.
          </p>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
              required
            />
          </label>

          <div className="auth-form-row">
            <label className="auth-checkbox">
              <input type="checkbox" />
              Remember me
            </label>

            <a href="#" className="auth-forgot-link">
              Forgot password?
            </a>
          </div>

          {errorMessage && (
            <p className="auth-error">{errorMessage}</p>
          )}

          <button
            type="submit"
            className="btn btn-accent btn-lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Logging in..." : "Log in"}
          </button>
        </form>
      </AuthCard>
    </div>
  );
}
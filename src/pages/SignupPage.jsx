import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import AuthCard from "../components/AuthCard";
import { useAuth } from "../context/AuthContext";

function calculateAge(dateOfBirth) {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < dob.getDate())
  ) {
    age--;
  }

  return age;
}

export default function SignupPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState("athlete");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { signUp } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("Passwords don't match.");
      return;
    }

    if (role === "athlete") {
      if (!dateOfBirth) {
        setErrorMessage("Please enter your date of birth.");
        return;
      }

      if (calculateAge(dateOfBirth) < 18) {
        setErrorMessage(
          'Athletes under 18 need a parent or guardian to create the account instead — select "Parent / Guardian" above.'
        );
        return;
      }
    }

    if (!termsAccepted) {
      setErrorMessage("Please agree to the club's terms and privacy policy.");
      return;
    }

    setIsSubmitting(true);

    try {
      await signUp({
        firstName,
        lastName,
        email,
        phone,
        dateOfBirth: role === "athlete" ? dateOfBirth : null,
        password,
        role,
        termsAccepted,
      });
      setIsSubmitting(false);
      navigate("/login", { state: { justSignedUp: true } });
    } catch (error) {
      setIsSubmitting(false);
      setErrorMessage(error.message || "Failed to create account.");
      return;
    }
  };

  return (
    <div className="signup-page">
      <PageHeader title="Sign up" />

      <AuthCard
        title="Create your account"
        subtitle="Register as an athlete (18+), or as a parent/guardian managing a child's membership."
        footer={
          <p>
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        }
      >
        <form className="auth-form" onSubmit={handleSubmit}>
          <div
            className="auth-role-toggle"
            role="radiogroup"
            aria-label="Account type"
          >
            <button
              type="button"
              className={
                role === "athlete" ? "auth-role-active" : ""
              }
              onClick={() => setRole("athlete")}
            >
              Athlete (18+)
            </button>

            <button
              type="button"
              className={
                role === "guardian" ? "auth-role-active" : ""
              }
              onClick={() => setRole("guardian")}
            >
              Parent / Guardian
            </button>
          </div>

          <div className="auth-form-row-2">
            <label>
              First name
              <input
                type="text"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                required
              />
            </label>

            <label>
              Last name
              <input
                type="text"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                required
              />
            </label>
          </div>

          {role === "athlete" && (
            <label>
              Date of birth
              <input
                type="date"
                value={dateOfBirth}
                onChange={(event) => setDateOfBirth(event.target.value)}
                required
              />
            </label>
          )}

          <div className="auth-form-row-2">
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
              Phone number
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Your phone number"
              />
            </label>
          </div>

          <div className="auth-form-row-2">
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Create a password"
                minLength={6}
                required
              />
            </label>

            <label>
              Confirm password
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                placeholder="Confirm your password"
                minLength={6}
                required
              />
            </label>
          </div>

          <label className="auth-checkbox">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(event) => setTermsAccepted(event.target.checked)}
              required
            />
            I agree to the club's terms and privacy policy
          </label>

          {errorMessage && (
            <p className="auth-error">{errorMessage}</p>
          )}

          <button
            type="submit"
            className="btn btn-accent btn-lg"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Creating account..."
              : "Create account"}
          </button>
        </form>
      </AuthCard>
    </div>
  );
}
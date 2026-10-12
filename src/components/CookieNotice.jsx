import { useEffect, useState } from "react";

const CONSENT_KEY = "wrja-essential-cookie-notice";

export default function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(window.localStorage.getItem(CONSENT_KEY) !== "acknowledged");
    } catch {
      setVisible(true);
    }
  }, []);

  const acknowledge = () => {
    try {
      window.localStorage.setItem(CONSENT_KEY, "acknowledged");
    } catch {
      // The notice can still be dismissed for this visit if storage is blocked.
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside className="cookie-notice" role="region" aria-label="Cookie notice">
      <div className="cookie-notice-copy">
        <p className="eyebrow">YOUR PRIVACY</p>
        <h2>Cookies on this website</h2>
        <p>WRJA uses essential cookies to keep you signed in and protect your account.</p>
      </div>
      <button type="button" className="btn btn-accent" onClick={acknowledge}>Continue</button>
    </aside>
  );
}

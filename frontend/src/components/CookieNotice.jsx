import { useEffect, useState } from "react";
import {
  savePrivacyPreferences,
  subscribeToPrivacySettings,
  usePrivacyPreferences,
} from "../lib/privacyPreferences";

export default function CookieNotice() {
  const preferences = usePrivacyPreferences();
  const [customizing, setCustomizing] = useState(false);
  const [analytics, setAnalytics] = useState(preferences.analytics);
  const [externalContent, setExternalContent] = useState(preferences.externalContent);
  const [error, setError] = useState("");

  useEffect(() => {
    const openSettings = () => {
      setAnalytics(preferences.analytics);
      setExternalContent(preferences.externalContent);
      setCustomizing(true);
      setError("");
    };
    return subscribeToPrivacySettings(openSettings);
  }, [preferences.analytics, preferences.externalContent]);

  useEffect(() => {
    setAnalytics(preferences.analytics);
    setExternalContent(preferences.externalContent);
  }, [preferences.analytics, preferences.externalContent]);

  const save = (nextAnalytics, nextExternalContent) => {
    setError("");
    try {
      savePrivacyPreferences({
        analytics: nextAnalytics,
        externalContent: nextExternalContent,
      });
      setCustomizing(false);
    } catch {
      setError("Your preferences could not be saved. Check your browser storage settings and try again.");
    }
  };

  if (preferences.saved && !customizing) return null;

  return (
    <aside className="cookie-notice" role="region" aria-label="Privacy preferences">
      <div className="cookie-notice-copy">
        <p className="eyebrow">YOUR PRIVACY</p>
        <h2>Privacy and cookie preferences</h2>
        <p>
          Essential sign-in cookies are always active. With your permission,
          WRJA also uses performance analytics and loads the optional Mapbox map.
          You can change your choice at any time.
        </p>
        <p><a href="/privacy">Read our privacy notice</a></p>
        {customizing && (
          <fieldset className="privacy-preference-options">
            <legend>Optional services</legend>
            <label>
              <input type="checkbox" checked disabled />
              Essential session cookies (always active)
            </label>
            <label>
              <input
                type="checkbox"
                checked={analytics}
                onChange={(event) => setAnalytics(event.target.checked)}
              />
              Performance analytics (Vercel Speed Insights)
            </label>
            <label>
              <input
                type="checkbox"
                checked={externalContent}
                onChange={(event) => setExternalContent(event.target.checked)}
              />
              Optional external content (Mapbox map)
            </label>
          </fieldset>
        )}
        {error && <p className="privacy-preference-error" role="alert">{error}</p>}
      </div>
      <div className="cookie-notice-actions">
        {customizing ? (
          <>
            <button type="button" className="btn btn-outline-dark" onClick={() => save(analytics, externalContent)}>
              Save choices
            </button>
            <button type="button" className="btn btn-outline-dark" onClick={() => save(false, false)}>
              Reject optional
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setCustomizing(false)}>
              Cancel
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn btn-accent" onClick={() => save(true, true)}>
              Accept all
            </button>
            <button type="button" className="btn btn-outline-dark" onClick={() => save(false, false)}>
              Reject optional
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setCustomizing(true)}>
              Customize
            </button>
          </>
        )}
      </div>
    </aside>
  );
}

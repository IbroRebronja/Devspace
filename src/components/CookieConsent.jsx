
import { useEffect, useState } from "react";
import "./CookieConsent.css";

const STORAGE_KEY = "devspace-cookie-preferences";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) setVisible(true);
    } catch {
      // Consent UI remains usable if browser storage is unavailable.
      setVisible(true);
    }
  }, []);

  function savePreferences(allowAnalytics) {
    const preferences = {
      necessary: true,
      analytics: allowAnalytics,
      updatedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // Do not prevent the user from dismissing the banner.
    }

    setVisible(false);
    setSettingsOpen(false);
  }

  if (!visible) return null;

  return (
    <section
      className="cookie-banner"
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-title"
      aria-describedby="cookie-description"
    >
      <div className="cookie-copy">
        <h2 id="cookie-title">Your privacy matters</h2>
        <p id="cookie-description">
          DevSpace uses necessary browser storage for preferences.
          Optional analytics are currently disabled. You can choose
          whether to allow them.
        </p>
        <a href="/cookies">Read our Cookie Policy</a>
      </div>

      {settingsOpen && (
        <div className="cookie-settings">
          <label>
            <input type="checkbox" checked disabled />
            Necessary storage
            <span>Required for basic site functionality.</span>
          </label>

          <label>
            <input
              type="checkbox"
              checked={analytics}
              onChange={(event) => setAnalytics(event.target.checked)}
            />
            Analytics
            <span>
              Optional usage measurement. No analytics service is
              currently loaded by this application.
            </span>
          </label>
        </div>
      )}

      <div className="cookie-actions">
        <button
          type="button"
          className="cookie-button secondary"
          onClick={() => savePreferences(false)}
        >
          Reject optional
        </button>

        {settingsOpen ? (
          <button
            type="button"
            className="cookie-button primary"
            onClick={() => savePreferences(analytics)}
          >
            Save choices
          </button>
        ) : (
          <button
            type="button"
            className="cookie-button secondary"
            onClick={() => setSettingsOpen(true)}
          >
            Settings
          </button>
        )}

        <button
          type="button"
          className="cookie-button primary"
          onClick={() => savePreferences(true)}
        >
          Accept all
        </button>
      </div>
    </section>
  );
}


import React, { useState } from "react";

export default function DataControls() {
  const [message, setMessage] = useState("");

  function clearDevSpacePreferences() {
    const confirmed = window.confirm(
      "Clear DevSpace preferences stored in this browser?"
    );

    if (!confirmed) return;

    try {
      localStorage.removeItem("devspace-cookie-preferences");
      setMessage("DevSpace preferences have been cleared.");
    } catch {
      setMessage("Browser storage could not be accessed.");
    }
  }

  return (
    <section aria-labelledby="data-controls-title">
      <h2 id="data-controls-title">Your data</h2>
      <p>
        Clear the preferences DevSpace stores in this browser.
        This does not delete browser history or data held by
        other websites.
      </p>

      <button type="button" onClick={clearDevSpacePreferences}>
        Clear DevSpace preferences
      </button>

      <p role="status" aria-live="polite">{message}</p>
    </section>
  );
}

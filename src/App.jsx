
import React, { useEffect, useState } from "react";
import Dashboard from "./pages/Dashboard";
import LegalPage from "./pages/LegalPage";
import CookieConsent from "./components/CookieConsent";
import Auth from "./components/Auth";
import { authAPI } from "./services/api";

const legalPaths = [
  "/privacy",
  "/terms",
  "/refunds",
  "/cookies",
];

function App() {
  const isLegalPage = legalPaths.includes(window.location.pathname);
  const searchParams = new URLSearchParams(window.location.search);
  const hasAuthAction = searchParams.has("verifyEmail") || searchParams.has("resetPassword");

  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    if (isLegalPage || hasAuthAction) {
      setCheckingSession(false);
      return;
    }

    async function checkSession() {
      try {
        const result = await authAPI.getMe();
        setUser(result.user);
      } catch (error) {
        setUser(null);
      } finally {
        setCheckingSession(false);
      }
    }

    checkSession();
  }, [isLegalPage, hasAuthAction]);

  async function handleLogout() {
    try {
      await authAPI.logout();
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  if (isLegalPage) {
    return (
      <>
        <LegalPage />
        <CookieConsent />
      </>
    );
  }

  if (checkingSession) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0b0d12",
        color: "#ffffff",
        fontFamily: "inherit"
      }}>
        Loading DevSpace...
      </div>
    );
  }

  return (
    <>
      {user && !hasAuthAction ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <Auth onLogin={setUser} />
      )}

      <CookieConsent />
    </>
  );
}

export default App;

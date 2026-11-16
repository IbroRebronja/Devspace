
import React from "react";
import Dashboard from "./pages/Dashboard";
import LegalPage from "./pages/LegalPage";
import CookieConsent from "./components/CookieConsent";

const legalPaths = [
  "/privacy",
  "/terms",
  "/refunds",
  "/cookies",
];

function App() {
  const isLegalPage = legalPaths.includes(window.location.pathname);

  return (
    <>
      {isLegalPage ? <LegalPage /> : <Dashboard />}
      <CookieConsent />
    </>
  );
}

export default App;

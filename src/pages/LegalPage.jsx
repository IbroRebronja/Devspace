import "./LegalPage.css";
import React from "react";

const legalContent = {
  "/privacy": {
    title: "Privacy Policy",
    updated: "16 November 2026",
    sections: [
      {
        heading: "1. Who operates DevSpace?",
        body: `DevSpace is operated by [LEGAL BUSINESS NAME],
        located at [BUSINESS ADDRESS]. Contact:
        [PRIVACY CONTACT EMAIL]. Replace these placeholders
        before publishing.`,
      },
      {
        heading: "2. Information we process",
        body: `The current dashboard displays sample project data
        in the browser. It does not currently provide user
        registration, a remote account database or a payment
        system. Browser storage may be used for local preferences,
        such as cookie choices. Update this section if you add
        analytics, accounts, hosting logs or other services.`,
      },
      {
        heading: "3. Why information is processed",
        body: `Information should only be processed where needed
        to operate the service, protect it, respond to requests
        or meet legal obligations. Document the actual purposes
        and legal bases before launch.`,
      },
      {
        heading: "4. Third-party services",
        body: `The current application imports React and React DOM
        and uses Vite during development. The page also references
        Google Fonts. Review hosting, font delivery, analytics and
        any other external services before publishing this policy.`,
      },
      {
        heading: "5. Your rights",
        body: `Depending on applicable law, you may have rights to
        access, correct, delete, restrict or object to processing
        of personal information, and to lodge a complaint with
        your data protection authority.`,
      },
      {
        heading: "6. Contact",
        body: `For privacy questions or requests, contact
        [PRIVACY CONTACT EMAIL].`,
      },
    ],
  },

  "/terms": {
    title: "Terms of Service",
    updated: "16 November 2026",
    sections: [
      {
        heading: "1. Using DevSpace",
        body: `These terms govern your use of DevSpace.
        Replace this template with terms that accurately
        describe your service, operator and users.`,
      },
      {
        heading: "2. Acceptable use",
        body: `Do not use the service to violate applicable law,
        interfere with its operation, access other people's
        information without permission or attempt to compromise
        its security.`,
      },
      {
        heading: "3. Availability",
        body: `The service is provided subject to applicable law.
        Do not promise uninterrupted availability unless you
        can actually provide it.`,
      },
      {
        heading: "4. Intellectual property",
        body: `Identify who owns the software, branding and
        content, and explain what rights users receive.`,
      },
      {
        heading: "5. Contact",
        body: `Contact [BUSINESS EMAIL] with questions about
        these terms.`,
      },
    ],
  },

  "/refunds": {
    title: "Refund Policy",
    updated: "16 November 2026",
    sections: [
      {
        heading: "1. Current payment status",
        body: `The current DevSpace repository does not show
        a payment or subscription system. This policy must
        be completed before introducing paid products.`,
      },
      {
        heading: "2. Refund requests",
        body: `If paid services are introduced, explain the
        applicable refund process, time limits, cancellation
        procedure and contact details here.`,
      },
      {
        heading: "3. Statutory rights",
        body: `Nothing in this policy is intended to remove
        mandatory consumer rights. If offering services to
        consumers in the European Union, obtain legal advice
        on applicable withdrawal and digital-content rules.`,
      },
    ],
  },

  "/cookies": {
    title: "Cookie Policy",
    updated: "16 November 2026",
    sections: [
      {
        heading: "1. Browser storage",
        body: `The current application uses localStorage to
        remember your cookie preference. This is browser
        storage, not necessarily a conventional HTTP cookie.`,
      },
      {
        heading: "2. Necessary storage",
        body: `The saved preference records whether optional
        storage has been accepted or rejected. The application
        does not currently load an analytics service.`,
      },
      {
        heading: "3. Optional technologies",
        body: `If analytics, advertising, embedded media or
        other optional technologies are introduced, list each
        technology, its provider, purpose, duration and the
        relevant consent mechanism here.`,
      },
      {
        heading: "4. Changing your choice",
        body: `You can change your choice by clearing the
        DevSpace cookie preference in your browser. A permanent
        preference control should also be provided in the
        application settings.`,
      },
    ],
  },
};

export default function LegalPage() {
  const page = legalContent[window.location.pathname];

  if (!page) {
    return (
      <main className="legal-page">
        <h1>Page not found</h1>
        <a href="/">Return to DevSpace</a>
      </main>
    );
  }

  return (
    <main className="legal-page">
      <a href="/" className="legal-back">← Back to DevSpace</a>
      <h1>{page.title}</h1>
      <p className="legal-updated">
        Last updated: {page.updated}
      </p>

      {page.sections.map((section) => (
        <section key={section.heading}>
          <h2>{section.heading}</h2>
          <p>{section.body}</p>
        </section>
      ))}

      <p className="legal-notice">
        This page is a draft template, not legal advice.
        Complete and review it against your actual business
        and data processing activities before publication.
      </p>
    </main>
  );
}

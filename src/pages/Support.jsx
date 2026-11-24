import React from "react";
import "./Support.css";

const helpTopics = [
  {
    number: "01",
    title: "Projects and tasks",
    description: "Create projects, organize work into tasks, update progress and keep project details in one place.",
    location: "My Projects",
  },
  {
    number: "02",
    title: "Deadlines and planning",
    description: "Use the Calendar page to review project deadlines and identify what is overdue or coming up.",
    location: "Calendar",
  },
  {
    number: "03",
    title: "GitHub connection",
    description: "Connect your GitHub account and review repository information, activity and contribution history.",
    location: "Settings",
  },
];

const questions = [
  {
    question: "Where do I create or edit a project?",
    answer: "Open My Projects from the sidebar. From there you can create projects, update their details, manage tasks and review progress.",
  },
  {
    question: "How do I track a task or deadline?",
    answer: "Manage task completion from My Tasks or from the relevant project. Add a due date to a task to make it available in Calendar.",
  },
  {
    question: "Why can’t I see my GitHub activity?",
    answer: "Open Settings and check that your GitHub account is connected. If the connection is active but data still does not load, try refreshing the GitHub page.",
  },
  {
    question: "Where can I report a bug or request a feature?",
    answer: "Use the GitHub issue tracker to describe the problem or suggest an improvement. Include the page you were using and the steps needed to reproduce the issue. Do not include passwords, access tokens or other secrets.",
  },
];

export default function Support() {
  return (
    <main className="support-page">
      <header className="support-heading">
        <div>
          <span className="section-kicker">DEVSPACE HELP CENTER</span>
          <h1>How can we help?</h1>
          <p>Find guidance for your workspace, get answers to common questions or report something that is not working as expected.</p>
        </div>
      </header>

      <section className="support-contact-panel" aria-labelledby="support-contact-title">
        <div className="support-contact-content">
          <span className="support-eyebrow">NEED A HAND?</span>
          <h2 id="support-contact-title">Talk to the project team</h2>
          <p>Report a bug, share an idea or check whether someone has already reported the same issue.</p>
          <div className="support-contact-actions">
            <a className="support-primary-link" href="https://github.com/IbroRebronja/Devspace/issues/new" target="_blank" rel="noopener noreferrer">
              Report an issue <span aria-hidden="true">↗</span>
            </a>
            <a className="support-secondary-link" href="https://github.com/IbroRebronja/Devspace/issues" target="_blank" rel="noopener noreferrer">
              Browse existing issues
            </a>
          </div>
        </div>
        <div className="support-contact-mark" aria-hidden="true">
          <svg viewBox="0 0 64 64" fill="none">
            <path d="M12 15.5A5.5 5.5 0 0 1 17.5 10h29a5.5 5.5 0 0 1 5.5 5.5v22a5.5 5.5 0 0 1-5.5 5.5H29L17 53V43h-.5a5.5 5.5 0 0 1-5.5-5.5v-22Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/>
            <path d="M23 25h18M23 33h12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="47" cy="48" r="9" fill="#2563eb" stroke="white" strokeWidth="3"/>
            <path d="m43.5 48 2.2 2.2 4.8-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </section>

      <section className="support-section" aria-labelledby="support-topics-title">
        <div className="support-section-heading">
          <div>
            <span className="support-eyebrow">GETTING STARTED</span>
            <h2 id="support-topics-title">Browse help topics</h2>
          </div>
          <p>Quick guidance for the main parts of DevSpace.</p>
        </div>
        <div className="support-topic-grid">
          {helpTopics.map((topic) => (
            <article className="support-topic-card" key={topic.number}>
              <span className="support-topic-number">{topic.number}</span>
              <h3>{topic.title}</h3>
              <p>{topic.description}</p>
              <span className="support-topic-location">Find it in <strong>{topic.location}</strong></span>
            </article>
          ))}
        </div>
      </section>

      <section className="support-faq-panel" aria-labelledby="support-faq-title">
        <div className="support-section-heading">
          <div>
            <span className="support-eyebrow">QUICK ANSWERS</span>
            <h2 id="support-faq-title">Frequently asked questions</h2>
          </div>
          <span className="support-faq-count">4 topics</span>
        </div>
        <div className="support-faq-list">
          {questions.map((item, index) => (
            <details className="support-faq-item" key={item.question}>
              <summary>
                <span className="support-faq-index">{String(index + 1).padStart(2, "0")}</span>
                <span className="support-faq-question">{item.question}</span>
                <span className="support-faq-toggle" aria-hidden="true">+</span>
              </summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <p className="support-safety-note">Security reminder: never share your password, GitHub access token or other private credentials when asking for help.</p>
    </main>
  );
}

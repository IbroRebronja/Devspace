
import React from "react";
import "../styles/WorkspacePages.css";

export default function Calendar({ projects }) {
  const events = projects
    .map(project => ({
      id: project.id,
      title: project.name,
      date: new Date(project.dueDate),
      category: project.category,
    }))
    .sort((a, b) => a.date - b.date);

  return (
    <section className="workspace-page">
      <div className="workspace-page-heading">
        <div>
          <span className="section-kicker">YOUR WORKSPACE</span>
          <h1>Calendar</h1>
          <p>Keep an eye on your upcoming project deadlines.</p>
        </div>
      </div>

      <div className="workspace-list">
        {events.map(event => (
          <article className="workspace-event" key={event.id}>
            <div className="event-date">
              <strong>
                {event.date.toLocaleDateString("en", {
                  day: "2-digit",
                })}
              </strong>
              <span>
                {event.date.toLocaleDateString("en", {
                  month: "short",
                })}
              </span>
            </div>

            <div>
              <strong>{event.title}</strong>
              <small>{event.category} project deadline</small>
            </div>
          </article>
        ))}
      </div>

      {events.length === 0 && <p>No upcoming deadlines.</p>}
    </section>
  );
}

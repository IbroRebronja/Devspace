
import React, { useState } from "react";

export default function ProjectForm({ project, onSave, onCancel }) {
  const [name, setName] = useState(project?.name || "");
  const [description, setDescription] = useState(
    project?.description || ""
  );
  const [category, setCategory] = useState(
    project?.category || "Frontend"
  );
  const [dueDate, setDueDate] = useState(() => {
    if (!project?.dueDate) return "";

    const date = new Date(project.dueDate);
    if (Number.isNaN(date.getTime())) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  });

  function handleSubmit(event) {
    event.preventDefault();

    onSave({
      ...(project || {}),
      id: project?.id || Date.now(),
      name: name.trim(),
      description: description.trim(),
      category,
      color:
        category === "Backend"
          ? "blue"
          : category === "Full Stack"
            ? "orange"
            : "purple",
      dueDate,
      tasks: project?.tasks || [],
    });
  }

  return (
    <div className="project-modal-overlay" onMouseDown={onCancel}>
      <section
        className="project-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-form-title"
        onMouseDown={event => event.stopPropagation()}
      >
        <div className="project-modal-heading">
          <div>
            <span className="section-kicker">PROJECT DETAILS</span>
            <h2 id="project-form-title">
              {project ? "Edit project" : "Create a project"}
            </h2>
          </div>

          <button
            type="button"
            className="project-modal-close"
            onClick={onCancel}
            aria-label="Close form"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label>
            Project name
            <input
              value={name}
              onChange={event => setName(event.target.value)}
              placeholder="e.g. Portfolio Website"
              required
              maxLength={60}
            />
          </label>

          <label>
            Description
            <textarea
              value={description}
              onChange={event => setDescription(event.target.value)}
              placeholder="What is this project about?"
              rows={3}
              maxLength={250}
            />
          </label>

          <div className="project-form-row">
            <label>
              Category
              <select
                value={category}
                onChange={event => setCategory(event.target.value)}
              >
                <option>Frontend</option>
                <option>Backend</option>
                <option>Full Stack</option>
              </select>
            </label>

            <label>
              Due date
              <input
                type="date"
                value={dueDate}
                onChange={event => setDueDate(event.target.value)}
              />
            </label>
          </div>

          <div className="project-form-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onCancel}
            >
              Cancel
            </button>

            <button type="submit" className="primary-button">
              {project ? "Save changes" : "Create project"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

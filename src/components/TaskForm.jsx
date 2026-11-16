
import React, { useState } from "react";

export default function TaskForm({ onSave, onCancel, task }) {
  const [title, setTitle] = useState(task?.title || "");

  function handleSubmit(event) {
    event.preventDefault();

    if (!title.trim()) return;

    onSave({
      id: task?.id || Date.now(),
      title: title.trim(),
      done: task?.done || false,
    });
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <input
        autoFocus
        value={title}
        onChange={event => setTitle(event.target.value)}
        placeholder="Enter task name..."
        maxLength={100}
        required
      />

      <button type="submit" className="primary-button">
        {task ? "Save" : "Add"}
      </button>

      <button
        type="button"
        className="secondary-button"
        onClick={onCancel}
      >
        Cancel
      </button>
    </form>
  );
}

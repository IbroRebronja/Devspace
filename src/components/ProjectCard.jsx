
import React, { useState } from "react";
import TaskForm from "./TaskForm";
import "../styles/ProjectCard.css";

export default function ProjectCard({
  project,
  onToggle,
  onEdit,
  onDelete,
  onAddTask,
  onEditTask,
  onDeleteTask,
}) {
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const tasks = project.tasks || [];
  const completed = tasks.filter(task => task.done).length;
  const total = tasks.length;
  const progress = total
    ? Math.round((completed / total) * 100)
    : 0;

  function saveTask(task) {
    if (editingTask) {
      onEditTask(project.id, task);
    } else {
      onAddTask(project.id, task);
    }

    setShowTaskForm(false);
    setEditingTask(null);
  }

  return (
    <article className="project-card">
      <div className="project-top">
        <span className={`project-category ${project.color}`}>
          {project.category}
        </span>

        <div className="project-actions">
          <button type="button" onClick={() => onEdit(project)}>
            Edit
          </button>

          <button
            type="button"
            onClick={() => onDelete(project.id)}
          >
            Delete
          </button>
        </div>
      </div>

      <h3>{project.name}</h3>

      <p className="project-description">
        {project.description}
      </p>

      <div className="progress-heading">
        <span>Progress</span>
        <strong>{progress}%</strong>
      </div>

      <div className="progress-track">
        <div
          className={`progress-fill ${project.color}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="project-footer">
        <span>{completed}/{total} tasks completed</span>
        <span>
          {project.dueDate
            ? `Due ${project.dueDate}`
            : "No due date"}
        </span>
      </div>

      <div className="task-list">
        {tasks.map(task => (
          <div className="task-row" key={task.id}>
            <input
              type="checkbox"
              checked={task.done}
              onChange={() => onToggle(project.id, task.id)}
            />

            <span className={task.done ? "task-done" : ""}>
              {task.title}
            </span>

            <div className="task-actions">
              <button
                type="button"
                onClick={() => {
                  setEditingTask(task);
                  setShowTaskForm(true);
                }}
              >
                Edit
              </button>

              <button
                type="button"
                onClick={() => onDeleteTask(project.id, task.id)}
              >
                ×
              </button>
            </div>
          </div>
        ))}

        {tasks.length === 0 && (
          <p className="project-no-tasks">No tasks added yet.</p>
        )}
      </div>

      {showTaskForm ? (
        <TaskForm
          task={editingTask}
          onSave={saveTask}
          onCancel={() => {
            setShowTaskForm(false);
            setEditingTask(null);
          }}
        />
      ) : (
        <button
          type="button"
          className="add-task-button"
          onClick={() => setShowTaskForm(true)}
        >
          + Add task
        </button>
      )}
    </article>
  );
}

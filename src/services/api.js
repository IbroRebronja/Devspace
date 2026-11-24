const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Shared request function
async function request(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong.");
  }

  return data;
}

// Authentication
export const authAPI = {
  register: (userData) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    }),

  login: (credentials) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  logout: () =>
    request("/auth/logout", {
      method: "POST",
    }),

  getMe: () =>
    request("/auth/me"),
};

// Projects
export const projectsAPI = {
  getAll: () =>
    request("/projects"),

  create: (projectData) =>
    request("/projects", {
      method: "POST",
      body: JSON.stringify(projectData),
    }),

  update: (id, projectData) =>
    request(`/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(projectData),
    }),

  delete: (id) =>
    request(`/projects/${id}`, {
      method: "DELETE",
    }),
};

// Tasks
export const tasksAPI = {
  getAll: () =>
    request("/tasks"),

  create: (projectId, taskData) =>
    request(`/tasks/projects/${projectId}`, {
      method: "POST",
      body: JSON.stringify(taskData),
    }),

  update: (id, taskData) =>
    request(`/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(taskData),
    }),

  delete: (id) =>
    request(`/tasks/${id}`, {
      method: "DELETE",
    }),
};

// GitHub
export const githubAPI = {
  connectUrl: `${API_URL}/github/connect`,

  getStatus: () =>
    request("/github/status"),

  getRepositories: () =>
    request("/github/repositories"),

  getRepositoryDetails: (owner, repo) =>
    request(`/github/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/details`),

  getRepositoryContents: (owner, repo, path = "") => {
    const query = new URLSearchParams();
    if (path) query.set("path", path);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request(`/github/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents${suffix}`);
  },
};

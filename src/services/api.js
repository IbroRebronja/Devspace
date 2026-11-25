const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const GITHUB_LOGIN_URL = import.meta.env.PROD
  ? "https://devspace-api-p1iu.onrender.com/api/auth/github"
  : `${API_URL}/auth/github`;

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
    const error = new Error(data.message || "Something went wrong.");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// Authentication
export const authAPI = {
  githubLoginUrl: GITHUB_LOGIN_URL,
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

  verifyEmail: (token) =>
    request("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),

  resendVerification: (email) =>
    request("/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  forgotPassword: (email) =>
    request("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token, password) =>
    request("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
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

  getActivity: () => request("/github/activity"),

  getContributions: () => request("/github/contributions"),

  getRepositoryContents: (owner, repo, path = "") => {
    const query = new URLSearchParams();
    if (path) query.set("path", path);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request(`/github/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents${suffix}`);
  },
};


export const initialProjects = [
  {
    id: 1,
    name: "Website Redesign",
    description: "Rebuilding the company website and improving UX.",
    category: "Frontend",
    color: "purple",
    dueDate: "Nov 22, 2026",
    tasks: [
      { id: 1, title: "Create responsive navigation", done: false },
      { id: 2, title: "Build landing page components", done: false },
    ],
  },
  {
    id: 2,
    name: "API Integration",
    description: "Connect frontend services to the new REST API.",
    category: "Backend",
    color: "blue",
    dueDate: "Nov 25, 2026",
    tasks: [
      { id: 3, title: "Configure API endpoints", done: false },
    ],
  },
  {
    id: 3,
    name: "Analytics Dashboard",
    description: "Build reporting tools and interactive data charts.",
    category: "Full Stack",
    color: "orange",
    dueDate: "Nov 30, 2026",
    tasks: [
      { id: 4, title: "Implement analytics widgets", done: false },
    ],
  },
];

# DevSpace Dashboard

A responsive developer dashboard built with React, JavaScript, and CSS, powered by Vite.

## Features

- Responsive dashboard layout
- Sidebar navigation
- Project overview cards
- Task tracking with interactive checkboxes
- Project completion progress
- Dashboard statistics
- Mobile-friendly layout

## Tech Stack

- React
- JavaScript
- CSS
- Vite
- npm

## Prerequisites

Before running the project, make sure you have installed:

- [Node.js](https://nodejs.org/) (LTS version recommended)
- npm (included with Node.js)
- [Git](https://git-scm.com/) (optional, for version control)

Check your installations:

```bash
node -v
npm -v
```

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/USERNAME/REPOSITORY.git
```

Replace `USERNAME` and `REPOSITORY` with your GitHub username and repository name.

### 2. Navigate into the project

```bash
cd REPOSITORY
```

### 3. Install dependencies

```bash
npm install
```

This installs the packages required by the application.

### 4. Start the development server

```bash
npm run dev
```

Vite will display a local development URL, usually:

```text
http://localhost:5173/
```

Open this URL in your browser to view the dashboard.

## Available Commands

| Command | Description |
|---|---|
| `npm install` | Install project dependencies |
| `npm run dev` | Start the development server |
| `npm run build` | Build the application for production |
| `npm run preview` | Preview the production build |

## Project Structure

```text
devspace/
├── public/
├── src/
│   ├── assets/
│   │   └── images/
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── ProjectCard.jsx
│   │   ├── Sidebar.jsx
│   │   └── StatCard.jsx
│   ├── data/
│   │   └── projects.js
│   ├── pages/
│   │   └── Dashboard.jsx
│   ├── styles/
│   │   ├── Dashboard.css
│   │   ├── global.css
│   │   ├── ProjectCard.css
│   │   └── Sidebar.css
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md
```

## Building for Production

To generate an optimized production build:

```bash
npm run build
```

The generated files will be placed in the `dist/` directory.

To preview the production build locally:

```bash
npm run preview
```

## Development

You can edit the React components and CSS files inside the `src/` directory. Vite automatically refreshes the browser when changes are saved.

Project data and initial tasks can be modified in:

```text
src/data/projects.js
```

## License

This project is available for personal and educational use. Add a license file if you intend to distribute it under specific licensing terms.
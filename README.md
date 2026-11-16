# DevSpace

A developer dashboard built with React, JavaScript, and CSS. DevSpace provides a workspace for managing projects, tracking tasks, monitoring progress, and keeping track of deadlines.

## Features

- Dashboard overview with live project and task statistics
- Create, edit, and delete projects
- Add, edit, delete, and complete tasks
- Project progress tracking
- Task overview
- Calendar page for project deadlines
- Settings and support pages
- Responsive sidebar navigation
- Local storage for saving projects and tasks between sessions
- Privacy, terms, cookies, and refunds pages
- Cookie consent interface

## Built With

- React 19
- JavaScript
- CSS
- Vite 6

## Requirements

Make sure Node.js and npm are installed.

Check your versions:

```bash
node -v
npm -v
```

Download Node.js from [nodejs.org](https://nodejs.org/) if needed.

## Installation

Clone the repository:

```bash
git clone https://github.com/IbroRebronja/Devspace.git
```

Move into the project folder:

```bash
cd Devspace
```

Install the dependencies:

```bash
npm install
```

## Run the Project

Start the development server:

```bash
npm run dev
```

Open the local URL shown in your terminal. By default:

```text
http://localhost:5173/
```

## Available Commands

| Command | Description |
|---|---|
| `npm install` | Installs project dependencies |
| `npm run dev` | Starts the development server |
| `npm run build` | Creates a production build |
| `npm run preview` | Previews the production build |

## Project Structure

```text
Devspace/
│
├── public/
│
├── src/
│   │
│   ├── assets/
│   │   └── images/
│   │
│   ├── components/
│   │   ├── CookieConsent.jsx
│   │   ├── Header.jsx
│   │   ├── ProjectCard.jsx
│   │   ├── ProjectForm.jsx
│   │   ├── Sidebar.jsx
│   │   ├── StatCard.jsx
│   │   └── TaskForm.jsx
│   │
│   ├── data/
│   │   └── projects.js
│   │
│   ├── pages/
│   │   ├── Calendar.jsx
│   │   ├── Dashboard.jsx
│   │   ├── LegalPage.jsx
│   │   ├── Projects.jsx
│   │   ├── Settings.jsx
│   │   ├── Support.jsx
│   │   └── Tasks.jsx
│   │
│   ├── styles/
│   │   ├── Dashboard.css
│   │   ├── LegalPage.css
│   │   ├── ProjectCard.css
│   │   ├── Sidebar.css
│   │   └── WorkspacePages.css
│   │
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
│
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md
```

## Folder Guide

### `src/components/`

Contains reusable interface components.

- `Header.jsx`: Dashboard header.
- `Sidebar.jsx`: Main navigation.
- `StatCard.jsx`: Dashboard statistics cards.
- `ProjectCard.jsx`: Displays individual projects and their tasks.
- `ProjectForm.jsx`: Form for creating and editing projects.
- `TaskForm.jsx`: Form for adding and editing tasks.
- `CookieConsent.jsx`: Cookie consent interface.

### `src/pages/`

Contains the main application pages.

- `Dashboard.jsx`: Main application layout, navigation, project state, and shared functionality.
- `Projects.jsx`: Project management page.
- `Tasks.jsx`: Overview of all tasks.
- `Calendar.jsx`: Project deadlines.
- `Settings.jsx`: Application settings.
- `Support.jsx`: Help and support.
- `LegalPage.jsx`: Privacy, terms, cookies, and refunds information.

### `src/data/`

Contains the initial application data.

- `projects.js`: Initial projects and their tasks.

### `src/styles/`

Contains CSS files for the dashboard, components, navigation, and workspace pages.

## Data Storage

Projects and tasks are currently stored in the browser using `localStorage`.

This means data remains available after refreshing the page in the same browser, but it is not synchronised between different devices or users.

There is currently no backend database or user authentication system.

## Production Build

Create a production build:

```bash
npm run build
```

The generated files are saved in the `dist/` folder.

Preview the production build locally:

```bash
npm run preview
```

## License

For personal and educational use.
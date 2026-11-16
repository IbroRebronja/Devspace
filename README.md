# DevSpace Dashboard

A simple developer dashboard built with React, JavaScript, and CSS. It uses Vite to run the project locally (NOT GITHUB PAGES).

## Features

- Responsive layout
- Sidebar navigation
- Project overview
- Task tracking with checkboxes
- Project progress tracking
- Dashboard statistics
- Mobile-friendly design

## Built With

- React
- JavaScript
- CSS
- Vite

## Requirements

Make sure you have Node.js and npm installed.

You can check by running:

```bash
node -v
npm -v
```

If you don't have Node.js, download it from [nodejs.org](https://nodejs.org/).

## Installation

Clone the repository:

```bash
git clone https://github.com/USERNAME/REPOSITORY.git
```

Go into the project folder:

```bash
cd REPOSITORY
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

Open the local URL shown in your terminal. By default, it is:

```text
http://localhost:5173/
```

## Available Commands

| Command | What it does |
|---|---|
| `npm install` | Installs dependencies |
| `npm run dev` | Starts the development server |
| `npm run build` | Builds the project for production |
| `npm run preview` | Previews the production build |

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

## Editing the Project

Most of the dashboard code is inside the `src/` folder.

- `components/` contains the reusable UI components.
- `pages/` contains the dashboard page.
- `data/projects.js` contains the project and task data.
- `styles/` contains the CSS files.

Changes are picked up automatically by Vite while the development server is running.

## Production Build

To create a production build, run:

```bash
npm run build
```

The output will be saved in the `dist/` folder.

To preview it locally:

```bash
npm run preview
```

## License

For personal and educational use.

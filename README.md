# DevSpace

A full-stack developer dashboard for projects, tasks, deadlines, and GitHub activity.

## Features

- Project and task management
- Dashboard, progress tracking, and calendar
- GitHub OAuth connection, activity, and contributions
- Account registration, email verification, and password recovery
- Individual sessions and protected API access

## Tech Stack

React, Vite, Node.js, Express, PostgreSQL, Prisma, Resend, and GitHub API.

## Local Development

Requirements: Node.js, npm, and a PostgreSQL database.

Clone and install:

```bash
git clone https://github.com/IbroRebronja/Devspace.git
cd Devspace
npm install
cd Server
npm install
```

Create `../.env.local` in the project root:

```env
VITE_API_URL=http://localhost:5000/api
```

Create `Server/.env`:

```env
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_random_secret
CLIENT_URL=http://localhost:5173
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=DevSpace <onboarding@resend.dev>
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:5000/api/github/callback
GITHUB_TOKEN_ENCRYPTION_KEY=your_64_character_hex_key
```

The GitHub encryption key must be 64 hexadecimal characters. Configure a GitHub OAuth App with the callback URL above. Resend's test sender can only deliver to the email address associated with your Resend account. Use a verified sending domain for production email.

Start the backend from `Server/`:

```bash
npm run dev
```

Start the frontend from the project root in a second terminal:

```bash
npm run dev
```

Open http://localhost:5173.

## Commands

| Location | Command | Purpose |
|---|---|---|
| Root | `npm run dev` | Start frontend |
| Root | `npm run build` | Build frontend |
| Server | `npm run dev` | Run migrations and start backend |
| Server | `npm start` | Run migrations and start backend |
| Server | `npx prisma generate --config prisma7.config.ts` | Generate Prisma Client |

## Deployment

- Frontend: https://devspace-two-xi.vercel.app
- API: https://devspace-api-p1iu.onrender.com
- Database: Neon PostgreSQL

Set production environment variables in Vercel and Render. Use the production frontend URL for `CLIENT_URL`, the production API URL for `VITE_API_URL`, and the production callback URL in both Render and the GitHub OAuth App.

## Security

Keep environment files and credentials private. Passwords are bcrypt-hashed, sessions are stored in the database, and GitHub tokens are encrypted using AES-256-GCM.

## License

No license has been specified.

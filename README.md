# DevSpace

A full-stack developer dashboard for managing projects and tasks, tracking deadlines, and viewing GitHub activity and contribution data.

## Features

- User registration, login, logout, and individual device sessions
- Email verification and password reset flows
- Project creation, editing, and deletion
- Task creation, editing, completion, and deletion
- Dashboard overview and project progress
- Calendar and task views
- GitHub account connection using OAuth
- GitHub activity and contribution views
- Settings, support, and legal pages
- Protected API routes and per-user data access

## Tech Stack

**Frontend:** React 19, JavaScript, Vite 6, CSS  
**Backend:** Node.js, Express 5  
**Database:** PostgreSQL with Prisma 7  
**Authentication:** JWT in HttpOnly cookies, bcrypt password hashing, database-backed sessions  
**Email:** Resend  
**GitHub integration:** GitHub OAuth and GitHub REST/GraphQL APIs  
**Deployment:** Vercel (frontend), Render (API), Neon (PostgreSQL)

## Requirements

- Node.js and npm
- A PostgreSQL database
- Resend API key for email delivery
- GitHub OAuth application credentials for GitHub integration

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/IbroRebronja/Devspace.git
cd Devspace
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Configure the frontend

Create a root-level `.env.local` file:

```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Install backend dependencies

Open a second terminal:

```bash
cd Server
npm install
```

### 5. Configure the backend

Create `Server/.env` with the following variables:

```env
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_long_random_secret
CLIENT_URL=http://localhost:5173
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=DevSpace <onboarding@resend.dev>
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
GITHUB_CALLBACK_URL=http://localhost:5000/api/github/callback
GITHUB_TOKEN_ENCRYPTION_KEY=your_64_character_hex_key
```

Generate secure values for `JWT_SECRET` and `GITHUB_TOKEN_ENCRYPTION_KEY`. The GitHub encryption key must be exactly 64 hexadecimal characters. Keep all secrets private and never commit either environment file.

For local email testing, Resend's `onboarding@resend.dev` sender can only deliver to the email address associated with your Resend account. To send to other users, configure and verify a domain in Resend and update `RESEND_FROM_EMAIL`.

Create a GitHub OAuth App and set its authorization callback URL to the value of `GITHUB_CALLBACK_URL`.

### 6. Start the backend

From the `Server` directory:

```bash
npm run dev
```

The backend runs at:

```text
http://localhost:5000
```

The development command applies pending Prisma migrations before starting the API.

### 7. Start the frontend

In the root project directory, using the first terminal:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

## Useful Commands

Run these from the repository root unless noted otherwise.

| Command | Purpose |
|---|---|
| `npm install` | Install frontend dependencies |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Build the frontend for production |
| `npm run preview` | Preview the production frontend build |
| `cd Server && npm install` | Install backend dependencies |
| `cd Server && npm run dev` | Apply migrations and start the backend in watch mode |
| `cd Server && npm start` | Apply migrations and start the backend |
| `cd Server && npx prisma generate --config prisma7.config.ts` | Generate the Prisma Client |

## Environment Variables

| Variable | Used by | Description |
|---|---|---|
| `VITE_API_URL` | Frontend | API base URL, including `/api` |
| `DATABASE_URL` | Backend | PostgreSQL connection string |
| `JWT_SECRET` | Backend | Secret used to sign authentication tokens |
| `CLIENT_URL` | Backend | Frontend origin used for CORS, redirects, and email links |
| `RESEND_API_KEY` | Backend | Resend API key |
| `RESEND_FROM_EMAIL` | Backend | Verified email sender |
| `GITHUB_CLIENT_ID` | Backend | GitHub OAuth application client ID |
| `GITHUB_CLIENT_SECRET` | Backend | GitHub OAuth application secret |
| `GITHUB_CALLBACK_URL` | Backend | GitHub OAuth callback URL |
| `GITHUB_TOKEN_ENCRYPTION_KEY` | Backend | 32-byte AES-256-GCM key encoded as 64 hexadecimal characters |

## Project Layout

```text
Devspace/
├── Server/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── utils/
│   │   ├── index.js
│   │   └── prisma.js
│   ├── package.json
│   └── prisma7.config.ts
├── public/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── styles/
│   ├── App.jsx
│   └── main.jsx
├── package.json
├── vercel.json
└── README.md
```

## API Health Check

With the backend running, visit:

```text
http://localhost:5000/api/health
```

A healthy response confirms that the API can connect to PostgreSQL.

## Deployment

Current production services:

- **Frontend:** https://devspace-two-xi.vercel.app
- **API:** https://devspace-api-p1iu.onrender.com
- **API health:** https://devspace-api-p1iu.onrender.com/api/health

The frontend is deployed on Vercel. The API is deployed on Render and uses PostgreSQL hosted by Neon.

Configure the production environment variables in the respective hosting dashboards. Set `CLIENT_URL` to the deployed frontend URL, `VITE_API_URL` to the production API base URL when building the frontend, and `GITHUB_CALLBACK_URL` to the deployed API's `/api/github/callback` endpoint. Configure the same callback URL in the GitHub OAuth App. Use a verified Resend sending domain for production email delivery.

Prisma migrations are applied by the backend start command. Commit migration files in `Server/prisma/migrations` with schema changes.

## Security Notes

- Do not commit `.env`, `.env.local`, API keys, database URLs, OAuth secrets, or encryption keys.
- Authentication cookies are HttpOnly and use Secure in production.
- Passwords are hashed with bcrypt.
- Sessions are stored individually in the database and can be revoked independently.
- GitHub OAuth uses state validation and PKCE.
- GitHub access tokens are encrypted at rest using AES-256-GCM.
- API state-changing requests require an allowed browser Origin.
- Authentication and GitHub API routes have rate limits.

## License

No open-source license has been specified yet.

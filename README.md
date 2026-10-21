# REDS Orbital Command Center

Mission-control workspace built with Next.js, SQLite, and Prisma. It includes a protected admin area, a task board, user administration, and local authentication.

## Requirements

- Node.js 20 or newer
- npm

## Run locally

Install dependencies, seed the local administrator, then start the development server:

```bash
npm install
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Protected workspace routes redirect to `/signin` when no valid session exists.

## Administrator access

The seed script creates (or updates) this local administrator account:

| Field | Value |
| --- | --- |
| Email | `admin@reds.local` |
| Password | `Admin@2026!` |
| Role | `ADMIN` |

Sign in at [http://localhost:3000/signin](http://localhost:3000/signin), then visit `/admin`.

> Change the default password before deploying. You can supply custom credentials when running the seed script:

```powershell
$env:ADMIN_EMAIL = "admin@example.com"
$env:ADMIN_PASSWORD = "Use-a-long-unique-password"
npm run seed
```

## Environment variables

Create a local `.env` file with a long, random `AUTH_SECRET`. It signs the session cookie and must be unique in every deployed environment.

```env
AUTH_SECRET=replace-with-a-long-random-secret
```

## User management

After signing in, open `/admin/users` to:

- View real accounts from the local database
- Add an account with email and password
- Generate a random password in the Add user dialog

Passwords are hashed before they are stored. The user API requires an authenticated session:

- `GET /api/users` lists users
- `POST /api/users` creates a user

## Protected routes

The root [`proxy.ts`](./proxy.ts) protects:

- `/admin/*`
- `/todo/*`
- `/api/users/*`
- `/api/tasks/*`

Unauthenticated page requests redirect to `/signin`. Protected API requests return `401 Not signed in`.

## Database and Prisma Studio

The app stores its local SQLite data in `data/reds.db`. The file is created automatically and is ignored by Git.

To inspect it with Prisma Studio:

```bash
npx prisma studio
```

Prisma Studio opens at [http://localhost:5555](http://localhost:5555) by default. The Prisma configuration generates a compatible `file:///` SQLite URL for Studio.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Generate Prisma Client and create a production build |
| `npm run start` | Start the production server after building |
| `npm run seed` | Create or refresh the local administrator account |
| `npm run lint` | Run ESLint |

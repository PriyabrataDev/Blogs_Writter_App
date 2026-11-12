# Inkwell

Inkwell is a full-stack blogging application for sharing stories, finding
interesting posts, and joining conversations. It uses React and Vite for the
web app, Node.js and Express for the API, and MongoDB for persistent data.

**Created and maintained by Priyabrata Chakraborty**

## Features

- Register an account and sign in.
- Browse and search stories by title or tag.
- Read stories and their comments.
- Write, update, and delete your own posts.
- Like and unlike posts.
- Add comments and remove comments you wrote. Post authors can also moderate
  comments on their posts.
- Paginated post and comment lists.
- API liveness and database readiness endpoints.

## Technology

| Area | Technology |
| --- | --- |
| Frontend | React, React Router, Vite, Axios |
| Backend | Node.js, Express |
| Database | MongoDB with Mongoose |
| Authentication | JSON Web Tokens and bcrypt |

## Project structure

```text
blogapp/
├── backend/
│   ├── config/          # Database connection
│   ├── controllers/     # Authentication, post, and comment behavior
│   ├── middleware/      # Authentication, rate limits, and error handling
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── .env.example     # Environment-variable template
│   └── server.js        # API entry point
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/
    │   ├── context/
    │   └── pages/
    ├── index.html
    └── vite.config.js   # Local API proxy
```

## Requirements

- Node.js 18.11 or newer.
- npm.
- MongoDB running locally, or a MongoDB service you are authorized to use.

## Run the application locally

Run the backend and frontend in separate terminals.

### 1. Configure and start the backend

Open PowerShell in the project directory:

```powershell
cd backend
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Open `backend/.env` and set a private `JWT_SECRET` of at least 32 characters.
The example uses a local MongoDB URI; change `MONGO_URI` if your database is
elsewhere. Keep `.env` private and do not commit it.

Install dependencies and run the API:

```powershell
npm ci
npm run dev
```

The API listens on `http://localhost:5000` by default. It checks its
configuration and connects to MongoDB before accepting requests.

### 2. Start the frontend

In a second terminal, from the project directory:

```powershell
cd frontend
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Vite forwards requests
under `/api` to the backend at `http://localhost:5000`.

Press `Ctrl+C` in each terminal to stop its server.

## Configuration

The API reads its configuration from `backend/.env`.
`backend/.env.example` contains development defaults and a deliberately
invalid JWT signing value. Replace it in your local `.env` before starting the
backend.

| Variable | Description |
| --- | --- |
| `PORT` | API port. Defaults to `5000`. |
| `NODE_ENV` | Runtime environment, such as `development` or `production`. |
| `MONGO_URI` | MongoDB connection URI. |
| `JWT_SECRET` | Private token-signing value; use at least 32 random characters. |
| `JWT_EXPIRES_IN` | Token lifetime; defaults to `7d`. |
| `CLIENT_URL` | Comma-separated browser origins permitted by CORS. |
| `TRUST_PROXY` | Optional trusted-proxy configuration. Use only if required by your hosting setup. |
| `VITE_API_URL` | Optional frontend build-time API base URL, ending in `/api`. Defaults to `/api`. |

Generate a signing value locally if needed:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

This application does not require a separate third-party API key for its
core functionality. Do not put private values in this README, frontend
variables, or committed source code. For a hosted deployment, store private
settings in the hosting provider's environment configuration.

## API reference

Requests that require a signed-in user use this header:

```http
Authorization: Bearer <token>
```

### Authentication

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Public | Create an account and return a token. |
| `POST` | `/api/auth/login` | Public | Sign in and return a token. |
| `GET` | `/api/auth/me` | Private | Get the current account. |

Registration accepts `name`, `email`, and `password` as JSON. Login accepts
`email` and `password`.

### Posts

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/posts` | Public | List posts; accepts `page`, `limit`, and `search`. |
| `GET` | `/api/posts/:id` | Public | Get a post. |
| `POST` | `/api/posts` | Private | Create a post. |
| `PUT` | `/api/posts/:id` | Private | Edit your own post. |
| `DELETE` | `/api/posts/:id` | Private | Delete your own post and its comments. |
| `PUT` | `/api/posts/:id/like` | Private | Toggle your like on a post. |

The post list defaults to page `1` with `9` posts per page. `limit` must be
between `1` and `50`, `page` between `1` and `1000`, and `search` no longer
than 100 characters. Search matches post titles and tags. A response looks
like this:

```json
{
  "posts": [],
  "page": 1,
  "pages": 1,
  "total": 0
}
```

A post has a `title` and `content`, and may include a `coverImage` URL and
`tags`. Tags may be provided as an array of strings or a comma-separated
string. A post supports up to 10 tags; titles are limited to 150 characters
and content to 50,000 characters.

### Comments

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/posts/:postId/comments` | Public | List comments on a post. |
| `POST` | `/api/posts/:postId/comments` | Private | Add a comment. |
| `DELETE` | `/api/posts/:postId/comments/:commentId` | Private | Remove an authorized comment. |

Comment lists default to page `1` with `20` comments per page. `limit` may be
between `1` and `50`. The response contains `comments`, `page`, `pages`, and
`total`. A comment can contain up to 1,000 characters.

### Health and readiness

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Check that the API process responds. |
| `GET` | `/api/ready` | Check that the database is connected; unavailable services return HTTP `503`. |

The API limits request body size and applies rate limits. A rate-limited
request returns HTTP `429`; clients should wait before retrying.

## Production deployment

### Build the frontend

```powershell
cd frontend
npm ci
npm run build
```

The production site is written to `frontend/dist`. Serve this directory with a
static host configured to send client-side routes to `index.html`. If the API
uses a different origin, set `VITE_API_URL` during the frontend build to the
full API base URL, including `/api`.

### Run the backend

```powershell
cd backend
npm ci
npm start
```

Set `MONGO_URI`, a strong private `JWT_SECRET`, `NODE_ENV=production`, and
`CLIENT_URL` to the exact deployed frontend origin or origins. Configure
`TRUST_PROXY` only to match the trusted proxy topology of your hosting
provider. Use `/api/health` for liveness checks and `/api/ready` for readiness
checks.

The default rate limiter stores counters in the running process. If deploying
multiple backend instances, configure a shared rate-limit store so limits are
consistent across instances. Select database capacity and instance counts
based on measurements and load tests; this project does not claim a specific
maximum user capacity.

## Development checks

Build the frontend with:

```powershell
cd frontend
npm run build
```

There is no automated test command currently defined in the package
manifests. Add tests for the deployment environment and run them before
releasing changes.

## License

No license has been specified. Add a license before redistributing this
project.

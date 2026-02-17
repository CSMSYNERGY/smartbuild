# GHL SmartBuild App

A **monolith** that serves both the **React UI** and the **Node/Express API**. It integrates GoHighLevel (GHL) with SmartBuild: OAuth, workflows/actions, subscription billing (Deposyt), mappers, and SmartBuild job sync.

---

## Tech stack

| Layer | Tech |
|-------|------|
| **Backend** | Node 20, Express 4, ESM (`"type": "module"`) |
| **Frontend** | React 19, Vite 7, Mantine UI, React Router 7 |
| **Database** | Google Cloud Firestore (auth, subscriptions, mappers, SmartBuild credentials) |
| **Auth** | GHL OAuth, JWT for web app (Bearer in `Authorization`), API key for actions |
| **Payments** | Deposyt (NMI) for subscriptions; webhooks for lifecycle events |
| **External APIs** | GHL (Lead Connector), SmartBuild (`SMARTBUILD_BASE_URL`), Deposyt |

---

## How the app is served

- **Single process**: Express serves both API and the built React app.
- **API** is on `/`, `/auth`, `/actions`, `/webhooks`, `/api` (see below).
- **UI** is built with Vite (`frontend/`) and served under **`/app`** (e.g. `/app`, `/app/home`, `/app/subscription`). Static assets and `index.html` for client-side routing come from `frontend/dist` after `npm run build:ui`.

---

## API overview

### 1. **GHL OAuth & install (`/auth`)**

- Used when the app is installed from the GHL marketplace.
- **GET `/auth`** – redirects to GHL OAuth.
- **GET `/auth/callback`** – exchanges code for tokens, stores location auth in Firestore, redirects to success/error views.

### 2. **Actions API (`/actions`) – called by GHL workflows**

- Used by **workflow actions** in GHL. Each request must include **`x-api-key`** (same value as `X_API_KEY` env).
- Middleware: request/response logging → `verifyAPIKey` → `checkLocationSubscribed` → action handlers.
- **Subscription check**: location must have an active (or cancelled-but-not-expired) subscription in Firestore; otherwise 403.
- Examples: `POST /actions/retrieve-smartbuild-job`, `POST /actions/create-or-edit-smartbuild-job`, `POST /actions/update-opportunity`, `GET /actions/get-mappers`, etc. See `src/routes/actionsRoutes.js`.

### 3. **Web app auth & API (`/api`)**

- **SSO (no auth)**  
  - **POST `/api/sso/decrypt`** – body: `{ encryptedData }`. Decrypts GHL user context with `GHL_SHARED_SECRET`, issues a JWT, returns `{ token, sub, email, locationId, ... }`. No session cookie; the frontend stores the JWT (e.g. in `sessionStorage` under `CPI_PLUGIN_TOKEN`) and sends it as **`Authorization: Bearer <token>`** on all other `/api` requests.

- **Protected routes (JWT)**  
  - All other `/api/*` routes use `requireWebSession`: they read **`Authorization: Bearer <token>`**, verify with `APP_JWT_SECRET`, and attach `req.webUser`.
  - Examples: **GET `/api/me`** (user + entitlement), **GET `/api/subscription/plans`**, **POST `/api/subscription/create`**, **GET/POST/PUT/DELETE** mappers, **GET/POST** SmartBuild config/authenticate, etc. See `src/routes/webApiRoutes.js`.

### 4. **Webhooks (`/webhooks`)**

- **POST `/webhooks/subscription`** – Deposyt subscription lifecycle. Verified with **`DEPOSYT_WEBHOOK_SIGNING_KEY`** (signature header). Body: `{ event_type, event_body }`. Updates Firestore subscriptions/entitlements (e.g. `recurring.subscription.add`, `recurring.subscription.update`, `recurring.subscription.delete`).

---

## Docker

- **Multi-stage build**:
  1. **Stage `ui`**: Node 20 slim, installs frontend deps, copies `frontend/`, runs `npm run build`. Output: `frontend/dist`.
  2. **Stage final**: Node 20 slim, installs **backend** deps only (`npm ci --omit=dev`), copies `src/`, `views/`, and **copies `frontend/dist` from stage `ui`** into `frontend/dist`.
- **Runtime**: `npm start` → `node src/index.js`. **PORT** is 3000 by default; set `PORT` in the environment if you change it (and match it in Dockerfile if you use `EXPOSE`).
- **No frontend install at runtime**; the app serves the pre-built static files from `frontend/dist`. So after code changes: rebuild the image so the UI build is updated.

```bash
docker build -t ghlsmartbuild .
docker run -p 3000:3000 --env-file .env ghlsmartbuild
```

---

## Running locally (dev)

1. **Backend** (from repo root):
   ```bash
   npm install
   npm run dev
   ```
   Runs Express on **PORT** (default 3000). Serves API and, if present, built UI from `frontend/dist` under `/app`. If `frontend/dist` is missing, only API routes work.

2. **Frontend** (Vite dev server with proxy):
   ```bash
   cd frontend && npm install && npm run dev
   ```
   Runs Vite on 5173. **Proxy**: `/api` and `/sso` → `http://localhost:3000`. So the app is used at `http://localhost:5173`; API calls go to the Node server.  
   **Build for production (or Docker):** from repo root run `npm run build:ui` so `frontend/dist` is created and the monolith can serve it at `/app`.

3. **Env**: Copy `.env.example` to `.env` and fill in the variables below.

---

## Environment variables

| Variable | Purpose |
|----------|--------|
| **PORT** | Server port (default 3000). Match in Dockerfile if needed. |
| **GHL_CLIENT_ID** | GHL OAuth app client ID. |
| **GHL_CLIENT_SECRET** | GHL OAuth app client secret. |
| **GHL_SCOPES** | Space-separated OAuth scopes (e.g. `contacts.write opportunities.write ...`). |
| **GHL_SHARED_SECRET** | Used to decrypt GHL user context (CPI plugin) before issuing JWT. |
| **GHL_BASE_URL** | GHL API base (e.g. `https://services.leadconnectorhq.com`). |
| **GHL_DEFAULT_API_VERSION** | GHL API version header (e.g. `2021-07-28`). |
| **REDIRECT_URI** | OAuth redirect (e.g. `https://your-domain/auth/callback`). |
| **X_API_KEY** | Secret for workflow actions; set in GHL action config as `x-api-key` header. |
| **APP_JWT_SECRET** | Secret to sign/verify JWTs for `/api` (web app). |
| **SMARTBUILD_BASE_URL** | SmartBuild API base (e.g. `https://postframesolver.azurewebsites.net`). |
| **GCP_PROJECT_ID** | Google Cloud project for Firestore. |
| **GOOGLE_APPLICATION_CREDENTIALS** or **FIREBASE_SERVICE_ACCOUNT_KEY** | Path to service account JSON for Firestore (dev). |
| **DEPOSYT_PRIVATE_API_KEY** | Deposyt private API key (subscriptions). |
| **DEPOSYT_WEBHOOK_SIGNING_KEY** | Deposyt webhook signature verification. |

Optional: **NODE_ENV** (e.g. `development` / `production`). In development, `requireWebSession` can bypass JWT and use a fixed dev user.

---

## Project structure (high level)

```
├── src/                    # Backend
│   ├── index.js            # Express app, serves /app from frontend/dist
│   ├── config/             # Firestore, logger, plans
│   ├── constants/          # auth constants, smartbuildAttributeDefaults
│   ├── controllers/       # auth, actions, webApi, webAuth, subscription
│   ├── middlewares/       # auth (API key, subscription), webAuth (JWT), logger, deposyt webhook
│   ├── routes/            # auth, actions, webApi, webAuth, deposyt webhooks
│   ├── services/           # auth, ghl, smartbuild, mappers, subscription, firestore, deposyt
│   ├── utils/
│   ├── models/             # errors
│   └── ...
├── frontend/               # React app (Vite)
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── context/        # AuthProvider (JWT in sessionStorage, fetchWithAuth)
│   │   ├── pages/          # Home, Subscription, Mappers, Mapper, SmartBuild, etc.
│   │   ├── components/
│   │   ├── layouts/
│   │   └── utils/          # getAuthToken, setAuthToken, fetchWithAuth, getUserData, fetchMe
│   ├── vite.config.js     # base: "/app/", proxy /api and /sso to 3000
│   └── package.json
├── views/                  # EJS (e.g. success, smartbuild-login)
├── Dockerfile              # Multi-stage: build UI → copy into Node image
└── package.json            # Backend scripts: start, dev, build:ui, test
```

---

## Tests

- Backend tests: `npm test` (Jest with ESM).  
- Single file: `npm run test:file -- path/to/test.js`.

---

## Quick reference for developers

- **Change API (actions)**: `src/routes/actionsRoutes.js` + `src/controllers/actionsController.js`.
- **Change web API**: `src/routes/webApiRoutes.js` + `src/controllers/webApiController.js`.
- **Change web auth (JWT/SSO)**: `src/controllers/webAuthController.js`, `src/middlewares/webAuthMiddleware.js`, and frontend `context/AuthProvider.jsx` + `utils/utils.js`.
- **Subscription logic**: `src/services/subscriptionService.js`, Deposyt in `src/services/deposytCommunicatorService.js`, webhooks in `src/routes/deposytWebhookRoutes.js` and subscription controller.
- **SmartBuild**: `src/services/smartbuildService.js`, defaults in `src/constants/smartbuildAttributeDefaults.js`.
- **Mappers**: `src/services/mappersService.js` + Firestore.
- **UI**: All under `frontend/src`; auth and API calls go through `fetchWithAuth` and `CPI_PLUGIN_TOKEN` in sessionStorage.

Keeping this README in sync with the code will help any dev continue from where we left off.

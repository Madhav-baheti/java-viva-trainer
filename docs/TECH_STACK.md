# VivaPilot: Tech Stack

The stack is chosen for one thing: **a working app in about 8 to 10 hours of build time.** Every choice below is the simplest option that still does the job.

## 1. Summary

| Layer | Choice | Why this |
|---|---|---|
| Runtime | **Node.js 20 LTS** | Required by the hackathon setup, fast to start, one language for the whole project |
| Backend | **Express 4** | Smallest sensible web server, ideal for 4 JSON endpoints |
| Frontend | **Plain HTML, CSS, JavaScript** (no framework) | No build step, nothing to configure, easy for an agent to generate and for you to read |
| AI | **One LLM provider behind a single wrapper (`src/llm.js`)** | The model can be swapped by changing one file and `.env`, which matters because the hackathon rules may specify a model |
| Storage | **Browser `localStorage`** | The weak-topic tracker needs per-user memory but not a database or accounts |
| Config | **dotenv** (`.env`) | Keeps the API key out of the code and the repo |
| Version control | **Git + GitHub** (`Madhav-baheti/java-viva-trainer`) | Required for the Devpost submission |

## 2. Backend dependencies

| Package | Purpose |
|---|---|
| `express` | HTTP server and routing |
| `dotenv` | Loads `.env` into `process.env` |
| `express-rate-limit` | Per-IP request limit to protect the API key and budget |
| The AI provider's official SDK (or plain `fetch`) | Calls the model from `src/llm.js` |

Dev only: `nodemon` (auto-restart while developing).

Node's built-in test runner (`node --test`) is used for a few small tests. No extra test framework is needed.

## 3. Frontend

- A single `index.html` with 4 tab panels: Explain, Viva, Weak Topics, Revision.
- Vanilla JS modules, one per feature, plus a small `api.js` (fetch wrapper) and `store.js` (`localStorage` helper).
- CSS written by hand using CSS variables for the theme. The palette follows the logo: navy `#011848` and blue `#0B5FFF`, with orange `#FF6B00` as an accent.
- Optional (P2): `highlight.js` from a CDN for Java syntax colouring.

## 4. Environment variables

`.env.example` (committed), `.env` (never committed):

```
PORT=3000
AI_API_KEY=your_key_here
AI_MODEL=model-name-here
MAX_INPUT_CHARS=6000
RATE_LIMIT_PER_MIN=30
```

## 5. Commands

```bash
npm init -y
npm install express dotenv express-rate-limit
npm install -D nodemon

npm run dev     # nodemon server.js
npm start       # node server.js
npm test        # node --test
```

## 6. Tooling and who does what

| Tool | Role |
|---|---|
| **One main coding agent** (the one the Devpost Skill Pack supports, in VS Code or Antigravity) | Writes and edits the code |
| ChatGPT or Claude (chat) | Planning, prompt writing, README and Devpost text |
| A second agent | Reviewing and debugging only, never editing in parallel |

Using a single code-writing agent avoids conflicting edits across tools.

## 7. Deliberately not used

| Not used | Reason |
|---|---|
| React / Next.js / Vue | A build step and extra concepts, with no benefit for 4 simple screens |
| Spring Boot | Better for a long-term Java backend, but slower to set up for a 2-day build and not needed here |
| A database (MongoDB, SQLite, Postgres) | There are no accounts, so `localStorage` is enough |
| Authentication | Out of scope |
| Docker | Not needed to run or demo the app |

## 8. Hosting (optional, P2)

- Local demo plus the repo and a demo video is enough for submission.
- If a live link is wanted: Render or Railway (free tier) can run the Node server. Add the API key as a server environment variable, never in the repo.

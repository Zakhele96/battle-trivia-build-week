# Battle Trivia

Battle Trivia is a real-time multiplayer knowledge platform built with React, .NET 8, PostgreSQL, Dapper, SignalR, and JWT authentication.

For OpenAI Build Week, the existing platform was extended with **AI Battle Creator**, a source-grounded experience called **Battle It**. Any authenticated player can turn their own notes or note images into a reviewed, finite multiplayer trivia battle powered by GPT-5.6.

## OpenAI Build Week

### AI Battle Creator: Battle It

Battle It converts user-provided learning material into a live competition:

1. A logged-in player enters the permanent **Battle It** room.
2. The battle creator pastes up to 12,000 characters of notes and/or uploads up to two JPEG, PNG, or WebP images (5 MB each).
3. GPT-5.6 returns a strict, structured question pack grounded only in that source.
4. The creator reviews and edits every question, answer, explanation, concept, and proof excerpt.
5. The creator opens the player lobby and shares the room.
6. Players receive the same timed questions through SignalR.
7. The server validates answers, awards points, and broadcasts the live leaderboard.
8. After each round, the correct answer, explanation, and supporting source excerpt are revealed.
9. A halftime leaderboard appears after question 10 when the pack contains more than 10 questions.
10. The server finalizes the session and displays the podium.

A pack contains between 4 and 20 usable questions. GPT-5.6 is instructed not to pad weak source material just to reach 20.

### Other Build Week additions

- **Battle Coach** generates a short post-round explanation when an existing trivia question does not already have one. The explanation is saved and reused, avoiding repeat AI calls.
- **AI Question Studio** lets an administrator generate editable question drafts by topic, difficulty, and count. Generated questions are inactive by default, and normalized duplicates are skipped when saving.
- **Admin Command Center** reorganizes question management and AI generation into a clearer review workflow.

### Why GPT-5.6 matters

GPT-5.6 is used for work that benefits directly from language and vision understanding:

- extracting important concepts from pasted notes and images;
- generating structured, source-backed questions and accepted answer variants;
- producing concise answer explanations;
- returning strict JSON schemas that the server validates before anything becomes playable.

OpenAI Codex was used to inspect the existing system, design safe extension points, implement the end-to-end feature, diagnose integration failures, and validate the deployment build.

## Existing Platform

The application already included:

- registration, email verification, social login, and JWT authentication;
- lobby, rooms, real-time chat, mentions, direct messages, and moderation;
- continuous and scheduled Battle Trivia rounds;
- Word Scramble;
- server-authoritative scoring and live leaderboards;
- profiles, progression, achievements, squads, alerts, and sharing;
- administration tools and production-oriented Redis support.

The Build Week features extend these systems rather than replacing them. Battle It reuses the existing SignalR hub, answer validation, score ledger, round models, leaderboard service, and session finalizer.

## Architecture

```text
.
├── api/   ASP.NET Core 8 Web API, Dapper, PostgreSQL, SignalR
├── web/   React 19, Vite, Tailwind CSS, Axios, SignalR client
└── docs/  Manual QA and supporting project documentation
```

### Backend

- ASP.NET Core 8 Web API
- PostgreSQL with Dapper
- SignalR
- JWT bearer authentication
- FluentValidation
- optional Redis presence and SignalR backplane
- OpenAI Responses API

### Frontend

- React 19
- Vite 8
- Tailwind CSS 4
- React Router
- Axios
- Microsoft SignalR client

## AI Safety, Privacy, and Cost Controls

- OpenAI Responses API requests use `store: false`.
- Source material is treated as untrusted data, not as model instructions.
- Raw pasted notes and uploaded image bytes are not persisted.
- Uploaded files are size-limited and validated by content type and file signature.
- Only reviewed questions and short proof excerpts are saved for the session.
- Battle It questions use `origin = 'battle-it'` and are excluded from the public trivia bank.
- Answers and scoring remain server-authoritative.
- Correct answers and proof excerpts are never broadcast to players before the reveal phase; the creator can see them only while reviewing the private draft.
- Battle It uses one AI request per generated pack and no AI calls during gameplay.
- Generation is limited to three Battle It requests per authenticated user per hour.
- Replays reuse the reviewed pack and consume no OpenAI credits.

## Local Development

### Requirements

- .NET 8 SDK
- a current Node.js LTS release
- PostgreSQL

### 1. Configure the API

Create `api/appsettings.Local.json`. This file is ignored by Git and excluded from publish output.

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=bts_db;Username=postgres;Password=YOUR_PASSWORD"
  },
  "Jwt": {
    "Issuer": "Bts.Api",
    "Audience": "Bts.Client",
    "Key": "YOUR_LONG_RANDOM_SECRET",
    "ExpiryMinutes": 10080
  },
  "OpenAI": {
    "Enabled": true,
    "ApiKey": "YOUR_OPENAI_API_KEY",
    "Model": "gpt-5.6-luna"
  }
}
```

Never commit `appsettings.Local.json` or a real API key.

### 2. Prepare PostgreSQL

Create the `bts_db` database. For a new installation, apply the base scripts in `api/SQL/` or restore a current database dump. Idempotent schema services run when the API starts and add newer application structures, including the Battle It room and tables.

### 3. Run the API

```powershell
cd api
dotnet restore
dotnet run --launch-profile http
```

The HTTP development profile listens on `http://localhost:5001`.

### 4. Configure and run the frontend

Create `web/.env.local`:

```dotenv
VITE_API_BASE_URL=http://localhost:5001/api
VITE_HUB_URL=http://localhost:5001/hubs/chat
```

Then run:

```powershell
cd web
npm install
npm run dev -- --host 0.0.0.0
```

Open `http://localhost:5173`.

## Build Week Demo Script

1. Register or log in as the battle creator.
2. From the dashboard choose **Battle your own notes**, or open **Battle It** from Rooms.
3. Paste a compact set of study notes or upload one or two clear note images.
4. Select a difficulty and answer time, then generate the pack.
5. Review the structured questions and proof excerpts.
6. Open the player lobby.
7. Join the same room with a second authenticated browser session.
8. Start the battle and submit answers from both players.
9. Show the synchronized reveal, source proof, progress bar, and live leaderboard.
10. Complete the session, show the podium, and use **Replay free** to demonstrate zero-cost reuse.

## Production Configuration

The production API must receive secrets through environment variables or a secret manager. At minimum, the AI features require:

```text
OpenAI__Enabled=true
OpenAI__ApiKey=YOUR_OPENAI_API_KEY
OpenAI__Model=gpt-5.6-luna
```

The database and authentication require:

```text
ConnectionStrings__DefaultConnection=...
Jwt__Issuer=...
Jwt__Audience=...
Jwt__Key=...
```

Frontend `VITE_*` variables are embedded at build time and must point to the production API and SignalR hub.

The live production topology uses PostgreSQL, an API container, a frontend container, and a reverse proxy. Deployment manifests and host secrets are maintained outside this repository; do not expect local secret files to be included in a deployment.

## Verification

```powershell
dotnet build api/Bts.Api.csproj
cd web
npm run build
```

The repository-wide ESLint command currently reports legacy rule violations in older application files. New Build Week components were checked with focused lint runs, and both production builds pass.

## Documentation

- [Backend setup and API reference](api/README.md)
- [Frontend setup and routes](web/README.md)
- [Manual application test cases](docs/bro-techno-solutions-bts-test-cases.md)

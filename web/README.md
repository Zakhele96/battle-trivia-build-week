# Battle Trivia Web

React frontend for the Battle Trivia multiplayer platform and its OpenAI Build Week experience, **Battle It**.

## Stack

- React 19
- Vite 8
- Tailwind CSS 4
- React Router
- Axios
- Microsoft SignalR client

## Local Setup

Create `web/.env.local`:

```dotenv
VITE_API_BASE_URL=http://localhost:5001/api
VITE_HUB_URL=http://localhost:5001/hubs/chat
```

Optional integrations use:

```dotenv
VITE_GOOGLE_CLIENT_ID=
VITE_FACEBOOK_APP_ID=
VITE_FACEBOOK_GRAPH_VERSION=v22.0
VITE_SITE_URL=http://localhost:5173
VITE_OG_IMAGE_URL=
VITE_ADSENSE_CLIENT_ID=
VITE_ADSENSE_SUPPORT_SLOT_ID=
```

Do not expose server secrets or an OpenAI key through a `VITE_*` variable. Vite embeds these values into the browser bundle.

Install and run:

```powershell
npm install
npm run dev -- --host 0.0.0.0
```

Open `http://localhost:5173`.

## Routes

| Route | Access | Purpose |
|---|---|---|
| `/` | public/authenticated | Landing page or authenticated lobby |
| `/login` | public | Login |
| `/register` | public | Registration and verification entry |
| `/rooms` | authenticated | Game and community room directory |
| `/rooms/:roomId` | authenticated | Chat, trivia, Word Scramble, Arena, or Battle It room |
| `/leaderboards` | authenticated | Current and previous standings |
| `/profile` | authenticated | Current user profile and progression |
| `/profile/:userId` | authenticated | Player profile |
| `/activity` | authenticated | Activity history |
| `/alerts` | authenticated | Alerts and notifications |
| `/messages` | authenticated | Direct messages |
| `/squads` | authenticated | Squads |
| `/community` | authenticated | Community discovery |
| `/support` | authenticated | Support page |
| `/admin/trivia` | admin | Admin Command Center and AI Question Studio |

## Battle It UI Flow

The permanent Battle It room is discovered from the normal rooms API. No separate frontend route is required.

### Creator

1. Paste notes and/or upload up to two note images.
2. Select difficulty and answer duration.
3. Generate the private question pack.
4. Review and edit the title, questions, answers, accepted variants, explanations, concepts, and source proof.
5. Remove weak questions while keeping at least four.
6. Open the player lobby.
7. Start the battle.
8. After completion, replay the same pack without another AI request.

### Player

1. Join the same Battle It room.
2. Wait while the creator reviews or while the lobby is open.
3. Submit free-text answers through the existing room composer.
4. See answer feedback, synchronized reveals, source proof, progress, halftime standings, and the final podium.

The live screen deliberately keeps the main question card dominant. A compact progress rail shows `Question X of Y`; the larger duplicate live-status card was removed.

## Relevant Frontend Files

- `src/api/battleItApi.js` — Battle It HTTP client
- `src/components/battleIt/BattleItPanel.jsx` — creator studio, review, lobby, progress, halftime, podium, and replay
- `src/components/trivia/TriviaHeroCard.jsx` — timed question and post-round source proof
- `src/hooks/useRoomLiveState.js` — SignalR state and Battle It events
- `src/pages/RoomPage.jsx` — shared room composition and answer composer
- `src/pages/RoomsPage.jsx` — Battle It room discovery
- `src/pages/LobbyPage.jsx` — dashboard entry to Battle It
- `src/pages/AdminTriviaManagementPage.jsx` — Admin Command Center and AI Question Studio

## Realtime Events

`useRoomLiveState` consumes the shared trivia events:

- `QuestionStarted`
- `RoundEnded`
- `RoundWinners`
- `LeaderboardUpdated`
- `AnswerChecked`
- `AnswerRejected`

Battle It-specific events:

- `BattleItChanged`
- `BattleItHalftime`
- `BattleItCompleted`

On reconnect, the client rejoins the SignalR room and requests the current server state.

## API Authentication

The Axios client sends the stored JWT to protected HTTP endpoints. The SignalR connection supplies the same token through its access-token factory. Game answers are submitted through the hub and validated by the server.

## Scripts

```powershell
npm run dev      # Vite development server
npm run build    # production bundle
npm run lint     # repository ESLint rules
npm run preview  # serve the production bundle locally
```

The production build currently passes. The repository-wide lint command still reports legacy violations in older application files; focused lint checks pass for the new Battle It component and API client.

## Production Build

Set production values before building:

```dotenv
VITE_API_BASE_URL=https://api.example.com/api
VITE_HUB_URL=https://api.example.com/hubs/chat
VITE_SITE_URL=https://example.com
```

Then run:

```powershell
npm ci
npm run build
```

Deploy the generated `dist/` directory through the production frontend container or static host. Because Vite variables are build-time values, changing them requires a new frontend build.

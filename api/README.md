# Battle Trivia API

ASP.NET Core 8 backend for Battle Trivia. It provides authentication, rooms, chat, multiplayer games, scoring, leaderboards, administration, and the OpenAI-powered Build Week features.

## Stack

- .NET 8 and ASP.NET Core Web API
- PostgreSQL
- Dapper
- SignalR
- JWT bearer authentication
- FluentValidation
- optional Redis presence and SignalR backplane
- OpenAI Responses API

## Project Structure

```text
Controllers/   HTTP endpoints
Hubs/          SignalR room hub
Models/        domain models, requests, responses, and DTOs
Repositories/  Dapper data access
Services/      application logic, schema services, and hosted game loops
Validators/    request validation
SQL/           base schema and seed scripts
```

## Local Configuration

The application explicitly loads `appsettings.Local.json` after the standard ASP.NET configuration files. The project file excludes it from build and publish output, and Git ignores it.

Create `appsettings.Local.json` in this directory:

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
    "Model": "gpt-5.6-luna",
    "ReasoningEffort": "low",
    "MaxOutputTokens": 400,
    "QuestionStudioMaxOutputTokens": 3000,
    "BattleItMaxOutputTokens": 9000
  }
}
```

SMTP, OAuth, Redis, web-push, and payment configuration can be supplied in the same file for local development or through ASP.NET user secrets.

Never place a real key in tracked `appsettings.json`.

## Database Setup

1. Create a PostgreSQL database named `bts_db`.
2. For a new installation, apply the base scripts in `SQL/`, normally `schema.sql` followed by `seed.sql`, or restore a current database dump.
3. Start the API.

Startup schema services are idempotent and add application structures that postdate the base SQL files. `BattleItSchemaService`:

- adds `origin` and `created_by_user_id` to `trivia_questions`;
- creates the permanent `battle-it` room when it is missing;
- creates `battle_it_sessions`;
- creates `battle_it_session_questions`;
- enforces one lobby or active Battle It session per room.

Battle It questions are stored in `trivia_questions` only to reuse the existing round, answer, and scoring foreign keys. They are marked `origin = 'battle-it'`, inactive, and filtered out of all public question-bank queries.

## Run Locally

```powershell
dotnet restore
dotnet run --launch-profile http
```

Default development endpoints:

- API: `http://localhost:5001`
- Swagger: `http://localhost:5001/swagger`
- SignalR: `http://localhost:5001/hubs/chat`

## OpenAI Integration

All three AI features use the OpenAI Responses API and the model configured by `OpenAI:Model`, which defaults to `gpt-5.6-luna`.

### Battle Coach

`POST /api/ai/trivia/rounds/{roundId}/explanation`

- authentication required;
- only available after the round ends;
- returns an existing explanation without an AI call when one is already saved;
- otherwise generates a short explanation and persists it on the public trivia question;
- limited to five requests per user per minute;
- concurrent requests for the same question are serialized in-process.

### AI Question Studio

- `POST /api/admin/trivia-questions/ai/generate`
- `POST /api/admin/trivia-questions/ai/save`

The studio is admin-only. Generation returns strict structured drafts that remain editable and inactive. Saving normalizes question text and skips duplicates already in the database or repeated in the generated batch. Generation is limited to three requests per user per minute.

### AI Battle Creator: Battle It

All endpoints require authentication and are scoped to the permanent Battle It room:

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/rooms/{roomId}/battle-it/state` | Return the visible session state |
| `POST` | `/api/rooms/{roomId}/battle-it/generate` | Generate a private pack from multipart text/images |
| `PUT` | `/api/rooms/{roomId}/battle-it/sessions/{sessionId}` | Save creator edits to a draft |
| `POST` | `/api/rooms/{roomId}/battle-it/sessions/{sessionId}/open` | Open the reviewed player lobby |
| `POST` | `/api/rooms/{roomId}/battle-it/sessions/{sessionId}/start` | Create the game session and start automatic rounds |
| `POST` | `/api/rooms/{roomId}/battle-it/sessions/{sessionId}/replay` | Reopen the same completed pack without AI |

Generation accepts:

- optional `sourceText`, maximum 12,000 characters;
- up to two `images` in JPEG, PNG, or WebP format;
- maximum 5 MB per image;
- `difficulty`: `easy`, `medium`, or `hard`;
- `questionDurationSeconds`, clamped to 10–60 seconds.

At least text or one image is required. The server accepts only packs containing 4–20 usable questions. Battle It generation is limited to three requests per authenticated user per hour.

## Battle It Lifecycle

```text
idle -> draft -> lobby -> active -> completed
          ^                    |
          └------ replay ------┘
```

- Only the creator can view answer-bearing draft data or control the session.
- Lobby and active state never include correct answers.
- `BattleItHostedService` starts and ends the ordered rounds.
- Existing `TriviaAnswerService`, score ledger, leaderboard service, and session finalizer remain authoritative.
- The final round is followed by a completed session, stored results, and a top-three podium.
- Replaying resets the Battle It wrapper to `lobby` and creates a new game session on start.

The shared `trivia_game_sessions` table retains its legacy `weekly`/`continuous` constraint values. Battle It identity and finite length are defined by `battle_it_sessions`, the dedicated room, and its ordered question count.

## SignalR

The application uses one authenticated hub at `/hubs/chat`.

Battle It reuses the existing trivia events:

- `QuestionStarted`
- `RoundEnded`
- `RoundWinners`
- `LeaderboardUpdated`
- `AnswerChecked`
- `AnswerRejected`

It adds:

- `BattleItChanged` — tells clients to refresh the session state;
- `BattleItHalftime` — sends the question-10 standings for packs longer than 10;
- `BattleItCompleted` — sends the completed session title and podium.

`QuestionStarted` includes the finite question count and session title. `RoundEnded` includes the explanation, concept, and source excerpt. These answer-bearing fields are broadcast only after the server ends the round.

## Privacy and Cost Controls

- Responses API requests set `store: false`.
- Safety identifiers are derived from internal user IDs rather than user content.
- Prompts explicitly treat supplied notes and settings as untrusted data.
- Raw note text and image bytes are never written to the database.
- Original upload filenames are not retained.
- Image MIME types, byte lengths, and magic signatures are validated.
- No OpenAI calls occur during live rounds, scoring, reveals, leaderboards, or replay.
- The generation path checks for an existing lobby/active battle before spending credits.
- The API key is read only from configuration and is never returned to the client.

## Production Environment Variables

ASP.NET maps double underscores to nested configuration keys:

```text
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_HTTP_PORTS=8080

ConnectionStrings__DefaultConnection=...
Jwt__Issuer=Bts.Api
Jwt__Audience=Bts.Client
Jwt__Key=...

OpenAI__Enabled=true
OpenAI__ApiKey=...
OpenAI__Model=gpt-5.6-luna
OpenAI__ReasoningEffort=low
OpenAI__MaxOutputTokens=400
OpenAI__QuestionStudioMaxOutputTokens=3000
OpenAI__BattleItMaxOutputTokens=9000
```

Configure SMTP, OAuth, Redis, web push, and payment secrets using environment variables or a deployment secret manager as required. Local configuration files are intentionally not published.

## CORS

Allowed origins must include the deployed frontend. Development commonly uses:

- `http://localhost:5173`
- `http://localhost:5174`

The current production domains are configured in `Program.cs`.

## Verification

```powershell
dotnet build Bts.Api.csproj
dotnet publish Bts.Api.csproj -c Release
dotnet test
```

## Important Files

- `Program.cs` — dependency injection, authentication, CORS, rate limiting, and startup schema execution
- `Controllers/BattleItController.cs` — Battle It HTTP workflow
- `Services/BattleItGenerationService.cs` — source-grounded Responses API request
- `Services/BattleItService.cs` — validation and session orchestration
- `Services/BattleItHostedService.cs` — automatic finite round coordinator
- `Repositories/BattleItRepository.cs` — transactional Battle It persistence
- `Services/BattleItSchemaService.cs` — idempotent database extension
- `Hubs/ChatHub.cs` — room membership and answer submission

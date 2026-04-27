# BTS API

Backend API for the BTS platform.

This API powers:

- authentication
- chat rooms
- Battle Trivia
- Word Scramble
- moderation
- profiles
- leaderboards
- realtime updates through SignalR

## Stack

- .NET 8
- ASP.NET Core
- Dapper
- PostgreSQL
- SignalR
- JWT authentication

## Project Structure

- `Controllers/` - API endpoints
- `Services/` - business logic
- `Repositories/` - data access
- `Models/` - DTOs, requests, responses, domain models
- `Hubs/` - SignalR hubs
- `SQL/` - schema and seed scripts

## Requirements

- .NET 8 SDK
- PostgreSQL
- Visual Studio, VS Code, or Rider

## Local Development

### 1. Configure app settings

Update `appsettings.Development.json` or use user secrets.

Minimum local configuration:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=bts_db;Username=postgres;Password=YOUR_PASSWORD"
  },
  "Jwt": {
    "Issuer": "Bts.Api",
    "Audience": "Bts.Client",
    "Key": "YOUR_LONG_SECRET_KEY",
    "ExpiryMinutes": 10080
  },
  "Smtp": {
    "Host": "smtp.your-provider.com",
    "Port": "587",
    "Username": "YOUR_SMTP_USERNAME",
    "Password": "YOUR_SMTP_PASSWORD",
    "FromEmail": "no-reply@your-domain.com",
    "FromName": "BTS",
    "EnableSsl": "true"
  }
}
```

Recommended for local secrets:

```powershell
dotnet user-secrets set "Smtp:Host" "smtp.your-provider.com" --project c:\projects\api
dotnet user-secrets set "Smtp:Port" "587" --project c:\projects\api
dotnet user-secrets set "Smtp:Username" "YOUR_SMTP_USERNAME" --project c:\projects\api
dotnet user-secrets set "Smtp:Password" "YOUR_SMTP_PASSWORD" --project c:\projects\api
dotnet user-secrets set "Smtp:FromEmail" "no-reply@your-domain.com" --project c:\projects\api
dotnet user-secrets set "Smtp:FromName" "BTS" --project c:\projects\api
dotnet user-secrets set "Smtp:EnableSsl" "true" --project c:\projects\api
```

### 2. Email verification flow

Local email/password sign-up now requires email verification before first login.

Required SMTP settings:

- `Smtp:Host`
- `Smtp:Port`
- `Smtp:Username`
- `Smtp:Password`
- `Smtp:FromEmail`
- `Smtp:FromName`
- `Smtp:EnableSsl`

The API sends a 6-digit OTP and blocks login until the code is verified.

### 3. Create the database

Create a PostgreSQL database called `bts_db`.

### 4. Run SQL scripts

Use the scripts inside `SQL/` to create and seed the database.

Typical order:

1. `schema.sql`
2. `seed.sql`

If you have a current production-ready database dump, restore that instead.

### 5. Run the API

```powershell
dotnet restore
dotnet run
```

Default local API URL is usually:

- `https://localhost:7020`
- `http://localhost:5001`

Check your terminal output for the exact ports.

## CORS

The API should allow the frontend origins for both local and production.

Typical allowed origins include:

- `http://localhost:5173`
- `http://localhost:5174`
- `https://brotechnodevs.co.za`
- `https://www.brotechnodevs.co.za`

## SignalR

The chat hub is exposed at:

- `/hubs/chat`

This is used for:

- live room chat
- Battle Trivia round updates
- Word Scramble updates
- moderation events
- leaderboard events

## Authentication

The API uses JWT bearer authentication.

Main auth endpoints include:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/verify-email`
- `POST /api/auth/resend-verification`
- `POST /api/auth/google`
- `POST /api/auth/facebook`
- `GET /api/auth/me`

## Main Features

Rooms:

- list rooms
- get room details
- get room messages
- session status

Battle Trivia:

- live rounds
- answer submissions
- score updates
- leaderboard
- weekly results

Word Scramble:

- live rounds
- answer and guess submissions
- round state updates
- leaderboard
- weekly results

Moderation:

- delete messages
- mute users
- room moderation history
- slow mode

Profile:

- profile update
- password change
- stats and history
- achievements and progression

## Production Deployment

The API is designed to run in Docker.

Production container settings:

- `ASPNETCORE_ENVIRONMENT=Production`
- `ASPNETCORE_HTTP_PORTS=8080`

The production database connection is passed via environment variable:

- `ConnectionStrings__DefaultConnection`

Production JWT and SMTP values should also be passed via environment variables or a secrets manager.

Recommended SMTP environment variables:

- `Smtp__Host`
- `Smtp__Port`
- `Smtp__Username`
- `Smtp__Password`
- `Smtp__FromEmail`
- `Smtp__FromName`
- `Smtp__EnableSsl`

## Docker

Typical Docker build:

```powershell
docker compose build api
docker compose up -d api
```

## Useful Commands

Build:

```powershell
dotnet build
```

Publish:

```powershell
dotnet publish -c Release
```

Run tests:

```powershell
dotnet test
```

## Notes

- Do not commit real production secrets
- Keep production secret values on the server
- Prefer restoring the latest real database instead of relying on outdated schema files if the schema has drifted

## Status

This API currently supports the live production BTS platform and is intended to work together with the web frontend project.

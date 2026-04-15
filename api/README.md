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
- JWT Authentication

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
- Visual Studio / VS Code / Rider

## Local Development

### 1. Configure appsettings

Update `appsettings.json` or `appsettings.Development.json`:

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
  }
}

2. Create the database

Create a PostgreSQL database called:

bts_db
3. Run SQL scripts

Use the scripts inside SQL/ to create and seed the database.

Typical order:

schema.sql
seed.sql

If you have a current production-ready database dump, restore that instead.

4. Run the API
dotnet restore
dotnet run

Default local API URL is usually:

https://localhost:7020
http://localhost:5258

Check your terminal output for the exact ports.

CORS

The API should allow the frontend origins for both local and production.

Typical allowed origins include:

http://localhost:5173
https://localhost:5173
https://brotechnodevs.co.za
https://www.brotechnodevs.co.za
SignalR

The chat hub is exposed at:

/hubs/chat

This is used for:

live room chat
Battle Trivia round updates
Word Scramble updates
moderation events
leaderboard events
Authentication

The API uses JWT bearer authentication.

Main auth endpoints include:

POST /api/auth/register
POST /api/auth/login
GET /api/auth/me
Main Features
Rooms
list rooms
get room details
get room messages
session status
Battle Trivia
live rounds
answer submissions
score updates
leaderboard
weekly results
Word Scramble
live rounds
answer/guess submissions
round state updates
leaderboard
weekly results
Moderation
delete messages
mute users
room moderation history
slow mode
Profile
profile update
password change
stats/history
achievements/progression
Production Deployment

The API is designed to run in Docker.

Production container settings:

ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_HTTP_PORTS=8080

The production database connection is passed via environment variable:

ConnectionStrings__DefaultConnection

Production JWT values are also passed via environment variables.

Docker

Typical Docker build:

docker compose build api
docker compose up -d api
Useful Commands
Build
dotnet build
Publish
dotnet publish -c Release
Run tests
dotnet test
Notes
Do not commit real production secrets
Keep production .env values on the server
Prefer restoring the latest real database instead of relying on outdated schema files if the schema has drifted
Status

This API currently supports the live production BTS platform and is intended to work together with the web frontend project.
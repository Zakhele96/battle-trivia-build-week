# BTS Monorepo

Full source for the BTS platform.

This repository contains the complete application stack for:

- live chat rooms
- Battle Trivia
- Word Scramble
- user accounts
- moderation tools
- profiles and progression
- weekly leaderboards
- production deployment

## Repository Structure

```text
.
├── api/   # .NET backend API
├── web/   # React + Vite frontend

Apps
api/

ASP.NET Core backend using:

.NET 8
Dapper
PostgreSQL
SignalR
JWT authentication

Main responsibilities:

auth
rooms
chat
trivia
word scramble
moderation
profile
leaderboards
realtime events
web/

React frontend using:

React
Vite
Tailwind CSS
Axios
SignalR client
React Router

Main responsibilities:

auth UI
lobby
room experience
profile
admin tools
leaderboards
Production Domains

Frontend:

https://brotechnodevs.co.za

API:

https://api.brotechnodevs.co.za
Local Development
Backend

Go into the API project:

cd api
dotnet restore
dotnet run
Frontend

Go into the web project:

cd web
npm install
npm run dev
Local Environment
Frontend local env

Example:

VITE_API_BASE_URL=http://localhost:7020/api
VITE_HUB_URL=http://localhost:7020/hubs/chat
Backend local config

Example appsettings.json:

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
Production Deployment

This project is deployed on Docker with:

PostgreSQL
API container
frontend container
Caddy reverse proxy

Main production files live in the repo root/server root:

docker-compose.yml
Caddyfile
deploy.sh

Production secrets are not committed to Git.
They stay on the server in:

/opt/bts/.env
Deployment Flow
Local machine

Make changes, then:

git add .
git commit -m "your change"
git push
Server

Deploy latest code:

cd /opt/bts
./deploy.sh
Recommended Git Ignore

This repo should ignore build output and secrets such as:

api/bin
api/obj
web/node_modules
web/dist
.env
Data and Database

The live system uses PostgreSQL.

Database content includes:

users
rooms
chat messages
moderation actions
trivia questions
trivia sessions
scramble words
scramble sessions
achievements and profile stats

When schema drift happens, prefer restoring from the latest real database dump instead of relying only on old SQL seed files.

Core Features
Realtime Rooms
general chat
live message stream
SignalR-powered updates
moderation events
Battle Trivia
live timed rounds
leaderboard updates
answer tracking
session winners
Word Scramble
timed word rounds
reveal phases
scoreboard
weekly standings
Profiles
update profile
stats
history
achievements
progression
Leaderboards
Battle Trivia weekly leaderboard
Word Scramble weekly leaderboard
combined leaderboard
Notes
keep production secrets off GitHub
keep package-lock.json in sync with package.json
if frontend Docker build fails on npm ci, update the lock file with npm install and commit it
always test both frontend and API after deploy
Status

This repository is the main monorepo for the live BTS platform.
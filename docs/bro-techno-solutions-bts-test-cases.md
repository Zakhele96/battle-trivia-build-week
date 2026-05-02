# Bro Techno Solutions
## BTS Application Test Cases

Document owner: Bro Techno Solutions  
Application under test: BTS  
Test type: Manual functional QA, smoke, regression, and UAT support  
Last updated: 2026-04-30

## 1. Purpose

This document provides branded test cases for the BTS application so Bro Techno Solutions can validate the platform consistently across releases. The coverage focuses on the core player journey, realtime gameplay, moderation, and supporting account features.

## 2. Scope

Covered areas:

- Public landing page
- Registration and login
- Email verification
- Lobby and navigation
- Rooms and realtime chat
- Battle Trivia
- Word Scramble
- Direct messages
- Alerts
- Squads and community areas
- Profiles and progression
- Leaderboards
- Support
- Admin and moderation
- Responsive behavior
- Light mode and dark mode

## 3. Recommended Test Environments

- Desktop Chrome latest
- Desktop Edge latest
- Android Chrome latest
- iPhone Safari latest

## 4. Suggested Test Accounts

- `player1@brotechnosolutions.test` - normal verified player
- `player2@brotechnosolutions.test` - second verified player
- `admin@brotechnosolutions.test` - admin account
- `unverified@brotechnosolutions.test` - newly registered unverified user

## 5. Severity Guide

- `P1` Critical: blocks core use or breaks gameplay
- `P2` High: major feature issue with workaround or partial failure
- `P3` Medium: usability or presentation issue
- `P4` Low: polish issue with no feature loss

## 6. Test Case Format

Each case includes:

- Test case ID
- Module
- Priority
- Preconditions
- Steps
- Expected result

## 7. Test Cases

### 7.1 Public Landing Page

| ID | Module | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| BTS-LND-001 | Landing Page | P2 | User is signed out | Open `/` | Public landing page loads, brand messaging is visible, and no protected app data is exposed |
| BTS-LND-002 | Landing Page | P1 | User is signed out | Click `Launch Game` from landing page | User is routed into the login flow |
| BTS-LND-003 | Landing Page | P2 | User is signed out | Click `Sign in` | Login page opens correctly |
| BTS-LND-004 | Landing Page | P2 | User is signed out | Click `Join now` | Registration page opens correctly |
| BTS-LND-005 | Landing Page | P3 | User is signed out | View landing page on mobile | Hero layout, phone mock, CTA buttons, and copy remain readable without overlap or clipping |

### 7.2 Registration, Login, and Verification

| ID | Module | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| BTS-AUTH-001 | Registration | P1 | User is signed out | Register with valid new user data | Account is created and verification step is triggered |
| BTS-AUTH-002 | Registration | P2 | User is signed out | Register with missing required fields | Validation messages appear and submission is blocked |
| BTS-AUTH-003 | Registration | P2 | User is signed out | Register with mismatched passwords | User sees password mismatch validation |
| BTS-AUTH-004 | Verification | P1 | Newly registered user exists | Enter correct 6-digit OTP | Email is verified successfully |
| BTS-AUTH-005 | Verification | P1 | Newly registered user exists | Try login before verifying email | Login is blocked until verification is completed |
| BTS-AUTH-006 | Verification | P2 | Newly registered user exists | Request resend verification code | New OTP is generated and resend feedback is shown |
| BTS-AUTH-007 | Login | P1 | Verified user exists | Login with valid credentials | User is authenticated and sent into the app |
| BTS-AUTH-008 | Login | P1 | Verified user exists | Login with invalid password | Login fails with clear error feedback |
| BTS-AUTH-009 | Social Login | P2 | Social auth is configured | Login with Google | User can authenticate successfully or receives a clear failure message |
| BTS-AUTH-010 | Social Login | P2 | Social auth is configured | Login with Facebook | User can authenticate successfully or receives a clear failure message |
| BTS-AUTH-011 | Session | P1 | User is logged in | Refresh the browser on a protected route | Session persists and the route remains accessible |
| BTS-AUTH-012 | Session | P2 | User is logged in | Sign out | User session ends and protected pages are no longer accessible |

### 7.3 Lobby and Navigation

| ID | Module | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| BTS-LOB-001 | Lobby | P1 | Verified user is logged in | Open `/` while signed in | User lands in the lobby instead of the public landing page |
| BTS-LOB-002 | Lobby | P2 | User is logged in | Review lobby cards and sections | Core modules are visible and actionable |
| BTS-LOB-003 | Navigation | P1 | User is logged in | Navigate to Rooms, Alerts, Messages, Squads, Community, Leaderboards, Profile, Activity, and Support | Each destination loads without redirect loops or broken routes |
| BTS-LOB-004 | Lobby | P3 | User is logged in | Scroll through lobby on mobile | Layout stays readable and sections load without clipping |
| BTS-LOB-005 | Theme | P3 | User is logged in | Switch between light and dark mode if available | Cards, text, and imagery remain readable in both themes |

### 7.4 Rooms and Realtime Chat

| ID | Module | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| BTS-ROOM-001 | Rooms | P1 | User is logged in | Open rooms list | Available rooms load successfully |
| BTS-ROOM-002 | Rooms | P1 | User is logged in | Join a room | Room page loads with current room state |
| BTS-ROOM-003 | Chat | P1 | Two users are in the same room | User A sends a message | User B sees the message in realtime |
| BTS-ROOM-004 | Chat | P2 | User is in a room | Send a blank or whitespace-only message | Message is blocked and not posted |
| BTS-ROOM-005 | Chat | P2 | User is in a room | Send multiple normal messages | Messages appear in order without duplication |
| BTS-ROOM-006 | Chat | P2 | User is in a room | Leave and re-enter the room | Message history and room state reload correctly |
| BTS-ROOM-007 | Chat | P3 | User is in a room on mobile | Review chat stream and composer area | Input, stream, and footer remain usable on small screens |

### 7.5 Battle Trivia

| ID | Module | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| BTS-TRI-001 | Battle Trivia | P1 | Trivia room is active | Join active trivia room | Current round, timer, and room state render correctly |
| BTS-TRI-002 | Battle Trivia | P1 | Trivia question is open | Submit a valid answer before round ends | Answer is accepted for the current round |
| BTS-TRI-003 | Battle Trivia | P1 | Trivia question is open | Submit after the timer expires | Late answer is rejected |
| BTS-TRI-004 | Battle Trivia | P1 | Multiple players are active | End a round with different answers | Scores update correctly for the round outcome |
| BTS-TRI-005 | Battle Trivia | P2 | Trivia room is active | Observe countdown behavior during final seconds | Countdown visuals and warning cues align with visible time |
| BTS-TRI-006 | Battle Trivia | P2 | Trivia session completes | Review winners and results | Session winners and score order display correctly |
| BTS-TRI-007 | Battle Trivia | P3 | User is on mobile | Play through a round | Question, timer, answer area, and chat remain readable on mobile |

### 7.6 Word Scramble

| ID | Module | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| BTS-WS-001 | Word Scramble | P1 | Scramble room is active | Join active Word Scramble room | Current scramble state loads correctly |
| BTS-WS-002 | Word Scramble | P1 | Scramble round is active | Submit a correct answer | Correct score or success state is applied |
| BTS-WS-003 | Word Scramble | P1 | Scramble round is active | Submit an incorrect answer | Submission is handled correctly without false scoring |
| BTS-WS-004 | Word Scramble | P2 | Scramble round is active | Submit after the round closes | Late submission is rejected |
| BTS-WS-005 | Word Scramble | P2 | Session is active | Observe round transitions | Reveal, scoring, and next-round updates appear correctly |
| BTS-WS-006 | Word Scramble | P3 | User is on mobile | Play through a round | Scramble interface remains usable and readable on mobile |

### 7.7 Direct Messages

| ID | Module | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| BTS-DM-001 | Direct Messages | P1 | Two users exist | Open messages page and start or open a conversation | Conversation thread loads correctly |
| BTS-DM-002 | Direct Messages | P1 | Two users are in a DM thread | Send a message | Recipient sees the new message in realtime |
| BTS-DM-003 | Direct Messages | P2 | User is reading an older position in the thread | Send a new message | Thread jumps to the latest message after send |
| BTS-DM-004 | Direct Messages | P2 | A message exists in DM | React with one emoji, then another | Previous reaction is replaced by the new one for that user |
| BTS-DM-005 | Direct Messages | P2 | A message exists in DM | React with the same emoji twice | Reaction toggles off |
| BTS-DM-006 | Direct Messages | P3 | User is on mobile | Review DM layout with long names and replies | Rows, bubbles, and reply previews stay aligned without clipping |

### 7.8 Alerts, Squads, Community, and Support

| ID | Module | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| BTS-ALT-001 | Alerts | P2 | User is logged in | Open Alerts page | Alerts page loads and displays available items or an empty state |
| BTS-SQD-001 | Squads | P2 | User is logged in | Open Squads page | Squads page loads without layout or theme issues |
| BTS-COM-001 | Community | P2 | User is logged in | Open Community page | Community page loads correctly |
| BTS-SUP-001 | Support | P2 | User is logged in | Open Support page | Support page loads correctly |
| BTS-SUP-002 | Support | P3 | User is logged in | Use support actions or forms if configured | Submission succeeds or shows clear validation feedback |

### 7.9 Profiles, Progression, and Activity

| ID | Module | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| BTS-PRO-001 | Profile | P1 | User is logged in | Open Profile page | Profile details load correctly |
| BTS-PRO-002 | Profile | P2 | User is logged in | Update editable profile fields | Changes save and persist after refresh |
| BTS-PRO-003 | Profile | P2 | User is logged in | Change password with valid inputs | Password is updated successfully |
| BTS-PRO-004 | Profile | P2 | User is logged in | Review stats, history, achievements, and progression | Each section displays valid user data or a clean empty state |
| BTS-PRO-005 | Activity | P2 | User is logged in | Open Activity page | Activity page loads correctly |
| BTS-PRO-006 | Public Profile | P2 | User is logged in | Open another user profile route | Target profile page loads and displays expected data |
| BTS-PRO-007 | Theme | P3 | User is logged in | Review profile controls in light mode | Custom controls remain readable and visibly themed |

### 7.10 Leaderboards

| ID | Module | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| BTS-LDR-001 | Leaderboards | P1 | User is logged in | Open Leaderboards page | Leaderboards page loads correctly |
| BTS-LDR-002 | Leaderboards | P1 | Ranking data exists | View Battle Trivia weekly leaderboard | Entries are sorted correctly by score |
| BTS-LDR-003 | Leaderboards | P1 | Ranking data exists | View Word Scramble weekly leaderboard | Entries are sorted correctly by score |
| BTS-LDR-004 | Leaderboards | P2 | Ranking data exists | View combined or alternate leaderboard modes if available | Mode switch updates the displayed leaderboard correctly |
| BTS-LDR-005 | Leaderboards | P2 | Ranking data exists | Review top winners area | Podium or winners section matches top-ranked players |
| BTS-LDR-006 | Leaderboards | P3 | Ranking data exists | Review avatars and online indicators where available | Identity and presence render correctly without broken images |
| BTS-LDR-007 | Shared Leaderboard | P2 | Shared route is enabled | Open `/share/leaderboard` | Shared leaderboard renders for public viewing as intended |

### 7.11 Moderation and Admin

| ID | Module | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| BTS-MOD-001 | Moderation | P1 | Admin user is logged in | Open admin trivia management page | Admin command center loads successfully |
| BTS-MOD-002 | Moderation | P1 | Admin and normal user are in a room | Delete a user message | Message is removed and room reflects the moderation action |
| BTS-MOD-003 | Moderation | P1 | Admin and normal user are in a room | Mute a user | Muted user can no longer chat for the mute duration |
| BTS-MOD-004 | Moderation | P1 | Room supports slow mode | Enable slow mode and have a player spam messages | Extra sends are blocked until cooldown expires |
| BTS-MOD-005 | Moderation | P2 | Slow mode is enabled | Attempt to send too quickly from the UI | Frontend shows clear cooldown or slow-mode feedback |
| BTS-MOD-006 | Admin Users | P2 | Admin user exists | Promote another user to admin | User becomes admin after re-authentication or token refresh |
| BTS-MOD-007 | Admin Users | P2 | Two admins exist | Demote an admin user | Admin access is removed after re-authentication or token refresh |
| BTS-MOD-008 | Admin Security | P1 | Normal user is logged in | Open admin route directly | Access is denied |

### 7.12 Realtime, Theme, and Responsiveness Regression

| ID | Module | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| BTS-REG-001 | Realtime | P1 | Two users are active | Trigger chat, gameplay, or leaderboard updates | Other user receives updates without manual refresh |
| BTS-REG-002 | Responsiveness | P2 | User is logged in | Test landing, lobby, room, DM, profile, and leaderboard pages on mobile widths | No major overflow, hidden controls, or clipped primary content |
| BTS-REG-003 | Theme | P2 | Theme options are available | Review the app in both light and dark mode | Surfaces, fixed navigation, cards, and images remain stable and readable |
| BTS-REG-004 | Navigation | P2 | User is logged in | Use browser back and forward across core pages | App navigation remains coherent and state does not break |
| BTS-REG-005 | Error Handling | P2 | API or connection is interrupted | Attempt protected or realtime actions | User gets graceful feedback instead of a broken blank screen |

## 8. Suggested Smoke Test Pack

Run these first after each deployment:

1. `BTS-LND-001`
2. `BTS-AUTH-007`
3. `BTS-LOB-001`
4. `BTS-ROOM-003`
5. `BTS-TRI-002`
6. `BTS-WS-002`
7. `BTS-DM-002`
8. `BTS-LDR-001`
9. `BTS-MOD-004`
10. `BTS-REG-001`

## 9. UAT Sign-Off Template

Use this section for release approval:

- Release version:
- Environment tested:
- Test start date:
- Test end date:
- Tested by:
- Passed cases:
- Failed cases:
- Blockers:
- Final decision: Pass / Pass with conditions / Fail

## 10. Notes for Bro Techno Solutions

- Keep a stable set of reusable test accounts for player, moderator, and admin coverage.
- Prioritize realtime, timer-based, and multi-user scenarios because they represent the highest product risk.
- Re-run theme and mobile checks after any landing page, room, lobby, or profile UI changes.
- Re-run moderation and token-based access checks after any admin-role changes.

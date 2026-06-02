# Clean Code Rules — enforce on every file

## Functions
- One function = one responsibility, max 20 lines
- Name functions as verbs: getJobs, scoreJob, dismissJob
- No function parameters beyond 3 — use an options object if more needed

## Constants
- Zero magic numbers or hardcoded strings anywhere in the codebase
- All constants live in server/constants.js and client/src/constants.js
- Examples: MATCH_THRESHOLD = 70, SCORE_CAP_NEGATIVE = 60, API_BASE_URL

## Error handling
- Every async function has try/catch
- catch blocks log a specific message: '[adzuna] Failed to fetch page 2: 404'
- Never catch and silently ignore — always log to errors table or console

## Database
- All SQL lives exclusively in server/db.js
- Routes call db functions by name — never write SQL inline in index.js

## Environment
- Server validates all required env vars before app.listen()
- If any are missing: print exactly which ones, print 'See .env.example', exit(1)

## Logging
- Use a tiny logger wrapper (server/logger.js) instead of raw console.log
- Format: [2024-01-15 08:32:11] [INFO] Scrape complete — 12 new jobs
- Levels: INFO, WARN, ERROR

## General
- No commented-out code committed
- No TODO comments left in final code
- Every API route validates its inputs before touching the DB

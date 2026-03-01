# AI Job Tailor — Chrome Extension

Chrome extension (Manifest V3) that injects a **Generate Resume** button into LinkedIn job postings. On click, it scrapes the job description and sends it to the AI Job Tailor web app to generate a tailored resume PDF.

**Web app:** https://resume.adampeer.me  
**API base URL:** defined in `config.js`

## Tech Stack

Vanilla JavaScript, no build step. Scripts run directly in Chrome.

- **Runtime:** Chrome Extensions API (Manifest V3)
- **Auth:** Token-based via Supabase JWTs obtained from the web app
- **Linting:** ESLint

## File Overview

```
manifest.json         # Extension config: permissions, content scripts, service worker
background.js         # Service worker: token storage/refresh, message routing
contentScript.js      # Runs on LinkedIn job pages: injects button, scrapes job, calls API
authContentScript.js  # Intercepts postMessage tokens from web app auth page
popup.html/js/css     # Extension popup UI: auth status, connect/disconnect
config.js             # API base URL config
scripts/              # Helper scripts
styles/               # CSS
assets/               # Icons
```

## Authentication Flow

1. User opens popup → clicks **Connect** → sends `START_AUTH` message
2. `background.js` opens `https://resume.adampeer.me/auth/extension` in a new tab
3. Web app posts `{ type: 'RESUME_TAILOR_AUTH', access_token, refresh_token, expires_at, user_id }` via `window.postMessage`
4. `authContentScript.js` listens for the message, forwards it to `background.js` via `AUTH_TOKEN_RECEIVED`
5. `background.js` stores tokens in `chrome.storage.local`; tokens are checked for expiry (60s buffer) before each API call

## Resume Generation Flow

1. `contentScript.js` detects a LinkedIn job page, injects a **Generate Resume** button
2. On click: scrapes job title, company, and description from the DOM
3. Sends `GET_ACCESS_TOKEN` message to `background.js` to retrieve a valid token
4. POSTs to `{API_BASE_URL}/api/generate-resume` with `Authorization: Bearer {token}` and `{ jobInfo: { content, url } }`
5. On success: triggers a file download of the returned PDF

## Message Types

| Type | Direction | Purpose |
|---|---|---|
| `START_AUTH` | popup → background | Open auth tab |
| `AUTH_TOKEN_RECEIVED` | authContentScript → background | Store tokens from web app |
| `GET_ACCESS_TOKEN` | contentScript → background | Get valid token for API call |
| `GET_AUTH_STATUS` | popup → background | Check if user is authenticated |
| `LOGOUT` | popup → background | Clear stored auth data |
| `JT_STATUS` | contentScript → background | Report generation success/error |

## Permissions

```json
"permissions": ["storage", "activeTab", "scripting", "downloads", "tabs"]
"host_permissions": [
  "http://localhost:3000/*",
  "https://localhost:3000/*",
  "https://resume.adampeer.me/*"
]
```

## Common Commands

```bash
npm run lint    # ESLint
```

To test locally: load the extension as an unpacked extension from this folder in `chrome://extensions`. Point `config.js` to `http://localhost:3000` for local web app development.

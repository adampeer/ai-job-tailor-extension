# Job Tailor Chrome Extension

A Chrome extension that scrapes job details from LinkedIn and generates tailored resumes using [Resume Tailor](https://resume.adampeer.me).

## Features

- Injects a "Generate Resume" button on LinkedIn job pages
- Authenticates with Resume Tailor via OAuth-style flow
- Shows connection status in the extension popup

## Installation

1. Clone this repository
2. Go to `chrome://extensions/` (or `edge://extensions/`) and enable "Developer mode"
3. Click "Load unpacked" and select the extension folder

## Usage

1. Click the extension icon and connect to Resume Tailor
2. Navigate to a LinkedIn job search page
3. Click "Generate Resume" next to any job listing

## Permissions

- `storage` – Store authentication tokens
- `activeTab` / `scripting` – Inject button into LinkedIn pages
- `tabs` – Open authentication page

## Privacy

- Only authentication tokens are stored locally
- No analytics or tracking
- **Note:** Scraping LinkedIn may violate their ToS. Use for personal purposes only.

## Troubleshooting

- **Button not appearing:** Refresh the LinkedIn job search page
- **Authentication errors:** Click "Disconnect" in popup, then reconnect

# Job Tailor Chrome Extension

**Job Tailor** is a Chrome extension that helps you scrape job details from LinkedIn job pages and send them to a deployed backend for resume generation.

---

## Features

- Scrapes job content and URL from LinkedIn job pages
- Sends job data to a backend API for resume generation
- Authenticates with the backend using a session token
- Friendly UX with loading, success, and error states
- Supports manual re-sync and automatic session management
- Injects a "Generate Resume" button directly into LinkedIn job pages

---

## Installation

1. **Clone this repository:**

   ```sh
   git clone https://github.com/yourusername/job-tailor-chrome-extension.git
   ```

2. **Install the extension in Chrome:**

   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the folder containing this extension

---

## Usage

1. **Navigate to a LinkedIn job search page** (e.g., `https://www.linkedin.com/jobs/search/`)
2. **The "Generate Resume" button will appear next to the "Save" button** on job listings
3. **Click "Generate Resume"** to send the job data to the backend
   - On first use, the extension will auto-sync your session
   - If authentication fails, you'll see a "Re-sync Session" button to manually retry
   - Success/error states are shown directly on the button

---

## Permissions

This extension requests the following permissions:

- `storage` – to store your session token
- `activeTab` – to interact with the current tab
- `scripting` – to inject the Generate Resume button into LinkedIn pages
- `host_permissions` – to communicate with the backend API

---

## Backend

This extension is designed to work with a deployed backend (Next.js app) hosted on Vercel.  
**Note:** The backend source code is private and not included in this repository.  
You will only have access to the deployed app and its API endpoints.

---

## Privacy & Disclaimer

- This extension does **not** collect or transmit any personal data except the session token used for authentication with the backend.
- No analytics or tracking is included.
- **Disclaimer:** Scraping LinkedIn may violate their terms of service. Use this extension for personal/research purposes only.

---

## Troubleshooting

**Button doesn't appear:**

- Make sure you're on a LinkedIn job search page (`/jobs/search/`)
- The button appears next to the "Save" button on job listings
- Try refreshing the page

**Authentication errors (401):**

- Click the "Re-sync Session" button that appears
- Make sure you're logged in to the backend web app in the same browser

---

## Support

If you encounter issues, please open an issue on GitHub or contact the maintainer.

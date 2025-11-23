importScripts("config.js");

const SESSION_ENDPOINT = `${CONFIG.API_BASE_URL}/api/session-token`;

async function requestAndStoreSessionToken(triggerSource) {
  try {
    const response = await fetch(SESSION_ENDPOINT, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const { access_token } = await response.json(); // Changed from 'token' to 'access_token'
    if (!access_token) {
      throw new Error("Missing token in response");
    }

    await chrome.storage.local.set({ sessionToken: access_token }); // Store the access_token
    console.log(`[session] Stored session token after ${triggerSource}.`);
    return { ok: true };
  } catch (error) {
    console.error(`[session] Failed to sync (${triggerSource}):`, error);
    return { ok: false, message: error.message };
  }
}

chrome.runtime.onInstalled.addListener(() => {
  requestAndStoreSessionToken("install");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "SYNC_SESSION") {
    requestAndStoreSessionToken("manual click").then(sendResponse);
    return true; // keep channel open
  }

  if (message?.type === "GET_SESSION_TOKEN") {
    chrome.storage.local.get("sessionToken", ({ sessionToken }) => {
      console.log(
        "[background] Retrieved token for content script:",
        sessionToken ? "✅ Found" : "❌ Missing"
      );
      sendResponse({ token: sessionToken });
    });
    return true; // keep channel open
  }

  return undefined;
});

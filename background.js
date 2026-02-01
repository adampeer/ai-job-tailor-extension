importScripts("config.js");

const AUTH_STORAGE_KEY = "authData";
const AUTH_URL = `${CONFIG.API_BASE_URL}/auth/extension`;

async function getAuthData() {
  const result = await chrome.storage.local.get(AUTH_STORAGE_KEY);
  return result[AUTH_STORAGE_KEY] || null;
}

async function setAuthData(data) {
  await chrome.storage.local.set({ [AUTH_STORAGE_KEY]: data });
}

async function clearAuthData() {
  await chrome.storage.local.remove(AUTH_STORAGE_KEY);
}

function isTokenExpired(expiresAt) {
  const bufferMs = 60 * 1000;
  return Date.now() >= expiresAt * 1000 - bufferMs;
}

async function getValidAccessToken() {
  const authData = await getAuthData();
  if (!authData) {
    return null;
  }

  if (isTokenExpired(authData.expires_at)) {
    console.log("[auth] Token expired, clearing auth data");
    await clearAuthData();
    return null;
  }

  return authData.access_token;
}

async function openAuthTab() {
  const tab = await chrome.tabs.create({ url: AUTH_URL });
  return tab.id;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "AUTH_TOKEN_RECEIVED") {
    const { payload } = message;
    setAuthData({
      access_token: payload.access_token,
      refresh_token: payload.refresh_token,
      expires_at: payload.expires_at,
      user_id: payload.user_id,
    })
      .then(() => {
        console.log("[auth] Token stored successfully");
        if (sender.tab?.id) {
          chrome.tabs.remove(sender.tab.id).catch(() => {});
        }
        sendResponse({ ok: true });
      })
      .catch((error) => {
        console.error("[auth] Failed to store token:", error);
        sendResponse({ ok: false, message: error.message });
      });
    return true;
  }

  if (message?.type === "START_AUTH") {
    openAuthTab()
      .then((tabId) => {
        sendResponse({ ok: true, tabId });
      })
      .catch((error) => {
        sendResponse({ ok: false, message: error.message });
      });
    return true;
  }

  if (message?.type === "GET_AUTH_STATUS") {
    getAuthData()
      .then((authData) => {
        if (!authData) {
          sendResponse({ authenticated: false });
          return;
        }
        if (isTokenExpired(authData.expires_at)) {
          clearAuthData().then(() => {
            sendResponse({ authenticated: false });
          });
          return;
        }
        sendResponse({
          authenticated: true,
          user_id: authData.user_id,
          expires_at: authData.expires_at,
        });
      })
      .catch((error) => {
        sendResponse({ authenticated: false, error: error.message });
      });
    return true;
  }

  if (message?.type === "GET_ACCESS_TOKEN") {
    getValidAccessToken()
      .then((token) => {
        sendResponse({ token });
      })
      .catch((error) => {
        sendResponse({ token: null, error: error.message });
      });
    return true;
  }

  if (message?.type === "LOGOUT") {
    clearAuthData()
      .then(() => {
        sendResponse({ ok: true });
      })
      .catch((error) => {
        sendResponse({ ok: false, message: error.message });
      });
    return true;
  }

  return undefined;
});

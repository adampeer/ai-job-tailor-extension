console.log("[Job Tailor] Auth content script loaded on:", window.location.href);

window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  if (event.data?.type !== "RESUME_TAILOR_AUTH") return;

  const { payload } = event.data;
  if (!payload?.access_token || !payload?.refresh_token || !payload?.expires_at || !payload?.user_id) {
    console.error("[Job Tailor] Invalid auth payload received:", payload);
    return;
  }

  console.log("[Job Tailor] Received auth token from web app");

  chrome.runtime.sendMessage(
    {
      type: "AUTH_TOKEN_RECEIVED",
      payload: {
        access_token: payload.access_token,
        refresh_token: payload.refresh_token,
        expires_at: payload.expires_at,
        user_id: payload.user_id,
      },
    },
    (response) => {
      if (response?.ok) {
        console.log("[Job Tailor] Auth token stored successfully");
      } else {
        console.error("[Job Tailor] Failed to store auth token:", response?.message);
      }
    }
  );
});

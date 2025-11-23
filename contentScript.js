console.log("Content script loaded");

/**
 * @function autoSyncSession
 * @description
 * Uses chrome.runtime.sendMessage to trigger a session sync with the background script.
 * This is typically called on extension load or after a failed API call (401).
 *
 * JSDom: This function interacts with the Chrome extension messaging API and does not modify the DOM.
 * It logs the result of the sync attempt to the console.
 */
const autoSyncSession = () => {
  chrome.runtime.sendMessage({ type: "SYNC_SESSION" }, (response) => {
    if (response?.ok) {
      console.log("✅ Session auto-synced successfully");
    } else {
      console.error("❌ Auto-sync failed:", response?.message);
    }
  });
};

/**
 * Scrapes job information from the LinkedIn job page.
 */
const scrapeJob = () => {
  // Get the raw text from the page
  let rawText = document.body.innerText;
  // Replace one or more newline characters with a single space.
  let processedText = rawText.replace(/[\n\r]+/g, " ");
  // Replace multiple spaces with a single space.
  let cleanedText = processedText.replace(/\s+/g, " ").trim();

  return { content: cleanedText, url: window.location.href };
};

/**
 * Finds the "Save" button contextually.
 * @returns {HTMLElement|null}
 */
const findJobActionsSaveButton = () => {
  // Get current window url
  const currentUrl = window.location.href;
  if (currentUrl.includes("/jobs/search/")) {
    const allButtons = document.querySelectorAll("button");
    console.log("Total buttons found on page:", allButtons);
    for (const button of allButtons) {
      const buttonText = button.textContent.trim().toLowerCase();
      if (buttonText.includes("save")) {
        const parentContainer = button.parentElement;
        if (parentContainer?.textContent.toLowerCase().includes("apply")) {
          return button;
        }
      }
    }
  }

  return null;
};

/*
 * Retrieves the session token from the background script via messaging.
 */
const getSessionToken = () =>
  new Promise((resolve) => {
    if (typeof chrome === "undefined" || !chrome.runtime) {
      console.error("Chrome runtime is unavailable.");
      resolve(undefined);
      return;
    }

    chrome.runtime.sendMessage({ type: "GET_SESSION_TOKEN" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Failed to get session token:", chrome.runtime.lastError);
        resolve(undefined);
        return;
      }
      console.log("Session token retrieved via message:", response?.token);
      resolve(response?.token);
    });
  });

/*
 * Shows the re-sync button for session management.
 */
const showResyncButton = () => {
  // Remove any existing re-sync button
  const oldBtn = document.getElementById("jt-resync-btn");
  if (oldBtn) oldBtn.remove();

  // Find the Generate Resume button to place next to
  const generateBtn = document.getElementById("custom-scrape-button");
  if (!generateBtn) return;

  // Create the re-sync button
  const resyncBtn = document.createElement("button");
  resyncBtn.id = "jt-resync-btn";
  resyncBtn.innerHTML = "Re-sync Session";
  resyncBtn.style.marginLeft = "1rem";
  resyncBtn.style.padding = "1rem 2rem";
  resyncBtn.style.backgroundColor = "#fffbcc";
  resyncBtn.style.color = "#6b5500";
  resyncBtn.style.border = "1px solid #f3d36b";
  resyncBtn.style.borderRadius = "99rem";
  resyncBtn.style.fontWeight = "600";
  resyncBtn.style.fontSize = "16px";
  resyncBtn.style.lineHeight = "20px";
  resyncBtn.style.cursor = "pointer";
  resyncBtn.style.display = "inline-flex";
  resyncBtn.style.alignItems = "center";
  resyncBtn.style.gap = "0.5em";
  resyncBtn.style.verticalAlign = "middle";

  // Spinner/tick/cross for feedback
  const spinner = `<span class="jt-spinner" style="display:inline-block;width:18px;height:18px;border:2px solid #fff;border-top:2px solid #f3d36b;border-radius:50%;animation:jt-spin 0.8s linear infinite;vertical-align:middle;"></span>`;
  const tick = `<span style="font-size:18px;vertical-align:middle;color:#2ecc40;">&#10003;</span>`;
  const cross = `<span style="font-size:18px;vertical-align:middle;color:#ff4136;">&#10060;</span>`;

  resyncBtn.addEventListener("click", () => {
    resyncBtn.disabled = true;
    resyncBtn.innerHTML = `${spinner} Syncing...`;
    chrome.runtime.sendMessage({ type: "SYNC_SESSION" }, (response) => {
      if (response?.ok) {
        resyncBtn.innerHTML = `${tick} Synced!`;
        resyncBtn.style.backgroundColor = "#eafbe7";
        resyncBtn.style.color = "#2ecc40";
        setTimeout(() => resyncBtn.remove(), 2000);
      } else {
        resyncBtn.innerHTML = `${cross} Failed`;
        resyncBtn.style.backgroundColor = "#ffeaea";
        resyncBtn.style.color = "#ff4136";
        setTimeout(() => resyncBtn.remove(), 3000);
      }
    });
  });

  // Insert next to the Generate Resume button
  generateBtn.insertAdjacentElement("afterend", resyncBtn);
};

// Update your callGenerateResumeAPI error handling to show the button:
const callGenerateResumeAPI = async (jobData) => {
  const token = await getSessionToken();
  if (!token) {
    console.error("Missing Supabase session token. Please re-sync session.");
    showResyncButton();
    throw new Error("Missing Supabase session token");
  }
  const requestData = {
    jobInfo: {
      content: jobData.content,
      url: jobData.url,
    },
  };

  const response = await fetch(`${CONFIG.API_BASE_URL}/api/generate-resume`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(requestData),
  });

  if (response.status === 401) {
    autoSyncSession();
    showResyncButton();
    throw new Error("Unauthorized (401)");
  }

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const result = await response.json();
  return result;
};

const createScrapeAndDownloadButton = () => {
  const injectedButton = document.createElement("button");
  injectedButton.id = "custom-scrape-button";
  injectedButton.innerHTML = "Generate Resume"; // Initial text

  // Styles
  injectedButton.style.marginLeft = "1rem";
  injectedButton.style.padding = "1rem 2rem";
  injectedButton.style.backgroundColor = "#71B7FB";
  injectedButton.style.color = "#000000";
  injectedButton.style.border = "none";
  injectedButton.style.borderRadius = "99rem";
  injectedButton.style.fontWeight = "600";
  injectedButton.style.fontSize = "16px";
  injectedButton.style.lineHeight = "20px";
  injectedButton.style.cursor = "pointer";
  injectedButton.style.display = "inline-flex";
  injectedButton.style.alignItems = "center";
  injectedButton.style.gap = "0.5em";

  // Helper for spinner
  const spinner = `<span class="jt-spinner" style="display:inline-block;width:18px;height:18px;border:2px solid #fff;border-top:2px solid #71B7FB;border-radius:50%;animation:jt-spin 0.8s linear infinite;vertical-align:middle;"></span>`;
  const tick = `<span style="font-size:18px;vertical-align:middle;color:#2ecc40;">&#10003;</span>`;
  const cross = `<span style="font-size:18px;vertical-align:middle;color:#ff4136;">&#10060;</span>`;

  // Inject spinner CSS
  if (!document.getElementById("jt-spinner-style")) {
    const style = document.createElement("style");
    style.id = "jt-spinner-style";
    style.textContent = `
      @keyframes jt-spin { 100% { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);
  }

  injectedButton.addEventListener("click", async (event) => {
    event.preventDefault();
    injectedButton.disabled = true;
    injectedButton.style.opacity = "0.7";
    injectedButton.innerHTML = `${spinner} Generating...`;

    try {
      const jobData = scrapeJob();
      await callGenerateResumeAPI(jobData);
      // Success: show tick, keep disabled until next click
      injectedButton.innerHTML = `${tick} Success`;
      injectedButton.style.opacity = "1";
      injectedButton.disabled = false;
      chrome.runtime.sendMessage({
        type: "JT_STATUS",
        status: "success",
        message: "Resume generated successfully!",
      });
    } catch (error) {
      injectedButton.innerHTML = `${cross} Failed: ${error.message}`;
      injectedButton.style.opacity = "1";
      injectedButton.disabled = false;
      chrome.runtime.sendMessage({
        type: "JT_STATUS",
        status: "error",
        message: error.message || "Failed to generate resume.",
      });
    }
  });

  return injectedButton;
};

/**
 * Checks if the button needs to be injected and performs the action.
 */
const ensureInjectedButton = () => {
  // If our button already exists on the page, do nothing.
  if (document.querySelector("#custom-scrape-button")) {
    return;
  }

  // Find the anchor point for our button.
  const saveButton = findJobActionsSaveButton();
  if (!saveButton) {
    // If the save button isn't on the page yet, do nothing.
    // The observer will call this function again when it appears.
    return;
  }

  // 3. Create and inject the button.
  const customButton = createScrapeAndDownloadButton();
  saveButton.insertAdjacentElement("afterend", customButton);
  console.log("Successfully injected the custom button.");
};

// --- OBSERVER & INITIALIZATION LOGIC ---

// Set up the MutationObserver to watch for DOM changes.
// This is the core of the solution.
const observer = new MutationObserver(() => {
  // We don't need to be fancy. If anything changes, just re-run our check.
  // Our ensureInjectedButton function is fast and has guards to prevent unnecessary work.
  ensureInjectedButton();
});

// Start observing the entire body for changes to the element tree.
observer.observe(document.body, {
  childList: true, // Watch for added/removed nodes
  subtree: true, // Watch all descendants
});

// Run the injection logic a couple of times on startup to catch the initial page load,
// just in case the observer is slow to start.
window.addEventListener("load", () => {
  setTimeout(ensureInjectedButton, 500);
  setTimeout(ensureInjectedButton, 1500);
});

// Auto-sync when the content script loads
autoSyncSession();

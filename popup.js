const loadingState = document.getElementById("loading-state");
const connectedState = document.getElementById("connected-state");
const disconnectedState = document.getElementById("disconnected-state");
const connectBtn = document.getElementById("connect-btn");
const logoutBtn = document.getElementById("logout-btn");

function showState(state) {
  loadingState.style.display = "none";
  connectedState.style.display = "none";
  disconnectedState.style.display = "none";

  if (state === "loading") {
    loadingState.style.display = "block";
  } else if (state === "connected") {
    connectedState.style.display = "block";
  } else if (state === "disconnected") {
    disconnectedState.style.display = "block";
  }
}

function checkAuthStatus() {
  showState("loading");
  chrome.runtime.sendMessage({ type: "GET_AUTH_STATUS" }, (response) => {
    if (response?.authenticated) {
      showState("connected");
    } else {
      showState("disconnected");
    }
  });
}

connectBtn.addEventListener("click", () => {
  connectBtn.disabled = true;
  connectBtn.textContent = "Opening...";
  chrome.runtime.sendMessage({ type: "START_AUTH" }, (response) => {
    if (response?.ok) {
      window.close();
    } else {
      connectBtn.disabled = false;
      connectBtn.textContent = "Connect to Resume Tailor";
    }
  });
});

logoutBtn.addEventListener("click", () => {
  logoutBtn.disabled = true;
  logoutBtn.textContent = "Disconnecting...";
  chrome.runtime.sendMessage({ type: "LOGOUT" }, (response) => {
    if (response?.ok) {
      showState("disconnected");
    }
    logoutBtn.disabled = false;
    logoutBtn.textContent = "Disconnect";
  });
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "local" && changes.authData) {
    checkAuthStatus();
  }
});

checkAuthStatus();

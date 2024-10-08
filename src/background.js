let timerInterval;

//helper functions

function getBaseDomain(hostname) {
  const parts = hostname.split(".");
  if (parts.length > 2) {
    return parts.slice(-2).join(".");
  }
  return hostname;
}

// Helper function to check if a hostname is a search engine
function isSearchEngine(hostname) {
  const searchEngines = ["google", "bing", "yahoo", "duckduckgo", "baidu"];
  return searchEngines.some((engine) => hostname.includes(engine));
}

function shouldBlockUrl(url, blocklist) {
  const hostname = url.hostname;
  const baseDomain = getBaseDomain(hostname);

  if (isSearchEngine(hostname)) {
    console.log("Search engine detected, not blocking:", hostname);
    return false;
  }

  for (const blockedItem of blocklist) {
    const blockedBaseDomain = getBaseDomain(blockedItem);

    if (
      hostname === blockedItem ||
      baseDomain === blockedBaseDomain ||
      hostname.endsWith(`.${blockedItem}`) ||
      blockedItem.endsWith(`.${baseDomain}`)
    ) {
      console.log(
        "Blocking match found:",
        blockedItem,
        "for hostname:",
        hostname
      );
      return true;
    }
  }

  console.log("URL not blocked:", hostname);
  return false;
}

function updateTimer() {
  chrome.storage.local.get(["timerState"], (result) => {
    const timerState = result.timerState;
    if (timerState && !timerState.isCompleted) {
      const timeLeft = timerState.endTime - Date.now();
      if (timeLeft <= 0) {
        timerState.isCompleted = true;
        chrome.storage.local.set({ timerState });
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icons/icon48.png",
          title: "Timer Finished",
          message: `${timerState.title} timer has finished!`,
        });
      }
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          chrome.tabs.sendMessage(tab.id, {
            action: "updateTimer",
            timeLeft: Math.max(0, timeLeft),
            isPaused: timerState.isPaused,
            isCompleted: timerState.isCompleted,
          });
        });
      });
    }
  });
}

function startTimerInterval() {
  clearInterval(timerInterval);
  timerInterval = setInterval(updateTimer, 1000);
}

// Initialize extension on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "addToBookmarks",
    title: "Add to Bookmarks",
    contexts: ["page", "link"],
  });

  // Initialize blocklist if it doesn't exist
  chrome.storage.sync.get(["blocklist"], (result) => {
    if (!result.blocklist) {
      chrome.storage.sync.set({ blocklist: [] }, () => {
        console.log("Initialized empty blocklist");
      });
    } else {
      console.log("Existing blocklist:", result.blocklist);
    }
  });

  startTimerInterval();
});

chrome.tabs.onCreated.addListener((tab) => {
  updateTimer();
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "addToBookmarks") {
    const url = info.linkUrl || info.pageUrl;
    const title = tab?.title || url;

    chrome.storage.local.get(["bookmarks"], (result) => {
      const bookmarks = result.bookmarks || [];
      const newBookmark = {
        id: Date.now().toString(),
        url: url,
        title: title,
        folderId: null,
      };
      bookmarks.push(newBookmark);
      chrome.storage.local.set({ bookmarks }, () => {
        console.log("Bookmark added:", newBookmark);
        if (tab?.id) {
          chrome.tabs.sendMessage(tab.id, {
            action: "bookmarkAdded",
            bookmark: newBookmark,
          });
        }
      });
    });
  }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getBookmarks") {
    chrome.storage.local.get(["bookmarks"], (result) => {
      sendResponse({ bookmarks: result.bookmarks || [] });
    });
    return true;
  } else if (request.action === "createTimerNotification") {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon48.png",
      title: "Timer Finished",
      message: `${request.title} timer has finished!`,
    });
    return true;
  } else if (request.action === "updateTimerPause") {
    chrome.storage.local.get(["timerState"], (result) => {
      const timerState = result.timerState;
      if (timerState) {
        timerState.isPaused = request.isPaused;
        chrome.storage.local.set({ timerState });
        updateTimer();
      }
    });
  } else if (request.action === "cancelTimer") {
    chrome.storage.local.remove(["timerState"]);
    clearInterval(timerInterval);
  } else if (request.action === "checkSearchResults") {
    chrome.storage.sync.get(["blocklist"], (result) => {
      const blocklist = result.blocklist || [];
      const blockedUrls = request.urls.filter((url) => {
        try {
          const urlObj = new URL(url);
          return shouldBlockUrl(urlObj, blocklist);
        } catch (error) {
          console.error("Invalid URL:", url, error);
          return false;
        }
      });
      sendResponse({ blockedUrls });
    });
    return true;
  }
});

chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId !== 0) return; // Only handle main frame navigation

  chrome.storage.sync.get(["blocklist", "blockedSites"], (result) => {
    const blocklist = result.blocklist || [];
    const blockedSites = result.blockedSites || [];

    try {
      const url = new URL(details.url);
      console.log("Checking URL:", url.hostname);

      if (shouldBlockUrl(url, blocklist)) {
        console.log("Blocking URL:", url.hostname);

        // Update blocked sites count
        const existingSiteIndex = blockedSites.findIndex(
          (site) => site.hostname === url.hostname
        );
        if (existingSiteIndex !== -1) {
          blockedSites[existingSiteIndex].blockedCount++;
        } else {
          blockedSites.push({ hostname: url.hostname, blockedCount: 1 });
        }

        chrome.storage.sync.set({ blockedSites }, () => {
          console.log("Updated blockedSites:", blockedSites);
        });

        chrome.tabs.update(details.tabId, {
          url: chrome.runtime.getURL(
            `blocked.html?url=${encodeURIComponent(details.url)}`
          ),
        });
      } else {
        console.log("URL not blocked:", url.hostname);
      }
    } catch (error) {
      console.error("Invalid URL:", details.url, error);
    }
  });
});

// Function to log the current blocklist
function logBlocklist() {
  chrome.storage.sync.get(["blocklist"], (result) => {
    console.log("Current blocklist:", result.blocklist || []);
  });
}

// You can call logBlocklist() whenever you want to check the current state of the blocklist
// For example, you could call it after any operation that modifies the blocklist

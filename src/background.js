let timerInterval;
let registeredTabs = new Set();
let activeTab = {
  id: null,
  domain: null,
  startTime: null
};


let activeTabTracking = {
  id: null,
  domain: null,
  startTime: null,
  lastUpdate: null
};

// Helper functions
function getBaseDomain(hostname) {
  const parts = hostname.split(".");
  if (parts.length > 2) {
    return parts.slice(-2).join(".");
  }
  return hostname;
}







export const normalizeUrl = (url) => {
  try {
    // Remove protocol, www, and trailing slashes
    let normalizedUrl = url
      .toLowerCase()
      .replace(/^(https?:\/\/)?(www\.)?/, "")
      .replace(/\/+$/, "");

    // Remove any remaining path or query parameters
    normalizedUrl = normalizedUrl.split("/")[0];

    return normalizedUrl;
  } catch (error) {
    console.error("Error normalizing URL:", error);
    return url;
  }
};

function isSearchEngine(hostname) {
  const searchEngines = ["google", "bing", "yahoo", "duckduckgo", "baidu"];
  return searchEngines.some((engine) => hostname.includes(engine));
}

function playNotificationSound() {
  chrome.tts.speak("Timer finished", {
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    onEvent: function (event) {
      if (event.type === "end") {
        console.log("Notification sound played");
      }
    },
  });
}

function shouldBlockUrl(url, blocklist) {
  const hostname = normalizeUrl(url.hostname);
  const baseDomain = getBaseDomain(hostname);

  if (isSearchEngine(hostname)) {
    console.log("Search engine detected, not blocking:", hostname);
    return false;
  }

  for (const blockedItem of blocklist) {
    const blockedUrl =
      typeof blockedItem === "string" ? blockedItem : blockedItem.url;
    const isActive =
      typeof blockedItem === "string" ? true : blockedItem.isActive;

    if (!isActive) continue;

    const normalizedBlockedUrl = normalizeUrl(blockedUrl);
    const blockedBaseDomain = getBaseDomain(normalizedBlockedUrl);

    if (
      hostname === normalizedBlockedUrl ||
      baseDomain === blockedBaseDomain ||
      hostname.endsWith(`.${normalizedBlockedUrl}`) ||
      normalizedBlockedUrl.endsWith(`.${baseDomain}`)
    ) {
      console.log(
        "Blocking match found:",
        normalizedBlockedUrl,
        "for hostname:",
        hostname
      );
      return true;
    }
  }

  console.log("URL not blocked:", hostname);
  return false;
}

function createTimerNotification(title) {
  playNotificationSound();

  chrome.notifications.create(
    {
      type: "basic",
      iconUrl: chrome.runtime.getURL("icons/icon48.png"),
      title: "Timer Finished",
      message: `${title} timer has finished!`,
      requireInteraction: true,
    },
    (notificationId) => {
      console.log(`Notification created with ID: ${notificationId}`);
    }
  );
}

async function sendMessageToAllTabs(message) {
  for (const tabId of registeredTabs) {
    try {
      await chrome.tabs.sendMessage(tabId, message);
    } catch (error) {
      console.error(`Error sending message to tab ${tabId}:`, error);
      registeredTabs.delete(tabId);
    }
  }
}

function updateTimer() {
  chrome.storage.local.get(["timerState"]).then((result) => {
    const timerState = result.timerState;
    if (timerState && !timerState.isCompleted) {
      const timeLeft = timerState.endTime - Date.now();
      if (timeLeft <= 0) {
        timerState.isCompleted = true;
        chrome.storage.local.set({ timerState }).then(() => {
          createTimerNotification(timerState.title);
        });
      }
      sendMessageToAllTabs({
        action: "updateTimer",
        timeLeft: Math.max(0, timeLeft),
        isPaused: timerState.isPaused,
        isCompleted: timerState.isCompleted,
      });
    }
  });
}

function startTimerInterval() {
  clearInterval(timerInterval);
  timerInterval = setInterval(updateTimer, 1000);
}

// Initialize extension on installation

// Add these new tab tracking handlers
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url) {
      handleTabSwitch(tab);
    }
  } catch (error) {
    console.error('Error handling tab activation:', error);
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    handleTabSwitch(tab);
  }
});




chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "addToBookmarks",
    title: "Add to Bookmarks",
    contexts: ["page", "link"],
  });

  chrome.storage.sync.get(["blocklist"], (result) => {
    if (!result.blocklist) {
      chrome.storage.sync.set({ blocklist: [] }, () => {
        console.log("Initialized empty blocklist");
      });
    } else {
      const updatedBlocklist = result.blocklist.map((item) =>
        typeof item === "string" ? { url: item, isActive: true } : item
      );
      chrome.storage.sync.set({ blocklist: updatedBlocklist }, () => {
        console.log("Updated blocklist format:", updatedBlocklist);
      });
    }
  });

  startTimerInterval();
});

chrome.tabs.onCreated.addListener((tab) => {
  updateTimer();
});

chrome.tabs.onRemoved.addListener((tabId) => {
  registeredTabs.delete(tabId);
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
  if (request.action === "registerTab") {
    registeredTabs.add(sender.tab.id);
    sendResponse({ success: true });
  } else if (request.action === "getBookmarks") {
    chrome.storage.local.get(["bookmarks"], (result) => {
      sendResponse({ bookmarks: result.bookmarks || [] });
    });
    return true;
  } else if (request.action === "createTimerNotification") {
    createTimerNotification(request.title);
    sendResponse({ success: true });
  } else if (request.action === "setTimerAlarm") {
    chrome.alarms.create("timerAlarm", { when: request.when });
    sendResponse({ success: true });
  } else if (request.action === "clearTimerAlarm") {
    chrome.alarms.clear("timerAlarm");
    sendResponse({ success: true });
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

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "timerAlarm") {
    chrome.storage.local.get(["timerState"], (result) => {
      if (result.timerState && !result.timerState.isCompleted) {
        createTimerNotification(result.timerState.title);

        // Update timer state
        result.timerState.isCompleted = true;
        chrome.storage.local.set({ timerState: result.timerState }, () => {
          console.log("Timer state updated: timer completed");
        });

        // Notify all tabs
        sendMessageToAllTabs({
          action: "updateTimer",
          timeLeft: 0,
          isPaused: false,
          isCompleted: true,
        });
      }
    });
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



async function handleTabSwitch(tab) {
  // Save time for previous tab if exists
  if (activeTabTracking.domain && activeTabTracking.startTime) {
    await saveTimeEntry(
      activeTabTracking.domain,
      activeTabTracking.startTime,
      Date.now()
    );
  }

  if (tab.url) {
    try {
      const url = new URL(tab.url);
      const domain = getBaseDomain(url.hostname);
      
      activeTabTracking = {
        id: tab.id,
        domain: domain,
        startTime: Date.now(),
        lastUpdate: Date.now()
      };
    } catch (error) {
      console.error('Error processing URL:', error);
    }
  }
}

// Update your existing saveTimeEntry function
const saveTimeEntry = async (domain, startTime, endTime) => {
  const timeSpent = endTime - startTime;
  if (timeSpent < 1000) return; // Ignore very short visits

  const date = new Date(startTime).toISOString().split('T')[0];

  try {
    const result = await chrome.storage.local.get(['timeEntries']);
    const timeEntries = result.timeEntries || [];
    
    // Look for existing entry for same domain and date
    const existingEntryIndex = timeEntries.findIndex(
      entry => entry.domain === domain && entry.date === date
    );

    if (existingEntryIndex !== -1) {
      // Update existing entry
      timeEntries[existingEntryIndex].duration += timeSpent;
      timeEntries[existingEntryIndex].lastUpdate = endTime;
    } else {
      // Create new entry
      timeEntries.push({
        domain,
        startTime,
        lastUpdate: endTime,
        duration: timeSpent,
        date
      });
    }

    // Keep only last 30 days of data
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const filteredEntries = timeEntries.filter(
      entry => new Date(entry.date).getTime() > thirtyDaysAgo
    );

    await chrome.storage.local.set({ timeEntries: filteredEntries });
  } catch (error) {
    console.error('Error saving time entry:', error);
  }
};

// Add idle detection handler
chrome.idle.onStateChanged.addListener((state) => {
  if (state === 'active' && activeTabTracking.domain) {
    activeTabTracking.lastUpdate = Date.now();
  } else if (state !== 'active' && activeTabTracking.domain) {
    saveTimeEntry(
      activeTabTracking.domain,
      activeTabTracking.startTime,
      activeTabTracking.lastUpdate
    );
    activeTabTracking = {
      id: null,
      domain: null,
      startTime: null,
      lastUpdate: null
    };
  }
});

chrome.idle.setDetectionInterval(60);
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

// Helper function to check if a hostname is a search engine
function isSearchEngine(hostname) {
  const searchEngines = ["google", "bing", "yahoo", "duckduckgo", "baidu"];
  return searchEngines.some((engine) => hostname.includes(engine));
}

// Helper function to determine if a URL should be blocked
function shouldBlockUrl(url, blocklist) {
  const hostname = url.hostname;

  // Don't block search engine results pages
  if (isSearchEngine(hostname)) {
    console.log("Search engine detected, not blocking:", hostname);
    return false;
  }

  // Check if the hostname matches any blocklist item
  return blocklist.some((item) => {
    if (hostname === item || hostname.endsWith(`.${item}`)) {
      console.log("Blocking match found:", item, "for hostname:", hostname);
      return true;
    }
    return false;
  });
}

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

// Handle navigation events
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  // Ignore navigation within the extension itself
  if (details.url.startsWith(chrome.runtime.getURL(""))) {
    return;
  }

  chrome.storage.sync.get(["blocklist"], (result) => {
    const blocklist = result.blocklist || [];
    try {
      const url = new URL(details.url);
      console.log("Checking URL:", url.hostname);
      console.log("Current blocklist:", blocklist);

      if (shouldBlockUrl(url, blocklist)) {
        console.log("Blocking URL:", url.hostname);
        chrome.tabs.update(details.tabId, {
          url: chrome.runtime.getURL("blocked.html"),
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

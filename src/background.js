chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "addToBookmarks",
    title: "Add to Bookmarks",
    contexts: ["page", "link"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "addToBookmarks") {
    const url = info.linkUrl || info.pageUrl;
    const title = tab.title || url;

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
        // Send a message to the content script or popup
        chrome.tabs.query(
          { active: true, currentWindow: true },
          function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
              action: "bookmarkAdded",
              bookmark: newBookmark,
            });
          }
        );
      });
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getBookmarks") {
    chrome.storage.local.get(["bookmarks"], (result) => {
      sendResponse({ bookmarks: result.bookmarks || [] });
    });
    return true; // Indicates that the response is sent asynchronously
  }
});

// Constants
const BLOCKED_STYLE = {
  textDecoration: "line-through",
  color: "red",
};

// Helper Functions
function getSearchResultLinks() {
  const links = document.querySelectorAll('a[href^="http"]');
  return Array.from(links).map((link) => link.href);
}

function styleBlockedLink(link) {
  Object.assign(link.style, BLOCKED_STYLE);
  link.onclick = (e) => {
    e.preventDefault();
    alert("This website is blocked.");
  };
}

// Main Functions
function checkSearchResults() {
  const urls = getSearchResultLinks();
  chrome.runtime.sendMessage(
    { action: "checkSearchResults", urls },
    (response) => {
      if (response.blockedUrls) {
        response.blockedUrls.forEach((url) => {
          const link = document.querySelector(`a[href="${url}"]`);
          if (link) styleBlockedLink(link);
        });
      }
    }
  );
}

function handleLinkClick(e) {
  if (e.target.tagName === "A" && e.target.href) {
    e.preventDefault();
    chrome.runtime.sendMessage(
      { action: "checkUrl", url: e.target.href },
      (response) => {
        if (response.blocked) {
          alert("This website is blocked.");
        } else {
          window.location.href = e.target.href;
        }
      }
    );
  }
}

// Event Listeners
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "checkIfBlocked") {
    sendResponse({
      isBlocked: window.location.href.includes(
        chrome.runtime.getURL("blocked.html")
      ),
    });
  }
});

document.addEventListener("click", handleLinkClick, true);

// Initialize
checkSearchResults();

// Set up MutationObserver
const observer = new MutationObserver(checkSearchResults);
observer.observe(document.body, { childList: true, subtree: true });

function getSearchResultLinks() {
  // This selector might need to be adjusted based on the specific search engine
  const links = document.querySelectorAll('a[href^="http"]');
  return Array.from(links).map((link) => link.href);
}

function checkSearchResults() {
  const urls = getSearchResultLinks();
  chrome.runtime.sendMessage(
    { action: "checkSearchResults", urls },
    (response) => {
      if (response.blockedUrls) {
        response.blockedUrls.forEach((url) => {
          const link = document.querySelector(`a[href="${url}"]`);
          if (link) {
            link.style.textDecoration = "line-through";
            link.style.color = "red";
            link.onclick = (e) => {
              e.preventDefault();
              alert("This website is blocked.");
            };
          }
        });
      }
    }
  );
}

// Run the check when the page loads
checkSearchResults();

// Set up a MutationObserver to handle dynamically loaded content
const observer = new MutationObserver(checkSearchResults);
observer.observe(document.body, { childList: true, subtree: true });

// Cache for filtered responses
const responseCache = new Map();

// Listen for storage changes to update filter
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.maxPrice) {
    console.log('Max price updated:', changes.maxPrice.newValue);
    responseCache.clear();
  }
});

// Intercept and modify responses
chrome.declarativeNetRequest.onHeadersReceived.addListener(
  async (details) => {
    console.log('Intercepted request:', details.url);
    return {}; // Allow request to proceed
  },
  { urls: ["*://foodparty.zoodfood.com/*/mobile-offers/*"] },
  ["responseHeaders"]
);

console.log('Background service worker loaded');
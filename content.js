// content.js
console.log('[Filter Extension] Content script loaded.');

// Function to inject the interceptor script into the page's main world
function injectScript() {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('interceptor.js');
  (document.head || document.documentElement).appendChild(script);
  console.log('[Filter Extension] Interceptor script injected.');
}

// Pass the stored maxPrice to the page's DOM for the interceptor to read
chrome.storage.local.get(['maxPrice'], (result) => {
  if (result.maxPrice) {
    document.documentElement.dataset.maxPrice = result.maxPrice;
    console.log(`[Filter Extension] Max price ${result.maxPrice} passed to page.`);
  }
  injectScript();
});
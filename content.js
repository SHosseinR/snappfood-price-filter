// Function to inject the interceptor script into the page's main world
function injectScript() {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('interceptor.js');
  (document.head || document.documentElement).appendChild(script);
}

// Pass the stored maxPrice to the page's DOM for the interceptor to read
chrome.storage.local.get(['maxPrice'], (result) => {
  if (result.maxPrice) {
    document.documentElement.dataset.maxPrice = result.maxPrice;
  }
  injectScript();
});
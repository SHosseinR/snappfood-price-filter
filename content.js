(function() {
  // Inject the interceptor script into the page
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('injected.js');
  script.onload = function() {
    this.remove();
    
    // Send configuration to injected script
    chrome.storage.sync.get(['maxPrice'], function(result) {
      const maxPrice = result.maxPrice || null;
      
      const event = new CustomEvent('foodparty-filter-config', {
        detail: { maxPrice: maxPrice }
      });
      document.dispatchEvent(event);
    });
  };
  
  (document.head || document.documentElement).appendChild(script);
  
  // Listen for filter updates from popup
  chrome.runtime.onMessage.addListener(function(request) {
    if (request.action === 'filterUpdated') {
      location.reload();
    }
  });
})();
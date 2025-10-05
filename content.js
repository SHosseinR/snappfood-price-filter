(function() {
  // Load config first, then inject with embedded value
  chrome.storage.sync.get(['maxPrice'], function(result) {
    const maxPrice = result.maxPrice || null;
    
    // Create script with embedded MAX_PRICE value
    const script = document.createElement('script');
    script.textContent = `window.__FOODPARTY_MAX_PRICE__ = ${maxPrice};`;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
    
    // Now inject the interceptor script
    const interceptor = document.createElement('script');
    interceptor.src = chrome.runtime.getURL('injected.js');
    interceptor.onload = function() {
      this.remove();
      console.log('FoodParty Filter: Interceptor loaded, maxPrice =', maxPrice);
    };
    
    (document.head || document.documentElement).appendChild(interceptor);
  });
  
  // Listen for filter updates from popup
  chrome.runtime.onMessage.addListener(function(request) {
    if (request.action === 'filterUpdated') {
      location.reload();
    }
  });
})();
(function() {
  console.log('🎯 FoodParty Filter: Starting...');
  
  // Inject script from file to bypass CSP
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('injected.js');
  script.onload = function() {
    this.remove();
    console.log('✅ Interceptor script loaded');
    
    // Load and send config to page
    chrome.storage.sync.get(['maxPrice'], function(result) {
      const maxPrice = result.maxPrice || null;
      console.log('💾 Sending config to page, maxPrice:', maxPrice);
      
      // Send config via custom event
      const event = new CustomEvent('foodparty-filter-config', {
        detail: { maxPrice: maxPrice }
      });
      document.dispatchEvent(event);
    });
  };
  
  // Inject as early as possible
  const target = document.documentElement || document.head || document.body;
  if (target) {
    target.appendChild(script);
  } else {
    // If no element exists yet, wait for DOM
    document.addEventListener('DOMContentLoaded', function() {
      (document.head || document.documentElement).appendChild(script);
    });
  }
  
  // Listen for filter updates
  chrome.runtime.onMessage.addListener(function(request) {
    if (request.action === 'filterUpdated') {
      console.log('🔄 Filter updated, reloading page...');
      location.reload();
    }
  });
})();
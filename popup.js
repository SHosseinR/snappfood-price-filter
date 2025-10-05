document.addEventListener('DOMContentLoaded', function() {
  const maxPriceInput = document.getElementById('maxPrice');
  const saveBtn = document.getElementById('saveBtn');
  const status = document.getElementById('status');

  // Load saved price
  chrome.storage.sync.get(['maxPrice'], function(result) {
    if (result.maxPrice) {
      maxPriceInput.value = result.maxPrice;
    }
  });

  saveBtn.addEventListener('click', function() {
    const maxPrice = parseInt(maxPriceInput.value);
    
    if (!maxPrice || maxPrice <= 0) {
      status.textContent = 'لطفا یک عدد معتبر وارد کنید';
      status.className = 'status';
      return;
    }

    chrome.storage.sync.set({ maxPrice: maxPrice }, function() {
      status.textContent = `فیلتر ذخیره شد: ${maxPrice.toLocaleString('fa-IR')} تومان - صفحه را رفرش کنید`;
      status.className = 'status success';
      
      // Try to notify if on snappfood
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0] && tabs[0].url && tabs[0].url.includes('snappfood.ir')) {
          chrome.tabs.sendMessage(tabs[0].id, {action: 'filterUpdated'}, function(response) {
            if (chrome.runtime.lastError) {
              console.log('Content script not ready');
            }
          });
        }
      });
    });
  });
});
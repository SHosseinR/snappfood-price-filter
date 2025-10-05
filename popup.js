// popup.js
const maxPriceInput = document.getElementById('maxPrice');
const saveButton = document.getElementById('saveButton');

// Load any saved price when the popup opens
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['maxPrice'], (result) => {
    if (result.maxPrice) {
      maxPriceInput.value = result.maxPrice;
    }
  });
});

// Save the new price and reload the tab when the button is clicked
saveButton.addEventListener('click', () => {
  const maxPrice = maxPriceInput.value;
  chrome.storage.local.set({ maxPrice: parseInt(maxPrice, 10) || 0 }, () => {
    // Reload the current tab to apply the changes
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.reload(tabs[0].id);
      }
    });
  });
});
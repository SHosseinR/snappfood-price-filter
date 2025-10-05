(function() {
  // Get MAX_PRICE from script tag's data attribute
  const scriptTag = document.getElementById('foodparty-filter-script') || document.currentScript;
  const MAX_PRICE = scriptTag ? parseInt(scriptTag.getAttribute('data-max-price')) : null;
  
  console.log('FoodParty Filter - MAX_PRICE loaded:', MAX_PRICE);
  console.log('FoodParty Filter - Active:', MAX_PRICE ? 'YES - ' + MAX_PRICE.toLocaleString() + ' Toman' : 'NO FILTER');
  
  // Save original XMLHttpRequest methods
  const OriginalXHR = window.XMLHttpRequest;
  const originalOpen = OriginalXHR.prototype.open;
  const originalSend = OriginalXHR.prototype.send;
  
  // Override XMLHttpRequest.open to track URLs
  OriginalXHR.prototype.open = function(method, url, ...args) {
    this._url = url;
    return originalOpen.apply(this, [method, url, ...args]);
  };
  
  // Override XMLHttpRequest.send to intercept responses
  OriginalXHR.prototype.send = function(data) {
    const xhr = this;
    const url = this._url || '';
    
    // Only intercept mobile-offers API calls
    if (url.includes('mobile-offers')) {
      const originalOnReadyStateChange = xhr.onreadystatechange;
      
      xhr.onreadystatechange = function(e) {
        // Wait for complete response
        if (xhr.readyState === 4 && xhr.status === 200) {
          try {
            const responseData = JSON.parse(xhr.responseText);
            
            // Filter products if MAX_PRICE is set and is a valid number
            if (responseData?.data?.products && Array.isArray(responseData.data.products) && MAX_PRICE && MAX_PRICE > 0) {
              const originalCount = responseData.data.products.length;
              
              // Filter products by final price
              responseData.data.products = responseData.data.products.filter(product => {
                const price = product.price || 0;
                const discount = product.discount || 0;
                const finalPrice = price - discount;
                return finalPrice <= MAX_PRICE;
              });
              
              const filteredCount = responseData.data.products.length;
              const removedCount = originalCount - filteredCount;
              
              console.log(`✓ Filtered ${removedCount} items: ${originalCount} → ${filteredCount} products (max: ${MAX_PRICE.toLocaleString()} Toman)`);
              
              // Update total count
              if (responseData.data.total_count !== undefined) {
                responseData.data.total_count = filteredCount;
              }
              
              // Replace response with filtered data
              const modifiedResponse = JSON.stringify(responseData);
              
              Object.defineProperty(xhr, 'responseText', {
                writable: true,
                value: modifiedResponse
              });
              
              Object.defineProperty(xhr, 'response', {
                writable: true,
                value: modifiedResponse
              });
            } else if (!MAX_PRICE) {
              console.log('ℹ️ No price filter set - showing all items');
            }
          } catch (error) {
            console.error('FoodParty Filter Error:', error);
          }
        }
        
        // Call original handler
        if (originalOnReadyStateChange) {
          return originalOnReadyStateChange.apply(xhr, arguments);
        }
      };
    }
    
    return originalSend.apply(xhr, arguments);
  };
  
  console.log('FoodParty Price Filter: Interceptor installed');
})();
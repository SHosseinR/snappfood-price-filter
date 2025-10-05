(function() {
  let MAX_PRICE = null;
  
  // Listen for configuration from content script
  window.addEventListener('foodparty-filter-config', function(e) {
    MAX_PRICE = e.detail.maxPrice;
    console.log('FoodParty Filter Active - Max Price:', MAX_PRICE?.toLocaleString(), 'Toman');
  });
  
  // Save original XMLHttpRequest methods
  const OriginalXHR = window.XMLHttpRequest;
  const originalOpen = OriginalXHR.prototype.open;
  const originalSend = OriginalXHR.prototype.send;
  
  let xhrCounter = 0;
  
  // Override XHR open
  OriginalXHR.prototype.open = function(method, url, ...args) {
    this._method = method;
    this._url = url;
    this._requestId = ++xhrCounter;
    
    // console.log(`[XHR #${this._requestId}] 📡 OPEN: ${method} ${url}`);
    
    return originalOpen.apply(this, [method, url, ...args]);
  };
  
  // Override XMLHttpRequest.send to intercept responses
  OriginalXHR.prototype.send = function(data) {
    const xhr = this;
    const requestId = this._requestId;
    const url = this._url || '';
    
    // Only intercept mobile-offers API calls
    if (url.includes('mobile-offers')) {
      console.log(`[XHR #${requestId}] ✅ mobile-offers detected!`);
      
      // Store original handlers
      const originalOnReadyStateChange = xhr.onreadystatechange;
      
      xhr.onreadystatechange = function(e) {
        // Wait for complete response
        if (xhr.readyState === 4 && xhr.status === 200) {
          console.log(`[XHR #${requestId}] 📥 Response received`);
          
          try {
            const responseData = JSON.parse(xhr.responseText);
            console.log("first bitch", MAX_PRICE);
            // Filter products if MAX_PRICE is set
            if (responseData?.data?.products && Array.isArray(responseData.data.products) && MAX_PRICE) {
                console.log("response data bro", responseData.data.products)
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
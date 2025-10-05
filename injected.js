(function() {
  // Get MAX_PRICE from extension storage via custom event
  let MAX_PRICE = null;
  
  window.addEventListener('foodparty-filter-config', function(e) {
    MAX_PRICE = e.detail.maxPrice;
    console.log('🎯 Filter config received:', MAX_PRICE);
  });
  
  console.log('🚀 Intercepting XMLHttpRequest...');
  
  // Save original XHR
  const OriginalXHR = window.XMLHttpRequest;
  const originalOpen = OriginalXHR.prototype.open;
  const originalSend = OriginalXHR.prototype.send;
  
  let xhrCounter = 0;
  
  // Override XHR open
  OriginalXHR.prototype.open = function(method, url, ...args) {
    this._method = method;
    this._url = url;
    this._requestId = ++xhrCounter;
    
    console.log(`[XHR #${this._requestId}] 📡 OPEN: ${method} ${url}`);
    
    return originalOpen.apply(this, [method, url, ...args]);
  };
  
  // Override XHR send
  OriginalXHR.prototype.send = function(data) {
    const xhr = this;
    const requestId = this._requestId;
    const url = this._url || '';
    
    if (url.includes('mobile-offers')) {
      console.log(`[XHR #${requestId}] ✅ mobile-offers detected!`);
      
      // Store original handlers
      const originalOnReadyStateChange = xhr.onreadystatechange;
      const originalOnLoad = xhr.onload;
      
      // Override onreadystatechange
      xhr.onreadystatechange = function(e) {
        if (xhr.readyState === 4 && xhr.status === 200) {
          console.log(`[XHR #${requestId}] 📥 Response received`);
          
          try {
            const originalResponse = xhr.responseText;
            const data = JSON.parse(originalResponse);
            
            console.log(`[XHR #${requestId}] 📊 Original products:`, data?.data?.products?.length);
            
            if (data?.data?.products && MAX_PRICE) {
              const originalCount = data.data.products.length;
              
              // Filter products
              data.data.products = data.data.products.filter(product => {
                const price = product.price || 0;
                const discount = product.discount || 0;
                const finalPrice = price - discount;
                return finalPrice <= MAX_PRICE;
              });
              
              const filteredCount = data.data.products.length;
              
              console.log(`[XHR #${requestId}] 🔧 Filtered: ${originalCount} → ${filteredCount} (max: ${MAX_PRICE})`);
              
              // Update total count
              if (data.data.total_count !== undefined) {
                data.data.total_count = filteredCount;
              }
              
              // Override response properties
              const modifiedResponse = JSON.stringify(data);
              
              Object.defineProperty(xhr, 'responseText', {
                writable: true,
                value: modifiedResponse
              });
              
              Object.defineProperty(xhr, 'response', {
                writable: true,
                value: modifiedResponse
              });
              
              console.log(`[XHR #${requestId}] ✅ Response modified successfully`);
            } else if (!MAX_PRICE) {
              console.log(`[XHR #${requestId}] ⚠️ No filter set, passing through`);
            }
          } catch (error) {
            console.error(`[XHR #${requestId}] ❌ Error filtering:`, error);
          }
        }
        
        // Call original handler
        if (originalOnReadyStateChange) {
          return originalOnReadyStateChange.apply(xhr, arguments);
        }
      };
      
      // Also override onload just in case
      xhr.onload = function(e) {
        console.log(`[XHR #${requestId}] 📨 onload triggered`);
        if (originalOnLoad) {
          return originalOnLoad.apply(xhr, arguments);
        }
      };
    }
    
    return originalSend.apply(xhr, arguments);
  };
  
  console.log('✅ XMLHttpRequest interceptor installed');
})();
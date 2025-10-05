// interceptor.js
console.log('[Filter Interceptor] Script running in page context. Now intercepting Fetch and XHR.');

// =================================================================================
// 1. FETCH INTERCEPTOR (for modern sites)
// =================================================================================
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const url = args[0];

  if (typeof url === 'string' && url.includes('/mobile-offers/')) {
    console.log(`[Filter Interceptor] Intercepted FETCH request to: ${url}`);
    return handleFiltering(url, originalFetch(...args));
  }

  return originalFetch(...args);
};


// =================================================================================
// 2. XHR INTERCEPTOR (for sites using older methods, like this one)
// =================================================================================
const originalXhrOpen = XMLHttpRequest.prototype.open;
const originalXhrSend = XMLHttpRequest.prototype.send;

XMLHttpRequest.prototype.open = function(...args) {
  // Store the URL on the XHR instance itself so we can access it in send()
  this._url = args[1]; 
  return originalXhrOpen.apply(this, args);
};

XMLHttpRequest.prototype.send = function(...args) {
  if (this._url && this._url.includes('/mobile-offers/')) {
    console.log(`[Filter Interceptor] Intercepted XHR request to: ${this._url}`);

    // Add a listener that fires when the request is complete
    this.addEventListener('load', () => {
      const maxPrice = parseInt(document.documentElement.dataset.maxPrice, 10);
      if (!maxPrice || isNaN(maxPrice)) {
        console.log('[Filter Interceptor] XHR: No valid max price set. Not filtering.');
        return; // Don't modify the response
      }

      try {
        const originalResponseText = this.responseText;
        const data = JSON.parse(originalResponseText);
        const originalProductCount = data.data.products.length;
        console.log(`[Filter Interceptor] XHR: Original product count: ${originalProductCount}`);

        // The core filtering logic
        const filteredProducts = data.data.products.filter(product => {
          const finalPrice = product.price - product.discount;
          return finalPrice <= maxPrice;
        });

        const newProductCount = filteredProducts.length;
        console.log(`[Filter Interceptor] XHR: New product count after filtering: ${newProductCount}`);

        // Modify the original data object
        data.data.products = filteredProducts;
        data.data.total_count = newProductCount;

        const modifiedResponseText = JSON.stringify(data);

        // This is the magic part: we redefine the 'responseText' and 'response' properties
        // on the XHR object itself before the website's code can read it.
        Object.defineProperty(this, 'responseText', { value: modifiedResponseText, writable: true });
        Object.defineProperty(this, 'response', { value: modifiedResponseText, writable: true });

      } catch (e) {
        console.error('[Filter Interceptor] XHR: Failed to parse or filter response.', e);
      }
    });
  }
  return originalXhrSend.apply(this, args);
};


// =================================================================================
// 3. SHARED FILTERING LOGIC (used by Fetch interceptor)
// =================================================================================
async function handleFiltering(url, responsePromise) {
  const maxPrice = parseInt(document.documentElement.dataset.maxPrice, 10);
  if (!maxPrice || isNaN(maxPrice)) {
    console.log('[Filter Interceptor] No valid max price set. Not filtering.');
    return responsePromise;
  }

  console.log(`[Filter Interceptor] Applying filter for max final price: ${maxPrice}`);
  const response = await responsePromise;
  const clonedResponse = response.clone();
  
  try {
    const data = await clonedResponse.json();
    const originalProductCount = data.data.products.length;
    console.log(`[Filter Interceptor] Original product count: ${originalProductCount}`);

    const filteredProducts = data.data.products.filter(product => {
      const finalPrice = product.price - product.discount;
      return finalPrice <= maxPrice;
    });

    const newProductCount = filteredProducts.length;
    console.log(`[Filter Interceptor] New product count after filtering: ${newProductCount}`);

    data.data.products = filteredProducts;
    data.data.total_count = newProductCount;

    return new Response(JSON.stringify(data), {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  } catch (error) {
    console.error('[Filter Interceptor] Error processing response:', error);
    return response;
  }
}
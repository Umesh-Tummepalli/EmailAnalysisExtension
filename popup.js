document.addEventListener('DOMContentLoaded', () => {
  const fetchBtn = document.querySelector("#refreshBtn");
  const output = document.querySelector("#output");

  if (!fetchBtn || !output) {
    console.error("Required DOM elements not found. Make sure your popup.html has elements with IDs 'refreshBtn' and 'output'");
    return;
  }

  fetchBtn.addEventListener("click", () => {
    console.log("Refresh button clicked");
    
    // Disable button during request
    fetchBtn.disabled = true;
    fetchBtn.textContent = "Loading...";
    output.value = "Extracting email content...";
    
    chrome.runtime.sendMessage(
      {
        from: "popup",
        type: "GET_EMAIL",
      },
      (response) => {
        // Re-enable button
        fetchBtn.disabled = false;
        fetchBtn.textContent = "Refresh";
        
        console.log("Full response received:", response);
        
        if (chrome.runtime.lastError) {
          console.error("Runtime error:", chrome.runtime.lastError);
          output.value = `Runtime Error: ${chrome.runtime.lastError.message}`;
        } else if (!response) {
          output.value = "No response received from background script";
        } else if (response.success === false) {
          output.value = `Error: ${response.error}`;
        } else if (response.success === true) {
          output.value = response.content || "No content returned";
        } else {
          // Handle legacy string response format
          output.value = typeof response === 'string' ? response : JSON.stringify(response, null, 2);
        }
      }
    );
  });
});
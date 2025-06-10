// Alternative background.js - simpler approach
(() => {
  console.log("Background script running");
  
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.from === "popup" && msg.type === "GET_EMAIL") {
      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        if (tabs.length === 0) {
          sendResponse({ success: false, error: "No active tab found" });
          return;
        }
        
        const activeTab = tabs[0];
        
        if (!activeTab.url.includes('mail.google.com')) {
          sendResponse({ 
            success: false, 
            error: "Please navigate to Gmail first" 
          });
          return;
        }
        
        try {
          // Inject and execute the extraction function directly
          const results = await chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            function: extractEmailContent,
          });
          
          const content = results[0]?.result || "No content found";
          sendResponse({ success: true, content: content });
          
        } catch (error) {
          console.error("Script execution error:", error);
          sendResponse({ 
            success: false, 
            error: "Failed to extract content: " + error.message 
          });
        }
      });
      
      return true;
    }
  });
  
  // Function to be injected into the page
  function extractEmailContent() {
    try {
      let content = "";
      
      // Try multiple Gmail selectors
      const selectors = [
        '.a3s.aiL',
        '[data-message-id]',
        '.ii.gt',
        '.hP',
        '.bog'
      ];
      
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          elements.forEach(el => {
            const text = el.innerText || el.textContent || '';
            if (text.trim().length > 20) {
              content += text.trim() + '\n\n';
            }
          });
          if (content.trim()) break;
        }
      }
      
      return content.trim() || `Debug info: URL=${window.location.href}, Selectors found: ${selectors.map(s => document.querySelectorAll(s).length).join(',')}`;
    } catch (error) {
      return `Error: ${error.message}`;
    }
  }
})();
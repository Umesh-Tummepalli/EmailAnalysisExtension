chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.from === "popup" && msg.type === "GET_EMAIL") {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const activeTab = tabs[0];

      if (!activeTab || !activeTab.url.includes("mail.google.com")) {
        sendResponse({ success: false, error: "Not on Gmail tab" });
        return;
      }

      try {
        // Inject content.js
        await chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          files: ['content.js'],
        });
        // Send message to content.js to extract
        chrome.tabs.sendMessage(activeTab.id, {
          from: "background",
          type: "EXTRACT_EMAIL"
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error("Error:", chrome.runtime.lastError.message);
            sendResponse({ success: false, error: "Message failed" });
          } else {
            sendResponse(response);
          }
        });

      } catch (err) {
        console.error("Injection failed:", err);
        sendResponse({ success: false, error: err.message });
      }
    });

    return true; // async
  }
});

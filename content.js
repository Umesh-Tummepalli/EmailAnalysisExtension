function extractEmail() {
  try {
    console.log("Starting email extraction on URL:", window.location.href);
    console.log("Page title:", document.title);

    let emailContent = "";

    const emailSelectors = [
      '[data-message-id]',
      '.a3s.aiL',
      '.ii.gt > div',
      '.ii.gt',
      '.hP',
      '.bog',
      '.adn.ads .ii.gt',
      '.nH .if .ii.gt',
      '[role="main"] .ii.gt',
      '[role="main"] .a3s',
      '.Am.Al.editable',
      '.editable',
      '[data-legacy-thread-id] .ii',
      '.adn .ii',
    ];

    let emailContainer = null;

    function processElementForInlineContent(element) {
      const clone = element.cloneNode(true);

      // Replace <a> tags with text + [href]
      clone.querySelectorAll("a[href]").forEach((a) => {
        const href = a.href;
        const linkText = a.innerText || a.textContent || "";

        if (!href || href === "#" || href.startsWith("javascript")) return;

        let inlineText =
          linkText && linkText.trim() !== href
            ? `${linkText} [${href}]`
            : href;

        const span = document.createElement("span");
        span.textContent = inlineText;
        a.replaceWith(span);
      });

      // Replace <img> tags with [IMAGE: src]
      clone.querySelectorAll("img").forEach((img) => {
        const src = img.src;
        const alt = img.alt || "";
        const title = img.title || "";

        if (
          !src ||
          src.startsWith("data:") ||
          src.includes("transparent.gif") ||
          src.includes("cleardot.gif") ||
          src.includes("1x1") ||
          src.includes("pixel") ||
          src.includes("spacer")
        ) {
          img.remove();
          return;
        }

        let imageText = `[IMAGE: ${src}`;
        if (alt.trim()) imageText += ` - Alt: "${alt}"`;
        if (title.trim() && title !== alt) imageText += ` - Title: "${title}"`;
        imageText += "]";

        const span = document.createElement("span");
        span.textContent = imageText;
        img.replaceWith(span);
      });

      return clone;
    }

    for (const selector of emailSelectors) {
      const elements = document.querySelectorAll(selector);
      console.log(`Selector "${selector}": Found ${elements.length} elements`);

      if (elements.length > 0) {
        elements.forEach((element, index) => {
          const processedClone = processElementForInlineContent(element);

          const text =
            processedClone.innerText || processedClone.textContent || "";
          if (text.trim() && text.length > 20) {
            emailContent += text.trim() + "\n\n";
            emailContainer = element;
          }
        });

        if (emailContent.trim()) break;
      }
    }

    if (!emailContent.trim()) {
      console.log("Trying fallback content...");

      const fallbackSelectors = [
        "[role='main']",
        ".nH.if",
        ".nH",
        "body",
      ];

      for (const fallbackSelector of fallbackSelectors) {
        emailContainer = document.querySelector(fallbackSelector);
        if (emailContainer) {
          console.log(`Using fallback selector: ${fallbackSelector}`);
          break;
        }
      }

      if (emailContainer) {
        const unwantedSelectors = [
          ".ar",
          ".as",
          ".nH.nn",
          ".nH.no",
          ".gb_g",
          ".T-I-J3",
          ".ar4",
          ".as4",
          ".nz",
          ".T-I",
          ".T-I-KE",
          ".aKh",
          ".aeH",
          ".aio",
          ".aim",
          ".ain",
          ".aip",
          "nav",
          ".gb_pc",
          ".gb_Sc",
          ".gb_Tc",
        ];

        const clone = emailContainer.cloneNode(true);
        unwantedSelectors.forEach((selector) =>
          clone.querySelectorAll(selector).forEach((el) => el.remove())
        );

        const processedClone = processElementForInlineContent(clone);

        emailContent =
          processedClone.innerText || processedClone.textContent || "";
      }
    }

    if (!emailContent.trim()) {
      const fallbackText =
        processElementForInlineContent(document.body).innerText ||
        document.body.textContent;
      if (fallbackText.trim()) {
        emailContent = "DEBUG - All page text:\n" + fallbackText.substring(0, 2000);
      }
    }

    const cleanedContent = emailContent
      .replace(/\n\s*\n\s*\n/g, "\n\n")
      .replace(/^\s+|\s+$/g, "")
      .substring(0, 10000);

    console.log("Final extracted content:", cleanedContent.substring(0, 200));
    return cleanedContent || "No email content found.";

  } catch (error) {
    console.error("Error extracting email content:", error);
    return `Error extracting content: ${error.message}`;
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("Content script received:", msg);

  if (msg.from === "background" && msg.type === "EXTRACT_EMAIL") {
    setTimeout(() => {
      const content = extractEmail();
      sendResponse({ success: true, content });
    }, 100);
  }

  return true; // Async
});

console.log("✅ Content script loaded.");

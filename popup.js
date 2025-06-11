const fetchBtn = document.querySelector("#refreshBtn");
const output = document.querySelector("#output");
const analyzeBtn=document.querySelector("#analyseBtn");
const resultContainer=document.querySelector("#resultContainer");
document.addEventListener('DOMContentLoaded', () => {
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

function cleanAndFlattenEmail(rawEmailText) {
  return rawEmailText
    .replace(/[\r\n]+/g, ' ')      // replace line breaks with space
    .replace(/\s+/g, ' ')          // collapse multiple spaces
    .replace(/<[^>]*>/g, '')       // optional: strip HTML tags if any
    .trim();
}

analyzeBtn.addEventListener('click', async (e) => {
  console.log("clicked");
  
  let email = output.value;
  if (!email) return;

  analyzeBtn.disabled = true;
  analyzeBtn.innerHTML = "Analysing.......";

  const cleanedEmail = cleanAndFlattenEmail(email);

  try {
    const res = await fetch("http://127.0.0.1:8000/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email_text: cleanedEmail })
    });

    const jsonVal = await res.json();
    console.log(jsonVal);

    analyzeBtn.innerHTML = "Here we go";
    updateRiskAnalysis(jsonVal); // assumes this is a valid function
    resultContainer.style.maxHeight = '400px';
  } catch (error) {
    console.error("Error analyzing email:", error);
    alert("Failed to analyze email. Please try again.");
  } finally {
    analyzeBtn.innerHTML = "Analyze";
    analyzeBtn.disabled = false;
  }
});














// result

function updateRiskAnalysis(data) {
            // Update risk card
            const riskCard = document.getElementById('riskCard');
            const scoreCircle = document.getElementById('scoreCircle');
            const riskCategory = document.getElementById('riskCategory');
            const confidence = document.getElementById('confidence');
            const recommendation = document.getElementById('recommendation');
            const recommendationText = document.getElementById('recommendationText');
            
            // Update score and category
            scoreCircle.textContent = data.risk_score;
            riskCategory.textContent = data.category;
            confidence.textContent = `Confidence: ${Math.round(data.confidence * 100)}%`;
            recommendationText.textContent = data.recommendation.replace('🔍 ', '');
            
            // Update styling based on risk
            if (data.is_malicious) {
                riskCard.classList.add('malicious');
                riskCard.classList.remove('safe');
                recommendation.classList.add('warning');
                recommendation.classList.remove('safe');
                
                // Update warning icon
                recommendation.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 9V11M12 15H12.01M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <p id="recommendationText">${data.recommendation.replace('🔍 ', '')}</p>
                `;
                
                // Update score circle gradient
                const percentage = Math.min(data.risk_score, 100);
                scoreCircle.style.background = `conic-gradient(var(--danger) 0% ${percentage}%, #e2e8f0 ${percentage}% 100%)`;
            } else if (data.risk_score < 20) {
                riskCard.classList.add('safe');
                riskCard.classList.remove('malicious');
                recommendation.classList.add('safe');
                recommendation.classList.remove('warning');
                
                // Update safe icon
                recommendation.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 12L11 14L15 10M12 3C10.22 3 8.47991 3.52784 6.99987 4.51677C5.51983 5.50571 4.36628 6.91131 3.68509 8.55585C3.0039 10.2004 2.82567 12.01 3.17294 13.7558C3.5202 15.5016 4.37737 17.1053 5.63604 18.364C6.89472 19.6226 8.49836 20.4798 10.2442 20.8271C11.99 21.1743 13.7996 20.9961 15.4442 20.3149C17.0887 19.6337 18.4943 18.4802 19.4832 17.0001C20.4722 15.5201 21 13.78 21 12C21 9.61305 20.0518 7.32387 18.364 5.63604C16.6761 3.94821 14.3869 3 12 3Z" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <p id="recommendationText">${data.recommendation.replace('🔍 ', '')}</p>
                `;
                
                // Update score circle gradient
                const percentage = Math.min(data.risk_score, 100);
                scoreCircle.style.background = `conic-gradient(var(--safe) 0% ${percentage}%, #e2e8f0 ${percentage}% 100%)`;
            } else {
                // Update score circle gradient for medium risk
                const percentage = Math.min(data.risk_score, 100);
                scoreCircle.style.background = `conic-gradient(var(--warning) 0% ${percentage}%, #e2e8f0 ${percentage}% 100%)`;
            }
            
            // Update email details
            document.getElementById('sender').textContent = data.email_details.sender || 'Unknown';
            document.getElementById('subject').textContent = data.email_details.subject || 'Unknown';
            document.getElementById('urlCount').textContent = data.email_details.url_count;
            document.getElementById('brandMentions').textContent = data.features_detected.brand_mentions;
            
            // Update features grid
            const featuresGrid = document.getElementById('featuresGrid');
            featuresGrid.innerHTML = '';
            
            // Add detected features
            for (const [feature, value] of Object.entries(data.features_detected)) {
                if (value > 0 && feature !== 'brand_mentions') {
                    const featureItem = document.createElement('div');
                    featureItem.className = 'feature-item detected';
                    featureItem.textContent = feature.replace(/_/g, ' ');
                    featuresGrid.appendChild(featureItem);
                }
            }
            
            // Add non-detected features (for demo purposes, we'll limit to a few)
            const nonDetectedFeatures = [
                'grammar_errors',
                'domain_mismatch',
                'urgency_words',
                'threat_words'
            ];
            
            nonDetectedFeatures.forEach(feature => {
                if (data.features_detected[feature] === 0) {
                    const featureItem = document.createElement('div');
                    featureItem.className = 'feature-item';
                    featureItem.textContent = feature.replace(/_/g, ' ');
                    featuresGrid.appendChild(featureItem);
                }
            });
        }
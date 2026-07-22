(async function promptAndSubmitCaptcha() {
  // 1. Prompt the user for the answer dynamically
  const input = prompt("Enter the solved Math CAPTCHA answer:");
  
  if (input === null || input.trim() === "") {
    console.log("[-] Submission cancelled.");
    return;
  }

  const userAnswer = parseInt(input.trim(), 10);
  if (isNaN(userAnswer)) {
    console.error("[-] Invalid input: Please enter a valid number.");
    return;
  }

  console.log(`[*] Submitting answer: ${userAnswer}...`);

  try {
    const verifyResp = await fetch('/api/verify_captcha', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        answer: userAnswer,
        pow_nonce: window._mainPowNonce || null,
        pow_challenge: window._mainPowChallenge || null
      })
    });

    const data = await verifyResp.json();

    if (verifyResp.ok && data.browser_token) {
      console.log('%c✅ CAPTCHA VERIFIED!', 'color: #00ff00; font-weight: bold; font-size: 14px;');
      console.log(`[+] Browser Token: ${data.browser_token}`);

      // Store token globally
      window.browserToken = data.browser_token;

      // Unhide main UI elements
      const captchaBox = document.getElementById('math-captcha-box');
      if (captchaBox) captchaBox.style.display = 'none';
      
      const mainContent = document.getElementById('main-content');
      if (mainContent) mainContent.style.display = 'block';

      // Load company listings
      console.log('[*] Fetching company list...');
      if (typeof window.showMain === 'function') {
        await window.showMain();
      } else {
        // Fallback fetch if showMain isn't available in scope
        const compResp = await fetch('/api/companies', {
          headers: { 'Authorization': `Bearer ${data.browser_token}` }
        });
        const compData = await compResp.json();
        console.log('%c[+] Target Data:', 'color: #00ff00;', compData);
      }

    } else {
      console.error(`[-] Verification Rejected: ${data.error || 'Unknown error'}`);
    }
  } catch (err) {
    console.error(`[-] Submission Error: ${err.message}`);
  }
})();
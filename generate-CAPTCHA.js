(async function solveMainCaptchaFlow() {
  console.log('[*] Starting secondary API bypass...');

  // 1. Pure JS SHA-256 implementation
  function sha256(ascii) {
    const mathPow = Math.pow;
    const maxWord = mathPow(2, 32);
    let result = '';
    const words = [];
    const asciiBitLength = ascii.length * 8;
    let hash = sha256.h = sha256.h || [];
    let k = sha256.k = sha256.k || [];
    let primeCounter = k.length;

    const isPrime = (n) => {
      for (let factor = 2; factor <= Math.sqrt(n); factor++) {
        if (n % factor === 0) return false;
      }
      return true;
    };

    if (!primeCounter) {
      let candidate = 2;
      while (primeCounter < 64) {
        if (isPrime(candidate)) {
          if (primeCounter < 8) hash[primeCounter] = (mathPow(candidate, 1/2) * maxWord) | 0;
          k[primeCounter] = (mathPow(candidate, 1/3) * maxWord) | 0;
          primeCounter++;
        }
        candidate++;
      }
    }

    ascii += '\x80';
    while (ascii.length % 64 !== 56) ascii += '\x00';
    for (let i = 0; i < ascii.length; i++) {
      const j = ascii.charCodeAt(i);
      words[i >> 2] |= j << ((3 - i % 4) * 8);
    }
    words[words.length] = ((asciiBitLength / maxWord) | 0);
    words[words.length] = (asciiBitLength | 0);

    for (let j = 0; j < words.length; j += 16) {
      const w = words.slice(j, j + 16);
      const oldHash = hash.slice(0);

      for (let i = 0; i < 64; i++) {
        if (i >= 16) {
          const w15 = w[i - 15], w2 = w[i - 2];
          const s0 = ((w15 >>> 7) | (w15 << 25)) ^ ((w15 >>> 18) | (w15 << 14)) ^ (w15 >>> 3);
          const s1 = ((w2 >>> 17) | (w2 << 15)) ^ ((w2 >>> 19) | (w2 << 13)) ^ (w2 >>> 10);
          w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
        }

        const s1 = ((hash[4] >>> 6) | (hash[4] << 26)) ^ ((hash[4] >>> 11) | (hash[4] << 21)) ^ ((hash[4] >>> 25) | (hash[4] << 7));
        const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
        const temp1 = (hash[7] + s1 + ch + k[i] + w[i]) | 0;
        const s0 = ((hash[0] >>> 2) | (hash[0] << 30)) ^ ((hash[0] >>> 13) | (hash[0] << 19)) ^ ((hash[0] >>> 22) | (hash[0] << 10));
        const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
        const temp2 = (s0 + maj) | 0;

        hash = [(temp1 + temp2) | 0].concat(hash);
        hash[4] = (hash[4] + temp1) | 0;
        hash.pop();
      }

      for (let i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
    }

    for (let i = 0; i < 8; i++) {
      for (let j = 3; j >= 0; j--) {
        const b = (hash[i] >> (j * 8)) & 255;
        result += (b < 16 ? '0' : '') + b.toString(16);
      }
    }
    return result;
  }

  // 2. Fetch fresh PoW Challenge
  console.log('[*] Fetching public PoW challenge...');
  const powResp = await fetch('/api/get_pow_challenge_public', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (!powResp.ok) throw new Error('PoW request failed');
  const powData = await powResp.json();
  console.log(`[+] Challenge: ${powData.challenge} (Diff: ${powData.difficulty})`);

  // 3. Solve PoW
  console.log('[*] Solving PoW in memory...');
  const prefix = '0'.repeat(powData.difficulty);
  let nonce = 0;
  while (true) {
    if (sha256(powData.challenge + nonce).startsWith(prefix)) break;
    nonce++;
  }
  console.log(`[+] PoW Solved! Nonce: ${nonce}`);

  // Save to global window scope so page handlers can access it
  window._mainPowNonce = nonce;
  window._mainPowChallenge = powData.challenge;

  // 4. Request the main CAPTCHA payload
  console.log('[*] Fetching main CAPTCHA...');
  const captchaResp = await fetch('/api/get_main_captcha', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pow_nonce: window._mainPowNonce,
      pow_challenge: window._mainPowChallenge
    })
  });

  const captchaData = await captchaResp.json();
  console.log('%c[+] CAPTCHA ACQUIRED!', 'color: #00ff00; font-weight: bold;');
  console.log(captchaData);

  // Hide the red timeout message and show the captcha UI
  document.getElementById('main-pow-loading').style.display = 'none';
  if (captchaData.type === 'math') {
    window.mainCaptchaData = captchaData;
    setupCanvasCaptcha();
  } else if (captchaData.type === 'click') {
    window.mainCaptchaData = captchaData;
    setupClickCaptcha();
  }
})();
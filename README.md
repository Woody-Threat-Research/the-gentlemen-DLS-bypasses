# the-gentlemen-DLS-bypasses
Bypasses broken bot and CAPTCHA checks on The Gentlemen DLS

## Usage

1. Navigate to The Gentlemen DLS (.onion link not provided here)
2. Open Developer Options (F12) and paste the bot-check-bypass.js script into the Console.
3. This *should* take you to a broken CAPTCHA page. Paste the generate-CAPTCHA.js script into the Console.
4. Copy the base64 PNG output within the console.log of the Console. Convert the base64 to an image using your favorite method, or use [this CyberChef recipe](link)
    * The CAPTCHA is a math equation in the format `number + number = ?` or `number × number = ?`
    * Example: ![Example CAPTCHA](examples/CAPTCHA.png)
    * The difference between `+` and `×` is very hard to discern in the CAPTCHA image. If it helps, the plus sign is slightly longer. Solve the CAPTCHA, you'll submit the answer in the next step.
6. Paste the submit-CAPTCHA.js script into the Console. A dialog box will appear, submit the solution to the CAPTCHA there.
7. Success?

## Caveats
* This is heavily (read: almost entirely) vibecoded. Sorry not sorry.
* This isn't a great candidate for automation due to the challenging CAPTCHA. Happy to be proven wrong.

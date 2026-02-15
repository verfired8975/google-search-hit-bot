const { connect } = require("puppeteer-real-browser");
const { parseProxy } = require("./proxy-manager");
const logger = require("./logger");

const BLOCKED_PATTERNS = [
  "google-analytics",
  "googletagmanager",
  "doubleclick",
  "facebook.com/tr",
  "fbevents",
  "analytics",
  "hotjar",
  "clarity.ms",
  "adservice",
  "pagead",
  "adsense",
  "tracking",
  "advertisement",
  "banner-ad",
];

async function launchBrowser(config, proxyStr, threadId) {
  const proxy = parseProxy(proxyStr);

  const response = await connect({
    headless: config.headless,
    fingerprint: true,
    turnstile: true,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-infobars",
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-renderer-backgrounding",
      "--disable-ipc-flooding-protection",
      "--lang=tr-TR",
    ],
    customConfig: {
      executablePath: config.executablePath,
    },
    proxy: proxy || undefined,
  });

  const { browser, page } = response;

  await page.setExtraHTTPHeaders({
    "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
    "Upgrade-Insecure-Requests": "1",
    DNT: "1",
  });

  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const url = req.url().toLowerCase();

    if (BLOCKED_PATTERNS.some((pattern) => url.includes(pattern))) {
      return req.abort();
    }

    if (url.includes("favicon.ico")) {
      return req.abort();
    }

    req.continue();
  });

  logger.success(threadId, `Browser basladi${proxyStr ? ` (proxy: ${proxyStr.split(":")[0]})` : ""}`);

  return { browser, page };
}

async function waitForPageLoad(page, threadId, timeout = 60000) {
  try {
    await page.waitForFunction(() => document.readyState === "complete", {
      timeout,
    });
    logger.debug(threadId, "Sayfa yuklendi");
    return true;
  } catch {
    logger.warn(threadId, "Sayfa yukleme zaman asimi");
    return false;
  }
}

async function handleGoogleConsent(page, threadId) {
  try {
    const html = await page.content();

    const consentSelectors = [
      "#L2AGLb",
      "#W0wltc",
      'button[aria-label="Accept all"]',
      'button[aria-label="Tümünü kabul et"]',
    ];

    for (const selector of consentSelectors) {
      const btn = await page.$(selector);
      if (btn) {
        await btn.click();
        logger.debug(threadId, "Cerez ekrani kabul edildi");
        await page
          .waitForNavigation({ waitUntil: "load", timeout: 10000 })
          .catch(() => null);
        return true;
      }
    }
  } catch (err) {
    logger.debug(threadId, `Cerez handler: ${err.message}`);
  }
  return false;
}

async function checkCaptcha(page, threadId) {
  try {
    const html = await page.content();
    const captchaIndicators = [
      "captcha-form",
      "g-recaptcha",
      "Our systems have detected",
      "unusual traffic",
      "robot olmad",
    ];

    if (captchaIndicators.some((indicator) => html.includes(indicator))) {
      logger.error(threadId, "CAPTCHA algilandi, thread sonlandiriliyor");
      return true;
    }
  } catch {}
  return false;
}

async function closeBrowser(browser, threadId) {
  try {
    if (browser) {
      await browser.close();
      logger.debug(threadId, "Browser kapatildi");
    }
  } catch (err) {
    logger.debug(threadId, `Browser kapatma hatasi: ${err.message}`);
  }
}

module.exports = {
  launchBrowser,
  waitForPageLoad,
  handleGoogleConsent,
  checkCaptcha,
  closeBrowser,
};

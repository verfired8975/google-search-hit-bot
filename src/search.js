const logger = require("./logger");
const { humanScroll, preClickDelay, readingDelay, sleep, randomSleep } = require("./humanize");
const { waitForPageLoad, checkCaptcha } = require("./browser");

async function waitForSearchResults(page, threadId) {
  try {
    await page.waitForSelector("#search, #result-stats, .KTBKoe", {
      timeout: 15000,
    });
    logger.success(threadId, "Arama sonuclari yuklendi");
    return true;
  } catch {
    logger.error(threadId, "Arama sonuclari yuklenemedi");
    return false;
  }
}

function extractRealUrl(href) {
  if (!href) return null;
  if (href.startsWith("/url?")) {
    try {
      const urlParams = new URLSearchParams(href.replace("/url?", ""));
      if (urlParams.has("q")) return urlParams.get("q");
    } catch {}
  }
  return href;
}

async function findAndClickDomain(page, config, threadId) {
  const results = await page.$$("a");

  for (const el of results) {
    let href;
    try {
      href = await el.evaluate((a) => a.getAttribute("href"));
    } catch {
      continue;
    }
    if (!href) continue;

    const realUrl = extractRealUrl(href);
    if (!realUrl) continue;

    const matched = config.domains.some((d) => realUrl.includes(d));
    if (!matched) continue;

    logger.success(threadId, `Domain bulundu: ${realUrl}`);

    await preClickDelay();

    try {
      await el.click();
      await page
        .waitForNavigation({ waitUntil: "load", timeout: 60000 })
        .catch(() => null);
      await waitForPageLoad(page, threadId);

      logger.success(threadId, `Tiklandi: ${realUrl}`);
      return true;
    } catch (err) {
      logger.error(threadId, `Tiklama hatasi: ${err.message}`);
      return false;
    }
  }

  return false;
}

async function goToNextPage(page, threadId) {
  const selectors = [
    "#pnnext",
    'a[aria-label="Next page"]',
    'a[aria-label="Sonraki"]',
    'a[id="pnnext"]',
  ];

  for (const selector of selectors) {
    const btn = await page.$(selector);
    if (btn) {
      await preClickDelay();
      await btn.click();
      await page
        .waitForNavigation({ waitUntil: "load", timeout: 60000 })
        .catch(() => null);
      await waitForPageLoad(page, threadId);
      return true;
    }
  }

  return false;
}

async function searchGoogle(page, keyword, threadId) {
  logger.search(`Araniyor: "${keyword}"`);

  await page.goto(
    `https://www.google.com/search?q=${encodeURIComponent(keyword)}`,
    { waitUntil: "load", timeout: 60000 }
  );

  await waitForPageLoad(page, threadId);
  return true;
}

async function browseSite(page, config, threadId) {
  const startTime = Date.now();
  let clicks = 0;

  logger.info(threadId, `Site ici gezinme basliyor (${config.browseTime / 1000}s)`);

  while (Date.now() - startTime < config.browseTime && clicks < config.maxClicks) {
    await waitForPageLoad(page, threadId);

    await readingDelay();
    await humanScroll(page, 3000);
    const domainLinks = await page.$$eval("a", (els) =>
      els
        .map((a) => a.href)
        .filter((h) => h && h.startsWith("http"))
    );

    const validLinks = domainLinks.filter((h) =>
      config.domains.some((d) => h.includes(d))
    );

    if (validLinks.length > 0) {
      const link = validLinks[Math.floor(Math.random() * validLinks.length)];
      try {
        const linkHandle = await page.evaluateHandle((targetHref) => {
          const allLinks = document.querySelectorAll("a");
          for (const a of allLinks) {
            if (a.href === targetHref) return a;
          }
          return null;
        }, link);

        const element = linkHandle.asElement();
        if (element) {
          logger.info(threadId, `Site ici tiklama: ${link.substring(0, 80)}...`);
          await preClickDelay();
          await element.click();
          await page
            .waitForNavigation({ waitUntil: "load", timeout: 30000 })
            .catch(() => null);
          clicks++;
        }
      } catch {}
    }

    await randomSleep(1500, 3000);
  }

  logger.success(threadId, `Gezinme tamamlandi (${clicks} tiklama)`);
}

module.exports = {
  waitForSearchResults,
  findAndClickDomain,
  goToNextPage,
  searchGoogle,
  browseSite,
};

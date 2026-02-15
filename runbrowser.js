const { loadConfig } = require("./src/config-loader");
const { launchBrowser, waitForPageLoad, handleGoogleConsent, checkCaptcha, closeBrowser } = require("./src/browser");
const { applyCookies } = require("./src/cookie-manager");
const { searchGoogle, waitForSearchResults, findAndClickDomain, goToNextPage, browseSite } = require("./src/search");
const logger = require("./src/logger");

const config = loadConfig();

async function runBot(threadId, proxy, keyword, cookieFile) {
  logger.header(threadId);

  let browser = null;

  try {
    const result = await launchBrowser(config, proxy, threadId);
    browser = result.browser;
    const page = result.page;

    if (cookieFile) {
      await applyCookies(page, config.cookiesFolder, cookieFile, threadId);
    }

    await searchGoogle(page, keyword, threadId);

    if (await checkCaptcha(page, threadId)) {
      process.send && process.send({ type: "fail", threadId });
      return;
    }

    if (!(await waitForSearchResults(page, threadId))) {
      process.send && process.send({ type: "fail", threadId });
      return;
    }

    await handleGoogleConsent(page, threadId);

    let found = false;
    let pageNum = 1;

    while (!found && pageNum <= config.maxPages) {
      logger.search(`Sayfa ${pageNum} taraniyor...`);

      found = await findAndClickDomain(page, config, threadId);

      if (found) {
        await browseSite(page, config, threadId);
        process.send && process.send({ type: "success", threadId });
        return;
      }

      if (pageNum < config.maxPages) {
        const hasNext = await goToNextPage(page, threadId);
        if (!hasNext) {
          logger.warn(threadId, `Sonraki sayfa butonu bulunamadi`);
          break;
        }

        if (await checkCaptcha(page, threadId)) {
          process.send && process.send({ type: "fail", threadId });
          return;
        }
      }

      pageNum++;
    }

    if (!found) {
      logger.error(threadId, `Domain ${config.maxPages} sayfada bulunamadi`);
      process.send && process.send({ type: "fail", threadId });
    }
  } catch (err) {
    logger.error(threadId, `Hata: ${err.message}`);
    process.send && process.send({ type: "fail", threadId });
  } finally {
    await closeBrowser(browser, threadId);
  }
}

const args = process.argv.slice(2);
const threadId = args[0];
const proxy = args[1] !== "null" ? args[1] : null;
const keyword = args[2] !== "null" ? args[2] : null;
const cookieFile = args[3] !== "null" ? args[3] : null;

process.on("unhandledRejection", (err) => {
  logger.error(threadId, `Unhandled rejection: ${err.message}`);
  process.send && process.send({ type: "fail", threadId });
  process.exit(1);
});

runBot(threadId, proxy, keyword, cookieFile);

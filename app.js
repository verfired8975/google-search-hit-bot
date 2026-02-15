const fs = require("fs");
const path = require("path");
const { fork } = require("child_process");
const { loadConfig } = require("./src/config-loader");
const { loadProxies, getProxyForThread } = require("./src/proxy-manager");
const { loadAvailableCookies } = require("./src/cookie-manager");
const logger = require("./src/logger");

let config;
try {
  config = loadConfig();
} catch (err) {
  console.error(`Config hatasi: ${err.message}`);
  process.exit(1);
}

let successCount = 0;
let failCount = 0;
let launchedCount = 0;
const usedCookies = new Set();

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function loadKeywords() {
  const filePath = path.resolve(config.keywordsFile);
  if (!fs.existsSync(filePath)) return [];
  return fs
    .readFileSync(filePath, "utf8")
    .split("\n")
    .map((k) => k.trim())
    .filter(Boolean);
}

function startThread(threadId, proxy, keyword, cookieFile) {
  launchedCount++;

  const child = fork(path.join(__dirname, "runbrowser.js"), [
    threadId.toString(),
    proxy || "null",
    keyword || "null",
    cookieFile || "null",
  ]);

  child.on("message", (msg) => {
    if (msg.type === "success") {
      successCount++;
      logger.success(msg.threadId, "Tamamlandi");
    } else if (msg.type === "fail") {
      failCount++;
      logger.error(msg.threadId, "Basarisiz");
    }
    logger.progress(successCount, failCount, config.threads);
  });

  child.on("exit", (code) => {
    if (code !== 0) {
      logger.debug(threadId, `Process cikis kodu: ${code}`);
    }
  });

  child.on("error", (err) => {
    logger.error(threadId, `Process hatasi: ${err.message}`);
    failCount++;
  });
}

function main() {
  const proxies = loadProxies(config.proxiesFile);
  const keywords = loadKeywords();
  const cookies = loadAvailableCookies(config.cookiesFolder);

  if (keywords.length === 0) {
    logger.system("HATA: keywords.txt bos. Anahtar kelimeler ekleyin.");
    process.exit(1);
  }

  if (cookies.length === 0) {
    logger.system("UYARI: cookies/ klasoru bos. Cookie olmadan devam ediliyor.");
  }

  logger.system(`Domains: ${config.domains.join(", ")}`);
  logger.system(`Keywords: ${keywords.length} adet`);
  logger.system(`Cookies: ${cookies.length} adet`);
  logger.system(`Proxies: ${proxies.length} adet`);
  logger.system(`Threads: ${config.threads}`);
  logger.system(`Chrome: ${config.executablePath}`);
  logger.system(`Headless: ${config.headless}`);

  if (config.spreadThreads) {
    const intervalMs = Math.floor(
      (config.timeFrameHours * 3600 * 1000) / config.threads
    );
    const intervalSec = Math.round(intervalMs / 1000);
    logger.system(
      `Zamanlama: ${config.threads} thread ${config.timeFrameHours} saatte (~${intervalSec}s arayla)`
    );

    for (let i = 0; i < config.threads; i++) {
      setTimeout(() => {
        const proxy = getProxyForThread(proxies, i);
        const keyword = keywords[i % keywords.length];
        let available = cookies.filter((c) => !usedCookies.has(c));
        let cookieFile = available.length > 0 ? getRandomElement(available) : null;
        if (cookieFile) usedCookies.add(cookieFile);
        startThread(i + 1, proxy, keyword, cookieFile);
      }, i * intervalMs);
    }
  } else {
    logger.system("Tum thread'ler aninda baslatiliyor...");

    for (let i = 0; i < config.threads; i++) {
      const proxy = getProxyForThread(proxies, i);
      const keyword = keywords[i % keywords.length];
      let available = cookies.filter((c) => !usedCookies.has(c));
      let cookieFile = available.length > 0 ? getRandomElement(available) : null;
      if (cookieFile) usedCookies.add(cookieFile);
      startThread(i + 1, proxy, keyword, cookieFile);
    }
  }
}

main();

const fs = require("fs");
const path = require("path");
const os = require("os");

const REQUIRED_FIELDS = [
  "domains",
  "maxPages",
  "keywordsFile",
  "cookiesFolder",
  "proxiesFile",
  "threads",
  "browseTime",
  "maxClicks",
];

function detectChromePath() {
  const platform = os.platform();
  const paths = {
    darwin: [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
    ],
    win32: [
      "C:/Program Files/Google/Chrome/Application/chrome.exe",
      "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
      process.env.LOCALAPPDATA +
        "/Google/Chrome/Application/chrome.exe",
    ],
    linux: [
      "/usr/bin/google-chrome",
      "/usr/bin/google-chrome-stable",
      "/usr/bin/chromium-browser",
      "/usr/bin/chromium",
    ],
  };

  const candidates = paths[platform] || paths.linux;
  for (const p of candidates) {
    if (p && fs.existsSync(p)) return p;
  }
  return null;
}

function loadConfig(configPath) {
  const fullPath = path.resolve(configPath || "config.json");

  if (!fs.existsSync(fullPath)) {
    throw new Error(`Config dosyasi bulunamadi: ${fullPath}`);
  }

  let raw = fs.readFileSync(fullPath, "utf8");

  raw = raw.replace(/\/\/.*$/gm, "");

  let config;
  try {
    config = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Config JSON parse hatasi: ${err.message}`);
  }

  for (const field of REQUIRED_FIELDS) {
    if (config[field] === undefined) {
      throw new Error(`Config'de zorunlu alan eksik: ${field}`);
    }
  }

  if (!Array.isArray(config.domains) || config.domains.length === 0) {
    throw new Error("Config'de en az bir domain tanimlanmali");
  }

  if (config.threads < 1) {
    throw new Error("threads en az 1 olmali");
  }

  if (!config.executablePath || config.executablePath === "auto") {
    const detected = detectChromePath();
    if (!detected) {
      throw new Error(
        "Chrome otomatik bulunamadi. config.json'da executablePath'i manuel ayarla."
      );
    }
    config.executablePath = detected;
  }

  config.headless = config.headless ?? false;
  config.spreadThreads = config.spreadThreads ?? false;
  config.timeFrameHours = config.timeFrameHours ?? 1;

  return config;
}

module.exports = { loadConfig };

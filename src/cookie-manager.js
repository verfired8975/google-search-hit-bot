const fs = require("fs");
const path = require("path");
const logger = require("./logger");

const INVALID_COOKIE_FIELDS = [
  "partitionKey",
  "sourcePort",
  "sourceScheme",
  "size",
  "priority",
  "storeId",
  "hostOnly",
  "id",
];

function loadAvailableCookies(cookiesFolder) {
  const cookieDir = path.resolve(cookiesFolder);
  if (!fs.existsSync(cookieDir)) return [];
  return fs
    .readdirSync(cookieDir)
    .filter((f) => f.endsWith(".json") || f.endsWith(".txt"));
}

function parseCookieFile(cookiesFolder, fileName) {
  const filePath = path.join(path.resolve(cookiesFolder), fileName);

  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);
    const rawCookies = parsed.cookies || parsed;

    if (!Array.isArray(rawCookies)) {
      return null;
    }

    return rawCookies
      .map((c) => {
        const cleaned = {};
        for (const [key, value] of Object.entries(c)) {
          if (!INVALID_COOKIE_FIELDS.includes(key) && value !== null) {
            cleaned[key] = value;
          }
        }
        if (cleaned.sameSite) {
          const valid = ["Strict", "Lax", "None"];
          const normalized =
            cleaned.sameSite.charAt(0).toUpperCase() +
            cleaned.sameSite.slice(1).toLowerCase();
          if (valid.includes(normalized)) {
            cleaned.sameSite = normalized;
          } else {
            delete cleaned.sameSite;
          }
        }
        return cleaned;
      })
      .filter((c) => c.name && c.value);
  } catch (err) {
    logger.error("COOKIE", `Parse hatasi (${fileName}): ${err.message}`);
    return null;
  }
}

async function applyCookies(page, cookiesFolder, fileName, threadId) {
  if (!fileName) return false;

  const cookies = parseCookieFile(cookiesFolder, fileName);
  if (!cookies || cookies.length === 0) {
    logger.warn(threadId, `Cookie dosyasi bos veya gecersiz: ${fileName}`);
    return false;
  }

  try {
    await page.setCookie(...cookies);
    logger.success(threadId, `Cookie yuklendi: ${fileName} (${cookies.length} adet)`);
    return true;
  } catch (err) {
    logger.error(threadId, `Cookie yukleme hatasi: ${err.message}`);
    return false;
  }
}

module.exports = { loadAvailableCookies, parseCookieFile, applyCookies };

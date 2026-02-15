const fs = require("fs");
const path = require("path");

function loadProxies(proxiesFile) {
  const filePath = path.resolve(proxiesFile);
  if (!fs.existsSync(filePath)) return [];

  return fs
    .readFileSync(filePath, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !l.startsWith("#"));
}

function parseProxy(proxyStr) {
  if (!proxyStr) return undefined;

  const parts = proxyStr.split(":");

  if (parts.length === 4) {
    return {
      host: parts[0],
      port: parts[1],
      username: parts[2],
      password: parts[3],
    };
  }

  if (parts.length === 2) {
    return {
      host: parts[0],
      port: parts[1],
    };
  }

  return undefined;
}

function getProxyForThread(proxies, threadIndex) {
  if (!proxies || proxies.length === 0) return null;
  return proxies[threadIndex % proxies.length];
}

module.exports = { loadProxies, parseProxy, getProxyForThread };

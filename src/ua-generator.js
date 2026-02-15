function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const androidVersions = [
  { version: "15", weight: 0.3, buildLetter: "V" },
  { version: "14", weight: 0.45, buildLetter: "U" },
  { version: "13", weight: 0.2, buildLetter: "T" },
  { version: "12", weight: 0.05, buildLetter: "S" },
];

const chromeVersions = [
  { major: 131, minBuild: 6700, maxBuild: 6800 },
  { major: 130, minBuild: 6600, maxBuild: 6700 },
  { major: 129, minBuild: 6500, maxBuild: 6600 },
  { major: 128, minBuild: 6400, maxBuild: 6500 },
  { major: 127, minBuild: 6300, maxBuild: 6400 },
];

const deviceModels = {
  samsung: [
    "SM-S928B", "SM-S928U", "SM-S926B", "SM-S921B",
    "SM-S918B", "SM-A556E", "SM-A546E", "SM-A356E",
  ],
  xiaomi: [
    "24031PN0DC", "23049PCD8G", "2201116SG", "23021RAA2Y",
    "2311DRK48C",
  ],
  google: ["Pixel 9 Pro", "Pixel 9", "Pixel 8 Pro", "Pixel 8", "Pixel 7a"],
  oneplus: ["CPH2581", "CPH2449", "NE2215", "CPH2611"],
  huawei: ["LIO-AL00", "ELS-AN00", "NOH-AN00"],
};

const brandWeights = [
  { brand: "samsung", weight: 0.4 },
  { brand: "xiaomi", weight: 0.25 },
  { brand: "google", weight: 0.15 },
  { brand: "oneplus", weight: 0.12 },
  { brand: "huawei", weight: 0.08 },
];

const desktopOS = [
  { os: "Windows NT 10.0; Win64; x64", weight: 0.55 },
  { os: "Windows NT 11.0; Win64; x64", weight: 0.15 },
  { os: "Macintosh; Intel Mac OS X 10_15_7", weight: 0.2 },
  { os: "X11; Linux x86_64", weight: 0.1 },
];

function getWeightedRandom(items) {
  const totalWeight = items.reduce((acc, item) => acc + item.weight, 0);
  let random = Math.random() * totalWeight;
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) return item;
  }
  return items[0];
}

function generateChromeVersion() {
  const { major, minBuild, maxBuild } = getRandomElement(chromeVersions);
  return `${major}.0.${getRandomInt(minBuild, maxBuild)}.${getRandomInt(100, 250)}`;
}

function generateBuildDate(androidVersion) {
  const baseYear = 2020 + parseInt(androidVersion);
  const month = String(getRandomInt(1, 12)).padStart(2, "0");
  const day = String(getRandomInt(1, 28)).padStart(2, "0");
  return `${baseYear}${month}${day}`;
}

function generateMobileUA() {
  const brand = getWeightedRandom(brandWeights).brand;
  const model = getRandomElement(deviceModels[brand]);
  const android = getWeightedRandom(androidVersions);
  const buildDate = generateBuildDate(android.version);
  const chromeVersion = generateChromeVersion();

  const buildVariants = [
    `${android.buildLetter}Q1A.${buildDate}.001`,
    `${android.buildLetter}KQA.${buildDate}.002`,
    `${android.buildLetter}P1A.${buildDate}.003`,
    `${android.buildLetter}QA.${buildDate}.004`,
  ];
  const build = getRandomElement(buildVariants);

  return `Mozilla/5.0 (Linux; Android ${android.version}; ${model} Build/${build}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Mobile Safari/537.36`;
}

function generateDesktopUA() {
  const osInfo = getWeightedRandom(desktopOS);
  const chromeVersion = generateChromeVersion();
  return `Mozilla/5.0 (${osInfo.os}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
}

function generateUserAgent(type) {
  if (type === "mobile") return generateMobileUA();
  if (type === "desktop") return generateDesktopUA();

  return Math.random() < 0.3 ? generateMobileUA() : generateDesktopUA();
}

function getViewportForUA(ua) {
  if (ua.includes("Mobile")) {
    const mobileViewports = [
      { width: 390, height: 844 },
      { width: 393, height: 873 },
      { width: 412, height: 915 },
      { width: 360, height: 800 },
    ];
    return getRandomElement(mobileViewports);
  }
  const desktopViewports = [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1536, height: 864 },
    { width: 1440, height: 900 },
  ];
  return getRandomElement(desktopViewports);
}

module.exports = { generateUserAgent, getViewportForUA };

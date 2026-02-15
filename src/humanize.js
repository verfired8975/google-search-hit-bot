function gaussianRandom(mean, stddev) {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return Math.max(0, mean + z * stddev);
}

function randomSleep(minMs, maxMs) {
  const mean = (minMs + maxMs) / 2;
  const stddev = (maxMs - minMs) / 4;
  const ms = Math.round(gaussianRandom(mean, stddev));
  const clamped = Math.max(minMs, Math.min(maxMs, ms));
  return new Promise((r) => setTimeout(r, clamped));
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function humanScroll(page, durationMs) {
  const start = Date.now();
  const viewport = await page.viewport();
  if (!viewport) return;

  while (Date.now() - start < durationMs) {
    const direction = Math.random() > 0.3 ? 1 : -1;
    const amount = direction * (Math.floor(Math.random() * 400) + 100);
    await page.evaluate((y) => window.scrollBy({ top: y, behavior: "smooth" }), amount);

    const randX = Math.floor(Math.random() * viewport.width * 0.8) + viewport.width * 0.1;
    const randY = Math.floor(Math.random() * viewport.height * 0.8) + viewport.height * 0.1;
    await page.mouse.move(randX, randY, {
      steps: Math.floor(Math.random() * 6) + 3,
    });

    await randomSleep(800, 2500);
  }
}

async function preClickDelay() {
  await randomSleep(1500, 5000);
}

async function readingDelay() {
  await randomSleep(3000, 8000);
}

module.exports = {
  sleep,
  randomSleep,
  humanScroll,
  preClickDelay,
  readingDelay,
  gaussianRandom,
};

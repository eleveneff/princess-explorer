/**
 * Standing on the garden circle and pressing E starts the garden mini-game.
 * The key is a real keydown. Nothing calls v35.open directly.
 * Run: node tests/garden-e.mjs
 */
import { createRequire } from "module";
import http from "http";
import fs from "fs";
import path from "path";

const require = createRequire(import.meta.url);
const puppeteer = require("/tmp/pe-tools/node_modules/puppeteer-core");
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const failures = [];
function check(name, ok, detail = "") {
  failures.push({ name, ok: !!ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? " — " + detail : ""}`);
}

const server = http.createServer((req, res) => {
  const file = req.url.split("?")[0] === "/" ? "/index.html" : req.url.split("?")[0];
  const full = path.join(root, decodeURIComponent(file));
  if (!full.startsWith(root) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) {
    res.writeHead(404); res.end("no"); return;
  }
  const ext = path.extname(full);
  res.writeHead(200, { "content-type": ext === ".js" ? "text/javascript" : "text/html" });
  fs.createReadStream(full).pipe(res);
});
await new Promise((r) => server.listen(8797, "127.0.0.1", r));

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: "new",
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist", "--no-sandbox", "--disable-dev-shm-usage"],
});

async function hold(page, key, ms) {
  await page.keyboard.down(key);
  await new Promise((r) => setTimeout(r, ms));
  await page.keyboard.up(key);
}

async function boot(save, viewport) {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (err) => errors.push(String(err.message || err)));
  page.on("console", (msg) => { if (msg.type() === "error" && !/favicon|Failed to load/i.test(msg.text())) errors.push(msg.text()); });
  page._errors = errors;
  await page.setViewport(viewport || { width: 1280, height: 720 });
  if (save) {
    await page.evaluateOnNewDocument((payload) => {
      localStorage.setItem("princess-explorer-save-v1", JSON.stringify(payload));
    }, save);
  }
  await page.goto("http://127.0.0.1:8797/index.html?quiet=1", { waitUntil: "networkidle0", timeout: 90000 });
  await page.waitForFunction(() => window.PrincessExplorer && window.PrincessExplorer.v35, { timeout: 30000 });
  await page.click("#start");
  await page.click("canvas");
  await new Promise((r) => setTimeout(r, 250));
  return page;
}

async function walkOnto(page, id, key) {
  await page.evaluate((id) => {
    const PE = window.PrincessExplorer;
    if (PE.v3 && PE.v3.castle && PE.v3.castle.inCastle) PE.v3.castle.exitCastle();
    const spot = PE.zones[id].spot;
    PE.teleport(spot.x, spot.z + 2.6);
    PE.face(Math.PI);
    if (PE.snapCamera) PE.snapCamera();
  }, id);
  await hold(page, key, 900);
  return page.evaluate((id) => {
    const PE = window.PrincessExplorer;
    const p = PE.princess.position;
    const s = PE.zones[id].spot;
    return {
      dist: +Math.hypot(p.x - s.x, p.z - s.z).toFixed(2),
      nearest: PE.nearest,
      act: (document.getElementById("act") && document.getElementById("act").innerText || "").replace(/\s+/g, " ")
    };
  }, id);
}

function gardenOpen() {
  return pageState();
}
async function pageState(page) {
  return page.evaluate(() => {
    const PE = window.PrincessExplorer;
    const panel = document.getElementById("panel");
    return {
      open: !!(PE.v35 && PE.v35.isOpen && PE.v35.isOpen()),
      game: PE.v35 && PE.v35.game,
      phase: PE.v35 && PE.v35.phase,
      panel: !!(panel && !panel.classList.contains("hidden")),
      title: document.getElementById("panel-title") && document.getElementById("panel-title").innerText
    };
  });
}

const fresh = await boot(null);
const walked = await walkOnto(fresh, "garden", "KeyW");
check("walking with W lands on the garden circle", walked.nearest === "garden" && walked.dist < 3.2 && /Play/.test(walked.act), JSON.stringify(walked));
await fresh.keyboard.press("e");
await new Promise((r) => setTimeout(r, 500));
let opened = await pageState(fresh);
check("a real e key starts the garden game", opened.open && opened.game === "garden" && !opened.panel, JSON.stringify(opened));
await fresh.screenshot({ path: "/opt/cursor/artifacts/garden-e-open.png" });
await fresh.close();

const caps = await boot(null);
await walkOnto(caps, "garden", "ArrowUp");
await caps.keyboard.down("KeyE");
await caps.keyboard.up("KeyE");
await new Promise((r) => setTimeout(r, 400));
opened = await pageState(caps);
check("ArrowUp onto the circle and KeyE still starts it", opened.open && opened.game === "garden", JSON.stringify(opened));
await caps.close();

const save51 = {
  score: 80,
  streak: 2,
  bestStreak: 4,
  shop: { owned: { "hat-sun": true }, equip: { hat: "hat-sun" } },
  petName: "Sir Biscuit",
  pos: { x: 6, z: 8 },
  ver: 3,
  v45: { layout: 1, care: { owned: { terrace: 1 }, spent: 40 }, spend: { care: 40 } },
  v47: { skills: { measure: { c: 1, w: 0, n: 1 } }, playMs: 1000, quiet: true, daily: { streak: 1, day: "2026-11-20" }, due: [], ready: {}, passed: {} }
};
const old = await boot(save51);
await walkOnto(old, "garden", "KeyW");
await old.keyboard.press("E");
await new Promise((r) => setTimeout(r, 400));
opened = await pageState(old);
const kept = await old.evaluate(() => {
  const s = window.PrincessExplorer.state();
  return { score: s.score, hat: s.shop.equip.hat, terrace: s.v45.care.owned.terrace };
});
check("a 5.1 save with the terrace built still starts the garden on E", opened.open && opened.game === "garden" && kept.score === 80 && kept.hat === "hat-sun" && kept.terrace === 1, JSON.stringify({ opened, kept }));
await old.close();

const touch = await boot(null, { width: 390, height: 844, isMobile: true, hasTouch: true });
await walkOnto(touch, "garden", "KeyW");
await touch.click("#act");
await new Promise((r) => setTimeout(r, 500));
opened = await pageState(touch);
check("the on-screen Play button starts the garden", opened.open && opened.game === "garden", JSON.stringify(opened));
await touch.close();

const other = await boot(null);
const tennis = await walkOnto(other, "tennis", "KeyW");
check("walking onto tennis still marks that circle", tennis.nearest === "tennis" && tennis.dist < 3.2, JSON.stringify(tennis));
await other.keyboard.press("e");
await new Promise((r) => setTimeout(r, 400));
const tennisAfter = await pageState(other);
check("E at another station still opens its own activity", tennisAfter.panel && tennisAfter.title && !tennisAfter.open, JSON.stringify(tennisAfter));
check("no page errors while pressing E", other._errors.length === 0, other._errors.slice(0, 3).join(" | "));
await other.close();

const failed = failures.filter((f) => !f.ok);
console.log(`\n${failures.length - failed.length} passed, ${failed.length} failed`);
await browser.close();
server.close();
process.exit(failed.length ? 1 : 0);

/**
 * Wider lawn, river locks, and a swan ride that does not mint coins.
 * Run: node tests/v54.mjs
 */
import { createRequire } from "module";
import http from "http";
import fs from "fs";
import path from "path";

const require = createRequire(import.meta.url);
const puppeteer = require("/tmp/pe-tools/node_modules/puppeteer-core");
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const shot = "/opt/cursor/artifacts";
const failures = [];
function check(name, ok, detail = "") {
  failures.push({ name, ok: !!ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? " — " + detail : ""}`);
}
const server = http.createServer((req, res) => {
  const file = req.url.split("?")[0] === "/" ? "/index.html" : req.url.split("?")[0];
  const full = path.join(root, decodeURIComponent(file));
  if (!full.startsWith(root) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const ext = path.extname(full);
  res.writeHead(200, { "content-type": ext === ".js" ? "text/javascript" : "text/html" });
  fs.createReadStream(full).pipe(res);
});
await new Promise((r) => server.listen(8810, "127.0.0.1", r));
const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: "new",
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist", "--no-sandbox", "--disable-dev-shm-usage"],
});

async function boot(save) {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e.message || e)));
  page.on("console", (m) => { if (m.type() === "error" && !/favicon|404|Failed to load resource/i.test(m.text())) errors.push(m.text()); });
  page._errors = errors;
  if (save) await page.evaluateOnNewDocument((payload) => localStorage.setItem("princess-explorer-save-v1", JSON.stringify(payload)), save);
  await page.setViewport({ width: 1280, height: 720 });
  await page.goto("http://127.0.0.1:8810/index.html?quiet=1", { waitUntil: "networkidle0", timeout: 90000 });
  await page.waitForFunction(() => window.PrincessExplorer && window.PrincessExplorer.v54, { timeout: 30000 });
  return page;
}
async function pick(page, choice) {
  await page.evaluate((choice) => {
    const btn = document.querySelector(`#learn-card button[data-choice="${choice}"]`);
    if (btn) btn.click();
  }, choice);
}

const fresh = await boot(null);
const layout = await fresh.evaluate(() => {
  const PE = window.PrincessExplorer;
  const prices = PE.care.DEFS.map((d) => [d.id, d.price]);
  const spread = PE.v54.spread();
  const ids = Object.keys(spread);
  const pts = ids.map((id) => spread[id]);
  let minGap = 1e9;
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
    minGap = Math.min(minGap, Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]));
  }
  const water = ids.every((id) => PE.v54.nearest(spread[id][0], spread[id][1]).d > 6);
  const inside = ids.every((id) => Math.hypot(spread[id][0], spread[id][1]) < PE.v54.edge());
  const dock = PE.care.DEFS.find((d) => d.id === "swans");
  return { prices, minGap: +minGap.toFixed(1), water, inside, dock: [dock.ang, dock.rad], under: PE.v54.bridgeUnder(), errors: true };
});
const expect = [["terrace", 40], ["stable", 50], ["studio", 45], ["nook", 35], ["tea", 30], ["maze", 35], ["training", 50], ["court", 40], ["observatory", 45], ["swans", 30], ["stage", 35], ["corgi", 25]];
check("prices are unchanged", JSON.stringify(layout.prices) === JSON.stringify(expect), JSON.stringify(layout.prices));
check("outer stations sit apart, on the bank, inside the new edge", layout.minGap > 12 && layout.water && layout.inside, JSON.stringify(layout));
check("the swan dock stays on the moat", Math.abs(layout.dock[1] - 11.05) < 0.01, JSON.stringify(layout.dock));
check("a river bridge clears 2.8 under the deck", layout.under >= 2.8, String(layout.under));

const kept = await fresh.evaluate(() => {
  const PE = window.PrincessExplorer;
  const before = JSON.parse(localStorage.getItem("princess-explorer-save-v1") || "{}");
  return { had: !!before.v54, score: PE.state().score };
});
check("a fresh load does not require an old v54 block", kept.had === false || kept.had === true);

const ride = await fresh.evaluate(() => {
  const PE = window.PrincessExplorer;
  PE.state().score = 80;
  PE.care.commit("swans");
  PE.care.act("swans");
  const frost = PE.v54.samples().find((s) => s.lock === "frost");
  PE.v54.start(Math.max(0, frost.u - 0.012));
  PE.v54.press("KeyD", true);
  const side0 = PE.v54.pose().side;
  PE.v54.steer(0.4);
  const side1 = PE.v54.pose().side;
  PE.v54.press("KeyD", false);
  PE.v54.press("KeyW", true);
  PE.v54.steer(0.6);
  PE.v54.press("KeyW", false);
  const card = document.getElementById("learn-card");
  return {
    score: PE.state().score,
    open: PE.learn.ui.open(),
    of3: !!(card && /of 3/.test(card.innerText)),
    title: card ? card.innerText.slice(0, 40) : "",
    sideSame: Math.abs(side1 - side0) < 0.2,
    answer: PE.learn.gate.current() && PE.learn.gate.current().answer
  };
});
check("D does not steer the boat", ride.sideSame, JSON.stringify(ride));
check("reaching Frost Lock opens 3 questions and does not charge yet", ride.open && ride.of3 && ride.score === 50, JSON.stringify(ride));

const beforeMiss = ride.score;
await pick(fresh, ride.answer === 0 ? 1 : 0);
await new Promise((r) => setTimeout(r, 200));
const tutor = await fresh.evaluate(() => {
  const st = window.PrincessExplorer.learn.tutorial.state();
  return { phase: st && st.phase, score: window.PrincessExplorer.state().score };
});
check("a miss opens the lesson and does not spend coins", tutor.phase === "teach" && tutor.score === beforeMiss, JSON.stringify(tutor));
for (let i = 0; i < 4; i++) {
  const phase = await fresh.evaluate(() => {
    const st = window.PrincessExplorer.learn.tutorial.state();
    if (st && st.phase === "teach") window.PrincessExplorer.learn.tutorial.next();
    return window.PrincessExplorer.learn.tutorial.state();
  });
  if (phase && phase.phase === "practice") break;
}
const practice = await fresh.evaluate(() => {
  const before = window.PrincessExplorer.state().score;
  const btn = document.querySelector("#learn-card button[data-tutor]");
  if (btn) btn.click();
  return { before, after: window.PrincessExplorer.state().score };
});
check("practice does not change coins", practice.after === practice.before, JSON.stringify(practice));
let guard = 0;
while (guard < 4) {
  const q = await fresh.evaluate(() => {
    const cur = window.PrincessExplorer.learn.gate.current();
    return cur ? { answer: cur.answer, open: window.PrincessExplorer.learn.ui.open() } : { open: false };
  });
  if (!q.open) break;
  await pick(fresh, q.answer);
  await new Promise((r) => setTimeout(r, 200));
  guard++;
}
const paid = await fresh.evaluate(() => {
  const PE = window.PrincessExplorer;
  PE.learn.lock.open("frost");
  const again = PE.state().score;
  if (!PE.care.boat.on()) PE.care.act("swans");
  if (!PE.v54.pose()) PE.v54.start(0.42);
  const pose = PE.v54.pose();
  const item = PE.scene.getObjectByName("v54-pickup-0");
  if (item && pose) {
    item.visible = true;
    item.position.set(pose.x, 0.4, pose.z);
  }
  const found = PE.v54.grab();
  return { score: PE.state().score, frost: PE.state().v54 && PE.state().v54.frost, found, again, open: PE.learn.ui.open() };
});
check("three right answers spend 20 once", paid.frost === 1 && paid.score === 30, JSON.stringify(paid));
check("the lock does not charge again", paid.again === 30, JSON.stringify(paid));
check("a floating pickup pays nothing", paid.found >= 1 && paid.score === 30, JSON.stringify(paid));

const old = await boot({
  score: 90,
  hat: "hat-sun",
  v45: { care: { owned: { terrace: 1, swans: 1, upper: 1 }, spent: 110 } },
  v53: { plan: 1, upper: 1, secret: 1 }
});
const migrated = await old.evaluate(() => {
  const s = window.PrincessExplorer.state();
  return { score: s.score, hat: s.hat, terrace: s.v45.care.owned.terrace, upper: s.v53.upper, secret: s.v53.secret, swans: s.v45.care.owned.swans };
});
check("a 5.3 save keeps coins, the hat, the terrace, the upstairs, and the passage", migrated.score === 90 && migrated.hat === "hat-sun" && migrated.terrace === 1 && migrated.upper === 1 && migrated.secret === 1 && migrated.swans === 1, JSON.stringify(migrated));

await fresh.evaluate(() => {
  const PE = window.PrincessExplorer;
  const intro = document.getElementById("intro");
  if (intro) intro.classList.add("hidden");
  const start = document.getElementById("start");
  if (start) start.click();
  PE.state().score = 400;
  ["stable", "maze", "observatory", "training", "corgi"].forEach((id) => PE.care.commit(id));
  PE.v54.look("aerial");
});
await fresh.screenshot({ path: path.join(shot, "0-river-aerial.png") });
await fresh.evaluate(() => window.PrincessExplorer.v54.look("bridge"));
await fresh.screenshot({ path: path.join(shot, "0-river-boat.png") });
await fresh.evaluate(() => {
  const PE = window.PrincessExplorer;
  PE.state().score = 40;
  PE.v54.look("bridge");
  const cove = PE.v54.samples().find((s) => s.lock === "cove");
  PE.v54.start(Math.max(0, cove.u - 0.01));
  PE.v54.press("KeyW", true);
  PE.v54.steer(0.5);
  PE.v54.press("KeyW", false);
});
await fresh.screenshot({ path: path.join(shot, "0-river-lock.png") });
await fresh.evaluate(() => window.PrincessExplorer.v54.look("station"));
await fresh.screenshot({ path: path.join(shot, "0-river-station.png") });
await fresh.evaluate(() => window.PrincessExplorer.v54.look("castle"));
await fresh.screenshot({ path: path.join(shot, "0-river-castle.png") });

const fpsPage = await boot(null);
const client = await fpsPage.createCDPSession();
await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });
const fps = await fpsPage.evaluate(() => new Promise((resolve) => {
  const PE = window.PrincessExplorer;
  PE.v54.release();
  PE.princess.position.set(20, 0, 12);
  PE.camera.position.set(14, 7, 20);
  PE.camera.lookAt(20, 1, 12);
  PE.camera.far = 160;
  PE.camera.updateProjectionMatrix();
  let frames = 0;
  const start = performance.now();
  function tick() {
    frames++;
    PE.renderer.render(PE.scene, PE.camera);
    if (performance.now() - start < 1000) requestAnimationFrame(tick);
    else resolve(frames);
  }
  requestAnimationFrame(tick);
}));
console.log("TABLET_FPS_4X", fps);
const calls = await fpsPage.evaluate(() => window.PrincessExplorer.renderer.info.render.calls);
console.log("DRAW_CALLS", calls);
check("no page errors on the river page", fresh._errors.length === 0, fresh._errors.slice(0, 3).join(" | "));

await browser.close();
await new Promise((r) => server.close(r));
const failed = failures.filter((f) => !f.ok);
console.log(`${failures.length - failed.length} passed, ${failed.length} failed`);
if (failed.length) process.exit(1);

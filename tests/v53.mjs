/**
 * Castle second floor: real E at the stair and the bookcase, saves, and three questions.
 * Run: node tests/v53.mjs
 */
import { createRequire } from "module";
import http from "http";
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";

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
  res.writeHead(200, { "content-type": path.extname(full) === ".js" ? "text/javascript" : "text/html" });
  fs.createReadStream(full).pipe(res);
});
await new Promise((r) => server.listen(8801, "127.0.0.1", r));
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
async function boot(save) {
  const page = await browser.newPage();
  page.on("pageerror", (e) => page._err = (page._err || []).concat(e.message));
  await page.setViewport({ width: 1280, height: 720 });
  if (save) await page.evaluateOnNewDocument((p) => localStorage.setItem("princess-explorer-save-v1", JSON.stringify(p)), save);
  await page.goto("http://127.0.0.1:8801/index.html?quiet=1", { waitUntil: "networkidle0", timeout: 90000 });
  await page.waitForFunction(() => window.PrincessExplorer && window.PrincessExplorer.v53, { timeout: 30000 });
  await page.click("#start");
  await page.click("canvas");
  await new Promise((r) => setTimeout(r, 300));
  return page;
}
async function enterFromBridge(page) {
  await page.evaluate(() => {
    const PE = window.PrincessExplorer;
    if (PE.v3.castle.inCastle) PE.v3.castle.exitCastle();
    PE.teleport(0.2, 10.4);
    PE.face(0);
    PE.snapCamera && PE.snapCamera();
  });
  await page.evaluate(() => {
    const PE = window.PrincessExplorer;
    PE.teleport(0.2, 11.05);
    PE.face(0);
    PE.snapCamera && PE.snapCamera();
  });
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: path.join(shot, "v53-entry.png") });
  await page.keyboard.down("KeyZ");
  let entered = { inside: false, room: "", z: 0 };
  for (let i = 0; i < 28; i++) {
    await new Promise((r) => setTimeout(r, 100));
    entered = await page.evaluate(() => ({
      inside: window.PrincessExplorer.v3.castle.inCastle,
      room: window.PrincessExplorer.v53.room(),
      z: +window.PrincessExplorer.princess.position.z.toFixed(2)
    }));
    if (entered.inside) break;
  }
  await page.keyboard.up("KeyZ");
  await new Promise((r) => setTimeout(r, 250));
  return page.evaluate(() => ({
    inside: window.PrincessExplorer.v3.castle.inCastle,
    room: window.PrincessExplorer.v53.room()
  }));
}

const fresh = await boot({ score: 80, ver: 3, v45: { layout: 1, care: { owned: { studio: 1 }, spent: 45 }, spend: { care: 45 } }, v47: { skills: {}, playMs: 0, quiet: true, daily: { streak: 0 }, due: [], ready: {}, passed: {} } });
const entered = await enterFromBridge(fresh);
check("walking off the drawbridge enters the hall", entered.inside && (entered.room === "hall" || entered.room === "stair" || entered.room === "throne"), JSON.stringify(entered));

await fresh.keyboard.down("KeyW");
let walked = null;
for (let i = 0; i < 36; i++) {
  await new Promise((r) => setTimeout(r, 100));
  walked = await fresh.evaluate(() => {
    const PE = window.PrincessExplorer;
    const ic = PE.v3.castle.IC;
    const p = PE.princess.position;
    return { foot: PE.v53.atFoot(), room: PE.v53.room(), x: +(p.x - ic.x).toFixed(2), z: +(p.z - ic.z).toFixed(2), y: +p.y.toFixed(2) };
  });
  if (walked.foot) break;
}
await fresh.keyboard.up("KeyW");
await fresh.keyboard.press("e");
await new Promise((r) => setTimeout(r, 300));
const ask = await fresh.evaluate(() => {
  const bar = document.getElementById("prompt");
  const s = window.PrincessExplorer.state();
  return { open: window.PrincessExplorer.learn.ui.open(), note: (document.getElementById("prompt-text") || {}).textContent || "", shown: bar && !bar.classList.contains("hidden"), score: s.score, upper: !!(s.v45 && s.v45.care.owned.upper), walked: null };
});
ask.walked = walked;
check("E at the stair asks to spend 40 and does not open a quiz", !ask.open && ask.shown && /40/.test(ask.note) && /press e/i.test(ask.note) && ask.score === 80 && !ask.upper, JSON.stringify(ask));
await fresh.keyboard.press("e");
await new Promise((r) => setTimeout(r, 300));
const paid = await fresh.evaluate(() => {
  const s = window.PrincessExplorer.state();
  return { open: window.PrincessExplorer.learn.ui.open(), score: s.score, upper: !!s.v45.care.owned.upper };
});
check("a second E spends 40 once and opens the stair", !paid.open && paid.upper && paid.score === 40, JSON.stringify(paid));
await fresh.keyboard.press("e");
await new Promise((r) => setTimeout(r, 200));
const stay = await fresh.evaluate(() => window.PrincessExplorer.state().score);
check("another E at the stair does not charge again", stay === 40, String(stay));

async function pick(page, index) {
  await page.evaluate((index) => {
    const btn = document.querySelector(`#learn-card button[data-choice="${index}"]`);
    if (btn) btn.click();
  }, index);
}
await fresh.evaluate(() => {
  const PE = window.PrincessExplorer;
  const ic = PE.v3.castle.IC;
  PE.princess.position.set(ic.x + 13.8, 0, ic.z + 8.3);
});
await new Promise((r) => setTimeout(r, 250));
await fresh.keyboard.press("e");
await new Promise((r) => setTimeout(r, 400));
const gate = await fresh.evaluate(() => {
  const L = window.PrincessExplorer.learn;
  const q = L.gate.current();
  const card = document.getElementById("learn-card");
  return { open: L.ui.open(), total: document.querySelectorAll("#learn-card button[data-choice]").length, of3: !!(card && /of 3/.test(card.innerText)), prompt: q && q.prompt, answer: q && q.answer, score: window.PrincessExplorer.state().score };
});
check("E on the green book opens a 3-question passage quiz", gate.open && gate.total === 4 && gate.of3 && gate.score === 40, JSON.stringify(gate));
await fresh.screenshot({ path: path.join(shot, "v53-bookcase-quiz.png") });
const before = gate.score;
await pick(fresh, gate.answer === 0 ? 1 : 0);
await new Promise((r) => setTimeout(r, 200));
const tutor = await fresh.evaluate(() => {
  const st = window.PrincessExplorer.learn.tutorial.state();
  return { phase: st && st.phase, score: window.PrincessExplorer.state().score };
});
check("a miss opens the lesson and does not spend coins yet", tutor.phase === "teach" && tutor.score === before, JSON.stringify(tutor));
for (let i = 0; i < 4; i++) {
  const phase = await fresh.evaluate(() => {
    const st = window.PrincessExplorer.learn.tutorial.state();
    if (st && st.phase === "teach") window.PrincessExplorer.learn.tutorial.next();
    return window.PrincessExplorer.learn.tutorial.state();
  });
  if (phase && phase.phase === "practice") break;
}
const practiceScore = await fresh.evaluate(() => {
  const card = document.getElementById("learn-card");
  const btn = card && card.querySelector("button[data-tutor]");
  const before = window.PrincessExplorer.state().score;
  if (btn) btn.click();
  return { before, after: window.PrincessExplorer.state().score, open: window.PrincessExplorer.learn.ui.open() };
});
check("practice does not change coins", practiceScore.after === practiceScore.before, JSON.stringify(practiceScore));
let guard = 0;
while (guard < 4) {
  const q = await fresh.evaluate(() => {
    const cur = window.PrincessExplorer.learn.gate.current();
    return cur ? { answer: cur.answer, open: window.PrincessExplorer.learn.ui.open() } : { open: false };
  });
  if (!q.open) break;
  await pick(fresh, q.answer);
  await new Promise((r) => setTimeout(r, 250));
  guard++;
}
const opened = await fresh.evaluate(() => {
  const s = window.PrincessExplorer.state();
  return { score: s.score, secret: window.PrincessExplorer.v53.secret(), room: window.PrincessExplorer.v53.room(), upper: !!s.v45.care.owned.upper };
});
check("three right answers open the passage and do not spend coins", opened.secret && (opened.room === "tunnel" || opened.room === "library") && opened.score === 40 && opened.upper, JSON.stringify(opened));

await fresh.evaluate(() => window.PrincessExplorer.save());
const keptRaw = await fresh.evaluate(() => localStorage.getItem("princess-explorer-save-v1"));
const again = await boot(JSON.parse(keptRaw));
await enterFromBridge(again);
await hold(again, "KeyW", 450);
await again.keyboard.press("e");
await new Promise((r) => setTimeout(r, 250));
const free = await again.evaluate(() => {
  const s = window.PrincessExplorer.state();
  const bar = document.getElementById("prompt");
  return { score: s.score, upper: !!s.v45.care.owned.upper, open: window.PrincessExplorer.learn.ui.open(), spend: bar && !bar.classList.contains("hidden") && /spend 40/i.test((document.getElementById("prompt-text") || {}).textContent || ""), secret: !!(s.v53 && s.v53.secret) };
});
check("after reload the stair is free and the passage stays open", free.score === 40 && free.upper && !free.open && !free.spend && free.secret, JSON.stringify(free));
await again.evaluate(() => {
  const PE = window.PrincessExplorer;
  const ic = PE.v3.castle.IC;
  PE.princess.position.set(ic.x + 14.2, 0, ic.z + 8.2);
});
await new Promise((r) => setTimeout(r, 200));
await again.keyboard.press("e");
await new Promise((r) => setTimeout(r, 300));
const againBook = await again.evaluate(() => ({
  open: window.PrincessExplorer.learn.ui.open(),
  secret: window.PrincessExplorer.v53.secret(),
  room: window.PrincessExplorer.v53.room(),
  score: window.PrincessExplorer.state().score
}));
check("the bookcase stays open after reload and does not quiz again", !againBook.open && againBook.secret && againBook.score === 40, JSON.stringify(againBook));
await again.close();
await fresh.evaluate(() => {
  const PE = window.PrincessExplorer;
  const ic = PE.v3.castle.IC;
  PE.princess.position.set(ic.x + 13.8, 0, ic.z + 8.3);
  PE.snapCamera && PE.snapCamera();
});
await new Promise((r) => setTimeout(r, 400));
await fresh.screenshot({ path: path.join(shot, "v53-bookcase.png") });

const calls = await fresh.evaluate(() => window.PrincessExplorer.renderer.info.render.calls);
console.log("DRAW_CALLS", calls);
check("indoor frame stays within the draw budget", calls > 0 && calls < 310, String(calls));

const terrace = await fresh.evaluate(() => {
  const s = window.PrincessExplorer.state();
  s.score = 200;
  const res = window.PrincessExplorer.care.commit("terrace");
  return { ok: res.ok, price: res.price, score: window.PrincessExplorer.state().score };
});
check("terrace still costs 40", terrace.ok && terrace.price === 40 && terrace.score === 160, JSON.stringify(terrace));
const spots = [
  ["v53-hall", 0, 0, 10.2],
  ["v53-stair", 0, 0.4, 10.5],
  ["v53-ballroom", -12, 0, 5.6],
  ["v53-dining", 13.8, 0, 8.3],
  ["v53-tunnel", 22, -2.2, 8.1],
  ["v53-library", 34.5, -2.2, 7.4],
  ["v53-landing", 0, 4.2, 6.2],
  ["v53-bedroom", -9.5, 4.2, 7.5],
  ["v53-studio", 12, 4.2, 8],
  ["v53-veranda", 1.7, 4.2, 19.15],
  ["v53-veranda-side", 2.4, 4.2, 18.9]
];
for (const k of ["KeyW", "KeyA", "KeyS", "KeyZ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]) await fresh.keyboard.up(k);
for (const [name, x, y, z] of spots) {
  await fresh.evaluate((x, y, z, name) => {
    const PE = window.PrincessExplorer;
    const ic = PE.v3.castle.IC;
    PE.v53.angle = name === "v53-veranda-side" ? 1 : 0;
    PE.v53.lock = { x: ic.x + x, y: y, z: ic.z + z };
    PE.princess.position.set(ic.x + x, y, ic.z + z);
    PE.snapCamera && PE.snapCamera();
  }, x, y, z, name);
  await new Promise((r) => setTimeout(r, name.indexOf("veranda") >= 0 ? 1300 : 450));
  await fresh.screenshot({ path: path.join(shot, name + ".png") });
  const clear = await fresh.evaluate((x, y, z) => {
    const fit = window.PrincessExplorer.v53.clearOfFurniture(x, y, z);
    const view = window.PrincessExplorer.v53.viewClear();
    return { view: view, fit: fit };
  }, x, y, z);
  check(name + " camera stays out of her and the walls", clear.view.ok, JSON.stringify(clear.view));
  check(name + " stands clear of the furniture", clear.fit.ok, JSON.stringify(clear.fit));
  if (name === "v53-veranda" || name === "v53-veranda-side") {
    const sky = JSON.parse(execFileSync("python3", ["-c", "import json\nfrom PIL import Image\nim=Image.open(r'''" + path.join(shot, name + ".png") + "''').convert('RGB')\nw,h=im.size\npts={'tl':(int(w*0.12),int(h*0.2)),'tc':(int(w*0.5),int(h*0.16)),'tr':(int(w*0.84),int(h*0.2)),'mid':(int(w*0.5),int(h*0.42))}\nprint(json.dumps({k:list(im.getpixel(v)) for k,v in pts.items()}))\n"], { encoding: "utf8" }));
    const dark = (rgb) => rgb[0] + rgb[1] + rgb[2] < 140 || (rgb[2] > rgb[0] + 20 && rgb[0] < 100);
    check(name + " sky is daylight", !dark(sky.tl) && !dark(sky.tc) && !dark(sky.tr) && !dark(sky.mid), JSON.stringify(sky));
  }
}
await fresh.setViewport({ width: 390, height: 844 });
await fresh.evaluate(() => {
  const PE = window.PrincessExplorer;
  const intro = document.getElementById("intro");
  if (intro) intro.classList.add("hidden");
  const ic = PE.v3.castle.IC;
  PE.v53.lock = null;
  PE.v53.angle = 0;
  PE.princess.position.set(ic.x, 0, ic.z + 9.2);
  PE.snapCamera && PE.snapCamera();
  window.dispatchEvent(new Event("resize"));
});
await new Promise((r) => setTimeout(r, 500));
await fresh.screenshot({ path: path.join(shot, "v53-phone.png") });
await fresh.setViewport({ width: 1024, height: 768 });
const fps = await fresh.evaluate(() => new Promise((resolve) => {
  let n = 0;
  const t0 = performance.now();
  function loop() {
    n++;
    if (performance.now() - t0 < 1000) requestAnimationFrame(loop);
    else resolve(n);
  }
  requestAnimationFrame(loop);
}));
console.log("TABLET_FPS", fps);
console.log("TABLET_FPS is the headless software renderer after the phone resize");
await fresh.close();

const save51 = {
  score: 90,
  shop: { owned: { "hat-sun": true }, equip: { hat: "hat-sun" } },
  ver: 3,
  v45: { layout: 1, care: { owned: { terrace: 1, studio: 1 }, spent: 85 }, spend: { care: 85 } },
  v47: { skills: { reading: { c: 2, w: 0, n: 2 } }, playMs: 1000, quiet: true, daily: { streak: 1 }, due: [], ready: {}, passed: {} }
};
const old = await boot(save51);
const kept = await old.evaluate(() => {
  const s = window.PrincessExplorer.state();
  return { score: s.score, hat: s.shop.equip.hat, terrace: s.v45.care.owned.terrace, studio: s.v45.care.owned.studio, spent: s.v45.care.spent, upper: s.v45.care.owned.upper || 0 };
});
check("a 5.1 save keeps coins, hat, and purchases", kept.score === 90 && kept.hat === "hat-sun" && kept.terrace === 1 && kept.studio === 1 && kept.spent === 85 && !kept.upper, JSON.stringify(kept));
const prices = await old.evaluate(() => {
  const s = window.PrincessExplorer.state();
  s.score = 200;
  const nook = window.PrincessExplorer.care.commit("nook");
  const stage = window.PrincessExplorer.care.commit("stage");
  const studio = window.PrincessExplorer.care.commit("studio");
  return { nook: nook.price, stage: stage.price, studio: studio.reason, score: s.score };
});
check("nook is 35 and stage is 35 and studio is not bought again", prices.nook === 35 && prices.stage === 35 && prices.studio === "owned" && prices.score === 130, JSON.stringify(prices));
await old.close();

const save52 = {
  score: 70,
  shop: { owned: { "hat-sun": true }, equip: { hat: "hat-sun" } },
  ver: 3,
  v45: { layout: 1, care: { owned: { terrace: 1 }, spent: 40 }, spend: { care: 40 } },
  v47: { skills: { reading: { c: 1, w: 0, n: 1 } }, playMs: 400, quiet: true, daily: { streak: 0 }, due: [], ready: {}, passed: {} },
  v52: { garden: [{ st: "bloom", grow: 1, water: 0.5 }] }
};
const mid = await boot(save52);
const kept52 = await mid.evaluate(() => {
  const s = window.PrincessExplorer.state();
  const g = s.v52 && s.v52.garden && s.v52.garden[0];
  return { score: s.score, hat: s.shop.equip.hat, terrace: s.v45.care.owned.terrace, upper: s.v45.care.owned.upper || 0, flower: g && g.st };
});
check("a 5.2 save keeps coins, the terrace, and the garden", kept52.score === 70 && kept52.hat === "hat-sun" && kept52.terrace === 1 && !kept52.upper && kept52.flower === "bloom", JSON.stringify(kept52));
await mid.close();
if (fresh._err || old._err) console.log("PAGE", fresh._err || old._err);

const failed = failures.filter((f) => !f.ok);
console.log(`\n${failures.length - failed.length} passed, ${failed.length} failed`);
await browser.close();
server.close();
process.exit(failed.length ? 1 : 0);

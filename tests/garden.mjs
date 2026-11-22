/**
 * Royal Garden mini-game: entry, three gate questions, the lesson after a miss,
 * planting that survives a reload, and the card on desktop and phone.
 * Run: node tests/garden.mjs
 */
import { createRequire } from "module";
import http from "http";
import fs from "fs";
import path from "path";

const require = createRequire(import.meta.url);
const puppeteer = require("/tmp/pe-tools/node_modules/puppeteer-core");
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const shotDir = "/opt/cursor/artifacts";
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
  const type = ext === ".html" ? "text/html" : ext === ".js" ? "text/javascript" : "application/octet-stream";
  res.writeHead(200, { "content-type": type });
  fs.createReadStream(full).pipe(res);
});
await new Promise((r) => server.listen(8794, "127.0.0.1", r));

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: "new",
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist", "--no-sandbox", "--disable-dev-shm-usage"],
});

async function shot(page, name) {
  if (!fs.existsSync(shotDir)) return;
  await page.screenshot({ path: path.join(shotDir, name + ".png") });
}

async function hold(page, key, ms) {
  await page.keyboard.down(key);
  await new Promise((r) => setTimeout(r, ms));
  await page.keyboard.up(key);
  await new Promise((r) => setTimeout(r, 40));
}

async function openPage(viewport, save) {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (err) => errors.push(String(err.message || err)));
  page.on("console", (msg) => { if (msg.type() === "error" && !/Failed to load|favicon/i.test(msg.text())) errors.push(msg.text()); });
  await page.setViewport(viewport);
  page._errors = errors;
  if (save) {
    await page.evaluateOnNewDocument((payload) => {
      localStorage.setItem("princess-explorer-save-v1", JSON.stringify(payload));
    }, save);
  }
  await page.goto("http://127.0.0.1:8794/index.html?debug=castle&quiet=1", { waitUntil: "networkidle0", timeout: 90000 });
  await page.waitForFunction(() => window.PrincessExplorer && window.PrincessExplorer.v52 && window.PrincessExplorer.v35, { timeout: 30000 });
  await page.click("#start");
  await new Promise((r) => setTimeout(r, 250));
  return page;
}

function inside(parent, child, pad = 6) {
  if (!parent || !child) return false;
  return child.x >= parent.x - pad && child.y >= parent.y - pad && child.x + child.w <= parent.x + parent.w + pad && child.y + child.h <= parent.y + parent.h + pad && child.w > 8 && child.h > 8;
}

async function boxes(page) {
  return page.evaluate(() => {
    function box(id) {
      const el = document.getElementById(id);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const st = getComputedStyle(el);
      return {
        x: r.x, y: r.y, w: r.width, h: r.height,
        shown: st.display !== "none" && st.visibility !== "hidden" && !el.classList.contains("hidden") && r.width > 2
      };
    }
    const card = box("a35-card");
    const go = box("a35-go");
    const back = box("a35-back");
    const pad = box("a35-pad");
    const hud = box("a35-hud");
    const x = box("a35-x");
    const learn = box("learn-card");
    const buttons = [...document.querySelectorAll("#a35-pad button, #learn-card button")].map((b) => {
      const r = b.getBoundingClientRect();
      const st = getComputedStyle(b);
      if (st.display === "none" || r.width < 2) return null;
      return {
        t: (b.innerText || "").replace(/\s+/g, " ").slice(0, 24),
        off: r.left < -2 || r.top < -2 || r.right > innerWidth + 2 || r.bottom > innerHeight + 2
      };
    }).filter(Boolean);
    return { card, go, back, pad, hud, x, learn, buttons, vw: innerWidth, vh: innerHeight };
  });
}

const save51 = {
  score: 80,
  streak: 2,
  bestStreak: 4,
  shop: { owned: { "hat-sun": true }, equip: { hat: "hat-sun" } },
  petName: "Sir Biscuit",
  pos: { x: 6, z: 8 },
  ver: 3,
  v45: { layout: 1, moat: 1, stream: 1, care: { owned: { terrace: 1 }, spent: 40 }, spend: { care: 40 } },
  v47: { skills: { measure: { c: 2, w: 1, n: 3 } }, playMs: 60000, quiet: true, daily: { streak: 1, day: "2026-11-20", done: false, paid: 0 }, due: [], ready: {}, passed: {} }
};

const desk = await openPage({ width: 1280, height: 720 });
await desk.evaluate(() => {
  const PE = window.PrincessExplorer;
  if (PE.v3.castle.inCastle) PE.v3.castle.exitCastle();
  PE.v35.open("garden");
});
let ui = await boxes(desk);
check("desktop play and back stay inside the garden card", inside(ui.card, ui.go) && inside(ui.card, ui.back) && ui.go.shown, JSON.stringify({ go: ui.go, back: ui.back, card: ui.card }));
await shot(desk, "garden-after-desk-entry");

await desk.evaluate(() => {
  const PE = window.PrincessExplorer;
  PE.learn.onWrong({
    skill: "comparing",
    prompt: "Which number is the GREATEST?",
    explain: "933 is the greatest.",
    choices: ["933", "393", "149", "339"],
    answer: 0
  });
});
await shot(desk, "garden-after-desk-tutor");
const lesson = await desk.evaluate(() => {
  const PE = window.PrincessExplorer;
  const before = PE.state().score;
  const card = document.getElementById("a35-card");
  const learn = document.getElementById("learn-card");
  const hidden = card ? getComputedStyle(card).visibility === "hidden" : false;
  const text = learn ? learn.innerText : "";
  const state = PE.learn.tutorial.state();
  let steps = 0;
  while (PE.learn.tutorial.state() && PE.learn.tutorial.state().phase === "teach" && steps < 6) {
    PE.learn.tutorial.next();
    steps++;
  }
  const practice = document.getElementById("learn-card").innerText;
  const btn = document.getElementById("learn-card").querySelector("button[data-tutor]");
  if (btn) btn.click();
  return {
    hidden, text: text.slice(0, 180), skill: state && state.skill, steps,
    practice: practice.slice(0, 220),
    delta: PE.state().score - before,
    still: PE.learn.tutorial.state()
  };
});
check("a comparing miss teaches place value and hides the gate", lesson.hidden && lesson.skill === "skip" && /hundreds/.test(lesson.text) && /greater/i.test(lesson.practice), JSON.stringify(lesson));
check("the practice question does not change coins", lesson.delta === 0 && !lesson.still, JSON.stringify(lesson));
await shot(desk, "garden-after-desk-practice");

const groups = await desk.evaluate(() => {
  const PE = window.PrincessExplorer;
  const before = PE.state().score;
  PE.learn.onWrong({
    skill: "equal groups",
    prompt: "3 groups of 4 flowers. How many flowers?",
    explain: "3 groups of 4 is 12.",
    choices: ["12", "7", "34", "1"],
    answer: 0
  });
  const text = document.getElementById("learn-card").innerText;
  const skill = PE.learn.tutorial.state().skill;
  let n = 0;
  while (PE.learn.tutorial.state() && PE.learn.tutorial.state().phase === "teach" && n < 6) { PE.learn.tutorial.next(); n++; }
  const practice = document.getElementById("learn-card").innerText;
  const btn = document.getElementById("learn-card").querySelector("button[data-tutor]");
  if (btn) btn.click();
  return { skill, text: text.slice(0, 160), practice: practice.slice(0, 180), delta: PE.state().score - before };
});
check("an equal-groups miss teaches groups and practices one like it", groups.skill === "groups" && /group/i.test(groups.text) && /each|group/i.test(groups.practice) && groups.delta === 0, JSON.stringify(groups));

await desk.evaluate(() => document.getElementById("a35-go").click());
const gated = await desk.evaluate(() => {
  const PE = window.PrincessExplorer;
  const before = PE.state().score;
  const asked = [];
  let guard = 0;
  while (PE.v35.phase === "quiz" && guard < 8) {
    if (PE.v35.gate.state !== "ask") { PE.v35.gate.next(); guard++; continue; }
    const q = PE.v35.gate.q;
    asked.push({ prompt: q.prompt, topic: q.topic, n: (q.choices || []).length });
    PE.v35.gate.answer(q.answer_index);
    guard++;
  }
  return { asked, phase: PE.v35.phase, delta: PE.state().score - before };
});
check("the garden gate asks exactly 3 questions and pays 20 coins", gated.asked.length === 3 && gated.asked.every((q) => q.n === 4) && gated.phase !== "quiz" && gated.delta === 20, JSON.stringify(gated));
await desk.evaluate(() => {
  const PE = window.PrincessExplorer;
  for (let i = 0; i < 80 && PE.v35.phase !== "play"; i++) PE.v35.step(0.1);
});
await new Promise((r) => setTimeout(r, 200));
ui = await boxes(desk);
const padOff = ui.buttons.filter((b) => b.off);
check("desktop play controls stay on screen", ui.pad.shown && ui.x.shown && padOff.length === 0 && ui.hud.y >= 0 && ui.hud.y + ui.hud.h < ui.vh, JSON.stringify({ hud: ui.hud, x: ui.x, padOff }));
await shot(desk, "garden-after-desk-play");

let planted = { used: "", plant: 0, pos: null };
for (const key of ["KeyW", "KeyZ", "KeyS", "KeyA"]) {
  await hold(desk, key, 500);
  await desk.keyboard.press("KeyE");
  await desk.keyboard.press("Space");
  const buttons = await desk.$$("#a35-pad button");
  for (const button of buttons) {
    const label = await desk.evaluate((el) => el.innerText || "", button);
    if (/action/i.test(label)) await button.click();
  }
  planted = await desk.evaluate((used) => {
    const PE = window.PrincessExplorer;
    return { used, pos: { x: +PE.v35.K.P.x.toFixed(2), z: +PE.v35.K.P.z.toFixed(2) }, plant: PE.v35.g.stats.plant || 0 };
  }, key);
  if (planted.plant >= 1) break;
}
check("walking and Action plant a seed", planted.plant >= 1, JSON.stringify(planted));

const grown = await desk.evaluate(() => {
  const PE = window.PrincessExplorer;
  const game = PE.v35.defs.garden;
  const st = PE.v35.g;
  const wallet = PE.state().score;
  const input = { held: {}, hit: {}, tap: null };
  for (let n = 0; n < 240 && !((st.stats.harvest || 0) >= 1 && st.plots.some((p) => p.st === "grow" || p.st === "bloom")); n++) {
    input.held = {}; input.hit = {};
    game.auto(st, input, PE.v35.K);
    game.update(st, 0.2, input, PE.v35.K);
  }
  const beds = PE.v52.gardenBeds();
  return {
    stats: st.stats,
    beds,
    walletSame: PE.state().score === wallet,
    saved: PE.state().v52 && PE.state().v52.garden
  };
});
check("plants grow and one harvest leaves the other beds in the save", grown.stats.plant >= 1 && grown.stats.water >= 1 && grown.stats.harvest >= 1 && grown.walletSame && grown.beds.some((b) => b.st === "grow" || b.st === "bloom") && JSON.stringify(grown.saved) === JSON.stringify(grown.beds), JSON.stringify(grown.stats));
await shot(desk, "garden-after-desk-grown");

const paid = await desk.evaluate(() => {
  const PE = window.PrincessExplorer;
  const before = PE.state().score;
  const beds = PE.v52.gardenBeds();
  PE.v35.finish();
  const info = PE.v35.endInfo;
  const raw = JSON.parse(localStorage.getItem("princess-explorer-save-v1") || "{}");
  return { before, after: PE.state().score, info, stored: raw.v52 && raw.v52.garden, beds };
});
check("finishing the garden pays at most 10 coins", paid.info && paid.info.coins <= 10 && paid.info.coins >= 0 && paid.after === paid.before + paid.info.coins, JSON.stringify(paid));

const wallet = paid.after;
const bedsBefore = paid.beds;
await desk.reload({ waitUntil: "networkidle0", timeout: 90000 });
await desk.waitForFunction(() => window.PrincessExplorer && window.PrincessExplorer.v35, { timeout: 30000 });
await desk.click("#start");
const restored = await desk.evaluate(() => {
  const PE = window.PrincessExplorer;
  if (PE.v3.castle.inCastle) PE.v3.castle.exitCastle();
  PE.v35.open("garden");
  PE.v35.start();
  return { beds: PE.v52.gardenBeds(), score: PE.state().score, phase: PE.v35.phase };
});
check("planted beds and coins survive a reload", JSON.stringify(restored.beds) === JSON.stringify(paid.stored) && restored.beds.some((b) => b.st === "grow" || b.st === "bloom") && restored.score === wallet, JSON.stringify({ stored: paid.stored, restored: restored.beds, score: restored.score }));
await shot(desk, "garden-after-desk-reload");
await desk.evaluate(() => window.PrincessExplorer.v35.close());
const left = await desk.evaluate(() => {
  const PE = window.PrincessExplorer;
  return { open: PE.v35.isOpen(), x: PE.princess.position.x };
});
check("exit leaves the garden and puts her back outside", left.open === false && left.x > -50, JSON.stringify(left));
check("desktop garden run has no page errors", desk._errors.length === 0, desk._errors.slice(0, 4).join(" | "));
await desk.close();

async function entryFits(page, label) {
  await page.evaluate(() => {
    const PE = window.PrincessExplorer;
    if (PE.v3.castle.inCastle) PE.v3.castle.exitCastle();
    PE.v35.open("garden");
  });
  const view = await boxes(page);
  check(label + " play button stays inside the card", inside(view.card, view.go) && inside(view.card, view.back), JSON.stringify({ go: view.go, card: view.card }));
  await shot(page, "garden-after-" + label + "-entry");
  await page.evaluate(() => {
    const PE = window.PrincessExplorer;
    if (PE.v35.phase === "ready") PE.v35.start();
    for (let i = 0; i < 80 && PE.v35.phase !== "play"; i++) PE.v35.step(0.1);
  });
  const play = await boxes(page);
  const off = play.buttons.filter((b) => b.off);
  const hudClear = !play.hud.shown || (play.x && play.hud.x + play.hud.w < play.x.x + 8);
  check(label + " pad and close button stay on screen", play.pad.shown && play.x.shown && off.length === 0 && play.x.x + play.x.w <= play.vw + 2 && hudClear, JSON.stringify({ hud: play.hud, x: play.x, off }));
  await shot(page, "garden-after-" + label + "-play");
  check(label + " has no page errors", page._errors.length === 0, page._errors.slice(0, 3).join(" | "));
  await page.close();
}

const phone = await openPage({ width: 390, height: 844, isMobile: true, hasTouch: true });
await entryFits(phone, "phone");
const land = await openPage({ width: 844, height: 390, isMobile: true, hasTouch: true });
await entryFits(land, "land");

const old = await openPage({ width: 1280, height: 720 });
await old.evaluate((payload) => localStorage.setItem("princess-explorer-save-v1", JSON.stringify(payload)), save51);
await old.reload({ waitUntil: "networkidle0", timeout: 90000 });
await old.waitForFunction(() => window.PrincessExplorer && window.PrincessExplorer.v52, { timeout: 30000 });
await old.click("#start");
const carried = await old.evaluate(() => {
  const PE = window.PrincessExplorer;
  const s = PE.state();
  if (PE.v3.castle.inCastle) PE.v3.castle.exitCastle();
  const before = s.score;
  PE.v35.open("garden");
  return {
    before,
    hat: s.shop.equip.hat,
    terrace: s.v45.care.owned.terrace,
    spent: s.v45.care.spent,
    skill: s.v47.skills.measure.c,
    beds: PE.v52.gardenBeds().every((b) => b.st === "empty")
  };
});
await old.evaluate(() => document.getElementById("a35-go").click());
const gate51 = await old.evaluate(() => {
  const PE = window.PrincessExplorer;
  let guard = 0;
  const asked = [];
  while (PE.v35.phase === "quiz" && guard < 8) {
    if (PE.v35.gate.state !== "ask") { PE.v35.gate.next(); guard++; continue; }
    asked.push(PE.v35.gate.q.prompt);
    PE.v35.gate.answer(PE.v35.gate.q.answer_index);
    guard++;
  }
  const s = PE.state();
  return { asked: asked.length, score: s.score, hat: s.shop.equip.hat, spent: s.v45.care.spent, skill: s.v47.skills.measure.c };
});
check("a 5.1 save keeps its hat, price, and skill, and the gate still pays 20", carried.hat === "hat-sun" && carried.spent === 40 && carried.skill === 2 && carried.beds && gate51.asked === 3 && gate51.score === carried.before + 20 && gate51.hat === "hat-sun" && gate51.spent === 40, JSON.stringify({ carried, gate51 }));
await old.evaluate(() => {
  const PE = window.PrincessExplorer;
  for (let i = 0; i < 80 && PE.v35.phase !== "play"; i++) PE.v35.step(0.1);
});
await old.evaluate(() => {
  const PE = window.PrincessExplorer;
  const game = PE.v35.defs.garden;
  const st = PE.v35.g;
  const input = { held: {}, hit: {}, tap: null };
  for (let n = 0; n < 30; n++) { input.held = {}; input.hit = {}; game.auto(st, input, PE.v35.K); game.update(st, 0.05, input, PE.v35.K); }
  game.update(st, 1, input, PE.v35.K);
});
const mid = await old.evaluate(() => window.PrincessExplorer.v52.gardenBeds());
await shot(old, "garden-after-save51");
await old.reload({ waitUntil: "networkidle0", timeout: 90000 });
await old.waitForFunction(() => window.PrincessExplorer && window.PrincessExplorer.v52, { timeout: 30000 });
await old.click("#start");
const again = await old.evaluate(() => {
  const PE = window.PrincessExplorer;
  if (PE.v3.castle.inCastle) PE.v3.castle.exitCastle();
  const s = PE.state();
  PE.v35.open("garden");
  PE.v35.start();
  return { beds: PE.v52.gardenBeds(), score: s.score, hat: s.shop.equip.hat, spent: s.v45.care.spent, skill: s.v47.skills.measure.c };
});
check("a 5.1 save keeps the new beds without resetting coins or the hat", JSON.stringify(again.beds) === JSON.stringify(mid) && again.score === 100 && again.hat === "hat-sun" && again.spent === 40 && again.skill === 2 && again.beds.some((b) => b.st !== "empty"), JSON.stringify(again));
check("5.1 garden run has no page errors", old._errors.length === 0, old._errors.slice(0, 4).join(" | "));
await old.close();

const failed = failures.filter((f) => !f.ok);
console.log(`\n${failures.length - failed.length} passed, ${failed.length} failed`);
await browser.close();
server.close();
process.exit(failed.length ? 1 : 0);

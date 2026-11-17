/**
 * v4.7 Learn & Build, plus the shorter existing sets.
 * Run: node tests/v47.mjs
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

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const bank = JSON.parse(html.match(/<script type="application\/json" id="question-bank">([\s\S]*?)<\/script>/)[1]);
const sets = [];
for (const loc of bank.locations) {
  for (const reading of loc.readings || []) sets.push([loc.id + " reading", reading.questions.length, reading.questions.map((q) => q.id)]);
  sets.push([loc.id + " math", loc.math.length, loc.math.map((q) => q.id)]);
}
check("every existing problem set has at least 3 questions", sets.every((row) => row[1] >= 3), sets.filter((row) => row[1] < 3).map((row) => row[0]).join(",") || sets.map((row) => row[0] + ":" + row[1]).join(" "));
const fence = sets.find((row) => row[0] === "fencing math");
check("a set of 3 stays at 3", fence && fence[1] === 3 && fence[2].join(",") === "math-01-pat,math-fence-mult,math-fence-len", JSON.stringify(fence));
check("sets longer than 3 were trimmed and still at least 3", sets.filter((row) => ["castle reading", "tennis math", "meadow math"].includes(row[0])).every((row) => row[1] >= 3 && row[1] < 7), sets.map((row) => row[0] + ":" + row[1]).join(" "));
check("the 3-question math gate keeps its 20 coins", html.includes("PAY:[6,7,7],TOTAL:20") && html.includes("solve 3 math problems in a row"));
check("the castle door still asks for 3 in a row", html.includes("g>=3") && html.includes("3 in a row"));
check("a shortened station visit pays less", html.includes("buildSet(lt.locId,4)") && html.includes("POINTS_FIRST_TRY:8") && html.includes("POINTS_SECOND_TRY:4") && html.includes("STREAK_BONUS:4"));
check("shortened study sets pay less and sets of 3 were not the reason", html.includes("COACH_N:4") && html.includes("VOCAB_N:5") && html.includes("TIMED_N:6") && html.includes("COACH_DAY:24") && html.includes("VOCAB_DAY:20") && html.includes("TIMED_DAY:9"));

const server = http.createServer((req, res) => {
  const file = req.url.split("?")[0] === "/" ? "/index.html" : req.url.split("?")[0];
  const full = path.join(root, decodeURIComponent(file));
  if (!full.startsWith(root) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const ext = path.extname(full);
  const type = ext === ".js" ? "text/javascript" : "text/html";
  res.writeHead(200, { "content-type": type });
  fs.createReadStream(full).pipe(res);
});
await new Promise((r) => server.listen(8774, "127.0.0.1", r));
const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: "new",
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist", "--no-sandbox", "--disable-dev-shm-usage"],
});
const errors = [];
async function open(save) {
  const page = await browser.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  if (save) await page.evaluateOnNewDocument((payload) => localStorage.setItem("princess-explorer-save-v1", JSON.stringify(payload)), save);
  await page.setViewport({ width: 1280, height: 720 });
  await page.goto("http://127.0.0.1:8774/index.html?debug=castle&quiet=1", { waitUntil: "networkidle0", timeout: 60000 });
  await page.waitForFunction(() => window.PrincessExplorer && window.PrincessExplorer.learn, { timeout: 30000 });
  await page.evaluate(() => document.getElementById("intro")?.classList.add("hidden"));
  return page;
}

const old = { score: 88, streak: 2, bestStreak: 4, badges: { fencing: true }, shop: { owned: { "hat-sun": true }, equip: { hat: "hat-sun" } }, petName: "Sir Biscuit", pos: { x: 1, z: 2 }, ver: 3 };
const page = await open(old);
const migrated = await page.evaluate(() => {
  const s = window.PrincessExplorer.state();
  const L = window.PrincessExplorer.learn;
  return { score: s.score, hat: s.shop.equip.hat, pet: s.petName, badge: s.badges.fencing, v47: !!s.v47, skills: s.v47.skills, play: s.v47.playMs, streak: s.v47.daily.streak };
});
check("an old save keeps coins, stars, and items, and new fields default", migrated.score === 88 && migrated.hat === "hat-sun" && migrated.pet === "Sir Biscuit" && migrated.badge && migrated.v47 && migrated.play < 60000 && migrated.streak === 0, JSON.stringify(migrated));

const gate = await page.evaluate(() => {
  const PE = window.PrincessExplorer;
  const L = PE.learn;
  PE.state().score = 200;
  const opened = L.openGate("terrace");
  const total = opened.total;
  const q = L.gate.current();
  const wrong = L.answer(q.answer === 0 ? 1 : 0);
  const tutor = L.tutorial.state();
  const skipEarly = L.tutorial.skip();
  L.tutorial.next();
  const skip = L.tutorial.skip();
  const after = L.tutorial.state();
  const before = PE.care.coins();
  const practice = L.gate.answer(0);
  const coins = PE.care.coins();
  return { opened, total, wrong, tutorSteps: tutor && tutor.steps, skipEarly, skip, phase: after && after.phase, skill: tutor && tutor.skill, before, coins, index: L.gate.index(), misses: L.gate.misses() };
});
check("a build gate stays between 3 and 5 questions", gate.opened.ok && gate.total >= 3 && gate.total <= 5, JSON.stringify({ total: gate.total }));
check("a miss shows a tutorial and does not restart or charge", gate.wrong.right === false && gate.wrong.restart === false && gate.wrong.index === 0 && gate.tutorSteps >= 2 && gate.tutorSteps <= 4 && gate.skipEarly.ok === false && gate.skip.ok === true && gate.phase === "practice" && gate.coins === 200 && gate.misses === 1, JSON.stringify(gate));

const finished = await page.evaluate(() => {
  const L = window.PrincessExplorer.learn;
  const log = [];
  while (L.gate.current()) {
    const q = L.gate.current();
    const res = L.answer(q.answer);
    log.push({ right: res.right, done: res.done, refund: res.refund, score: res.score });
    if (res.tutorial) L.tutorial.skip() && L.gate.answer(L.tutorial.state() ? 0 : 0);
    if (res.done || log.length > 8) break;
  }
  return { log, score: window.PrincessExplorer.care.coins(), built: window.PrincessExplorer.care.built("terrace") };
});
check("a missed gate still builds and does not refund", finished.built && finished.score === 160, JSON.stringify(finished));

const clean = await page.evaluate(() => {
  const PE = window.PrincessExplorer;
  const L = PE.learn;
  const opened = L.openGate("maze");
  let res = { score: PE.care.coins() };
  let guard = 0;
  while (L.gate.current() && guard < 8) {
    res = L.answer(L.gate.current().answer);
    guard++;
  }
  return { total: opened.total, res, score: PE.care.coins(), built: PE.care.built("maze") };
});
check("all correct on the first try refunds 1 coin", clean.built && clean.res.refund === 1 && clean.score === 160 - 35 + 1, JSON.stringify(clean));

const daily = await page.evaluate(() => {
  const L = window.PrincessExplorer.learn;
  L.setDate("2026-11-16");
  const before = window.PrincessExplorer.care.coins();
  const start = L.startDaily();
  let guard = 0;
  let last = null;
  while (L.daily.current() && guard < 6) {
    last = L.answer(L.daily.current().answer);
    guard++;
  }
  const again = L.startDaily();
  L.setDate("2026-11-17");
  const next = L.startDaily();
  let guard2 = 0;
  let second = null;
  while (L.daily.current() && guard2 < 6) {
    second = L.answer(L.daily.current().answer);
    guard2++;
  }
  L.setDate("2026-11-18");
  const thirdStart = L.startDaily();
  let guard3 = 0;
  let third = null;
  while (L.daily.current() && guard3 < 6) {
    third = L.answer(L.daily.current().answer);
    guard3++;
  }
  return { count: start.total, skills: start.skills, pay: last && last.pay, again: again.reason, second: second && second.pay, third: third && third.pay, streak: third && third.streak, before };
});
check("Daily Three stays at 3 and the streak bonus is capped", daily.count === 3 && daily.pay === 2 && daily.again === "done" && daily.second === 2 && daily.third === 3 && daily.streak === 3, JSON.stringify(daily));

const review = await page.evaluate(() => {
  const L = window.PrincessExplorer.learn;
  L.setDate("2026-11-16");
  L.record("money", false);
  const due = L.due().filter((d) => d.skill === "money").map((d) => d.at);
  L.setDate("2026-11-19");
  const day = L.startDaily();
  return { due, first: day.skills && day.skills[0], reason: day.reason };
});
check("a missed skill is queued for 1, 3, and 7 days and comes back in Daily Three", review.due.length === 3 && review.due[1] - review.due[0] === 2 && review.due[2] - review.due[1] === 4 && (review.first === "money" || review.first === "measure"), JSON.stringify(review));

const parent = await page.evaluate(() => {
  const L = window.PrincessExplorer.learn;
  L.record("fractions", false);
  L.record("fractions", false);
  const early = L.hold(2000);
  L.addPlay(120000);
  const open = L.hold(1000);
  return { early: early.reason, weak: open.card.weak, rows: open.card.rows, play: open.card.playMs, streak: open.card.streak };
});
check("the progress card needs a 3 second hold and shows weakest skills", parent.early === "hold" && parent.weak.length >= 1 && parent.weak.length <= 3 && parent.weak.every((w) => w.n >= 2 && w.acc < 80) && parent.play >= 120000 && parent.streak === 3, JSON.stringify(parent.weak));

const reading = await page.evaluate(() => {
  const L = window.PrincessExplorer.learn;
  L.setQuiet(true);
  const opened = L.onWrong({
    skill: "main_idea",
    prompt: "What is the story about?",
    explain: "Mina planted seeds and the seeds grew into flowers.",
    passage: "Mina planted seeds. The seeds grew into flowers.",
    choices: ["Mina's seeds grew into flowers.", "A boat race.", "A lost map.", "A quiet kitchen."],
    answer: 0
  });
  const state = L.tutorial.state();
  const quiet = L.quiet();
  return { steps: opened.steps, skill: state.skill, hit: state.hit, quiet, skip: L.tutorial.skip().ok };
});
check("a reading miss highlights a sentence and cannot skip the first step", reading.skill === "reading" && reading.steps >= 2 && reading.steps <= 4 && /flowers/.test(reading.hit) && reading.quiet && reading.skip === false, JSON.stringify(reading));

const mathShot = await page.evaluate(() => {
  document.getElementById("learn-exit")?.click();
  const L = window.PrincessExplorer.learn;
  L.onWrong({ skill: "money", prompt: "Change from 10 for a 4 coin bun?", explain: "10 minus 4 is 6.", choices: ["6", "4", "14", "40"], answer: 0 });
  return L.tutorial.state();
});
check("a math miss opens the shared coin tutorial", mathShot && mathShot.skill === "money" && mathShot.step === 0, JSON.stringify(mathShot));

const lore = await page.evaluate(() => {
  const stories = ["terrace", "stable", "studio", "nook", "tea", "maze", "training", "court", "observatory", "swans", "stage", "corgi"].map((id) => window.PrincessExplorer.learn.lore(id));
  return stories.map((s) => ({ id: s.id, words: s.words, ok: s.words >= 120 && s.words <= 180 && s.main.answer === 0 && s.infer.answer === 0 && s.main.choices.length === 4 && !s.main.choices.join(" ").includes("storm at sea") && !s.main.choices.join(" ").includes("castle is closed") }));
});
check("each build story is 120 to 180 words with two questions", lore.every((s) => s.ok), JSON.stringify(lore.filter((s) => !s.ok)));

const direct = await page.evaluate(() => {
  const before = window.PrincessExplorer.care.coins();
  const res = window.PrincessExplorer.care.commit("stable");
  return { before, score: res.score, drop: before - res.score, price: res.price };
});
check("direct commit still charges the old price", direct.drop === 50 && direct.price === 50, JSON.stringify(direct));

await page.screenshot({ path: "/opt/cursor/artifacts/v47-tutorial-math-desktop.png" });
await page.setViewport({ width: 390, height: 844 });
await page.screenshot({ path: "/opt/cursor/artifacts/v47-tutorial-math-phone.png" });
await page.setViewport({ width: 1280, height: 720 });
await page.evaluate(() => {
  document.getElementById("learn-exit")?.click();
  window.PrincessExplorer.learn.onWrong({
    skill: "reading",
    prompt: "What is the story about?",
    passage: "Mina planted seeds. The seeds grew into flowers.",
    choices: ["Mina's seeds grew into flowers.", "A boat.", "A map.", "A kitchen."],
    answer: 0
  });
});
await page.screenshot({ path: "/opt/cursor/artifacts/v47-tutorial-reading-desktop.png" });
await page.setViewport({ width: 390, height: 844 });
await page.screenshot({ path: "/opt/cursor/artifacts/v47-tutorial-reading-phone.png" });

const pageErrors = errors.filter((e) => !/Failed to load resource/.test(e));
check("no page errors", pageErrors.length === 0, pageErrors.slice(0, 3).join(" | "));
await browser.close();
server.close();
if (failures.some((f) => !f.ok)) process.exit(1);

/**
 * v4.7 second quality pass: activities, bank quality, exit, phone card, errors.
 * Run: node tests/v47-qc.mjs
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
const questions = [];
for (const loc of bank.locations) {
  for (const reading of loc.readings || []) questions.push(...reading.questions.map((q) => ({ set: loc.id + " reading", ...q })));
  for (const q of loc.math || []) questions.push({ set: loc.id + " math", ...q });
}
const bad = questions.filter((q) => {
  const choices = q.choices || [];
  const unique = new Set(choices);
  const answer = choices[q.answer_index];
  return choices.length < 4 || unique.size !== choices.length || answer == null || String(q.prompt || "").includes(String(answer));
});
check("station questions have 4 unique choices and do not print the answer", bad.length === 0, bad.slice(0, 3).map((q) => q.id).join(","));

const server = http.createServer((req, res) => {
  const file = req.url.split("?")[0] === "/" ? "/index.html" : req.url.split("?")[0];
  const full = path.join(root, decodeURIComponent(file));
  if (!full.startsWith(root) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, { "content-type": path.extname(full) === ".js" ? "text/javascript" : "text/html" });
  fs.createReadStream(full).pipe(res);
});
await new Promise((r) => server.listen(8785, "127.0.0.1", r));
const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: "new",
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist", "--no-sandbox", "--disable-dev-shm-usage"],
});
const errors = [];
const page = await browser.newPage();
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
await page.setViewport({ width: 1280, height: 720 });
await page.goto("http://127.0.0.1:8785/index.html?debug=castle&quiet=1", { waitUntil: "networkidle0", timeout: 60000 });
await page.waitForFunction(() => window.PrincessExplorer && window.PrincessExplorer.learn);
await page.evaluate(() => document.getElementById("intro")?.classList.add("hidden"));

const play = await page.evaluate(() => {
  const L = window.PrincessExplorer.learn;
  const PE = window.PrincessExplorer;
  L.setDate("2026-11-20");
  L.garden.plant("2026-11-16");
  L.play("garden");
  const gardenText = document.getElementById("learn-card").innerText;
  const grew = L.garden.now();
  L.nature.tap("frog");
  L.nature.tap("frog");
  L.nature.tap("fish");
  L.play("nature");
  const nq = L.nature.question();
  const creatures = ["frog", "fish", "flower"].map((k) => !!PE.scene.getObjectByName("v47-spot-" + k));
  L.art.add("square");
  L.play("art");
  const artText = document.getElementById("learn-card").innerText;
  L.play("biscuit");
  const dog = document.getElementById("learn-card").innerText.includes("treats");
  L.play("lore");
  const lore = L.lore("terrace");
  document.getElementById("learn-exit").click();
  PE.state().score = 80;
  L.openGate("nook");
  const q = L.gate.current();
  const wrong = L.answer(q.answer === 0 ? 1 : 0);
  const pausedBefore = L.ui.paused();
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  const exit = !!document.getElementById("learn-exit");
  const hudHidden = getComputedStyle(document.getElementById("hud")).visibility === "hidden";
  return {
    gardenGives: /sunflower is \d+ cm/.test(gardenText),
    gardenAsks: gardenText.includes("How tall is the sunflower?") && gardenText.includes("How much did it grow since Day 2?"),
    grew: grew.grew,
    nq: nq.choices.length,
    creatures,
    artAsks: artText.includes("How many corners") && artText.includes("lines of symmetry"),
    dog,
    loreWords: lore.words,
    loreDetail: lore.main.choices[1],
    tutorial: wrong.tutorial,
    pausedBefore,
    paused: L.ui.paused(),
    exit,
    hudHidden
  };
});
check("garden does not state the height and asks both questions", play.gardenAsks && !play.gardenGives && play.grew === 4, JSON.stringify({ grew: play.grew, gives: play.gardenGives }));
check("nature creatures exist and the data question has 4 choices", play.creatures.every(Boolean) && play.nq === 4, JSON.stringify(play.creatures));
check("art asks for corners and lines of symmetry", play.artAsks);
check("biscuit trick asks a two-step question", play.dog);
check("terrace story is full length and the distractor is a detail", play.loreWords >= 120 && play.loreWords <= 180 && /watering can/.test(play.loreDetail), play.loreDetail);
check("a wrong gate answer opens the tutorial", play.tutorial === true);
check("Escape pauses only after a lesson is open, and Exit stays up", play.pausedBefore === false && play.paused === true && play.exit && play.hudHidden);

await page.setViewport({ width: 390, height: 844 });
const phone = await page.evaluate(() => {
  document.body.classList.add("touch");
  const card = document.getElementById("learn-card").getBoundingClientRect();
  const hud = document.getElementById("hud").getBoundingClientRect();
  return { cardTop: card.top, cardBottom: card.bottom, view: window.innerHeight, hudH: hud.height };
});
check("the phone lesson card stays on screen", phone.cardTop >= 0 && phone.cardBottom <= phone.view + 2, JSON.stringify(phone));

const station = await page.evaluate(() => {
  const PE = window.PrincessExplorer;
  document.getElementById("learn-exit")?.click();
  try { PE.openPanel("castle"); } catch (err) { return { err: String(err) }; }
  const body = document.getElementById("panel-body");
  return { open: !!body && !document.getElementById("panel").classList.contains("hidden"), text: body ? body.innerText.slice(0, 80) : "" };
});
check("the castle station panel opens", station.open === true, JSON.stringify(station));

const fps = await page.evaluate(() => new Promise((resolve) => {
  let n = 0;
  const t0 = performance.now();
  function frame(t) { n++; if (t - t0 < 1200) requestAnimationFrame(frame); else resolve(+(n / 1.2).toFixed(1)); }
  requestAnimationFrame(frame);
}));
console.log("fps", fps);
check("no console or page errors during the pass", errors.length === 0, errors.slice(0, 3).join(" | "));
await browser.close();
server.close();
if (failures.some((f) => !f.ok)) process.exit(1);

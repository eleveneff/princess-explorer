/**
 * v4.5 quests, grounds, and the 12 castle additions.
 * Run: node tests/v45.mjs
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
  if (!full.startsWith(root) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, { "content-type": "text/html" });
  fs.createReadStream(full).pipe(res);
});
await new Promise((r) => server.listen(8772, "127.0.0.1", r));
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
  page.on("dialog", (d) => d.dismiss());
  if (save) await page.evaluateOnNewDocument((payload) => localStorage.setItem("princess-explorer-save-v1", JSON.stringify(payload)), save);
  await page.setViewport({ width: 1280, height: 720 });
  await page.goto("http://127.0.0.1:8772/index.html?debug=castle", { waitUntil: "networkidle0", timeout: 60000 });
  await page.waitForFunction(() => window.PrincessExplorer && window.PrincessExplorer.care, { timeout: 30000 });
  await page.evaluate(() => document.getElementById("intro")?.classList.add("hidden"));
  return page;
}

const page = await open(null);
const prices = await page.evaluate(() => window.PrincessExplorer.care.DEFS.map((d) => [d.id, d.price, d.need.join("+")]));
const expect = [["terrace",40,""],["stable",50,""],["studio",45,""],["nook",35,""],["tea",30,"terrace"],["maze",35,"terrace"],["training",50,""],["court",40,""],["observatory",45,""],["swans",30,""],["stage",35,""],["corgi",25,""]];
check("twelve additions at the approved prices", JSON.stringify(prices) === JSON.stringify(expect), JSON.stringify(prices));

const hidden = await page.evaluate(() => {
  const C = window.PrincessExplorer.care;
  return C.DEFS.every((d) => !C.built(d.id) && !C.own(d.id));
});
check("every addition is hidden until it is bought", hidden === true);

const gates = await page.evaluate(() => {
  const C = window.PrincessExplorer.care;
  const PE = window.PrincessExplorer;
  PE.state().score = 20;
  const tea = C.commit("tea");
  const short = C.commit("terrace");
  const after = C.coins();
  PE.state().score = 500;
  const built = C.commit("terrace");
  const again = C.commit("terrace");
  const teaNow = C.commit("tea");
  return { tea, short, after, built, again, teaNow, vis: C.built("terrace") && C.built("tea"), mazeStill: C.own("maze") };
});
check("tea refuses without the terrace and does not charge", gates.tea.ok === false && gates.tea.reason === "need" && gates.after === 20, JSON.stringify(gates.tea));
check("short terrace does not charge", gates.short.ok === false && gates.short.reason === "short" && gates.after === 20);
check("terrace charges exactly 40", gates.built.ok === true && gates.built.score === 460, String(gates.built.score));
check("buying the terrace again does not charge", gates.again.reason === "owned" && gates.again.score === 460);
check("tea charges exactly 30 after the terrace", gates.teaNow.ok === true && gates.teaNow.score === 430 && gates.vis && !gates.mazeStill, JSON.stringify(gates.teaNow));

const rest = await page.evaluate(() => {
  const C = window.PrincessExplorer.care;
  const order = ["stable","studio","nook","maze","training","court","observatory","swans","stage","corgi"];
  const log = [];
  for (const id of order) {
    const before = C.coins();
    const res = C.commit(id);
    log.push({ id, drop: before - res.score, ok: res.ok, price: C.DEFS.find((d) => d.id === id).price, built: C.built(id) });
  }
  const again = C.commit("corgi");
  return { log, again, score: C.coins(), all: C.DEFS.every((d) => C.own(d.id) && C.built(d.id)) };
});
check("the other ten charge their prices once and appear", rest.log.every((row) => row.ok && row.drop === row.price && row.built) && rest.all, JSON.stringify(rest.log));
check("full grounds leave 500 minus 460", rest.score === 40 && rest.again.reason === "owned" && rest.again.score === 40, String(rest.score));

const play = await page.evaluate(() => {
  const C = window.PrincessExplorer.care;
  const PE = window.PrincessExplorer;
  const before = C.coins();
  const out = {};
  out.math = C.act("terrace");
  out.mathAns = C.answer(0);
  out.brush = C.act("stable", "brush");
  out.ride = C.act("stable", "ride");
  const x0 = PE.princess.position.x;
  C.frame(1);
  out.rode = Math.hypot(PE.princess.position.x - x0, PE.princess.position.z) > 0.4;
  out.paint = C.act("studio", "hang");
  out.hung = !!PE.scene.getObjectByName("care-hung-art");
  out.nook = C.act("nook");
  out.maze = [C.act("maze"), C.act("maze"), C.act("maze")];
  out.train = C.act("training");
  out.court = C.act("court");
  out.stars = C.act("observatory");
  out.starsAns = C.answer(1);
  out.boat = C.act("swans");
  const b0 = { x: PE.princess.position.x, z: PE.princess.position.z };
  C.frame(0.8);
  out.boated = Math.hypot(PE.princess.position.x - b0.x, PE.princess.position.z - b0.z) > 0.3;
  C.act("swans");
  out.stage = C.act("stage");
  out.lamp = !!PE.scene.getObjectByName("care-stage-lamp");
  out.dog = [C.act("corgi"), C.act("corgi"), C.act("corgi")];
  out.score = C.coins();
  out.before = before;
  return out;
});
check("activities do not change the coin count", play.before === 40 && play.score === 40, JSON.stringify({ before: play.before, score: play.score }));
check("terrace math, pony, studio picture, nook, maze, training, court, stars, boat, stage, and treats all run",
  play.mathAns.right === true && play.brush.brushed === 1 && play.rode && play.hung && play.nook.open === 1 && play.maze[2].done === true && play.train.ribbon && play.court.tennis && play.starsAns.right === false && play.boated && play.lamp && play.dog[2].happy === true,
  JSON.stringify({ math: play.mathAns, rode: play.rode, hung: play.hung, nook: play.nook.open, maze: play.maze[2], boat: play.boated, dog: play.dog[2] }));

const quest = await page.evaluate(() => {
  const PE = window.PrincessExplorer;
  const before = PE.care.coins();
  PE.enterCastle();
  PE.teleportRoom("throne");
  const arrived = PE.quest.here("throne");
  const early = PE.quest.answer(0);
  PE.quest.CHAPTERS;
  const v = PE.state().v45.quest;
  v.at = 1; v.arrived.throne = 1;
  const wrong = PE.quest.answer(1);
  const right = PE.quest.answer(0);
  return { arrived, early: early.reason, wrong: wrong.right, right: right.right, score: PE.care.coins(), before, at: PE.state().v45.quest.at, done: PE.state().v45.quest.done.throne };
});
check("throne quest needs the room, a wrong answer does not finish it, a right answer costs nothing", quest.arrived && quest.wrong === false && quest.right === true && quest.score === quest.before && quest.done === 1, JSON.stringify(quest));

const review = await page.evaluate(() => {
  const PE = window.PrincessExplorer;
  PE.grownups.note("read-castle-01-q1", false, "main_idea");
  const before = PE.care.coins();
  const cur = PE.review.current();
  const ans = cur ? PE.review.answer(cur.q.answer_index) : { empty: true };
  return { type: cur && cur.type, right: ans.right, score: PE.care.coins(), before, week: PE.review.week() };
});
check("weekly review repeats a missed kind and pays nothing", review.type === "main_idea" && review.right === true && review.score === review.before, JSON.stringify(review));

const grown = await page.evaluate(() => {
  const sum = window.PrincessExplorer.grownups.summary();
  return { weak: sum.weak, spentCare: sum.spent.care, coins: sum.coins, recent: sum.recent.length };
});
check("grown-up summary sees the weak kind and the 460 coins spent on builds", grown.spentCare === 460 && grown.coins === 40 && grown.weak && grown.weak.some((w) => w.type === "main_idea"), JSON.stringify(grown));

await page.evaluate(() => window.PrincessExplorer.save());
const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("princess-explorer-save-v1")));
await page.close();

const again = await open(saved);
const kept = await again.evaluate(() => {
  const C = window.PrincessExplorer.care;
  return { score: C.coins(), all: C.DEFS.every((d) => C.own(d.id) && C.built(d.id)), layout: window.PrincessExplorer.state().v45.layout, quest: window.PrincessExplorer.state().v45.quest.done.throne };
});
check("reload keeps every addition, the coins, and the quest", kept.score === 40 && kept.all && kept.layout === 1 && kept.quest === 1, JSON.stringify(kept));
await again.close();

const moved = await open({ score: 77, streak: 4, bestStreak: 6, badges: { fencing: true }, shop: { owned: { "hat-sun": true }, equip: { hat: "hat-sun" } }, wardrobe43: { ver: 1, changes: 2, spent: 2 }, pos: { x: 0, z: 12.4 }, ver: 3, answered: { "keep-me": true }, petName: "Sir Biscuit" });
const mig = await moved.evaluate(() => {
  const s = window.PrincessExplorer.state();
  return { pos: s.pos, score: s.score, badge: s.badges.fencing, hat: s.shop.equip.hat, spent: s.wardrobe43.spent, streak: s.streak, pet: s.petName, layout: s.v45.layout };
});
check("a grounds position scales once and the rest of the save stays", mig.layout === 1 && mig.pos.z === 16.12 && mig.pos.x === 0 && mig.score === 77 && mig.badge && mig.hat === "hat-sun" && mig.spent === 2 && mig.streak === 4 && mig.pet === "Sir Biscuit", JSON.stringify(mig));
await moved.reload({ waitUntil: "networkidle0" });
await moved.waitForFunction(() => window.PrincessExplorer && window.PrincessExplorer.care);
const twice = await moved.evaluate(() => window.PrincessExplorer.state().pos);
check("reloading does not scale that position again", twice.z === 16.12 && twice.x === 0, JSON.stringify(twice));
await moved.close();

const moatPage = await open({ score: 80, pos: { x: 8.2, z: -1 }, ver: 3, v45: { layout: 1 } });
const moat = await moatPage.evaluate(() => {
  const PE = window.PrincessExplorer;
  document.getElementById("intro")?.classList.add("hidden");
  const water = PE.scene.getObjectByName("moat-water");
  const g = water.geometry.parameters;
  const width = g.outerRadius - g.innerRadius;
  const oldWidth = 3.32;
  PE.state().score = 900;
  PE.care.commit("swans");
  const coins = PE.care.coins();
  const spot = PE.care.spot("swans");
  PE.teleport(spot.x, spot.z);
  PE.care.act("swans");
  const boarded = PE.care.boat.on();
  const radius = PE.care.boat.radius();
  const a0 = PE.care.boat.angle();
  PE.care.boat.step(0.5, 1);
  const aForward = PE.care.boat.angle();
  PE.care.boat.step(0.5, -1);
  const aBack = PE.care.boat.angle();
  PE.princess.position.set(0, 0, 20);
  PE.care.boat.step(0.05, 0);
  const stuck = Math.abs(PE.care.boat.radius() - PE.care.moat().mid) < 0.2;
  PE.care.boat.setAngle(Math.PI);
  const refused = PE.care.act("swans");
  PE.care.boat.setAngle(Math.atan2(spot.z + 1, spot.x));
  const left = PE.care.act("swans");
  PE.gate.snapOpen();
  PE.care.act("swans");
  PE.care.boat.setAngle(Math.PI / 2 - 0.25);
  for (let i = 0; i < 16; i++) { PE.care.boat.step(0.1, 0); PE.gate.step(0.1, 0, 0.1); }
  const raised = PE.gate.state.b;
  PE.care.boat.setAngle(Math.PI / 2 + 1.2);
  PE.care.boat.step(0.05, 0);
  for (let i = 0; i < 18; i++) PE.gate.step(0.1, 1, 0.1);
  const lowered = PE.gate.state.b;
  PE.care.boat.setAngle(Math.atan2(spot.z + 1, spot.x));
  PE.care.act("swans");
  for (let i = 0; i < 20; i++) PE.gate.step(0.16, 3, 0.16);
  const foot = PE.gate.isDown() && !PE.care.boat.on();
  const saved = { score: PE.care.coins(), owned: !!PE.state().v45.care.owned.swans, moat: PE.state().v45.moat };
  return { width: +width.toFixed(2), ratio: +(width / oldWidth).toFixed(2), pos: PE.state().pos, coins, boarded, radius: +radius.toFixed(2), mid: PE.care.moat().mid, a0, aForward, aBack, stuck, refused, left, raised: +raised.toFixed(2), lowered: +lowered.toFixed(2), foot, saved };
});
check("the moat water ring is about 1.5 times as wide", moat.ratio >= 1.45 && moat.ratio <= 1.55, JSON.stringify(moat));
check("a saved spot in the new water moves to land once", moat.pos && Math.hypot(moat.pos.x, moat.pos.z + 1) > 13.8 && moat.saved.moat === 2, JSON.stringify(moat.pos));
check("boarding the swan keeps the coins and puts her on the water ring", moat.boarded && moat.coins === 870 && Math.abs(moat.radius - moat.mid) < 0.05, JSON.stringify(moat));
check("the boat paddles both ways and stays on the ring", moat.aForward > moat.a0 && moat.aBack < moat.aForward && moat.stuck, JSON.stringify(moat));
check("she can step off only at the dock", moat.refused.far === true && moat.refused.boating === true && moat.left.boating === false, JSON.stringify(moat));
check("the drawbridge rises in about 1.5 seconds and lowers after she passes", moat.raised < 0.05 && moat.lowered > 0.9, JSON.stringify(moat));
check("on foot the drawbridge stays down and the save keeps the boat", moat.foot && moat.saved.score === 870 && moat.saved.owned, JSON.stringify(moat.saved));
await moatPage.reload({ waitUntil: "networkidle0" });
await moatPage.waitForFunction(() => window.PrincessExplorer && window.PrincessExplorer.care);
const moatAgain = await moatPage.evaluate(() => window.PrincessExplorer.state().pos);
check("reloading does not move that moat position again", moatAgain.x === moat.pos.x && moatAgain.z === moat.pos.z, JSON.stringify(moatAgain));
await moatPage.close();

async function boxes(width, height, touch) {
  const p = await browser.newPage();
  p.on("pageerror", (e) => errors.push(e.message));
  await p.setViewport({ width, height, isMobile: touch, hasTouch: touch });
  if (touch) await p.evaluateOnNewDocument(() => Object.defineProperty(navigator, "maxTouchPoints", { get: () => 5 }));
  await p.goto("http://127.0.0.1:8772/index.html?debug=castle", { waitUntil: "networkidle0", timeout: 60000 });
  await p.waitForFunction(() => window.PrincessExplorer && window.PrincessExplorer.care);
  const box = await p.evaluate(async (touchOn) => {
    document.getElementById("intro")?.classList.add("hidden");
    const PE = window.PrincessExplorer;
    if (touchOn) { PE.state().touchCtl = "on"; document.body.classList.add("touch"); }
    PE.enterCastle();
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const prompt = document.getElementById("prompt");
    prompt.classList.remove("hidden");
    prompt.style.display = "block";
    document.getElementById("prompt-text").textContent = "Sir Biscuit Press E or tap to pet him";
    const a = document.getElementById("castle-exit-btn").getBoundingClientRect();
    const b = prompt.getBoundingClientRect();
    const overlap = !(a.right < b.left || b.right < a.left || a.bottom < b.top || b.bottom < a.top);
    return { overlap, exitH: a.height, aw: a.width, ah: a.height, bw: b.width, promptTop: b.top, exitBottom: a.bottom, exitTop: a.top };
  }, touch);
  await p.close();
  return box;
}
const desk = await boxes(1280, 720, false);
const port = await boxes(390, 844, true);
const land = await boxes(844, 390, true);
check("desktop prompt and Exit do not overlap", desk.overlap === false && desk.exitH === 56, JSON.stringify(desk));
check("portrait prompt and Exit do not overlap", port.overlap === false && port.exitH === 56, JSON.stringify(port));
check("landscape prompt and Exit do not overlap", land.overlap === false && land.exitH === 56, JSON.stringify(land));

const real = errors.filter((e) => !/404|favicon/i.test(e));
check("no page errors", real.length === 0, real.slice(0, 3).join(" | "));
const failed = failures.filter((f) => !f.ok);
console.log(`\n${failures.length - failed.length} passed, ${failed.length} failed`);
await browser.close();
server.close();
process.exit(failed.length ? 1 : 0);

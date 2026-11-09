/**
 * Castle polish: gate prices, room camera, save, wardrobe.
 * Run: node tests/castle-polish.mjs
 * Serves the repo index.html. One browser, pages in sequence.
 */
import { createRequire } from "module";
import http from "http";
import fs from "fs";
import path from "path";

const require = createRequire(import.meta.url);
const puppeteer = require("/tmp/pe-tools/node_modules/puppeteer-core");
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
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
  res.writeHead(200, { "content-type": file.endsWith(".html") ? "text/html" : "application/octet-stream" });
  fs.createReadStream(full).pipe(res);
});
await new Promise((r) => server.listen(8771, "127.0.0.1", r));

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: "new",
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist", "--no-sandbox", "--disable-dev-shm-usage"],
});
const errors = [];

async function open(save, viewport = { width: 1280, height: 720 }, touch = false) {
  const page = await browser.newPage();
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
  await page.setViewport({ ...viewport, isMobile: touch, hasTouch: touch });
  if (touch) {
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "maxTouchPoints", { get: () => 5 });
    });
  }
  if (save) {
    await page.evaluateOnNewDocument((payload) => {
      localStorage.setItem("princess-explorer-save-v1", JSON.stringify(payload));
    }, save);
  }
  await page.goto("http://127.0.0.1:8771/index.html?debug=castle", { waitUntil: "networkidle0", timeout: 60000 });
  await page.waitForFunction(() => window.PrincessExplorer && window.PrincessExplorer.door, { timeout: 30000 });
  await page.evaluate((touchOn) => {
    const intro = document.getElementById("intro");
    if (intro) intro.classList.add("hidden");
    if (touchOn) {
      window.PrincessExplorer.state().touchCtl = "on";
      document.body.classList.add("touch");
    }
  }, touch);
  return page;
}

check("published file still prices the castle gate at 10", html.includes("re.score=x()-10"));
check("published file still totals the math gate at 20", html.includes("mathGate:{PAY:[6,7,7],TOTAL:20"));
check("published file still charges wardrobe by the change count", html.includes("u.score=a()-d"));
check("mini-game picker uses the same 1-change price line", html.includes('id="a35-cost"') && html.includes("${q.plural(C)} = ${C}"));
check("version marker is v4.6", html.includes('content="v4.6"') && html.includes('version:"v4.6"'));

const page = await open(null);
const version = await page.evaluate(() => window.PrincessExplorer.version);
check("runtime version is v4.6", version === "v4.6", version);

const poor = await page.evaluate(() => {
  const PE = window.PrincessExplorer;
  PE.state().score = 9;
  PE.save();
  PE.door.open();
  const root = document.getElementById("door41");
  const pay = !!root.querySelector("#door41-pay");
  const need = !!root.querySelector("#door41-need");
  const score = PE.state().score;
  PE.door.close();
  return { pay, need, score, pass: PE.door.pass };
});
check("9 coins hides Pay and does not charge", poor.pay === false && poor.need === true && poor.score === 9 && poor.pass === false, JSON.stringify(poor));

const paid = await page.evaluate(() => {
  const PE = window.PrincessExplorer;
  PE.state().score = 30;
  PE.save();
  PE.door.open();
  document.getElementById("door41-pay").click();
  return { score: PE.state().score, pass: PE.door.pass };
});
check("Pay 10 drops 30 to 20 and opens the gate", paid.score === 20 && paid.pass === true, JSON.stringify(paid));

const free = await page.evaluate(async () => {
  const PE = window.PrincessExplorer;
  PE.state().score = 40;
  PE.state().streak = 2;
  PE.save();
  PE.door.clearPass();
  PE.door.open();
  document.getElementById("door41-quiz").click();
  const log = [];
  for (let n = 0; n < 3; n++) {
    const q = PE.door.q;
    const perm = PE.door.perm;
    const button = perm.indexOf(q.answer_index);
    log.push({ n, answer: q.answer_index, button, choices: q.choices.length });
    document.querySelector(`#door41 [data-k="${button}"]`).click();
    const next = document.getElementById("door41-next");
    if (next) next.click();
  }
  await new Promise((r) => setTimeout(r, 1200));
  return { score: PE.state().score, pass: PE.door.pass, streak: PE.state().streak, log };
});
check("3 correct castle answers are free and keep 40 coins", free.score === 40 && free.pass === true, JSON.stringify(free));

const rooms = await page.evaluate(() => {
  const PE = window.PrincessExplorer;
  PE.enterCastle();
  const castle = PE.v3.castle;
  const names = ["throne", "trophy", "bedroom", "library", "kitchen", "ballroom", "biscuit", "balcony"];
  const out = [];
  for (const room of names) {
    PE.teleportRoom(room);
    const cam = PE.camera.position;
    const princess = PE.princess.position;
    const lx = cam.x - castle.IC.x;
    const lz = cam.z - castle.IC.z;
    let gap = null;
    castle.castleIn.group.traverse((o) => {
      if (!o.userData || !o.userData.castleCeil || !o.geometry || !o.geometry.parameters) return;
      const p = o.geometry.parameters;
      if (Math.abs(lx - o.position.x) < p.width / 2 && Math.abs(lz - o.position.z) < p.depth / 2) {
        const g = o.position.y - p.height / 2 - cam.y;
        gap = gap == null ? g : Math.min(gap, g);
      }
    });
    const head = princess.y + 1.45;
    out.push({
      room,
      inside: castle.inCastle,
      onFloor: castle.inWalk(lx, lz),
      strict: castle.freeAt(lx, lz),
      gap: gap == null ? null : +gap.toFixed(2),
      headBelowCam: cam.y > head,
      camY: +cam.y.toFixed(2),
      finish: !!castle.castleIn.group.getObjectByName("castle-finish-v44"),
    });
  }
  const spot = castle.nearestFree(0, 1.5);
  PE.princess.position.set(castle.IC.x + spot.x, 0, castle.IC.z + spot.z);
  PE.princess.rotation.y = Math.PI;
  PE.snapCamera();
  const entryCam = { x: +PE.camera.position.x.toFixed(2), y: +PE.camera.position.y.toFixed(2), z: +PE.camera.position.z.toFixed(2) };
  castle.exitCastle();
  return {
    out,
    entryCam,
    left: !castle.inCastle,
    outsideX: +PE.princess.position.x.toFixed(2),
  };
});
check("entry camera is the same hall pose as v4.3", rooms.entryCam.x === 400 && rooms.entryCam.y === 4.2 && rooms.entryCam.z === 9, JSON.stringify(rooms.entryCam));
check("every room camera stays on walkable floor", rooms.out.every((r) => r.inside && r.onFloor && r.strict), JSON.stringify(rooms.out));
check("ceiling stays at least 1.1 m above the camera and the head is below the lens", rooms.out.every((r) => r.gap > 1.1 && r.headBelowCam && r.finish), JSON.stringify(rooms.out));
check("Exit to Fountain returns outside the castle shell", rooms.left === true && Math.abs(rooms.outsideX) < 80, JSON.stringify(rooms));

const wardrobe = await page.evaluate(() => {
  const PE = window.PrincessExplorer;
  const oc = PE.outfitCost;
  const base = {};
  for (const slot of oc.WEAR_SLOTS) base[slot] = oc.defaultFor(slot);
  const hat = oc.itemById("hat-sun");
  const dress = oc.itemById("dress-blue");
  const one = Object.assign({}, base, { hat: hat.id });
  const two = Object.assign({}, one, { outfit: dress.id });
  PE.state().score = 8;
  const charged = oc.charge(oc.countChanges(one, base));
  const afterOne = PE.state().score;
  const spent = PE.state().wardrobe43.spent;
  const chargedTwo = oc.charge(oc.countChanges(two, base) - 1);
  const afterTwo = PE.state().score;
  PE.state().score = 0;
  const refused = oc.charge(1);
  const stuck = PE.state().score;
  PE.openShop();
  const shop = document.getElementById("shop");
  const hatBtn = shop && Array.from(shop.querySelectorAll("[data-id], button")).find((el) => (el.dataset.id || el.dataset.item || el.textContent || "").includes("Sun") || (el.dataset.id === "hat-sun"));
  return {
    plural1: oc.plural(1),
    plural3: oc.plural(3),
    hat: hat && hat.id,
    dress: dress && dress.id,
    one: oc.countChanges(one, base),
    two: oc.countChanges(two, base),
    charged, afterOne, spent, chargedTwo, afterTwo, refused, stuck,
    shopOpen: shop ? !shop.classList.contains("hidden") : false,
    hatBtn: hatBtn ? (hatBtn.dataset.id || hatBtn.textContent.slice(0, 40)) : null,
  };
});
check("one wardrobe change counts as 1 and three words as changes", wardrobe.plural1 === "1 change" && wardrobe.plural3 === "3 changes" && wardrobe.one === 1 && wardrobe.two === 2, JSON.stringify(wardrobe));
check("charging one change then a second drops 8 to 6 and a empty purse refuses", wardrobe.charged === true && wardrobe.afterOne === 7 && wardrobe.chargedTwo === true && wardrobe.afterTwo === 6 && wardrobe.refused === false && wardrobe.stuck === 0 && wardrobe.spent === 1, JSON.stringify(wardrobe));

const shopCost = await page.evaluate(() => {
  const PE = window.PrincessExplorer;
  PE.state().shop.owned["hat-sun"] = true;
  const shop = document.getElementById("shop");
  shop.querySelector('[data-t="hats"]').click();
  const tryOn = shop.querySelector('[data-try="hat-sun"]');
  if (tryOn) tryOn.click();
  const note = document.getElementById("shop-note");
  const cost = document.getElementById("shop-cost-text");
  return {
    tried: !!tryOn,
    note: note ? note.innerText.replace(/\s+/g, " ") : "",
    cost: cost ? cost.innerText.replace(/\s+/g, " ") : "",
  };
});
check("shop picker prices one worn change at 1 coin", shopCost.tried && shopCost.cost.includes("1 change = 1") && shopCost.note.includes("costs 1"), JSON.stringify(shopCost));

const gate = await page.evaluate(async () => {
  const PE = window.PrincessExplorer;
  PE.state().score = 50;
  PE.state().gatePending = 0;
  PE.save();
  const v = PE.v35;
  v.open("fencing");
  v.play("play");
  const g = v.gate;
  const before = PE.state().score;
  const steps = [];
  if (!g.active) return { before, active: g.active, phase: v.phase && v.phase(), game: v.game && v.game() };
  for (let n = 0; n < 4 && g.active && g.state !== "done"; n++) {
    if (g.state !== "ask") { g.next(); continue; }
    const q = g.q;
    g.answer(q.answer_index);
    steps.push({ state: g.state, streak: g.streak, score: PE.state().score });
    if (g.state !== "done") g.next();
  }
  return { before, after: PE.state().score, drop: PE.state().score - before, steps, active: g.active, state: g.state };
});
check("mini-game math gate pays 6+7+7 = 20", gate.drop === 20, JSON.stringify(gate));

await page.close();

const snapshot = {
  score: 77,
  streak: 4,
  bestStreak: 9,
  throneSits: 3,
  castleOpen: true,
  ver: 3,
  petName: "Sir Biscuit",
  answered: { "keep-me": true },
  badges: { fencing: true },
  shop: { owned: { "hat-sun": true }, equip: { hat: "hat-sun" } },
  wardrobe43: { ver: 1, changes: 2, spent: 2 },
};
const again = await open(snapshot);
const kept = await again.evaluate(() => {
  const s = window.PrincessExplorer.state();
  return {
    score: s.score,
    streak: s.streak,
    bestStreak: s.bestStreak,
    throneSits: s.throneSits,
    castleOpen: s.castleOpen,
    badge: !!(s.badges && s.badges.fencing),
    hatOwned: !!(s.shop && s.shop.owned && s.shop.owned["hat-sun"]),
    hat: s.shop && s.shop.equip && s.shop.equip.hat,
    spent: s.wardrobe43 && s.wardrobe43.spent,
    changes: s.wardrobe43 && s.wardrobe43.changes,
    pet: s.petName,
  };
});
check("reload keeps coins, star badge, hat, throne sits, and wardrobe spend", kept.score === 77 && kept.streak === 4 && kept.bestStreak === 9 && kept.throneSits === 3 && kept.badge === true && kept.hatOwned === true && kept.hat === "hat-sun" && kept.spent === 2 && kept.changes === 2 && kept.pet === "Sir Biscuit", JSON.stringify(kept));
await again.close();

const land = await open(null, { width: 844, height: 390 }, true);
const hud = await land.evaluate(async () => {
  const PE = window.PrincessExplorer;
  PE.enterCastle();
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const exit = document.getElementById("castle-exit-btn").getBoundingClientRect();
  const joy = document.getElementById("joy").getBoundingClientRect();
  const act = document.getElementById("act").getBoundingClientRect();
  return {
    exit: { top: exit.top, bottom: exit.bottom, left: exit.left, right: exit.right, h: exit.height },
    joy: { top: joy.top, bottom: joy.bottom },
    act: { left: act.left },
    shown: document.getElementById("castle-exit-btn").classList.contains("show"),
    touch: document.body.classList.contains("touch"),
  };
});
check("landscape Exit sits above the joystick and is shown", hud.shown && hud.touch && hud.exit.bottom <= hud.joy.top - 8 && hud.exit.h >= 40, JSON.stringify(hud));
await land.close();

const realErrors = errors.filter((e) => !/404/.test(e) && !/favicon/i.test(e));
check("no page errors", realErrors.length === 0, realErrors.slice(0, 4).join(" | "));

const failed = failures.filter((f) => !f.ok);
console.log(`\n${failures.length - failed.length} passed, ${failed.length} failed`);
await browser.close();
server.close();
process.exit(failed.length ? 1 : 0);

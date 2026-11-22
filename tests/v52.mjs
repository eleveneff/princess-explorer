/**
 * v5.2: gate, swan, and stream camera rays, signs that face the camera,
 * and a 5.1 save that still loads with everything intact.
 * Run: node tests/v52.mjs
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
  const type = ext === ".html" ? "text/html" : ext === ".js" ? "text/javascript" : "application/octet-stream";
  res.writeHead(200, { "content-type": type });
  fs.createReadStream(full).pipe(res);
});
await new Promise((r) => server.listen(8778, "127.0.0.1", r));

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: "new",
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist", "--no-sandbox", "--disable-dev-shm-usage"],
});
const errors = [];
const page = await browser.newPage();
page.on("pageerror", (err) => errors.push(String(err.message || err)));
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
await page.setViewport({ width: 1280, height: 720 });
await page.goto("http://127.0.0.1:8778/index.html?debug=castle&quiet=1", { waitUntil: "networkidle0", timeout: 90000 });
await page.waitForFunction(() => window.PrincessExplorer && window.PrincessExplorer.v52, { timeout: 30000 });
await page.evaluate(() => document.getElementById("intro")?.classList.add("hidden"));

function rayScript() {
  const PE = window.PrincessExplorer;
  const THREE = PE.gfx43.THREE;
  const cam = PE.camera;
  const p = PE.princess.position;
  const feet = new THREE.Vector3(p.x, p.y + 0.14, p.z);
  const dir = new THREE.Vector3().subVectors(feet, cam.position);
  const dist = dir.length();
  dir.multiplyScalar(1 / Math.max(0.001, dist));
  const ray = new THREE.Raycaster(cam.position, dir, 0.05, Math.max(0.1, dist - 0.35));
  const meshes = [];
  PE.scene.traverse((o) => { if (o.isMesh) meshes.push(o); });
    const hits = ray.intersectObjects(meshes, false).filter((h) => {
      let o = h.object;
      while (o) { if (o === PE.princess) return false; o = o.parent; }
      if (h.object.visible === false) return false;
      const mat = Array.isArray(h.object.material) ? h.object.material[0] : h.object.material;
      if (mat && mat.opacity != null && mat.opacity < 0.2) return false;
      const type = h.object.geometry && h.object.geometry.type;
      if (type === "CircleGeometry" || type === "RingGeometry" || type === "PlaneGeometry") return false;
      if (h.object.name === "v52-leaf" && h.point.y < p.y + 0.8) return false;
      return true;
    }).slice(0, 3).map((h) => ({
    d: +h.distance.toFixed(2),
    name: h.object.name || h.object.geometry.type,
    kind: h.object.userData.v52kind || "",
    bridge: !!h.object.userData.v52bridge
  }));
  return {
    blocked: hits.length > 0,
    hits,
    cam: { x: +cam.position.x.toFixed(2), y: +cam.position.y.toFixed(2), z: +cam.position.z.toFixed(2) },
    p: { x: +p.x.toFixed(2), y: +p.y.toFixed(2), z: +p.z.toFixed(2) },
    err: PE.v52.error || ""
  };
}

const stats = await page.evaluate(() => window.PrincessExplorer.v52.stats());
check("fence posts and rails are split out of the ground", stats.rails >= 3 && stats.posts >= 3, JSON.stringify(stats));

await page.evaluate(() => {
  const PE = window.PrincessExplorer;
  PE.gate.snapOpen();
  for (let i = 0; i < 12; i++) PE.gate.step(0.2, 3, 0.2);
  PE.teleport(0, 9.1);
  PE.princess.position.set(0, 0, 9.1);
  PE.face(Math.PI);
  PE.snapCamera();
  PE.v52.apply();
});
const bridge = await page.evaluate(rayScript);
const bridgeSide = Math.abs(bridge.cam.x - bridge.p.x) > 3.2 && bridge.cam.y > bridge.p.y + 3 && Math.abs(bridge.cam.z - bridge.p.z) > 1.4;
check("drawbridge camera is a high three-quarter and her feet are clear", bridgeSide && !bridge.blocked && !bridge.err, JSON.stringify(bridge));

await page.evaluate(() => {
  const PE = window.PrincessExplorer;
  const spot = PE.gate.GATE_SPOT;
  PE.teleport(spot.x, spot.z);
  PE.princess.position.set(spot.x, 0, spot.z);
  PE.face(Math.PI);
  PE.snapCamera();
  PE.v52.apply();
});
const gate = await page.evaluate(rayScript);
check("gate camera-to-feet ray is clear", !gate.blocked && Math.abs(gate.cam.x - gate.p.x) > 3, JSON.stringify(gate));

const bridgeStill = await page.evaluate(() => {
  const PE = window.PrincessExplorer;
  if (PE.care && PE.care.boat && PE.care.boat.on()) PE.care.act("swans");
  PE.gate.snapOpen();
  const samples = [];
  PE.princess.position.set(20, 0, 16);
  for (let i = 0; i < 30; i++) PE.gate.step(1, 0, 1);
  samples.push(PE.gate.state.b);
  PE.princess.position.set(0, 0, 9);
  PE.face(Math.PI);
  for (let i = 0; i < 16; i++) PE.gate.step(0.2, 1, 0.2);
  samples.push(PE.gate.state.b);
  PE.state().score = 200;
  if (!PE.state().v45.care.owned.swans) PE.care.commit("swans");
  const spot = PE.care.spot("swans");
  PE.teleport(spot.x, spot.z);
  if (!PE.care.boat.on()) PE.care.act("swans");
  PE.care.boat.setAngle(Math.PI / 2 - 0.2);
  for (let i = 0; i < 18; i++) { PE.care.boat.step(0.1, 0); PE.gate.step(0.1, 0, 0.1); }
  const raised = PE.gate.state.b;
  PE.care.boat.setAngle(Math.PI / 2 + 1.3);
  PE.care.boat.step(0.05, 0);
  for (let i = 0; i < 20; i++) PE.gate.step(0.1, 1, 0.1);
  const lowered = PE.gate.state.b;
  PE.care.boat.setAngle(Math.atan2(spot.z + 1, spot.x));
  PE.care.act("swans");
  return { samples, raised: +raised.toFixed(3), lowered: +lowered.toFixed(3), onFoot: !PE.care.boat.on() };
});
check("on foot the drawbridge never moves", bridgeStill.samples.every((n) => n > 0.98), JSON.stringify(bridgeStill));
check("the swan boat raises the bridge and it comes back down", bridgeStill.raised < 0.08 && bridgeStill.lowered > 0.9 && bridgeStill.onFoot, JSON.stringify(bridgeStill));

const swan = await page.evaluate(() => {
  const PE = window.PrincessExplorer;
  PE.state().score = 400;
  PE.care.commit("terrace");
  PE.care.commit("tea");
  PE.care.commit("swans");
  const spot = PE.care.spot("swans");
  PE.teleport(spot.x, spot.z);
  PE.care.act("swans");
  const tea = 38 * Math.PI / 180;
  PE.care.boat.setAngle(tea);
  PE.snapCamera();
  PE.v52.apply();
  const cam = PE.camera.position;
  const p = PE.princess.position;
  const r = Math.hypot(cam.x, cam.z + 1);
  const pr = Math.hypot(p.x, p.z + 1);
  const ca = Math.atan2(cam.z + 1, cam.x);
  const pa = Math.atan2(p.z + 1, p.x);
  let d = Math.abs(ca - pa);
  if (d > Math.PI) d = Math.PI * 2 - d;
  return { r: +r.toFixed(2), pr: +pr.toFixed(2), side: +d.toFixed(2), coins: PE.state().score };
});
const swanRay = await page.evaluate(rayScript);
check("swan camera sits beside her over open water", swan.r > 8.3 && swan.r < 12.1 && swan.side > 0.25, JSON.stringify(swan));
check("swan camera-to-feet ray is clear", !swanRay.blocked, JSON.stringify(swanRay));

const stream = await page.evaluate(() => {
  const PE = window.PrincessExplorer;
  if (PE.care.boat.on()) PE.care.act("swans");
  const samples = PE.stream.samples();
  const frames = [];
  [0.22, 0.34, 0.62, 0.78].forEach((u) => {
    const i = Math.max(2, Math.min(samples.length - 3, Math.floor(u * (samples.length - 1))));
    const s = samples[i];
    const x = s.x + s.nx * 2.4;
    const z = s.z + s.nz * 2.4;
    PE.teleport(x, z);
    PE.princess.position.y = PE.groundH ? PE.groundH(x, z) : 0;
    PE.face(Math.atan2(-s.nz, -s.nx));
    PE.snapCamera();
    PE.v52.apply();
    const cam = PE.camera.position;
    const p = PE.princess.position;
    const THREE = PE.gfx43.THREE;
    const feet = new THREE.Vector3(p.x, p.y + 0.14, p.z);
    const dir = new THREE.Vector3().subVectors(feet, cam);
    const dist = dir.length();
    dir.multiplyScalar(1 / Math.max(0.001, dist));
    const ray = new THREE.Raycaster(cam, dir, 0.05, Math.max(0.1, dist - 0.35));
    const meshes = [];
    PE.scene.traverse((o) => { if (o.isMesh) meshes.push(o); });
    const hits = ray.intersectObjects(meshes, false).filter((h) => {
      let o = h.object;
      while (o) { if (o === PE.princess) return false; o = o.parent; }
      if (h.object.visible === false) return false;
      const mat = Array.isArray(h.object.material) ? h.object.material[0] : h.object.material;
      if (mat && mat.opacity != null && mat.opacity < 0.2) return false;
      const type = h.object.geometry && h.object.geometry.type;
      if (type === "CircleGeometry" || type === "RingGeometry" || type === "PlaneGeometry") return false;
      const box = new THREE.Box3().setFromObject(h.object);
      const size = box.getSize(new THREE.Vector3());
      if (Math.max(size.x, size.z) > 25 && size.y < 12) return false;
      return true;
    }).slice(0, 2).map((h) => ({ name: h.object.name || (h.object.geometry && h.object.geometry.type), d: +h.distance.toFixed(2) }));
    frames.push({ u, blocked: hits.length > 0, hits, x: +x.toFixed(1), z: +z.toFixed(1) });
  });
  return frames;
});
check("stream camera-to-feet rays stay clear along the bank", stream.every((f) => !f.blocked), JSON.stringify(stream.filter((f) => f.blocked)));

const signs = await page.evaluate(() => {
  const PE = window.PrincessExplorer;
  const THREE = PE.gfx43.THREE;
  PE.enterCastle();
  PE.snapCamera();
  PE.v52.billboards();
  const planes = [];
  PE.scene.traverse((o) => {
    if (!o.isMesh || !o.geometry || o.geometry.type !== "PlaneGeometry" || o.userData.v51back) return;
    const mat = Array.isArray(o.material) ? o.material[0] : o.material;
    if (!mat || !mat.map) return;
    const params = o.geometry.parameters || {};
    if ((params.width || 0) < 0.4 || (params.height || 0) > 1.2) return;
    planes.push(o);
  });
  const sign = planes.find((o) => {
    const p = new THREE.Vector3();
    o.getWorldPosition(p);
    return p.y > 2;
  }) || planes[0];
  if (!sign) return { found: false };
  const pos = new THREE.Vector3();
  sign.getWorldPosition(pos);
  PE.camera.position.set(pos.x + 1.6, pos.y + 0.05, pos.z + 0.15);
  PE.v52.billboards();
  const n = new THREE.Vector3(0, 0, 1).applyQuaternion(sign.getWorldQuaternion(new THREE.Quaternion()));
  const to = PE.camera.position.clone().sub(pos);
  n.y = 0; to.y = 0;
  const dot = n.normalize().dot(to.normalize());
  return { found: true, dot: +dot.toFixed(3), y: +pos.y.toFixed(2), n: planes.length };
});
check("a doorway sign turns to face a close side camera", signs.found && signs.dot > 0.85, JSON.stringify(signs));

const balcony = await page.evaluate(() => {
  const PE = window.PrincessExplorer;
  let slab = null;
  let tread = null;
  const group = PE.v3.castle.castleIn.group;
  group.traverse((o) => {
    if (o.name === "v52-balcony-floor") slab = o;
    if (!tread && o.userData && o.userData.v51stair && o.material && !o.material.map) tread = o;
  });
  const sm = slab && (Array.isArray(slab.material) ? slab.material[0] : slab.material);
  const tm = tread && (Array.isArray(tread.material) ? tread.material[0] : tread.material);
  return { named: !!slab, map: !!(sm && sm.map), shared: !!(sm && tm && sm === tm), tread: !!tread };
});
check("the library balcony floor has its own pattern", balcony.named && balcony.map && balcony.shared === false, JSON.stringify(balcony));

const steps = await page.evaluate(() => {
  const PE = window.PrincessExplorer;
  const ic = PE.v3.castle.IC;
  PE.enterCastle();
  const z0 = 14.45, z1 = 17.35, stepsN = 9;
  const zAt = (i) => ic.z + z0 + ((i + 0.5) / stepsN) * (z1 - z0);
  if (PE.learn && PE.learn.setQuiet) PE.learn.setQuiet(false);
  PE.state().sound = false;
  const btn = document.getElementById("sound");
  if (btn) btn.textContent = "Sound: Off";
  PE.princess.position.set(ic.x, 0, zAt(1));
  PE.snapCamera();
  PE.v52.apply();
  const before = PE.v52.stats().steps;
  PE.princess.position.set(ic.x, 0, zAt(3));
  PE.snapCamera();
  PE.v52.apply();
  const mutedSteps = PE.v52.stats().steps - before;
  PE.state().sound = true;
  if (btn) btn.textContent = "Sound: On";
  PE.princess.position.set(ic.x, 0, zAt(5));
  PE.snapCamera();
  PE.v52.apply();
  const played = PE.v52.stats().steps - before - mutedSteps;
  const y = PE.princess.position.y;
  return { mutedSteps, played, y: +y.toFixed(3) };
});
check("a stair step stays silent while sound is off", steps.mutedSteps === 0 && steps.played === 1 && steps.y > 0.4, JSON.stringify(steps));

await page.close();

const save = {
  score: 123,
  streak: 5,
  bestStreak: 9,
  badges: { fencing: true, castle: true },
  shop: { owned: { "hat-sun": true }, equip: { hat: "hat-sun" } },
  petName: "Sir Biscuit",
  pos: { x: 4.2, z: 8.5 },
  ver: 3,
  answered: { "keep-me": true },
  wardrobe43: { ver: 1, changes: 3, spent: 3 },
  v45: {
    layout: 1,
    moat: 2,
    stream: 1,
    care: { owned: { swans: 1, terrace: 1 }, spent: 70 },
    spend: { castle: 10, care: 70 },
    quest: { at: 2, done: { gate: 1, throne: 1 }, arrived: { library: 1 } },
    miss: { vocab: 1 },
    recent: [{ id: "keep-me", ok: true, type: "vocab", t: 1 }]
  },
  v47: {
    skills: { word: { c: 4, w: 1, n: 5 } },
    playMs: 180000,
    quiet: false,
    daily: { streak: 3, day: "2026-11-01", done: false, paid: 0 },
    due: [],
    ready: { terrace: 1 },
    passed: {}
  }
};
const again = await browser.newPage();
again.on("pageerror", (err) => errors.push(String(err.message || err)));
again.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
await again.evaluateOnNewDocument((payload) => {
  localStorage.setItem("princess-explorer-save-v1", JSON.stringify(payload));
}, save);
await again.setViewport({ width: 1280, height: 720 });
await again.goto("http://127.0.0.1:8778/index.html?debug=castle&quiet=1", { waitUntil: "networkidle0", timeout: 90000 });
await again.waitForFunction(() => window.PrincessExplorer && window.PrincessExplorer.v52, { timeout: 30000 });
const carried = await again.evaluate(() => {
  const s = window.PrincessExplorer.state();
  return {
    score: s.score,
    streak: s.streak,
    best: s.bestStreak,
    badge: !!(s.badges && s.badges.fencing && s.badges.castle),
    hat: s.shop && s.shop.equip && s.shop.equip.hat,
    owned: !!(s.shop && s.shop.owned && s.shop.owned["hat-sun"]),
    pet: s.petName,
    pos: s.pos,
    answered: !!(s.answered && s.answered["keep-me"]),
    spent: s.wardrobe43 && s.wardrobe43.spent,
    swans: !!(s.v45 && s.v45.care && s.v45.care.owned && s.v45.care.owned.swans),
    careSpent: s.v45 && s.v45.care && s.v45.care.spent,
    castleSpent: s.v45 && s.v45.spend && s.v45.spend.castle,
    quest: s.v45 && s.v45.quest && s.v45.quest.done && s.v45.quest.done.gate,
    questAt: s.v45 && s.v45.quest && s.v45.quest.at,
    skill: s.v47 && s.v47.skills && s.v47.skills.word && s.v47.skills.word.c,
    play: s.v47 && s.v47.playMs,
    daily: s.v47 && s.v47.daily && s.v47.daily.streak,
    layout: s.v45 && s.v45.layout,
    moat: s.v45 && s.v45.moat,
    stream: s.v45 && s.v45.stream
  };
});
const intact = carried.score === 123 && carried.streak === 5 && carried.best === 9 && carried.badge && carried.hat === "hat-sun" && carried.owned && carried.pet === "Sir Biscuit" && carried.pos && carried.pos.x === 4.2 && carried.pos.z === 8.5 && carried.answered && carried.spent === 3 && carried.swans && carried.careSpent === 70 && carried.castleSpent === 10 && carried.quest === 1 && carried.questAt === 2 && carried.skill === 4 && carried.play >= 180000 && carried.play < 240000 && carried.daily === 3 && carried.layout === 1 && carried.moat === 2 && carried.stream === 1;
check("a 5.1 save loads with coins, stars, items, and place intact", intact, JSON.stringify(carried));

const realErrors = errors.filter((e) => !/404|favicon|AudioContext|autoplay/i.test(e));
check("no page errors", realErrors.length === 0, realErrors.slice(0, 6).join(" | "));

const failed = failures.filter((f) => !f.ok);
console.log(`\n${failures.length - failed.length} passed, ${failed.length} failed`);
await browser.close();
server.close();
process.exit(failed.length ? 1 : 0);

/**
 * v5.1 camera: tall castle floors, and the princess stays visible
 * in every room and in the garden. Real key holds, sampled frames.
 * Run: node tests/v51-camera.mjs
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
await new Promise((r) => server.listen(8774, "127.0.0.1", r));

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
await page.goto("http://127.0.0.1:8774/index.html?debug=castle&quiet=1", { waitUntil: "networkidle0", timeout: 90000 });
await page.waitForFunction(() => window.PrincessExplorer && window.PrincessExplorer.v3, { timeout: 30000 });
await page.evaluate(() => {
  const intro = document.getElementById("intro");
  if (intro) intro.classList.add("hidden");
});

async function hold(code, ms) {
  await page.keyboard.down(code);
  await new Promise((r) => setTimeout(r, ms));
  await page.keyboard.up(code);
}

async function sample(label) {
  return page.evaluate((label) => {
    const PE = window.PrincessExplorer;
    const THREE = PE.gfx43.THREE;
    const cam = PE.camera;
    const p = PE.princess.position;
    const head = new THREE.Vector3(p.x, p.y + 1.25, p.z);
    const ndc = head.clone().project(cam);
    const onScreen = ndc.z < 1 && Math.abs(ndc.x) < 0.97 && Math.abs(ndc.y) < 0.97;
    const dir = new THREE.Vector3().subVectors(head, cam.position);
    const dist = dir.length();
    dir.multiplyScalar(1 / Math.max(0.001, dist));
    const ray = new THREE.Raycaster(cam.position, dir, 0.05, Math.max(0.1, dist - 0.45));
    const meshes = [];
    PE.scene.traverse((o) => { if (o.isMesh) meshes.push(o); });
    const hits = ray.intersectObjects(meshes, false).filter((h) => {
      let o = h.object;
      while (o) { if (o === PE.princess) return false; o = o.parent; }
      if (h.object.visible === false) return false;
      const mat = Array.isArray(h.object.material) ? h.object.material[0] : h.object.material;
      if (mat && mat.opacity != null && mat.opacity < 0.2) return false;
      return true;
    });
    const castle = PE.v3.castle;
    let ceil = null;
    if (castle.inCastle && castle.castleIn.group) {
      const pos = new THREE.Vector3();
      const scl = new THREE.Vector3();
      castle.castleIn.group.traverse((o) => {
        if (!o.userData || !o.userData.castleCeil || !o.geometry || !o.geometry.parameters) return;
        const g = o.geometry.parameters;
        o.getWorldPosition(pos);
        o.getWorldScale(scl);
        if (Math.abs(p.x - pos.x) > Math.abs(g.width * scl.x) / 2) return;
        if (Math.abs(p.z - pos.z) > Math.abs(g.depth * scl.z) / 2) return;
        const under = pos.y - Math.abs(g.height * scl.y) / 2;
        if (under < p.y + 1) return;
        ceil = ceil == null ? under : Math.min(ceil, under);
      });
    }
    const hit = hits[0];
    return {
      label,
      onScreen,
      blocked: hits.length > 0,
      hit: hit ? { d: +hit.distance.toFixed(2), y: +hit.point.y.toFixed(2), t: hit.object.geometry && hit.object.geometry.type } : null,
      ndc: { x: +ndc.x.toFixed(2), y: +ndc.y.toFixed(2) },
      camY: +cam.position.y.toFixed(2),
      py: +p.y.toFixed(2),
      ceil: ceil == null ? null : +ceil.toFixed(2),
      below: ceil == null ? true : cam.position.y < ceil - 0.3,
      inside: castle.inCastle,
    };
  }, label);
}

const tall = await page.evaluate(() => {
  const PE = window.PrincessExplorer;
  PE.enterCastle();
  PE.snapCamera();
  const THREE = PE.gfx43.THREE;
  const pos = new THREE.Vector3();
  const scl = new THREE.Vector3();
  let hall = null;
  PE.v3.castle.castleIn.group.traverse((o) => {
    if (!o.userData || !o.userData.castleCeil || !o.geometry || !o.geometry.parameters) return;
    const g = o.geometry.parameters;
    o.getWorldPosition(pos);
    o.getWorldScale(scl);
    if (Math.abs(g.width) > 18 && Math.abs(pos.z - PE.v3.castle.IC.z) < 20) {
      const under = pos.y - Math.abs(g.height * scl.y) / 2;
      hall = hall == null ? under : Math.max(hall, under);
    }
  });
  return { hall: hall == null ? null : +hall.toFixed(2), scale: PE.v3.castle.castleIn.group.scale.y };
});
check("hall ceiling is about 1.9x the old 10 m lid", tall.scale === 1.9 && tall.hall > 16 && tall.hall < 22, JSON.stringify(tall));

const rooms = ["throne", "trophy", "bedroom", "library", "kitchen", "ballroom", "biscuit", "balcony"];
const seen = [];
for (const room of rooms) {
  await page.evaluate((room) => {
    window.PrincessExplorer.teleportRoom(room);
    window.PrincessExplorer.snapCamera();
  }, room);
  await hold("KeyW", 280);
  const mid = await sample(room + "-walk");
  await hold("KeyS", 180);
  const back = await sample(room + "-back");
  seen.push(mid, back);
}
const visibleRooms = seen.every((s) => s.onScreen && !s.blocked && s.below && s.inside);
check("princess stays visible in every castle room", visibleRooms, JSON.stringify(seen.filter((s) => !s.onScreen || s.blocked || !s.below)));

await page.evaluate(() => {
  const PE = window.PrincessExplorer;
  PE.teleportRoom("throne");
  PE.snapCamera();
});
await hold("KeyW", 500);
await hold("KeyZ", 500);
const stairs = await sample("stairs");
check("stairs walk keeps her in view", stairs.onScreen && !stairs.blocked && stairs.below, JSON.stringify(stairs));

const yardSpots = [
  { name: "garden", x: Math.cos(30 * Math.PI / 180) * 30, z: Math.sin(30 * Math.PI / 180) * 30 },
  { name: "terrace", x: Math.cos(142 * Math.PI / 180) * 14.6, z: Math.sin(142 * Math.PI / 180) * 14.6 },
];
const gardenFrames = [];
for (const spot of yardSpots) {
  await page.evaluate((spot) => {
    const PE = window.PrincessExplorer;
    if (PE.v3.castle.inCastle) PE.v3.castle.exitCastle();
    PE.teleport(spot.x, spot.z);
    PE.face(0.4);
    PE.snapCamera();
  }, spot);
  await new Promise((r) => setTimeout(r, 200));
  gardenFrames.push(await sample(spot.name + "-stand"));
  await hold("KeyW", 350);
  gardenFrames.push(await sample(spot.name + "-walk"));
  await hold("KeyA", 250);
  gardenFrames.push(await sample(spot.name + "-side"));
}
const gardenOk = gardenFrames.every((s) => s.onScreen && !s.blocked);
check("princess stays visible in the garden and on the terrace", gardenOk, JSON.stringify(gardenFrames.filter((s) => !s.onScreen || s.blocked)));

const mini = await page.evaluate(async () => {
  const PE = window.PrincessExplorer;
  if (PE.v3.castle.inCastle) PE.v3.castle.exitCastle();
  const opened = PE.v35.open("garden");
  if (PE.v35.start) PE.v35.start();
  await new Promise((r) => setTimeout(r, 2800));
  return { opened, phase: PE.v35.phase, game: PE.v35.game && PE.v35.game.id ? PE.v35.game.id : PE.v35.game };
});
const miniFrames = [];
if (mini.opened) {
  await hold("KeyW", 400);
  miniFrames.push(await sample("mini-w"));
  await hold("KeyA", 300);
  miniFrames.push(await sample("mini-a"));
  await hold("KeyS", 300);
  miniFrames.push(await sample("mini-s"));
}
const miniOk = mini.opened && mini.game === "garden" && miniFrames.every((s) => s.onScreen && !s.blocked);
check("princess stays visible in the garden mini-game", miniOk, JSON.stringify({ mini, miniFrames }));

const realErrors = errors.filter((e) => !/404/.test(e) && !/favicon/i.test(e));
check("no page errors", realErrors.length === 0, realErrors.slice(0, 6).join(" | "));

const failed = failures.filter((f) => !f.ok);
console.log(`\n${failures.length - failed.length} passed, ${failed.length} failed`);
await browser.close();
server.close();
process.exit(failed.length ? 1 : 0);

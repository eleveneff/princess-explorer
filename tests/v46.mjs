/**
 * v4.6 Princess Stream.
 * Run: node tests/v46.mjs
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
await new Promise((r) => server.listen(8773, "127.0.0.1", r));
const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: "new",
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist", "--no-sandbox", "--disable-dev-shm-usage"]
});
const page = await browser.newPage();
page.on("pageerror", (e) => check("page error", false, e.message));
await page.evaluateOnNewDocument((payload) => localStorage.setItem("princess-explorer-save-v1", JSON.stringify(payload)), {
  score: 55, pos: { x: -24, z: -32 }, ver: 3, v45: { layout: 1, moat: 2 }
});
await page.setViewport({ width: 1280, height: 720 });
await page.goto("http://127.0.0.1:8773/index.html?debug=castle", { waitUntil: "networkidle0", timeout: 60000 });
await page.waitForFunction(() => window.PrincessExplorer && window.PrincessExplorer.stream);
const report = await page.evaluate(() => {
  const PE = window.PrincessExplorer;
  document.getElementById("intro")?.classList.add("hidden");
  const S = PE.stream;
  const samples = S.samples();
  const M = { x: 0, z: -1 };
  const ang = (p) => Math.atan2(p.z - M.z, p.x - M.x);
  const rim = (p) => Math.hypot(p.x - M.x, p.z - M.z);
  const near = (p, q, d) => samples.some((s) => Math.hypot(s.x - p, s.z - q) < d);
  const bridges = S.bridges();
  const obs = PE.obstacles || [];
  const bridgeClear = bridges.every((b) => !obs.some((o) => Math.hypot(o.x - b.x, o.z - b.z) < 1.15));
  const spots = PE.care.DEFS.map((d) => PE.care.spot(d.id));
  const clearSpots = spots.every((s) => !samples.some((p) => Math.hypot(p.x - s.x, p.z - s.z) < 3));
  const garden = { x: Math.cos(30 * Math.PI / 180) * 30, z: Math.sin(30 * Math.PI / 180) * 30 };
  const art = { x: 0, z: 30 };
  const around = (c, min, max) => samples.some((s) => { const d = Math.hypot(s.x - c.x, s.z - c.z); return d > min && d < max; });
  const coins = PE.state().score;
  PE.teleport(S.splashAt.x + 3.2, S.splashAt.z);
  PE.gate.step(0.2, 0, 0.2);
  const started = S.splash();
  PE.gate.step(0.8, 0, 0.8);
  const playing = S.splash();
  const dog = PE.scene.getObjectByName("v34-biscuit");
  const dogIn = dog && Math.hypot(dog.position.x - S.splashAt.x, dog.position.z - S.splashAt.z) < 1.2;
  const hump = bridges.every((b) => S.lift(b.x, b.z) > 0.7);
  return {
    sourceR: +Math.hypot(S.source.x, S.source.z).toFixed(1),
    inletOnRim: Math.abs(rim(S.inlet) - 12.28) < 0.45,
    outletOnRim: Math.abs(rim(S.outlet) - 12.28) < 0.45,
    joined: near(S.inlet.x, S.inlet.z, 0.6) && near(S.outlet.x, S.outlet.z, 0.6) && near(S.source.x, S.source.z, 0.6),
    angles: +Math.abs(ang(S.inlet) - ang(S.outlet)).toFixed(2),
    bridgeClear,
    hump,
    bridges: bridges.length,
    clearSpots,
    garden: around(garden, 6, 14),
    art: around(art, 8, 18),
    started, playing, dogIn,
    coinsSame: PE.state().score === coins,
    pos: PE.state().pos,
    streamFlag: PE.state().v45.stream
  };
});
check("the stream runs from the mountains into the moat and out again", report.joined && report.sourceR > 42 && report.inletOnRim && report.outletOnRim, JSON.stringify(report));
check("the inlet and the outlet are on different sides", report.angles > 1.5, JSON.stringify(report.angles));
check("four footbridges are clear to walk and arched", report.bridgeClear && report.hump && report.bridges === 4, JSON.stringify({ clear: report.bridgeClear, hump: report.hump }));
check("the ribbon stays off the activity rings", report.clearSpots, JSON.stringify(report.clearSpots));
check("the stream passes the garden and the art lawn", report.garden && report.art, JSON.stringify(report));
check("Sir Biscuit splashes without changing coins", (report.started === "run" || report.playing === "play") && report.dogIn && report.coinsSame, JSON.stringify(report));
check("a saved position in the stream moves to the bank once", report.streamFlag === 1 && report.pos && Math.hypot(report.pos.x + 24, report.pos.z + 32) > 1.2, JSON.stringify(report.pos));
const stillIn = await page.evaluate(() => {
  const p = window.PrincessExplorer.state().pos;
  return window.PrincessExplorer.stream.inDeep(p.x, p.z);
});
check("the relocated save is on land", stillIn === null, JSON.stringify(report.pos));
const scenery = await page.evaluate(() => window.PrincessExplorer.stream.audit());
check("no scenery sits in the stream", scenery.hits === 0, JSON.stringify(scenery));
const horizon = await page.evaluate(() => window.PrincessExplorer.stream.horizon());
check("the downstream brook fades into the fog and the upstream stops on the hillside", horizon && horizon.downR > 170 && horizon.downFade < 0.02 && horizon.upR > 60 && horizon.upR < 120, JSON.stringify(horizon));
await page.reload({ waitUntil: "networkidle0" });
await page.waitForFunction(() => window.PrincessExplorer && window.PrincessExplorer.stream);
const again = await page.evaluate(() => window.PrincessExplorer.state().pos);
check("reloading does not move that stream position again", again.x === report.pos.x && again.z === report.pos.z, JSON.stringify(again));
const failed = failures.filter((f) => !f.ok);
console.log(`\n${failures.length - failed.length} passed, ${failed.length} failed`);
await browser.close();
server.close();
process.exit(failed.length ? 1 : 0);

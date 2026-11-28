/* Princess Explorer 5.4 — a wider lawn and a swan-boat river.
   Prices, payouts, and old purchases stay. v54 on the save is optional. */
(function () {
  const PE = window.PrincessExplorer;
  if (!PE || !PE.gfx43 || !PE.scene || !PE.care) return;
  const THREE = PE.gfx43.THREE;
  const EDGE = 64;
  const HALF = 3.4;
  const MOAT = { x: 0, z: -1, mid: 9.94 };

  function saveBag() {
    const s = PE.state();
    if (!s.v54 || typeof s.v54 !== "object") s.v54 = { plan: 1, frost: 0, cove: 0, found: 0 };
    const v = s.v54;
    v.plan = 1;
    if (v.frost == null) v.frost = 0;
    if (v.cove == null) v.cove = 0;
    if (v.found == null) v.found = 0;
    return v;
  }

  const SPREAD = {
    observatory: [-30, -18],
    stable: [32, 18],
    maze: [-6, 40],
    training: [34, 42],
    corgi: [22, -4]
  };

  function retarget() {
    const samples = PE.stream && PE.stream.samples ? PE.stream.samples() : [];
    Object.keys(SPREAD).forEach((id) => {
      const d = PE.care.DEFS.find((item) => item.id === id);
      if (!d) return;
      for (let n = 0; n < 10; n++) {
        const x = SPREAD[id][0], z = SPREAD[id][1];
        let ang = Math.atan2(z, x) * 180 / Math.PI;
        if (ang < 0) ang += 360;
        d.ang = ang;
        d.rad = Math.hypot(x, z);
        const spot = PE.care.spot(id);
        let near = null, best = 1e9;
        samples.forEach((s) => {
          const dd = Math.hypot(s.x - spot.x, s.z - spot.z);
          if (dd < best) { best = dd; near = s; }
        });
        if (!near || best > 3.8) break;
        const dx = x - near.x, dz = z - near.z;
        const len = Math.hypot(dx, dz) || 1;
        SPREAD[id][0] += dx / len * 2.2;
        SPREAD[id][1] += dz / len * 2.2;
      }
      const x = SPREAD[id][0], z = SPREAD[id][1];
      let ang = Math.atan2(z, x) * 180 / Math.PI;
      if (ang < 0) ang += 360;
      d.ang = ang;
      d.rad = Math.hypot(x, z);
      const g = PE.scene.getObjectByName("care-" + id);
      if (g) {
        g.position.set(x, 0, z);
        g.rotation.y = Math.PI / 2 - ang * Math.PI / 180;
      }
    });
  }

  function angDiff(a, b) {
    let d = b - a;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return d;
  }

  function centerline() {
    const up = [[-46, -52], [-38, -44], [-30, -36], [-23, -29], [-19.5, -20], [-14, -13], [-8.7, -9.7]];
    const inletA = Math.atan2(-9.7 - MOAT.z, -8.7 - MOAT.x);
    const outletA = Math.atan2(6 - MOAT.z, 10 - MOAT.x);
    const arc = [];
    let a = inletA;
    for (let i = 0; i < 48; i++) {
      arc.push([MOAT.x + Math.cos(a) * MOAT.mid, MOAT.z + Math.sin(a) * MOAT.mid]);
      if (i > 6 && Math.abs(angDiff(a, outletA)) < 0.22) break;
      a -= 0.2;
    }
    const down = [[10, 6], [14, 8], [18, 14], [21, 22], [17, 31], [12, 38], [8, 46], [4, 56], [2, 62]];
    const raw = up.concat(arc, down);
    const pts = [raw[0]];
    raw.forEach((p) => { if (Math.hypot(p[0] - pts[pts.length - 1][0], p[1] - pts[pts.length - 1][1]) > 1.2) pts.push(p); });
    let walked = 0;
    const samples = pts.map((p, i) => {
      const prev = pts[Math.max(0, i - 1)];
      const next = pts[Math.min(pts.length - 1, i + 1)];
      let tx = next[0] - prev[0], tz = next[1] - prev[1];
      const len = Math.hypot(tx, tz) || 1;
      tx /= len; tz /= len;
      if (i) walked += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]);
      return { x: p[0], z: p[1], tx, tz, nx: -tz, nz: tx, dist: walked };
    });
    const total = samples[samples.length - 1].dist || 1;
    samples.forEach((s) => { s.u = s.dist / total; });
    return samples;
  }

  const samples = centerline();
  const totalDist = samples[samples.length - 1].dist || 1;

  function nearest(x, z) {
    let best = samples[0], d = 1e9, iBest = 0;
    samples.forEach((s, i) => {
      const dd = Math.hypot(s.x - x, s.z - z);
      if (dd < d) { d = dd; best = s; iBest = i; }
    });
    return { s: best, d, i: iBest };
  }

  function sampleAt(u) {
    const dist = Math.max(0, Math.min(1, u)) * totalDist;
    let i = 0;
    while (i < samples.length - 2 && samples[i + 1].dist < dist) i++;
    const a = samples[i], b = samples[i + 1];
    const span = (b.dist - a.dist) || 1;
    const t = Math.max(0, Math.min(1, (dist - a.dist) / span));
    return {
      x: a.x + (b.x - a.x) * t,
      z: a.z + (b.z - a.z) * t,
      tx: a.tx + (b.tx - a.tx) * t,
      tz: a.tz + (b.tz - a.tz) * t,
      nx: a.nx + (b.nx - a.nx) * t,
      nz: a.nz + (b.nz - a.nz) * t,
      i
    };
  }

  function ribbon(list, half, y, color, name) {
    const n = list.length;
    const pos = new Float32Array(n * 6);
    const idx = [];
    list.forEach((s, i) => {
      const a = i * 2;
      pos[a * 3] = s.x + s.nx * half;
      pos[a * 3 + 1] = y;
      pos[a * 3 + 2] = s.z + s.nz * half;
      pos[a * 3 + 3] = s.x - s.nx * half;
      pos[a * 3 + 4] = y;
      pos[a * 3 + 5] = s.z - s.nz * half;
      if (i < n - 1) idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide }));
    mesh.name = name;
    mesh.receiveShadow = true;
    return mesh;
  }

  function grassTexture() {
    const c = document.createElement("canvas");
    c.width = c.height = 1024;
    const g = c.getContext("2d");
    g.fillStyle = "#8fce7a";
    g.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 420; i++) {
      const x = (Math.sin(i * 12.1) * 0.5 + 0.5) * 1024;
      const y = (Math.cos(i * 7.3) * 0.5 + 0.5) * 1024;
      g.fillStyle = i % 3 ? "rgba(120,176,90,0.45)" : "rgba(186,214,120,0.4)";
      g.beginPath();
      g.ellipse(x, y, 18 + (i % 5) * 8, 12 + (i % 4) * 6, i, 0, 7);
      g.fill();
    }
    function stroke(points, color, width) {
      g.strokeStyle = color;
      g.lineWidth = width;
      g.lineCap = "round";
      g.beginPath();
      points.forEach((p, i) => {
        const x = (p[0] + EDGE) / (EDGE * 2) * 1024;
        const y = (p[1] + EDGE) / (EDGE * 2) * 1024;
        if (i) g.lineTo(x, y); else g.moveTo(x, y);
      });
      g.stroke();
    }
    Object.keys(SPREAD).forEach((id) => {
      const p = SPREAD[id];
      const r = Math.hypot(p[0], p[1]) || 1;
      stroke([[p[0] * 18 / r, p[1] * 18 / r], p], "rgba(214,186,130,0.95)", 14);
    });
    stroke([[-30, -18], [32, 18], [-6, 40], [34, 42]], "rgba(214,186,130,0.9)", 12);
    for (let i = 0; i < 80; i++) {
      g.fillStyle = ["#f2a3c4", "#f6d56a", "#f7f3ea", "#e07ab0"][i % 4];
      const x = (Math.sin(i * 4.7) * 0.5 + 0.5) * 900 + 40;
      const y = (Math.cos(i * 3.1) * 0.5 + 0.5) * 900 + 40;
      g.beginPath();
      g.arc(x, y, 3 + (i % 3), 0, 7);
      g.fill();
    }
    const tex = new THREE.CanvasTexture(c);
    if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  const root = new THREE.Group();
  root.name = "v54-world";

  function buildWorld() {
    if (PE.scene.getObjectByName("v54-world")) return;
    retarget();
    PE.scene.traverse((o) => {
      if (o.name === "stream-bridge" || o.name === "stream-water") o.visible = false;
    });
    const lawn = new THREE.Mesh(new THREE.RingGeometry(12.5, EDGE, 64, 14), new THREE.MeshLambertMaterial({ map: grassTexture(), color: "#ffffff" }));
    lawn.rotation.x = -Math.PI / 2;
    lawn.position.y = 0.03;
    lawn.name = "v54-lawn";
    lawn.receiveShadow = true;
    shapeHills(lawn);
    root.add(lawn);
    root.add(ribbon(samples, HALF + 1.3, 0.08, "#6e9a55", "v54-bank"));
    root.add(ribbon(samples, HALF * 0.72, 0.12, "#1d6d8a", "v54-bed"));
    const water = ribbon(samples, HALF, 0.2, "#7fd4ee", "v54-water");
    water.material.transparent = true;
    water.material.opacity = 0.92;
    root.add(water);
    dressBanks();

    const frost = nearest(-23, -29);
    const cove = nearest(8, 46);
    frost.s.lock = "frost";
    cove.s.lock = "cove";

    const archWood = new THREE.MeshLambertMaterial({ color: "#8d5a34" });
    const archStone = new THREE.MeshLambertMaterial({ color: "#c4b49a" });
    const woodPos = [];
    const woodIdx = [];
    const stonePos = [];
    const stoneIdx = [];
    const pushInto = (buf) => (x, y, z) => { buf.push(x, y, z); return buf.length / 3 - 1; };
    const quadInto = (idx) => (a, b, c, d) => idx.push(a, c, b, b, c, d);
    const woodPush = pushInto(woodPos);
    const stonePush = pushInto(stonePos);
    const woodQuad = quadInto(woodIdx);
    const stoneQuad = quadInto(stoneIdx);
    [0.18, 0.5, 0.76].forEach((u) => {
      const s = sampleAt(u);
      const span = 7.4;
      const across = span / 2;
      const rise = span / 5;
      const thick = 0.3;
      const under = 2.86;
      const centerTop = under + thick;
      const endTop = centerTop - rise;
      const half = 1.28;
      const steps = 16;
      let prev = null;
      let railL = null;
      let railR = null;
      const at = (lx, along, y) => woodPush(s.x + s.nx * lx + s.tx * along, y, s.z + s.nz * lx + s.tz * along);
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const lx = -across + t * span;
        const top = endTop + Math.sin(t * Math.PI) * rise;
        const ring = [at(lx, -half, top), at(lx, half, top), at(lx, half, top - thick), at(lx, -half, top - thick)];
        if (prev) {
          woodQuad(prev[0], prev[1], ring[0], ring[1]);
          woodQuad(prev[1], prev[2], ring[1], ring[2]);
          woodQuad(prev[2], prev[3], ring[2], ring[3]);
          woodQuad(prev[3], prev[0], ring[3], ring[0]);
        }
        prev = ring;
        const rail = 0.4;
        const lip = 0.07;
        const nextL = [at(lx, -half, top + rail), at(lx, -half - lip, top + rail), at(lx, -half - lip, top + 0.08), at(lx, -half, top + 0.08)];
        const nextR = [at(lx, half, top + rail), at(lx, half + lip, top + rail), at(lx, half + lip, top + 0.08), at(lx, half, top + 0.08)];
        if (railL) {
          woodQuad(railL[0], railL[1], nextL[0], nextL[1]);
          woodQuad(railL[1], railL[2], nextL[1], nextL[2]);
          woodQuad(railR[0], railR[1], nextR[0], nextR[1]);
          woodQuad(railR[1], railR[2], nextR[1], nextR[2]);
        }
        railL = nextL;
        railR = nextR;
        if (i === 0 || i === steps) {
          const sign = i === 0 ? -1 : 1;
          const foot = lx + sign * 0.15;
          const outer = lx + sign * 0.95;
          const y0 = 0;
          const y1 = top + 0.04;
          const box = [
            stonePush(s.x + s.nx * foot + s.tx * -(half + 0.35), y0, s.z + s.nz * foot + s.tz * -(half + 0.35)),
            stonePush(s.x + s.nx * foot + s.tx * (half + 0.35), y0, s.z + s.nz * foot + s.tz * (half + 0.35)),
            stonePush(s.x + s.nx * outer + s.tx * (half + 0.35), y0, s.z + s.nz * outer + s.tz * (half + 0.35)),
            stonePush(s.x + s.nx * outer + s.tx * -(half + 0.35), y0, s.z + s.nz * outer + s.tz * -(half + 0.35)),
            stonePush(s.x + s.nx * foot + s.tx * -(half + 0.35), y1, s.z + s.nz * foot + s.tz * -(half + 0.35)),
            stonePush(s.x + s.nx * foot + s.tx * (half + 0.35), y1, s.z + s.nz * foot + s.tz * (half + 0.35)),
            stonePush(s.x + s.nx * outer + s.tx * (half + 0.35), y1, s.z + s.nz * outer + s.tz * (half + 0.35)),
            stonePush(s.x + s.nx * outer + s.tx * -(half + 0.35), y1, s.z + s.nz * outer + s.tz * -(half + 0.35))
          ];
          stoneQuad(box[4], box[5], box[7], box[6]);
          stoneQuad(box[0], box[3], box[1], box[2]);
          stoneQuad(box[0], box[1], box[4], box[5]);
          stoneQuad(box[1], box[2], box[5], box[6]);
          stoneQuad(box[2], box[3], box[6], box[7]);
          stoneQuad(box[3], box[0], box[7], box[4]);
        }
      }
    });
    const archGeo = new THREE.BufferGeometry();
    archGeo.setAttribute("position", new THREE.Float32BufferAttribute(woodPos, 3));
    archGeo.setIndex(woodIdx);
    archGeo.computeVertexNormals();
    const deck = new THREE.Mesh(archGeo, archWood);
    deck.name = "v54-bridge-garden";
    deck.userData.under = 2.86;
    root.add(deck);
    const stoneGeo = new THREE.BufferGeometry();
    stoneGeo.setAttribute("position", new THREE.Float32BufferAttribute(stonePos, 3));
    stoneGeo.setIndex(stoneIdx);
    stoneGeo.computeVertexNormals();
    const abut = new THREE.Mesh(stoneGeo, archStone);
    abut.name = "v54-bridge-abut";
    root.add(abut);

    ["frost", "cove"].forEach((id) => {
      const hit = id === "frost" ? frost : cove;
      const bar = new THREE.Mesh(new THREE.BoxGeometry(HALF * 2.1, 0.35, 0.28), new THREE.MeshLambertMaterial({ color: "#e2b23a" }));
      bar.position.set(hit.s.x, 0.7, hit.s.z);
      bar.rotation.y = Math.atan2(hit.s.tx, hit.s.tz);
      bar.name = "v54-lock-" + id;
      root.add(bar);
      const sign = signBoard(id === "frost" ? "Frost Lock\n20 coins" : "Cove Lock\n20 coins");
      sign.position.set(hit.s.x + hit.s.nx * (HALF + 1.4), 1.5, hit.s.z + hit.s.nz * (HALF + 1.4));
      root.add(sign);
    });

    const edgeMat = new THREE.MeshLambertMaterial({ color: "#d7e7f2" });
    const frostMere = new THREE.Mesh(new THREE.CircleGeometry(8, 24), edgeMat);
    frostMere.rotation.x = -Math.PI / 2;
    frostMere.position.set(-46, 0.22, -52);
    frostMere.name = "v54-frostmere";
    root.add(frostMere);
    const coveSand = new THREE.Mesh(new THREE.CircleGeometry(9, 24), new THREE.MeshLambertMaterial({ color: "#f0d2a4" }));
    coveSand.rotation.x = -Math.PI / 2;
    coveSand.position.set(2, 0.21, 62);
    coveSand.name = "v54-cove";
    root.add(coveSand);
    const frostSign = signBoard("Frostmere\nA later kingdom");
    frostSign.position.set(-40, 1.6, -48);
    root.add(frostSign);
    const coveSign = signBoard("Coral Cove\nA later kingdom");
    coveSign.position.set(10, 1.6, 58);
    root.add(coveSign);

    plantLawn();
    splash();
    pickups();
    rocks();
    linkPaths();
    const names = { observatory: "Observatory", stable: "Stable", maze: "Maze", training: "Training", corgi: "Sir Biscuit" };
    Object.keys(names).forEach((id) => {
      const p = SPREAD[id];
      const flat = signBoard(names[id]);
      flat.position.set(p[0], 0.2, p[1] + 2.4);
      flat.rotation.x = -Math.PI / 2;
      flat.scale.set(2.4, 2.4, 1);
      root.add(flat);
      const post = signBoard(names[id]);
      post.position.set(p[0], 2.4, p[1] - 2.2);
      root.add(post);
    });
    buildRideSwan();
    paintSky();
    cullFar();
    root.traverse((o) => { if (o.raycast) o.raycast = function () {}; });
    PE.scene.add(root);
    roundActors();
    nudgeSave();
  }

  function signBoard(text) {
    const c = document.createElement("canvas");
    c.width = 512; c.height = 256;
    const g = c.getContext("2d");
    g.fillStyle = "#fff8ea";
    g.fillRect(0, 0, 512, 256);
    g.strokeStyle = "#6a4a22";
    g.lineWidth = 16;
    g.strokeRect(10, 10, 492, 236);
    g.fillStyle = "#3a2a16";
    g.font = "bold 64px Trebuchet MS, sans-serif";
    g.textAlign = "center";
    text.split("\n").forEach((line, i) => g.fillText(line, 256, 100 + i * 72));
    const tex = new THREE.CanvasTexture(c);
    if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    const board = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.1), new THREE.MeshLambertMaterial({ map: tex }));
    board.position.y = 1.4;
    return board;
  }

  function hash(i) {
    const x = Math.sin(i * 127.1 + 19.2) * 43758.5453;
    return x - Math.floor(x);
  }

  function blocked(x, z) {
    if (Math.hypot(x, z) < 22 || Math.hypot(x, z) > EDGE - 3) return true;
    if (nearest(x, z).d < HALF + 2.2) return true;
    if (Object.keys(SPREAD).some((id) => Math.hypot(SPREAD[id][0] - x, SPREAD[id][1] - z) < 7)) return true;
    return false;
  }

  function plantLawn() {
    const spots = [];
    const groves = [[-36, -8], [-18, 28], [28, -24], [40, 22], [-42, 18], [8, -36], [22, 36], [-8, -28], [-12, 4], [-4, -6], [6, 8], [-16, 14], [12, -4], [-8, 16]];
    groves.forEach((g, gi) => {
      const n = 6 + (gi % 3);
      for (let k = 0; k < n; k++) {
        const a = hash(gi * 20 + k) * Math.PI * 2;
        const rad = 1.2 + hash(gi * 20 + k + 5) * (3.5 + (gi % 2));
        const x = g[0] + Math.cos(a) * rad;
        const z = g[1] + Math.sin(a) * rad;
        if (blocked(x, z)) continue;
        const kind = gi % 3;
        const scale = (kind === 2 ? 1.3 : 0.75) + hash(gi + k + 9) * 0.7;
        spots.push([x, z, scale, kind]);
      }
    });
    const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.16, 0.22, 1, 7), new THREE.MeshLambertMaterial({ color: "#8d5a32" }), spots.length);
    const leafG = new THREE.SphereGeometry(1, 10, 8);
    const greens = ["#3f8f45", "#67a84a", "#2f7a55"].map((c) => new THREE.MeshLambertMaterial({ color: c }));
    const leaves = greens.map((m) => new THREE.InstancedMesh(leafG, m, spots.length));
    const dummy = new THREE.Object3D();
    spots.forEach((p, i) => {
      dummy.position.set(p[0], 0.55 * p[2], p[2] ? p[1] : p[1]);
      dummy.position.y = 0.5 * p[2];
      dummy.scale.set(1, p[2], 1);
      dummy.updateMatrix();
      trunk.setMatrixAt(i, dummy.matrix);
      dummy.position.y = p[2] + 0.7;
      const spread = 0.85 + (p[3] === 2 ? 0.45 : 0);
      dummy.scale.set(spread, 0.55 + p[3] * 0.18, spread);
      dummy.updateMatrix();
      const slot = p[3] % 3;
      leaves[slot].setMatrixAt(i, dummy.matrix);
      dummy.scale.set(0, 0, 0);
      dummy.updateMatrix();
      leaves[(slot + 1) % 3].setMatrixAt(i, dummy.matrix);
      leaves[(slot + 2) % 3].setMatrixAt(i, dummy.matrix);
    });
    trunk.name = "v54-trunks";
    root.add(trunk);
    leaves.forEach((m, i) => { m.name = "v54-leaves-" + i; root.add(m); });

    const blooms = [];
    [[-10, 6], [-4, 2], [2, -1], [8, -6], [-14, 10], [6, 4], [-2, 8], [12, 0], [-8, 0], [0, 5]].forEach((m, mi) => {
      for (let k = 0; k < 7; k++) {
        const a = hash(mi * 9 + k + 3) * Math.PI * 2;
        const rad = 0.5 + hash(mi * 3 + k) * 2.4;
        const x = m[0] + Math.cos(a) * rad;
        const z = m[1] + Math.sin(a) * rad;
        if (!blocked(x, z)) blooms.push([x, z]);
      }
    });
    for (let i = 0; i < 160 && blooms.length < 90; i++) {
      const a = hash(i + 40) * Math.PI * 2;
      const r = 24 + hash(i + 50) * 34;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (!blocked(x, z)) blooms.push([x, z]);
    }
    const petal = new THREE.InstancedMesh(new THREE.SphereGeometry(0.28, 8, 6), new THREE.MeshLambertMaterial({ color: "#f27aaa" }), blooms.length * 5);
    const soil = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.7, 0.8, 0.16, 8), new THREE.MeshLambertMaterial({ color: "#7a4e32" }), blooms.length);
    blooms.forEach((p, i) => {
      dummy.position.set(p[0], 0.1, p[1]);
      dummy.scale.set(1, 1, 1);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      soil.setMatrixAt(i, dummy.matrix);
      for (let k = 0; k < 5; k++) {
        const aa = k / 5 * Math.PI * 2;
        dummy.position.set(p[0] + Math.cos(aa) * 0.35, 0.28, p[1] + Math.sin(aa) * 0.35);
        dummy.scale.set(1, 0.7, 1);
        dummy.updateMatrix();
        petal.setMatrixAt(i * 5 + k, dummy.matrix);
      }
    });
    soil.name = "v54-beds";
    petal.name = "v54-blooms";
    root.add(soil, petal);

    [[26, -22], [-18, 22], [42, 28], [-40, 8]].forEach((p, i) => {
      if (blocked(p[0], p[1]) && Math.hypot(p[0], p[1]) < 22) return;
      const g = new THREE.Group();
      g.name = "v54-picnic-" + i;
      g.position.set(p[0], 0, p[1]);
      const cloth = new THREE.Mesh(new THREE.CircleGeometry(1.15, 16), new THREE.MeshLambertMaterial({ color: i % 2 ? "#f7c1d8" : "#f6e7a8" }));
      cloth.rotation.x = -Math.PI / 2;
      cloth.position.y = 0.08;
      g.add(cloth);
      const basket = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), new THREE.MeshLambertMaterial({ color: "#a86b3c" }));
      basket.scale.y = 0.7;
      basket.position.set(0.35, 0.28, 0.1);
      g.add(basket);
      root.add(g);
    });

    [[40, -12], [-42, 12], [6, 52]].forEach((p, i) => {
      const ditch = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 4.2), new THREE.MeshLambertMaterial({ color: "#8ec8e0" }));
      ditch.position.set(p[0], 0.1, p[1]);
      ditch.rotation.y = i * 0.6;
      root.add(ditch);
      const deck = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 2.2), new THREE.MeshLambertMaterial({ color: "#c48a52" }));
      deck.position.set(p[0], 0.45, p[1]);
      deck.rotation.y = i * 0.6;
      deck.name = "v54-footbridge-" + i;
      root.add(deck);
    });
  }

  function splash() {
    const g = new THREE.Group();
    g.name = "v54-splash";
    g.position.set(16, 0, 2);
    const pool = new THREE.Mesh(new THREE.CircleGeometry(2.2, 20), new THREE.MeshLambertMaterial({ color: "#9adcf0" }));
    pool.rotation.x = -Math.PI / 2;
    pool.position.y = 0.12;
    g.add(pool);
    const sand = new THREE.Mesh(new THREE.RingGeometry(2.15, 3.1, 20), new THREE.MeshLambertMaterial({ color: "#f0d7a4" }));
    sand.rotation.x = -Math.PI / 2;
    sand.position.y = 0.1;
    g.add(sand);
    const dog = new THREE.Group();
    dog.name = "v54-biscuit";
    dog.position.set(1.7, 0, 1.5);
    const fur = new THREE.MeshLambertMaterial({ color: "#e2a84a" });
    const cream = new THREE.MeshLambertMaterial({ color: "#f6e2b8" });
    const dark = new THREE.MeshLambertMaterial({ color: "#3a2a22" });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.46, 14, 12), fur);
    body.scale.set(1.15, 0.72, 1.55);
    body.position.y = 0.48;
    dog.add(body);
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), cream);
    belly.scale.set(0.9, 0.55, 1.2);
    belly.position.set(0, 0.36, 0.05);
    dog.add(belly);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 12), fur);
    head.position.set(0, 0.78, 0.62);
    dog.add(head);
    const snout = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), cream);
    snout.scale.set(0.9, 0.7, 1.3);
    snout.position.set(0, 0.7, 0.9);
    dog.add(snout);
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), dark);
    nose.position.set(0, 0.72, 1.05);
    dog.add(nose);
    [[-0.12, 0.86, 0.82], [0.12, 0.86, 0.82]].forEach((p) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), dark);
      eye.position.set(p[0], p[1], p[2]);
      dog.add(eye);
    });
    [[-0.18, 1.05, 0.55], [0.18, 1.05, 0.55]].forEach((p) => {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), fur);
      ear.scale.set(0.7, 1.3, 0.45);
      ear.position.set(p[0], p[1], p[2]);
      dog.add(ear);
    });
    [[-0.22, 0.16, 0.35], [0.22, 0.16, 0.35], [-0.22, 0.16, -0.4], [0.22, 0.16, -0.4]].forEach((p) => {
      const leg = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), fur);
      leg.scale.y = 1.3;
      leg.position.set(p[0], p[1], p[2]);
      dog.add(leg);
    });
    const tail = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), fur);
    tail.position.set(0, 0.7, -0.7);
    dog.add(tail);
    g.add(dog);
    [[-0.4, 0.2, 0.2], [0.6, 0.18, -0.3], [0.1, 0.16, 0.8]].forEach((p, i) => {
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshLambertMaterial({ color: ["#f25d8e", "#6eb6f2", "#f6d34a"][i] }));
      ball.position.set(p[0], p[1], p[2]);
      g.add(ball);
    });
    root.add(g);
  }

  const goods = [];
  function pickups() {
    [[-16, -16], [15, 20], [10, 44]].forEach((p, i) => {
      const hit = nearest(p[0], p[1]);
      const side = i % 2 ? 1.4 : -1.4;
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), new THREE.MeshLambertMaterial({ color: ["#f4d35a", "#f7b7d8", "#d7ecff"][i] }));
      mesh.position.set(hit.s.x + hit.s.nx * side, 0.4, hit.s.z + hit.s.nz * side);
      mesh.name = "v54-pickup-" + i;
      mesh.userData.kind = ["lily", "ribbon", "letter"][i];
      root.add(mesh);
      goods.push(mesh);
    });
  }

  const stones = [];
  function rocks() {
    [[-26, -34], [19, 18], [13, 34]].forEach((p, i) => {
      const hit = nearest(p[0], p[1]);
      const side = i % 2 ? 1.15 : -1.15;
      const rock = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 6), new THREE.MeshLambertMaterial({ color: "#8d8478" }));
      rock.scale.set(1, 0.6, 1.3);
      rock.position.set(hit.s.x + hit.s.nx * side, 0.28, hit.s.z + hit.s.nz * side);
      rock.name = "v54-rock-" + i;
      rock.userData.side = side;
      rock.userData.u = hit.s.u;
      root.add(rock);
      stones.push(rock);
    });
  }

    function linkPaths() {
    const pts = [];
    Object.keys(SPREAD).forEach((id) => {
      const p = SPREAD[id];
      const r = Math.hypot(p[0], p[1]) || 1;
      const a = [p[0] * 18 / r, p[1] * 18 / r];
      for (let i = 0; i < 8; i++) {
        const t = i / 7;
        pts.push([a[0] + (p[0] - a[0]) * t, a[1] + (p[1] - a[1]) * t]);
      }
    });
    const pos = [];
    const idx = [];
    const push = (x, z, nx, nz) => { pos.push(x + nx * 0.55, 0.08, z + nz * 0.55); return pos.length / 3 - 1; };
    for (let i = 0; i < pts.length - 1; i++) {
      if (i % 8 === 7) continue;
      const a = pts[i], b = pts[i + 1];
      let dx = b[0] - a[0], dz = b[1] - a[1];
      const len = Math.hypot(dx, dz) || 1;
      dx /= len; dz /= len;
      const nx = -dz, nz = dx;
      const aL = push(a[0], a[1], nx, nz), aR = push(a[0], a[1], -nx, -nz);
      const bL = push(b[0], b[1], nx, nz), bR = push(b[0], b[1], -nx, -nz);
      idx.push(aL, bL, aR, aR, bL, bR);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
    const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: "#e4c99a" }));
    mesh.name = "v54-paths";
    root.add(mesh);
  }

  function roundActors() {
    function soften(rootNode) {
      if (!rootNode) return;
      rootNode.traverse((o) => {
        if (!o.isMesh || !o.geometry) return;
        const t = o.geometry.type;
        if (t !== "BoxGeometry" && t !== "CylinderGeometry" && t !== "ConeGeometry") return;
        o.geometry = new THREE.SphereGeometry(0.5, 12, 9);
      });
    }
    PE.scene.traverse((o) => {
      if (!o.name || o === PE.princess || o.name.indexOf("v54") === 0 || o.name.indexOf("care-") === 0) return;
      if (/pet|biscuit/i.test(o.name)) soften(o);
    });
  }

  function nudgeSave() {
    const s = PE.state();
    if (!s.pos) return;
    const x = +s.pos.x, z = +s.pos.z;
    if (!isFinite(x) || Math.hypot(x, z) < 12) return;
    const hit = nearest(x, z);
    if (hit.d > HALF - 0.2) return;
    const n = hit.s;
    const sign = ((x - n.x) * n.nx + (z - n.z) * n.nz) >= 0 ? 1 : -1;
    s.pos.x = +(n.x + n.nx * sign * (HALF + 0.9)).toFixed(2);
    s.pos.z = +(n.z + n.nz * sign * (HALF + 0.9)).toFixed(2);
    if (PE.princess && Math.hypot(PE.princess.position.x - x, PE.princess.position.z - z) < 1.5) {
      PE.princess.position.x = s.pos.x;
      PE.princess.position.z = s.pos.z;
    }
  }

  const keys = {};
  window.addEventListener("keydown", (ev) => { keys[ev.code] = true; });
  window.addEventListener("keyup", (ev) => { keys[ev.code] = false; });

  function axes() {
    let fwd = 0, side = 0;
    if (keys.KeyW || keys.ArrowUp) fwd += 1;
    if (keys.KeyZ || keys.ArrowDown) fwd -= 1;
    if (keys.KeyA || keys.ArrowLeft) side -= 1;
    if (keys.KeyS || keys.ArrowRight) side += 1;
    const knob = document.getElementById("joy-knob");
    if (knob && knob.style.transform) {
      const m = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(knob.style.transform);
      if (m) {
        let x = +m[1], y = +m[2];
        const h = Math.hypot(x, y) || 1;
        if (h > 8) { fwd += -y / h; side += x / h; }
      }
    }
    return { fwd: Math.max(-1, Math.min(1, fwd)), side: Math.max(-1, Math.min(1, side)) };
  }

  let river = null;
  let shot = null;
  let rideSwan = null;

  function poseOf(u, side) {
    const s = sampleAt(u);
    const nx = s.nx, nz = s.nz;
    const nlen = Math.hypot(nx, nz) || 1;
    return {
      x: s.x + nx / nlen * side,
      z: s.z + nz / nlen * side,
      yaw: Math.atan2(s.tx, s.tz),
      i: s.i,
      u
    };
  }

  function lockIndex(id) {
    return samples.findIndex((s) => s.lock === id);
  }

  function applyPose(pose) {
    if (!PE.princess || !pose) return;
    const bob = Math.sin(performance.now() / 500) * 0.03;
    PE.princess.position.set(pose.x, 1.15 + bob, pose.z);
    PE.princess.rotation.y = pose.yaw;
    const boat = PE.scene.getObjectByName("care-swan-boat");
    if (boat) boat.visible = false;
    if (rideSwan) {
      rideSwan.visible = true;
      rideSwan.position.set(pose.x, 0.9 + bob, pose.z);
      rideSwan.rotation.y = pose.yaw;
    }
    const onSouth = Math.hypot(pose.x - MOAT.x, pose.z - MOAT.z) < 13 && pose.z > 5 && Math.abs(pose.x) < 3.2;
    window.__swanRaise = !!onSouth;
  }

  function blockedU(u, dir) {
    const v = saveBag();
    for (const id of ["frost", "cove"]) {
      if (v[id]) continue;
      const idx = lockIndex(id);
      if (idx < 0) continue;
      const lu = samples[idx].u;
      if (dir > 0 && river.u <= lu && u > lu) return lu;
      if (dir < 0 && river.u >= lu && u < lu) return lu;
    }
    return null;
  }

  let lastSteer = 0;
  function steer(dt) {
    if (!river || !PE.care.boat.on()) return;
    if (PE.learn && PE.learn.ui && PE.learn.ui.open && PE.learn.ui.open()) return;
    lastSteer = performance.now();
    const a = axes();
    let side = Math.max(-2.1, Math.min(2.1, river.side + a.side * 2.2 * dt));
    let u = river.u + a.fwd * (7.5 / totalDist) * dt;
    const stop = blockedU(u, a.fwd);
    if (stop != null) {
      u = stop;
      if (!river.held) {
        river.held = true;
        const frostU = samples[lockIndex("frost")].u;
        const coveU = samples[lockIndex("cove")].u;
        const id = Math.abs(frostU - stop) <= Math.abs(coveU - stop) ? "frost" : "cove";
        if (coins() < 20) prompt("The lock is 20 coins.");
        else if (PE.learn && PE.learn.lock && !(PE.learn.ui.open && PE.learn.ui.open())) PE.learn.lock.open(id);
      }
    } else river.held = false;
    stones.forEach((rock) => {
      if (Math.abs(rock.userData.u - u) < 0.015 && Math.abs(rock.userData.side - side) < 0.7) {
        side += rock.userData.side > 0 ? -0.35 : 0.35;
        u = river.u;
      }
    });
    river.u = Math.max(0, Math.min(1, u));
    river.side = side;
    const pose = poseOf(river.u, river.side);
    river.yaw = pose.yaw;
    applyPose(pose);
    scoop(pose);
    if (!shot) frameBoat(pose);
  }

  function frameBoat(pose) {
    const back = 8.2, lift = 4.2;
    const tx = Math.sin(pose.yaw), tz = Math.cos(pose.yaw);
    PE.camera.position.set(pose.x - tx * back + tz * 3.2, lift, pose.z - tz * back - tx * 3.2);
    PE.camera.lookAt(pose.x + tx * 2, 1.4, pose.z + tz * 2);
  }

  function scoop(pose) {
    if (!pose) return saveBag().found || 0;
    goods.forEach((item) => {
      if (!item.visible) return;
      if (Math.hypot(item.position.x - pose.x, item.position.z - pose.z) < 1.4) {
        item.visible = false;
        const v = saveBag();
        v.found = (v.found || 0) + 1;
        if (PE.save) PE.save();
      }
    });
    return saveBag().found || 0;
  }
  function coins() { return Math.max(0, Math.floor(+PE.state().score || 0)); }

  function prompt(text) {
    let el = document.getElementById("v54-note");
    if (!el) {
      el = document.createElement("div");
      el.id = "v54-note";
      el.style.cssText = "position:fixed;left:50%;bottom:108px;transform:translateX(-50%);z-index:30;background:#fffaf2;border:4px solid #e7b15a;border-radius:16px;padding:8px 14px;font:700 18px Trebuchet MS,sans-serif;color:#5a3a16;display:none";
      document.body.appendChild(el);
    }
    el.style.display = text ? "block" : "none";
    el.textContent = text || "";
  }

  window.addEventListener("keydown", (ev) => {
    if (ev.key !== "e" && ev.key !== "E") return;
    if (!PE.care.boat.on()) return;
    if (!river) {
      const p = PE.princess.position;
      const out = nearest(10, 6);
      if (Math.hypot(p.x - out.s.x, p.z - out.s.z) < 4) startRiver(out.s.u);
      return;
    }
    const pose = poseOf(river.u, river.side);
    ["frost", "cove"].forEach((id) => {
      const idx = lockIndex(id);
      if (idx < 0 || saveBag()[id]) return;
      const s = samples[idx];
      if (Math.hypot(pose.x - s.x, pose.z - s.z) < 4 && PE.learn && PE.learn.lock) {
        if (coins() < 20) prompt("The lock is 20 coins.");
        else { prompt(""); PE.learn.lock.open(id); }
      }
    });
  });

  function startRiver(u) {
    if (!PE.care.boat.on()) return { ok: false, reason: "dock" };
    river = { u: u == null ? nearest(10, 6).s.u : u, side: 0, yaw: 0 };
    const pose = poseOf(river.u, 0);
    applyPose(pose);
    return { ok: true, u: river.u };
  }

  function stopRiver() {
    river = null;
    prompt("");
    if (rideSwan) rideSwan.visible = false;
    const boat = PE.scene.getObjectByName("care-swan-boat");
    if (boat) boat.visible = true;
  }

  if (PE.gate && PE.gate.step && !PE.gate._v54) {
    const prev = PE.gate.step.bind(PE.gate);
    PE.gate.step = function (dt) {
      const out = prev.apply(this, arguments);
      if (river) steer(typeof dt === "number" ? dt : 0.016);
      return out;
    };
    PE.gate._v54 = 1;
  }

  function loop() {
    if (river && performance.now() - lastSteer > 50 && !shot) steer(0.016);
    if (shot) placeShot(shot);
    if (PE.care.boat.on() && !river) {
      const p = PE.princess.position;
      const out = nearest(10, 6);
      prompt(Math.hypot(p.x - out.s.x, p.z - out.s.z) < 4 ? "Press E to ride the river" : "");
    }
    ["frost", "cove"].forEach((id) => {
      const bar = root.getObjectByName("v54-lock-" + id);
      if (bar) bar.visible = !saveBag()[id];
    });
    requestAnimationFrame(loop);
  }

  function shapeHills(lawn) {
    const attr = lawn.geometry.attributes.position;
    const color = new Float32Array(attr.count * 3);
    for (let i = 0; i < attr.count; i++) {
      const x = attr.getX(i);
      const wz = -attr.getY(i);
      const r = Math.hypot(x, wz);
      const away = nearest(x, wz).d;
      let h = 0;
      if (r > 16 && away > 5.5) {
        const edge = Math.min(1, (r - 16) / 7) * Math.min(1, (away - 5.5) / 2.5);
        const n = Math.sin(x * 0.11 + 0.4) * Math.cos(wz * 0.09) * 1.7 + Math.sin(x * 0.05 - wz * 0.04) * 0.9;
        h = Math.max(0, n) * edge;
      }
      attr.setZ(i, h);
      const meadow = Math.sin(x * 0.1 + wz * 0.04) > 0.25;
      const shade = 0.82 + 0.18 * Math.sin(x * 0.17 + wz * 0.11);
      color[i * 3] = (meadow ? 0.62 : 0.38) * shade;
      color[i * 3 + 1] = (meadow ? 0.74 : 0.66) * shade;
      color[i * 3 + 2] = (meadow ? 0.28 : 0.32) * shade;
    }
    attr.needsUpdate = true;
    lawn.geometry.setAttribute("color", new THREE.BufferAttribute(color, 3));
    lawn.material.vertexColors = true;
    lawn.material.map = null;
    lawn.geometry.computeVertexNormals();
  }
  function dressBanks() {
    const dummy = new THREE.Object3D();
    const reedsAt = [];
    const padsAt = [];
    const pebbles = [];
    samples.forEach((s, i) => {
      if (Math.hypot(s.x, s.z) < 15) return;
      if (i % 4 === 0) {
        reedsAt.push([s.x + s.nx * (HALF + 0.9), s.z + s.nz * (HALF + 0.9)]);
        reedsAt.push([s.x - s.nx * (HALF + 0.7), s.z - s.nz * (HALF + 0.7)]);
      }
      if (i % 6 === 2) padsAt.push([s.x + s.nx * 1.3, s.z + s.nz * 1.3]);
      if (i % 5 === 1) pebbles.push([s.x + s.nx * (HALF + 0.2), s.z + s.nz * (HALF + 0.2)]);
    });
    const reeds = new THREE.InstancedMesh(new THREE.ConeGeometry(0.14, 0.85, 5), new THREE.MeshLambertMaterial({ color: "#2f7a3e" }), Math.max(1, reedsAt.length));
    reedsAt.forEach((p, i) => {
      dummy.position.set(p[0], 0.4, p[1]);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 0.7 + (i % 4) * 0.2, 1);
      dummy.updateMatrix();
      reeds.setMatrixAt(i, dummy.matrix);
    });
    reeds.name = "v54-reeds";
    root.add(reeds);
    const pads = new THREE.InstancedMesh(new THREE.CircleGeometry(0.32, 7), new THREE.MeshLambertMaterial({ color: "#3d9a55" }), Math.max(1, padsAt.length));
    padsAt.forEach((p, i) => {
      dummy.position.set(p[0], 0.23, p[1]);
      dummy.rotation.set(-Math.PI / 2, 0, i);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      pads.setMatrixAt(i, dummy.matrix);
    });
    pads.name = "v54-lilies";
    root.add(pads);
    const stonesI = new THREE.InstancedMesh(new THREE.SphereGeometry(0.16, 6, 5), new THREE.MeshLambertMaterial({ color: "#b7b1a6" }), Math.max(1, pebbles.length));
    pebbles.forEach((p, i) => {
      dummy.position.set(p[0], 0.16, p[1]);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 0.6, 1.2);
      dummy.updateMatrix();
      stonesI.setMatrixAt(i, dummy.matrix);
    });
    stonesI.name = "v54-pebbles";
    root.add(stonesI);
    const rock = new THREE.MeshLambertMaterial({ color: "#9aa3b0" });
    const snow = new THREE.MeshLambertMaterial({ color: "#f7fbff" });
    [[-56, -62, 14], [-46, -68, 18], [-64, -52, 11], [-36, -60, 13]].forEach((p) => {
      const peak = new THREE.Mesh(new THREE.ConeGeometry(p[2] * 0.72, p[2], 6), rock);
      peak.position.set(p[0], p[2] * 0.32, p[1]);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(p[2] * 0.26, p[2] * 0.32, 5), snow);
      cap.position.set(p[0], p[2] * 0.7, p[1]);
      root.add(peak, cap);
    });
    const sea = new THREE.Mesh(new THREE.CircleGeometry(18, 24), new THREE.MeshLambertMaterial({ color: "#3aa0c4" }));
    sea.rotation.x = -Math.PI / 2;
    sea.position.set(8, 0.17, 70);
    const beach = new THREE.Mesh(new THREE.RingGeometry(12, 20, 24), new THREE.MeshLambertMaterial({ color: "#f2d7ae" }));
    beach.rotation.x = -Math.PI / 2;
    beach.position.set(8, 0.15, 68);
    root.add(sea, beach);
    const hedgeSpots = [];
    const wallSpots = [];
    Object.keys(SPREAD).forEach((id) => {
      const p = SPREAD[id];
      const r = Math.hypot(p[0], p[1]) || 1;
      const ax = p[0] * 16 / r, az = p[1] * 16 / r;
      for (let i = 1; i < 6; i++) {
        const t = i / 6;
        const x = ax + (p[0] - ax) * t;
        const z = az + (p[1] - az) * t;
        const yaw = Math.atan2(p[0] - ax, p[1] - az);
        if (i % 2) hedgeSpots.push([x + Math.cos(yaw) * 1.3, z - Math.sin(yaw) * 1.3, yaw]);
        else wallSpots.push([x - Math.cos(yaw) * 1.3, z + Math.sin(yaw) * 1.3, yaw]);
      }
    });
    [[-16, 8], [-10, 6], [-4, 4], [2, 2], [8, 0]].forEach((p, i) => hedgeSpots.push([p[0], p[1], 0.4 + i * 0.05]));
    const hedge = new THREE.InstancedMesh(new THREE.BoxGeometry(1.6, 0.85, 0.4), new THREE.MeshLambertMaterial({ color: "#3f7a32" }), hedgeSpots.length);
    const wall = new THREE.InstancedMesh(new THREE.BoxGeometry(1.5, 0.6, 0.32), new THREE.MeshLambertMaterial({ color: "#c4b49a" }), Math.max(1, wallSpots.length));
    hedgeSpots.forEach((p, i) => {
      dummy.position.set(p[0], 0.42, p[1]);
      dummy.rotation.set(0, p[2], 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      hedge.setMatrixAt(i, dummy.matrix);
    });
    wallSpots.forEach((p, i) => {
      dummy.position.set(p[0], 0.32, p[1]);
      dummy.rotation.set(0, p[2], 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      wall.setMatrixAt(i, dummy.matrix);
    });
    const moundAt = [[-14, 6, 1.5], [-7, -1, 1.9], [3, 7, 1.4], [7, -7, 1.7], [-22, 14, 2.1], [18, 8, 1.6], [14, -16, 1.8], [-28, 4, 1.7], [26, -10, 1.5], [-12, 20, 1.6], [6, 18, 1.3], [-20, -14, 1.8]];
    const mounds = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshLambertMaterial({ color: "#6fa34a" }), moundAt.length);
    moundAt.forEach((p, i) => {
      dummy.position.set(p[0], p[2] * 0.28, p[1]);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(p[2], p[2] * 0.55, p[2] * 0.85);
      dummy.updateMatrix();
      mounds.setMatrixAt(i, dummy.matrix);
    });
    mounds.name = "v54-mounds";
    root.add(mounds);
    hedge.name = "v54-hedges";
    wall.name = "v54-walls";
    root.add(hedge, wall);
  }
  function cullFar() {
    if (!PE.scene || PE.scene.userData.v54cull) return;
    const tmp = new THREE.Vector3();
    PE.scene.traverse((o) => {
      if (!o.isMesh || !o.visible) return;
      let p = o, keep = false;
      while (p) {
        if (p.name === "v54-world" || p.name === "v53-inside" || p === PE.princess) { keep = true; break; }
        p = p.parent;
      }
      if (keep) return;
      o.getWorldPosition(tmp);
      const far = Math.hypot(tmp.x, tmp.z);
      if (far > 22) o.visible = false;
    });
    PE.scene.userData.v54cull = 1;
  }
  function tintSky() {
    if (!PE.scene) return;
    PE.scene.traverse((o) => {
      const m = o.material;
      if (!m || !m.uniforms || !m.uniforms.top || !m.uniforms.mid || !m.uniforms.bot) return;
      m.uniforms.top.value.set("#2f78dc");
      m.uniforms.mid.value.set("#6eb4f6");
      m.uniforms.bot.value.set("#b7dcff");
      o.visible = true;
    });
  }
  function paintSky() {
    if (!PE.scene || PE.scene.userData.v54sky) {
      const dome = PE.scene && PE.scene.userData.v54sky;
      if (dome && dome.position && PE.camera) dome.position.copy(PE.camera.position);
      if (PE.scene) PE.scene.background = PE.scene.userData.v54bg || (PE.scene.userData.v54bg = new THREE.Color("#5aa6ea"));
      if (PE.renderer && PE.renderer.setClearColor) PE.renderer.setClearColor("#5aa6ea");
      tintSky();
      return;
    }
    const c = document.createElement("canvas");
    c.width = 512; c.height = 512;
    const g = c.getContext("2d");
    const sky = g.createLinearGradient(0, 0, 0, 512);
    sky.addColorStop(0, "#3d86e0");
    sky.addColorStop(0.38, "#7eb6f2");
    sky.addColorStop(0.7, "#b7dbfb");
    sky.addColorStop(1, "#d5eefc");
    g.fillStyle = sky;
    g.fillRect(0, 0, 512, 512);
    g.fillStyle = "rgba(255,255,255,0.9)";
    [[90, 70, 34], [180, 48, 26], [280, 90, 40], [390, 60, 28], [140, 130, 22], [330, 120, 24]].forEach(([x, y, r]) => {
      g.beginPath();
      g.ellipse(x, y, r, r * 0.5, 0, 0, 7);
      g.fill();
    });
    const tex = new THREE.CanvasTexture(c);
    if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    PE.scene.background = new THREE.Color("#7eb6f2");
    PE.scene.fog = new THREE.Fog("#c5e6fc", 72, 175);
    const skyMat = new THREE.MeshBasicMaterial({ map: tex, color: "#ffffff", side: THREE.BackSide, depthWrite: false, fog: false });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(420, 28, 16), skyMat);
    dome.name = "v54-sky";
    dome.frustumCulled = false;
    PE.scene.add(dome);
    PE.scene.userData.v54sky = dome;
    const puff = document.createElement("canvas");
    puff.width = 128; puff.height = 64;
    const pg = puff.getContext("2d");
    pg.fillStyle = "rgba(255,255,255,0.92)";
    [[30, 32, 22], [58, 28, 26], [84, 34, 20], [48, 36, 16]].forEach(([x, y, r]) => {
      pg.beginPath();
      pg.ellipse(x, y, r, r * 0.62, 0, 0, 7);
      pg.fill();
    });
    const puffTex = new THREE.CanvasTexture(puff);
    const puffMat = new THREE.SpriteMaterial({ map: puffTex, transparent: true, depthWrite: false, fog: false });
    [[-24, 22, 8], [8, 26, -12], [30, 20, 16], [-6, 28, 28], [18, 24, -28]].forEach((p) => {
      const cloud = new THREE.Sprite(puffMat);
      cloud.position.set(p[0], p[1], p[2]);
      cloud.scale.set(16, 7, 1);
      cloud.name = "v54-cloud";
      PE.scene.add(cloud);
    });
    tintSky();
  }
  function buildRideSwan() {
    const g = new THREE.Group();
    g.name = "v54-ride-swan";
    const white = new THREE.MeshBasicMaterial({ color: "#fffefb" });
    const gold = new THREE.MeshBasicMaterial({ color: "#f08a2a" });
    const dark = new THREE.MeshBasicMaterial({ color: "#1a1a1a" });
    const hullCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.72, -1.6),
      new THREE.Vector3(0, 0.78, -0.4),
      new THREE.Vector3(0, 0.78, 0.6),
      new THREE.Vector3(0, 0.7, 1.5)
    ]);
    const body = new THREE.Mesh(new THREE.TubeGeometry(hullCurve, 12, 0.72, 10, false), white);
    g.add(body);
    const wingL = new THREE.Mesh(new THREE.SphereGeometry(0.9, 12, 8), white);
    wingL.scale.set(0.42, 1.35, 1.35);
    wingL.position.set(-1.15, 1.35, 0.1);
    wingL.rotation.z = 0.55;
    wingL.rotation.y = 0.2;
    const wingR = wingL.clone();
    wingR.position.x = 1.15;
    wingR.rotation.z = -0.5;
    wingR.rotation.y = -0.25;
    g.add(wingL, wingR);
    const neckCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.95, 1.05),
      new THREE.Vector3(0, 1.05, 1.45),
      new THREE.Vector3(0, 1.5, 1.55),
      new THREE.Vector3(0, 1.95, 1.2),
      new THREE.Vector3(0, 2.2, 1.45)
    ]);
    const neck = new THREE.Mesh(new THREE.TubeGeometry(neckCurve, 24, 0.13, 8, false), white);
    g.add(neck);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), white);
    head.position.set(0, 2.28, 1.55);
    g.add(head);
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.38, 8), gold);
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, 2.2, 1.88);
    g.add(beak);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), dark);
    eye.position.set(0.12, 2.36, 1.66);
    const eyeL = eye.clone();
    eyeL.position.x = -0.12;
    g.add(eye, eyeL);
    g.scale.set(1.2, 1.2, 1.2);
    g.renderOrder = 8;
    g.traverse((o) => { if (o.isMesh) o.frustumCulled = false; });
    g.visible = false;
    g.traverse((o) => { if (o.isMesh) o.castShadow = false; });
    rideSwan = g;
    root.add(g);
  }
  let shell = null;
  function meshBig(o) {
    const g = o.geometry;
    if (!g) return false;
    if (!g.boundingBox) g.computeBoundingBox();
    const bb = g.boundingBox;
    if (!bb) return false;
    const sx = (bb.max.x - bb.min.x) * Math.abs(o.scale.x || 1);
    const sy = (bb.max.y - bb.min.y) * Math.abs(o.scale.y || 1);
    const sz = (bb.max.z - bb.min.z) * Math.abs(o.scale.z || 1);
    return Math.max(sx, sy, sz) > 2.6;
  }
  function showShell() {
    if (!shell) {
      shell = [];
      const tmp = new THREE.Vector3();
      const groups = new Set();
      PE.scene.traverse((o) => {
        if (!o.isMesh || !meshBig(o)) return;
        let p = o, skip = false;
        while (p) {
          if (p.name === "v53-inside" || p.name === "v54-world" || p.name === "v53-panorama") skip = true;
          p = p.parent;
        }
        if (skip) return;
        o.getWorldPosition(tmp);
        if (Math.hypot(tmp.x, tmp.z) > 16) return;
        shell.push(o);
        let top = o;
        while (top.parent && top.parent !== PE.scene) top = top.parent;
        if (top !== PE.scene) groups.add(top);
      });
      groups.forEach((g) => {
        g.visible = true;
        g.traverse((c) => { if (c.isMesh && shell.indexOf(c) < 0) c.visible = false; });
      });
    }
    shell.forEach((o) => {
      o.visible = true;
      let p = o.parent;
      while (p && p !== PE.scene) { p.visible = true; p = p.parent; }
    });
  }
  let sprites = null;
  function tameLabels() {
    if (!PE.camera) return;
    if (!sprites) {
      sprites = [];
      PE.scene.traverse((o) => { if (o.isSprite) sprites.push(o); });
    }
    const cam = PE.camera.position;
    const high = cam.y > 16;
    const tmp = new THREE.Vector3();
    sprites.forEach((o) => {
      if (!o.userData.v54drop && o.position.y > 5) {
        o.position.y = 3.3;
        o.userData.v54drop = 1;
      }
      o.getWorldPosition(tmp);
      const d = Math.hypot(tmp.x - cam.x, tmp.z - cam.z);
      o.visible = !high && d > 0.4 && d < 20;
    });
  }
  function showOutdoors() {
    const world = PE.scene && PE.scene.getObjectByName("v54-world");
    if (world) {
      world.visible = true;
      world.traverse((o) => { o.visible = true; });
    }
  }
  function placeShot(name) {
    const cam = PE.camera;
    if (!cam) return;
    showOutdoors();
    if (rideSwan && name !== "bridge") rideSwan.visible = false;
    paintSky();
    const btn = document.getElementById("care-prompt");
    if (btn) btn.style.setProperty("display", "none", "important");
    cam.far = name === "aerial" ? 110 : 160;
    cam.near = 0.3;
    cam.updateProjectionMatrix();
    if (name === "aerial" || name === "castle") showShell();
    if (name === "aerial") {
      cam.position.set(6, 46, 34);
      cam.lookAt(2, 0, 4);
    } else if (name === "bridge" && river) {
      const pose = poseOf(0.42, 0);
      applyPose(pose);
      const s = sampleAt(0.42);
      cam.position.set(pose.x - 5.5, 2.4, pose.z + 7.5);
      cam.lookAt(pose.x, 1.15, pose.z);
    } else if (name === "station") {
      const p = SPREAD.stable;
      cam.position.set(p[0] + 6, 3.2, p[1] + 6);
      cam.lookAt(p[0], 1.8, p[1]);
    } else if (name === "castle") {
      cam.position.set(4, 5.5, 12);
      cam.lookAt(0, 4.5, 0);
    } else if (name === "landscape") {
      cam.position.set(-16, 2.15, 9);
      cam.lookAt(8, 1.7, -4);
    }
  }
  function look(name) {
    shot = name;
    const intro = document.getElementById("intro");
    if (intro) intro.classList.add("hidden");
    document.querySelectorAll("div").forEach((el) => {
      if ((el.textContent || "").trim() === "Yes! Sir Biscuit wags!") el.style.display = "none";
    });
    const layer = document.getElementById("learn-layer");
    if (layer && name !== "lock") layer.classList.remove("show");
    ["care-prompt", "swan-exit", "prompt"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.style.display = "none";
    });
    if (!document.getElementById("v54-hide-prompts")) {
      const css = document.createElement("style");
      css.id = "v54-hide-prompts";
      css.textContent = "#care-prompt,#swan-exit{display:none !important}";
      document.head.appendChild(css);
    }
    if (name === "bridge") {
      if (!PE.care.boat.on() && PE.care.own && PE.care.own("swans")) PE.care.act("swans");
      river = { u: 0.5, side: 0.2, yaw: 0 };
    } else if (name === "station") {
      const p = SPREAD.stable;
      if (PE.princess && !PE.care.boat.on()) {
        PE.princess.position.set(p[0] + 3.4, 0, p[1] + 2.2);
        PE.princess.rotation.y = Math.atan2(-3.4, -2.2);
      }
    } else if (name === "castle") {
      showShell();
      stopRiver();
      if (PE.care.boat.on()) {
        const spot = PE.care.spot("swans");
        PE.care.boat.setAngle(Math.atan2(spot.z + 1, spot.x));
        PE.care.act("swans");
      }
      if (PE.princess) {
        PE.princess.position.set(1.2, 0, 12);
        PE.princess.rotation.y = Math.PI;
      }
    }
    placeShot(name);
    hookRender();
    if (PE.renderer && PE.renderer._v54raw) PE.renderer._v54raw(PE.scene, PE.camera);
    return name;
  }

  function hookRender() {
    const renderer = PE.renderer;
    if (!renderer || renderer._v54) return;
    const render = renderer.render.bind(renderer);
    renderer._v54raw = render;
    let painting = false;
    renderer.render = function (scene, camera) {
      if (painting) return render(scene, camera);
      tameLabels();
      const indoors = PE.v3 && PE.v3.castle && PE.v3.castle.inCastle;
      if (!indoors) {
        showShell();
        if (PE.scene.fog && PE.camera) {
          const high = PE.camera.position.y > 18;
          PE.scene.fog.color.set("#c5e6fc");
          PE.scene.fog.near = high ? 95 : 72;
          PE.scene.fog.far = high ? 200 : 175;
        }
        const dome = PE.scene.userData.v54sky;
        if (dome && dome.position && PE.camera) {
          dome.position.copy(PE.camera.position);
          dome.visible = true;
        }
        tintSky();
        PE.scene.background = PE.scene.userData.v54bg || (PE.scene.userData.v54bg = new THREE.Color("#5aa6ea"));
        if (PE.renderer && PE.renderer.setClearColor) PE.renderer.setClearColor("#5aa6ea");
      }
      const pocket = PE.scene.getObjectByName("v53-inside");
      if (pocket && !indoors && PE.camera && PE.camera.position.x < 180) pocket.visible = false;
      const out = render(scene, camera);
      if (shot) {
        painting = true;
        placeShot(shot);
        render(PE.scene, PE.camera);
        painting = false;
      }
      return out;
    };
    renderer._v54 = 1;
  }
  buildWorld();
  hookRender();
  requestAnimationFrame(loop);

  PE.v54 = {
    edge: () => EDGE,
    spread: () => Object.assign({}, SPREAD),
    samples: () => samples.map((s) => ({ x: +s.x.toFixed(2), z: +s.z.toFixed(2), u: +s.u.toFixed(3), lock: s.lock || "" })),
    nearest,
    start: startRiver,
    stop: stopRiver,
    riding: () => !!river,
    pose: () => (river ? Object.assign(poseOf(river.u, river.side), { side: river.side }) : null),
    axes,
    press: (code, down) => { keys[code] = !!down; },
    steer,
    found: () => saveBag().found || 0,
    grab: () => scoop(river ? poseOf(river.u, river.side) : null),
    bag: saveBag,
    look,
    release: () => { shot = null; },
    bridgeUnder: () => {
      const b = root.getObjectByName("v54-bridge-garden");
      return b ? b.userData.under : 0;
    }
  };
})();

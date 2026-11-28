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
    const lawn = new THREE.Mesh(new THREE.RingGeometry(12.5, EDGE, 72), new THREE.MeshLambertMaterial({ map: grassTexture(), color: "#ffffff" }));
    lawn.rotation.x = -Math.PI / 2;
    lawn.position.y = 0.03;
    lawn.name = "v54-lawn";
    lawn.receiveShadow = true;
    root.add(lawn);
    root.add(ribbon(samples, HALF + 1.3, 0.08, "#6e9a55", "v54-bank"));
    root.add(ribbon(samples, HALF * 0.72, 0.12, "#1d6d8a", "v54-bed"));
    const water = ribbon(samples, HALF, 0.2, "#7fd4ee", "v54-water");
    water.material.transparent = true;
    water.material.opacity = 0.92;
    root.add(water);

    const frost = nearest(-23, -29);
    const cove = nearest(8, 46);
    frost.s.lock = "frost";
    cove.s.lock = "cove";

    const archWood = new THREE.MeshLambertMaterial({ color: "#8d5a34" });
    const archRail = new THREE.MeshLambertMaterial({ color: "#f3d48a" });
    function archStrip(mat, name, lift, halfW) {
      const pos = [];
      const idx = [];
      const push = (x, y, z) => { pos.push(x, y, z); return pos.length / 3 - 1; };
      [0.2, 0.5, 0.74].forEach((u) => {
        const s = sampleAt(u);
        const across = 3.6;
        const steps = 18;
        let prevL = -1, prevR = -1;
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const lx = -across + t * across * 2;
          const y = 0.4 + Math.sin(t * Math.PI) * 2.62 + lift;
          const L = push(s.x + s.nx * lx - s.tx * halfW, y, s.z + s.nz * lx - s.tz * halfW);
          const R = push(s.x + s.nx * lx + s.tx * halfW, y, s.z + s.nz * lx + s.tz * halfW);
          if (i) idx.push(prevL, L, prevR, prevR, L, R);
          prevL = L;
          prevR = R;
        }
      });
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      geo.setIndex(idx);
      geo.computeVertexNormals();
      const mesh = new THREE.Mesh(geo, mat);
      mesh.name = name;
      return mesh;
    }
    const deck = archStrip(archWood, "v54-bridge-garden", 0, 1.35);
    deck.userData.under = 2.84;
    root.add(deck);
    root.add(archStrip(archWood, "v54-bridge-under", -0.22, 1.35));
    root.add(archStrip(archRail, "v54-bridge-rails", 0.5, 1.2));

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
    for (let i = 0; i < 220 && spots.length < 70; i++) {
      const a = hash(i) * Math.PI * 2;
      const r = 22 + hash(i + 3) * (EDGE - 26);
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (!blocked(x, z)) spots.push([x, z, 0.7 + hash(i + 9) * 0.8, hash(i + 4)]);
    }
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
      dummy.scale.set(0.7 + p[3] * 0.5, 0.55 + p[3] * 0.35, 0.7 + p[3] * 0.45);
      dummy.updateMatrix();
      leaves[i % 3].setMatrixAt(i, dummy.matrix);
      leaves[(i + 1) % 3].setMatrixAt(i, dummy.matrix);
      dummy.scale.set(0, 0, 0);
      dummy.updateMatrix();
      leaves[(i + 2) % 3].setMatrixAt(i, dummy.matrix);
    });
    trunk.name = "v54-trunks";
    root.add(trunk);
    leaves.forEach((m, i) => { m.name = "v54-leaves-" + i; root.add(m); });

    const blooms = [];
    for (let i = 0; i < 160 && blooms.length < 48; i++) {
      const a = hash(i + 40) * Math.PI * 2;
      const r = 24 + hash(i + 50) * 34;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (!blocked(x, z)) blooms.push([x, z]);
    }
    const petal = new THREE.InstancedMesh(new THREE.SphereGeometry(0.18, 8, 6), new THREE.MeshLambertMaterial({ color: "#f4a0c4" }), blooms.length * 5);
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
    PE.princess.position.set(pose.x - Math.sin(pose.yaw) * 0.15, 0.95 + bob, pose.z - Math.cos(pose.yaw) * 0.15);
    PE.princess.rotation.y = pose.yaw;
    const boat = PE.scene.getObjectByName("care-swan-boat");
    if (boat) boat.visible = false;
    if (rideSwan) {
      rideSwan.visible = true;
      rideSwan.position.set(pose.x, 0.02 + bob, pose.z);
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
      if (Math.hypot(tmp.x, tmp.z) > 68) o.visible = false;
    });
    PE.scene.userData.v54cull = 1;
  }
  function paintSky() {
    if (!PE.scene || PE.scene.userData.v54sky) return;
    const c = document.createElement("canvas");
    c.width = 512; c.height = 512;
    const g = c.getContext("2d");
    const sky = g.createLinearGradient(0, 0, 0, 512);
    sky.addColorStop(0, "#6eace8");
    sky.addColorStop(0.45, "#b7dbf8");
    sky.addColorStop(1, "#e7f6e4");
    g.fillStyle = sky;
    g.fillRect(0, 0, 512, 512);
    g.fillStyle = "rgba(255,255,255,0.88)";
    [[120, 90, 36], [200, 70, 22], [300, 120, 40], [80, 160, 18], [380, 80, 26], [240, 150, 30]].forEach(([x, y, r]) => {
      g.beginPath();
      g.ellipse(x, y, r, r * 0.55, 0, 0, 7);
      g.fill();
    });
    const tex = new THREE.CanvasTexture(c);
    if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    PE.scene.background = tex;
    PE.scene.fog = new THREE.Fog("#d7eef8", 34, 82);
    PE.scene.userData.v54sky = 1;
  }
  function buildRideSwan() {
    const g = new THREE.Group();
    g.name = "v54-ride-swan";
    const white = new THREE.MeshLambertMaterial({ color: "#fffdf8" });
    const gold = new THREE.MeshLambertMaterial({ color: "#e2b23a" });
    const dark = new THREE.MeshLambertMaterial({ color: "#3a2a22" });
    const hull = new THREE.Mesh(new THREE.SphereGeometry(0.95, 16, 12), white);
    hull.scale.set(0.85, 0.42, 1.7);
    hull.position.set(0, 0.48, -0.05);
    g.add(hull);
    const seat = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 8), white);
    seat.scale.set(1, 0.45, 1);
    seat.position.set(0, 0.72, -0.15);
    g.add(seat);
    const wingL = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), white);
    wingL.scale.set(1.1, 0.22, 0.7);
    wingL.position.set(-0.55, 0.55, 0.05);
    const wingR = wingL.clone();
    wingR.position.x = 0.55;
    g.add(wingL, wingR);
    [[0, 0.7, 0.55], [0, 1.05, 0.85], [0, 1.4, 1.05], [0, 1.7, 1.15]].forEach((p, i) => {
      const neck = new THREE.Mesh(new THREE.SphereGeometry(0.16 - i * 0.01, 8, 6), white);
      neck.position.set(p[0], p[1], p[2]);
      g.add(neck);
    });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), white);
    head.position.set(0, 1.88, 1.28);
    g.add(head);
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.28, 8), gold);
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, 1.84, 1.52);
    g.add(beak);
    [[0.08, 1.96, 1.34], [-0.08, 1.96, 1.34]].forEach((p) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 5), dark);
      eye.position.set(p[0], p[1], p[2]);
      g.add(eye);
    });
    g.visible = false;
    g.traverse((o) => { if (o.isMesh) o.castShadow = false; });
    rideSwan = g;
    root.add(g);
  }
  let shell = null;
  function showShell() {
    if (!shell) {
      shell = [];
      const tmp = new THREE.Vector3();
      PE.scene.traverse((o) => {
        if (!o.isMesh) return;
        let p = o, skip = false;
        while (p) {
          if (p.name === "v53-inside" || p.name === "v54-world" || p.name === "v53-panorama") skip = true;
          p = p.parent;
        }
        if (skip) return;
        o.getWorldPosition(tmp);
        if (Math.hypot(tmp.x, tmp.z) < 16) shell.push(o);
      });
    }
    shell.forEach((o) => { o.visible = true; });
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
      const pose = poseOf(river.u, river.side);
      applyPose(pose);
      const s = sampleAt(river.u);
      cam.position.set(pose.x + s.tx * 6.5 + s.nx * 1.5, 5.2, pose.z + s.tz * 6.5 + s.nz * 1.5);
      cam.lookAt(pose.x, 1.1, pose.z);
    } else if (name === "station") {
      const p = SPREAD.stable;
      cam.position.set(p[0] + 6, 3.2, p[1] + 6);
      cam.lookAt(p[0], 1.8, p[1]);
    } else if (name === "castle") {
      cam.position.set(4, 5.5, 12);
      cam.lookAt(0, 4.5, 0);
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

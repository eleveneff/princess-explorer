/* Princess Explorer 5.3 — second floor, secret library, kingdom veranda.
   Coins, prices, and older purchases stay as they were. */
(function () {
  const FLOOR = 4.2;
  const PRICE = 40;
  const SY = 1.9;
  const held = {};
  let anchor = null;
  let built = false;
  let secret = false;
  let bookOpen = 0;
  let spark = null;
  let panorama = null;
  let root = null;
  let downG = null;
  let upG = null;
  let stairG = null;
  let secretG = null;
  let ribbon = null;
  let bookcase = null;
  let drawCalls = 0;
  let lastRoom = "";
  let lastTread = -1;
  let panoFrom = null;
  let panoAt = 0;
  let savedFog = undefined;
  let clock = 0;
  let streamMat = null;
  let scaleV = null;
  let warmBg = null;
  let savedBg = undefined;
  let balconySky = false;

  function pe() { return window.PrincessExplorer; }
  function three() { const PE = pe(); return PE && PE.gfx43 && PE.gfx43.THREE; }
  function castle() { const PE = pe(); return PE && PE.v3 && PE.v3.castle; }
  function owned() {
    const s = pe().state();
    return !!(s.v45 && s.v45.care && s.v45.care.owned && s.v45.care.owned.upper);
  }
  function has(id) {
    const s = pe().state();
    return !!(s.v45 && s.v45.care && s.v45.care.owned && s.v45.care.owned[id]);
  }
  function bag() {
    const s = pe().state();
    if (!s.v53 || typeof s.v53 !== "object") s.v53 = { plan: 1, upper: owned() ? 1 : 0, secret: 0 };
    s.v53.plan = 1;
    s.v53.upper = owned() ? 1 : 0;
    if (s.v53.secret) secret = true;
    return s.v53;
  }
  function quiet() {
    try { if (pe().learn && pe().learn.quiet && pe().learn.quiet()) return true; } catch (e) { /* sound stays on */ }
    return false;
  }
  function learnOpen() {
    const L = pe().learn;
    return !!(L && L.ui && L.ui.open && L.ui.open());
  }

  const ROOMS = [
    { id: "throne", x0: -4.8, x1: 4.8, z0: -1.4, z1: 3.6, y: 0 },
    { id: "hall", x0: -5.4, x1: 5.4, z0: 3.2, z1: 13.7, y: 0 },
    { id: "biscuit", x0: -13.6, x1: -5.4, z0: 8.5, z1: 13.3, y: 0 },
    { id: "trophy", x0: 5.4, x1: 13.6, z0: 9.3, z1: 13.3, y: 0 },
    { id: "ballroom", x0: -16.6, x1: -5.4, z0: 3.1, z1: 8.2, y: 0 },
    { id: "kitchen", x0: 5.4, x1: 16.6, z0: 3.1, z1: 9.2, y: 0 },
    { id: "landing", x0: -5.4, x1: 5.4, z0: 4.5, z1: 8.1, y: FLOOR, up: true },
    { id: "bedroom", x0: -16.6, x1: -5.4, z0: 3.4, z1: 12.8, y: FLOOR, up: true },
    { id: "studio", x0: 5.4, x1: 16.6, z0: 3.4, z1: 12.8, y: FLOOR, up: true, studio: true },
    { id: "upperhall", x0: -3.6, x1: 3.6, z0: 7.8, z1: 14.5, y: FLOOR, up: true },
    { id: "balcony", x0: -7.4, x1: 7.4, z0: 14.2, z1: 21.4, y: FLOOR, up: true },
    { id: "tunnel", x0: 16.8, x1: 28.6, z0: 6.5, z1: 9.7, y: -2.2, secret: true },
    { id: "library", x0: 28.3, x1: 41.6, z0: 2.2, z1: 14.4, y: -2.2, secret: true }
  ];

  function here(room) {
    const c = castle();
    const PE = pe();
    if (!c || !c.inCastle || !PE.princess) return false;
    const hit = cell(PE.princess.position.x - c.IC.x, PE.princess.position.z - c.IC.z, PE.princess.position.y);
    if (!hit) return false;
    if (room === "hall") return hit.id === "hall" || hit.id === "throne" || hit.id === "stair";
    return hit.id === room;
  }

  function cell(lx, lz, y) {
    if (Math.abs(lx) < 1.9 && lz > 6.15 && lz < 11.2) {
      const t = Math.max(0, Math.min(1, (11.15 - lz) / 5));
      if (!owned() && t > 0.18) return null;
      return { id: "stair", y: t * FLOOR, t: t };
    }
    let best = null;
    let bestD = 99;
    for (let i = 0; i < ROOMS.length; i++) {
      const r = ROOMS[i];
      if (lx < r.x0 || lx > r.x1 || lz < r.z0 || lz > r.z1) continue;
      if (r.up && !owned()) continue;
      if (r.studio && !has("studio")) continue;
      if (r.secret && !secret) continue;
      const d = Math.abs(r.y - y);
      if (d < bestD) { bestD = d; best = r; }
    }
    return best ? { id: best.id, y: best.y, t: 0 } : null;
  }

  function paint(w, h, draw) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    draw(c.getContext("2d"), w, h);
    return c;
  }
  function tex(THREE, canvas, wrap) {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    if (wrap) {
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
    }
    return t;
  }
  function clothCanvas() {
    return paint(1024, 512, (g) => {
      const panels = ["#7a1838", "#5c2a6e", "#8d3b4e"];
      for (let i = 0; i < 3; i++) {
        const x = i * 341;
        g.fillStyle = panels[i];
        g.fillRect(x, 0, 341, 512);
        g.strokeStyle = "#f0d48a";
        g.lineWidth = 18;
        g.strokeRect(x + 28, 28, 286, 456);
        g.strokeStyle = "#f7e7c4";
        g.lineWidth = 4;
        g.strokeRect(x + 48, 48, 246, 416);
        g.fillStyle = "#f4d98a";
        g.beginPath();
        g.arc(x + 170, 230, 62, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = "#fff4f8";
        for (let k = 0; k < 8; k++) {
          const a = k / 8 * Math.PI * 2;
          g.beginPath();
          g.ellipse(x + 170 + Math.cos(a) * 48, 230 + Math.sin(a) * 48, 16, 28, a, 0, Math.PI * 2);
          g.fill();
        }
        g.fillStyle = "#f2c1d4";
        g.beginPath();
        g.arc(x + 170, 230, 16, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = "rgba(255,236,196,0.35)";
        g.fillRect(x + 70, 400, 200, 10);
      }
    });
  }
  function rugCanvas() {
    return paint(512, 512, (g) => {
      g.fillStyle = "#8e3050";
      g.fillRect(0, 0, 512, 512);
      g.fillStyle = "#f0d7a4";
      g.fillRect(18, 18, 476, 476);
      g.fillStyle = "#a33b5c";
      g.fillRect(36, 36, 440, 440);
      g.strokeStyle = "#f7e7c0";
      g.lineWidth = 6;
      g.strokeRect(58, 58, 396, 396);
      g.fillStyle = "#f3d48a";
      g.beginPath();
      g.arc(256, 256, 78, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#f7eef2";
      for (let i = 0; i < 10; i++) {
        const a = i / 10 * Math.PI * 2;
        g.beginPath();
        g.ellipse(256 + Math.cos(a) * 54, 256 + Math.sin(a) * 54, 12, 22, a, 0, Math.PI * 2);
        g.fill();
      }
      g.fillStyle = "#6e2440";
      g.beginPath();
      g.arc(256, 256, 18, 0, Math.PI * 2);
      g.fill();
    });
  }
  function wallCanvas() {
    return paint(512, 512, (g) => {
      g.fillStyle = "#f4ead8";
      g.fillRect(0, 0, 512, 512);
      g.strokeStyle = "rgba(196, 156, 102, 0.28)";
      g.lineWidth = 3;
      for (let y = 40; y < 512; y += 128) {
        for (let x = 40; x < 512; x += 128) {
          g.beginPath();
          g.ellipse(x, y, 36, 50, 0, 0, Math.PI * 2);
          g.stroke();
          g.beginPath();
          g.moveTo(x, y - 20);
          g.quadraticCurveTo(x + 28, y, x, y + 22);
          g.stroke();
        }
      }
    });
  }
  function woodCanvas() {
    return paint(256, 256, (g) => {
      g.fillStyle = "#c48a52";
      g.fillRect(0, 0, 256, 256);
      g.strokeStyle = "rgba(120, 68, 32, 0.35)";
      g.lineWidth = 2;
      for (let y = 8; y < 256; y += 14) {
        g.beginPath();
        g.moveTo(0, y);
        g.bezierCurveTo(80, y + 4, 160, y - 4, 256, y + 1);
        g.stroke();
      }
    });
  }
  function skyCanvas() {
    return paint(1024, 512, (g) => {
      const sky = g.createLinearGradient(0, 0, 0, 512);
      sky.addColorStop(0, "#8eb6e6");
      sky.addColorStop(0.45, "#f2c6d4");
      sky.addColorStop(0.72, "#f6d7a8");
      sky.addColorStop(1, "#f3e2c4");
      g.fillStyle = sky;
      g.fillRect(0, 0, 1024, 512);
      const sun = g.createRadialGradient(700, 360, 10, 700, 360, 180);
      sun.addColorStop(0, "rgba(255,244,210,0.95)");
      sun.addColorStop(1, "rgba(255,244,210,0)");
      g.fillStyle = sun;
      g.fillRect(0, 0, 1024, 512);
      g.fillStyle = "rgba(255,255,255,0.45)";
      g.beginPath();
      g.ellipse(240, 120, 90, 22, 0.2, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.ellipse(420, 90, 70, 16, -0.2, 0, Math.PI * 2);
      g.fill();
    });
  }
  function hillCanvas() {
    return paint(512, 256, (g) => {
      g.fillStyle = "#ffffff";
      g.fillRect(0, 0, 512, 256);
      g.fillStyle = "rgba(70, 90, 70, 0.18)";
      for (let i = 0; i < 7; i++) {
        g.beginPath();
        g.ellipse(40 + i * 74, 170, 50, 28, 0, 0, Math.PI * 2);
        g.fill();
      }
      g.fillStyle = "rgba(255,255,255,0.55)";
      g.beginPath();
      g.ellipse(180, 80, 90, 26, 0, 0, Math.PI * 2);
      g.fill();
    });
  }
  function streamCanvas() {
    return paint(512, 128, (g) => {
      g.clearRect(0, 0, 512, 128);
      const water = g.createLinearGradient(0, 0, 0, 128);
      water.addColorStop(0, "rgba(120, 186, 214, 0.15)");
      water.addColorStop(0.5, "rgba(186, 228, 242, 0.85)");
      water.addColorStop(1, "rgba(90, 150, 186, 0.2)");
      g.fillStyle = water;
      g.fillRect(0, 28, 512, 72);
      g.fillStyle = "rgba(255,255,255,0.85)";
      for (let i = 0; i < 9; i++) {
        g.beginPath();
        g.ellipse(30 + i * 56, 64 + (i % 2) * 8, 16, 3, -0.4, 0, Math.PI * 2);
        g.fill();
      }
    });
  }
  function signCanvas(line, sub) {
    return paint(512, 128, (g) => {
      g.fillStyle = "#f8f1e4";
      g.fillRect(0, 0, 512, 128);
      g.strokeStyle = "#e4c98a";
      g.lineWidth = 8;
      g.strokeRect(6, 6, 500, 116);
      g.fillStyle = "#6e3b4e";
      g.font = "bold 36px Palatino, Georgia, serif";
      g.textAlign = "center";
      g.fillText(line, 256, sub ? 58 : 76);
      if (sub) {
        g.font = "24px Palatino, Georgia, serif";
        g.fillStyle = "#a36b32";
        g.fillText(sub, 256, 96);
      }
    });
  }
  function artCanvas() {
    return paint(256, 256, (g) => {
      const sky = g.createLinearGradient(0, 0, 0, 256);
      sky.addColorStop(0, "#f7d7e4");
      sky.addColorStop(1, "#f6e2b8");
      g.fillStyle = sky;
      g.fillRect(0, 0, 256, 256);
      g.fillStyle = "#7f9a6a";
      g.beginPath();
      g.ellipse(128, 190, 110, 36, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#f2f6fb";
      g.beginPath();
      g.moveTo(128, 48);
      g.lineTo(168, 150);
      g.lineTo(88, 150);
      g.fill();
      g.fillStyle = "#e7c56a";
      g.beginPath();
      g.arc(190, 60, 18, 0, Math.PI * 2);
      g.fill();
    });
  }

  function mergeAdd(THREE, parent, items, mat) {
    if (!items.length) return null;
    const parts = [];
    items.forEach((it) => {
      let g;
      if (it.kind === "plane") {
        g = new THREE.PlaneGeometry(it.w, it.h);
        const uv = g.attributes.uv;
        for (let i = 0; i < uv.count; i++) {
          uv.setXY(i, it.u0 + uv.getX(i) * (it.u1 - it.u0), it.v0 + uv.getY(i) * (it.v1 - it.v0));
        }
        if (it.rx) g.rotateX(it.rx);
        if (it.ry) g.rotateY(it.ry);
      } else if (it.kind === "cyl") {
        g = new THREE.CylinderGeometry(it.rt, it.rb, it.h, it.seg || 8);
        if (it.rx) g.rotateX(it.rx);
      } else {
        g = new THREE.BoxGeometry(it.w, it.h, it.d);
      }
      g.translate(it.x, it.y, it.z);
      parts.push(g.toNonIndexed());
    });
    function concat(list) {
      let n = 0;
      list.forEach((a) => { n += a.length; });
      const out = new Float32Array(n);
      let o = 0;
      list.forEach((a) => { out.set(a, o); o += a.length; });
      return out;
    }
    const geo = new THREE.BufferGeometry();
    const pos = [];
    const nrm = [];
    const uv = [];
    parts.forEach((g) => {
      pos.push(g.attributes.position.array);
      nrm.push(g.attributes.normal.array);
      uv.push(g.attributes.uv.array);
      g.dispose();
    });
    geo.setAttribute("position", new THREE.Float32BufferAttribute(concat(pos), 3));
    geo.setAttribute("normal", new THREE.Float32BufferAttribute(concat(nrm), 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(concat(uv), 2));
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function build(PE, THREE, group) {
    const wallMap = tex(THREE, wallCanvas(), true);
    wallMap.repeat.set(2, 2);
    const plaster = new THREE.MeshLambertMaterial({ map: wallMap, side: THREE.DoubleSide });
    const stone = new THREE.MeshLambertMaterial({ color: "#e7e0d4" });
    const rugMat = new THREE.MeshLambertMaterial({ map: tex(THREE, rugCanvas()) });
    const wood = new THREE.MeshLambertMaterial({ map: tex(THREE, woodCanvas(), true) });
    const woodDark = new THREE.MeshLambertMaterial({ color: "#7a4b2c" });
    const gold = new THREE.MeshLambertMaterial({ color: "#f0d78c", emissive: "#a87820", emissiveIntensity: 0.35 });
    const clothMat = new THREE.MeshLambertMaterial({ map: tex(THREE, clothCanvas()), side: THREE.DoubleSide });
    const glass = new THREE.MeshLambertMaterial({ color: "#f7c1d4", emissive: "#e7a0b8", emissiveIntensity: 0.45, transparent: true, opacity: 0.92 });
    const green = new THREE.MeshLambertMaterial({ color: "#2f6b3a" });
    const red = new THREE.MeshLambertMaterial({ color: "#a33b4a" });
    const cream = new THREE.MeshLambertMaterial({ color: "#f7efe2" });
    const pink = new THREE.MeshLambertMaterial({ color: "#f3b7cb" });
    const biscuit = new THREE.MeshLambertMaterial({ color: "#e6c08a" });
    const biscuitEar = new THREE.MeshLambertMaterial({ color: "#c9844a" });

    root = new THREE.Group();
    root.name = "v53-inside";
    root.scale.y = 1 / SY;
    group.add(root);
    downG = new THREE.Group();
    upG = new THREE.Group();
    stairG = new THREE.Group();
    secretG = new THREE.Group();
    root.add(downG, upG, stairG, secretG);

    const mats = { plaster: plaster, stone: stone, rug: rugMat, wood: wood, woodDark: woodDark, gold: gold, cloth: clothMat, glass: glass, green: green, red: red, cream: cream, pink: pink, biscuit: biscuit, biscuitEar: biscuitEar };
    const bags = { down: {}, up: {}, stair: {}, secret: {} };
    function add(which, mat, item) {
      (bags[which][mat] = bags[which][mat] || []).push(item);
    }
    function box(which, mat, x, y, z, w, h, d) {
      add(which, mat, { kind: "box", x: x, y: y, z: z, w: w, h: h, d: d });
    }
    function cyl(which, mat, x, y, z, rt, rb, h, seg) {
      add(which, mat, { kind: "cyl", x: x, y: y, z: z, rt: rt, rb: rb, h: h, seg: seg || 10 });
    }
    function plane(which, mat, x, y, z, w, h, ry, u0, u1) {
      add(which, mat, { kind: "plane", x: x, y: y, z: z, w: w, h: h, ry: ry || 0, u0: u0 || 0, v0: 0, u1: u1 == null ? 1 : u1, v1: 1 });
    }

    function roomBox(which, x0, x1, z0, z1, y, h, doors) {
      doors = doors || {};
      const cx = (x0 + x1) / 2;
      const cz = (z0 + z1) / 2;
      const w = x1 - x0;
      const d = z1 - z0;
      box(which, "stone", cx, y + 0.05, cz, w, 0.1, d);
      box(which, "rug", cx, y + 0.11, cz, Math.min(w * 0.62, w - 0.8), 0.03, Math.min(d * 0.55, d - 0.8));
      function spans(a, b, gap) {
        if (!gap) return [[a, b]];
        return [[a, gap[0]], [gap[1], b]];
      }
      spans(z0, z1, doors.west).forEach((s) => {
        if (s[1] - s[0] > 0.2) box(which, "plaster", x0, y + h / 2, (s[0] + s[1]) / 2, 0.22, h, s[1] - s[0]);
      });
      spans(z0, z1, doors.east).forEach((s) => {
        if (s[1] - s[0] > 0.2) box(which, "plaster", x1, y + h / 2, (s[0] + s[1]) / 2, 0.22, h, s[1] - s[0]);
      });
      spans(x0, x1, doors.north).forEach((s) => {
        if (s[1] - s[0] > 0.2) box(which, "plaster", (s[0] + s[1]) / 2, y + h / 2, z0, s[1] - s[0], h, 0.22);
      });
      spans(x0, x1, doors.south).forEach((s) => {
        if (s[1] - s[0] > 0.2) box(which, "plaster", (s[0] + s[1]) / 2, y + h / 2, z1, s[1] - s[0], h, 0.22);
      });
      box(which, "gold", cx, y + h - 0.16, z0 + 0.16, Math.max(0.4, w - 0.5), 0.1, 0.1);
      box(which, "gold", cx, y + h - 0.16, z1 - 0.16, Math.max(0.4, w - 0.5), 0.1, 0.1);
      box(which, "woodDark", x0 + 0.16, y + 0.16, cz, 0.1, 0.18, Math.max(0.4, d - 0.5));
      box(which, "woodDark", x1 - 0.16, y + 0.16, cz, 0.1, 0.18, Math.max(0.4, d - 0.5));
      const ceil = new THREE.Mesh(new THREE.BoxGeometry(w, 0.1, d), plaster);
      ceil.position.set(cx, y + h, cz);
      ceil.userData.castleCeil = 1;
      ceil.userData.v51floor = 1;
      (which === "up" ? upG : which === "secret" ? secretG : downG).add(ceil);
    }

    roomBox("down", -5.2, 5.2, 3.3, 13.55, 0, 5.05, { south: [-1.5, 1.5], west: [5.2, 12.5], east: [5.2, 12.5], north: [-2.2, 2.2] });
    roomBox("down", -16.4, -5.2, 3.2, 8.15, 0, 4.9, { east: [4.2, 7.6] });
    roomBox("down", 5.2, 16.4, 3.2, 9.15, 0, 4.9, { west: [4.4, 8.4] });
    roomBox("down", -4.6, 4.6, -1.2, 3.5, 0, 5.05, { south: [-2.2, 2.2] });
    roomBox("down", -13.4, -5.2, 8.5, 13.2, 0, 4.6, { east: [9.6, 12.4] });
    roomBox("down", 5.2, 13.4, 8.5, 13.2, 0, 4.6, { west: [9.6, 12.4] });
    roomBox("up", -16.4, -5.2, 3.5, 12.6, FLOOR, 4.4, { east: [5.2, 8.6] });
    if (has("studio")) roomBox("up", 5.2, 16.4, 3.5, 12.6, FLOOR, 4.4, { west: [5.2, 8.6] });
    else box("up", "woodDark", 5.35, FLOOR + 1.4, 8.2, 0.18, 2.6, 1.5);
    roomBox("up", -4.8, 4.8, 4.6, 7.8, FLOOR, 4.4, { south: [-2.2, 2.2], west: [5.2, 7.4], east: [5.2, 7.4] });
    box("up", "stone", 0, FLOOR + 0.06, 17.6, 12, 0.12, 7.2);
    box("up", "gold", -6.6, FLOOR + 0.55, 20.6, 0.12, 0.9, 7);
    box("up", "gold", 6.6, FLOOR + 0.55, 20.6, 0.12, 0.9, 7);
    box("up", "gold", 0, FLOOR + 0.55, 20.9, 13, 0.9, 0.1);
    for (let i = -5; i <= 5; i++) box("up", "gold", i * 1.05, FLOOR + 0.48, 20.85, 0.06, 0.7, 0.06);

    plane("down", "cloth", 0, 2.6, 3.55, 3.2, 3.4, 0, 0, 0.333);
    plane("down", "cloth", -15.2, 2.5, 3.45, 2.6, 3.1, 0, 0.333, 0.666);
    plane("down", "cloth", -6.8, 2.5, 8, 2.4, 3, Math.PI / 2, 0.666, 1);
    plane("up", "cloth", -12, FLOOR + 2.3, 3.7, 2.8, 2.8, 0, 0, 0.333);
    plane("down", "glass", -10, 2.8, 12.35, 2.2, 1.6, Math.PI, 0, 1);
    plane("down", "glass", 10, 2.8, 12.35, 2.2, 1.6, Math.PI, 0, 1);

    for (let i = 0; i < 10; i++) {
      const z = 10.9 - i * 0.46;
      const y = (i + 1) / 10 * FLOOR;
      box("stair", "wood", 0, y - 0.2, z, 3.35, 0.46, 0.62);
      box("stair", "rug", 0, y + 0.04, z, 1.45, 0.03, 0.46);
      [-1.55, 1.55].forEach((x) => {
        cyl("stair", "gold", x, y + 0.22, z, 0.04, 0.04, 0.42, 6);
      });
    }
    [-1.7, 1.7].forEach((x) => box("stair", "gold", x, 2.3, 8.6, 0.08, 0.1, 4.6));
    box("stair", "woodDark", 0, 0.08, 11.35, 3.6, 0.12, 0.7);

    function chandelier(parent, x, y, z) {
      const g = new THREE.Group();
      g.position.set(x, y, z);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.045, 8, 18), gold);
      ring.rotation.x = Math.PI / 2;
      g.add(ring);
      const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 6), gold);
      chain.position.y = 0.55;
      g.add(chain);
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * Math.PI * 2;
        const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.28, 6), cream);
        candle.position.set(Math.cos(a) * 0.55, 0.12, Math.sin(a) * 0.55);
        g.add(candle);
        const flame = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), gold);
        flame.position.set(Math.cos(a) * 0.55, 0.32, Math.sin(a) * 0.55);
        g.add(flame);
      }
      parent.add(g);
      return g;
    }
    chandelier(downG, 0, 4.15, 8.4);
    chandelier(downG, -11, 4.05, 8);
    if (has("stage")) chandelier(downG, -11, 4.15, 6.2);
    chandelier(downG, 11, 4.05, 8);

    const chair = new THREE.Group();
    chair.position.set(0, 0, 0.2);
    [[-0.28, 0.28, -0.22], [0.28, 0.28, -0.22], [-0.28, 0.28, 0.22], [0.28, 0.28, 0.22]].forEach((p) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.08), woodDark);
      leg.position.set(p[0], p[1], p[2]);
      chair.add(leg);
    });
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.58), pink);
    seat.position.y = 0.56;
    chair.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.08), gold);
    back.position.set(0, 1.05, -0.24);
    chair.add(back);
    downG.add(chair);

    box("down", "wood", 11, 0.55, 8.2, 2.4, 0.12, 1.3);
    cyl("down", "woodDark", 9.9, 0.28, 7.6, 0.06, 0.08, 0.55, 6);
    cyl("down", "woodDark", 12.1, 0.28, 7.6, 0.06, 0.08, 0.55, 6);
    cyl("down", "woodDark", 9.9, 0.28, 8.8, 0.06, 0.08, 0.55, 6);
    cyl("down", "woodDark", 12.1, 0.28, 8.8, 0.06, 0.08, 0.55, 6);
    cyl("down", "cream", 10.4, 0.7, 8.2, 0.1, 0.08, 0.12, 8);
    cyl("down", "cream", 11.6, 0.7, 8.2, 0.1, 0.08, 0.12, 8);
    box("down", "gold", 9.2, 1.3, 10.6, 1.6, 0.08, 0.45);
    cyl("down", "gold", 8.7, 1.55, 10.6, 0.16, 0.12, 0.28, 8);
    cyl("down", "gold", 9.7, 1.55, 10.6, 0.16, 0.12, 0.28, 8);

    bookcase = new THREE.Group();
    bookcase.name = "v53-bookcase";
    bookcase.position.set(15.55, 0, 8.2);
    const caseBack = new THREE.Mesh(new THREE.BoxGeometry(0.28, 2.8, 2.4), woodDark);
    caseBack.position.set(0, 1.5, 0);
    bookcase.add(caseBack);
    for (let row = 0; row < 4; row++) {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.06, 2.2), wood);
      shelf.position.set(-0.12, 0.45 + row * 0.62, 0);
      bookcase.add(shelf);
      for (let col = 0; col < 6; col++) {
        if (row === 2 && col === 4) continue;
        const color = (row + col) % 3 === 0 ? red : (row + col) % 3 === 1 ? green : woodDark;
        const bk = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.48, 0.28), color);
        bk.position.set(-0.22, 0.72 + row * 0.62, -0.9 + col * 0.34);
        bookcase.add(bk);
      }
    }
    const proud = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 0.3), green);
    proud.name = "v53-green-book";
    proud.position.set(-0.42, 1.96, 0.46);
    bookcase.add(proud);
    downG.add(bookcase);
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.38), new THREE.MeshLambertMaterial({ map: tex(THREE, signCanvas("Pull the cheerful book.")) }));
    plaque.position.set(15.2, 3.15, 6.7);
    plaque.rotation.y = -0.4;
    downG.add(plaque);

    const dog = new THREE.Group();
    dog.position.set(14.15, 0, 7.15);
    dog.rotation.y = 0.8;
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), biscuit);
    body.scale.set(1.3, 0.72, 0.8);
    body.position.y = 0.32;
    dog.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), biscuit);
    head.position.set(0.28, 0.42, 0);
    dog.add(head);
    const earL = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), biscuitEar);
    earL.position.set(0.24, 0.52, 0.1);
    dog.add(earL);
    const earR = earL.clone();
    earR.position.z = -0.1;
    dog.add(earR);
    downG.add(dog);

    box("up", "woodDark", -12, FLOOR + 0.28, 9.2, 2.2, 0.35, 1.3);
    box("up", "cream", -12, FLOOR + 0.55, 9.2, 2.05, 0.22, 1.15);
    box("up", "pink", -12.7, FLOOR + 0.72, 9.2, 0.55, 0.16, 0.4);
    box("up", "pink", -11.3, FLOOR + 0.72, 9.2, 0.55, 0.16, 0.4);
    box("up", "gold", -12, FLOOR + 1.15, 8.5, 2.3, 1.3, 0.1);
    const mirror = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.5), new THREE.MeshLambertMaterial({ color: "#d5e7f6", emissive: "#9fc4de", emissiveIntensity: 0.25 }));
    mirror.name = "v53-mirror";
    mirror.position.set(-15.9, FLOOR + 1.7, 8);
    mirror.rotation.y = Math.PI / 2;
    upG.add(mirror);
    box("up", "gold", -15.85, FLOOR + 1.7, 8, 0.08, 1.7, 0.86);

    if (has("studio")) {
      const easel = new THREE.Group();
      easel.position.set(12.2, FLOOR, 6.4);
      const legA = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.8, 0.08), woodDark);
      legA.position.set(-0.28, 0.9, 0);
      legA.rotation.z = 0.08;
      easel.add(legA);
      const legB = legA.clone();
      legB.position.x = 0.28;
      legB.rotation.z = -0.08;
      easel.add(legB);
      const painting = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.05), new THREE.MeshLambertMaterial({ map: tex(THREE, artCanvas()) }));
      painting.position.set(0, 1.25, 0.05);
      easel.add(painting);
      upG.add(easel);
      cyl("up", "red", 10.6, FLOOR + 0.85, 7.6, 0.1, 0.12, 0.16, 8);
      cyl("up", "gold", 10.9, FLOOR + 0.85, 7.6, 0.1, 0.12, 0.16, 8);
      box("up", "wood", 10.75, FLOOR + 0.72, 7.6, 0.7, 0.08, 0.4);
    }

    box("secret", "stone", 22.6, -2.15, 8.1, 11.4, 0.1, 2.8);
    box("secret", "woodDark", 22.6, -0.4, 6.7, 11.2, 3.2, 0.18);
    box("secret", "woodDark", 22.6, -0.4, 9.5, 11.2, 3.2, 0.18);
    box("secret", "woodDark", 22.6, 1.15, 8.1, 11.2, 0.16, 2.8);
    roomBox("secret", 28.5, 41.2, 2.4, 14.2, -2.2, 4.2);
    box("secret", "woodDark", 35, -1.15, 5.1, 3.4, 2.2, 0.28);
    for (let b = 0; b < 8; b++) box("secret", b % 2 ? "green" : "red", 33.6 + b * 0.38, -0.7, 5.28, 0.28, 0.7, 0.12);
    for (let i = 0; i < 4; i++) {
      box("secret", "woodDark", 31 + i * 2.2, -0.3, 3.2, 1.5, 2.6, 0.35);
      box("secret", "woodDark", 31 + i * 2.2, -0.3, 13.2, 1.5, 2.6, 0.35);
      for (let b = 0; b < 4; b++) box("secret", b % 2 ? "green" : "red", 30.5 + i * 2.2 + (b % 2) * 0.4, -0.4, 3.45, 0.3, 0.45, 0.16);
    }
    for (let i = 0; i < 5; i++) {
      cyl("secret", "gold", 18.5 + i * 1.8, -1.1, 8.1, 0.05, 0.05, 0.7, 6);
      const flame = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), gold);
      flame.position.set(18.5 + i * 1.8, -0.7, 8.1);
      secretG.add(flame);
    }
    if (has("nook")) {
      box("secret", "rug", 19.2, -2.05, 8.1, 2.2, 0.04, 1.8);
      box("secret", "pink", 19.2, -1.7, 8.8, 0.7, 0.12, 0.5);
      box("secret", "woodDark", 19.2, -1.35, 9.05, 0.7, 0.55, 0.08);
    }
    const backCase = new THREE.Group();
    backCase.name = "v53-return-book";
    backCase.position.set(40.4, -2.2, 8.2);
    const backWood = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.6, 2.2), woodDark);
    backWood.position.y = 1.4;
    backCase.add(backWood);
    secretG.add(backCase);

    const hillTex = tex(THREE, hillCanvas());
    panorama = new THREE.Group();
    panorama.name = "v53-panorama";
    panorama.visible = false;
    root.add(panorama);
    const skyMat = new THREE.MeshBasicMaterial({ map: tex(THREE, skyCanvas()), side: THREE.BackSide, fog: false });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(90, 28, 18), skyMat);
    sky.name = "v53-sky";
    sky.frustumCulled = false;
    sky.position.set(0, 4, 40);
    panorama.add(sky);
    const bands = [
      { name: "", color: "#6f8f58", x: 0, y: 1.6, z: 30, sx: 80, sy: 4.2, sz: 9 },
      { name: "east-realm", color: "#7e92a4", x: 14, y: 2.6, z: 58, sx: 30, sy: 5.5, sz: 12 },
      { name: "north-realm", color: "#9eb4c8", x: -8, y: 3.4, z: 82, sx: 46, sy: 6.5, sz: 14 },
      { name: "west-realm", color: "#d3dee8", x: 4, y: 4.2, z: 112, sx: 60, sy: 7.5, sz: 16 }
    ];
    bands.forEach((b) => {
      const mat = new THREE.MeshLambertMaterial({ map: hillTex, color: b.color });
      const hill = new THREE.Mesh(new THREE.SphereGeometry(1, 22, 14), mat);
      hill.scale.set(b.sx, b.sy, b.sz);
      hill.position.set(b.x, b.y - b.sy * 0.35, b.z);
      if (b.name) {
        hill.userData.v53realm = b.name;
        const slot = new THREE.Group();
        slot.name = b.name;
        hill.add(slot);
      }
      const shade = new THREE.Mesh(new THREE.CircleGeometry(b.sx * 0.7, 16), new THREE.MeshBasicMaterial({ color: "#6d6458", transparent: true, opacity: 0.18, depthWrite: false }));
      shade.rotation.x = -Math.PI / 2;
      shade.position.set(b.x, 0.05, b.z);
      panorama.add(hill, shade);
    });
    const lawn = new THREE.Mesh(new THREE.CircleGeometry(22, 24), new THREE.MeshLambertMaterial({ color: "#8faf72" }));
    lawn.rotation.x = -Math.PI / 2;
    lawn.position.set(0, 0.02, 30);
    panorama.add(lawn);
    const hedge = new THREE.Mesh(new THREE.BoxGeometry(12, 0.8, 0.6), new THREE.MeshLambertMaterial({ color: "#4f6a40" }));
    hedge.position.set(-6, 0.45, 27);
    const hedge2 = hedge.clone();
    hedge2.position.set(7, 0.45, 29);
    const hedge3 = hedge.clone();
    hedge3.scale.set(0.5, 1, 1);
    hedge3.position.set(1, 0.45, 33);
    panorama.add(hedge, hedge2, hedge3);
    const moat = new THREE.Mesh(new THREE.PlaneGeometry(26, 3.2), new THREE.MeshLambertMaterial({ color: "#7eb6d4" }));
    moat.rotation.x = -Math.PI / 2;
    moat.position.set(0, 0.06, 40);
    panorama.add(moat);
    const terrace = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.6, 0.18, 18), stone);
    terrace.position.set(3.5, 0.16, 26);
    panorama.add(terrace);
    streamMat = new THREE.MeshBasicMaterial({ map: tex(THREE, streamCanvas()), transparent: true, depthWrite: false });
    const stream = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 18), streamMat);
    stream.name = "v53-stream";
    stream.rotation.x = -Math.PI / 2;
    stream.position.set(-3.2, 0.1, 31);
    panorama.add(stream);
    for (let i = 0; i < 5; i++) {
      const glint = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), new THREE.MeshBasicMaterial({ color: "#ffffff" }));
      glint.position.set(-3.2 + (i - 2) * 0.7, 0.2, 26 + i * 2.1);
      glint.userData.glint = 1;
      panorama.add(glint);
    }

    const fill = new THREE.PointLight("#ffe2c4", 0.85, 32, 2);
    fill.name = "v53-fill";
    fill.position.set(0, 3.4, 8);
    root.add(fill);

    spark = [];
    for (let i = 0; i < 8; i++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), i % 2 ? gold : pink);
      s.visible = false;
      s.userData.life = 0;
      PE.scene.add(s);
      spark.push(s);
    }

    ribbon = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.46), new THREE.MeshLambertMaterial({ map: tex(THREE, signCanvas("Upper floor", "40 coins")) }));
    ribbon.name = "v53-ribbon";
    ribbon.position.set(0, 1.7, 11.15);
    root.add(ribbon);

    Object.keys(bags).forEach((which) => {
      const parent = which === "up" ? upG : which === "stair" ? stairG : which === "secret" ? secretG : downG;
      Object.keys(bags[which]).forEach((key) => mergeAdd(THREE, parent, bags[which][key], mats[key]));
    });
    secretG.visible = secret;
    upG.visible = owned();
  }

  function hideOld(group) {
    group.traverse((ch) => {
      if (ch === group) return;
      let p = ch;
      while (p) {
        if (p.name === "v53-inside") return;
        p = p.parent;
      }
      ch.visible = false;
    });
  }

  function localPos() {
    const c = castle();
    const p = pe().princess.position;
    return { x: p.x - c.IC.x, z: p.z - c.IC.z, y: p.y };
  }

  function place(lx, y, lz) {
    const c = castle();
    const p = pe().princess.position;
    p.x = c.IC.x + lx;
    p.y = y;
    p.z = c.IC.z + lz;
    if (anchor) anchor.set(p.x, p.y, p.z);
  }

  function burst() {
    const PE = pe();
    if (!spark || !PE || !PE.princess) return;
    const p = PE.princess.position;
    spark.forEach((s, i) => {
      const a = i / spark.length * Math.PI * 2;
      s.visible = true;
      s.userData.life = 1;
      s.userData.ang = a;
      s.position.set(p.x + Math.cos(a) * 0.45, p.y + 0.45, p.z + Math.sin(a) * 0.45);
    });
  }

  function stepSound() {
    const ctx = pe().audio && pe().audio.ctx;
    if (!ctx || quiet()) return;
    try {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 180;
      o.type = "sine";
      const t = ctx.currentTime;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.02, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.11);
    } catch (err) { /* no audio */ }
  }

  function onKey(ev) {
    held[ev.code] = ev.type === "keydown";
    if (ev.type !== "keydown") return;
    if (ev.code !== "KeyE" && ev.key !== "e" && ev.key !== "E") return;
    const c = castle();
    if (!c || !c.inCastle) return;
    const loc = localPos();
    if (window.PE_V53) window.PE_V53.lastKey = { x: +loc.x.toFixed(2), z: +loc.z.toFixed(2), y: +loc.y.toFixed(2), learnOn: learnOpen(), owned: owned() };
    if (learnOpen()) return;
    if (!owned() && Math.abs(loc.x) < 2.1 && loc.z > 10.15 && loc.z < 11.7 && loc.y < 1.5) {
      ev.preventDefault();
      ev.stopPropagation();
      const res = pe().learn.openGate("upper");
      if (res && res.reason === "short") {
        const note = document.getElementById("prompt-text");
        const bar = document.getElementById("prompt");
        if (note && bar) {
          note.innerHTML = "Upper floor is 40 coins. Earn a few more, then press E.";
          bar.classList.remove("hidden");
        }
      }
      return;
    }
    const dining = Math.abs(loc.x - 15.2) < 1.7 && Math.abs(loc.z - 8.2) < 1.7 && loc.y < 1.6;
    const back = Math.abs(loc.x - 40.2) < 1.6 && Math.abs(loc.z - 8.2) < 1.6 && loc.y < -1;
    if (dining || back) {
      ev.preventDefault();
      ev.stopPropagation();
      secret = true;
      bag().secret = 1;
      if (secretG) secretG.visible = true;
      pe().save && pe().save();
      bookOpen = bookOpen ? 0 : 1;
      if (bookcase) bookcase.rotation.y = bookOpen ? -1.15 : 0;
      const book = bookcase && bookcase.getObjectByName("v53-green-book");
      if (book) book.position.x = bookOpen ? -0.62 : -0.42;
      if (bookOpen && dining) {
        place(18.4, -2.2, 8.1);
        burst();
      } else if (!bookOpen) {
        place(13.6, 0, 8.2);
      } else {
        place(13.6, 0, 8.2);
        bookOpen = 0;
        if (bookcase) bookcase.rotation.y = 0;
      }
    }
  }

  function integrate(dt) {
    const PE = pe();
    const c = castle();
    if (!PE || !c || !c.inCastle || !anchor) return;
    const p = PE.princess.position;
    if (learnOpen()) {
      anchor.set(p.x, p.y, p.z);
      return;
    }
    let mx = 0;
    let mz = 0;
    if (held.KeyW || held.ArrowUp) mz -= 1;
    if (held.KeyZ || held.ArrowDown) mz += 1;
    if (held.KeyA || held.ArrowLeft) mx -= 1;
    if (held.KeyS || held.ArrowRight) mx += 1;
    if (!(mx || mz)) {
      anchor.set(p.x, p.y, p.z);
      return;
    }
    const len = Math.hypot(mx, mz) || 1;
    const vx = mx / len;
    const vz = mz / len;
    const step = 4.2 * dt;
    const nx = anchor.x + vx * step;
    const nz = anchor.z + vz * step;
    const loc = cell(nx - c.IC.x, nz - c.IC.z, anchor.y);
    if (!loc) return;
    anchor.set(nx, loc.y, nz);
    p.x = nx;
    p.y = loc.y;
    p.z = nz;
    const tread = loc.id === "stair" ? Math.floor(loc.t * 10) : -1;
    if (lastTread >= 0 && tread >= 0 && tread !== lastTread) stepSound();
    lastTread = tread;
  }

  function applyRoom(where) {
    if (downG) downG.visible = !where || where.y < 2.4 || (where.id === "stair" && where.y < 3.6);
    if (upG) upG.visible = !!owned() && !!where && (where.y > 1.6 || where.id === "balcony" || where.id === "landing");
    if (stairG) stairG.visible = true;
    if (secretG) secretG.visible = secret && !!where && (where.id === "tunnel" || where.id === "library" || where.y < -1);
    if (ribbon) ribbon.visible = !owned();
    const onBalcony = !!(where && where.id === "balcony");
    if (panorama) panorama.visible = onBalcony;
    if (PE && PE.scene && onBalcony !== balconySky) {
      balconySky = onBalcony;
      const THREE = three();
      if (onBalcony && THREE) {
        if (!warmBg) warmBg = new THREE.Color("#f4d2c0");
        if (savedBg === undefined) savedBg = PE.scene.background || null;
        PE.scene.background = warmBg;
      } else if (savedBg !== undefined) {
        PE.scene.background = savedBg;
        savedBg = undefined;
      }
      PE.scene.traverse((o) => {
        if (o.isPoints) {
          if (onBalcony) {
            if (o.userData.v53sky == null) o.userData.v53sky = o.visible;
            o.visible = false;
          } else if (o.userData.v53sky != null) {
            o.visible = o.userData.v53sky;
            delete o.userData.v53sky;
          }
          return;
        }
        if (!o.isMesh || o.name === "v53-stream") return;
        let p = o;
        while (p) {
          if (p.name === "v53-panorama" || p.name === "v53-inside") return;
          p = p.parent;
        }
        if (!o.geometry) return;
        if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
        const sphere = o.geometry.boundingSphere;
        if (!sphere) return;
        const THREE = three();
        if (!scaleV && THREE) scaleV = new THREE.Vector3();
        if (!scaleV) return;
        o.getWorldScale(scaleV);
        const rad = sphere.radius * Math.max(Math.abs(scaleV.x), Math.abs(scaleV.y), Math.abs(scaleV.z));
        if (rad < 40) return;
        if (onBalcony) {
          if (o.userData.v53sky == null) o.userData.v53sky = o.visible;
          o.visible = false;
        } else if (o.userData.v53sky != null) {
          o.visible = o.userData.v53sky;
          delete o.userData.v53sky;
        }
      });
    }
    const PE = pe();
    if (PE && PE.scene) {
      if (where && where.id === "balcony") {
        if (savedFog === undefined) savedFog = PE.scene.fog || null;
        if (!PE.scene.fog || PE.scene.fog.name !== "v53fog") {
          const THREE = three();
          const fog = new THREE.FogExp2("#d7e3ef", 0.013);
          fog.name = "v53fog";
          PE.scene.fog = fog;
        }
      } else if (savedFog !== undefined) {
        PE.scene.fog = savedFog;
        savedFog = undefined;
      }
    }
  }

  function frame(cam, p, ic, where, dt) {
    const THREE = three();
    const lx = p.x - ic.x;
    const lz = p.z - ic.z;
    const phone = window.innerWidth < 820;
    const y = p.y;
    if (where.id === "balcony") {
      const goal = new THREE.Vector3(ic.x + (phone ? 2.2 : 3.2), y + (phone ? 1.8 : 2.5), ic.z + 15.4);
      const look = new THREE.Vector3(ic.x + 0.2, y - 0.8, ic.z + 42);
      if (!panoFrom) {
        panoFrom = cam.position.clone();
        panoAt = performance.now();
      }
      const e = Math.min(1, (performance.now() - panoAt) / 1000);
      const s = e * e * (3 - 2 * e);
      cam.position.lerpVectors(panoFrom, goal, Math.max(s, 0.15));
      cam.lookAt(look);
      const dome = panorama && panorama.getObjectByName("v53-sky");
      if (dome) {
        dome.position.copy(cam.position);
        panorama.worldToLocal(dome.position);
      }
      return;
    }
    panoFrom = null;
    const shots = {
      hall: [0.8, y + 2.15, 13.2, 0, y + 1.05, 6.4],
      stair: [1.8, y + 2.15, 12.85, 0, y + 1.35, 8.4],
      throne: [0.2, y + 2.4, 5.8, 0, y + 1.0, 0.2],
      ballroom: [-11.4, y + 2.2, 7.5, -15.2, y + 1.45, 4.2],
      kitchen: [11.2, y + 2.15, 4.7, 15.4, y + 1.35, 7.5],
      biscuit: [-8.2, y + 2.4, 12.5, -11.4, y + 0.9, 10.2],
      trophy: [8.2, y + 2.4, 12.5, 10.6, y + 1.2, 10.2],
      tunnel: [lx - 3.2, y + 1.25, lz + 0.9, lx + 5.5, y + 0.55, lz - 0.15],
      library: [34.2, y + 1.7, 9.8, 35.2, y + 0.15, 5.1],
      bedroom: [-11.4, y + 2.15, 11.9, -14.8, y + 1.15, 8.2],
      studio: [14.2, y + 2.2, 10.4, 11.4, y + 1.25, 6.2],
      landing: [0.4, y + 2.7, 9.4, 0, y + 1.2, 5.4],
      upperhall: [lx, y + 2.4, lz + 3.2, lx, y + 1.1, lz - 2]
    };
    const s = shots[where.id] || [lx, y + 2.6, lz + 3.4, lx, y + 1.1, lz - 1];
    if (phone && (where.id === "hall" || where.id === "stair")) {
      cam.position.set(ic.x + 0.4, y + 2.6, ic.z + 12.8);
      cam.lookAt(ic.x, y + 1.05, ic.z + 6.5);
      return;
    }
    cam.position.set(ic.x + s[0], s[1], ic.z + s[2]);
    cam.lookAt(ic.x + s[3], s[4], ic.z + s[5]);
  }

  function tick(dt) {
    const PE = pe();
    const c = castle();
    if (!PE || !c) return;
    clock += dt;
    if (streamMat && streamMat.map) streamMat.map.offset.x = (clock * 0.08) % 1;
    if (panorama && panorama.visible) {
      panorama.traverse((o) => {
        if (o.userData && o.userData.glint) o.scale.setScalar(0.65 + Math.sin(clock * 4 + o.position.z) * 0.4);
      });
    }
    if (!c.inCastle) {
      const p = PE.princess.position;
      if (Math.abs(p.x) < 3 && p.z > 11.55 && p.z < 13.2) c.enterCastle();
      anchor = null;
      if (panorama) panorama.visible = false;
      return;
    }
    if (!anchor) anchor = PE.princess.position.clone();
    integrate(dt);
    const p = PE.princess.position;
    const loc = localPos();
    const where = cell(loc.x, loc.z, anchor ? anchor.y : loc.y);
    if (where && where.id === "hall" && loc.z > 13.45 && Math.abs(loc.x) < 1.8 && loc.y < 0.4) {
      c.exitCastle();
      PE.teleport(0.2, 10.2);
      PE.princess.position.y = 0;
      anchor = null;
      applyRoom(null);
      return;
    }
    if (where && where.y != null) {
      p.y = where.y;
      if (anchor) anchor.y = where.y;
    }
    if (c.castleIn && c.castleIn.group && clock < 3 && Math.floor(clock * 2) !== Math.floor((clock - dt) * 2)) hideOld(c.castleIn.group);
    if (where && where.id !== lastRoom) {
      if (where.id === "library") burst();
      lastRoom = where.id;
    }
    applyRoom(where);
    if (spark) {
      spark.forEach((s) => {
        if (s.userData.life > 0) {
          s.userData.life -= dt;
          const a = s.userData.ang + (1 - s.userData.life) * 2;
          const rad = 0.45 + (1 - s.userData.life) * 0.35;
          s.position.set(p.x + Math.cos(a) * rad, p.y + 0.35 + (1 - s.userData.life) * 0.7, p.z + Math.sin(a) * rad);
          s.visible = s.userData.life > 0;
        }
      });
    }
    if (PE.renderer && PE.renderer.info) drawCalls = PE.renderer.info.render.calls;
  }

  function hookCamera(PE, THREE, c) {
    const prev = c.placeInteriorCamera.bind(c);
    let last = performance.now();
    c.placeInteriorCamera = function (cam, offset, info) {
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      prev(cam, offset, info);
      if (!c.inCastle) {
        if (panorama) panorama.visible = false;
        panoFrom = null;
        return;
      }
      const p = PE.princess.position;
      const guess = anchor ? anchor.y : p.y;
      const loc = cell(p.x - c.IC.x, p.z - c.IC.z, guess);
      if (loc) {
        p.y = loc.y;
        if (anchor) anchor.y = loc.y;
      }
      if (loc) frame(cam, p, c.IC, loc, dt);
    };
  }

  function hookEnter(c, PE) {
    const orig = c.enterCastle.bind(c);
    c.enterCastle = function () {
      const out = orig();
      place(0, 0, 12.15);
      PE.face && PE.face(Math.PI);
      if (PE.camera) {
        PE.camera.position.set(c.IC.x + 0.4, 3.05, c.IC.z + 12.9);
        PE.camera.lookAt(c.IC.x, 1.3, c.IC.z + 6);
      }
      burst();
      anchor = PE.princess.position.clone();
      lastRoom = "hall";
      return out;
    };
  }

  function boot() {
    const PE = pe();
    const THREE = three();
    const c = castle();
    if (!PE || !THREE || !c || !c.castleIn || !c.IC || !PE.learn || !PE.care) {
      setTimeout(boot, 40);
      return;
    }
    if (built) return;
    built = true;
    bag();
    hideOld(c.castleIn.group);
    build(PE, THREE, c.castleIn.group);
    hookCamera(PE, THREE, c);
    hookEnter(c, PE);
    const ask = PE.care.ask.bind(PE.care);
    PE.care.ask = function (id) {
      if (id !== "upper") return ask(id);
      const score = Math.max(0, Math.floor(+PE.state().score || 0));
      if (owned()) return { ok: false, reason: "owned", score };
      return { ok: true, pending: true, id: "upper", price: PRICE, name: "Upper Floor", score };
    };
    const commit = PE.care.commit.bind(PE.care);
    PE.care.commit = function (id) {
      if (id !== "upper") return commit(id);
      const score = Math.max(0, Math.floor(+PE.state().score || 0));
      if (owned()) return { ok: false, reason: "owned", score };
      if (score < PRICE) return { ok: false, reason: "short", score };
      PE.state().score = score - PRICE;
      const v = PE.state();
      if (!v.v45) v.v45 = {};
      if (!v.v45.care) v.v45.care = { owned: {}, spent: 0 };
      if (!v.v45.care.owned) v.v45.care.owned = {};
      v.v45.care.owned.upper = 1;
      v.v45.care.spent = (v.v45.care.spent || 0) + PRICE;
      if (!v.v45.spend) v.v45.spend = {};
      v.v45.spend.care = (v.v45.spend.care || 0) + PRICE;
      bag();
      if (upG) upG.visible = true;
      if (ribbon) ribbon.visible = false;
      if (PE.save) PE.save();
      return { ok: true, score: PE.state().score, price: PRICE };
    };
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("keyup", onKey, true);
    let last = performance.now();
    function loop(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      try { tick(dt); } catch (err) { PE.v53error = String(err && err.message || err); }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
    const ic = c.IC;
    const pos = PE.state().pos;
    if (pos && !PE.state().v53moved) {
      const lx = pos.x - ic.x;
      const lz = pos.z - ic.z;
      if (Math.abs(lx) < 30 && lz > -30 && lz < 24 && Math.abs(pos.x) > 200) {
        PE.state().pos = { x: +(ic.x).toFixed(2), z: +(ic.z + 12.4).toFixed(2) };
        PE.state().v53moved = 1;
        if (PE.save) PE.save();
      }
    }
    window.__GAME_VERSION__ = "v5.3";
    try { PE.version = "v5.3"; } catch (e) { /* getter */ }
    const api = {
      version: "v5.3",
      here: here,
      room: () => {
        if (!c.inCastle) return "";
        const loc = localPos();
        const hit = cell(loc.x, loc.z, anchor ? anchor.y : loc.y);
        return hit ? hit.id : "";
      },
      atFoot: () => {
        if (!c.inCastle || owned()) return false;
        const loc = localPos();
        return Math.abs(loc.x) < 2.1 && loc.z > 10.15 && loc.z < 11.7 && loc.y < 1.5;
      },
      owned: owned,
      secret: () => secret,
      price: PRICE,
      drawCalls: () => drawCalls,
      realms: () => ["east-realm", "north-realm", "west-realm"],
      error: ""
    };
    window.PE_V53 = api;
    PE.v53 = api;
  }
  boot();
})();

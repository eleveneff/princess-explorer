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
  let stairAsk = false;
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
  let roomBg = null;
  let savedBg = undefined;
  let balconySky = false;
  let gameSky = null;
  let sparkHome = null;
  let moteHome = null;
  let clearHold = null;
  let clearSaved = false;
  let cloaked = [];
  let panoAngle = -1;

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
    if (s.v47 && s.v47.passed && s.v47.passed.passage) secret = true;
    if (secret) s.v53.secret = 1;
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
    if (Math.abs(lx) < 1.9 && lz > 6.7 && lz < 11.2) {
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
      sky.addColorStop(0, "#9ecbf2");
      sky.addColorStop(0.4, "#c5e3f8");
      sky.addColorStop(0.72, "#e7f4fb");
      sky.addColorStop(1, "#f6f3ee");
      g.fillStyle = sky;
      g.fillRect(0, 0, 1024, 512);
      const sun = g.createRadialGradient(760, 150, 8, 760, 150, 90);
      sun.addColorStop(0, "rgba(255,248,214,0.95)");
      sun.addColorStop(0.35, "rgba(255,214,140,0.45)");
      sun.addColorStop(1, "rgba(255,214,140,0)");
      g.fillStyle = sun;
      g.fillRect(640, 40, 240, 220);
      g.fillStyle = "rgba(255,255,255,0.72)";
      [[140, 78, 78, 16], [310, 56, 64, 14], [520, 96, 86, 18], [880, 70, 54, 12]].forEach((c) => {
        g.beginPath();
        g.ellipse(c[0], c[1], c[2], c[3], 0.15, 0, Math.PI * 2);
        g.fill();
        g.beginPath();
        g.ellipse(c[0] + 28, c[1] + 4, c[2] * 0.6, c[3] * 0.8, 0, 0, Math.PI * 2);
        g.fill();
      });
    });
  }
  function puffCanvas() {
    return paint(256, 128, (g) => {
      g.clearRect(0, 0, 256, 128);
      const puff = g.createRadialGradient(128, 64, 8, 128, 64, 110);
      puff.addColorStop(0, "rgba(255,255,255,0.92)");
      puff.addColorStop(0.55, "rgba(255,255,255,0.55)");
      puff.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = puff;
      [[70, 68, 48, 22], [128, 58, 62, 26], [186, 70, 46, 20]].forEach((c) => {
        g.beginPath();
        g.ellipse(c[0], c[1], c[2], c[3], 0, 0, Math.PI * 2);
        g.fill();
      });
    });
  }
  function sunCanvas() {
    return paint(128, 128, (g) => {
      const sun = g.createRadialGradient(64, 64, 4, 64, 64, 62);
      sun.addColorStop(0, "rgba(255,250,230,1)");
      sun.addColorStop(0.22, "rgba(255,236,180,0.95)");
      sun.addColorStop(0.5, "rgba(255,210,140,0.35)");
      sun.addColorStop(1, "rgba(255,210,140,0)");
      g.fillStyle = sun;
      g.fillRect(0, 0, 128, 128);
    });
  }
  function kingdomCanvas() {
    return paint(1024, 512, (g) => {
      const lawn = g.createLinearGradient(0, 0, 0, 512);
      lawn.addColorStop(0, "#6f9a45");
      lawn.addColorStop(0.45, "#87b15a");
      lawn.addColorStop(1, "#b7c99a");
      g.fillStyle = lawn;
      g.fillRect(0, 0, 1024, 512);
      g.fillStyle = "#d9d1c2";
      g.fillRect(360, 0, 300, 70);
      g.fillStyle = "#c9bfae";
      for (let i = 0; i < 8; i++) g.fillRect(370 + (i % 4) * 70, 8 + Math.floor(i / 4) * 28, 62, 22);
      g.strokeStyle = "#7eb4d2";
      g.lineWidth = 34;
      g.beginPath();
      g.ellipse(512, 118, 168, 46, 0, 0, Math.PI * 2);
      g.stroke();
      g.strokeStyle = "rgba(255,255,255,0.75)";
      g.lineWidth = 3;
      g.beginPath();
      g.ellipse(512, 108, 150, 28, 0, 0.2, 2.4);
      g.stroke();
      g.strokeStyle = "#8fd0e6";
      g.lineWidth = 16;
      g.lineCap = "round";
      g.beginPath();
      g.moveTo(430, 150);
      g.bezierCurveTo(520, 190, 390, 250, 560, 300);
      g.bezierCurveTo(700, 340, 480, 390, 620, 470);
      g.stroke();
      g.strokeStyle = "rgba(255,255,255,0.8)";
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(448, 168);
      g.bezierCurveTo(530, 206, 410, 262, 572, 312);
      g.stroke();
      g.strokeStyle = "rgba(244, 247, 242, 0.8)";
      g.lineWidth = 3;
      g.strokeRect(712, 162, 126, 186);
      g.beginPath();
      g.moveTo(775, 162);
      g.lineTo(775, 348);
      g.moveTo(712, 255);
      g.lineTo(838, 255);
      g.stroke();
      g.fillStyle = "#5e8d3e";
      g.beginPath();
      g.ellipse(230, 210, 90, 70, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#e7b4c8";
      [[200, 190], [250, 180], [220, 230], [270, 220], [190, 240]].forEach((p) => {
        g.beginPath();
        g.arc(p[0], p[1], 8, 0, Math.PI * 2);
        g.fill();
      });
      g.fillStyle = "#e7d3b0";
      for (let i = 0; i < 6; i++) g.fillRect(120 + i * 130, 400, 46, 28);
      g.fillStyle = "#b5524a";
      for (let i = 0; i < 6; i++) g.fillRect(116 + i * 130, 392, 54, 12);
      g.fillStyle = "rgba(255,255,255,0.18)";
      g.fillRect(0, 430, 1024, 82);
    });
  }
  function portraitCanvas(kind) {
    return paint(256, 320, (g) => {
      g.fillStyle = "#6e4428";
      g.fillRect(0, 0, 256, 320);
      const bg = g.createLinearGradient(0, 16, 0, 300);
      bg.addColorStop(0, kind ? "#8d3b4e" : "#3d4e8a");
      bg.addColorStop(1, kind ? "#e7c9a4" : "#d5e2c8");
      g.fillStyle = bg;
      g.fillRect(16, 16, 224, 288);
      g.fillStyle = "#f4d7b0";
      g.beginPath();
      g.arc(128, 132, 42, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = kind ? "#f2c1d4" : "#5c3a28";
      g.fillRect(86, 168, 84, 70);
      g.fillStyle = "#f0d78c";
      g.beginPath();
      g.arc(128, 118, 10, 0, Math.PI * 2);
      g.fill();
    });
  }
  function globeCanvas() {
    return paint(512, 256, (g) => {
      g.fillStyle = "#2d74c4";
      g.fillRect(0, 0, 512, 256);
      g.fillStyle = "#3f9a48";
      [[78, 78, 42, 24], [150, 96, 30, 18], [214, 64, 36, 20], [292, 108, 44, 22], [370, 72, 28, 16], [430, 120, 34, 18], [118, 160, 26, 14], [250, 168, 38, 16]].forEach((b) => {
        g.beginPath();
        g.ellipse(b[0], b[1], b[2], b[3], 0.3, 0, Math.PI * 2);
        g.fill();
      });
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
      } else if (it.kind === "sph") {
        g = new THREE.SphereGeometry(it.r, it.seg || 8, 6);
      } else {
        g = new THREE.BoxGeometry(it.w, it.h, it.d);
        if (it.rx) g.rotateX(it.rx);
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
    const glass = new THREE.MeshLambertMaterial({ color: "#b7def3", emissive: "#8ec4e4", emissiveIntensity: 0.28, transparent: true, opacity: 0.72 });
    const green = new THREE.MeshLambertMaterial({ color: "#2f6b3a" });
    const red = new THREE.MeshLambertMaterial({ color: "#a33b4a" });
    const cream = new THREE.MeshLambertMaterial({ color: "#f7efe2" });
    const pink = new THREE.MeshLambertMaterial({ color: "#f3b7cb" });
    const biscuit = new THREE.MeshLambertMaterial({ color: "#e6c08a" });
    const biscuitEar = new THREE.MeshLambertMaterial({ color: "#c9844a" });
    const portraitMat = new THREE.MeshLambertMaterial({ map: tex(THREE, portraitCanvas(0)) });

    root = new THREE.Group();
    root.name = "v53-inside";
    root.scale.y = 1 / SY;
    group.add(root);
    downG = new THREE.Group();
    upG = new THREE.Group();
    stairG = new THREE.Group();
    secretG = new THREE.Group();
    root.add(downG, upG, stairG, secretG);

    const mats = { plaster: plaster, stone: stone, rug: rugMat, wood: wood, woodDark: woodDark, gold: gold, cloth: clothMat, glass: glass, green: green, red: red, cream: cream, pink: pink, biscuit: biscuit, biscuitEar: biscuitEar, portrait: portraitMat };
    const bags = { down: {}, up: {}, stair: {}, secret: {} };
    function add(which, mat, item) {
      (bags[which][mat] = bags[which][mat] || []).push(item);
    }
    function box(which, mat, x, y, z, w, h, d, rx) {
      add(which, mat, { kind: "box", x: x, y: y, z: z, w: w, h: h, d: d, rx: rx || 0 });
    }
    function cyl(which, mat, x, y, z, rt, rb, h, seg) {
      add(which, mat, { kind: "cyl", x: x, y: y, z: z, rt: rt, rb: rb, h: h, seg: seg || 10 });
    }
    function plane(which, mat, x, y, z, w, h, ry, u0, u1) {
      add(which, mat, { kind: "plane", x: x, y: y, z: z, w: w, h: h, ry: ry || 0, u0: u0 || 0, v0: 0, u1: u1 == null ? 1 : u1, v1: 1 });
    }

    function roomBox(which, x0, x1, z0, z1, y, h, doors) {
      doors = doors || {};
      x0 += 0.06; x1 -= 0.06; z0 += 0.06; z1 -= 0.06;
      const cx = (x0 + x1) / 2;
      const cz = (z0 + z1) / 2;
      const w = x1 - x0;
      const d = z1 - z0;
      box(which, "stone", cx, y + 0.05, cz, w, 0.1, d);
      box(which, "rug", cx, y + 0.11, cz, Math.min(w * 0.62, w - 0.8), 0.03, Math.min(d * 0.55, d - 0.8));
      function portal(gap) {
        if (!gap) return null;
        const mid = (gap[0] + gap[1]) / 2;
        const half = Math.min(1.2, (gap[1] - gap[0]) / 2);
        return [mid - half, mid + half];
      }
      function spans(a, b, gap) {
        const door = portal(gap);
        if (!door) return [[a, b]];
        return [[a, door[0]], [door[1], b]];
      }
      function lintel(x, z, len, alongZ) {
        const hy = y + h - 0.72;
        if (alongZ) {
          box(which, "plaster", x, hy, z, 0.22, 1.44, len);
          box(which, "woodDark", x, y + h - 1.5, z, 0.26, 0.1, len + 0.2);
        } else {
          box(which, "plaster", x, hy, z, len, 1.44, 0.22);
          box(which, "woodDark", x, y + h - 1.5, z, len + 0.2, 0.1, 0.26);
        }
      }
      const west = portal(doors.west);
      const east = portal(doors.east);
      const north = portal(doors.north);
      const south = portal(doors.south);
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
      if (west) lintel(x0, (west[0] + west[1]) / 2, west[1] - west[0], true);
      if (east) lintel(x1, (east[0] + east[1]) / 2, east[1] - east[0], true);
      if (north) lintel((north[0] + north[1]) / 2, z0, north[1] - north[0], false);
      if (south) lintel((south[0] + south[1]) / 2, z1, south[1] - south[0], false);
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
    const flags = new THREE.Mesh(new THREE.PlaneGeometry(13.2, 7.4), new THREE.MeshLambertMaterial({ map: tex(THREE, paint(512, 512, (g) => {
      g.fillStyle = "#d9d2c4";
      g.fillRect(0, 0, 512, 512);
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
        g.fillStyle = (x + y) % 2 ? "#cfc6b6" : "#e6dfd2";
        g.fillRect(x * 64 + 3, y * 64 + 3, 58, 58);
      }
    })) }));
    flags.rotation.x = -Math.PI / 2;
    flags.position.set(0, FLOOR + 0.08, 17.6);
    upG.add(flags);
    const balGeo = new THREE.CylinderGeometry(0.07, 0.09, 0.72, 6);
    const bal = new THREE.InstancedMesh(balGeo, stone, 42);
    const balD = new THREE.Object3D();
    let bi2 = 0;
    function baluster(x, z) {
      balD.position.set(x, FLOOR + 0.46, z);
      balD.rotation.set(0, 0, 0);
      balD.updateMatrix();
      bal.setMatrixAt(bi2++, balD.matrix);
    }
    for (let i = 0; i <= 16; i++) baluster(-6.2 + i * 0.78, 20.75);
    for (let i = 0; i <= 8; i++) { baluster(-6.5, 14.8 + i * 0.7); baluster(6.5, 14.8 + i * 0.7); }
    bal.count = bi2;
    upG.add(bal);
    box("up", "stone", 0, FLOOR + 0.9, 20.75, 13.2, 0.12, 0.22);
    box("up", "stone", -6.5, FLOOR + 0.9, 17.6, 0.22, 0.12, 6.2);
    box("up", "stone", 6.5, FLOOR + 0.9, 17.6, 0.22, 0.12, 6.2);
    const pot = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.16, 0.12, 0.28, 8), stone, 6);
    const stems = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.015, 0.02, 0.42, 5), green, 6);
    const leaves = new THREE.InstancedMesh(new THREE.ConeGeometry(0.055, 0.16, 4), green, 12);
    const blooms = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 7, 6), pink, 6);
    const potD = new THREE.Object3D();
    [[-5.6, 16.2], [-2.2, 20.2], [2.4, 20.2], [5.6, 16.4], [-5.4, 19.6], [5.2, 19.4]].forEach((p, i) => {
      potD.position.set(p[0], FLOOR + 0.22, p[1]);
      potD.rotation.set(0, 0, 0);
      potD.scale.set(1, 1, 1);
      potD.updateMatrix();
      pot.setMatrixAt(i, potD.matrix);
      potD.position.y = FLOOR + 0.58;
      potD.updateMatrix();
      stems.setMatrixAt(i, potD.matrix);
      potD.position.y = FLOOR + 0.82;
      potD.updateMatrix();
      blooms.setMatrixAt(i, potD.matrix);
      [-0.9, 0.9].forEach((tilt, k) => {
        potD.position.set(p[0], FLOOR + 0.62, p[1]);
        potD.rotation.set(0, 0, tilt);
        potD.updateMatrix();
        leaves.setMatrixAt(i * 2 + k, potD.matrix);
      });
    });
    upG.add(pot, stems, leaves, blooms);

    plane("down", "cloth", 0, 2.6, 3.55, 3.2, 3.4, 0, 0, 0.333);
    plane("down", "cloth", -15.2, 2.5, 3.45, 2.6, 3.1, 0, 0.333, 0.666);
    plane("down", "cloth", -15.85, 2.45, 6.4, 2.2, 2.5, Math.PI / 2, 0.666, 1);
    plane("up", "cloth", -12, FLOOR + 2.3, 3.7, 2.8, 2.8, 0, 0, 0.333);
    plane("down", "glass", -10, 2.8, 12.35, 2.2, 1.6, Math.PI, 0, 1);
    plane("down", "glass", 10, 2.8, 12.35, 2.2, 1.6, Math.PI, 0, 1);

    const steps = 12;
    const zBot = 11.15;
    const zTop = 6.15;
    const run = (zBot - zTop) / steps;
    const rise = FLOOR / steps;
    for (let i = 0; i < steps; i++) {
      const top = (i + 1) * rise;
      const zc = zBot - (i + 0.5) * run;
      box("stair", "wood", 0, top * 0.5, zc, 3.2, top, run + 0.05);
      box("stair", "rug", 0, top + 0.02, zc, 1.02, 0.04, Math.max(0.16, run * 0.55));
    }
    box("stair", "wood", 0, FLOOR - 0.14, 5.5, 3.5, 0.3, 1.45);
    box("stair", "rug", 0, FLOOR + 0.03, 5.5, 1.15, 0.04, 1.05);
    const railLen = Math.hypot(zBot - zTop, FLOOR) * 0.9;
    const railA = Math.atan2(FLOOR, zBot - zTop);
    const railY = FLOOR * 0.5 + 0.84;
    const railZ = (zBot + zTop) * 0.5;
    [-1.5, 1.5].forEach((x) => {
      box("stair", "gold", x, railY, railZ, 0.05, 0.05, railLen, railA);
      cyl("stair", "gold", x, 0.7, zBot + 0.08, 0.1, 0.12, 1.4, 8);
      cyl("stair", "gold", x, FLOOR + 0.7, zTop + 0.02, 0.1, 0.12, 1.4, 8);
    });
    const balusters = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.032, 0.038, 0.74, 6), gold, steps * 2);
    const balO = new THREE.Object3D();
    for (let i = 0; i < steps; i++) {
      const top = (i + 1) * rise;
      const zc = zBot - (i + 0.5) * run;
      [-1.5, 1.5].forEach((x, side) => {
        balO.position.set(x, top + 0.4, zc);
        balO.rotation.set(0, 0, 0);
        balO.updateMatrix();
        balusters.setMatrixAt(i * 2 + side, balO.matrix);
      });
    }
    stairG.add(balusters);

    function chandelier(which, x, y, z) {
      cyl(which, "gold", x, y + 0.55, z, 0.025, 0.025, 0.85, 6);
      cyl(which, "gold", x, y, z, 0.58, 0.58, 0.07, 14);
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * Math.PI * 2;
        const cx = x + Math.cos(a) * 0.48;
        const cz = z + Math.sin(a) * 0.48;
        cyl(which, "cream", cx, y + 0.16, cz, 0.045, 0.045, 0.28, 6);
        add(which, "gold", { kind: "sph", x: cx, y: y + 0.34, z: cz, r: 0.055, seg: 6 });
      }
    }
    chandelier("down", 0, 4.15, 8.4);
    chandelier("down", -11, 4.05, 8);
    if (has("stage")) chandelier("down", -11, 4.15, 6.2);
    chandelier("down", 11, 4.05, 8);

    [[-0.28, 0.28, -0.02], [0.28, 0.28, -0.02], [-0.28, 0.28, 0.42], [0.28, 0.28, 0.42]].forEach((p) => {
      box("down", "woodDark", p[0], p[1], p[2], 0.08, 0.5, 0.08);
    });
    box("down", "pink", 0, 0.56, 0.2, 0.7, 0.1, 0.58);
    box("down", "gold", 0, 1.05, -0.04, 0.7, 0.9, 0.08);

    box("down", "wood", 10.4, 0.48, 6.3, 5.2, 0.1, 1.25);
    const chairBits = [];
    function chairBox(w, h, d, x, y, z) {
      const g = new THREE.BoxGeometry(w, h, d);
      g.translate(x, y, z);
      chairBits.push(g.toNonIndexed());
    }
    chairBox(0.46, 0.07, 0.46, 0, 0.48, 0);
    chairBox(0.46, 0.52, 0.06, 0, 0.78, -0.2);
    [[-0.17, -0.16], [0.17, -0.16], [-0.17, 0.16], [0.17, 0.16]].forEach((p) => chairBox(0.05, 0.48, 0.05, p[0], 0.24, p[1]));
    const chairGeo = new THREE.BufferGeometry();
    const chairPos = [];
    const chairNrm = [];
    const chairUv = [];
    chairBits.forEach((g) => {
      chairPos.push(g.attributes.position.array);
      chairNrm.push(g.attributes.normal.array);
      chairUv.push(g.attributes.uv.array);
      g.dispose();
    });
    function joinArrays(list) {
      let n = 0;
      list.forEach((a) => { n += a.length; });
      const out = new Float32Array(n);
      let o = 0;
      list.forEach((a) => { out.set(a, o); o += a.length; });
      return out;
    }
    chairGeo.setAttribute("position", new THREE.Float32BufferAttribute(joinArrays(chairPos), 3));
    chairGeo.setAttribute("normal", new THREE.Float32BufferAttribute(joinArrays(chairNrm), 3));
    chairGeo.setAttribute("uv", new THREE.Float32BufferAttribute(joinArrays(chairUv), 2));
    const chairs = new THREE.InstancedMesh(chairGeo, woodDark, 8);
    const chairD = new THREE.Object3D();
    for (let i = 0; i < 8; i++) {
      const north = i < 4;
      chairD.position.set(8.5 + (i % 4) * 1.25, 0, north ? 5.45 : 7.15);
      chairD.rotation.set(0, north ? 0 : Math.PI, 0);
      chairD.updateMatrix();
      chairs.setMatrixAt(i, chairD.matrix);
    }
    downG.add(chairs);
    function candelabra(x, z) {
      cyl("down", "gold", x, 0.95, z, 0.04, 0.06, 0.72, 6);
      box("down", "gold", x, 1.32, z, 0.5, 0.04, 0.04);
      [-0.22, 0, 0.22].forEach((dx) => {
        cyl("down", "cream", x + dx, 1.46, z, 0.03, 0.035, 0.2, 6);
        add("down", "gold", { kind: "sph", x: x + dx, y: 1.58, z: z, r: 0.045, seg: 8 });
      });
      const glow = new THREE.PointLight("#ffd2a2", 0.45, 3.2, 2);
      glow.position.set(x, 1.5, z);
      downG.add(glow);
    }
    candelabra(9.3, 6.3);
    candelabra(11.5, 6.3);
    [[8.6, 5.95], [9.9, 5.95], [11.0, 5.95], [12.3, 5.95], [8.6, 6.65], [9.9, 6.65], [11.0, 6.65], [12.3, 6.65]].forEach((p) => {
      cyl("down", "cream", p[0], 0.56, p[1], 0.1, 0.1, 0.025, 8);
    });
    plane("down", "glass", 8.2, 2.35, 3.48, 1.15, 1.05, 0, 0, 1);
    plane("down", "glass", 12.6, 2.35, 3.48, 1.15, 1.05, 0, 0, 1);
    [8.2, 12.6].forEach((x) => {
      box("down", "woodDark", x, 2.92, 3.52, 1.28, 0.06, 0.05);
      box("down", "woodDark", x, 1.78, 3.52, 1.28, 0.06, 0.05);
      box("down", "woodDark", x - 0.6, 2.35, 3.52, 0.06, 1.16, 0.05);
      box("down", "woodDark", x + 0.6, 2.35, 3.52, 0.06, 1.16, 0.05);
    });
    plane("down", "cloth", 7.05, 2.3, 3.52, 0.26, 1.5, 0, 0, 0.333);
    plane("down", "cloth", 8.95, 2.3, 3.52, 0.26, 1.5, 0, 0.333, 0.666);
    plane("down", "cloth", 11.85, 2.3, 3.52, 0.26, 1.5, 0, 0, 0.333);
    plane("down", "cloth", 13.75, 2.3, 3.52, 0.26, 1.5, 0, 0.333, 0.666);
    const hearth = new THREE.PointLight("#ffb060", 0.7, 7, 2);
    hearth.position.set(10.4, 1.15, 4.3);
    downG.add(hearth);
    cyl("down", "gold", -12.4, 0.85, 5.4, 0.05, 0.08, 1.05, 6);
    cyl("down", "gold", -14.4, 0.85, 6.5, 0.05, 0.08, 1.05, 6);
    add("down", "gold", { kind: "sph", x: -12.4, y: 1.45, z: 5.4, r: 0.09, seg: 8 });
    add("down", "gold", { kind: "sph", x: -14.4, y: 1.45, z: 6.5, r: 0.09, seg: 8 });
    box("down", "woodDark", -13.2, 0.32, 6.9, 1.5, 0.1, 0.42);
    box("down", "pink", -13.2, 0.42, 6.9, 1.4, 0.08, 0.36);
    plane("down", "glass", -16.2, 2.55, 5.5, 1.7, 1.35, Math.PI / 2, 0, 1);
    plane("down", "cloth", -16.05, 2.5, 4.35, 0.3, 1.6, Math.PI / 2, 0, 0.333);
    plane("down", "cloth", -16.05, 2.5, 6.65, 0.3, 1.6, Math.PI / 2, 0.333, 0.666);
    box("down", "stone", 10.4, 1.15, 3.42, 2.3, 1.7, 0.28);
    box("down", "woodDark", 10.4, 0.72, 3.58, 1.05, 0.7, 0.12);
    box("down", "wood", 10.4, 1.95, 3.36, 2.5, 0.1, 0.36);
    cyl("down", "stone", -3.8, 2.3, 8.4, 0.32, 0.36, 4.4, 8);
    cyl("down", "stone", 3.8, 2.3, 8.4, 0.32, 0.36, 4.4, 8);
    [[-4.72, 5.4, 1], [4.72, 5.4, -1], [-4.72, 7.6, 1], [4.72, 7.6, -1]].forEach((p) => {
      plane("down", "gold", p[0], 2.45, p[1], 0.95, 1.25, p[2] * Math.PI / 2, 0, 1);
      plane("down", "portrait", p[0] + p[2] * 0.05, 2.42, p[1], 0.68, 0.92, p[2] * Math.PI / 2, 0, 1);
    });
    [[-4.85, 4.8], [4.85, 4.8], [-4.85, 8.8], [4.85, 8.8]].forEach((p) => {
      cyl("down", "gold", p[0], 2.55, p[1], 0.05, 0.08, 0.22, 6);
      add("down", "gold", { kind: "sph", x: p[0], y: 2.72, z: p[1], r: 0.07, seg: 6 });
    });
    plane("down", "cloth", -4.95, 3.2, 5.6, 0.55, 1.5, Math.PI / 2, 0.666, 1);
    plane("down", "cloth", 4.95, 3.2, 5.6, 0.55, 1.5, -Math.PI / 2, 0.666, 1);
    box("down", "wood", 14.5, 0.55, 4.7, 1.3, 0.1, 0.7);
    cyl("down", "woodDark", 14.05, 0.28, 4.45, 0.05, 0.06, 0.5, 6);
    cyl("down", "woodDark", 14.95, 0.28, 4.45, 0.05, 0.06, 0.5, 6);
    cyl("down", "woodDark", 14.05, 0.28, 4.95, 0.05, 0.06, 0.5, 6);
    cyl("down", "woodDark", 14.95, 0.28, 4.95, 0.05, 0.06, 0.5, 6);
    cyl("down", "cream", 14.3, 0.66, 4.7, 0.08, 0.08, 0.1, 8);
    cyl("down", "cream", 14.7, 0.66, 4.7, 0.08, 0.08, 0.1, 8);
    box("down", "gold", 9.2, 1.3, 10.6, 1.6, 0.08, 0.45);
    cyl("down", "gold", 8.7, 1.55, 10.6, 0.16, 0.12, 0.28, 8);
    cyl("down", "gold", 9.7, 1.55, 10.6, 0.16, 0.12, 0.28, 8);

    bookcase = new THREE.Group();
    bookcase.name = "v53-bookcase";
    bookcase.position.set(15.55, 0, 8.2);
    const caseBack = new THREE.Mesh(new THREE.BoxGeometry(0.28, 2.8, 2.4), woodDark);
    caseBack.position.set(0, 1.5, 0);
    bookcase.add(caseBack);
    const shelfMesh = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.06, 2.2), wood);
    const shelves = new THREE.InstancedMesh(shelfMesh.geometry, wood, 4);
    const bookMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 0.48, 0.28), red, 24);
    const dummy = new THREE.Object3D();
    let bi = 0;
    for (let row = 0; row < 4; row++) {
      dummy.position.set(-0.12, 0.45 + row * 0.62, 0);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      shelves.setMatrixAt(row, dummy.matrix);
      for (let col = 0; col < 6; col++) {
        if (row === 2 && col === 4) continue;
        dummy.position.set(-0.22, 0.72 + row * 0.62, -0.9 + col * 0.34);
        dummy.updateMatrix();
        bookMesh.setMatrixAt(bi, dummy.matrix);
        bookMesh.setColorAt(bi, new THREE.Color((row + col) % 3 === 0 ? "#a33b4a" : (row + col) % 3 === 1 ? "#2f6b3a" : "#7a4b2c"));
        bi++;
      }
    }
    bookMesh.count = bi;
    bookMesh.instanceColor.needsUpdate = true;
    bookcase.add(shelves, bookMesh);
    const proud = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 0.3), green);
    proud.name = "v53-green-book";
    proud.position.set(-0.42, 1.96, 0.46);
    bookcase.add(proud);
    downG.add(bookcase);
    if (secret) swingCase(true);
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.78), new THREE.MeshLambertMaterial({ map: tex(THREE, signCanvas("Pull the cheerful book.")), side: THREE.DoubleSide }));
    plaque.position.set(12.6, 2.05, 6.05);
    plaque.rotation.y = Math.PI;
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
    box("up", "gold", -12, FLOOR + 0.82, 8.55, 2.15, 0.42, 0.08);
    box("up", "woodDark", -12, FLOOR + 1.15, 9.88, 2.05, 0.85, 0.08);
    const mirror = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.5), new THREE.MeshLambertMaterial({ color: "#d5e7f6", emissive: "#9fc4de", emissiveIntensity: 0.25 }));
    mirror.name = "v53-mirror";
    mirror.position.set(-15.9, FLOOR + 1.7, 8);
    mirror.rotation.y = Math.PI / 2;
    upG.add(mirror);
    const my = FLOOR + 1.7;
    box("up", "gold", -15.82, my + 0.8, 8, 0.06, 0.08, 0.9);
    box("up", "gold", -15.82, my - 0.8, 8, 0.06, 0.08, 0.9);
    box("up", "gold", -15.82, my, 7.58, 0.06, 1.52, 0.08);
    box("up", "gold", -15.82, my, 8.42, 0.06, 1.52, 0.08);
    [-13.05, -10.95].forEach((x) => {
      cyl("up", "woodDark", x, FLOOR + 1.35, 8.55, 0.05, 0.05, 2.2, 6);
      cyl("up", "woodDark", x, FLOOR + 1.35, 9.85, 0.05, 0.05, 2.2, 6);
    });
    box("up", "pink", -12, FLOOR + 2.4, 9.2, 2.3, 0.06, 1.45);
    const nx = -13.55;
    const nz = 9.7;
    cyl("up", "woodDark", nx - 0.16, FLOOR + 0.18, nz - 0.14, 0.035, 0.04, 0.36, 6);
    cyl("up", "woodDark", nx + 0.16, FLOOR + 0.18, nz - 0.14, 0.035, 0.04, 0.36, 6);
    cyl("up", "woodDark", nx - 0.16, FLOOR + 0.18, nz + 0.14, 0.035, 0.04, 0.36, 6);
    cyl("up", "woodDark", nx + 0.16, FLOOR + 0.18, nz + 0.14, 0.035, 0.04, 0.36, 6);
    box("up", "wood", nx, FLOOR + 0.46, nz, 0.42, 0.22, 0.36);
    box("up", "woodDark", nx, FLOOR + 0.46, nz + 0.16, 0.34, 0.04, 0.02);
    box("up", "wood", nx, FLOOR + 0.6, nz, 0.48, 0.05, 0.4);
    cyl("up", "gold", nx, FLOOR + 0.86, nz, 0.025, 0.03, 0.28, 6);
    cyl("up", "cream", nx, FLOOR + 1.08, nz, 0.1, 0.13, 0.12, 8);
    plane("up", "cloth", -16.05, FLOOR + 2.15, 6.2, 1.3, 1.6, Math.PI / 2, 0, 0.333);

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
      plane("up", "portrait", 14.8, FLOOR + 2.2, 5.2, 0.85, 1.05, -Math.PI / 2, 0, 1);
      plane("up", "gold", 15.0, FLOOR + 2.2, 5.2, 1.05, 1.25, -Math.PI / 2, 0, 1);
      cyl("up", "red", 11.2, FLOOR + 0.82, 7.55, 0.06, 0.06, 0.1, 6);
      cyl("up", "gold", 11.45, FLOOR + 0.82, 7.55, 0.05, 0.05, 0.1, 6);
      plane("up", "glass", 12.4, FLOOR + 2.2, 3.7, 1.6, 1.15, 0, 0, 1);
    }

    box("secret", "stone", 22.6, -2.15, 8.1, 11.4, 0.1, 2.8);
    box("secret", "woodDark", 22.6, -0.4, 6.7, 11.2, 3.2, 0.18);
    box("secret", "woodDark", 22.6, -0.4, 9.5, 11.2, 3.2, 0.18);
    box("secret", "woodDark", 22.6, 1.15, 8.1, 11.2, 0.16, 2.8);
    for (let i = 0; i < 5; i++) {
      cyl("secret", "gold", 18.5 + i * 1.8, -1.1, 8.1, 0.05, 0.05, 0.7, 6);
      add("secret", "gold", { kind: "sph", x: 18.5 + i * 1.8, y: -0.7, z: 8.1, r: 0.06, seg: 6 });
    }
    roomBox("secret", 28.5, 41.2, 2.4, 14.2, -2.2, 4.2, { west: [6.4, 9.8] });
    box("secret", "rug", 35, -2.08, 8.2, 6.5, 0.04, 4.2);
    box("secret", "wood", 33.6, -1.72, 9.35, 1.15, 0.06, 0.72);
    cyl("secret", "woodDark", 33.15, -1.98, 9.08, 0.04, 0.045, 0.46, 6);
    cyl("secret", "woodDark", 34.05, -1.98, 9.08, 0.04, 0.045, 0.46, 6);
    cyl("secret", "woodDark", 33.15, -1.98, 9.62, 0.04, 0.045, 0.46, 6);
    cyl("secret", "woodDark", 34.05, -1.98, 9.62, 0.04, 0.045, 0.46, 6);
    for (let i = 0; i < 4; i++) {
      cyl("secret", "gold", 31.2, -0.85, 4.4 + i * 2.2, 0.045, 0.045, 0.7, 6);
      add("secret", "gold", { kind: "sph", x: 31.2, y: -0.42, z: 4.4 + i * 2.2, r: 0.07, seg: 6 });
    }
    box("secret", "woodDark", 34.8, -0.3, 3.05, 9.2, 3.8, 0.18);
    box("secret", "woodDark", 34.8, -0.3, 13.55, 9.2, 3.8, 0.18);
    for (let s = 0; s < 5; s++) {
      box("secret", "wood", 34.8, -1.9 + s * 0.72, 3.22, 8.8, 0.06, 0.36);
      box("secret", "wood", 34.8, -1.9 + s * 0.72, 13.38, 8.8, 0.06, 0.36);
    }
    const libBooks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 0.4, 0.22), red, 140);
    const lb = new THREE.Object3D();
    const ink = ["#c4495a", "#3e8f55", "#e6c56a", "#6a8fd4", "#f4efe4", "#8d4b2c", "#d978a4"];
    let li = 0;
    for (let shelf = 0; shelf < 5; shelf++) {
      for (let col = 0; col < 12; col++) {
        const h = 0.28 + (col % 4) * 0.06;
        lb.position.set(30.6 + col * 0.7, -1.68 + shelf * 0.72 + h * 0.15, 3.28);
        lb.rotation.set(0, (col % 5 === 0 ? 0.08 : 0), (col % 7 === 0 ? 0.12 : 0));
        lb.scale.set(1, h / 0.4, 1);
        lb.updateMatrix();
        libBooks.setMatrixAt(li, lb.matrix);
        libBooks.setColorAt(li, new THREE.Color(ink[li % ink.length]));
        li++;
        lb.position.z = 13.32;
        lb.rotation.y = Math.PI;
        lb.updateMatrix();
        libBooks.setMatrixAt(li, lb.matrix);
        libBooks.setColorAt(li, new THREE.Color(ink[(li + 2) % ink.length]));
        li++;
      }
    }
    libBooks.count = li;
    if (libBooks.instanceColor) libBooks.instanceColor.needsUpdate = true;
    secretG.add(libBooks);
    box("secret", "woodDark", 33.95, -0.35, 4.05, 0.08, 3.1, 0.08);
    box("secret", "woodDark", 34.35, -0.35, 4.05, 0.08, 3.1, 0.08);
    for (let r = 0; r < 6; r++) box("secret", "wood", 34.15, -1.65 + r * 0.46, 4.05, 0.5, 0.05, 0.08);
    box("secret", "stone", 40.55, -1.15, 6.6, 0.4, 1.7, 1.8);
    box("secret", "woodDark", 40.28, -1.65, 6.6, 0.22, 0.18, 0.7);
    add("secret", "gold", { kind: "sph", x: 40.05, y: -0.55, z: 6.2, r: 0.06, seg: 6 });
    add("secret", "gold", { kind: "sph", x: 40.05, y: -0.55, z: 7.0, r: 0.06, seg: 6 });
    const globeMap = tex(THREE, globeCanvas());
    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 16), new THREE.MeshBasicMaterial({ map: globeMap }));
    globe.position.set(36.3, -1.05, 6.7);
    globe.name = "v53-globe";
    secretG.add(globe);
    const meridian = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.018, 8, 28), gold);
    meridian.position.copy(globe.position);
    meridian.rotation.y = 0.5;
    secretG.add(meridian);
    const equator = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.012, 6, 24), gold);
    equator.position.copy(globe.position);
    equator.rotation.x = Math.PI / 2;
    secretG.add(equator);
    cyl("secret", "wood", 36.3, -1.72, 6.7, 0.22, 0.22, 0.06, 12);
    cyl("secret", "woodDark", 36.3, -1.52, 6.7, 0.045, 0.05, 0.28, 8);
    const cradle = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.02, 6, 18, Math.PI), woodDark);
    cradle.position.set(36.3, -1.22, 6.7);
    cradle.rotation.x = Math.PI / 2;
    cradle.rotation.z = Math.PI;
    secretG.add(cradle);
    box("secret", "woodDark", 32.7, -1.55, 7.55, 0.72, 0.42, 0.72);
    box("secret", "pink", 32.7, -1.28, 7.55, 0.64, 0.12, 0.64);
    box("secret", "woodDark", 32.7, -1.02, 7.88, 0.64, 0.48, 0.08);
    plane("secret", "glass", 40.85, -0.35, 10.2, 1.5, 1.15, -Math.PI / 2, 0, 1);
    plane("secret", "cloth", 40.7, -0.35, 9.2, 0.28, 1.35, -Math.PI / 2, 0, 0.333);
    plane("secret", "cloth", 40.7, -0.35, 11.2, 0.28, 1.35, -Math.PI / 2, 0.333, 0.666);
    const libLight = new THREE.PointLight("#ffc48a", 1.8, 16, 2);
    libLight.position.set(34.6, -0.4, 7.2);
    secretG.add(libLight);
    const pool = new THREE.Mesh(new THREE.CircleGeometry(2.1, 24), new THREE.MeshBasicMaterial({ color: "#ffb56a", transparent: true, opacity: 0.5, depthWrite: false }));
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(34.6, -2.02, 7.3);
    secretG.add(pool);
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

    panorama = new THREE.Group();
    panorama.name = "v53-panorama";
    panorama.visible = false;
    root.add(panorama);
    const skyMat = new THREE.MeshBasicMaterial({ map: tex(THREE, skyCanvas()), side: THREE.BackSide, fog: false, depthWrite: true, depthTest: false });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(140, 32, 20), skyMat);
    sky.name = "v53-sky";
    sky.frustumCulled = false;
    sky.renderOrder = -10;
    panorama.add(sky);
    const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex(THREE, sunCanvas()), transparent: true, depthWrite: false, fog: false }));
    sun.scale.set(26, 26, 1);
    sun.position.set(18, 16, 52);
    panorama.add(sun);
    const cloudMat = new THREE.SpriteMaterial({ map: tex(THREE, puffCanvas()), transparent: true, depthWrite: false, fog: false });
    [[-24, 13, 44], [4, 15.5, 60], [26, 12.5, 38], [-6, 17, 72], [14, 14, 84]].forEach((c) => {
      const cloud = new THREE.Sprite(cloudMat);
      cloud.scale.set(20, 8, 1);
      cloud.position.set(c[0], c[1], c[2]);
      panorama.add(cloud);
    });
    const grounds = new THREE.Mesh(new THREE.PlaneGeometry(150, 86), new THREE.MeshLambertMaterial({ map: tex(THREE, kingdomCanvas()) }));
    grounds.rotation.x = -Math.PI / 2;
    grounds.position.set(0, 0.2, 58);
    panorama.add(grounds);
    const trees = new THREE.InstancedMesh(new THREE.ConeGeometry(1.15, 3.4, 7), new THREE.MeshLambertMaterial({ color: "#2f6a34" }), 20);
    const houses = new THREE.InstancedMesh(new THREE.BoxGeometry(2.1, 1.7, 1.8), new THREE.MeshLambertMaterial({ color: "#efe0c8" }), 6);
    const roofs = new THREE.InstancedMesh(new THREE.ConeGeometry(1.7, 1.25, 4), new THREE.MeshLambertMaterial({ color: "#a8443c" }), 6);
    const peaks = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 6), new THREE.MeshLambertMaterial({ color: "#ffffff" }), 16);
    const td = new THREE.Object3D();
    const treeAt = [[-18, 26], [-12, 24], [-6, 27], [8, 25], [14, 27], [20, 24], [-16, 34], [12, 33], [-4, 36], [4, 30], [-22, 32], [18, 36], [-10, 40], [6, 42], [-20, 44], [16, 46], [-8, 48], [2, 50], [10, 38], [-14, 46]];
    treeAt.forEach((pt, i) => {
      td.position.set(pt[0], 1.7, pt[1]);
      td.rotation.set(0, 0, 0);
      td.scale.set(1, 0.85 + (i % 3) * 0.15, 1);
      td.updateMatrix();
      trees.setMatrixAt(i, td.matrix);
    });
    for (let i = 0; i < 6; i++) {
      const hx = -18 + i * 7.2;
      td.position.set(hx, 0.85, 62);
      td.rotation.set(0, 0.2, 0);
      td.scale.set(1, 1, 1);
      td.updateMatrix();
      houses.setMatrixAt(i, td.matrix);
      td.position.y = 2.15;
      td.rotation.y = Math.PI / 4;
      td.updateMatrix();
      roofs.setMatrixAt(i, td.matrix);
    }
    const ridge = [
      [-28, 5.2, 70, 7, "#5f8a48"], [-12, 6.4, 68, 8, "#6d9458"], [4, 7.2, 72, 9, "#7c9a6a"],
      [18, 5.8, 69, 7.5, "#688c62"], [32, 4.6, 74, 6.5, "#87a090"],
      [-20, 7.5, 82, 10, "#8eaaa4"], [-2, 9.2, 84, 12, "#9bb4b0"], [16, 8.1, 83, 11, "#a9c0c4"],
      [30, 6.4, 86, 9, "#b7c8d0"], [-30, 8.5, 96, 14, "#c5d4e0"], [-8, 11, 98, 16, "#d0dce6"],
      [8, 12.4, 100, 18, "#d7e2ea"], [24, 9.5, 97, 15, "#e0e8ef"], [-16, 10, 108, 20, "#e7eef4"],
      [6, 13, 112, 22, "#eef3f7"], [22, 10.5, 110, 19, "#f3f6f8"]
    ];
    ridge.forEach((pt, i) => {
      td.position.set(pt[0], pt[1], pt[2]);
      td.rotation.set(0, 0, 0);
      td.scale.set(pt[3], pt[1] * 2, pt[3] * 0.72);
      td.updateMatrix();
      peaks.setMatrixAt(i, td.matrix);
      peaks.setColorAt(i, new THREE.Color(pt[4]));
    });
    peaks.instanceColor.needsUpdate = true;
    const eastSlot = new THREE.Group();
    eastSlot.name = "east-realm";
    eastSlot.position.set(18, 5.8, 69);
    const northSlot = new THREE.Group();
    northSlot.name = "north-realm";
    northSlot.position.set(-2, 9.2, 84);
    const westSlot = new THREE.Group();
    westSlot.name = "west-realm";
    westSlot.position.set(-20, 7.5, 82);
    panorama.add(trees, houses, roofs, peaks, eastSlot, northSlot, westSlot);
    const glints = new THREE.InstancedMesh(new THREE.SphereGeometry(0.08, 6, 5), gold, 8);
    for (let i = 0; i < 8; i++) {
      td.position.set(-1.2 + (i % 3) * 1.4, 0.28, 32 + i * 3.2);
      td.rotation.set(0, 0, 0);
      td.scale.set(1, 0.35, 1);
      td.updateMatrix();
      glints.setMatrixAt(i, td.matrix);
      glints.setColorAt(i, new THREE.Color("#f4fbff"));
    }
    glints.instanceColor.needsUpdate = true;
    panorama.add(glints);

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
    ribbon.position.set(-3.35, 2.35, 12.2);
    ribbon.rotation.y = Math.PI / 2;
    root.add(ribbon);

    Object.keys(bags).forEach((which) => {
      const parent = which === "up" ? upG : which === "stair" ? stairG : which === "secret" ? secretG : downG;
      Object.keys(bags[which]).forEach((key) => mergeAdd(THREE, parent, bags[which][key], mats[key]));
    });
    root.traverse((o) => { if (o.isMesh) o.userData.v51floor = 1; });
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

  function showNote(text) {
    const note = document.getElementById("prompt-text");
    const bar = document.getElementById("prompt");
    if (!note || !bar) return;
    note.textContent = text;
    bar.classList.remove("hidden");
  }
  function hideNote() {
    const bar = document.getElementById("prompt");
    if (bar) bar.classList.add("hidden");
  }
  function swingCase(open) {
    bookOpen = open ? 1 : 0;
    if (bookcase) bookcase.rotation.y = open ? -1.15 : 0;
    const book = bookcase && bookcase.getObjectByName("v53-green-book");
    if (book) book.position.x = open ? -0.62 : -0.42;
  }
  function revealPassage() {
    secret = true;
    const saved = bag();
    saved.secret = 1;
    if (secretG) secretG.visible = true;
    swingCase(true);
    place(18.4, -2.2, 8.1);
    burst();
    if (pe().save) pe().save();
  }
  function atStair(loc) {
    return Math.abs(loc.x) < 2.1 && loc.z > 10.15 && loc.z < 11.7 && loc.y < 1.5;
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
    if (!owned() && atStair(loc)) {
      ev.preventDefault();
      ev.stopPropagation();
      const score = Math.max(0, Math.floor(+pe().state().score || 0));
      if (score < PRICE) {
        stairAsk = false;
        showNote("The upstairs is 40 coins. Earn a few more, then press E.");
        return;
      }
      if (!stairAsk) {
        stairAsk = true;
        showNote("Spend 40 coins to open the upstairs? Press E.");
        return;
      }
      stairAsk = false;
      pe().care.commit("upper");
      hideNote();
      if (ribbon) ribbon.visible = false;
      return;
    }
    stairAsk = false;
    const dining = Math.abs(loc.x - 15.2) < 1.7 && Math.abs(loc.z - 8.2) < 1.7 && loc.y < 1.6;
    const back = Math.abs(loc.x - 40.2) < 1.6 && Math.abs(loc.z - 8.2) < 1.6 && loc.y < -1;
    if (dining && !secret) {
      ev.preventDefault();
      ev.stopPropagation();
      pe().learn.openPassage();
      return;
    }
    if ((dining || back) && secret) {
      ev.preventDefault();
      ev.stopPropagation();
      const opening = !bookOpen;
      swingCase(opening);
      if (opening && dining) {
        place(18.4, -2.2, 8.1);
        burst();
      } else {
        place(13.6, 0, 8.2);
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

  function keeps(node, obj) {
    let p = obj;
    while (p) {
      if (p === node) return true;
      p = p.parent;
    }
    return false;
  }
  function cloakWorld(on) {
    const PE = pe();
    if (!PE || !PE.scene) return;
    if (!on) {
      cloaked.forEach((o) => { o.visible = true; });
      cloaked = [];
      return;
    }
    const inside = PE.scene.getObjectByName("v53-inside");
    const hide = (ch) => {
      if (!ch || ch.isLight || cloaked.indexOf(ch) >= 0) return;
      if (ch === PE.princess || keeps(ch, PE.princess)) return;
      if (inside && (keeps(inside, ch) || keeps(ch, inside))) return;
      if (!ch.visible) return;
      ch.visible = false;
      cloaked.push(ch);
    };
    PE.scene.children.forEach(hide);
    const home = inside && inside.parent;
    if (home) home.traverse((o) => { if (o.isMesh || o.isPoints || o.isSprite) hide(o); });
  }
  function applyRoom(where) {
    const PE = pe();
    if (downG) downG.visible = !where || where.y < 2.4 || (where.id === "stair" && where.y < 3.6);
    if (upG) upG.visible = !!owned() && !!where && (where.y > 1.6 || where.id === "balcony" || where.id === "landing");
    if (stairG) stairG.visible = true;
    if (secretG) secretG.visible = secret && !!where && (where.id === "tunnel" || where.id === "library" || where.y < -1);
    if (ribbon) ribbon.visible = !owned();
    const onBalcony = !!(where && where.id === "balcony");
    if (panorama) panorama.visible = onBalcony;
    if (PE && PE.scene && !gameSky) {
      PE.scene.traverse((o) => {
        const m = o.material;
        if (!gameSky && m && m.uniforms && m.uniforms.top && m.uniforms.mid && m.uniforms.bot) gameSky = o;
      });
      sparkHome = PE.scene.getObjectByName("v36-sparks");
      moteHome = PE.scene.getObjectByName("v42-motes");
    }
    const inside = !!(castle() && castle().inCastle);
    [sparkHome, moteHome].forEach((o) => {
      if (!o) return;
      if (o.userData.v53was == null) o.userData.v53was = o.visible;
      o.visible = inside ? false : o.userData.v53was;
    });
    if (onBalcony !== balconySky) {
      balconySky = onBalcony;
      if (gameSky) gameSky.visible = !onBalcony;
      const THREE = three();
      if (PE && PE.renderer && THREE) {
        if (!clearHold) clearHold = new THREE.Color();
        if (onBalcony) {
          if (!clearSaved) {
            PE.renderer.getClearColor(clearHold);
            clearSaved = true;
          }
          PE.renderer.setClearColor("#d7eaf8");
          if (!warmBg) warmBg = new THREE.Color("#d7eaf8");
          if (savedBg === undefined) savedBg = PE.scene.background || null;
          PE.scene.background = warmBg;
        } else if (clearSaved && castle() && castle().inCastle) {
          PE.renderer.setClearColor("#f4ead8");
          if (!roomBg) roomBg = new THREE.Color("#f4ead8");
          PE.scene.background = roomBg;
        } else if (clearSaved) {
          PE.renderer.setClearColor(clearHold);
          PE.scene.background = savedBg;
          savedBg = undefined;
          clearSaved = false;
        }
      }
    }
    if (inside && !onBalcony && PE && PE.renderer) {
      const THREE = three();
      if (THREE) {
        if (!clearHold) clearHold = new THREE.Color();
        if (!clearSaved) {
          PE.renderer.getClearColor(clearHold);
          clearSaved = true;
          if (savedBg === undefined) savedBg = PE.scene.background || null;
        }
        if (!roomBg) roomBg = new THREE.Color("#f4ead8");
        PE.renderer.setClearColor("#f4ead8");
        PE.scene.background = roomBg;
      }
    }
    if (PE && PE.scene) {
      if (onBalcony) {
        if (savedFog === undefined) savedFog = PE.scene.fog || null;
        if (!PE.scene.fog || PE.scene.fog.name !== "v53fog") {
          const THREE = three();
          const fog = new THREE.FogExp2("#d5e6f2", 0.0045);
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
      const angle = (window.PE_V53 && window.PE_V53.angle) || 0;
      const actor = pe().princess;
      if (actor) actor.rotation.y = angle ? -0.55 : 0;
      if (panoAngle !== angle) {
        panoFrom = null;
        panoAngle = angle;
      }
      const goal = new THREE.Vector3(ic.x + (angle ? 4.6 : 4.5), y + (phone ? 1.9 : 1.45), ic.z + (angle ? 15.4 : 15.05));
      const look = new THREE.Vector3(ic.x + (angle ? -3.2 : 0.2), y + (angle ? 0.55 : 0.95), ic.z + (angle ? 32 : 38));
      if (!panoFrom) {
        panoFrom = cam.position.clone();
        panoAt = performance.now();
      }
      const e = Math.min(1, (performance.now() - panoAt) / 1000);
      const s = e * e * (3 - 2 * e);
      const locked = !!(window.PE_V53 && window.PE_V53.lock);
      cam.position.lerpVectors(panoFrom, goal, locked ? 1 : Math.max(s, 0.15));
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
      hall: [3.2, y + 3.35, 12.95, 0, y + 1.9, 6.5],
      stair: [3.4, y + 3.5, 13.02, -0.2, y + 2.35, 6.7],
      throne: [0.2, y + 2.4, 5.8, 0, y + 1.0, 0.2],
      ballroom: [-8.7, y + 2.5, 7.25, -14.4, y + 1.15, 4.7],
      kitchen: [7.4, y + 2.45, 4.45, 13.9, y + 0.75, 8.2],
      biscuit: [-8.2, y + 2.4, 12.5, -11.4, y + 0.9, 10.2],
      trophy: [8.2, y + 2.4, 12.5, 10.6, y + 1.2, 10.2],
      tunnel: [lx - 2.8, y + 1.25, lz + 0.55, lx + 7, y + 0.35, lz],
      library: [37.4, 0.15, 11.15, 33.5, -1.35, 6.7],
      bedroom: [-7.4, y + 2.2, 5.55, -12.2, y + 1.0, 8.7],
      studio: [8.4, y + 2.15, 9.8, 13.0, y + 1.15, 6.2],
      landing: [3.2, y + 2.2, 7.25, -1.0, y + 0.9, 5.1],
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

  const FURNITURE = [
    { name: "bed", x0: -13.25, x1: -10.75, y0: 4.2, y1: 6.7, z0: 8.4, z1: 10.05 },
    { name: "nightstand", x0: -13.85, x1: -13.25, y0: 4.2, y1: 5.5, z0: 9.45, z1: 9.95 },
    { name: "dining-table", x0: 7.7, x1: 13.1, y0: 0.3, y1: 1.15, z0: 5.55, z1: 7.05 },
    { name: "bookcase", x0: 15.2, x1: 16.05, y0: 0, y1: 3.1, z0: 6.85, z1: 9.55 },
    { name: "reading-table", x0: 33.0, x1: 34.2, y0: -2.2, y1: -1.4, z0: 8.95, z1: 9.75 }
  ];

  function clearOfFurniture(lx, y, lz) {
    const body = { x0: lx - 0.4, x1: lx + 0.4, y0: y + 0.02, y1: y + 1.65, z0: lz - 0.36, z1: lz + 0.36 };
    for (let i = 0; i < FURNITURE.length; i++) {
      const b = FURNITURE[i];
      if (body.x0 < b.x1 && body.x1 > b.x0 && body.y0 < b.y1 && body.y1 > b.y0 && body.z0 < b.z1 && body.z1 > b.z0) {
        return { ok: false, hit: b.name, x: lx, y: y, z: lz };
      }
    }
    return { ok: true, x: lx, y: y, z: lz };
  }

  function viewClear() {
    const PE = pe();
    const c = castle();
    if (!PE || !PE.camera || !c || !c.inCastle) return { ok: false, reason: "outside" };
    const cam = PE.camera.position;
    const lx = cam.x - c.IC.x;
    const lz = cam.z - c.IC.z;
    const ly = cam.y;
    const p = PE.princess.position;
    const dist = Math.hypot(cam.x - p.x, cam.y - (p.y + 0.95), cam.z - p.z);
    const loc = cell(p.x - c.IC.x, p.z - c.IC.z, p.y);
    const room = loc ? loc.id : "";
    const at = { room: room, dist: +dist.toFixed(2), x: +lx.toFixed(2), y: +ly.toFixed(2), z: +lz.toFixed(2) };
    if (dist < 1.75) return { ok: false, reason: "princess", ...at };
    const shells = {
      hall: [-4.7, 4.7, 0.6, 4.7, 4.2, 13.15],
      stair: [-4.7, 4.7, 0.8, 4.7, 7.4, 13.15],
      throne: [-4.2, 4.2, 0.6, 4.6, -0.6, 3.1],
      ballroom: [-15.8, -6.0, 0.6, 4.4, 3.7, 7.7],
      kitchen: [6.2, 15.6, 0.6, 4.4, 3.8, 8.7],
      biscuit: [-12.8, -5.8, 0.5, 4.2, 9.0, 12.7],
      trophy: [5.8, 12.8, 0.5, 4.2, 9.6, 12.7],
      landing: [-4.2, 4.2, 4.8, 8.2, 5.0, 7.6],
      bedroom: [-15.8, -6.0, 4.8, 8.2, 4.0, 12.2],
      studio: [6.0, 15.8, 4.8, 8.2, 4.0, 12.2],
      balcony: [-6.4, 6.4, 5.2, 9.4, 14.7, 20.6],
      tunnel: [17.6, 27.6, -1.9, 1.4, 7.0, 9.2],
      library: [29.2, 40.6, -1.9, 1.6, 3.0, 13.6]
    };
    const shell = shells[room];
    if (shell && !(lx > shell[0] && lx < shell[1] && ly > shell[2] && ly < shell[3] && lz > shell[4] && lz < shell[5])) {
      return { ok: false, reason: "shell", ...at };
    }
    const solids = [
      [-1.65, 1.65, 0, 4.35, 6.05, 11.25],
      [7.7, 13.1, 0.25, 0.75, 5.6, 7.0],
      [15.25, 15.9, 0, 3.0, 6.9, 9.5],
      [-13.2, -10.8, 4.2, 5.9, 8.45, 10.0]
    ];
    for (let i = 0; i < solids.length; i++) {
      const b = solids[i];
      if (lx > b[0] && lx < b[1] && ly > b[2] && ly < b[3] && lz > b[4] && lz < b[5]) return { ok: false, reason: "solid", ...at };
    }
    const THREE = three();
    if (THREE && PE.scene) {
      const dir = new THREE.Vector3();
      PE.camera.getWorldDirection(dir);
      const meshes = [];
      PE.scene.traverse((o) => { if (o.isMesh && o.visible && o.matrixWorld) meshes.push(o); });
      const ray = new THREE.Raycaster(cam, dir, 0.02, 0.45);
      const hits = ray.intersectObjects(meshes, false);
      for (let i = 0; i < hits.length; i++) {
        const obj = hits[i].object;
        if (!obj.visible) continue;
        let node = obj;
        let actor = false;
        while (node) {
          if (node === PE.princess) actor = true;
          node = node.parent;
        }
        if (actor) continue;
        return { ok: false, reason: "near", name: obj.name || obj.type, hit: +hits[i].distance.toFixed(2), ...at };
      }
    }
    return { ok: true, ...at };
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
      if (cloaked.length) cloakWorld(false);
      if (clearSaved && PE.renderer && clearHold) {
        PE.renderer.setClearColor(clearHold);
        PE.scene.background = savedBg;
        savedBg = undefined;
        clearSaved = false;
        balconySky = false;
      }
      return;
    }
    cloakWorld(true);
    const p = PE.princess.position;
    const lock = window.PE_V53 && window.PE_V53.lock;
    if (lock) {
      p.set(lock.x, lock.y, lock.z);
      if (anchor) anchor.set(lock.x, lock.y, lock.z);
    }
    if (!anchor) anchor = p.clone();
    else if (Math.hypot(p.x - anchor.x, p.z - anchor.z) > 2.5) anchor.set(p.x, p.y, p.z);
    integrate(dt);
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

  let nightBits = null;
  function buryNight(PE) {
    if (!nightBits) {
      nightBits = [];
      const princess = PE.princess;
      PE.scene.traverse((o) => {
        if (!o || (!o.isMesh && !o.isPoints && !o.isSprite) || o.name === "v53-sky") return;
        let p = o;
        let inside = false;
        let actor = false;
        while (p) {
          if (p.name === "v53-inside" || p.name === "v53-panorama") inside = true;
          if (p === princess) actor = true;
          p = p.parent;
        }
        if (!inside && !actor) nightBits.push(o);
      });
    }
    nightBits.forEach((o) => {
      if (o.userData.v53night == null) o.userData.v53night = o.visible;
      o.visible = false;
    });
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
        if (nightBits) nightBits.forEach((o) => { if (o.userData.v53night != null) o.visible = o.userData.v53night; });
        return;
      }
      buryNight(PE);
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

  function hookStay(c, PE) {
    if (c.stepInterior) {
      const prev = c.stepInterior.bind(c);
      c.stepInterior = function (dt) {
        const p = PE.princess.position;
        const x = p.x;
        const y = p.y;
        const z = p.z;
        const out = prev(dt);
        const was = cell(x - c.IC.x, z - c.IC.z, y);
        if (was && (Math.abs(p.x - x) > 0.02 || Math.abs(p.z - z) > 0.02)) {
          p.x = x;
          p.z = z;
          p.y = was.y;
        }
        return out;
      };
    }
    if (c.nearestInterior) {
      const prevNear = c.nearestInterior.bind(c);
      c.nearestInterior = function () {
        const hit = prevNear();
        if (hit !== "exit" || !PE.princess) return hit;
        const p = PE.princess.position;
        const loc = cell(p.x - c.IC.x, p.z - c.IC.z, anchor ? anchor.y : p.y);
        if (loc && loc.y > 1.6) return null;
        return hit;
      };
    }
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
    hookStay(c, PE);
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
      viewClear: viewClear,
      clearOfFurniture: clearOfFurniture,
      angle: 0,
      openPassage: revealPassage,
      realms: () => ["east-realm", "north-realm", "west-realm"],
      error: ""
    };
    window.PE_V53 = api;
    PE.v53 = api;
  }
  boot();
})();

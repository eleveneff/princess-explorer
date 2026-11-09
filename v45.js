/* Princess Explorer v4.5 — quests, castle care, review, grown-up page.
   Loaded after the game. Does not change coin prices. */
(function () {
  const PE = window.PrincessExplorer;
  if (!PE || !PE.gfx43) return;
  const THREE = PE.gfx43.THREE;
  const SCALE = 1.3;
  const OLD_R = 15;
  const NEW_R = 19.5;
  const MOAT = { x: 0, z: -1, mid: 8.8 };

  function coins() {
    return Math.max(0, Math.floor(+PE.state().score || 0));
  }
  function bag() {
    const s = PE.state();
    if (!s.v45 || typeof s.v45 !== "object") s.v45 = {};
    const v = s.v45;
    if (!v.quest) v.quest = { at: 0, done: {}, arrived: {} };
    if (!v.care) v.care = { owned: {}, spent: 0 };
    if (!v.care.owned) v.care.owned = {};
    if (!v.spend) v.spend = { castle: 0, care: 0 };
    if (!v.review) v.review = { week: "", ids: [], i: 0 };
    if (!v.miss) v.miss = {};
    if (!v.recent) v.recent = [];
    return v;
  }
  function persist() {
    PE.save();
    PE.renderHUD && PE.renderHUD();
  }

  function migrateLayout() {
    const s = PE.state();
    const v = bag();
    if (v.layout === 1) return;
    const pos = s.pos;
    if (pos && Number.isFinite(+pos.x) && Number.isFinite(+pos.z)) {
      const r = Math.hypot(+pos.x, +pos.z);
      if (r > 10.4 && r <= OLD_R + 0.4) {
        const nx = +(+pos.x * SCALE).toFixed(2);
        const nz = +(+pos.z * SCALE).toFixed(2);
        s.pos = { x: nx, z: nz };
        if (PE.princess) {
          PE.princess.position.x = nx;
          PE.princess.position.z = nz;
          if (PE.groundH) PE.princess.position.y = PE.groundH(nx, nz);
        }
      }
    }
    v.layout = 1;
    persist();
  }

  const CHAPTERS = [
    { id: "gate", title: "The Castle Gate", emoji: "🏰",
      story: "Princess Amara wants a kindness party. The first step is the castle gate. She can pay 10 coins, or get 3 answers in a row and walk in free.",
      goal: "Go inside the castle.",
      learn: "Main idea: the chapter is about getting inside.",
      here: () => !!(PE.v3 && PE.v3.castle && PE.v3.castle.inCastle),
      q: { type: "main_idea", prompt: "What is Amara trying to do first?", choices: ["Get inside the castle", "Bake one hundred cakes", "Swim across the moat", "Hide every crown"], answer: 0, explain: "The gate is the first step. She wants to go inside." } },
    { id: "throne", title: "The Promise Chair", emoji: "👑", room: "throne",
      story: "In the Throne Hall she makes one promise: she will learn a little in every room.",
      goal: "Visit the Throne Hall.",
      learn: "Sequence: first the gate, next the throne.",
      q: { type: "sequence", prompt: "What did Amara do first, before the throne?", choices: ["She went through the castle gate", "She flew to the moon", "She sold the castle", "She forgot Sir Biscuit"], answer: 0, explain: "First the gate, next the throne. That is the order of the story." } },
    { id: "library", title: "Library Words", emoji: "📚", room: "library",
      story: "The library is full of stories. One word today: cheerful means happy and bright.",
      goal: "Visit the Library.",
      learn: "Vocabulary: cheerful.",
      q: { type: "vocab", prompt: "In this story, what does cheerful mean?", choices: ["Happy and bright", "Very sleepy", "Full of mud", "Far away"], answer: 0, explain: "Cheerful means happy and bright." } },
    { id: "kitchen", title: "Bakery Counting", emoji: "🧁", room: "kitchen",
      story: "The baker sets 4 cups and 3 plates for a tiny tea.",
      goal: "Visit the Kitchen Bakery.",
      learn: "Addition: 4 + 3.",
      q: { type: "addition", prompt: "4 cups and 3 plates. How many things is that in all?", choices: ["7", "1", "12", "43"], answer: 0, explain: "4 + 3 = 7." } },
    { id: "biscuit", title: "Sir Biscuit's Hunt", emoji: "🐶", room: "biscuit",
      story: "Sir Biscuit hid a blue ball in his own room. A detail is a small fact.",
      goal: "Visit Sir Biscuit's room.",
      learn: "Details: the ball is blue.",
      q: { type: "details", prompt: "What color is the ball Sir Biscuit hid?", choices: ["Blue", "Green", "Black", "Orange"], answer: 0, explain: "The story says the ball is blue. That is a detail." } },
    { id: "ballroom", title: "Ballroom Pattern", emoji: "💃", room: "ballroom",
      story: "The floor sparkles in a pattern: star, star, moon, star, star, moon.",
      goal: "Visit the Ballroom.",
      learn: "Patterns: what repeats.",
      q: { type: "pattern", prompt: "Star, star, moon, star, star, ____. What comes next?", choices: ["Moon", "Star", "Crown", "Boat"], answer: 0, explain: "The pattern is star, star, moon. Next is moon." } },
    { id: "balcony", title: "Balcony Feelings", emoji: "🌷", room: "balcony",
      story: "On the balcony Amara sees the garden and smiles. You can tell she feels glad.",
      goal: "Visit the Balcony Garden.",
      learn: "Inference: a smile means glad.",
      q: { type: "inference", prompt: "How does Amara feel on the balcony?", choices: ["Glad", "Angry", "Lost", "Sleepy"], answer: 0, explain: "She smiles at the garden, so she feels glad." } },
    { id: "garden", title: "Garden Walk", emoji: "🌹",
      story: "The garden island grows roses. A garden is a place for plants.",
      goal: "Walk to the Garden island.",
      learn: "Main idea: the garden is for plants.",
      here: () => {
        const p = PE.princess && PE.princess.position;
        if (!p || (PE.v3 && PE.v3.castle && PE.v3.castle.inCastle)) return false;
        const a = 30 * Math.PI / 180;
        return Math.hypot(p.x - Math.cos(a) * 30, p.z - Math.sin(a) * 30) < 12;
      },
      q: { type: "main_idea", prompt: "What is the garden for?", choices: ["Growing plants", "Parking boats only", "Hiding the moon", "Counting clouds"], answer: 0, explain: "A garden is a place where plants grow." } },
    { id: "trophy", title: "Trophy Numbers", emoji: "🏆", room: "trophy",
      story: "The trophy room keeps her stars. Which number is greater: 8 or 5?",
      goal: "Visit the Trophy Room.",
      learn: "Compare numbers.",
      q: { type: "compare", prompt: "Which number is greater?", choices: ["8", "5", "They are the same", "0"], answer: 0, explain: "8 is greater than 5." } },
    { id: "practice", title: "Practice Day", emoji: "✨",
      story: "A real princess practices. Answer one review question, or any glowing-circle question.",
      goal: "Answer one practice or review question.",
      learn: "Practice makes the tricky kinds easier.",
      here: () => (bag().quest.flags && bag().quest.flags.practiced) || false,
      q: { type: "main_idea", prompt: "Why does Amara practice?", choices: ["To get better at tricky kinds of questions", "To paint the moat black", "To send Sir Biscuit away", "To close the castle"], answer: 0, explain: "Practice helps the tricky question types." } }
  ];

  function roomHere(room) {
    const c = PE.v3 && PE.v3.castle;
    if (!c || !c.inCastle) return false;
    const p = PE.princess.position;
    const x = p.x - c.IC.x, z = p.z - c.IC.z;
    if (room === "throne") return z < -17 && Math.abs(x) < 8;
    if (room === "biscuit") return z < -22.4 && Math.abs(x) < 6;
    if (room === "library") return z > 6.2 && z < 15.6 && Math.abs(x) < 9;
    if (room === "balcony") return z > 16.2 && Math.abs(x) < 5;
    if (room === "trophy") return x > 12 && z < -1;
    if (room === "bedroom") return x < -12 && z < -1;
    if (room === "kitchen") return x > 12 && z > 2;
    if (room === "ballroom") return x < -12 && z > 2;
    return false;
  }
  function chapterHere(ch) {
    if (ch.room) return roomHere(ch.room);
    if (ch.here) return !!ch.here();
    return false;
  }

  function catalog() {
    const map = {};
    const locs = PE.LOCS || {};
    Object.keys(locs).forEach((id) => {
      const L = locs[id];
      (L.readings || []).forEach((r) => (r.questions || []).forEach((q) => { map[q.id] = { type: q.type || "reading", q }; }));
      (L.math || []).forEach((q) => { map[q.id] = { type: q.topic || q.kind || "math", q }; });
    });
    return map;
  }
  function noteAnswer(id, ok, type) {
    const v = bag();
    if (PE.practice && PE.practice.record) PE.practice.record(id, !!ok);
    else {
      const s = PE.state();
      s.qhist = s.qhist || {};
      const h = s.qhist[id] = Object.assign({ c: 0, w: 0, n: 0, t: 0 }, s.qhist[id]);
      h.n++; h.t = Date.now(); ok ? h.c++ : h.w++;
    }
    if (!ok && type) v.miss[type] = (v.miss[type] || 0) + 1;
    v.recent.unshift({ id, ok: !!ok, type: type || "practice", t: Date.now() });
    if (v.recent.length > 24) v.recent.length = 24;
    if (ok) v.quest.flags = v.quest.flags || {}, v.quest.flags.practiced = 1;
    persist();
  }

  const DEFS = [
    { id: "terrace", name: "Royal Garden Terrace", price: 40, need: [], blurb: "Flower beds, a fountain, and a garden math challenge.", ang: 142, rad: 14.6, front: 4.4 },
    { id: "stable", name: "Pony Stable", price: 50, need: [], blurb: "Brush the pony and ride around the grounds.", ang: 232, rad: 15.4, front: 4.8 },
    { id: "studio", name: "Art Studio Tower", price: 45, need: [], blurb: "Paint shapes and hang a picture in the castle.", ang: 118, rad: 16.2, front: 4.6 },
    { id: "nook", name: "Secret Library Nook", price: 35, need: [], blurb: "A sliding bookcase and a quiet reading spot.", ang: 322, rad: 14.6, front: 4.4 },
    { id: "tea", name: "Tea Party Pavilion", price: 30, need: ["terrace"], blurb: "Set the table with fractions. Needs the Garden Terrace.", ang: 38, rad: 14.8, front: 4.6 },
    { id: "maze", name: "Rose Maze", price: 35, need: ["terrace"], blurb: "A hedge maze with clues. Needs the Garden Terrace.", ang: 270, rad: 15.6, front: 5.2 },
    { id: "training", name: "Fencing and Jiu Jitsu Training Hall", price: 50, need: [], blurb: "Practice spots and ribbons.", ang: 98, rad: 16.8, front: 4.8 },
    { id: "court", name: "Royal Tennis Court", price: 40, need: [], blurb: "A court beside the castle, tied to the tennis game.", ang: 178, rad: 15.3, front: 5.4 },
    { id: "observatory", name: "Star Observatory", price: 45, need: [], blurb: "A telescope dome and constellation patterns.", ang: 198, rad: 16.4, front: 4.8 },
    { id: "swans", name: "Moat Swan Boats", price: 30, need: [], blurb: "Pedal a swan boat around the moat.", ang: 50, rad: 10.6, front: 3.7, side: 2.15 },
    { id: "stage", name: "Grand Ballroom Chandelier and Stage", price: 35, need: [], blurb: "A dance stage and a glowing chandelier inside the ballroom.", ang: 90, rad: 18, front: 4 },
    { id: "corgi", name: "Corgi Castle for Sir Biscuit", price: 25, need: [], blurb: "A doghouse and a treat game. No coins, just a happy corgi.", ang: 308, rad: 15.2, front: 4.6 }
  ];
  function centerOf(d) {
    const a = d.ang * Math.PI / 180;
    return { x: Math.cos(a) * d.rad, z: Math.sin(a) * d.rad };
  }
  function spotOf(d) {
    const a = d.ang * Math.PI / 180;
    const R = d.rad + (d.front || 4.4);
    const side = d.side || 0;
    return { x: Math.cos(a) * R + Math.sin(a) * side, z: Math.sin(a) * R - Math.cos(a) * side };
  }
  function def(id) { return DEFS.find((d) => d.id === id) || null; }
  function own(id) { return !!(bag().care.owned && bag().care.owned[id]); }
  function needsOk(d) { return (d.need || []).every(own); }

  const MAT = {};
  function mats() {
    if (MAT.ready) return;
    MAT.stone = new THREE.MeshLambertMaterial({ color: "#e7d7c8" });
    MAT.barn = new THREE.MeshLambertMaterial({ color: "#8d4a2a" });
    MAT.barnDark = new THREE.MeshLambertMaterial({ color: "#5c3018" });
    MAT.roofRed = new THREE.MeshLambertMaterial({ color: "#c44536" });
    MAT.hay = new THREE.MeshLambertMaterial({ color: "#e2b04a" });
    MAT.dark = new THREE.MeshLambertMaterial({ color: "#3a2418" });
    MAT.gold = new THREE.MeshLambertMaterial({ color: "#e6b422", emissive: "#c8960a", emissiveIntensity: 0.35 });
    MAT.leaf = new THREE.MeshLambertMaterial({ color: "#6fbf73", emissive: "#2f7a3a", emissiveIntensity: 0.18 });
    MAT.petal = new THREE.MeshLambertMaterial({ color: "#ff8cc6", emissive: "#ff5fa2", emissiveIntensity: 0.28 });
    MAT.water = new THREE.MeshLambertMaterial({ color: "#b7f0ff", emissive: "#4fb8e0", emissiveIntensity: 0.45 });
    MAT.wood = new THREE.MeshLambertMaterial({ color: "#c98b4a" });
    MAT.glow = new THREE.MeshLambertMaterial({ color: "#fff6d0", emissive: "#ffe08a", emissiveIntensity: 0.85 });
    MAT.white = new THREE.MeshLambertMaterial({ color: "#fffaf6" });
    MAT.swan = new THREE.MeshPhongMaterial({ color: "#fffdf8", emissive: "#f3efe8", emissiveIntensity: 0.18, shininess: 48, specular: "#ffffff" });
    MAT.ripple = new THREE.MeshLambertMaterial({ color: "#e7f8ff", transparent: true, opacity: 0.55, emissive: "#9ed8ee", emissiveIntensity: 0.25, depthWrite: false });
    MAT.roof = new THREE.MeshLambertMaterial({ color: "#b57bff", emissive: "#7a4fd6", emissiveIntensity: 0.2 });
    MAT.hedge = new THREE.MeshLambertMaterial({ color: "#3e9a48", emissive: "#2f7a3a", emissiveIntensity: 0.12 });
    MAT.court = new THREE.MeshLambertMaterial({ color: "#3f8f5a" });
    MAT.line = new THREE.MeshLambertMaterial({ color: "#ffffff" });
    MAT.ready = 1;
  }
  function mesh(geo, mat, x, y, z, sx, sy, sz) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (sx) m.scale.set(sx, sy || sx, sz || sx);
    m.castShadow = false;
    m.receiveShadow = true;
    return m;
  }
  const BOX = new THREE.BoxGeometry(1, 1, 1);
  const CYL = new THREE.CylinderGeometry(1, 1, 1, 12);
  const SPH = new THREE.SphereGeometry(1, 10, 8);
  const CONE = new THREE.ConeGeometry(1, 1, 10);

  function lawn() {
    if (PE.scene.getObjectByName("v45-lawn")) return;
    mats();
    const g = new THREE.Group();
    g.name = "v45-lawn";
    const ring = new THREE.Mesh(new THREE.RingGeometry(10.7, NEW_R, 64), new THREE.MeshLambertMaterial({ color: "#b6e39a" }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.035;
    ring.receiveShadow = true;
    g.add(ring);
    const edge = new THREE.Mesh(new THREE.RingGeometry(NEW_R - 0.18, NEW_R, 64), MAT.gold);
    edge.rotation.x = -Math.PI / 2;
    edge.position.y = 0.04;
    g.add(edge);
    PE.scene.add(g);
  }

  function plaque(text, w, h) {
    const lines = Array.isArray(text) ? text : [text];
    const c = document.createElement("canvas");
    c.width = 1024; c.height = 280;
    const g = c.getContext("2d");
    g.fillStyle = "#fff8ea";
    g.fillRect(0, 0, 1024, 280);
    g.strokeStyle = "#3b1468";
    g.lineWidth = 36;
    g.strokeRect(18, 18, 988, 244);
    g.fillStyle = "#2a1248";
    g.textAlign = "center";
    g.textBaseline = "middle";
    const draw = (line, y, max) => {
      let size = max;
      g.font = `bold ${size}px Trebuchet MS, sans-serif`;
      while (size > 42 && g.measureText(line).width > 940) { size -= 4; g.font = `bold ${size}px Trebuchet MS, sans-serif`; }
      g.fillText(line, 512, y);
    };
    if (lines.length === 1) draw(lines[0], 146, 96);
    else { draw(lines[0], 100, 80); draw(lines[1], 190, 80); }
    const tex = new THREE.CanvasTexture(c);
    if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    return m;
  }
  function doorSign(text, x, y, z, rot) {
    const s = plaque(text, 0.78, 0.22);
    s.position.set(x, y, z);
    s.rotation.y = rot;
    return s;
  }
  function hallSigns() {
    const cg = PE.v3 && PE.v3.castle && PE.v3.castle.castleIn && PE.v3.castle.castleIn.group;
    if (!cg || cg.getObjectByName("v45-signs")) return;
    mats();
    const root = new THREE.Group();
    root.name = "v45-signs";
    root.add(doorSign("Throne Hall", 0, 3.85, -16.2, 0));
    root.add(doorSign("Library", 0, 3.85, 6.35, 0));
    root.add(doorSign("Ballroom", -10.15, 3.35, 8, Math.PI / 2));
    root.add(doorSign("Bedroom", -10.15, 3.35, -9, Math.PI / 2));
    root.add(doorSign("Kitchen", 10.15, 3.35, 8, -Math.PI / 2));
    root.add(doorSign("Trophy", 10.15, 3.35, -9, -Math.PI / 2));
    [[-6.6, 3.2], [6.6, 3.2], [-6.6, -6], [6.6, -6]].forEach(([x, z]) => {
      root.add(mesh(CYL, MAT.stone, x, 0.14, z, 0.16, 0.22, 0.16));
      root.add(mesh(SPH, MAT.petal, x, 0.36, z, 0.11));
      root.add(mesh(SPH, MAT.glow, x, 0.46, z, 0.035));
    });
    const win = mesh(BOX, MAT.glow, -9.7, 3.5, -2, 0.06, 0.9, 0.55);
    const win2 = mesh(BOX, MAT.glow, 9.7, 3.5, -2, 0.06, 0.9, 0.55);
    root.add(win, win2);
    cg.add(root);
  }

  function rose(g, x, y, z) {
    g.add(mesh(SPH, MAT.petal, x, y, z, 0.13));
    g.add(mesh(SPH, MAT.glow, x, y + 0.08, z, 0.045));
  }
  function lampPost(g, x, y, z) {
    g.add(mesh(CYL, MAT.gold, x, y, z, 0.05, 0.7, 0.05));
    g.add(mesh(SPH, MAT.glow, x, y + 0.42, z, 0.12));
  }
  function standRing(g) {
    const t = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.07, 8, 28), MAT.gold);
    t.rotation.x = -Math.PI / 2;
    t.position.y = 0.06;
    g.add(t);
  }
  function hedge(g, x, z, w, d, blocks) {
    const h = 2.45;
    g.add(mesh(BOX, MAT.hedge, x, h * 0.46, z, w, h * 0.92, d));
    const alongX = w >= d;
    const len = Math.max(w, d);
    const n = Math.max(3, Math.round(len / 0.5));
    for (let i = 0; i < n; i++) {
      const t = (i / (n - 1) - 0.5) * len * 0.92;
      const rx = x + (alongX ? t : 0);
      const rz = z + (alongX ? 0 : t);
      g.add(mesh(SPH, MAT.hedge, rx, h - 0.15, rz, alongX ? 0.42 : Math.max(0.4, w * 0.55), 0.48, alongX ? Math.max(0.4, d * 0.55) : 0.42));
      if (i % 2 === 0) rose(g, rx, h + 0.22, rz);
    }
    if (blocks) blocks.push({ x, z, r: Math.min(w, d) * 0.42 });
  }
  function swanBoat(name) {
    const boat = new THREE.Group();
    boat.name = name;
    boat.add(mesh(BOX, MAT.wood, 0, 0.28, -0.05, 2.35, 0.22, 0.95));
    boat.add(mesh(BOX, MAT.swan, 0, 0.42, -0.05, 2.15, 0.1, 0.82));
    boat.add(mesh(BOX, MAT.gold, 0, 0.5, 0.95, 0.9, 0.06, 0.1));
    boat.add(mesh(BOX, MAT.wood, -0.15, 0.58, -0.2, 0.62, 0.08, 0.42));
    boat.add(mesh(BOX, MAT.wood, -0.15, 0.78, -0.42, 0.62, 0.32, 0.08));
    boat.add(mesh(SPH, MAT.swan, 0, 0.7, -0.15, 0.72, 0.4, 0.88));
    const wingL = mesh(SPH, MAT.swan, -0.62, 0.66, -0.05, 0.62, 0.1, 0.78);
    wingL.rotation.z = 0.55;
    wingL.rotation.y = 0.35;
    const wingR = mesh(SPH, MAT.swan, 0.62, 0.66, -0.05, 0.62, 0.1, 0.78);
    wingR.rotation.z = -0.55;
    wingR.rotation.y = -0.35;
    boat.add(wingL, wingR);
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.72, 0.25),
      new THREE.Vector3(0, 1.15, 0.72),
      new THREE.Vector3(0, 1.62, 0.38),
      new THREE.Vector3(0, 2.05, 0.82),
      new THREE.Vector3(0, 2.38, 1.18)
    ]);
    boat.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.1, 8, false), MAT.swan));
    boat.add(mesh(SPH, MAT.swan, 0, 2.48, 1.22, 0.28, 0.24, 0.32));
    const beak = mesh(CONE, MAT.gold, 0, 2.42, 1.52, 0.08, 0.38, 0.08);
    beak.rotation.x = Math.PI / 2;
    boat.add(beak);
    boat.add(mesh(SPH, MAT.dark, 0.1, 2.56, 1.32, 0.045));
    boat.add(mesh(SPH, MAT.dark, -0.1, 2.56, 1.32, 0.045));
    boat.add(mesh(SPH, MAT.white, 0.1, 2.58, 1.34, 0.018));
    boat.add(mesh(SPH, MAT.white, -0.1, 2.58, 1.34, 0.018));
    boat.add(mesh(CYL, MAT.gold, -0.72, 0.22, 0.48, 0.16, 0.06, 0.16));
    boat.add(mesh(CYL, MAT.gold, -0.72, 0.22, -0.48, 0.16, 0.06, 0.16));
    const ripple = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.045, 8, 28), MAT.ripple);
    ripple.rotation.x = -Math.PI / 2;
    ripple.position.set(0, 0.04, -0.05);
    ripple.name = "care-swan-ripple";
    boat.add(ripple);
    return boat;
  }
  function ponyMesh() {
    const pony = new THREE.Group();
    pony.name = "care-stable-pony";
    pony.add(mesh(BOX, MAT.white, 0, 0.72, 0, 1.05, 0.42, 0.38));
    pony.add(mesh(BOX, MAT.wood, 0.62, 0.95, 0, 0.32, 0.28, 0.26));
    pony.add(mesh(SPH, MAT.wood, 0.5, 1.12, 0, 0.1));
    pony.add(mesh(BOX, MAT.wood, -0.55, 0.78, 0, 0.18, 0.08, 0.08));
    [[-0.28, 0.14], [0.28, 0.14], [-0.28, -0.14], [0.28, -0.14]].forEach(([x, z]) => pony.add(mesh(BOX, MAT.wood, x, 0.28, z, 0.1, 0.42, 0.1)));
    pony.add(mesh(SPH, MAT.white, 0.74, 0.98, 0.1, 0.05));
    return pony;
  }
  function builders() {
    return {
      terrace(g) {
        const f = new THREE.Group();
        f.name = "care-focus";
        f.add(mesh(CYL, MAT.stone, 0, 0.42, 0.2, 1.25, 0.45, 1.25));
        f.add(mesh(CYL, MAT.gold, 0, 0.68, 0.2, 1.4, 0.08, 1.4));
        f.add(mesh(CYL, MAT.water, 0, 0.74, 0.2, 1.0, 0.12, 1.0));
        f.add(mesh(CYL, MAT.gold, 0, 1.35, 0.2, 0.14, 1.05, 0.14));
        f.add(mesh(SPH, MAT.glow, 0, 2.0, 0.2, 0.18));
        [[-2.4, 1.3], [2.4, 1.3], [-2.4, -1.1], [2.4, -1.1]].forEach(([x, z]) => {
          f.add(mesh(BOX, MAT.wood, x, 0.28, z, 1.7, 0.28, 1.05));
          f.add(mesh(BOX, MAT.leaf, x, 0.46, z, 1.45, 0.1, 0.8));
          [-0.45, 0, 0.45].forEach((dx) => rose(f, x + dx, 0.7, z));
        });
        lampPost(f, 0, 1.2, 2.2);
        g.add(f);
      },
      stable(g) {
        const f = new THREE.Group();
        f.name = "care-focus";
        f.add(mesh(BOX, MAT.barn, 0, 1.35, 0, 6.4, 2.5, 3.8));
        for (let i = -6; i <= 6; i++) f.add(mesh(BOX, MAT.barnDark, i * 0.46, 1.35, 1.92, 0.08, 2.4, 0.05));
        [[-1.55, 2.85, 0.62, 2.15], [1.55, 2.85, -0.62, 2.15], [-0.55, 3.55, 0.28, 1.7], [0.55, 3.55, -0.28, 1.7]].forEach(([x, y, rz, w]) => {
          const m = mesh(BOX, MAT.roofRed, x, y, 0, w, 0.14, 4.15);
          m.rotation.z = rz;
          f.add(m);
        });
        f.add(mesh(BOX, MAT.dark, 0.15, 1.05, 1.95, 1.7, 1.9, 0.08));
        const door = mesh(BOX, MAT.barnDark, 1.35, 1.05, 2.35, 0.1, 1.85, 0.85);
        door.rotation.y = 0.7;
        f.add(door);
        const pony = ponyMesh();
        pony.position.set(-2.3, 0, 3.15);
        pony.rotation.y = -Math.PI / 2;
        pony.scale.set(1.7, 1.7, 1.7);
        pony.userData.home = { x: -2.3, y: 0, z: 3.15 };
        f.add(pony);
        f.add(mesh(BOX, MAT.hay, -1.9, 0.38, 2.55, 0.9, 0.5, 0.6));
        f.add(mesh(BOX, MAT.hay, -1.7, 0.85, 2.45, 0.7, 0.4, 0.5));
        f.add(mesh(BOX, MAT.hay, 2.1, 0.32, 2.6, 0.8, 0.42, 0.55));
        lampPost(f, -2.8, 1.3, 2.3);
        g.add(f);
      },
      studio(g) {
        const f = new THREE.Group();
        f.name = "care-focus";
        f.add(mesh(CYL, MAT.stone, 0, 1.7, 0, 1.55, 3.2, 1.55));
        f.add(mesh(CYL, MAT.gold, 0, 3.35, 0, 1.75, 0.1, 1.75));
        f.add(mesh(CONE, MAT.roof, 0, 4.15, 0, 1.9, 1.5, 1.9));
        f.add(mesh(BOX, MAT.wood, 0, 1.7, 1.5, 1.5, 1.3, 0.08));
        f.add(mesh(BOX, MAT.glow, 0, 1.7, 1.58, 1.2, 1.0, 0.05));
        const easel = new THREE.Group();
        easel.position.set(1.5, 0, 2.1);
        easel.add(mesh(BOX, MAT.wood, 0, 1.0, 0, 0.08, 1.7, 0.75));
        easel.add(mesh(BOX, MAT.white, 0, 1.25, 0.06, 0.6, 0.75, 0.05));
        easel.add(mesh(SPH, MAT.petal, 0, 1.35, 0.1, 0.14));
        f.add(easel);
        [[-0.7, 1.7], [-0.35, 1.7], [0, 1.7]].forEach(([x, z], i) => f.add(mesh(CYL, [MAT.petal, MAT.water, MAT.gold][i], x, 0.28, z, 0.1, 0.22, 0.1)));
        lampPost(f, -1.7, 1.2, 2.0);
        g.add(f);
      },
      nook(g) {
        const f = new THREE.Group();
        f.name = "care-focus";
        f.add(mesh(CYL, MAT.stone, -1.45, 1.15, 0.9, 0.28, 2.2, 0.28));
        f.add(mesh(CYL, MAT.stone, 1.45, 1.15, 0.9, 0.28, 2.2, 0.28));
        const arch = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.26, 10, 18, Math.PI), MAT.stone);
        arch.position.set(0, 2.15, 0.9);
        f.add(arch);
        f.add(mesh(BOX, MAT.stone, 0, 1.3, -0.7, 3.4, 2.4, 0.35));
        f.add(mesh(BOX, MAT.gold, 0, 2.55, 0.9, 3.3, 0.1, 0.35));
        const book = new THREE.Group();
        book.name = "care-nook-book";
        book.rotation.y = -Math.PI / 2;
        book.position.set(-0.85, 0, 0.15);
        book.userData.shut = -1.15;
        book.add(mesh(BOX, MAT.wood, 0, 1.15, 0, 0.28, 1.8, 1.2));
        [-0.35, 0, 0.35].forEach((z, i) => book.add(mesh(BOX, [MAT.petal, MAT.roof, MAT.gold][i], 0.16, 1.15, z, 0.05, 1.2, 0.24)));
        f.add(book);
        f.add(mesh(BOX, MAT.wood, 0.55, 0.42, -0.15, 1.15, 0.36, 0.5));
        f.add(mesh(BOX, MAT.petal, 0.55, 0.64, -0.15, 1.05, 0.08, 0.42));
        lampPost(f, 1.7, 1.15, 1.8);
        g.add(f);
      },
      tea(g) {
        const f = new THREE.Group();
        f.name = "care-focus";
        for (let i = 0; i < 6; i++) {
          const a = i / 6 * Math.PI * 2;
          f.add(mesh(CYL, MAT.wood, Math.cos(a) * 2.15, 1.35, Math.sin(a) * 2.15, 0.12, 2.6, 0.12));
        }
        f.add(mesh(CYL, MAT.gold, 0, 2.7, 0, 2.45, 0.1, 2.45));
        f.add(mesh(SPH, MAT.white, 0, 3.15, 0, 2.15, 1.05, 2.15));
        f.add(mesh(CYL, MAT.wood, 0, 0.45, 0, 0.85, 0.12, 0.85));
        f.add(mesh(CYL, MAT.white, 0, 0.58, 0, 1.0, 0.08, 1.0));
        f.add(mesh(SPH, MAT.petal, 0, 0.85, 0, 0.18));
        [[-0.45, 0.45], [0.45, 0.45], [-0.45, -0.45], [0.45, -0.45]].forEach(([x, z]) => {
          f.add(mesh(BOX, MAT.wood, x, 0.38, z, 0.4, 0.4, 0.4));
          f.add(mesh(CYL, MAT.white, x, 0.72, z, 0.1, 0.08, 0.1));
        });
        g.add(f);
      },
      maze(g) {
        const f = new THREE.Group();
        f.name = "care-focus";
        const blocks = [];
        hedge(f, -2.5, 1.7, 2.7, 0.8, blocks);
        hedge(f, 2.5, 1.7, 2.7, 0.8, blocks);
        hedge(f, -3.6, -0.5, 0.8, 4.6, blocks);
        hedge(f, 3.6, -0.5, 0.8, 4.6, blocks);
        hedge(f, 0, -2.6, 7.4, 0.8, blocks);
        hedge(f, -1.2, -0.3, 0.7, 2.4, blocks);
        hedge(f, 1.6, -1.2, 2.6, 0.7, blocks);
        rose(f, 0, 0.45, -0.6);
        g.userData.blocks = blocks;
        g.add(f);
      },
      training(g) {
        const f = new THREE.Group();
        f.name = "care-focus";
        f.add(mesh(BOX, MAT.barn, -2.5, 1.4, 0, 0.35, 2.6, 5.2));
        f.add(mesh(BOX, MAT.barn, 2.5, 1.4, 0, 0.35, 2.6, 5.2));
        f.add(mesh(BOX, MAT.barnDark, 0, 1.5, -2.55, 5.2, 2.8, 0.3));
        [-1, 1].forEach((s) => {
          const slope = mesh(BOX, MAT.roofRed, s * 1.25, 3.05, 0, 2.7, 0.16, 5.4);
          slope.rotation.z = s * -0.45;
          f.add(slope);
        });
        f.add(mesh(BOX, MAT.water, -1.1, 0.1, 0.4, 1.6, 0.08, 2.2));
        f.add(mesh(BOX, MAT.petal, 1.1, 0.1, 0.4, 1.6, 0.08, 2.2));
        f.add(mesh(CYL, MAT.white, 0, 1.6, -2.35, 0.75, 0.08, 0.75));
        f.add(mesh(CYL, MAT.petal, 0, 1.6, -2.28, 0.45, 0.06, 0.45));
        f.add(mesh(CYL, MAT.gold, 0, 1.6, -2.24, 0.16, 0.05, 0.16));
        lampPost(f, 0, 1.5, 2.3);
        g.add(f);
      },
      court(g) {
        const f = new THREE.Group();
        f.name = "care-focus";
        f.add(mesh(BOX, MAT.court, 0, 0.08, 0, 7.4, 0.1, 4.6));
        f.add(mesh(BOX, MAT.line, 0, 0.16, 0, 7.0, 0.03, 0.08));
        f.add(mesh(BOX, MAT.line, 0, 0.16, 0, 0.08, 0.03, 4.2));
        f.add(mesh(BOX, MAT.line, -1.7, 0.16, 0, 0.08, 0.03, 2.0));
        f.add(mesh(BOX, MAT.line, 1.7, 0.16, 0, 0.08, 0.03, 2.0));
        [-3.6, 3.6].forEach((x) => f.add(mesh(CYL, MAT.wood, x, 0.75, 0, 0.08, 1.4, 0.08)));
        f.add(mesh(BOX, MAT.white, 0, 0.9, 0, 7.0, 0.75, 0.05));
        [[-4.0, 2.2], [4.0, 2.2], [-4.0, -2.2], [4.0, -2.2]].forEach(([x, z]) => f.add(mesh(CYL, MAT.wood, x, 0.75, z, 0.08, 1.45, 0.08)));
        f.add(mesh(BOX, MAT.wood, 0, 1.25, 2.2, 8.0, 0.08, 0.08));
        f.add(mesh(BOX, MAT.wood, 0, 1.25, -2.2, 8.0, 0.08, 0.08));
        lampPost(f, -4.3, 1.1, 2.4);
        g.add(f);
      },
      observatory(g) {
        const f = new THREE.Group();
        f.name = "care-focus";
        f.add(mesh(CYL, MAT.stone, 0, 1.55, 0, 1.7, 2.9, 1.7));
        f.add(mesh(CYL, MAT.gold, 0, 3.05, 0, 1.9, 0.12, 1.9));
        f.add(mesh(SPH, MAT.roof, 0, 3.55, 0, 1.75, 1.05, 1.75));
        f.add(mesh(BOX, MAT.stone, 0, 4.05, 0.4, 0.22, 0.85, 1.7));
        const scope = mesh(CYL, MAT.gold, 0, 3.7, 1.7, 0.18, 1.8, 0.18);
        scope.rotation.x = Math.PI / 2;
        f.add(scope);
        f.add(mesh(SPH, MAT.glow, 0, 3.7, 2.6, 0.2));
        f.add(mesh(BOX, MAT.wood, 0, 1.25, 1.65, 0.9, 1.5, 0.1));
        lampPost(f, 2.0, 1.2, 1.8);
        g.add(f);
      },
      swans(g) {
        const f = new THREE.Group();
        f.name = "care-focus";
        [0.15, 0.52, 0.89, 1.26, 1.63].forEach((z) => {
          f.add(mesh(BOX, MAT.wood, 0, 0.32, z, 1.85, 0.08, 0.28));
        });
        f.add(mesh(BOX, MAT.gold, 0, 0.4, 0.02, 1.95, 0.06, 0.08));
        f.add(mesh(BOX, MAT.gold, 0, 0.4, 1.78, 1.95, 0.06, 0.08));
        [[-0.82, 0.12], [0.82, 0.12], [-0.82, 1.68], [0.82, 1.68]].forEach(([x, z]) => {
          f.add(mesh(CYL, MAT.wood, x, 0.62, z, 0.07, 1.05, 0.07));
          f.add(mesh(CYL, MAT.gold, x, 1.12, z, 0.09, 0.06, 0.09));
        });
        [[0.12, 1.68], [0.9, 1.26]].forEach(([z0, z1]) => {
          [-0.82, 0.82].forEach((x) => {
            const rope = mesh(CYL, MAT.barnDark, x, 0.9, (z0 + z1) / 2, 0.025, Math.abs(z1 - z0), 0.025);
            rope.rotation.x = Math.PI / 2;
            f.add(rope);
          });
        });
        const sideRope = mesh(CYL, MAT.barnDark, 0, 0.92, 0.12, 0.025, 1.64, 0.025);
        sideRope.rotation.z = Math.PI / 2;
        f.add(sideRope);
        const sideRope2 = mesh(CYL, MAT.barnDark, 0, 0.92, 1.68, 0.025, 1.64, 0.025);
        sideRope2.rotation.z = Math.PI / 2;
        f.add(sideRope2);
        f.add(mesh(CYL, MAT.gold, 0.82, 1.28, 1.68, 0.035, 0.34, 0.035));
        f.add(mesh(SPH, MAT.glow, 0.82, 1.5, 1.68, 0.12));
        const boat = swanBoat("care-swan-boat");
        boat.scale.set(1.18, 1.18, 1.18);
        boat.position.set(1.45, 0.02, -1.05);
        boat.userData.home = { x: 1.45, y: 0.02, z: -1.05, ry: 0.15 };
        boat.rotation.y = 0.15;
        f.add(boat);
        const tie = mesh(CYL, MAT.barnDark, 1.05, 0.55, -0.35, 0.02, 1.15, 0.02);
        tie.rotation.z = Math.PI / 2;
        tie.rotation.y = 0.7;
        f.add(tie);
        g.add(f);
      },
      stage(g) {
        const cg = PE.v3 && PE.v3.castle && PE.v3.castle.castleIn && PE.v3.castle.castleIn.group;
        if (cg && !cg.getObjectByName("care-stage-in")) {
          const inn = new THREE.Group();
          inn.name = "care-stage-in";
          const show = new THREE.Group();
          show.name = "care-stage-show";
          show.add(mesh(BOX, MAT.wood, -17, 0.32, 5.0, 5.6, 0.36, 2.2));
          show.add(mesh(BOX, MAT.wood, -17, 0.18, 6.5, 1.8, 0.2, 0.8));
          show.add(mesh(BOX, MAT.gold, -17, 0.54, 6.05, 5.8, 0.08, 0.12));
          show.add(mesh(BOX, MAT.petal, -19.9, 1.7, 5.2, 0.16, 2.4, 0.1));
          show.add(mesh(BOX, MAT.petal, -14.1, 1.7, 5.2, 0.16, 2.4, 0.1));
          const lamp = new THREE.Group();
          lamp.name = "care-stage-lamp";
          lamp.position.set(-17, 3.5, 6.2);
          lamp.add(mesh(CYL, MAT.gold, 0, 0.7, 0, 0.05, 1.1, 0.05));
          lamp.add(mesh(CYL, MAT.gold, 0, 0.02, 0, 1.05, 0.08, 1.05));
          for (let i = 0; i < 8; i++) {
            const a = i / 8 * Math.PI * 2;
            lamp.add(mesh(SPH, MAT.glow, Math.cos(a) * 0.85, -0.16, Math.sin(a) * 0.85, 0.14));
          }
          show.add(lamp);
          const ring = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.06, 8, 24), MAT.gold);
          ring.rotation.x = -Math.PI / 2;
          ring.position.set(-17, 0.08, 8.4);
          show.add(ring);
          inn.add(show);
          cg.add(inn);
        }
      },
      corgi(g) {
        const f = new THREE.Group();
        f.name = "care-focus";
        [[-1.2, -0.75], [1.2, -0.75], [-1.2, 0.75], [1.2, 0.75]].forEach(([x, z]) => {
          f.add(mesh(CYL, MAT.stone, x, 1.2, z, 0.38, 2.3, 0.38));
          f.add(mesh(CONE, MAT.roofRed, x, 2.65, z, 0.58, 0.85, 0.58));
          f.add(mesh(CYL, MAT.gold, x, 2.2, z, 0.42, 0.08, 0.42));
        });
        f.add(mesh(BOX, MAT.stone, 0, 0.65, 0, 1.8, 1.15, 1.5));
        f.add(mesh(CYL, MAT.wood, 1.2, 2.4, 0.75, 0.04, 0.9, 0.04));
        f.add(mesh(BOX, MAT.petal, 1.5, 2.75, 0.75, 0.42, 0.24, 0.04));
        f.add(mesh(BOX, MAT.dark, 0, 0.55, 0.8, 0.55, 0.8, 0.08));
        f.add(mesh(CYL, MAT.white, 0.95, 0.14, 1.55, 0.26, 0.1, 0.26));
        f.add(mesh(CYL, MAT.water, 0.95, 0.22, 1.55, 0.16, 0.06, 0.16));
        lampPost(f, -1.7, 0.9, 1.6);
        [[-1.3, 2.0], [1.4, 2.1], [0.1, 2.4]].forEach(([x, z], i) => {
          const t = mesh(SPH, MAT.gold, x, 0.16, z, 0.15);
          t.name = "care-treat-" + i;
          f.add(t);
        });
        g.add(f);
      }
    };
  }
  const built = {};
  function buildOne(id) {
    if (!own(id) || built[id]) return;
    const d = def(id);
    if (!d) return;
    mats();
    const g = new THREE.Group();
    g.name = "care-" + id;
    const c = centerOf(d);
    g.position.set(c.x, 0, c.z);
    if (id !== "stage") g.rotation.y = Math.PI / 2 - d.ang * Math.PI / 180;
    builders()[id](g);
    if (id !== "stage") {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.08, 8, 28), MAT.gold);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(d.side || 0, 0.07, d.front || 4.4);
      g.add(ring);
      if (id === "swans") {
        const sign = plaque(d.name, 1.45, 0.4);
        sign.position.set(0.05, 1.28, 2.05);
        g.add(sign);
      } else {
        const sign = plaque(d.name, 2.8, 0.78);
        sign.position.set(0, id === "court" ? 2.4 : 4.4, 0.15);
        g.add(sign);
      }
    }
    PE.scene.add(g);
    blockers = null;
    (g.userData.blocks || []).forEach((b) => {
      const w = g.localToWorld(new THREE.Vector3(b.x, 0, b.z));
      if (PE.obstacles) PE.obstacles.push({ x: w.x, z: w.z, r: b.r });
    });
    built[id] = g;
  }
  function restore() { DEFS.forEach((d) => own(d.id) && buildOne(d.id)); }

  function ask(id) {
    const d = def(id);
    const score = coins();
    if (!d) return { ok: false, reason: "missing", score };
    if (own(id)) return { ok: false, reason: "owned", score };
    if (!needsOk(d)) return { ok: false, reason: "need", need: d.need.slice(), score };
    return { ok: true, pending: true, id: d.id, price: d.price, name: d.name, score };
  }
  function commit(id) {
    const d = def(id);
    const score = coins();
    if (!d) return { ok: false, reason: "missing", score };
    if (own(id)) return { ok: false, reason: "owned", score };
    if (!needsOk(d)) return { ok: false, reason: "need", need: d.need.slice(), score };
    if (score < d.price) return { ok: false, reason: "short", score };
    PE.state().score = score - d.price;
    const v = bag();
    v.care.owned[id] = 1;
    v.care.spent = (v.care.spent || 0) + d.price;
    v.spend.care = (v.spend.care || 0) + d.price;
    persist();
    buildOne(id);
    return { ok: true, score: coins(), price: d.price };
  }

  const play = { ride: null, boat: null, treats: 0, maze: 0, paint: 0, hung: 0, slid: 0, dance: 0 };
  function act(id, mode) {
    if (!own(id)) return { ok: false, reason: "hidden", score: coins() };
    const before = coins();
    if (id === "terrace" || id === "tea" || id === "observatory") {
      const q = id === "terrace"
        ? { type: "groups", prompt: "3 flower beds with 4 roses in each. How many roses?", choices: ["12", "7", "34", "1"], answer: 0, explain: "3 groups of 4 is 12." }
        : id === "tea"
          ? { type: "fraction", prompt: "The table has 4 places. You set 1. What fraction is set?", choices: ["1/4", "1/2", "4/1", "3/4"], answer: 0, explain: "1 place out of 4 is 1/4." }
          : { type: "pattern", prompt: "The telescope shows star, star, moon, star, star. What repeats next?", choices: ["Moon", "Castle", "Boat", "Zero"], answer: 0, explain: "The pattern is star, star, moon." };
      play.q = { id, q };
      return { ok: true, score: coins(), question: q.prompt, kind: q.type };
    }
    if (id === "stable") {
      if (mode === "ride") {
        const p = PE.princess.position;
        play.ride = { t: 0, a: Math.atan2(p.z, p.x) };
        return { ok: true, score: before, riding: true };
      }
      play.brushed = 1;
      return { ok: true, score: coins(), brushed: 1 };
    }
    if (id === "studio") {
      play.paint = (play.paint + 1) % 3;
      if (mode === "hang" || play.paint === 0) {
        const cg = PE.v3 && PE.v3.castle && PE.v3.castle.castleIn && PE.v3.castle.castleIn.group;
        if (cg && !cg.getObjectByName("care-hung-art")) {
          const pic = plaque(["Circle", "Square", "Triangle"][play.paint], 1.2, 0.8);
          pic.name = "care-hung-art";
          pic.position.set(6.2, 3.2, -6);
          pic.rotation.y = -Math.PI / 2;
          cg.add(pic);
          play.hung = 1;
        }
      }
      return { ok: true, score: coins(), shape: ["circle", "square", "triangle"][play.paint], hung: play.hung };
    }
    if (id === "nook") {
      const book = PE.scene.getObjectByName("care-nook-book");
      play.slid = play.slid ? 0 : 1;
      if (book) book.position.x = play.slid ? -0.35 : (book.userData.shut || -1.15);
      const loc = PE.LOCS && PE.LOCS.castle;
      const passage = loc && loc.readings && loc.readings[0] && loc.readings[0].passage;
      const bit = passage ? String(passage).split("\n")[0].slice(0, 140) : "Once there was a princess who loved stories.";
      return { ok: true, score: coins(), open: play.slid, passage: bit };
    }
    if (id === "maze") {
      play.maze = Math.min(3, play.maze + 1);
      const clues = ["Follow the pink rose.", "The opening faces the castle.", "The last rose is in the center."];
      return { ok: true, score: coins(), clue: clues[play.maze - 1], done: play.maze >= 3 };
    }
    if (id === "training") {
      play.ribbon = play.ribbon === "fencing" ? "jiujitsu" : "fencing";
      return { ok: true, score: coins(), ribbon: play.ribbon };
    }
    if (id === "court") {
      return { ok: true, score: coins(), tennis: true };
    }
    if (id === "swans") {
      play.boat = play.boat ? null : { a: Math.atan2(PE.princess.position.z - MOAT.z, PE.princess.position.x - MOAT.x), t: 0 };
      if (!play.boat) {
        const home = spotOf(def("swans"));
        PE.princess.position.set(home.x, PE.groundH ? PE.groundH(home.x, home.z) : 0, home.z);
        const parked = PE.scene.getObjectByName("care-swan-boat");
        if (parked && parked.userData.home) {
          const h = parked.userData.home;
          parked.position.set(h.x, h.y, h.z);
        }
      }
      return { ok: true, score: coins(), boating: !!play.boat };
    }
    if (id === "stage") {
      play.dance = (play.dance || 0) + 1;
      const lamp = PE.scene.getObjectByName("care-stage-lamp");
      if (lamp && lamp.material) lamp.material.emissiveIntensity = 0.4 + (play.dance % 2);
      return { ok: true, score: coins(), show: play.dance };
    }
    if (id === "corgi") {
      if (play.treats < 3) {
        const t = PE.scene.getObjectByName("care-treat-" + play.treats);
        if (t) t.visible = false;
        play.treats++;
      }
      return { ok: true, score: coins(), treats: play.treats, happy: play.treats >= 3 };
    }
    return { ok: false, reason: "missing", score: before };
  }
  function answerCare(choice) {
    const pending = play.q;
    if (!pending) return { ok: false };
    const before = coins();
    const right = choice === pending.q.answer;
    noteAnswer("care-" + pending.id + "-" + pending.q.type, right, pending.q.type);
    const score = coins();
    if (score !== before) PE.state().score = before;
    play.q = null;
    persist();
    return { ok: true, right, explain: pending.q.explain, score: coins() };
  }

  function frame(dt) {
    dt = Math.max(0, Math.min(0.05, dt || 0.016));
    if (MAT.glow) MAT.glow.emissiveIntensity = 0.65 + Math.sin(performance.now() / 400) * 0.2;
    if (play.ride) {
      play.ride.t += dt;
      const a = play.ride.a + play.ride.t * 0.55;
      const x = Math.cos(a) * 15.2, z = Math.sin(a) * 15.2;
      PE.princess.position.set(x, PE.groundH ? PE.groundH(x, z) : 0, z);
      const pony = PE.scene.getObjectByName("care-stable-pony");
      if (pony && pony.parent) {
        const local = pony.parent.worldToLocal(new THREE.Vector3(x + 0.9, 0, z));
        pony.position.copy(local);
      }
      if (play.ride.t > 5.5) {
        play.ride = null;
        const home = pony && pony.userData.home;
        if (pony && home) pony.position.set(home.x, home.y, home.z);
      }
    }
    const boat = PE.scene.getObjectByName("care-swan-boat");
    const t = performance.now() / 1000;
    const bob = Math.sin(t * 1.7) * 0.06;
    const sway = Math.sin(t * 1.1) * 0.06;
    if (play.boat) {
      play.boat.t += dt;
      play.boat.a += dt * 0.35;
      const x = MOAT.x + Math.cos(play.boat.a) * MOAT.mid;
      const z = MOAT.z + Math.sin(play.boat.a) * MOAT.mid;
      PE.princess.position.set(x, 0.62, z);
      if (boat && boat.parent) {
        const local = boat.parent.worldToLocal(new THREE.Vector3(x, 0.2 + bob, z));
        boat.position.copy(local);
        boat.rotation.y = -play.boat.a;
        boat.rotation.z = sway * 0.4;
      }
    } else if (boat && boat.userData.home) {
      const h = boat.userData.home;
      boat.position.set(h.x + Math.sin(t * 0.8) * 0.04, h.y + bob, h.z);
      boat.rotation.y = (h.ry || 0) + sway;
      boat.rotation.z = sway * 0.45;
    }
    const ripple = boat && boat.getObjectByName("care-swan-ripple");
    if (ripple) {
      const pulse = 1 + Math.sin(t * 2.2) * 0.08;
      ripple.scale.set(pulse, pulse, pulse);
      if (ripple.material) ripple.material.opacity = 0.38 + Math.sin(t * 2.2) * 0.12;
    }
  }

  function weekId(d) {
    d = d || new Date();
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - day);
    const year = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    const w = Math.ceil(((t - year) / 86400000 + 1) / 7);
    return t.getUTCFullYear() + "-W" + w;
  }
  function reviewSet() {
    const v = bag();
    const week = weekId();
    if (v.review.week === week && v.review.ids && v.review.ids.length) return v.review;
    const cat = catalog();
    const missed = new Set(Object.keys(v.miss).filter((k) => v.miss[k] > 0));
    Object.entries(PE.state().qhist || {}).forEach(([id, h]) => {
      if ((h.w || 0) > (h.c || 0)) {
        const type = (cat[id] && cat[id].type) || "practice";
        missed.add(type);
      }
    });
    const ids = [];
    const used = new Set();
    missed.forEach((type) => {
      const found = Object.keys(cat).find((id) => cat[id].type === type && !used.has(id));
      if (found) { ids.push(found); used.add(found); }
    });
    v.review = { week, ids: ids.slice(0, 5), i: 0 };
    persist();
    return v.review;
  }
  function reviewCurrent() {
    const rev = reviewSet();
    const cat = catalog();
    const id = rev.ids[rev.i];
    if (!id || !cat[id]) return null;
    return { index: rev.i, total: rev.ids.length, id, type: cat[id].type, q: cat[id].q };
  }
  function reviewAnswer(choice) {
    const cur = reviewCurrent();
    if (!cur) return { ok: false, empty: true };
    const before = coins();
    const right = choice === cur.q.answer_index;
    noteAnswer(cur.id, right, cur.type);
    if (coins() !== before) PE.state().score = before;
    const rev = bag().review;
    rev.i++;
    const done = rev.i >= rev.ids.length;
    persist();
    return { ok: true, right, explain: cur.q.explanation, done, score: coins() };
  }

  function summary() {
    const s = PE.state();
    const cat = catalog();
    const by = {};
    Object.entries(s.qhist || {}).forEach(([id, h]) => {
      const type = (cat[id] && cat[id].type) || "practice";
      const row = by[type] || (by[type] = { c: 0, w: 0, n: 0 });
      row.c += h.c || 0; row.w += h.w || 0; row.n += h.n || 0;
    });
    const weak = Object.entries(by).map(([type, v]) => ({ type, n: v.n, acc: v.n ? Math.round(100 * v.c / v.n) : 0 })).filter((x) => x.n).sort((a, b) => a.acc - b.acc);
    const recent = (bag().recent || []).slice(0, 8);
    const correct = recent.filter((r) => r.ok).length;
    return {
      weak: weak.slice(0, 5),
      recent,
      recentAcc: recent.length ? Math.round(100 * correct / recent.length) : null,
      coins: coins(),
      spent: {
        wardrobe: (s.wardrobe43 && s.wardrobe43.spent) || 0,
        castle: (s.v45 && s.v45.spend && s.v45.spend.castle) || 0,
        care: (s.v45 && s.v45.spend && s.v45.spend.care) || 0
      }
    };
  }

  function questTick() {
    const v = bag();
    const i = v.quest.at || 0;
    const ch = CHAPTERS[i];
    if (!ch || v.quest.done[ch.id]) return;
    if (chapterHere(ch)) v.quest.arrived[ch.id] = 1;
  }
  function questAnswer(choice) {
    const v = bag();
    const ch = CHAPTERS[v.quest.at || 0];
    if (!ch || !v.quest.arrived[ch.id]) return { ok: false, reason: "go" };
    const before = coins();
    const right = choice === ch.q.answer;
    noteAnswer("quest-" + ch.id, right, ch.q.type);
    if (coins() !== before) PE.state().score = before;
    if (!right) return { ok: true, right: false, explain: ch.q.explain, score: coins() };
    v.quest.done[ch.id] = 1;
    v.quest.at = Math.min(CHAPTERS.length, (v.quest.at || 0) + 1);
    persist();
    return { ok: true, right: true, explain: ch.q.explain, score: coins(), next: CHAPTERS[v.quest.at] ? CHAPTERS[v.quest.at].id : "end" };
  }

  let gateScore = null;
  let sawPass = false;
  function watchGate() {
    const d = PE.door;
    if (!d) return;
    if (d.isOpen && d.isOpen() && d.mode === "choose") gateScore = coins();
    const pass = !!d.pass;
    if (pass && !sawPass && gateScore != null && gateScore - coins() === 10) {
      bag().spend.castle = (bag().spend.castle || 0) + 10;
      persist();
    }
    sawPass = pass;
  }

  function css() {
    if (document.getElementById("v45-style")) return;
    const s = document.createElement("style");
    s.id = "v45-style";
    s.textContent = `
#castle-exit-btn.show{height:56px;font-size:18px;z-index:24}
#toast{top:172px !important;left:16px !important;right:auto !important;bottom:auto !important;transform:none !important;z-index:18 !important;max-width:230px !important;text-align:left !important}
@media (max-height:450px){#toast{top:70px !important;left:228px !important;max-width:200px !important;font-size:14px !important}}
@media (max-width:500px) and (min-height:700px){#toast{top:248px !important;left:10px !important;max-width:168px !important}}
#prompt,#care-prompt{z-index:16}
#care-prompt{position:fixed;display:none;background:#fff;border:5px solid #ff7ac8;border-radius:26px;padding:12px 18px;font-size:22px;text-align:center;box-shadow:0 6px 0 rgba(0,0,0,.15);cursor:pointer}
#v45-panel{position:fixed;inset:0;z-index:40;background:rgba(90,40,120,.4);display:none;align-items:center;justify-content:center;padding:12px}
#v45-panel.show{display:flex}
#v45-card{width:min(720px,100%);max-height:calc(100vh - 24px);overflow:auto;background:#fffaf2;border:7px solid #ff7ac8;border-radius:28px;padding:14px 16px 18px;color:#4a2c6f;font-family:Trebuchet MS,sans-serif}
#v45-card h2{margin:0 0 8px;font-size:28px}
#v45-card button,.v45-btn{font:800 18px/1.2 Trebuchet MS,sans-serif;border-radius:16px;border:0;background:#ff5fa2;color:#fff;padding:12px 14px;min-height:52px;cursor:pointer}
#v45-card .ghost{background:#fff;color:#8a4fe0;border:3px solid #b57bff}
.v45-tabs{display:flex;gap:8px;margin-bottom:10px}
.v45-item{border:3px solid #f3c6e4;border-radius:16px;padding:8px 10px;margin:6px 0;background:#fff}
#grown-panel{position:fixed;inset:0;z-index:45;display:none;align-items:center;justify-content:center;background:rgba(40,20,60,.45);padding:12px}
#grown-panel.show{display:flex}
@media (min-width:801px) and (min-height:501px){
  #castle-exit-btn.show{top:12px !important;right:210px !important;left:auto !important;bottom:auto !important;height:56px !important}
  #prompt,#care-prompt{bottom:78px !important;left:50% !important;right:auto !important;transform:translateX(-50%) !important;width:max-content !important;max-width:min(520px,calc(100vw - 300px)) !important}
}
@media (max-width:500px) and (min-height:700px){
  #castle-exit-btn.show{top:188px !important;right:8px !important;left:auto !important;bottom:auto !important;height:56px !important;font-size:16px !important;max-width:170px}
  body.touch #prompt,body.touch #care-prompt{bottom:220px !important;left:10px !important;right:12px !important;transform:none !important;width:auto !important;max-width:calc(100vw - 24px) !important;font-size:18px !important}
}
@media (max-height:450px){
  #castle-exit-btn.show,body.touch #castle-exit-btn.show{top:auto !important;bottom:206px !important;left:10px !important;right:auto !important;height:56px !important;font-size:16px !important;width:max-content !important;max-width:210px;margin:0 !important;transform:none !important}
  #prompt,#care-prompt,body.touch #prompt,body.touch #care-prompt{left:228px !important;right:118px !important;bottom:14px !important;transform:none !important;width:auto !important;max-width:none !important;font-size:16px !important;padding:8px 12px !important}
}
`;
    document.head.appendChild(s);
  }

  function say(text) {
    let n = document.getElementById("v45-say");
    if (!n) {
      n = document.createElement("div");
      n.id = "v45-say";
      n.style.cssText = "position:fixed;left:50%;bottom:120px;transform:translateX(-50%);z-index:50;background:#fff;border:4px solid #ff7ac8;border-radius:16px;padding:10px 14px;max-width:min(520px,92vw);font:700 18px Trebuchet MS,sans-serif;color:#4a2c6f";
      document.body.appendChild(n);
    }
    n.textContent = text;
  }
  function el(html) {
    const d = document.createElement("div");
    d.innerHTML = html;
    return d.firstElementChild;
  }
  function ui() {
    css();
    const hud = document.querySelector("#hud .hud-row");
    if (hud && !document.getElementById("quest-btn")) {
      const q = document.createElement("button");
      q.id = "quest-btn";
      q.className = "chip";
      q.style.pointerEvents = "auto";
      q.textContent = "🗺️ Quest";
      q.onclick = () => openPanel("quest");
      hud.appendChild(q);
    }
    if (!document.getElementById("v45-panel")) {
      const p = el('<div id="v45-panel"><div id="v45-card"></div></div>');
      p.addEventListener("click", (e) => { if (e.target.id === "v45-panel") p.classList.remove("show"); });
      document.body.appendChild(p);
    }
    if (!document.getElementById("care-prompt")) {
      const c = document.createElement("button");
      c.id = "care-prompt";
      c.onclick = () => { if (nearId) act(nearId); renderNear(); };
      document.body.appendChild(c);
    }
    const settings = document.getElementById("settings");
    if (settings && !document.getElementById("grown-open")) {
      const g = document.createElement("button");
      g.id = "grown-open";
      g.className = "btn small";
      g.textContent = "Grown-ups";
      g.onclick = () => openGrown(false);
      settings.appendChild(g);
      const panel = el('<div id="grown-panel"><div id="v45-card" class="grown-card"></div></div>');
      document.body.appendChild(panel);
    }
  }

  let panelTab = "quest";
  let pendingBuy = null;
  function openPanel(tab) {
    panelTab = tab || panelTab;
    const card = document.querySelector("#v45-panel #v45-card");
    const v = bag();
    if (panelTab === "quest") {
      const ch = CHAPTERS[v.quest.at || 0];
      const arrived = ch && v.quest.arrived[ch.id];
      card.innerHTML = `<h2>Royal quest</h2><div class="v45-tabs"><button data-tab="quest">Quest</button><button data-tab="care">Castle care</button><button data-tab="review">Review</button><button class="ghost" id="v45-close">Close</button></div>`
        + CHAPTERS.map((c, i) => `<div class="v45-item">${v.quest.done[c.id] ? "⭐" : i === v.quest.at ? "👉" : "🔒"} <b>${c.emoji} ${c.title}</b><br>${c.goal}<br><small>${c.learn}</small></div>`).join("")
        + (ch && !v.quest.done[ch.id] ? `<div class="v45-item"><b>${ch.story}</b><p>${arrived ? ch.q.prompt : "Go there first. Your coins stay the same."}</p>${arrived ? ch.q.choices.map((c, i) => `<button data-qa="${i}">${c}</button>`).join("") : ""}</div>` : `<p>The party plan is in motion. Keep exploring!</p>`);
    } else if (panelTab === "care") {
      card.innerHTML = `<h2>Castle care</h2><div class="v45-tabs"><button data-tab="quest">Quest</button><button data-tab="care">Castle care</button><button data-tab="review">Review</button><button class="ghost" id="v45-close">Close</button></div><p>You have ${coins()} coins. Builders add a piece only after you say yes. Nothing is built until it is bought.</p>`
        + (pendingBuy ? `<div class="v45-item"><b>Buy ${pendingBuy.name} for ${pendingBuy.price} coins?</b><br><button id="care-yes">Yes, build it</button> <button class="ghost" id="care-no">Not now</button></div>` : "")
        + DEFS.map((d) => {
          const have = own(d.id);
          const ready = needsOk(d);
          const need = (d.need || []).map((id) => def(id).name).join(", ");
          return `<div class="v45-item"><b>${d.name}</b> — ${d.price} coins<br><small>${d.blurb}</small><br>${have ? "✅ Built" : ready ? `<button data-buy="${d.id}">Build for ${d.price}</button>` : `Needs ${need}`}</div>`;
        }).join("");
    } else {
      const rev = reviewSet();
      const cur = reviewCurrent();
      card.innerHTML = `<h2>Weekly review</h2><div class="v45-tabs"><button data-tab="quest">Quest</button><button data-tab="care">Castle care</button><button data-tab="review">Review</button><button class="ghost" id="v45-close">Close</button></div>`
        + (!rev.ids.length ? `<p>No missed kinds yet. Answer a glowing circle. Tricky kinds will wait here. This review does not pay coins.</p>` : cur ? `<p>${cur.index + 1} of ${cur.total} · ${cur.type}. No coins for this practice.</p><p><b>${cur.q.prompt}</b></p>${cur.q.choices.map((c, i) => `<button data-ra="${i}">${c}</button>`).join("")}` : `<p>This week's review is finished. Coins were not added.</p>`);
    }
    document.getElementById("v45-panel").classList.add("show");
    card.onclick = (e) => {
      const t = e.target.closest("button");
      if (!t) return;
      if (t.dataset.tab) { pendingBuy = null; openPanel(t.dataset.tab); return; }
      if (t.id === "v45-close") document.getElementById("v45-panel").classList.remove("show");
      if (t.dataset.qa != null) {
        const res = questAnswer(+t.dataset.qa);
        say(res.right ? "Yes! " + res.explain : "Not yet. " + (res.explain || "Go to the place first."));
        openPanel("quest");
      }
      if (t.dataset.buy) {
        const res = ask(t.dataset.buy);
        if (!res.ok) { say(res.reason === "need" ? "Build the piece it needs first." : "Already built."); return; }
        pendingBuy = res;
        openPanel("care");
      }
      if (t.id === "care-yes" && pendingBuy) {
        const res = commit(pendingBuy.id);
        pendingBuy = null;
        say(res.ok ? "Built! Coins left: " + res.score : res.reason === "short" ? "Not enough coins. Nothing was spent." : "Not built.");
        openPanel("care");
      }
      if (t.id === "care-no") { pendingBuy = null; openPanel("care"); }
      if (t.dataset.ra != null) {
        const res = reviewAnswer(+t.dataset.ra);
        say(res.right ? "Yes! " + (res.explain || "") : "Not this time. " + (res.explain || ""));
        openPanel("review");
      }
    };
  }

  let grownOk = false;
  function openGrown(force) {
    const panel = document.getElementById("grown-panel");
    const card = panel.querySelector(".grown-card");
    if (!grownOk && !force) {
      card.innerHTML = `<h2>Grown-ups</h2><p>Please ask a grown-up. What is 12 × 8?</p><input id="grown-ans" inputmode="numeric" style="font-size:22px;padding:8px;width:120px"> <button id="grown-go">Open</button> <button class="ghost" id="grown-x">Close</button>`;
      panel.classList.add("show");
      card.querySelector("#grown-go").onclick = () => {
        if (card.querySelector("#grown-ans").value.trim() === "96") { grownOk = true; openGrown(true); }
        else say("That is not it. Please ask a grown-up.");
      };
      card.querySelector("#grown-x").onclick = () => panel.classList.remove("show");
      return;
    }
    const sum = summary();
    card.innerHTML = `<h2>Family page</h2><p>Coins now: ${sum.coins}. Spent on wardrobe: ${sum.spent.wardrobe}. Castle gate since this update: ${sum.spent.castle}. Castle builds: ${sum.spent.care}.</p><p><b>Needs more practice</b></p>`
      + (sum.weak.length ? sum.weak.map((w) => `<div class="v45-item">${w.type}: ${w.acc}% of ${w.n}</div>`).join("") : `<p>No answers yet.</p>`)
      + `<p><b>Recent answers</b> ${sum.recentAcc == null ? "" : "· " + sum.recentAcc + "% of the last " + sum.recent.length}</p>`
      + (sum.recent.length ? sum.recent.map((r) => `<div class="v45-item">${r.ok ? "✅" : "🔁"} ${r.type}</div>`).join("") : `<p>Play a little and this list fills in.</p>`)
      + `<button id="grown-x">Close</button>`;
    panel.classList.add("show");
    card.querySelector("#grown-x").onclick = () => { grownOk = false; panel.classList.remove("show"); };
  }

  const raycaster = new THREE.Raycaster();
  const head = new THREE.Vector3();
  const look = new THREE.Vector3();
  let blockers = null;
  let bigMeshes = null;
  let midMeshes = null;
  function blockerList() {
    if (blockers) return;
    blockers = [];
    bigMeshes = [];
    midMeshes = [];
    const girl = PE.princess;
    PE.scene.updateMatrixWorld(true);
    PE.scene.traverse((o) => {
      if (!o.isMesh || !o.geometry) return;
      let p = o;
      while (p) {
        if (p === girl || p.name === "v45-lawn") return;
        p = p.parent;
      }
      const r = meshRadius(o);
      if (r < 1.35 || r > 80) return;
      blockers.push(o);
      (r > 12 ? bigMeshes : midMeshes).push(o);
    });
  }
  const center = new THREE.Vector3();
  const aim = new THREE.Vector3();
  function meshRadius(m) {
    if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere();
    return m.geometry.boundingSphere.radius * m.matrixWorld.getMaxScaleOnAxis();
  }
  function closeEnough(list, extra) {
    const cam = PE.camera.position;
    const out = [];
    for (let i = 0; i < list.length; i++) {
      const m = list[i];
      const r = meshRadius(m);
      center.copy(m.geometry.boundingSphere.center).applyMatrix4(m.matrixWorld);
      if (cam.distanceTo(center) < r + extra) out.push(m);
    }
    return out;
  }
  const faded = [];
  const ndc = new THREE.Vector2();
  function isCare(mesh) {
    let p = mesh;
    while (p) {
      if (p.name && String(p.name).indexOf("care-") === 0) return true;
      p = p.parent;
    }
    return false;
  }
  function fadeBlockers(list, target) {
    look.copy(target).sub(PE.camera.position);
    const dist = look.length();
    if (dist < 2.4) return;
    look.multiplyScalar(1 / dist);
    raycaster.set(PE.camera.position, look);
    raycaster.far = dist - 0.25;
    const hits = raycaster.intersectObjects(list, false);
    for (let i = 0; i < hits.length && faded.length < 4; i++) {
      const y = hits[i].point.y;
      const mesh = hits[i].object;
      if (y < 0.5 || y > 8 || !mesh.visible || isCare(mesh)) continue;
      mesh.visible = false;
      faded.push(mesh);
    }
  }
  let fadeTick = 0;
  function occlude() {
    const castle = PE.v3 && PE.v3.castle;
    const inside = castle && castle.inCastle;
    if (inside || play.boat || play.ride) {
      for (let i = 0; i < faded.length; i++) faded[i].visible = true;
      faded.length = 0;
      return;
    }
    if (!PE.camera || !PE.princess) return;
    fadeTick++;
    if (fadeTick % 5 !== 0 && faded.length) return;
    for (let i = 0; i < faded.length; i++) faded[i].visible = true;
    faded.length = 0;
    blockerList();
    head.set(PE.princess.position.x, PE.princess.position.y + 1.4, PE.princess.position.z);
    const big = closeEnough(bigMeshes, 12);
    const mid = closeEnough(midMeshes, 14);
    fadeBlockers(big, head);
    fadeBlockers(mid, head);
    fadeBlockers(mid, aim.set(head.x, head.y - 1.05, head.z));
    [[-0.55, 0.05]].forEach(([x, y]) => {
      if (faded.length >= 5) return;
      ndc.set(x, y);
      raycaster.setFromCamera(ndc, PE.camera);
      raycaster.far = 8;
      const hits = raycaster.intersectObjects(big, false);
      const h = hits[0];
      if (!h || h.distance > 7 || h.point.y < 0.8 || isCare(h.object) || !h.object.visible) return;
      h.object.visible = false;
      faded.push(h.object);
    });
    [[-0.62, -0.05], [0.62, -0.05], [0, -0.42]].forEach(([x, y]) => {
      if (faded.length >= 5) return;
      ndc.set(x, y);
      raycaster.setFromCamera(ndc, PE.camera);
      raycaster.far = 7;
      const hits = raycaster.intersectObjects(mid, false);
      const h = hits[0];
      if (!h || h.distance > 6.5 || h.point.y < 0.7 || isCare(h.object) || !h.object.visible) return;
      h.object.visible = false;
      faded.push(h.object);
    });
  }
  function groundSigns() {
    if (PE.scene.getObjectByName("v45-posts")) return;
    mats();
    const sprites = [];
    PE.scene.traverse((o) => {
      if (!o.isSprite || o.userData.v45post) return;
      if (o.scale.x < 1.4) return;
      sprites.push(o);
    });
    if (!sprites.length) return;
    const root = new THREE.Group();
    root.name = "v45-posts";
    sprites.forEach((o) => {
      const w = new THREE.Vector3();
      o.getWorldPosition(w);
      o.visible = false;
      o.userData.v45post = 1;
      const post = new THREE.Group();
      post.position.set(w.x, 0, w.z);
      post.add(mesh(CYL, MAT.wood, 0, 0.65, 0, 0.07, 1.3, 0.07));
      post.add(mesh(BOX, MAT.stone, 0, 1.4, 0, 1.05, 0.4, 0.08));
      post.add(mesh(BOX, MAT.gold, 0, 1.4, 0, 1.14, 0.48, 0.04));
      if (o.material && o.material.map) {
        const face = new THREE.Mesh(new THREE.PlaneGeometry(0.96, 0.32), new THREE.MeshLambertMaterial({ map: o.material.map, transparent: true, depthWrite: true }));
        face.position.set(0, 1.4, 0.05);
        post.add(face);
      }
      root.add(post);
    });
    PE.scene.add(root);
  }
  let labelFrames = 0;
  function tameSkyLabels() {
    if (labelFrames > 45) return;
    labelFrames++;
    PE.scene.traverse((o) => {
      if (!o.isSprite || o.userData.v45tame) return;
      if (o.scale.x < 4 || o.position.y < 4) return;
      o.scale.set(1.55, 0.48, 1);
      o.position.y = 3.6;
      o.userData.v45tame = 1;
    });
  }
  let nearId = null;
  function renderNear() {
    const btn = document.getElementById("care-prompt");
    const main = document.getElementById("prompt");
    if (!btn) return;
    const mainOn = main && !main.classList.contains("hidden");
    if (!nearId || mainOn || (PE.v3 && PE.v3.castle && PE.v3.castle.inCastle && nearId !== "stage")) {
      btn.style.display = "none";
      return;
    }
    const d = def(nearId);
    btn.style.display = "block";
    btn.innerHTML = `<b>Press E to visit the ${d.name}</b>`;
  }
  function nearestCare() {
    if (play.boat || play.ride) return null;
    const p = PE.princess.position;
    const inside = PE.v3 && PE.v3.castle && PE.v3.castle.inCastle;
    let best = null, dist = 3.4;
    DEFS.forEach((d) => {
      if (!own(d.id)) return;
      if (d.id === "stage") {
        if (!inside) return;
        const x = p.x - PE.v3.castle.IC.x, z = p.z - PE.v3.castle.IC.z;
        const dd = Math.hypot(x + 17, z - 8.4);
        if (dd < dist) { dist = dd; best = d.id; }
        return;
      }
      if (inside) return;
      const s = spotOf(d);
      const dd = Math.hypot(p.x - s.x, p.z - s.z);
      if (dd < dist) { dist = dd; best = d.id; }
    });
    return best;
  }

  function aimRing() {
    if (!PE.setCam || !PE.snapCamera) return;
    const inside = PE.v3 && PE.v3.castle && PE.v3.castle.inCastle;
    if (inside) return;
    if (!nearId) {
      PE.setCam(0, 8, 11.5);
      return;
    }
    const d = def(nearId);
    const a = d.ang * Math.PI / 180;
    const ox = Math.cos(a), oz = Math.sin(a);
    if (d.id === "swans") {
      const narrow = (window.innerWidth || 1280) < 700;
      const side = narrow ? -1.35 : -2.35;
      const out = narrow ? 7.2 : 2.85;
      const lift = narrow ? 3.8 : 2.15;
      PE.setCam(Math.sin(a) * side + Math.cos(a) * out, lift, -Math.cos(a) * side + Math.sin(a) * out);
    }
    else {
      const dist = d.id === "court" ? 7.2 : 6.2;
      const lift = d.id === "court" ? 5.4 : 3.6;
      PE.setCam(ox * dist - oz * 0.55, lift, oz * dist + ox * 0.55);
    }
    PE.snapCamera();
  }
  function hookSwanLook() {
    const cam = PE.camera;
    if (!cam || cam._v45swan) return;
    const orig = cam.lookAt.bind(cam);
    cam.lookAt = function (x, y, z) {
      if (nearId !== "swans") return orig(x, y, z);
      const d = def("swans");
      const a = d.ang * Math.PI / 180;
      const ox = Math.cos(a), oz = Math.sin(a);
      const tx = Math.sin(a), tz = -Math.cos(a);
      const c = centerOf(d);
      orig(c.x + ox * 0.2 + tx * 0.55, 1.05, c.z + oz * 0.2 + tz * 0.55);
    };
    cam._v45swan = 1;
  }
  function hookStageCam() {
    const castle = PE.v3 && PE.v3.castle;
    if (!castle || castle._v45hook || !castle.placeInteriorCamera) return;
    const orig = castle.placeInteriorCamera;
    castle.placeInteriorCamera = function (cam, offset, info) {
      orig.call(castle, cam, offset, info);
      if (nearId !== "stage" || !cam) return;
      const ic = castle.IC;
      cam.position.set(ic.x - 17, (ic.y || 0) + 2.8, ic.z + 13.2);
      cam.lookAt(ic.x - 17, (ic.y || 0) + 1.3, ic.z + 5.0);
    };
    castle._v45hook = 1;
  }
  window.addEventListener("keydown", (ev) => {
    if (ev.key !== "e" && ev.key !== "E") return;
    const btn = document.getElementById("care-prompt");
    if (!nearId || !btn || btn.style.display === "none") return;
    act(nearId);
    renderNear();
  });
  let last = performance.now();
  function loop(now) {
    const dt = (now - last) / 1000;
    last = now;
    try {
      questTick();
      watchGate();
      frame(dt);
      occlude();
      tameSkyLabels();
      groundSigns();
      nearId = nearestCare();
      aimRing();
      renderNear();
      hallSigns();
    } catch (err) { console.error("v45", err && err.message); }
    requestAnimationFrame(loop);
  }

  migrateLayout();
  hookSwanLook();
  hookStageCam();
  lawn();
  restore();
  hallSigns();
  ui();
  requestAnimationFrame(loop);

  PE.care = {
    DEFS, own, ask, commit, act, answer: answerCare, coins, frame,
    spot: (id) => { const d = def(id); return d ? spotOf(d) : null; },
    built: (id) => !!PE.scene.getObjectByName("care-" + id)
  };
  PE.quest = { CHAPTERS, answer: questAnswer, here: (id) => { const ch = CHAPTERS.find((c) => c.id === id); return ch ? chapterHere(ch) : false; } };
  PE.review = { current: reviewCurrent, answer: reviewAnswer, week: weekId };
  PE.grownups = { summary, note: noteAnswer };
  PE.grounds = { oldR: OLD_R, newR: NEW_R, scale: SCALE };
})();

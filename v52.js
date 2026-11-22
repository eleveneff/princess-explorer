/* Princess Explorer 5.2 — cameras that keep her clear of the bridge, the swan boat,
   and the stream, signs that turn to face you, a balcony floor, and a soft stair step.
   Save keys, coins, stars, items, and prices stay as they were in 5.1. */
(function () {
  const MOAT = { x: 0, z: -1, inner: 7.6, outer: 12.28 };
  const STAIR = { z0: 14.45, z1: 17.35, rise: 1.7, half: 1.3, steps: 9 };
  const FADE = 0.1;

  const fadeStore = new Map();
  const yaws = [];
  const pieces = [];
  const canopies = [];
  const columns = [];
  let rails = 0;
  let posts = 0;
  let lastTread = -1;
  let bounceAt = 0;
  let bounceHold = null;
  let stepsPlayed = 0;
  let audioCtx = null;
  let scanned = false;
  let scanTick = 0;

  let _box = null;
  let _hit = null;
  let _a = null;
  let _b = null;
  let _c = null;
  let _q = null;
  let _p = null;
  let _dir = null;

  function alloc(THREE) {
    if (_box) return;
    _box = new THREE.Box3();
    _hit = new THREE.Vector3();
    _a = new THREE.Vector3();
    _b = new THREE.Vector3();
    _c = new THREE.Vector3();
    _q = new THREE.Quaternion();
    _p = new THREE.Vector3();
    _dir = new THREE.Vector3();
  }
  function three() {
    const PE = window.PrincessExplorer;
    return PE && PE.gfx43 && PE.gfx43.THREE;
  }
  function pe() { return window.PrincessExplorer; }

  function boot() {
    const PE = pe();
    const THREE = three();
    const castle = PE && PE.v3 && PE.v3.castle;
    const v51on = castle && castle.castleIn && castle.castleIn.group && castle.castleIn.group.userData.v51;
    const ready = PE && THREE && PE.camera && PE.scene && PE.princess && v51on;
    if (!ready || !PE.camera.lookAt || PE.camera.userData.v52) {
      if (PE && PE.camera && PE.camera.userData.v52) return;
      setTimeout(boot, 30);
      return;
    }
    PE.camera.userData.v52 = 1;
    alloc(THREE);
    try {
      splitFences(PE, THREE);
      dressBridge(PE, THREE);
      dressWater(PE, THREE);
    } catch (err) { PE.v52error = String(err && err.message || err); }
    markBridge(PE);
    balconyFloor(PE, THREE);
    collectOccluders(PE, THREE);
    hookCamera(PE, THREE);
    hookGarden(PE);
    window.__GAME_VERSION__ = "v5.2";
    try { PE.version = "v5.2"; } catch (e) { /* version may be a getter */ }
    PE.v52 = api(PE, THREE);
    if (PE.v52error) PE.v52.error = PE.v52error;
  }

  function api(PE, THREE) {
    return {
      version: "v5.2",
      stats: () => ({ rails, posts, pieces: pieces.length, canopies: canopies.length, columns: columns.length, steps: stepsPlayed }),
      apply: () => {
        const p = PE.princess.position;
        PE.camera.lookAt(p.x, p.y + 1.2, p.z);
      },
      billboards: () => billboard(PE, THREE),
      holdBounce: (phase) => { bounceHold = phase; },
      clearBounce: () => { bounceHold = null; },
      shot: null,
      error: "",
      gardenBeds: () => gardenBeds(PE)
    };
  }

  function gardenBeds(PE) {
    const live = PE.v35 && PE.v35.g && PE.v35.g.plots;
    if (live) {
      return live.map((p) => {
        const alive = p.st === "grow" || p.st === "bloom";
        return {
          st: alive ? p.st : "empty",
          grow: alive ? Math.round((+p.grow || 0) * 100) / 100 : 0,
          water: alive ? Math.round((+p.water || 0) * 100) / 100 : 0
        };
      });
    }
    const saved = PE.state() && PE.state().v52 && PE.state().v52.garden;
    return Array.isArray(saved) ? saved : [];
  }

  function inCastle(PE) {
    return !!(PE.v3 && PE.v3.castle && PE.v3.castle.inCastle);
  }
  function onBoat(PE) {
    return !!(PE.care && PE.care.boat && PE.care.boat.on && PE.care.boat.on());
  }
  function bridgeZone(PE) {
    if (!PE.gate || !PE.gate.isDown || !PE.gate.isDown()) return false;
    const p = PE.princess.position;
    if (Math.abs(p.x) < 2.6 && p.z > 5.6 && p.z < 14.4) return true;
    const spots = [PE.gate.GATE_SPOT, PE.gate.CHALLENGE_SPOT];
    for (let i = 0; i < spots.length; i++) {
      const s = spots[i];
      if (s && Math.hypot(p.x - s.x, p.z - s.z) < 3.4) return true;
    }
    if (Math.abs(p.x) < 6.2 && p.z > 11.2 && p.z < 16.8) return true;
    return false;
  }
  function ownMode(PE) {
    if (!PE.princess || inCastle(PE)) return "";
    if (onBoat(PE)) return "boat";
    if (bridgeZone(PE)) return "bridge";
    return "";
  }

  function hookCamera(PE, THREE) {
    const cam = PE.camera;
    const wrapped = cam.lookAt.bind(cam);
    const native = THREE.Object3D.prototype.lookAt;
    cam.lookAt = function (x, y, z) {
      const mode = ownMode(PE);
      cam.userData.v52own = !!mode;
      wrapped(x, y, z);
      cam.userData.v52own = false;
      try {
        if (PE.v52 && PE.v52.shot) frameShot(PE, native);
        else if (mode === "boat") frameBoat(PE, THREE, native);
        else if (mode === "bridge") frameBridge(PE, THREE, native);
        fadePass(PE, THREE, mode);
        tickDress(PE, THREE);
        stairStep(PE);
        scanTick++;
        if (!scanned || scanTick % 40 === 0) scanSigns(PE, THREE);
        billboard(PE, THREE);
      } catch (err) {
        if (PE.v52) PE.v52.error = String(err && err.message || err);
      }
    };
  }

  function frameShot(PE, native) {
    const s = PE.v52.shot;
    PE.camera.position.set(s.x, s.y, s.z);
    native.call(PE.camera, s.lx, s.ly, s.lz);
  }

  function frameBridge(PE, THREE, native) {
    const p = PE.princess.position;
    const w = window.innerWidth || 1280;
    const h = window.innerHeight || 720;
    const phone = w < 780;
    const portrait = phone && h > w;
    const side = portrait ? 4.6 : phone ? 5.6 : 6.4;
    const lift = portrait ? 3.35 : phone ? 4.1 : 4.7;
    const along = portrait ? 2.3 : phone ? 3.0 : 3.8;
    const cam = PE.camera;
    cam.position.set(p.x + side, p.y + lift, p.z + along);
    native.call(cam, p.x - 0.15, p.y + (portrait ? 1.05 : 1.2), p.z - 1.35);
  }

  function frameBoat(PE, THREE, native) {
    const p = PE.princess.position;
    const raised = PE.gate && PE.gate.state && PE.gate.state.b < 0.55;
    const radialX = p.x - MOAT.x;
    const radialZ = p.z - MOAT.z;
    const len = Math.hypot(radialX, radialZ) || 1;
    const outX = radialX / len;
    const outZ = radialZ / len;
    let tx = -outZ;
    let tz = outX;
    const tea = buildingPoint(38, 14.8);
    const plus = Math.hypot(p.x + tx * 4 - tea.x, p.z + tz * 4 - tea.z);
    const minus = Math.hypot(p.x - tx * 4 - tea.x, p.z - tz * 4 - tea.z);
    if (minus > plus) { tx = -tx; tz = -tz; }
    const w = window.innerWidth || 1280;
    const phone = w < 780;
    let cx;
    let cz;
    if (raised) {
      const cam = PE.camera;
      cam.position.set(p.x + 4.4, 6.8, p.z + 9.2);
      native.call(cam, p.x, 2.4, p.z - 0.6);
      return;
    }
    const shift = 0.7;
    const camAng = Math.atan2(radialZ, radialX) + (tx >= 0 ? shift : -shift);
    cx = MOAT.x + Math.cos(camAng) * 9.94;
    cz = MOAT.z + Math.sin(camAng) * 9.94;
    let vx = cx - MOAT.x;
    let vz = cz - MOAT.z;
    let r = Math.hypot(vx, vz) || 1;
    const minR = MOAT.inner + 1.15;
    const maxR = raised ? MOAT.outer - 0.28 : MOAT.outer - 0.55;
    const clamped = Math.max(minR, Math.min(maxR, r));
    cx = MOAT.x + (vx / r) * clamped;
    cz = MOAT.z + (vz / r) * clamped;
    const cam = PE.camera;
    const lift = phone ? 4.5 : 5.05;
    cam.position.set(cx, lift, cz);
    const aim = swanAim(PE, p);
    if (raised) native.call(cam, p.x, 2.7, p.z - 1.8);
    else native.call(cam, aim.x, aim.y, aim.z);
  }

  function swanAim(PE, p) {
    const boat = PE.scene.getObjectByName("care-swan-boat");
    if (!boat) return { x: p.x, y: p.y + 1.15, z: p.z };
    boat.updateWorldMatrix(true, false);
    const head = boat.localToWorld(new (three().Vector3)(0, 2.15, 0.85));
    return { x: head.x * 0.65 + p.x * 0.35, y: Math.max(1.35, head.y * 0.72), z: head.z * 0.65 + p.z * 0.35 };
  }

  function buildingPoint(deg, rad) {
    const a = deg * Math.PI / 180;
    return { x: Math.cos(a) * rad, z: Math.sin(a) * rad };
  }

  function nearStream(PE) {
    if (!PE.stream || !PE.stream.samples) return false;
    const samples = PE.stream.samples();
    const p = PE.princess.position;
    let best = 1e9;
    for (let i = 0; i < samples.length; i += 2) {
      const d = (samples[i].x - p.x) * (samples[i].x - p.x) + (samples[i].z - p.z) * (samples[i].z - p.z);
      if (d < best) best = d;
    }
    return best < 7.2 * 7.2;
  }

  function fadePass(PE, THREE, mode) {
    const next = new Map();
    if (inCastle(PE)) {
      applyFade(next);
      return;
    }
    const cam = PE.camera.position;
    const p = PE.princess.position;
    const feet = _a.set(p.x, p.y + 0.14, p.z);
    const waist = _b.set(p.x, p.y + 0.85, p.z);
    if (mode === "bridge") {
      const bridgeMeshes = pieces.filter((m) => m.userData.v52bridge);
      grazeList(PE, THREE, bridgeMeshes, cam, feet, 0.26, next);
      grazeList(PE, THREE, bridgeMeshes, cam, waist, 0.26, next);
    }
    const railsPosts = pieces.filter((m) => m.userData.v52kind);
    grazeList(PE, THREE, railsPosts, cam, feet, 0.26, next);
    if (!mode && nearStream(PE)) {
      grazeList(PE, THREE, canopies, cam, feet, 0.42, next);
      grazeList(PE, THREE, columns, cam, feet, 0.7, next);
      grazeList(PE, THREE, columns, cam, waist, 0.55, next);
    }
    applyFade(next);
  }

  let buildingCache = null;
  let buildingFrame = -1;
  function buildings(PE) {
    buildingFrame++;
    if (buildingCache && buildingFrame % 30 !== 0) return buildingCache;
    const list = [];
    PE.scene.traverse((o) => {
      if (!o.isMesh) return;
      let p = o;
      let care = false;
      let boat = false;
      while (p) {
        if (p.name === "care-swan-boat" || p === PE.princess) boat = true;
        if (p.name && String(p.name).indexOf("care-") === 0) care = true;
        p = p.parent;
      }
      if (care && !boat) list.push(o);
    });
    buildingCache = list;
    return list;
  }

  function grazeList(PE, THREE, list, origin, target, pad, next) {
    const dx = target.x - origin.x;
    const dy = target.y - origin.y;
    const dz = target.z - origin.z;
    const dist = Math.hypot(dx, dy, dz);
    if (dist < 0.3) return;
    const far = Math.max(0.2, dist - 0.32);
    _dir.set(dx / dist, dy / dist, dz / dist);
    const ray = grazeList.ray || (grazeList.ray = new THREE.Ray());
    ray.set(origin, _dir);
    for (let i = 0; i < list.length; i++) {
      const mesh = list[i];
      if (!mesh.visible || isActor(PE, mesh)) continue;
      const wb = worldBox(mesh, _box);
      if (!wb || wb.isEmpty()) continue;
      const size = _c;
      wb.getSize(size);
      if (size.x > 40 || size.y > 40 || size.z > 40) continue;
      const grown = wb.clone().expandByScalar(pad);
      const hit = ray.intersectBox(grown, _hit);
      if (!hit) continue;
      const along = hit.distanceTo(origin);
      if (along > far || along < 0.05) continue;
      next.set(mesh, FADE);
    }
  }

  function worldBox(mesh, target) {
    const THREE = three();
    if (!mesh.geometry) return null;
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    if (!mesh.geometry.boundingBox) return null;
    mesh.updateWorldMatrix(true, false);
    return target.copy(mesh.geometry.boundingBox).applyMatrix4(mesh.matrixWorld);
  }

  function isActor(PE, mesh) {
    let o = mesh;
    while (o) {
      if (o === PE.princess || o.name === "v34-biscuit" || o.name === "v35-biscuit") return true;
      o = o.parent;
    }
    return false;
  }

  function remember(mesh, opacity) {
    if (!mesh.userData.v52fade) {
      mesh.userData.v52fade = mesh.material;
      const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      const clones = list.map((m) => {
        if (!m) return m;
        const c = m.clone();
        c.transparent = true;
        c.depthWrite = false;
        c.opacity = opacity;
        return c;
      });
      mesh.material = Array.isArray(mesh.material) ? clones : clones[0];
    } else {
      const cur = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      cur.forEach((m) => { if (m) m.opacity = opacity; });
    }
  }
  function recall(mesh) {
    if (!mesh.userData.v52fade) return;
    mesh.material = mesh.userData.v52fade;
    delete mesh.userData.v52fade;
  }
  function applyFade(next) {
    fadeStore.forEach((opacity, mesh) => { if (!next.has(mesh)) recall(mesh); });
    next.forEach((opacity, mesh) => remember(mesh, opacity));
    fadeStore.clear();
    next.forEach((opacity, mesh) => fadeStore.set(mesh, opacity));
  }

  let fallMap = null;
  let fallFoam = null;
  let chainMesh = null;
  let chainLeaf = null;

  function dressBridge(PE, THREE) {
    const bridge = PE.scene.getObjectByName("v34-drawbridge");
    if (!bridge || bridge.getObjectByName("v52-leaf")) return;
    bridge.traverse((o) => {
      if (!o.isMesh || o.geometry && o.geometry.type === "TorusGeometry") return;
      if (o.isMesh && o.geometry && (o.geometry.type === "BoxGeometry" || o.geometry.type === "SphereGeometry")) o.visible = false;
    });
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 128;
    const g = c.getContext("2d");
    g.fillStyle = "#c9844a";
    g.fillRect(0, 0, 256, 128);
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? "#b8733a" : "#d39252";
      g.fillRect(8, 6 + i * 15, 240, 12);
      g.fillStyle = "#8d5a32";
      g.fillRect(8, 17 + i * 15, 240, 2);
    }
    g.strokeStyle = "#6b3e22";
    g.lineWidth = 8;
    g.strokeRect(4, 4, 248, 120);
    const tex = new THREE.CanvasTexture(c);
    if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(2.32, 0.18, 6.5), new THREE.MeshLambertMaterial({ map: tex }));
    leaf.name = "v52-leaf";
    leaf.position.set(0, 0.04, 3.32);
    leaf.userData.v52keep = 1;
    bridge.add(leaf);
    chainLeaf = leaf;
    const links = 16;
    chainMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.11, 6, 5), new THREE.MeshLambertMaterial({ color: "#3a342e" }), links);
    chainMesh.name = "v52-chains";
    chainMesh.userData.v52keep = 1;
    chainMesh.frustumCulled = false;
    PE.scene.add(chainMesh);
  }

  function updateChains(THREE) {
    if (!chainMesh || !chainLeaf) return;
    const anchors = [new THREE.Vector3(-1.2, 3.45, 5.7), new THREE.Vector3(1.2, 3.45, 5.7)];
    const corners = [new THREE.Vector3(-1.05, 0.12, 6.4), new THREE.Vector3(1.05, 0.12, 6.4)];
    const dummy = updateChains.dummy || (updateChains.dummy = new THREE.Object3D());
    const from = new THREE.Vector3();
    const to = new THREE.Vector3();
    chainLeaf.updateWorldMatrix(true, false);
    for (let side = 0; side < 2; side++) {
      from.copy(corners[side]);
      chainLeaf.localToWorld(from);
      to.copy(anchors[side]);
      for (let i = 0; i < 8; i++) {
        const t = (i + 0.5) / 8;
        dummy.position.lerpVectors(from, to, t);
        dummy.position.y -= Math.sin(t * Math.PI) * 0.35;
        dummy.scale.setScalar(1);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        chainMesh.setMatrixAt(side * 8 + i, dummy.matrix);
      }
    }
    chainMesh.instanceMatrix.needsUpdate = true;
  }

  function fallTexture(THREE) {
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 256;
    const g = c.getContext("2d");
    const grd = g.createLinearGradient(0, 0, 0, 256);
    grd.addColorStop(0, "#d7f6ff");
    grd.addColorStop(0.45, "#8fdfff");
    grd.addColorStop(1, "#e9fbff");
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 256);
    g.strokeStyle = "rgba(255,255,255,.85)";
    g.lineWidth = 3;
    for (let i = 0; i < 14; i++) {
      g.beginPath();
      g.moveTo(8 + (i * 9) % 112, 0);
      g.bezierCurveTo(20 + i * 6, 80, 4 + (i % 5) * 10, 150, 12 + (i * 7) % 100, 256);
      g.stroke();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function curvedSheet(THREE, width, height, bow) {
    const sy = 12;
    const sx = 5;
    const pos = [];
    const uv = [];
    const idx = [];
    for (let y = 0; y <= sy; y++) {
      const t = y / sy;
      const curl = Math.sin(t * Math.PI) * bow * 0.22 + Math.pow(t, 1.35) * bow;
      const yv = (1 - t) * height;
      const widen = 1 + t * 0.22;
      for (let x = 0; x <= sx; x++) {
        const u = x / sx;
        pos.push((u - 0.5) * width * widen, yv, curl);
        uv.push(u, t);
      }
    }
    for (let y = 0; y < sy; y++) {
      for (let x = 0; x < sx; x++) {
        const a = y * (sx + 1) + x;
        idx.push(a, a + sx + 1, a + 1, a + 1, a + sx + 1, a + sx + 2);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    return geo;
  }

  function irregularShape(THREE, radius, wobble, phase) {
    const shape = new THREE.Shape();
    const n = 20;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = radius * (1 + wobble * Math.sin(a * 3 + phase) + wobble * 0.55 * Math.sin(a * 5 + phase * 1.7));
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    return new THREE.ShapeGeometry(shape);
  }

  function addRock(pos, x, y, z, sx, sy, sz) {
    const c = [
      [-sx, 0, -sz], [sx * 0.85, 0.02, -sz * 0.65], [sx * 0.7, 0.04, sz * 0.8], [-sx * 0.75, 0.01, sz],
      [-sx * 0.55, sy, -sz * 0.35], [sx * 0.5, sy * 0.82, -sz * 0.25], [sx * 0.35, sy * 0.7, sz * 0.4], [-sx * 0.4, sy * 0.9, sz * 0.28]
    ];
    const faces = [[0, 1, 2], [0, 2, 3], [4, 6, 5], [4, 7, 6], [0, 4, 5], [0, 5, 1], [1, 5, 6], [1, 6, 2], [2, 6, 7], [2, 7, 3], [3, 7, 4], [3, 4, 0]];
    for (let f = 0; f < faces.length; f++) {
      for (let k = 0; k < 3; k++) pos.push(x + c[faces[f][k]][0], y + c[faces[f][k]][1], z + c[faces[f][k]][2]);
    }
  }

  function rockyRim(THREE, radius, mat, phase) {
    const pos = [];
    const n = 12;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + phase;
      const rr = radius * (1.05 + 0.12 * Math.sin(i * 2.1 + phase));
      const h = 0.7 + (i % 3) * 0.22;
      const w = 0.62 + (i % 2) * 0.16;
      addRock(pos, Math.cos(a) * rr, h * 0.25, Math.sin(a) * rr, w, h, w * 0.85);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.computeVertexNormals();
    return new THREE.Mesh(geo, mat);
  }

  function dressWater(PE, THREE) {
    const root = PE.scene.getObjectByName("v46-stream");
    if (!root || root.getObjectByName("v52-fall")) return;
    const sheets = [];
    const circles = [];
    root.traverse((o) => {
      if (!o.isMesh || !o.geometry) return;
      if (o.name === "stream-fall") sheets.push(o);
      if (o.geometry.type === "CircleGeometry" || o.geometry.type === "RingGeometry") {
        const r = o.geometry.parameters.radius || o.geometry.parameters.outerRadius || 0;
        if (r > 1.15) circles.push(o);
      }
    });
    fallMap = fallTexture(THREE);
    const mat = new THREE.MeshPhongMaterial({
      map: fallMap,
      color: "#e7f8ff",
      emissive: "#7ed4f2",
      emissiveIntensity: 0.35,
      shininess: 70,
      specular: "#ffffff",
      side: THREE.DoubleSide,
      transparent: false
    });
    let host = null;
    let height = 3.2;
    sheets.forEach((sheet) => {
      if (!host) {
        host = sheet;
        const p = sheet.geometry.parameters;
        if (p && p.height) height = p.height;
      }
      sheet.visible = false;
    });
    if (host && host.parent) {
      const sheet = new THREE.Mesh(curvedSheet(THREE, 3.4, height, 3.6), mat);
      sheet.name = "v52-fall";
      sheet.position.copy(host.position);
      sheet.rotation.copy(host.rotation);
      sheet.position.y -= height * 0.5;
      host.parent.add(sheet);
      const foamPos = [];
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2;
        addRock(foamPos, Math.cos(a) * (0.55 + (i % 3) * 0.18), 0.18, Math.sin(a) * (0.7 + (i % 2) * 0.2), 0.38, 0.32 + (i % 3) * 0.08, 0.3);
      }
      const foamGeo = new THREE.BufferGeometry();
      foamGeo.setAttribute("position", new THREE.Float32BufferAttribute(foamPos, 3));
      foamGeo.computeVertexNormals();
      fallFoam = new THREE.Mesh(foamGeo, new THREE.MeshLambertMaterial({ color: "#f4fbff" }));
      fallFoam.name = "v52-fall-foam";
      const forward = new THREE.Vector3(0, 0, 1.15);
      forward.applyQuaternion(host.quaternion);
      fallFoam.position.copy(host.position);
      fallFoam.position.y -= height * 0.5 - 0.12;
      fallFoam.position.add(forward);
      host.parent.add(fallFoam);
    }
    const rockMat = new THREE.MeshLambertMaterial({ color: "#cbbba6" });
    const waterMat = new THREE.MeshLambertMaterial({ color: "#7ec8ea", side: THREE.DoubleSide });
    const sandMat = new THREE.MeshLambertMaterial({ color: "#c4a574", side: THREE.DoubleSide });
    const used = new Set();
    circles.forEach((circle, idx) => {
      if (used.has(circle)) return;
      const cluster = [circle];
      used.add(circle);
      const cpos = new THREE.Vector3();
      circle.getWorldPosition(cpos);
      circles.forEach((other) => {
        if (used.has(other)) return;
        const opos = new THREE.Vector3();
        other.getWorldPosition(opos);
        if (cpos.distanceTo(opos) < 3.2) { cluster.push(other); used.add(other); }
      });
      cluster.forEach((o) => { o.visible = false; });
      const parent = circle.parent;
      const big = cluster.reduce((a, b) => {
        const ra = a.geometry.parameters.radius || a.geometry.parameters.outerRadius || 0;
        const rb = b.geometry.parameters.radius || b.geometry.parameters.outerRadius || 0;
        return rb > ra ? b : a;
      }, circle);
      const radius = big.geometry.parameters.radius || big.geometry.parameters.outerRadius || 2;
      const water = new THREE.Mesh(irregularShape(THREE, radius * 0.92, 0.16, idx), waterMat);
      water.position.copy(circle.position);
      water.rotation.x = -Math.PI / 2;
      water.position.y += 0.03;
      water.name = "v52-pool";
      parent.add(water);
      const rim = rockyRim(THREE, radius, rockMat, idx);
      rim.position.set(circle.position.x, circle.position.y, circle.position.z);
      rim.name = "v52-pool-rocks";
      parent.add(rim);
      const sand = new THREE.Mesh(irregularShape(THREE, radius * 1.18, 0.2, idx + 1), sandMat);
      sand.position.copy(circle.position);
      sand.rotation.x = -Math.PI / 2;
      sand.position.y -= 0.02;
      parent.add(sand);
    });
    const pools = [];
    root.traverse((o) => { if (o.name === "v52-pool-rocks") pools.push(o); });
    root.traverse((o) => {
      if (!o.isMesh || !o.geometry || o.geometry.type !== "SphereGeometry" || !o.visible) return;
      const wp = new THREE.Vector3();
      o.getWorldPosition(wp);
      const near = pools.some((rim) => {
        const rp = new THREE.Vector3();
        rim.getWorldPosition(rp);
        return wp.distanceTo(rp) < 3.4;
      });
      if (near) o.visible = false;
    });
  }

  function tickDress(PE, THREE) {
    const now = performance.now();
    const prev = tickDress.last || now;
    tickDress.last = now;
    const dt = Math.min(0.05, (now - prev) / 1000);
    if (fallMap) fallMap.offset.y = (fallMap.offset.y - dt * 0.85) % 1;
    if (fallFoam) {
      const s = 1 + Math.sin(now / 260) * 0.05;
      fallFoam.scale.set(s, s, 1);
    }
    updateChains(THREE);
  }

  function markBridge(PE) {
    PE.scene.traverse((o) => {
      if (!o.isMesh) return;
      let p = o;
      while (p) {
        if (p.name === "v34-drawbridge") {
          if (!o.userData.v52keep && o.name !== "v52-leaf" && o.name !== "v52-chains") {
            o.userData.v52bridge = 1;
            pieces.push(o);
          }
          break;
        }
        p = p.parent;
      }
      const g = o.geometry;
      if (g && g.type === "TorusGeometry" && g.parameters && g.parameters.radius < 0.2) {
        o.userData.v52bridge = 1;
        if (pieces.indexOf(o) < 0) pieces.push(o);
      }
    });
  }

  function collectOccluders(PE, THREE) {
    const v = new THREE.Vector3();
    const size = new THREE.Vector3();
    PE.scene.updateMatrixWorld(true);
    PE.scene.traverse((o) => {
      if (!o.isMesh || !o.geometry || o.userData.v52kind || o.userData.v52bridge) return;
      if (isActor(PE, o)) return;
      const t = o.geometry.type;
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      const wb = worldBox(o, new THREE.Box3());
      if (!wb || wb.isEmpty()) return;
      wb.getSize(size);
      wb.getCenter(v);
      if (v.y < 0.2 || Math.hypot(v.x, v.z) > 90) return;
      const col = o.material && o.material.color;
      const green = col && col.g > col.r + 0.05 && col.g > 0.28;
      const thin = Math.min(size.x, size.z);
      const tall = size.y;
      if ((t === "ConeGeometry" || t === "SphereGeometry") && green && tall > 0.9 && v.y > 1.1 && size.x < 14) {
        canopies.push(o);
      } else if ((t === "CylinderGeometry" || t === "CapsuleGeometry" || t === "BoxGeometry") && tall > 0.75 && thin < 0.85 && Math.max(size.x, size.z) < 1.5 && v.y < 8) {
        columns.push(o);
      }
    });
  }

  function brown(r, g, b) {
    return r > 0.26 && r < 0.62 && g > 0.07 && g < 0.36 && b < 0.2 && r > g + 0.1 && r > b + 0.14;
  }

  function splitFences(PE, THREE) {
    const sources = [];
    PE.scene.updateMatrixWorld(true);
    PE.scene.traverse((o) => {
      if (!o.isMesh || !o.geometry || !o.geometry.attributes || !o.geometry.attributes.position) return;
      if (o.geometry.index || o.userData.v52split) return;
      const pos = o.geometry.attributes.position;
      const col = o.geometry.attributes.color;
      if (!col || pos.count < 8000 || pos.count > 200000) return;
      if (pos.isInterleavedBufferAttribute) return;
      const bb = new THREE.Box3().setFromObject(o);
      if (bb.isEmpty()) return;
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      bb.getSize(size);
      bb.getCenter(center);
      if (size.x < 40 || size.z < 40 || size.y > 55) return;
      if (Math.abs(center.x) > 90) return;
      let name = "";
      let p = o;
      while (p && !name) { name = p.name || ""; p = p.parent; }
      if (name === "v46-skirt" || name === "v46-stream" || name === "v34-moat") return;
      sources.push(o);
    });
    sources.forEach((mesh) => splitOne(PE, THREE, mesh));
  }

  function emitPiece(PE, THREE, mesh, pos, col, M, va, group, kind, drop) {
    const count = group.length * 3;
    const arr = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);
    for (let i = 0; i < group.length; i++) {
      const t = group[i].t;
      drop.add(t);
      for (let k = 0; k < 3; k++) {
        va.fromBufferAttribute(pos, t * 3 + k).applyMatrix4(M);
        const o = (i * 3 + k) * 3;
        arr[o] = va.x; arr[o + 1] = va.y; arr[o + 2] = va.z;
        cols[o] = col.getX(t * 3 + k);
        cols[o + 1] = col.getY(t * 3 + k);
        cols[o + 2] = col.getZ(t * 3 + k);
      }
    }
    const g2 = new THREE.BufferGeometry();
    g2.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    g2.setAttribute("color", new THREE.BufferAttribute(cols, 3));
    g2.computeVertexNormals();
    const srcMat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
    const mat = srcMat.clone();
    mat.vertexColors = true;
    mat.transparent = false;
    mat.opacity = 1;
    mat.depthWrite = true;
    const piece = new THREE.Mesh(g2, mat);
    piece.name = "v52-" + kind;
    piece.userData.v52kind = kind;
    piece.castShadow = false;
    piece.receiveShadow = true;
    PE.scene.add(piece);
    pieces.push(piece);
    if (kind === "rail") rails++;
    else posts++;
  }

  function sliceRails(group, alongX) {
    const bins = new Map();
    for (let i = 0; i < group.length; i++) {
      const key = Math.floor((alongX ? group[i].x : group[i].z) / 1.45);
      const list = bins.get(key);
      if (list) list.push(group[i]);
      else bins.set(key, [group[i]]);
    }
    return [...bins.values()];
  }

  function splitOne(PE, THREE, mesh) {
    const geo = mesh.geometry;
    const pos = geo.attributes.position;
    const col = geo.attributes.color;
    const M = mesh.matrixWorld;
    const triCount = (pos.count / 3) | 0;
    const va = new THREE.Vector3();
    const vb = new THREE.Vector3();
    const vc = new THREE.Vector3();
    const cands = [];
    for (let t = 0; t < triCount; t++) {
      const i = t * 3;
      va.fromBufferAttribute(pos, i).applyMatrix4(M);
      vb.fromBufferAttribute(pos, i + 1).applyMatrix4(M);
      vc.fromBufferAttribute(pos, i + 2).applyMatrix4(M);
      const r = (col.getX(i) + col.getX(i + 1) + col.getX(i + 2)) / 3;
      const g = (col.getY(i) + col.getY(i + 1) + col.getY(i + 2)) / 3;
      const b = (col.getZ(i) + col.getZ(i + 1) + col.getZ(i + 2)) / 3;
      if (!brown(r, g, b)) continue;
      const minx = Math.min(va.x, vb.x, vc.x), maxx = Math.max(va.x, vb.x, vc.x);
      const miny = Math.min(va.y, vb.y, vc.y), maxy = Math.max(va.y, vb.y, vc.y);
      const minz = Math.min(va.z, vb.z, vc.z), maxz = Math.max(va.z, vb.z, vc.z);
      const dx = maxx - minx, dy = maxy - miny, dz = maxz - minz;
      const long = Math.max(dx, dz);
      const thin = Math.min(dx, dz);
      const cy = (miny + maxy) * 0.5;
      if (maxy > 1.85 || miny < -0.15 || cy > 1.55) continue;
      let label = 0;
      if (dy < 0.45 && long > 0.28 && thin < 0.55 && cy > 0.18) label = 1;
      else if (dy > 0.12 && long < 1.05 && thin < 0.65 && dy + 0.05 >= long) label = 2;
      if (!label) continue;
      cands.push({ t, label, x: (minx + maxx) * 0.5, y: cy, z: (minz + maxz) * 0.5 });
    }
    if (cands.length < 4) return;
    const parent = new Uint32Array(cands.length);
    for (let i = 0; i < cands.length; i++) parent[i] = i;
    const find = (a) => {
      while (parent[a] !== a) { parent[a] = parent[parent[a]]; a = parent[a]; }
      return a;
    };
    const cell = 0.34;
    const grid = new Map();
    const key = (x, y, z) => ((Math.floor(x / cell) + 500) * 73856093 ^ (Math.floor(y / cell) + 20) * 19349663 ^ (Math.floor(z / cell) + 500) * 83492791) >>> 0;
    for (let i = 0; i < cands.length; i++) {
      const c = cands[i];
      const k = key(c.x, c.y, c.z) + c.label * 97;
      const list = grid.get(k);
      if (list) list.push(i);
      else grid.set(k, [i]);
    }
    for (let i = 0; i < cands.length; i++) {
      const c = cands[i];
      const gx = Math.floor(c.x / cell), gy = Math.floor(c.y / cell), gz = Math.floor(c.z / cell);
      for (let ix = gx - 1; ix <= gx + 1; ix++) {
        for (let iy = gy - 1; iy <= gy + 1; iy++) {
          for (let iz = gz - 1; iz <= gz + 1; iz++) {
            const list = grid.get((((ix + 500) * 73856093 ^ (iy + 20) * 19349663 ^ (iz + 500) * 83492791) >>> 0) + c.label * 97);
            if (!list) continue;
            for (let n = 0; n < list.length; n++) {
              const j = list[n];
              if (j <= i || cands[j].label !== c.label) continue;
              const o = cands[j];
              if ((c.x - o.x) * (c.x - o.x) + (c.y - o.y) * (c.y - o.y) + (c.z - o.z) * (c.z - o.z) < 0.55 * 0.55) {
                parent[find(j)] = find(i);
              }
            }
          }
        }
      }
    }
    const groups = new Map();
    for (let i = 0; i < cands.length; i++) {
      const r = find(i);
      let g = groups.get(r);
      if (!g) { g = []; groups.set(r, g); }
      g.push(cands[i]);
    }
    const drop = new Set();
    groups.forEach((group) => {
      let minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9, minz = 1e9, maxz = -1e9;
      for (let i = 0; i < group.length; i++) {
        const t = group[i].t * 3;
        for (let k = 0; k < 3; k++) {
          va.fromBufferAttribute(pos, t + k).applyMatrix4(M);
          if (va.x < minx) minx = va.x;
          if (va.x > maxx) maxx = va.x;
          if (va.y < miny) miny = va.y;
          if (va.y > maxy) maxy = va.y;
          if (va.z < minz) minz = va.z;
          if (va.z > maxz) maxz = va.z;
        }
      }
      const sx = maxx - minx, sy = maxy - miny, sz = maxz - minz;
      const long = Math.max(sx, sz);
      const thin = Math.min(sx, sz);
      const label = group[0].label;
      const railOk = label === 1 && long > 0.35 && long < 28 && thin < 0.7 && sy < 0.7 && group.length >= 2 && group.length <= 500;
      const postOk = label === 2 && long < 1.25 && thin < 0.85 && sy > 0.22 && sy < 2.2 && group.length >= 2 && group.length <= 220;
      if (!railOk && !postOk) return;
      const kind = railOk ? "rail" : "post";
      const chunks = kind === "rail" && long > 1.7 ? sliceRails(group, sx >= sz) : [group];
      chunks.forEach((tris) => { if (tris.length >= 2) emitPiece(PE, THREE, mesh, pos, col, M, va, tris, kind, drop); });
    });
    if (!drop.size) return;
    compact(THREE, geo, drop, triCount);
    mesh.userData.v52split = drop.size;
  }

  function compact(THREE, geo, drop, triCount) {
    let keep = 0;
    for (let t = 0; t < triCount; t++) if (!drop.has(t)) keep++;
    const attrs = geo.attributes;
    Object.keys(attrs).forEach((name) => {
      const a = attrs[name];
      if (!a || a.isInterleavedBufferAttribute || !a.array) return;
      const item = a.itemSize;
      const src = a.array;
      const Ctor = src.constructor;
      const dst = new Ctor(keep * 3 * item);
      let w = 0;
      for (let t = 0; t < triCount; t++) {
        if (drop.has(t)) continue;
        const base = t * 3 * item;
        for (let k = 0; k < 3 * item; k++) dst[w++] = src[base + k];
      }
      geo.setAttribute(name, new THREE.BufferAttribute(dst, item));
    });
    geo.computeVertexNormals();
    geo.computeBoundingBox();
    geo.computeBoundingSphere();
  }

  function balconyTexture(THREE) {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 512;
    const g = c.getContext("2d");
    g.fillStyle = "#f4efe6";
    g.fillRect(0, 0, 512, 512);
    const cols = ["#e5f2dc", "#fde4f1"];
    const tw = 512 / 4;
    const th = 512 / 4;
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        g.fillStyle = cols[(x + y) % 2];
        g.fillRect(x * tw + 6, y * th + 6, tw - 12, th - 12);
        if ((x + y) % 2 === 1) {
          const cx = x * tw + tw / 2;
          const cy = y * th + th / 2;
          g.fillStyle = "#f08ab8";
          for (let k = 0; k < 5; k++) {
            const a = k / 5 * Math.PI * 2 - Math.PI / 2;
            g.beginPath();
            g.ellipse(cx + Math.cos(a) * 16, cy + Math.sin(a) * 16, 8, 12, a, 0, Math.PI * 2);
            g.fill();
          }
          g.fillStyle = "#ffe27a";
          g.beginPath();
          g.arc(cx, cy, 7, 0, Math.PI * 2);
          g.fill();
        }
      }
    }
    g.strokeStyle = "#c45b8c";
    g.lineWidth = 18;
    g.strokeRect(9, 9, 494, 494);
    g.strokeStyle = "#e7c48a";
    g.lineWidth = 6;
    g.strokeRect(22, 22, 468, 468);
    const tex = new THREE.CanvasTexture(c);
    if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }

  function balconyFloor(PE, THREE) {
    const castle = PE.v3 && PE.v3.castle && PE.v3.castle.castleIn;
    const group = castle && castle.group;
    if (!group) return;
    const stair = group.getObjectByName("v51-stair");
    if (!stair || stair.getObjectByName("v52-balcony-floor")) return;
    let slab = null;
    stair.traverse((o) => { if (o.isMesh && o.userData && o.userData.v51floor) slab = o; });
    const tex = balconyTexture(THREE);
    const mat = new THREE.MeshLambertMaterial({ map: tex, color: "#ffffff" });
    if (slab) {
      slab.material = mat;
      slab.name = "v52-balcony-floor";
      slab.userData.v52floor = 1;
    }
  }

  function floorLift(lx, lz) {
    if (Math.abs(lx) > 3.8) return 0;
    if (lz >= STAIR.z1 && lz < 22.4) return STAIR.rise;
    if (lz > STAIR.z0 && lz < STAIR.z1 && Math.abs(lx) <= STAIR.half + 0.2) {
      return ((lz - STAIR.z0) / (STAIR.z1 - STAIR.z0)) * STAIR.rise;
    }
    return 0;
  }
  function treadIndex(lx, lz) {
    if (Math.abs(lx) > STAIR.half + 0.35) return -1;
    if (lz < STAIR.z0 + 0.02 || lz > STAIR.z1 - 0.02) return -1;
    const u = (lz - STAIR.z0) / (STAIR.z1 - STAIR.z0);
    return Math.max(0, Math.min(STAIR.steps - 1, Math.floor(u * STAIR.steps)));
  }
  function muted(PE) {
    const state = PE.state && PE.state();
    if (state && state.sound === false) return true;
    const btn = document.getElementById("sound");
    if (btn && /off/i.test(btn.textContent || "")) return true;
    if (PE.learn && PE.learn.quiet && PE.learn.quiet()) return true;
    return false;
  }
  function stepSound() {
    stepsPlayed++;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtx) audioCtx = new Ctx();
      const ctx = audioCtx;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const t = ctx.currentTime;
      o.type = "sine";
      o.frequency.setValueAtTime(196, t);
      o.frequency.exponentialRampToValueAtTime(140, t + 0.09);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.018, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.12);
    } catch (err) { /* no audio */ }
  }
  function bounceHeight() {
    if (bounceHold != null) return Math.sin(Math.max(0, Math.min(1, bounceHold)) * Math.PI) * 0.085;
    const age = performance.now() - bounceAt;
    if (age < 0 || age > 240) return 0;
    return Math.sin((age / 240) * Math.PI) * 0.085;
  }
  function stairStep(PE) {
    const castle = PE.v3 && PE.v3.castle;
    if (!castle || !castle.inCastle || castle.sitting) {
      lastTread = -1;
      return;
    }
    const p = PE.princess.position;
    const ic = castle.IC;
    if (!ic) return;
    const lx = p.x - ic.x;
    const lz = p.z - ic.z;
    const tread = treadIndex(lx, lz);
    if (lastTread >= 0 && tread >= 0 && tread !== lastTread) {
      bounceAt = performance.now();
      if (!muted(PE)) stepSound();
    }
    lastTread = tread;
    if (tread >= 0) p.y = floorLift(lx, lz) + bounceHeight();
  }

  function scanSigns(PE, THREE) {
    scanned = true;
    const planes = [];
    PE.scene.traverse((o) => {
      if (!o.isMesh || o.userData.v52seen || o.userData.v51back) return;
      if (!o.geometry || o.geometry.type !== "PlaneGeometry") return;
      planes.push(o);
    });
    planes.forEach((mesh) => considerSign(mesh));
  }

  function considerSign(mesh) {
    mesh.userData.v52seen = 1;
    const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
    if (!mat || !mat.map) return;
    const params = mesh.geometry.parameters || {};
    const w = Math.abs((params.width || 1) * (mesh.scale.x || 1));
    const h = Math.abs((params.height || 1) * (mesh.scale.y || 1));
    if (w < 0.28 || w > 4.2 || h < 0.1 || h > 2.4) return;
    if (Math.abs(mesh.rotation.x) > 0.85) return;
    const wp = new (three().Vector3)();
    mesh.getWorldPosition(wp);
    if (wp.y < 0.45) return;
    const parent = mesh.parent;
    if (parent && !parent.userData.v52rig && parent.children.length <= 8 && parent.children.some((c) => c.geometry && c.geometry.type === "CylinderGeometry")) {
      rigSign(parent);
      return;
    }
    mesh.userData.v52yaw = 1;
    mesh.userData.v52wide = w > 1.6;
    yaws.push(mesh);
  }

  function rigSign(parent) {
    const THREE = three();
    if (!THREE || parent.userData.v52rig) return;
    const pivot = new THREE.Group();
    pivot.name = "v52-sign-pivot";
    parent.add(pivot);
    parent.children.slice().forEach((ch) => {
      if (ch === pivot) return;
      if (ch.geometry && ch.geometry.type === "CylinderGeometry") return;
      ch.userData.v52seen = 1;
      if (pivot.attach) pivot.attach(ch);
    });
    parent.userData.v52rig = 1;
    pivot.userData.v52yaw = 1;
    pivot.userData.v52wide = [...parent.children, ...pivot.children].some((c) => c.geometry && c.geometry.parameters && c.geometry.parameters.width > 1.6);
    yaws.push(pivot);
  }

  function billboard(PE, THREE) {
    const cam = PE.camera;
    if (!cam) return;
    for (let i = 0; i < yaws.length; i++) {
      const mesh = yaws[i];
      if (!mesh.parent) continue;
      mesh.updateWorldMatrix(true, false);
      mesh.getWorldPosition(_p);
      if (!mesh.userData.v52rest) {
        mesh.userData.v52rest = { x: mesh.rotation.x, y: mesh.rotation.y, z: mesh.rotation.z };
      }
      const dx = cam.position.x - _p.x;
      const dz = cam.position.z - _p.z;
      const dist = Math.hypot(dx, dz);
      const limit = mesh.userData.v52wide ? 8 : 12;
      const rest = mesh.userData.v52rest;
      if (dist > limit || dist < 0.2) {
        mesh.rotation.x = rest.x;
        mesh.rotation.y = rest.y;
        mesh.rotation.z = rest.z;
        continue;
      }
      const parent = mesh.parent;
      parent.updateWorldMatrix(true, false);
      parent.getWorldQuaternion(_q);
      _q.invert();
      _dir.set(dx, 0, dz).normalize().applyQuaternion(_q);
      _dir.y = 0;
      if (_dir.lengthSq() < 1e-6) continue;
      _dir.normalize();
      mesh.rotation.x = 0;
      mesh.rotation.z = 0;
      let yaw = Math.atan2(_dir.x, _dir.z);
      let delta = yaw - rest.y;
      while (delta > Math.PI) delta -= Math.PI * 2;
      while (delta < -Math.PI) delta += Math.PI * 2;
      const maxTurn = mesh.userData.v52wide ? 0.5 : 1.2;
      if (delta > maxTurn) delta = maxTurn;
      if (delta < -maxTurn) delta = -maxTurn;
      mesh.rotation.y = rest.y + delta;
    }
  }

  function hookGarden(PE) {
    const game = PE.v35 && PE.v35.defs && PE.v35.defs.garden;
    if (!game || game.v52hook) return;
    game.v52hook = true;
    const origInit = game.init.bind(game);
    const origAct = game.act.bind(game);
    const origUpdate = game.update.bind(game);
    const origCam = game.cam.bind(game);
    let lastSig = "";
    let sinceSave = 0;
    function pack(n) {
      if (!n || !n.plots) return null;
      return n.plots.map((p) => {
        const alive = p.st === "grow" || p.st === "bloom";
        return {
          st: alive ? p.st : "empty",
          grow: alive ? Math.round((+p.grow || 0) * 100) / 100 : 0,
          water: alive ? Math.round((+p.water || 0) * 100) / 100 : 0
        };
      });
    }
    function write(n) {
      const list = pack(n);
      if (!list) return;
      const sig = JSON.stringify(list);
      if (sig === lastSig) return;
      lastSig = sig;
      const s = PE.state();
      if (!s.v52 || typeof s.v52 !== "object") s.v52 = {};
      s.v52.garden = list;
      if (PE.save) PE.save();
    }
    game.init = function (n, e) {
      origInit(n, e);
      const saved = (PE.state().v52 && PE.state().v52.garden) || [];
      if (!Array.isArray(saved) || saved.length !== n.plots.length) {
        lastSig = JSON.stringify(pack(n));
        return;
      }
      saved.forEach((row, i) => {
        const plot = n.plots[i];
        if (!row || (row.st !== "grow" && row.st !== "bloom")) return;
        plot.st = row.st;
        plot.grow = Math.max(0, Math.min(1.2, +row.grow || 0));
        plot.water = Math.max(0, Math.min(1, +row.water || 0));
        plot.obj = game.plantObj(n, e, plot);
        game.shape(plot);
      });
      lastSig = JSON.stringify(pack(n));
    };
    game.act = function (n, e, t) {
      const out = origAct(n, e, t);
      write(n);
      return out;
    };
    game.update = function (n, dt, input, helper) {
      const before = (n.plots || []).map((p) => p.st).join("");
      origUpdate(n, dt, input, helper);
      const after = (n.plots || []).map((p) => p.st).join("");
      sinceSave += dt;
      if (after !== before || sinceSave >= 0.75) { sinceSave = 0; write(n); }
    };
    game.cam = function (n, e) {
      const c = origCam(n, e);
      if (window.innerHeight < 520 && window.innerWidth > window.innerHeight) {
        c[1] = 6.6;
        c[2] = e.P.z * 0.35 + 7.4;
        c[5] = e.P.z * 0.35 - 0.2;
      }
      return c;
    };
    if (PE.v35.close && !PE.v35.close.v52) {
      const origClose = PE.v35.close.bind(PE.v35);
      const wrapped = function () {
        if (PE.v35.g) write(PE.v35.g);
        return origClose();
      };
      wrapped.v52 = true;
      PE.v35.close = wrapped;
    }
    pinMiniCard();
    hookPops(PE, three());
  }

  function hookPops(PE, THREE) {
    const K = PE.v35 && PE.v35.K;
    if (!K || !K.pop || K.pop.v52) return;
    const orig = K.pop.bind(K);
    function crowded(x, y, z) {
      const cam = PE.camera;
      const pops = PE.v35.pops || [];
      if (!cam || !_p || !_b) return false;
      _p.set(PE.v35.AX + x, y, PE.v35.AZ + z);
      _p.project(cam);
      const sx = _p.x;
      const sy = _p.y;
      for (let i = 0; i < pops.length; i++) {
        const p = pops[i];
        if (!p || !p.position || (p.userData && p.userData.life <= 0)) continue;
        _b.set(PE.v35.AX + p.position.x, p.position.y, PE.v35.AZ + p.position.z);
        _b.project(cam);
        if (Math.abs(_b.x - sx) < 0.18 && Math.abs(_b.y - sy) < 0.1) return true;
      }
      return false;
    }
    const wrapped = function (text, x, y, z, color, size) {
      let ox = 0;
      let oy = 0;
      const baseY = y == null ? 2.2 : y;
      for (let n = 0; n < 8 && crowded(x + ox, baseY + oy, z); n++) {
        oy += 0.62;
        ox = n % 2 === 0 ? 0.75 : -0.75;
      }
      orig(text, x + ox, baseY + oy, z, color, size);
      const pops = PE.v35.pops || [];
      const sprite = pops[pops.length - 1];
      if (!sprite || !sprite.userData) return;
      sprite.userData.life = 0.7;
      const map = sprite.material && sprite.material.map;
      if (map && THREE) {
        map.generateMipmaps = false;
        map.minFilter = THREE.LinearFilter;
        map.magFilter = THREE.LinearFilter;
        map.needsUpdate = true;
      }
    };
    wrapped.v52 = true;
    K.pop = wrapped;
  }

  function pinMiniCard() {
    if (document.getElementById("v52-garden-style")) return;
    const style = document.createElement("style");
    style.id = "v52-garden-style";
    style.textContent = `
#a35-card.v52-split{display:flex;flex-direction:column;overflow:hidden}
#a35-card .v52-scroll{overflow:auto;flex:1 1 auto;min-height:0;-webkit-overflow-scrolling:touch}
#a35-card .v52-pin{flex:0 0 auto;background:#fff;padding-top:8px;border-top:3px solid #ffe0f2}
#a35-card .v52-pin .row{margin-top:6px}
#a35-card .v52-pin .big{width:100%}
`;
    document.head.appendChild(style);
    const card = document.getElementById("a35-card");
    if (!card) return;
    let gaveUp = null;
    const pin = () => {
      if (card.querySelector(":scope > .v52-pin")) return;
      const anchor = card.querySelector("#a35-go, #a35-qnext");
      if (!anchor || !anchor.parentElement || gaveUp === anchor) return;
      const scroller = document.createElement("div");
      scroller.className = "v52-scroll";
      while (card.firstChild) scroller.appendChild(card.firstChild);
      card.appendChild(scroller);
      const bar = document.createElement("div");
      bar.className = "v52-pin";
      const take = (sel) => {
        const el = scroller.querySelector(sel);
        if (el && el.parentElement && el.parentElement.parentElement === scroller) bar.appendChild(el.parentElement);
      };
      take("#a35-go");
      take("#a35-qnext");
      take("#a35-back");
      take("#a35-qback");
      if (!bar.childElementCount) {
        while (scroller.firstChild) card.appendChild(scroller.firstChild);
        scroller.remove();
        gaveUp = anchor;
        return;
      }
      gaveUp = null;
      card.appendChild(bar);
      card.classList.add("v52-split");
    };
    new MutationObserver(() => pin()).observe(card, { childList: true });
    pin();
  }

  boot();
})();

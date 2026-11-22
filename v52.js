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
    try { splitFences(PE, THREE); } catch (err) { PE.v52error = String(err && err.message || err); }
    markBridge(PE);
    balconyFloor(PE, THREE);
    collectOccluders(PE, THREE);
    hookCamera(PE, THREE);
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
      error: ""
    };
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
    const outward = 0.55;
    const side = raised ? (phone ? 5.2 : 6.4) : (phone ? 4.4 : 5.6);
    let cx = p.x + outX * outward + tx * side;
    let cz = p.z + outZ * outward + tz * side;
    let vx = cx - MOAT.x;
    let vz = cz - MOAT.z;
    let r = Math.hypot(vx, vz) || 1;
    const minR = MOAT.inner + 0.85;
    const maxR = MOAT.outer - 0.45;
    const clamped = Math.max(minR, Math.min(maxR, r));
    cx = MOAT.x + (vx / r) * clamped;
    cz = MOAT.z + (vz / r) * clamped;
    const cam = PE.camera;
    const lift = raised ? 6.5 : (phone ? 4.7 : 5.7);
    cam.position.set(cx, Math.max(p.y + lift, 4.8), cz);
    native.call(cam, p.x - outX * 0.4, p.y + 0.85, p.z - outZ * 0.4);
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
    if (mode === "bridge" || mode === "boat") {
      const bridgePad = PE.gate && PE.gate.state && PE.gate.state.b < 0.7 ? 0.42 : 0.26;
      const bridgeMeshes = pieces.filter((m) => m.userData.v52bridge);
      grazeList(PE, THREE, bridgeMeshes, cam, feet, bridgePad, next);
      grazeList(PE, THREE, bridgeMeshes, cam, waist, bridgePad, next);
    }
    if (mode === "boat") {
      grazeList(PE, THREE, buildings(PE), cam, feet, 0.35, next);
      grazeList(PE, THREE, buildings(PE), cam, waist, 0.4, next);
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

  function markBridge(PE) {
    PE.scene.traverse((o) => {
      if (!o.isMesh) return;
      let p = o;
      while (p) {
        if (p.name === "v34-drawbridge") { o.userData.v52bridge = 1; pieces.push(o); break; }
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

  boot();
})();

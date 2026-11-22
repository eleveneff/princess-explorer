/* Princess Explorer 5.1 — taller castle rooms and a camera that keeps her in view.
   Save keys, coins, stars, items, and prices are unchanged. */
(function () {
  const SCALE = 1.9;
  const EMPTY = function () {};

  const SCENERY = ["v46-skirt", "v46-stream", "v34-moat", "v45-lawn"];

  function scenery(PE, hide) {
    SCENERY.forEach((name) => {
      const obj = PE.scene.getObjectByName(name);
      if (obj) obj.visible = !hide;
    });
  }

  function boot() {
    const PE = window.PrincessExplorer;
    const THREE = PE && PE.gfx43 && PE.gfx43.THREE;
    const castle = PE && PE.v3 && PE.v3.castle;
    if (!THREE || !castle || !castle.placeInteriorCamera || !castle.castleIn || !PE.camera) {
      setTimeout(boot, 30);
      return;
    }
    raiseInterior(PE, THREE, castle);
    hookInterior(PE, THREE, castle);
    hookGarden(PE, THREE);
    window.__GAME_VERSION__ = "v5.1";
    try { PE.version = "v5.1"; } catch (e) { /* version may be a getter */ }
  }

  function raiseInterior(PE, THREE, castle) {
    const group = castle.castleIn.group;
    if (!group || group.userData.v51) return;
    group.scale.y = SCALE;
    group.updateMatrixWorld(true);
    const box = new THREE.Box3();
    const size = new THREE.Vector3();
    const meshes = [];
    group.traverse((o) => { if (o.isMesh) meshes.push(o); });
    meshes.forEach((mesh) => {
      box.setFromObject(mesh);
      if (box.isEmpty()) return;
      box.getSize(size);
      const cy = (box.min.y + box.max.y) * 0.5;
      const wide = size.x > 2.2 && size.z > 2.2;
      if (wide && size.y < 0.6 && cy < 1.5) {
        mesh.scale.y /= SCALE;
        mesh.position.y /= SCALE;
        mesh.userData.v51floor = 1;
      }
    });
    const pet = castle.castleIn.pet;
    if (pet) pet.scale.y /= SCALE;
    group.traverse((o) => {
      if (o.isSprite) o.scale.y /= SCALE;
    });
    if (castle.castleIn.seat) castle.castleIn.seat.y *= SCALE;
    if (castle.castleIn.petSeat) castle.castleIn.petSeat.y *= SCALE;
    easeStairs(THREE, group);
    buildStair(THREE, group);
    liftBalcony(THREE, group);
    fixSigns(THREE, PE.scene, castle);
    nudgeCarpetSign(THREE, group);
    openTerraceGap(THREE, PE.scene);
    const fill = new THREE.PointLight("#fff6ea", 0.55, 36);
    fill.position.set(0, 3.4, 1);
    fill.name = "v51-fill";
    group.add(fill);
    group.userData.v51 = SCALE;
  }

  function easeStairs(THREE, group) {
    const box = new THREE.Box3();
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    const steps = [];
    group.updateMatrixWorld(true);
    group.traverse((o) => {
      if (!o.isMesh || o.userData.v51floor) return;
      box.setFromObject(o);
      if (box.isEmpty()) return;
      box.getSize(size);
      box.getCenter(center);
      if (size.y < 0.08 || size.y > 0.5) return;
      if (size.x > 3.2 || size.z > 3.2) return;
      if (center.y < 0.35 || center.y > 8) return;
      steps.push({ mesh: o, x: center.x, y: center.y, z: center.z });
    });
    const used = new Set();
    steps.forEach((seed, s) => {
      if (used.has(s)) return;
      ["x", "z"].forEach((axis) => {
        const other = axis === "x" ? "z" : "x";
        const run = steps.filter((st, i) => Math.abs(st[other] - seed[other]) < 0.45 && Math.abs(st[axis] - seed[axis]) < 8);
        if (run.length < 4) return;
        run.sort((a, b) => a.y - b.y);
        let monotonic = true;
        for (let i = 1; i < run.length; i++) if (run[i][axis] < run[i - 1][axis] - 0.05) monotonic = false;
        if (!monotonic) {
          monotonic = true;
          for (let i = 1; i < run.length; i++) if (run[i][axis] > run[i - 1][axis] + 0.05) monotonic = false;
        }
        if (!monotonic) return;
        const rise = run[run.length - 1].y - run[0].y;
        const span = Math.abs(run[run.length - 1][axis] - run[0][axis]) || 0.01;
        if (rise / span < 0.72) return;
        const dir = Math.sign(run[run.length - 1][axis] - run[0][axis]) || 1;
        const want = rise / 0.58;
        const scl = new THREE.Vector3();
        run.forEach((st, i) => {
          const along = (want * i) / (run.length - 1);
          const delta = (run[0][axis] + dir * along) - st[axis];
          st.mesh.parent.updateWorldMatrix(true, false);
          st.mesh.parent.getWorldScale(scl);
          st.mesh.position[axis] += delta / (Math.abs(scl[axis]) || 1);
          used.add(steps.indexOf(st));
        });
      });
    });
  }

  const STAIR = { z0: 14.45, z1: 17.35, rise: 1.7, half: 1.3 };

  function floorLift(lx, lz) {
    if (Math.abs(lx) > 3.8) return 0;
    if (lz >= STAIR.z1 && lz < 22.4) return STAIR.rise;
    if (lz > STAIR.z0 && lz < STAIR.z1 && Math.abs(lx) <= STAIR.half + 0.2) {
      return ((lz - STAIR.z0) / (STAIR.z1 - STAIR.z0)) * STAIR.rise;
    }
    return 0;
  }

  function buildStair(THREE, group) {
    if (group.getObjectByName("v51-stair")) return;
    const root = new THREE.Group();
    root.name = "v51-stair";
    const wood = new THREE.MeshLambertMaterial({ color: "#c9844a" });
    const edge = new THREE.MeshLambertMaterial({ color: "#8d5a32" });
    const rail = new THREE.MeshLambertMaterial({ color: "#f3efe4" });
    const steps = 9;
    const run = STAIR.z1 - STAIR.z0;
    const treadD = run / steps;
    for (let i = 0; i < steps; i++) {
      const top = ((i + 1) / steps) * STAIR.rise;
      const z = STAIR.z0 + (i + 0.5) * treadD;
      const tread = new THREE.Mesh(new THREE.BoxGeometry(STAIR.half * 2, 0.18, treadD + 0.04), i % 2 ? wood : edge);
      tread.scale.y = 1 / SCALE;
      tread.position.set(0, (top - 0.09) / SCALE, z);
      tread.userData.v51stair = 1;
      root.add(tread);
    }
    const slab = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.2, 5.4), wood);
    slab.scale.y = 1 / SCALE;
    slab.position.set(0, (STAIR.rise - 0.1) / SCALE, 19.4);
    slab.userData.v51floor = 1;
    root.add(slab);
    [-STAIR.half - 0.08, STAIR.half + 0.08].forEach((x) => {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.42, run), rail);
      bar.scale.y = 1 / SCALE;
      bar.position.set(x, (STAIR.rise * 0.42) / SCALE, (STAIR.z0 + STAIR.z1) / 2);
      root.add(bar);
    });
    group.add(root);
  }

  function liftBalcony(THREE, group) {
    const box = new THREE.Box3();
    const size = new THREE.Vector3();
    group.updateMatrixWorld(true);
    const meshes = [];
    group.traverse((o) => { if (o.isMesh && !o.userData.v51stair && !o.userData.castleCeil && !o.userData.v51floor) meshes.push(o); });
    meshes.forEach((mesh) => {
      box.setFromObject(mesh);
      if (box.isEmpty()) return;
      box.getSize(size);
      const lz0 = box.min.z - group.position.z;
      const lz1 = box.max.z - group.position.z;
      const top = box.max.y;
      if (lz0 > 16.7 && lz1 < 22.6 && top < 4.2 && size.x < 14 && size.y < 3.2) {
        mesh.position.y += STAIR.rise / SCALE;
        mesh.userData.v51lifted = 1;
      }
    });
  }

  function backMaterial(THREE, material) {
    const mats = Array.isArray(material) ? material : [material];
    const clones = mats.map((m) => {
      if (!m) return m;
      const c = m.clone();
      c.side = THREE.FrontSide !== undefined ? THREE.FrontSide : 0;
      return c;
    });
    return Array.isArray(material) ? clones : clones[0];
  }

  function fixSigns(THREE, scene, castle) {
    const front = THREE.FrontSide !== undefined ? THREE.FrontSide : 0;
    scene.traverse((o) => {
      if (!o.isMesh || !o.geometry || o.geometry.type !== "PlaneGeometry" || o.userData.v51sign) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      if (!mats.some((m) => m && m.map && (m.side === THREE.DoubleSide || m.side === 2))) return;
      mats.forEach((m) => { if (m) m.side = front; });
      const back = new THREE.Mesh(o.geometry, backMaterial(THREE, o.material));
      back.rotation.y = Math.PI;
      back.position.z = -0.02;
      back.userData.v51back = 1;
      o.add(back);
      o.userData.v51sign = 1;
    });
    const signs = (castle.castleIn && castle.castleIn.signs) || [];
    signs.forEach((sign) => {
      sign.children.forEach((ch) => {
        if (!ch.isMesh || ch.userData.v51fixed) return;
        if (Math.abs(Math.abs(ch.rotation.y) - Math.PI) > 0.25) return;
        ch.scale.x = 1;
        ch.material = backMaterial(THREE, ch.material);
        ch.userData.v51fixed = 1;
      });
    });
  }

  function nudgeCarpetSign(THREE, group) {
    const box = new THREE.Box3();
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    group.updateMatrixWorld(true);
    group.traverse((o) => {
      if (!o.isMesh || !o.geometry || o.geometry.type !== "PlaneGeometry" || o.userData.v51moved) return;
      const mat = Array.isArray(o.material) ? o.material[0] : o.material;
      if (!mat || !mat.map) return;
      box.setFromObject(o);
      if (box.isEmpty()) return;
      box.getCenter(center);
      box.getSize(size);
      const lx = center.x - group.position.x;
      const lz = center.z - group.position.z;
      if (Math.abs(lx) > 0.85 || lz < -16 || lz > -4 || center.y > 2.4 || size.y > 1.4) return;
      const scl = new THREE.Vector3();
      (o.parent || group).updateWorldMatrix(true, false);
      (o.parent || group).getWorldScale(scl);
      o.position.x += (2.35 - lx) / (Math.abs(scl.x) || 1);
      o.userData.v51moved = 1;
    });
  }

  function openTerraceGap(THREE, scene) {
    const a = 142 * Math.PI / 180;
    const R = 14.6 + 4.4;
    const spot = new THREE.Vector3(Math.cos(a) * R, 0, Math.sin(a) * R);
    const v = new THREE.Vector3();
    const inv = new THREE.Matrix4();
    scene.traverse((mesh) => {
      if (!mesh.isMesh || !mesh.geometry || !mesh.geometry.attributes || !mesh.geometry.attributes.position) return;
      const pos = mesh.geometry.attributes.position;
      if (pos.count < 4000 || mesh.userData.v51gap) return;
      mesh.updateWorldMatrix(true, false);
      inv.copy(mesh.matrixWorld).invert();
      let n = 0;
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
        const dx = v.x - spot.x;
        const dz = v.z - spot.z;
        if (dx * dx + dz * dz > 1.7 * 1.7) continue;
        if (v.y < 0.12 || v.y > 1.6) continue;
        v.y = -2.5;
        v.applyMatrix4(inv);
        pos.setXYZ(i, v.x, v.y, v.z);
        n += 1;
      }
      if (!n) return;
      pos.needsUpdate = true;
      mesh.geometry.computeVertexNormals();
      mesh.geometry.computeBoundingBox();
      mesh.geometry.computeBoundingSphere();
      mesh.userData.v51gap = n;
    });
  }

  function worldCeiling(THREE, group, x, z, minY) {
    let best = null;
    const pos = new THREE.Vector3();
    const scl = new THREE.Vector3();
    group.updateMatrixWorld(true);
    group.traverse((o) => {
      if (!o.userData || !o.userData.castleCeil || !o.geometry || !o.geometry.parameters) return;
      const p = o.geometry.parameters;
      o.getWorldPosition(pos);
      o.getWorldScale(scl);
      const hw = Math.abs(p.width * scl.x) * 0.5;
      const hd = Math.abs(p.depth * scl.z) * 0.5;
      if (Math.abs(x - pos.x) > hw || Math.abs(z - pos.z) > hd) return;
      const under = pos.y - Math.abs(p.height * scl.y) * 0.5;
      if (under < minY + 0.4) return;
      if (best == null || under < best) best = under;
    });
    return best;
  }

  function remember(mesh, opacity) {
    if (!mesh || !mesh.material) return;
    if (!mesh.userData.v51fade) {
      mesh.userData.v51fade = { material: mesh.material, raycast: mesh.raycast };
      const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      const clones = list.map((m) => {
        const c = m.clone();
        c.transparent = true;
        c.depthWrite = false;
        c.opacity = opacity;
        return c;
      });
      mesh.material = Array.isArray(mesh.material) ? clones : clones[0];
      mesh.raycast = EMPTY;
    }
    const cur = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    cur.forEach((m) => { if (m) m.opacity = opacity; });
  }

  function recall(mesh) {
    const saved = mesh.userData.v51fade;
    if (!saved) return;
    mesh.material = saved.material;
    mesh.raycast = saved.raycast;
    delete mesh.userData.v51fade;
  }

  function applyFade(next, store) {
    store.forEach((opacity, mesh) => { if (!next.has(mesh)) recall(mesh); });
    next.forEach((opacity, mesh) => remember(mesh, opacity));
    store.clear();
    next.forEach((opacity, mesh) => store.set(mesh, opacity));
  }

  function isActor(obj, actor) {
    let o = obj;
    while (o) {
      if (o === actor) return true;
      o = o.parent;
    }
    return false;
  }

  function meshBox(mesh, THREE) {
    const box = new THREE.Box3().setFromObject(mesh);
    const size = new THREE.Vector3();
    if (!box.isEmpty()) box.getSize(size);
    return { box, size };
  }

  function skipMesh(mesh, THREE, actor) {
    if (!mesh.isMesh || isActor(mesh, actor) || mesh.userData.v51floor) return true;
    const { box, size } = meshBox(mesh, THREE);
    if (box.isEmpty()) return true;
    if (size.x > 80 || size.y > 80 || size.z > 80) return true;
    const cy = (box.min.y + box.max.y) * 0.5;
    if (size.y < 0.5 && size.x > 6 && size.z > 6 && cy < 1.3) return true;
    return false;
  }

  function hideSprites(THREE, cam, head, root, hidden) {
    const wp = new THREE.Vector3();
    const ab = new THREE.Vector3();
    const ap = new THREE.Vector3();
    const next = new Set();
    root.traverse((o) => {
      if (!o.isSprite) return;
      o.getWorldPosition(wp);
      ab.copy(head).sub(cam.position);
      const len2 = ab.lengthSq() || 1;
      ap.copy(wp).sub(cam.position);
      const t = ap.dot(ab) / len2;
      if (t < 0.12 || t > 0.9) return;
      const closest = cam.position.clone().addScaledVector(ab, t);
      if (closest.distanceTo(wp) > Math.max(1.8, (o.scale.x || 1) * 0.6)) return;
      next.add(o);
    });
    hidden.forEach((o) => { if (!next.has(o)) o.visible = true; });
    next.forEach((o) => { o.visible = false; });
    hidden.clear();
    next.forEach((o) => hidden.add(o));
  }

  function clearSight(THREE, cam, head, root, actor, store, fade) {
    const ray = new THREE.Raycaster();
    const dir = new THREE.Vector3();
    store.forEach((opacity, mesh) => recall(mesh));
    store.clear();
    fade.forEach((opacity, mesh) => remember(mesh, opacity));
    const meshes = [];
    root.traverse((o) => { if (o.isMesh) meshes.push(o); });
    const aims = [head];
    const feet = head.clone();
    feet.y = actor.position.y + 0.12;
    const knee = head.clone();
    knee.y = actor.position.y + 0.42;
    aims.push(feet, knee);
    if (head.y > actor.position.y + 0.8) {
      const chest = head.clone();
      chest.y = actor.position.y + 0.85;
      aims.push(chest);
    }
    aims.forEach((aim) => {
      dir.copy(aim).sub(cam.position);
      const dist = dir.length();
      if (dist < 0.4) return;
      dir.multiplyScalar(1 / dist);
      ray.set(cam.position, dir);
      ray.near = 0.05;
      ray.far = Math.max(0.2, dist - 0.3);
      ray.intersectObjects(meshes, false).forEach((h) => {
        if (h.object.visible === false || skipMesh(h.object, THREE, actor)) return;
        const { size } = meshBox(h.object, THREE);
        const span = Math.max(size.x, size.y, size.z);
        const rail = Math.min(size.x, size.z) < 0.55 && size.y < 1.6;
        if (span >= 16 && !rail) return;
        fade.set(h.object, 0);
        remember(h.object, 0);
      });
    });
    for (let n = 0; n < 6; n++) {
      dir.copy(head).sub(cam.position);
      const dist = dir.length();
      if (dist < 2.2) break;
      dir.multiplyScalar(1 / dist);
      ray.set(cam.position, dir);
      ray.near = 0.05;
      ray.far = Math.max(0.2, dist - 0.35);
      const hits = ray.intersectObjects(meshes, false).filter((h) => h.object.visible !== false && !skipMesh(h.object, THREE, actor));
      if (!hits.length) break;
      const { size } = meshBox(hits[0].object, THREE);
      const span = Math.max(size.x, size.y, size.z);
      if (span < 16) {
        fade.set(hits[0].object, 0);
        remember(hits[0].object, 0);
      }
      const step = Math.min(dist - 2.4, hits[0].distance + 0.35);
      if (step <= 0.05) break;
      cam.position.addScaledVector(dir, Math.min(step, 1.4));
    }
    fadeRails(THREE, cam, feet, actor, meshes, fade);
    fadeBody(THREE, actor, meshes, fade);
    applyFade(fade, store);
    if (clearSight.sprites) hideSprites(THREE, cam, head, root, clearSight.sprites);
  }

  function fencePiece(size) {
    const thin = Math.min(size.x, size.z) < 0.6;
    const long = Math.max(size.x, size.z) > 0.55;
    const post = Math.max(size.x, size.z) < 0.5 && size.y > 0.3 && size.y < 1.8;
    return (thin && long && size.y < 1.7) || post;
  }

  function fadeRails(THREE, cam, feet, actor, meshes, fade) {
    const box = new THREE.Box3();
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    const ab = feet.clone().sub(cam.position);
    const len2 = ab.lengthSq() || 1;
    meshes.forEach((mesh) => {
      if (!mesh.visible || mesh.userData.v51floor || mesh.userData.v51stair || isActor(mesh, actor)) return;
      box.setFromObject(mesh);
      if (box.isEmpty()) return;
      box.getSize(size);
      if (!fencePiece(size) || Math.max(size.x, size.y, size.z) > 24) return;
      box.getCenter(center);
      let t = center.clone().sub(cam.position).dot(ab) / len2;
      if (t < 0.04 || t > 0.96) return;
      const closest = cam.position.clone().addScaledVector(ab, t);
      const pad = box.clone().expandByScalar(0.42);
      if (!pad.containsPoint(closest)) return;
      fade.set(mesh, 0);
      remember(mesh, 0);
    });
  }

  function fadeBody(THREE, actor, meshes, fade) {
    if (!actor) return;
    const p = actor.position;
    const body = new THREE.Box3(
      new THREE.Vector3(p.x - 0.48, p.y + 0.2, p.z - 0.48),
      new THREE.Vector3(p.x + 0.48, p.y + 1.7, p.z + 0.48)
    );
    const box = new THREE.Box3();
    const size = new THREE.Vector3();
    meshes.forEach((mesh) => {
      if (!mesh.visible || mesh.userData.v51floor || mesh.userData.v51stair || isActor(mesh, actor)) return;
      box.setFromObject(mesh);
      if (box.isEmpty() || !box.intersectsBox(body)) return;
      box.getSize(size);
      if (size.y < 0.28 || Math.max(size.x, size.y, size.z) > 8) return;
      fade.set(mesh, 0);
      remember(mesh, 0);
    });
  }
  clearSight.sprites = new Set();

  function hookInterior(PE, THREE, castle) {
    const orig = castle.placeInteriorCamera.bind(castle);
    const fade = new Map();
    const store = new Map();
    const target = new THREE.Vector3();
    const smooth = new THREE.Vector3();
    const head = new THREE.Vector3();
    const box = new THREE.Box3();
    let armed = false;
    castle.placeInteriorCamera = function (cam, offset, info) {
      if (cam.userData.v51hold) return;
      orig(cam, offset, info);
      if (!castle.inCastle) {
        applyFade(new Map(), store);
        scenery(PE, false);
        if (cam.userData.v51fov != null && cam.fov !== cam.userData.v51fov) {
          cam.fov = cam.userData.v51fov;
          cam.updateProjectionMatrix();
        }
        armed = false;
        return;
      }
      scenery(PE, true);
      const p = PE.princess.position;
      if (!castle.sitting) {
        const lx = p.x - castle.IC.x;
        const lz = p.z - castle.IC.z;
        p.y = floorLift(lx, lz);
      }
      const group = castle.castleIn.group;
      head.set(p.x, p.y + 1.45, p.z);
      const dx = cam.position.x - p.x;
      const dz = cam.position.z - p.z;
      const dist = Math.hypot(dx, dz) || 1;
      let want = Math.min(14.5, Math.max(11.5, dist * 1.2));
      const ic = castle.IC;
      for (let n = 0; n < 10; n++) {
        const lx = (p.x + (dx / dist) * want) - ic.x;
        const lz = (p.z + (dz / dist) * want) - ic.z;
        if (castle.freeAt(lx, lz)) break;
        want *= 0.84;
      }
      want = Math.max(3.4, want);
      const under = worldCeiling(THREE, group, p.x, p.z, p.y + 1.2);
      let y = p.y + 7.2;
      if (under != null) y = Math.min(y, under - 1.1);
      y = Math.max(y, head.y + 1.4);
      if (cam.userData.v51fov == null) cam.userData.v51fov = cam.fov;
      if (cam.fov !== 64) {
        cam.fov = 64;
        cam.updateProjectionMatrix();
      }
      target.set(p.x + (dx / dist) * want, y, p.z + (dz / dist) * want);
      const camLz = target.z - castle.IC.z;
      const plyLz = p.z - castle.IC.z;
      if (plyLz > 13.5 && camLz < 8.2 && Math.abs(plyLz - camLz) > 0.2) {
        const t = (8.2 - plyLz) / (camLz - plyLz);
        target.x = p.x + (target.x - p.x) * t;
        target.z = castle.IC.z + 8.2;
        target.y = p.y + (target.y - p.y) * t;
      }
      const dt = (info && info.dt) || 0.016;
      if (!armed || smooth.distanceTo(target) > 3) {
        smooth.copy(target);
        armed = true;
      } else {
        smooth.lerp(target, 1 - Math.exp(-7 * dt));
      }
      cam.position.copy(smooth);
      fade.clear();
      if (under != null) {
        group.traverse((o) => {
          if (!o.isMesh || o.userData.v51floor) return;
          box.setFromObject(o);
          if (!box.isEmpty() && box.min.y > under + 0.15) fade.set(o, 0);
        });
      }
      clearSight(THREE, cam, head, PE.scene, PE.princess, store, fade);
      {
        let lx = cam.position.x - ic.x;
        let lz = cam.position.z - ic.z;
        const px = p.x - ic.x;
        const pz = p.z - ic.z;
        for (let n = 0; n < 8 && !castle.freeAt(lx, lz); n++) {
          lx = lx * 0.7 + px * 0.3;
          lz = lz * 0.7 + pz * 0.3;
        }
        cam.position.x = ic.x + lx;
        cam.position.z = ic.z + lz;
      }
      smooth.copy(cam.position);
      cam.lookAt(p.x, p.y + 2.2, p.z);
    };
  }

  function gardenHere(PE) {
    const v35 = PE.v35;
    if (v35 && v35.isOpen && v35.isOpen()) {
      const game = v35.game;
      const id = game && game.id ? game.id : game;
      if (id === "garden") return "mini";
    }
    if (PE.v3 && PE.v3.castle && PE.v3.castle.inCastle) return "";
    const p = PE.princess.position;
    const gx = Math.cos(30 * Math.PI / 180) * 30;
    const gz = Math.sin(30 * Math.PI / 180) * 30;
    if (Math.hypot(p.x - gx, p.z - gz) < 16) return "yard";
    const tx = Math.cos(142 * Math.PI / 180) * 14.6;
    const tz = Math.sin(142 * Math.PI / 180) * 14.6;
    if (Math.hypot(p.x - tx, p.z - tz) < 13) return "terrace";
    return "";
  }

  function hookGarden(PE, THREE) {
    const cam = PE.camera;
    const orig = cam.lookAt.bind(cam);
    const store = new Map();
    const fade = new Map();
    const head = new THREE.Vector3();
    cam.lookAt = function (x, y, z) {
      orig(x, y, z);
      if (cam.userData.v51hold) return;
      if (cam.userData.v52own) {
        if (store.size) applyFade(new Map(), store);
        return;
      }
      if (PE.v3 && PE.v3.castle && PE.v3.castle.inCastle) {
        if (store.size) applyFade(new Map(), store);
        return;
      }
      const where = gardenHere(PE);
      if (!where) {
        if (store.size) applyFade(new Map(), store);
        if (!(PE.v3 && PE.v3.castle && PE.v3.castle.inCastle)) scenery(PE, false);
        return;
      }
      scenery(PE, where === "mini");
      const p = PE.princess.position;
      head.set(p.x, p.y + 1.3, p.z);
      const dx = cam.position.x - p.x;
      const dz = cam.position.z - p.z;
      const dist = Math.hypot(dx, dz) || 1;
      if (where !== "mini") {
        const want = 6.6;
        cam.position.x = p.x + (dx / dist) * want;
        cam.position.z = p.z + (dz / dist) * want;
        cam.position.y = p.y + 4.6;
      }
      fade.clear();
      clearSight(THREE, cam, head, PE.scene, PE.princess, store, fade);
      orig(head.x, head.y, head.z);
    };
  }

  boot();
})();

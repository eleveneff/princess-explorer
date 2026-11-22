/* Princess Explorer 5.1 — taller castle rooms and a camera that keeps her in view.
   Save keys, coins, stars, items, and prices are unchanged. */
(function () {
  const SCALE = 1.9;
  const EMPTY = function () {};

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
    if (castle.castleIn.seat) castle.castleIn.seat.y *= SCALE;
    if (castle.castleIn.petSeat) castle.castleIn.petSeat.y *= SCALE;
    easeStairs(THREE, group);
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

  function skipMesh(mesh, THREE, actor) {
    if (!mesh.isMesh || isActor(mesh, actor) || mesh.userData.v51floor) return true;
    const box = new THREE.Box3().setFromObject(mesh);
    if (box.isEmpty()) return true;
    const size = new THREE.Vector3();
    box.getSize(size);
    if (size.x > 40 || size.y > 40 || size.z > 40) return true;
    const cy = (box.min.y + box.max.y) * 0.5;
    if (size.y < 0.45 && size.x > 6 && size.z > 6 && cy < 1.2) return true;
    return false;
  }

  function clearSight(THREE, cam, head, root, actor, store, fade) {
    const ray = new THREE.Raycaster();
    const dir = new THREE.Vector3();
    fade.forEach((opacity, mesh) => remember(mesh, opacity));
    for (let n = 0; n < 6; n++) {
      dir.copy(cam.position).sub(head);
      const dist = dir.length();
      if (dist < 2.2) break;
      dir.multiplyScalar(1 / dist);
      ray.set(head, dir);
      ray.near = 0.15;
      ray.far = Math.max(0.2, dist - 0.25);
      const hits = ray.intersectObject(root, true).filter((h) => h.object.visible !== false && !skipMesh(h.object, THREE, actor));
      if (!hits.length) break;
      fade.set(hits[0].object, 0.08);
      remember(hits[0].object, 0.08);
      const keep = Math.max(2.5, hits[0].distance - 0.35);
      cam.position.copy(head).addScaledVector(dir, keep);
    }
    applyFade(fade, store);
  }

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
      const ok = orig(cam, offset, info);
      if (!ok || !castle.inCastle) {
        applyFade(new Map(), store);
        armed = false;
        return ok;
      }
      const p = PE.princess.position;
      const group = castle.castleIn.group;
      head.set(p.x, p.y + 1.45, p.z);
      const dx = cam.position.x - p.x;
      const dz = cam.position.z - p.z;
      const dist = Math.hypot(dx, dz) || 1;
      const want = Math.min(11, Math.max(8.6, dist * 1.18));
      const under = worldCeiling(THREE, group, p.x, p.z, p.y + 1.2);
      let y = head.y + 3.5;
      if (under != null) y = Math.min(y, under - 0.85);
      y = Math.max(y, head.y + 0.95);
      target.set(p.x + (dx / dist) * want, y, p.z + (dz / dist) * want);
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
      clearSight(THREE, cam, head, group, PE.princess, store, fade);
      smooth.copy(cam.position);
      cam.lookAt(head);
      return ok;
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
      if (PE.v3 && PE.v3.castle && PE.v3.castle.inCastle) {
        if (store.size) applyFade(new Map(), store);
        return;
      }
      const where = gardenHere(PE);
      if (!where) {
        if (store.size) applyFade(new Map(), store);
        return;
      }
      const p = PE.princess.position;
      head.set(p.x, p.y + 1.3, p.z);
      const dx = cam.position.x - p.x;
      const dz = cam.position.z - p.z;
      const dist = Math.hypot(dx, dz) || 1;
      if (where !== "mini") {
        const want = Math.min(12, Math.max(7.2, dist));
        cam.position.x = p.x + (dx / dist) * want;
        cam.position.z = p.z + (dz / dist) * want;
        cam.position.y = Math.max(cam.position.y, p.y + 3.8);
      }
      fade.clear();
      clearSight(THREE, cam, head, PE.scene, PE.princess, store, fade);
      orig(head.x, head.y, head.z);
    };
  }

  boot();
})();

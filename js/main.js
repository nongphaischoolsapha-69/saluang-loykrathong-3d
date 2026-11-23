(function () {
  'use strict';

  const TOTO = (window.TOTO = window.TOTO || {});
  const STATE = TOTO.STATE;
  const RECIPES = TOTO.RECIPES;
  const sfx = TOTO.sfx;

  // ============================================================
  // 1. TOUCH LOCK & VIEWPORT SIZING
  // ============================================================
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(evName => {
    window.addEventListener(evName, (e) => e.preventDefault(), { passive: false });
  });

  window.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches.length > 1) {
      e.preventDefault();
      return;
    }
    const insideModal = e.target && e.target.closest && e.target.closest('.editorial-modal, .dressing-drawer, .emote-menu');
    if (!insideModal) e.preventDefault();
  }, { passive: false });

  function getViewportSize() {
    return { w: window.innerWidth, h: window.innerHeight };
  }

  function isEffectivePortrait() {
    const vp = getViewportSize();
    return vp.h > vp.w;
  }

  // ============================================================
  // 2. THREE.JS SCENE & ACES FILMIC MOONLIT RENDERER
  // ============================================================
  const container = document.getElementById('canvas-container');
  const scene = new THREE.Scene();

  const initVp = getViewportSize();
  const camera = new THREE.PerspectiveCamera(isEffectivePortrait() ? 68 : 56, initVp.w / initVp.h, 0.1, 260);
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    preserveDrawingBuffer: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(initVp.w, initVp.h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.outputEncoding = THREE.sRGBEncoding;
  container.appendChild(renderer.domElement);

  const worldRefs = TOTO.buildWorld(scene);
  const charRefs = TOTO.createCharactersAndFestival(scene, worldRefs);

  const TABLES = worldRefs.TABLES;
  const chefToto = charRefs.toto;
  const helperBoy = charRefs.helperBoy;
  const fpHands = charRefs.fpHands;
  camera.add(fpHands);
  scene.add(camera);

  const CART_POS = new THREE.Vector3(TOTO.LOCATIONS.CART_POS.x, 0, TOTO.LOCATIONS.CART_POS.z);

  // Unique per-tab online player identity (so opening 2 tabs creates 2 separate live avatars!)
  const MY_PLAYER_ID = (() => {
    try {
      let id = sessionStorage.getItem('saluang_player_id');
      if (!id) {
        id = 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
        sessionStorage.setItem('saluang_player_id', id);
      }
      return id;
    } catch (_) {
      return 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    }
  })();

  let myProfile = TOTO.loadAvatarProfile();
  const toto = {
    root: TOTO.createCustomAvatar(Object.assign({}, myProfile, { isVip: STATE.vipUnlocked })),
    pos: null,
    yaw: 0,
    walkPhase: 0,
    stirAnim: 0,
    stepTimer: 0,
    carryAnchor: null,
    activeEmote: '',
    emoteTimer: 0,
    localChat: '',
    localChatTimer: 0
  };
  toto.pos = toto.root.position;
  toto.carryAnchor = toto.root.userData.carryAnchor;
  toto.pos.set(TOTO.LOCATIONS.PIER_SPOT.x, 0, TOTO.LOCATIONS.PIER_SPOT.z);
  scene.add(toto.root);

  let previewBaseYaw = Math.PI;
  let previewYaw = Math.PI - 0.22;
  let manualPreviewDrag = false;
  const dressingFillLight = new THREE.PointLight(0xffdfb0, 0.9, 6.5, 1.5);
  dressingFillLight.visible = false;
  scene.add(dressingFillLight);

  function getDressingCamDir(pos) {
    if (pos.x >= 50) return new THREE.Vector3(-1, 0, 0);
    if (pos.x <= -34) return new THREE.Vector3(1, 0, 0);
    if (pos.z > 2.0 && pos.z < 60.0) return new THREE.Vector3(0, 0, 1);
    return new THREE.Vector3(0, 0, -1);
  }

  function rebuildPlayerAvatar(nextProfile, skipSave) {
    myProfile = Object.assign({}, myProfile, nextProfile || {});
    if (!STATE.vipUnlocked) {
      if (myProfile.outfit === 'vip_gold') myProfile.outfit = 'sabai';
      if (myProfile.hat === 'chada') myProfile.hat = 'none';
      if (myProfile.back === 'angel_wings') myProfile.back = 'none';
    }
    if (!skipSave) TOTO.saveAvatarProfile(myProfile);

    const oldPos = toto.pos.clone();
    const oldYaw = toto.yaw;
    const oldCarried = [];
    if (toto.carryAnchor) {
      while (toto.carryAnchor.children.length) {
        oldCarried.push(toto.carryAnchor.children[0]);
        toto.carryAnchor.remove(toto.carryAnchor.children[0]);
      }
    }
    disposeAvatarRoot(toto.root);

    toto.root = TOTO.createCustomAvatar(Object.assign({}, myProfile, { isVip: STATE.vipUnlocked }));
    toto.pos = toto.root.position;
    toto.pos.copy(oldPos);
    toto.yaw = oldYaw;
    toto.root.rotation.y = oldYaw;
    toto.carryAnchor = toto.root.userData.carryAnchor;
    oldCarried.forEach(c => toto.carryAnchor.add(c));
    toto.root.visible = (STATE.camMode !== 1 || STATE.avatarModalOpen);
    scene.add(toto.root);

    const kNameEl = document.getElementById('k-input-name');
    if (kNameEl && (!kNameEl.value.trim() || kNameEl.dataset.autoSynced === '1')) {
      kNameEl.value = myProfile.name;
      kNameEl.dataset.autoSynced = '1';
    }
    if (typeof sendPresence === 'function') sendPresence(true);
  }

  // ============================================================
  // 3. CAMERA, INPUTS & LANDMARK WARP HELPERS
  // ============================================================
  const keys = {};
  const joyVec = { x: 0, y: 0 };
  let camYaw = 0.0;
  let camPitch = -0.04;
  let isDragging = false;
  let dragMoved = false;
  let lastMouseX = 0;
  let lastMouseY = 0;
  let hasMousePos = false;
  let hoverOnCanvas = false;
  let hoverX = 0;
  let hoverY = 0;
  let krathongCamFocusTimer = 0;
  let lastShareMeta = null;

  let displayProgress = 0;
  let panFlipAnim = 0;
  let wokFlameTimer = 0;

  let toastTimer = null;
  function showCamToast(msg) {
    const el = document.getElementById('cam-toast');
    if (!el) return;
    el.textContent = msg;
    el.style.opacity = '1';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.style.opacity = '0'; }, 2400);
  }

  function isModalBackdropOpen() {
    if (STATE.krathongModalOpen || STATE.avatarModalOpen || STATE.sponsorModalOpen || STATE.searchModalOpen || (ritual && ritual.active)) return true;
    return ['donate-modal', 'share-card-modal', 'wish-popover'].some(id => {
      const el = document.getElementById(id);
      return el && el.style.display === 'flex';
    });
  }

  const ritual = {
    active: false,
    stage: 'IDLE',
    meta: null,
    entry: null,
    submitted: false,
    wishProgress: 0,
    wishHolding: false,
    wishAutoPray: false,
    timingPhase: 0,
    cursorPct: 50,
    isPerfect: false,
    stageTimer: 0
  };

  const joyZone = document.getElementById('joystick-zone');
  const joyKnob = document.getElementById('joystick-knob');
  let joyPointerId = null;
  let joyCenter = { x: 0, y: 0 };

  function resetJoystick(e) {
    if (e && e.pointerId !== joyPointerId) return;
    joyPointerId = null;
    joyVec.x = 0;
    joyVec.y = 0;
    if (joyKnob) joyKnob.style.transform = 'translate(-50%, -50%)';
  }

  function clearMovementInputs() {
    Object.keys(keys).forEach(k => { keys[k] = false; });
    joyPointerId = null;
    joyVec.x = 0;
    joyVec.y = 0;
    hoverOnCanvas = false;
    hasMousePos = false;
    if (joyKnob) joyKnob.style.transform = 'translate(-50%, -50%)';
  }

  window.addEventListener('blur', clearMovementInputs);
  window.addEventListener('contextmenu', clearMovementInputs);
  document.addEventListener('mouseleave', () => { hoverOnCanvas = false; hasMousePos = false; });
  document.addEventListener('visibilitychange', () => { if (document.hidden) clearMovementInputs(); });

  function setCameraMode(mode) {
    STATE.camMode = mode;
    const label = document.getElementById('btn-cam-label');
    if (mode === 1) {
      camPitch = -0.04;
      toto.root.visible = !!STATE.avatarModalOpen;
      if (label) label.textContent = 'สายตา';
    } else {
      camPitch = 0.24;
      toto.root.visible = true;
      if (label) label.textContent = 'มุมกว้าง';
    }
    sfx.playPop();
  }

  function warpToLandmark(lm) {
    if (!lm) return;
    clearMovementInputs();
    closeCookPanel();
    toto.pos.set(lm.x, 0, lm.z);
    toto.yaw = lm.yaw;
    camYaw = lm.yaw;
    camPitch = lm.pitch !== undefined ? lm.pitch : -0.04;
    if (STATE.camMode !== 1) camPitch = 0.24;
    krathongCamFocusTimer = 0;
    document.getElementById('landmark-menu').style.display = 'none';
    showCamToast(lm.name);
    sfx.playPop();
  }

  function buildLandmarkMenu() {
    const menu = document.getElementById('landmark-menu');
    menu.innerHTML = '';
    (TOTO.LANDMARKS || []).forEach(lm => {
      const btn = document.createElement('button');
      btn.className = 'landmark-item';
      btn.textContent = lm.name;
      btn.onclick = () => warpToLandmark(lm);
      menu.appendChild(btn);
    });
  }
  buildLandmarkMenu();

  function cycleTimeOfDay(explicitMode) {
    const next = explicitMode || (STATE.timeMode === 'NIGHT' ? 'DAY' : 'NIGHT');
    worldRefs.setTimeOfDay(next);
    const lbl = document.getElementById('btn-time-label');
    if (lbl) lbl.textContent = next === 'DAY' ? 'กลางวัน' : 'กลางคืน';
    showCamToast(next === 'DAY' ? 'บรรยากาศสระหลวง กลางวัน' : 'บรรยากาศคืนวันเพ็ญ กลางคืน');
    sfx.playPop();
  }

  function isNearCart() {
    return Math.hypot(toto.pos.x - TOTO.LOCATIONS.CART_POS.x, toto.pos.z - TOTO.LOCATIONS.CART_POS.z) < 6.5;
  }

  function resolvePlayerCollision(pos) {
    // Full real-scale 360-degree walkable perimeter around 90m x 56m Sa Luang Pond
    pos.x = THREE.MathUtils.clamp(pos.x, -46.0, 66.5);
    pos.z = THREE.MathUtils.clamp(pos.z, -5.5, 71.0);

    // Block walking into pond water basin (X: -36.5..+52.5, Z: 8.0..63.8) while allowing South pier steps (X=6)
    const onPier = Math.abs(pos.x - TOTO.LOCATIONS.PIER_SPOT.x) < 1.8 && pos.z < 8.6;
    const pMinX = -36.5, pMaxX = 52.5, pMinZ = 8.0, pMaxZ = 63.8;
    if (!onPier && pos.x > pMinX && pos.x < pMaxX && pos.z > pMinZ && pos.z < pMaxZ) {
      const dL = pos.x - pMinX, dR = pMaxX - pos.x, dB = pos.z - pMinZ, dF = pMaxZ - pos.z;
      const m = Math.min(dL, dR, dB, dF);
      if (m === dL) pos.x = pMinX;
      else if (m === dR) pos.x = pMaxX;
      else if (m === dB) pos.z = pMinZ;
      else pos.z = pMaxZ;
    }

    // Toto's Cart collision at (-16.0, 0, -3.8)
    const cMinX = -17.35, cMaxX = -13.75, cMinZ = -4.5, cMaxZ = -3.07;
    if (pos.x > cMinX && pos.x < cMaxX && pos.z > cMinZ && pos.z < cMaxZ) {
      const dL = pos.x - cMinX, dR = cMaxX - pos.x, dB = pos.z - cMinZ, dF = cMaxZ - pos.z;
      const m = Math.min(dL, dR, dB, dF);
      if (m === dL) pos.x = cMinX;
      else if (m === dR) pos.x = cMaxX;
      else if (m === dB) pos.z = cMinZ;
      else pos.z = cMaxZ;
    }

    for (const tbl of TABLES) {
      const dx = pos.x - tbl.pos.x;
      const dz = pos.z - tbl.pos.z;
      const dist = Math.hypot(dx, dz);
      const minR = 0.68;
      if (dist < minR && dist > 0.001) {
        pos.x = tbl.pos.x + (dx / dist) * minR;
        pos.z = tbl.pos.z + (dz / dist) * minR;
      }
    }
  }

  // ============================================================
  // 4. OPTIONAL TOTO STALL COOKING MINI-GAME (CONTEXTUAL AT CART)
  // ============================================================
  const particles = [];
  function spawnPanParticle(isSpark) {
    if (particles.length > 22) return;
    const mat = new THREE.SpriteMaterial({
      map: isSpark ? TOTO.textures.fireGlowTex : TOTO.textures.smokeTex,
      transparent: true,
      opacity: isSpark ? 0.9 : 0.36,
      blending: isSpark ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false
    });
    const sp = new THREE.Sprite(mat);
    const wp = new THREE.Vector3();
    worldRefs.griddleGroup.getWorldPosition(wp);
    sp.position.set(wp.x + (Math.random() - 0.5) * 0.4, wp.y + 0.14, wp.z + (Math.random() - 0.5) * 0.4);
    const sc = isSpark ? 0.18 : 0.32;
    sp.scale.set(sc, sc, 1);
    scene.add(sp);
    particles.push({
      mesh: sp,
      vx: (Math.random() - 0.5) * (isSpark ? 1.5 : 0.22),
      vy: isSpark ? (1.35 + Math.random() * 1.2) : (0.7 + Math.random() * 0.4),
      vz: (Math.random() - 0.5) * (isSpark ? 1.5 : 0.22),
      life: 0,
      maxLife: isSpark ? 0.44 : 1.15,
      isSpark
    });
  }

  function buildRecipeButtons() {
    const grid = document.getElementById('recipe-grid');
    grid.innerHTML = '';
    const neededMap = {};
    TABLES.forEach(t => {
      if (t.status === 'WAITING' && t.order) {
        if (!neededMap[t.order.id]) neededMap[t.order.id] = [];
        neededMap[t.order.id].push(t.id);
      }
    });
    RECIPES.forEach(r => {
      const btn = document.createElement('button');
      const waitingTables = neededMap[r.id];
      btn.className = 'recipe-btn' + (waitingTables ? ' needed' : '');
      btn.innerHTML = `<div class="r-name">${r.name}</div><div class="r-price">฿${r.price}${waitingTables ? ` (โต๊ะ ${waitingTables.join(',')})` : ''}</div>`;
      btn.onclick = () => startCookingRecipe(r);
      grid.appendChild(btn);
    });
  }

  function openCookPanel() {
    clearMovementInputs();
    STATE.cookPanelOpen = true;
    document.getElementById('cook-panel').style.display = 'block';
    document.getElementById('order-strip').style.display = 'flex';
    fpHands.visible = STATE.camMode === 1;
    updateOrderStrip();
    updateCookPanelView();
  }

  function closeCookPanel() {
    STATE.cookPanelOpen = false;
    document.getElementById('cook-panel').style.display = 'none';
    document.getElementById('order-strip').style.display = 'none';
    if (!STATE.carrying) {
      document.getElementById('carry-badge').style.display = 'none';
      fpHands.visible = false;
    }
  }

  function updateCookPanelView() {
    const selectBox = document.getElementById('recipe-select-box');
    const fryBox = document.getElementById('frying-bar-box');
    if (STATE.pan.active) {
      selectBox.style.display = 'none';
      fryBox.style.display = 'block';
      const zone = document.getElementById('fry-perfect-zone');
      zone.style.left = (60 / 120 * 100) + '%';
      zone.style.width = (30 / 120 * 100) + '%';
      document.getElementById('fry-title').textContent = `${STATE.pan.recipe.name} (พลิก ${STATE.pan.flips} ครั้ง)`;
    } else {
      selectBox.style.display = 'block';
      fryBox.style.display = 'none';
      buildRecipeButtons();
    }
  }

  function configurePanFoodVisual(recipeId) {
    worldRefs.panFoodGroup.visible = true;
    worldRefs.panFoodGroup.scale.set(0.45, 0.45, 0.45);
    worldRefs.panFoodGroup.position.set(0, 0.085, 0);
    worldRefs.panFoodGroup.rotation.set(0, 0, 0);
    worldRefs.panEggGroup.visible = false;
    worldRefs.panToppingsGroup.visible = false;
    worldRefs.panToppings.forEach((p, i) => {
      if (recipeId === 'hoitod' || recipeId === 'hoitodtalay') p.material.color.setHex(i % 3 === 0 ? 0xf5f5dc : 0x5c3a21);
      else if (recipeId === 'orsuan') p.material.color.setHex(i % 2 === 0 ? 0xeae5d5 : 0x22c55e);
      else p.material.color.setHex(i % 3 === 0 ? 0xf97316 : (i % 3 === 1 ? 0x22c55e : 0xfde047));
    });
  }

  function startCookingRecipe(recipe) {
    if (STATE.pan.active) return;
    STATE.pan.active = true;
    STATE.pan.recipe = recipe;
    STATE.pan.progress = 5;
    displayProgress = 5;
    STATE.pan.flips = 0;
    STATE.pan.burnt = false;
    panFlipAnim = 0;
    configurePanFoodVisual(recipe.id);
    sfx.playSpatula();
    for (let i = 0; i < 6; i++) spawnPanParticle(i < 2);
    updateCookPanelView();
  }

  function stirPan() {
    if (!STATE.pan.active || STATE.pan.burnt) return;
    STATE.pan.flips++;
    STATE.pan.progress = Math.min(118, STATE.pan.progress + 12.0);
    toto.stirAnim = 0.45;
    chefToto.stirAnim = 0.45;
    panFlipAnim = 0.01;
    wokFlameTimer = 0.36;
    worldRefs.wokFlameRing.visible = true;
    sfx.playSpatula();
    for (let i = 0; i < 6; i++) spawnPanParticle(i < 3);
    updateCookPanelView();
  }

  function clearPanInternal() {
    STATE.pan.active = false;
    STATE.pan.recipe = null;
    STATE.pan.progress = 0;
    displayProgress = 0;
    STATE.pan.flips = 0;
    STATE.pan.burnt = false;
    panFlipAnim = 0;
    wokFlameTimer = 0;
    worldRefs.wokFlameRing.visible = false;
    worldRefs.panFoodGroup.visible = false;
  }

  function plateFromPan() {
    if (!STATE.pan.active) return;
    const prog = STATE.pan.progress;
    if (prog < 45) {
      showCamToast('ยังไม่สุกดี ลองผัดอีกนิดครับ');
      return;
    }
    const isBurnt = STATE.pan.burnt || prog >= 104;
    const isPerf = !isBurnt && prog >= 60 && prog <= 90;
    const dish = {
      recipe: STATE.pan.recipe,
      quality: isBurnt ? 'BURNT' : (isPerf ? 'PERFECT' : 'GOOD'),
      qualityLabel: isBurnt ? 'เกรียมไปนิด' : (isPerf ? 'กรอบนอกนุ่มใน' : 'หอมอร่อย'),
      bonusMult: isBurnt ? 0.5 : (isPerf ? 1.4 : 1.15)
    };
    clearPanInternal();
    sfx.playPop();

    const matchTbl = TABLES.find(t => t.status === 'WAITING' && t.order && t.order.id === dish.recipe.id);
    if (matchTbl && helperBoy.state === 'IDLE') {
      helperBoy.state = 'TO_TABLE';
      helperBoy.targetTable = matchTbl;
      helperBoy.carryingDish = dish;
      while (helperBoy.carryAnchor.children.length) helperBoy.carryAnchor.remove(helperBoy.carryAnchor.children[0]);
      const mesh = TOTO.createDishMesh(dish.recipe.id, dish.quality === 'BURNT', false);
      mesh.scale.set(1.15, 1.15, 1.15);
      helperBoy.carryAnchor.add(mesh);
      showCamToast(`น้องเสื้อเขียวกำลังนำ ${dish.recipe.short} ไปเสิร์ฟโต๊ะ ${matchTbl.id}`);
      updateCookPanelView();
      return;
    }

    STATE.carrying = dish;
    updateCarriedVisuals();
    closeCookPanel();
    showCamToast(`ตัก ${dish.recipe.short} ใส่จานพร้อมเสิร์ฟแล้ว`);
  }

  function updateCarriedVisuals() {
    while (toto.carryAnchor.children.length) toto.carryAnchor.remove(toto.carryAnchor.children[0]);
    while (charRefs.fpPlateAnchor.children.length) charRefs.fpPlateAnchor.remove(charRefs.fpPlateAnchor.children[0]);
    const badge = document.getElementById('carry-badge');
    if (STATE.carrying) {
      const isBurnt = STATE.carrying.quality === 'BURNT';
      const d1 = TOTO.createDishMesh(STATE.carrying.recipe.id, isBurnt, false);
      toto.carryAnchor.add(d1);
      const d2 = TOTO.createDishMesh(STATE.carrying.recipe.id, isBurnt, false);
      charRefs.fpPlateAnchor.add(d2);
      badge.style.display = 'block';
      document.getElementById('cb-dish-name').textContent = STATE.carrying.recipe.name;
      document.getElementById('cb-dish-qual').textContent = STATE.carrying.qualityLabel;
    } else {
      badge.style.display = 'none';
    }
  }

  function updateOrderStrip() {
    const strip = document.getElementById('order-strip');
    if (!STATE.cookPanelOpen) {
      strip.style.display = 'none';
      return;
    }
    strip.innerHTML = '';
    TABLES.forEach(t => {
      if (t.status === 'WAITING' && t.order) {
        const card = document.createElement('div');
        card.className = 'order-card';
        card.innerHTML = `<span>โต๊ะ ${t.id} • ${t.order.short}</span>`;
        card.onclick = () => {
          if (!STATE.pan.active) startCookingRecipe(t.order);
        };
        strip.appendChild(card);
      }
    });
  }

  function updateHelperBoy(dt) {
    const hb = helperBoy;
    if (hb.state === 'IDLE') {
      const dirtyTbl = TABLES.find(t => t.status === 'DIRTY');
      if (dirtyTbl) {
        hb.state = 'TO_CLEAN';
        hb.targetTable = dirtyTbl;
      }
      return;
    }
    const dest = hb.state === 'RETURNING' ? hb.homePos : hb.targetTable.serveSpot;
    const dx = dest.x - hb.pos.x;
    const dz = dest.z - hb.pos.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.25) {
      if (hb.state === 'TO_TABLE' && hb.targetTable && hb.carryingDish) {
        while (hb.targetTable.dishAnchor.children.length) hb.targetTable.dishAnchor.remove(hb.targetTable.dishAnchor.children[0]);
        const servedMesh = TOTO.createDishMesh(hb.carryingDish.recipe.id, hb.carryingDish.quality === 'BURNT', false);
        hb.targetTable.dishAnchor.add(servedMesh);
        hb.targetTable.status = 'EATING';
        hb.targetTable.eatTimer = 8.0;
        while (hb.carryAnchor.children.length) hb.carryAnchor.remove(hb.carryAnchor.children[0]);
        hb.carryingDish = null;
        hb.state = 'RETURNING';
        sfx.playCash();
        showCamToast('เสิร์ฟสำเร็จ! หอยทอดโตโต้กรอบหอมน่าทานมาก 🦪');
      } else if (hb.state === 'TO_CLEAN' && hb.targetTable) {
        while (hb.targetTable.dishAnchor.children.length) hb.targetTable.dishAnchor.remove(hb.targetTable.dishAnchor.children[0]);
        hb.targetTable.status = 'EMPTY';
        hb.state = 'RETURNING';
      } else {
        hb.pos.copy(hb.homePos);
        hb.root.rotation.y = 0.2;
        hb.state = 'IDLE';
        hb.targetTable = null;
      }
    } else {
      hb.pos.x += (dx / dist) * 4.5 * dt;
      hb.pos.z += (dz / dist) * 4.5 * dt;
      hb.root.rotation.y = Math.atan2(dx, dz);
      hb.walkPhase += dt * 12;
      hb.leftLeg.rotation.x = Math.sin(hb.walkPhase) * 0.6;
      hb.rightLeg.rotation.x = -Math.sin(hb.walkPhase) * 0.6;
    }
  }

  let spawnCooldown = 1.5;
  const leavingCustomers = [];
  function trySpawnCustomer() {
    const emptyTables = TABLES.filter(t => t.status === 'EMPTY');
    if (emptyTables.length === 0) return;
    const tbl = emptyTables[Math.floor(Math.random() * emptyTables.length)];
    const cust = charRefs.createCustomerMesh(true);
    cust.root.position.set(TOTO.LOCATIONS.CART_POS.x + 12, 0, -2.55);
    cust.targetPos.set(tbl.pos.x, 0, -2.75);
    cust.stage = 0;
    tbl.customer = cust;
    tbl.status = 'WALKING_IN';
    tbl.order = RECIPES[Math.floor(Math.random() * RECIPES.length)];
  }

  function updateCustomers(dt, elapsed) {
    spawnCooldown -= dt;
    const activeCount = TABLES.filter(t => t.status !== 'EMPTY').length;
    if (spawnCooldown <= 0 && activeCount < 3) {
      trySpawnCustomer();
      spawnCooldown = 7.0;
    }
    TABLES.forEach(tbl => {
      const c = tbl.customer;
      if (tbl.status === 'WALKING_IN' && c) {
        const dest = c.stage === 0 ? c.targetPos : tbl.seatPos;
        const dx = dest.x - c.root.position.x;
        const dz = dest.z - c.root.position.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 0.14) {
          if (c.stage === 0) c.stage = 1;
          else {
            c.root.position.copy(tbl.seatPos);
            c.root.rotation.y = 0.05;
            c.bodyGroup.position.y = -0.38;
            c.leftLeg.rotation.x = -1.42;
            c.rightLeg.rotation.x = -1.42;
            tbl.status = 'WAITING';
            updateOrderStrip();
            if (STATE.cookPanelOpen) updateCookPanelView();
          }
        } else {
          c.root.position.x += (dx / dist) * 3.0 * dt;
          c.root.position.z += (dz / dist) * 3.0 * dt;
          c.root.rotation.y = Math.atan2(dx, dz);
          c.walkPhase += dt * 9;
          c.leftLeg.rotation.x = Math.sin(c.walkPhase) * 0.55;
          c.rightLeg.rotation.x = -Math.sin(c.walkPhase) * 0.55;
        }
      } else if (tbl.status === 'EATING' && c) {
        tbl.eatTimer -= dt;
        c.rightArm.rotation.x = -1.15 + Math.sin(elapsed * 7 + tbl.id) * 0.32;
        if (tbl.eatTimer <= 0) {
          c.bodyGroup.position.y = 0;
          c.root.position.set(tbl.pos.x, 0, -2.75);
          c.targetPos.set(TOTO.LOCATIONS.CART_POS.x + 14, 0, -2.55);
          leavingCustomers.push(c);
          tbl.customer = null;
          tbl.status = 'DIRTY';
        }
      }
    });
    for (let i = leavingCustomers.length - 1; i >= 0; i--) {
      const lc = leavingCustomers[i];
      const dx = lc.targetPos.x - lc.root.position.x;
      const dz = lc.targetPos.z - lc.root.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 0.35) {
        scene.remove(lc.root);
        leavingCustomers.splice(i, 1);
      } else {
        lc.root.position.x += (dx / dist) * 2.8 * dt;
        lc.root.position.z += (dz / dist) * 2.8 * dt;
        lc.root.rotation.y = Math.atan2(dx, dz);
        lc.walkPhase += dt * 9;
        lc.leftLeg.rotation.x = Math.sin(lc.walkPhase) * 0.55;
        lc.rightLeg.rotation.x = -Math.sin(lc.walkPhase) * 0.55;
      }
    }
  }

  // ============================================================
  // 5. COMMUNITY KRATHONG WORKSHOP, WISH BLESSINGS, DONATE VIP & KEEPSAKE PNG
  // ============================================================
  let activeWishItem = null;

  TOTO.onSelectKrathongWish = (item) => {
    clearMovementInputs();
    activeWishItem = item;
    document.getElementById('wp-badge').textContent = item.isVip ? 'กระทงทองคำ VIP • สระหลวง' : 'คำอธิษฐานริมสระหลวง';
    document.getElementById('wp-name').textContent = item.name || 'ชาวหนองไผ่';
    document.getElementById('wp-wish').textContent = `"${item.wish || 'ขอให้มีความสุขตลอดปี'}"`;
    document.getElementById('wp-bless-count').textContent = Number(item.blessings) || 0;
    document.getElementById('wish-popover').style.display = 'flex';
    sfx.playPop();
  };

  function closeWishPopover() {
    document.getElementById('wish-popover').style.display = 'none';
    activeWishItem = null;
  }

  async function blessActiveKrathong() {
    if (!activeWishItem || !activeWishItem.id) return;
    const id = activeWishItem.id;
    activeWishItem.blessings = (Number(activeWishItem.blessings) || 0) + 1;
    document.getElementById('wp-bless-count').textContent = activeWishItem.blessings;
    charRefs.updateKrathongBlessingUI(id, activeWishItem.blessings);
    sfx.playPop();

    try {
      const res = await fetch('/api/krathongs/bless', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        const d = await res.json();
        if (typeof d.blessings === 'number') {
          activeWishItem.blessings = d.blessings;
          document.getElementById('wp-bless-count').textContent = d.blessings;
          charRefs.updateKrathongBlessingUI(id, d.blessings);
        }
      }
    } catch (_) {}
  }

  let lastFetchedTotal = -1;
  async function fetchKrathongsFromServer() {
    let list = [];
    let total = 0;
    try {
      const res = await fetch('/api/krathongs', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.krathongs)) {
          list = data.krathongs;
          total = data.total || list.length;
        }
      }
    } catch (_) {}
    try {
      const localArr = JSON.parse(localStorage.getItem('toto_local_krathongs') || '[]');
      if (Array.isArray(localArr)) {
        const seen = new Set(list.map(x => x.id));
        localArr.forEach(item => {
          if (item && item.id && !seen.has(item.id)) list.push(item);
        });
      }
    } catch (_) {}

    if (list.length > 0 && typeof charRefs.syncRemoteKrathongs === 'function') {
      charRefs.syncRemoteKrathongs(list);
      const countShown = Math.max(total, charRefs.pondKrathongs.length);
      if (lastFetchedTotal !== countShown) {
        lastFetchedTotal = countShown;
        const p1 = document.getElementById('ui-pond-count');
        const p2 = document.getElementById('k-stat-pond-total');
        if (p1) p1.textContent = countShown;
        if (p2) p2.textContent = countShown;
      }
    }
  }

  function renderDonateQR() {
    const wrap = document.getElementById('donate-qr-wrap');
    if (!wrap) return;
    const mono = TOTO.MONETIZATION || {};
    const amtSec = document.getElementById('donate-amt-section');
    const copyBtn = document.getElementById('btn-copy-pp');
    document.getElementById('donate-pp-name').textContent = mono.promptPayName || 'ร้านหอยทอด โตโต้';

    document.querySelectorAll('.donate-amt-btn').forEach(b => {
      b.classList.toggle('active', Number(b.dataset.amt) === STATE.donateAmount);
    });

    if (mono.customQrImageUrl) {
      if (amtSec) amtSec.style.display = 'none';
      document.getElementById('donate-pp-id').textContent = mono.promptPayMasked || 'สแกน QR ได้จากทุกธนาคาร';
      if (copyBtn) copyBtn.textContent = 'บันทึกรูป QR';
      wrap.innerHTML = `<img src="${mono.customQrImageUrl}" alt="Thai QR Payment" />`;
      return;
    }

    if (amtSec) amtSec.style.display = 'block';
    if (copyBtn) copyBtn.textContent = 'คัดลอกเลข';
    document.getElementById('donate-pp-id').textContent = mono.promptPayId || '';

    const cleanId = String(mono.promptPayId || '').replace(/[^0-9]/g, '');
    if (cleanId.length >= 10 && !String(mono.promptPayId).includes('X')) {
      const qrSrc = `https://promptpay.io/${cleanId}/${STATE.donateAmount}.png`;
      wrap.innerHTML = `<img src="${qrSrc}" alt="PromptPay QR ${STATE.donateAmount}" onerror="this.outerHTML='<div class=\\'qr-placeholder\\'>โอนเข้าเลข PromptPay ด้านล่าง<br/>จำนวน ${STATE.donateAmount} บาท</div>'" />`;
    } else {
      wrap.innerHTML = `<div class="qr-placeholder">สแกน QR ด้านบนเพื่อร่วมสนับสนุน<br/><b>ยอดแนะนำ: ${STATE.donateAmount} บาท</b></div>`;
    }
  }

  function openDonateModal() {
    clearMovementInputs();
    closeCookPanel();
    renderDonateQR();
    document.getElementById('donate-modal').style.display = 'flex';
    sfx.playPop();
  }

  function closeDonateModal() {
    document.getElementById('donate-modal').style.display = 'none';
  }

  function renderWorkshopChoices() {
    const bGrid = document.getElementById('krathong-base-grid');
    bGrid.innerHTML = '';
    TOTO.KRATHONG_BASES.forEach(kb => {
      const locked = !!kb.vipOnly && !STATE.vipUnlocked;
      const btn = document.createElement('button');
      btn.className = 'k-choice' + (STATE.selectedBase === kb.id ? ' selected' : '');
      const vipTag = kb.vipOnly
        ? `<div class="kc-vip-tag">${STATE.vipUnlocked ? 'ปลดล็อก VIP แล้ว' : 'ร่วมสนับสนุนเพื่อปลดล็อก'}</div>`
        : '';
      btn.innerHTML = `<div class="kc-name">${kb.name}</div><div class="kc-desc">${kb.desc}</div>${vipTag}`;
      btn.onclick = () => {
        if (locked) {
          openDonateModal();
          return;
        }
        STATE.selectedBase = kb.id;
        renderWorkshopChoices();
        sfx.playPop();
      };
      bGrid.appendChild(btn);
    });

    const fGrid = document.getElementById('krathong-flower-grid');
    fGrid.innerHTML = '';
    TOTO.KRATHONG_FLOWERS.forEach(kf => {
      const btn = document.createElement('button');
      btn.className = 'k-choice' + (STATE.selectedFlower === kf.id ? ' selected' : '');
      btn.innerHTML = `<div class="kc-name">${kf.name}</div><div class="kc-desc">${kf.desc}</div>`;
      btn.onclick = () => {
        STATE.selectedFlower = kf.id;
        renderWorkshopChoices();
        sfx.playPop();
      };
      fGrid.appendChild(btn);
    });

    document.getElementById('k-stat-pond-total').textContent = Math.max(charRefs.pondKrathongs.length, lastFetchedTotal, 0);
  }

  function openKrathongModal() {
    clearMovementInputs();
    closeCookPanel();
    STATE.krathongModalOpen = true;
    renderWorkshopChoices();
    document.getElementById('krathong-modal').style.display = 'flex';
    sfx.playPop();
  }

  function closeKrathongModal() {
    STATE.krathongModalOpen = false;
    document.getElementById('krathong-modal').style.display = 'none';
  }

  function openShareCardModal(meta) {
    clearMovementInputs();
    trackAnalytics('share_card_open', 'share_card');
    const mono = TOTO.MONETIZATION || {};
    const m = meta || {
      name: 'ผู้ร่วมงานลอยกระทง สระหลวง',
      wish: 'ขอให้มีความสุข สุขภาพแข็งแรง ตลอดปี',
      baseName: 'กระทงใบตองพับกลีบ',
      flowerName: 'ดอกบัวชมพู',
      isVip: STATE.vipUnlocked
    };
    lastShareMeta = m;

    document.getElementById('sc-krathong-badge').textContent = `${m.baseName || 'กระทงใบตอง'} • ${m.flowerName || 'ดอกบัวชมพู'}${m.isVip ? ' (VIP ทองคำ)' : ''}${m.perfectMoon ? ' • ✨ ลอยตรงแสงจันทร์' : ''}`;
    document.getElementById('sc-name').textContent = m.name;
    document.getElementById('sc-wish').textContent = `"${m.wish}"`;
    document.getElementById('sc-shop-title').textContent = mono.shopCardTitle || 'ร้านหอยทอด โตโต้ • สระหลวง หนองไผ่';
    document.getElementById('sc-shop-sub').textContent = mono.shopCardSubtitle || 'แวะชิมหอยทอดกรอบ ออส่วน ผัดไทยร้อนๆ ได้ที่หน้าร้านจริง';
    document.getElementById('sc-shop-address').textContent = mono.shopAddress || 'ซอยสระหลวงใต้ (ซอยเทศบาล 34) อ.หนองไผ่';
    document.getElementById('share-card-modal').style.display = 'flex';
  }

  function closeShareCardModal() {
    document.getElementById('share-card-modal').style.display = 'none';
  }

  function downloadKeepsakeCardPNG() {
    const mono = TOTO.MONETIZATION || {};
    const m = lastShareMeta || {
      name: 'ชาวหนองไผ่',
      wish: 'ขอพรคืนวันเพ็ญ ณ สระหลวง หนองไผ่',
      baseName: 'กระทงใบตอง',
      flowerName: 'ดอกบัวชมพู'
    };

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext('2d');

    // Deep Midnight Indigo Background
    const grad = ctx.createLinearGradient(0, 0, 0, 1350);
    grad.addColorStop(0, '#091224');
    grad.addColorStop(1, '#111b33');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1350);

    // Subtle double gold border frame
    ctx.strokeStyle = '#d4af6a';
    ctx.lineWidth = 3;
    ctx.strokeRect(36, 36, 1008, 1278);
    ctx.strokeStyle = 'rgba(212,175,106,0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(48, 48, 984, 1254);

    // Live 3D pond snapshot at top
    renderer.render(scene, camera);
    const glCanvas = renderer.domElement;
    const imgW = 940, imgH = 540;
    const srcAspect = glCanvas.width / glCanvas.height;
    const dstAspect = imgW / imgH;
    let sx = 0, sy = 0, sw = glCanvas.width, sh = glCanvas.height;
    if (srcAspect > dstAspect) {
      sw = glCanvas.height * dstAspect;
      sx = (glCanvas.width - sw) / 2;
    } else {
      sh = glCanvas.width / dstAspect;
      sy = (glCanvas.height - sh) / 2;
    }
    ctx.drawImage(glCanvas, sx, sy, sw, sh, 70, 80, imgW, imgH);
    ctx.strokeStyle = '#d4af6a';
    ctx.lineWidth = 2;
    ctx.strokeRect(70, 80, imgW, imgH);

    ctx.textAlign = 'center';
    if (m.perfectMoon) {
      ctx.fillStyle = '#fde047';
      ctx.font = '700 22px Prompt, sans-serif';
      ctx.fillText('✨ ลอยตรงแสงจันทร์ (PERFECT MOONLIGHT) ✨', 540, 646);
    }
    ctx.fillStyle = '#d4af6a';
    ctx.font = '600 24px Prompt, sans-serif';
    ctx.fillText('คืนเพ็ญเดือนสิบสอง • สวนสาธารณะสระหลวง อ.หนองไผ่', 540, 682);

    ctx.fillStyle = '#f6f0e4';
    ctx.font = '700 44px "Noto Serif Thai", Prompt, serif';
    ctx.fillText(m.name, 540, 756);

    ctx.fillStyle = '#e8c785';
    ctx.font = '400 26px Prompt, sans-serif';
    ctx.fillText(`${m.baseName} • ${m.flowerName}`, 540, 806);

    // Word-wrap wish text cleanly
    ctx.fillStyle = '#f6f0e4';
    ctx.font = '500 32px Prompt, sans-serif';
    const wishWords = (`"${m.wish}"`).split('');
    let line = '', lines = [];
    for (let i = 0; i < wishWords.length; i++) {
      line += wishWords[i];
      if (ctx.measureText(line).width > 820) {
        lines.push(line);
        line = '';
      }
    }
    if (line) lines.push(line);
    lines.slice(0, 3).forEach((ln, idx) => {
      ctx.fillText(ln, 540, 880 + idx * 44);
    });

    // Clean shop location footer (no discount/coupon)
    ctx.strokeStyle = 'rgba(212, 175, 106, 0.45)';
    ctx.lineWidth = 2;
    ctx.strokeRect(100, 1065, 880, 180);

    ctx.fillStyle = '#f6f0e4';
    ctx.font = '600 28px Prompt, sans-serif';
    ctx.fillText(mono.shopCardTitle || 'ร้านหอยทอด โตโต้ • สระหลวง หนองไผ่', 540, 1122);

    ctx.fillStyle = '#e8c785';
    ctx.font = '500 24px Prompt, sans-serif';
    ctx.fillText(mono.shopCardSubtitle || 'แวะชิมหอยทอดกรอบ ออส่วน ผัดไทยร้อนๆ ได้ที่หน้าร้านจริง', 540, 1168);

    ctx.fillStyle = '#c8c0b4';
    ctx.font = '400 21px Prompt, sans-serif';
    ctx.fillText(mono.shopAddress || 'ซอยสระหลวงใต้ อ.หนองไผ่ จ.เพชรบูรณ์', 540, 1212);

    const link = document.createElement('a');
    link.download = `loy-krathong-saluang-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showCamToast('บันทึกรูปการ์ดคำอธิษฐานเรียบร้อยแล้ว');
  }

  function setRitualStageUI(stage) {
    ritual.stage = stage;
    const steps = ['LIGHT', 'WISH', 'PUSH'];
    const curIdx = steps.indexOf(stage);
    document.querySelectorAll('#ritual-step-dots .rs-dot').forEach((el, idx) => {
      el.classList.remove('active', 'done');
      if (stage === 'TRACK' || idx < curIdx) el.classList.add('done');
      else if (idx === curIdx) el.classList.add('active');
    });

    document.getElementById('ritual-step-light').style.display = stage === 'LIGHT' ? 'flex' : 'none';
    document.getElementById('ritual-step-wish').style.display = stage === 'WISH' ? 'flex' : 'none';
    document.getElementById('ritual-step-push').style.display = stage === 'PUSH' ? 'flex' : 'none';
    const resEl = document.getElementById('ritual-result-banner');
    resEl.style.display = stage === 'TRACK' ? 'inline-block' : 'none';

    const titleEl = document.getElementById('ritual-title');
    const descEl = document.getElementById('ritual-desc');
    if (stage === 'LIGHT') {
      titleEl.textContent = 'ขั้นตอนที่ 1 • จุดไฟมงคล';
      descEl.textContent = 'แตะเพื่อจุดเทียนและธูป 3 ดอกบนกระทงของคุณ';
    } else if (stage === 'WISH') {
      titleEl.textContent = 'ขั้นตอนที่ 2 • ตั้งจิตอธิษฐาน';
      descEl.textContent = 'แตะหรือกดค้างเพื่อพนมมือขอพรท่ามกลางแสงจันทร์';
    } else if (stage === 'PUSH') {
      titleEl.textContent = 'ขั้นตอนที่ 3 • กวักน้ำส่งกระทง';
      descEl.textContent = 'กดให้ตรงแถบแสงจันทร์สีทองตรงกลางเพื่อรับพลุโบนัส!';
    } else if (stage === 'TRACK') {
      titleEl.textContent = 'กระทงกำลังลอยสู่กลางสระหลวง';
      descEl.textContent = 'ร่วมอธิษฐานส่งความสุขในคืนวันเพ็ญเดือนสิบสอง...';
    }
  }

  function submitRitualKrathong() {
    if (ritual.submitted || !ritual.meta) return;
    ritual.submitted = true;
    const meta = ritual.meta;
    try {
      const localArr = JSON.parse(localStorage.getItem('toto_local_krathongs') || '[]');
      localArr.push(meta);
      localStorage.setItem('toto_local_krathongs', JSON.stringify(localArr.slice(-45)));
    } catch (_) {}

    fetch('/api/krathongs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(meta)
    }).then(() => fetchKrathongsFromServer()).catch(() => {});

    STATE.krathongLaunched++;
    const p1 = document.getElementById('ui-pond-count');
    if (p1) p1.textContent = Math.max(charRefs.pondKrathongs.length, lastFetchedTotal, 1);
  }

  function startKrathongRitual(baseObj, flowerObj, meta) {
    closeKrathongModal();
    closeCookPanel();
    clearMovementInputs();

    ritual.active = true;
    ritual.meta = meta;
    ritual.submitted = false;
    ritual.wishProgress = 0;
    ritual.wishHolding = false;
    ritual.wishAutoPray = false;
    ritual.timingPhase = 0;
    ritual.cursorPct = 50;
    ritual.isPerfect = false;
    ritual.stageTimer = 0;

    toto.pos.set(TOTO.LOCATIONS.PIER_SPOT.x, 0.04, 8.05);
    toto.yaw = 0;
    toto.root.rotation.y = 0;
    toto.root.visible = true;
    toto.activeEmote = '';
    toto.emoteTimer = 0;

    ritual.entry = charRefs.spawnRitualKrathong(baseObj.id, flowerObj.id, meta);

    const sub = document.getElementById('ritual-wish-subtitle');
    sub.classList.remove('show');
    sub.innerHTML = `<div style="font-size:13px;color:#f5d896;letter-spacing:0.6px;margin-bottom:4px;">— คำอธิษฐานของ ${escapeHtml(meta.name)} —</div>"${escapeHtml(meta.wish)}"`;
    document.getElementById('ritual-wish-fill').style.width = '0%';

    document.body.classList.add('ritual-active');
    document.getElementById('ritual-overlay').style.display = 'flex';
    setRitualStageUI('LIGHT');
  }

  function completeRitualWish() {
    if (!ritual.active || ritual.stage !== 'WISH') return;
    sfx.playWishChime();
    document.getElementById('ritual-wish-subtitle').classList.add('show');
    setRitualStageUI('PUSH');
  }

  function triggerRitualPush() {
    if (!ritual.active || ritual.stage !== 'PUSH') return;
    const isPerfect = (ritual.cursorPct >= 33 && ritual.cursorPct <= 67);
    ritual.isPerfect = isPerfect;
    if (ritual.meta) ritual.meta.perfectMoon = isPerfect;

    submitRitualKrathong();
    sfx.playWaterPush(isPerfect);
    charRefs.releaseRitualKrathong(ritual.entry, isPerfect, null);

    if (ritual.meta && ritual.meta.isVip) {
      charRefs.launchVipFireworkSalute();
    } else if (isPerfect) {
      charRefs.launchFirework(8, 28);
      postEmote('firework', { x: 8, z: 28, isVip: false });
      charRefs.spawnSkyLantern(5, 28);
      charRefs.spawnSkyLantern(12, 31);
    } else {
      charRefs.spawnSkyLantern(8, 28);
    }

    toto.activeEmote = 'wave';
    toto.emoteTimer = 2.0;

    const resEl = document.getElementById('ritual-result-banner');
    resEl.textContent = isPerfect ? '✨ ลอยตรงแสงจันทร์ (PERFECT!) • จุดพลุเฉลิมฉลอง' : '🪷 ลอยกระทงสู่สระหลวงอย่างงดงาม';
    setRitualStageUI('TRACK');
    ritual.stageTimer = 3.5;
  }

  function finishRitual(skipped) {
    if (!ritual.active) return;
    submitRitualKrathong();
    if (skipped && ritual.entry && ritual.entry.isRitualHeld) {
      charRefs.releaseRitualKrathong(ritual.entry, false, null);
      charRefs.spawnSkyLantern(8, 28);
    }
    const doneMeta = ritual.meta;
    ritual.active = false;
    ritual.stage = 'IDLE';
    ritual.entry = null;
    ritual.meta = null;

    document.body.classList.remove('ritual-active');
    document.getElementById('ritual-overlay').style.display = 'none';
    document.getElementById('ritual-wish-subtitle').classList.remove('show');
    dressingFillLight.visible = false;

    toto.pos.set(TOTO.LOCATIONS.PIER_SPOT.x, 0, TOTO.LOCATIONS.PIER_SPOT.z);
    toto.yaw = 0;
    toto.root.rotation.y = 0;
    toto.activeEmote = '';
    toto.emoteTimer = 0;
    toto.root.visible = (STATE.camMode !== 1);
    camYaw = 0;
    camPitch = -0.06;
    krathongCamFocusTimer = 0;

    if (doneMeta) openShareCardModal(doneMeta);
  }

  async function launchKrathongAction() {
    const baseObj = TOTO.KRATHONG_BASES.find(b => b.id === STATE.selectedBase) || TOTO.KRATHONG_BASES[0];
    const flowerObj = TOTO.KRATHONG_FLOWERS.find(f => f.id === STATE.selectedFlower) || TOTO.KRATHONG_FLOWERS[0];

    if (baseObj.vipOnly && !STATE.vipUnlocked) {
      openDonateModal();
      return;
    }

    const nameInput = document.getElementById('k-input-name');
    const wishInput = document.getElementById('k-input-wish');
    const playerName = (nameInput && nameInput.value.trim()) || 'นักท่องเที่ยวสระหลวง';
    const playerWish = (wishInput && wishInput.value.trim()) || 'ขอให้มีความสุข สุขภาพแข็งแรง ตลอดปี';

    const meta = {
      id: 'k_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      name: playerName.slice(0, 24),
      wish: playerWish.slice(0, 70),
      baseId: baseObj.id,
      flowerId: flowerObj.id,
      baseName: baseObj.name,
      flowerName: flowerObj.name,
      typeId: baseObj.vipOnly ? 'toto' : (flowerObj.id === 'marigold' ? 'marigold' : 'lotus'),
      isVip: !!baseObj.vipOnly,
      perfectMoon: false
    };

    startKrathongRitual(baseObj, flowerObj, meta);
  }

  // ============================================================
  // 5B. REAL-TIME ONLINE MULTIPLAYER (SSE), DRESSING ROOM & EMOTES
  // ============================================================
  const remotePlayers = new Map();
  let liveEventSource = null;
  let lastPresenceSentAt = 0;
  let lastPresencePos = { x: 0, z: 0, yaw: 0, moving: false };
  let afterVipDonateTarget = null;

  const localChatTagEl = document.createElement('div');
  localChatTagEl.className = 'remote-player-tag';
  localChatTagEl.style.display = 'none';
  document.getElementById('world-labels').appendChild(localChatTagEl);

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, ch => (
      ch === '&' ? '&amp;' : ch === '<' ? '&lt;' : ch === '>' ? '&gt;' : ch === '"' ? '&quot;' : '&#39;'
    ));
  }

  function updateOnlineBadge(count) {
    STATE.onlineCount = Math.max(1, Number(count) || 1);
    const el = document.getElementById('ui-online-count');
    if (el) el.textContent = STATE.onlineCount;
  }

  function disposeAvatarRoot(root) {
    if (!root) return;
    scene.remove(root);
    root.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach(m => {
          if (m.map && m.map.userData && m.map.userData.disposable) m.map.dispose();
          m.dispose();
        });
      }
    });
  }

  function avatarSignature(d) {
    return `${d.outfit}|${d.color}|${d.hair}|${d.hairColor || '#1b1817'}|${d.skin}|${d.hat || 'none'}|${d.glasses || 'none'}|${d.back || 'none'}|${d.aura || 'none'}|${d.prop}|${d.isVip ? 1 : 0}`;
  }

  function reconcileRemotePlayers(serverList) {
    if (!Array.isArray(serverList)) return;
    updateOnlineBadge(Math.max(1, serverList.length));

    const seenIds = new Set();
    for (const p of serverList) {
      if (!p || !p.id || p.id === MY_PLAYER_ID) continue;
      seenIds.add(p.id);

      let rp = remotePlayers.get(p.id);
      const sig = avatarSignature(p);
      if (!rp) {
        const avatarRoot = TOTO.createCustomAvatar(p);
        avatarRoot.position.set(Number(p.x) || 6, Number(p.y) || 0, Number(p.z) || 6.2);
        avatarRoot.rotation.y = Number(p.yaw) || 0;
        scene.add(avatarRoot);

        const tagEl = document.createElement('div');
        tagEl.className = 'remote-player-tag';
        tagEl.style.display = 'none';
        document.getElementById('world-labels').appendChild(tagEl);

        rp = {
          id: p.id,
          data: p,
          signature: sig,
          avatarRoot,
          tagEl,
          curPos: avatarRoot.position,
          targetPos: new THREE.Vector3(Number(p.x) || 6, Number(p.y) || 0, Number(p.z) || 6.2),
          curYaw: Number(p.yaw) || 0,
          targetYaw: Number(p.yaw) || 0,
          animMoving: Boolean(p.moving),
          lastEmoteSeq: Number(p.emoteSeq) || 0,
          activeEmote: p.emote || '',
          emoteTimer: p.emote ? 2.5 : 0,
          lastChatSeq: Number(p.chatSeq) || 0,
          chatText: p.chat || '',
          chatTimer: p.chat ? 5.0 : 0
        };
        remotePlayers.set(p.id, rp);
      } else {
        rp.data = p;
        if (rp.signature !== sig) {
          const oldPos = rp.curPos.clone();
          const oldYaw = rp.curYaw;
          disposeAvatarRoot(rp.avatarRoot);
          rp.avatarRoot = TOTO.createCustomAvatar(p);
          rp.curPos = rp.avatarRoot.position;
          rp.curPos.copy(oldPos);
          rp.avatarRoot.rotation.y = oldYaw;
          rp.signature = sig;
          scene.add(rp.avatarRoot);
        }
        rp.targetPos.set(Number(p.x) || 6, Number(p.y) || 0, Number(p.z) || 6.2);
        rp.targetYaw = Number(p.yaw) || 0;
        rp.animMoving = Boolean(p.moving);

        const emSeq = Number(p.emoteSeq) || 0;
        if (emSeq > rp.lastEmoteSeq && p.emote) {
          rp.lastEmoteSeq = emSeq;
          rp.activeEmote = p.emote;
          rp.emoteTimer = p.emote === 'ramwong' ? 4.2 : (p.emote === 'jump' ? 2.2 : 2.6);
        }
        const chSeq = Number(p.chatSeq) || 0;
        if (chSeq > rp.lastChatSeq && p.chat) {
          rp.lastChatSeq = chSeq;
          rp.chatText = p.chat;
          rp.chatTimer = 5.2;
        }
      }
    }

    for (const [id, rp] of remotePlayers.entries()) {
      if (!seenIds.has(id)) {
        disposeAvatarRoot(rp.avatarRoot);
        rp.tagEl.remove();
        remotePlayers.delete(id);
      }
    }
  }

  function sendPresence(force, isMovingNow) {
    if (!STATE.started) return;
    const now = performance.now();
    const moving = Boolean(isMovingNow);
    const movedDist = Math.hypot(toto.pos.x - lastPresencePos.x, toto.pos.z - lastPresencePos.z);
    const turnedAmt = Math.abs(toto.yaw - lastPresencePos.yaw);
    if (!force && now - lastPresenceSentAt < 160) return;
    if (!force && now - lastPresenceSentAt < 2400 && movedDist < 0.04 && turnedAmt < 0.04 && moving === lastPresencePos.moving) {
      return;
    }

    lastPresenceSentAt = now;
    lastPresencePos = { x: toto.pos.x, z: toto.pos.z, yaw: toto.yaw, moving };

    const payload = {
      id: MY_PLAYER_ID,
      name: myProfile.name,
      outfit: myProfile.outfit,
      color: myProfile.color,
      hair: myProfile.hair,
      hairColor: myProfile.hairColor,
      skin: myProfile.skin,
      hat: myProfile.hat || 'none',
      glasses: myProfile.glasses || 'none',
      back: myProfile.back || 'none',
      aura: myProfile.aura || 'none',
      prop: myProfile.prop,
      isVip: Boolean(STATE.vipUnlocked),
      x: Number(toto.pos.x.toFixed(3)),
      y: Number(toto.pos.y.toFixed(3)),
      z: Number(toto.pos.z.toFixed(3)),
      yaw: Number(toto.yaw.toFixed(3)),
      moving
    };

    fetch('/api/presence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(r => (r.ok ? r.json() : null)).then(d => {
      if (d && typeof d.count === 'number') updateOnlineBadge(d.count);
    }).catch(() => {});
  }

  function connectLiveStream() {
    if (liveEventSource) return;
    if (typeof EventSource === 'undefined') return;

    liveEventSource = new EventSource('/api/live');
    liveEventSource.addEventListener('init', (ev) => {
      try {
        const d = JSON.parse(ev.data || '{}');
        if (Array.isArray(d.players)) reconcileRemotePlayers(d.players);
        if (Array.isArray(d.krathongs) && d.krathongs.length > 0 && typeof charRefs.syncRemoteKrathongs === 'function') {
          charRefs.syncRemoteKrathongs(d.krathongs);
          const srvAllTime = Number(d.stats && d.stats.totalKrathongsAllTime) || 0;
          const cnt = Math.max(srvAllTime, d.krathongs.length, charRefs.pondKrathongs.length);
          lastFetchedTotal = cnt;
          const p1 = document.getElementById('ui-pond-count');
          const p2 = document.getElementById('k-stat-pond-total');
          if (p1) p1.textContent = cnt;
          if (p2) p2.textContent = cnt;
        }
      } catch (_) {}
    });

    liveEventSource.addEventListener('players', (ev) => {
      try {
        const d = JSON.parse(ev.data || '{}');
        if (Array.isArray(d.players)) reconcileRemotePlayers(d.players);
      } catch (_) {}
    });

    liveEventSource.addEventListener('krathong', (ev) => {
      try {
        const d = JSON.parse(ev.data || '{}');
        if (d.krathong && typeof charRefs.syncRemoteKrathongs === 'function') {
          charRefs.syncRemoteKrathongs([d.krathong]);
          const cnt = Math.max(Number(d.total) || 0, charRefs.pondKrathongs.length);
          lastFetchedTotal = cnt;
          const p1 = document.getElementById('ui-pond-count');
          const p2 = document.getElementById('k-stat-pond-total');
          if (p1) p1.textContent = cnt;
          if (p2) p2.textContent = cnt;
        }
      } catch (_) {}
    });

    liveEventSource.addEventListener('bless', (ev) => {
      try {
        const d = JSON.parse(ev.data || '{}');
        if (d.id && typeof d.blessings === 'number') {
          charRefs.updateKrathongBlessingUI(d.id, d.blessings);
          if (activeWishItem && activeWishItem.id === d.id) {
            activeWishItem.blessings = d.blessings;
            const bc = document.getElementById('wp-bless-count');
            if (bc) bc.textContent = d.blessings;
          }
        }
      } catch (_) {}
    });

    liveEventSource.addEventListener('firework', (ev) => {
      try {
        const d = JSON.parse(ev.data || '{}');
        if (d.id !== MY_PLAYER_ID) {
          charRefs.launchFirework(d.x, d.z);
          if (d.isVip) charRefs.spawnSkyLantern(d.x, d.z);
        }
      } catch (_) {}
    });

    liveEventSource.addEventListener('krathong_delete', (ev) => {
      try {
        const d = JSON.parse(ev.data || '{}');
        if (d.id && typeof charRefs.removeKrathongById === 'function') {
          charRefs.removeKrathongById(d.id);
        }
      } catch (_) {}
    });
  }

  function trackAnalytics(event, slotId) {
    try {
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, slotId: slotId || '' })
      }).catch(() => {});
    } catch (_) {}
  }

  function postEmote(type, extra) {
    if (!STATE.started) return;
    fetch('/api/emote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({ id: MY_PLAYER_ID, type }, extra || {}))
    }).catch(() => {});
  }

  function triggerLocalEmote(emoteName) {
    const dur = emoteName === 'ramwong' ? 4.2 : (emoteName === 'jump' ? 2.2 : 2.6);
    toto.activeEmote = emoteName;
    toto.emoteTimer = dur;
    sfx.playPop();
    postEmote(emoteName);
    document.getElementById('emote-menu').style.display = 'none';
    STATE.emoteMenuOpen = false;
    const labels = {
      wai: '🙏 ไหว้สวัสดีทุกคนรอบสระหลวง',
      wave: '👋 โบกมือทักทายทุกคน',
      ramwong: '💃 กำลังรำวงวันเพ็ญรอบสระหลวง!',
      jump: '🎉 กระโดดดีใจร่วมงานลอยกระทง!'
    };
    showCamToast(labels[emoteName] || '✨ แสดงท่าทาง');
  }

  function sendQuickChat(text) {
    const clean = String(text || '').trim().slice(0, 56);
    if (!clean) return;
    toto.localChat = clean;
    toto.localChatTimer = 5.2;
    sfx.playPop();
    postEmote('chat', { text: clean });
    document.getElementById('emote-menu').style.display = 'none';
    STATE.emoteMenuOpen = false;
    showCamToast(`${myProfile.name}: "${clean}"`);
  }

  let activeAvatarTab = 'outfit';
  function switchAvatarTab(tabId) {
    activeAvatarTab = tabId || 'outfit';
    document.querySelectorAll('.av-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === activeAvatarTab);
    });
    ['outfit', 'face', 'head', 'aura'].forEach(t => {
      const panel = document.getElementById('av-panel-' + t);
      if (panel) panel.style.display = (t === activeAvatarTab) ? 'block' : 'none';
    });
  }

  function renderChoiceGrid(gridId, list, currentId, fieldKey, allowVipGate) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.innerHTML = '';
    list.forEach(item => {
      const locked = !!item.vipOnly && !STATE.vipUnlocked;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'av-choice-btn' + (currentId === item.id ? ' selected' : '');
      const vipBadge = item.vipOnly
        ? `<div class="av-vip-pill">${STATE.vipUnlocked ? 'ปลดล็อก VIP แล้ว ✨' : 'สนับสนุน VIP เพื่อปลดล็อก'}</div>`
        : '';
      const descHtml = item.desc ? `<div class="av-c-desc">${item.desc}</div>` : '';
      btn.innerHTML = `<div class="av-c-name">${item.name}</div>${descHtml}${vipBadge}`;
      btn.onclick = () => {
        if (locked && allowVipGate) {
          afterVipDonateTarget = 'avatar_vip';
          openDonateModal();
          return;
        }
        rebuildPlayerAvatar({ [fieldKey]: item.id });
        renderAvatarCustomizer();
        sfx.playPop();
      };
      grid.appendChild(btn);
    });
  }

  function renderAvatarCustomizer() {
    const opts = TOTO.AVATAR_OPTIONS;
    const nameIn = document.getElementById('av-input-name');
    if (nameIn && nameIn.value !== myProfile.name) {
      nameIn.value = myProfile.name;
    }

    const presetRow = document.getElementById('av-preset-row');
    if (presetRow && presetRow.childElementCount === 0 && Array.isArray(TOTO.AVATAR_PRESETS)) {
      TOTO.AVATAR_PRESETS.forEach(pr => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'av-preset-chip';
        chip.textContent = '✨ ' + pr.name;
        chip.onclick = () => {
          rebuildPlayerAvatar(Object.assign({}, pr.profile, { name: myProfile.name }));
          renderAvatarCustomizer();
          sfx.playPop();
        };
        presetRow.appendChild(chip);
      });
    }

    renderChoiceGrid('av-outfit-grid', opts.outfits, myProfile.outfit, 'outfit', true);
    renderChoiceGrid('av-hair-grid', opts.hairs, myProfile.hair, 'hair', false);
    renderChoiceGrid('av-glasses-grid', opts.glasses, myProfile.glasses || 'none', 'glasses', false);
    renderChoiceGrid('av-hat-grid', opts.hats, myProfile.hat || 'none', 'hat', true);
    renderChoiceGrid('av-back-grid', opts.backs, myProfile.back || 'none', 'back', true);
    renderChoiceGrid('av-prop-grid', opts.props, myProfile.prop || 'none', 'prop', false);
    renderChoiceGrid('av-aura-grid', opts.auras, myProfile.aura || 'none', 'aura', false);

    const colorGrid = document.getElementById('av-color-grid');
    colorGrid.innerHTML = '';
    opts.colors.forEach(c => {
      const sw = document.createElement('button');
      sw.type = 'button';
      sw.className = 'av-swatch' + (myProfile.color === c.id ? ' selected' : '');
      sw.style.background = c.id;
      sw.title = c.name;
      sw.onclick = () => {
        rebuildPlayerAvatar({ color: c.id });
        renderAvatarCustomizer();
        sfx.playPop();
      };
      colorGrid.appendChild(sw);
    });

    const hairColorGrid = document.getElementById('av-haircolor-grid');
    hairColorGrid.innerHTML = '';
    opts.hairColors.forEach(hc => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'av-haircolor-dot' + (myProfile.hairColor === hc.id ? ' selected' : '');
      dot.style.background = hc.id;
      dot.title = hc.name;
      dot.onclick = () => {
        rebuildPlayerAvatar({ hairColor: hc.id });
        renderAvatarCustomizer();
        sfx.playPop();
      };
      hairColorGrid.appendChild(dot);
    });

    const skinGrid = document.getElementById('av-skin-grid');
    skinGrid.innerHTML = '';
    opts.skins.forEach(sk => {
      const sw = document.createElement('button');
      sw.type = 'button';
      sw.className = 'av-swatch' + (myProfile.skin === sk.id ? ' selected' : '');
      sw.style.background = sk.hex;
      sw.title = sk.name;
      sw.onclick = () => {
        rebuildPlayerAvatar({ skin: sk.id });
        renderAvatarCustomizer();
        sfx.playPop();
      };
      skinGrid.appendChild(sw);
    });
  }

  function openSponsorModal(slot) {
    clearMovementInputs();
    closeCookPanel();
    const info = TOTO.CONTACT_INFO || {};
    STATE.sponsorModalOpen = true;
    trackAnalytics('sponsor_click', slot ? slot.id : 'billboard');

    const lineId = info.lineId || 'nineza4456';
    const lineUrl = (slot && slot.linkUrl) ? slot.linkUrl : (info.lineUrl || `https://line.me/ti/p/~${lineId}`);

    document.getElementById('sp-slot-banner').textContent = (slot && slot.badge) ? slot.badge : (info.brandName || 'พื้นที่โฆษณา 3D สระหลวง');
    document.getElementById('sp-headline').textContent = (slot && slot.isAvailable === false) ? slot.title : (info.headline || 'พื้นที่โฆษณาบนป้าย 3D สระหลวง');
    document.getElementById('sp-subhead').textContent = (slot && slot.isAvailable === false && slot.promo) ? slot.promo : (info.subhead || '');
    document.getElementById('sp-contact-line').textContent = lineId;
    const lineBtn = document.getElementById('btn-open-contact-line');
    if (lineBtn) lineBtn.href = lineUrl;

    document.getElementById('sponsor-modal').style.display = 'flex';
    sfx.playPop();
  }
  TOTO.onSelectSponsorSlot = openSponsorModal;

  function closeSponsorModal() {
    STATE.sponsorModalOpen = false;
    document.getElementById('sponsor-modal').style.display = 'none';
  }

  function renderKrathongSearchList() {
    const q = (document.getElementById('krathong-search-input').value || '').trim().toLowerCase();
    const resEl = document.getElementById('krathong-search-results');
    const items = charRefs.pondKrathongs.filter(pk =>
      !q || (pk.name || '').toLowerCase().includes(q) || (pk.wish || '').toLowerCase().includes(q)
    ).slice().reverse();

    resEl.innerHTML = '';
    if (!items.length) {
      resEl.innerHTML = '<div style="color:var(--ivory-muted);font-size:13px;padding:12px;text-align:center;">ไม่พบกระทงที่ค้นหา ลองพิมพ์คำอื่นครับ</div>';
      return;
    }
    items.forEach(pk => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'search-k-item';
      btn.innerHTML = `<div class="sk-name">${pk.isVip ? '👑 VIP • ' : '🪷 '}${escapeHtml(pk.name || 'ชาวหนองไผ่')} (♡ ${pk.blessings || 0})</div><div class="sk-wish">"${escapeHtml(pk.wish || '')}"</div>`;
      btn.onclick = () => {
        closeSearchKrathongModal();
        if (TOTO.onSelectKrathongWish) TOTO.onSelectKrathongWish(pk);
      };
      resEl.appendChild(btn);
    });
  }

  function openSearchKrathongModal() {
    clearMovementInputs();
    STATE.searchModalOpen = true;
    document.getElementById('krathong-search-input').value = '';
    renderKrathongSearchList();
    document.getElementById('search-krathong-modal').style.display = 'flex';
    sfx.playPop();
  }

  function closeSearchKrathongModal() {
    STATE.searchModalOpen = false;
    document.getElementById('search-krathong-modal').style.display = 'none';
  }

  function openAvatarModal() {
    clearMovementInputs();
    closeCookPanel();
    document.getElementById('emote-menu').style.display = 'none';
    STATE.emoteMenuOpen = false;
    STATE.avatarModalOpen = true;
    document.body.classList.add('dressing-open');
    switchAvatarTab('outfit');
    const dr = document.querySelector('#avatar-modal .dressing-drawer');
    if (dr) dr.scrollTop = 0;
    const d = getDressingCamDir(toto.pos);
    previewBaseYaw = Math.atan2(-d.x, -d.z);
    previewYaw = previewBaseYaw - 0.18;
    manualPreviewDrag = false;
    toto.root.visible = true;
    renderAvatarCustomizer();
    document.getElementById('avatar-modal').style.display = 'flex';
    sfx.playPop();
  }

  function closeAvatarModal(saveNameFirst) {
    if (saveNameFirst) {
      const nEl = document.getElementById('av-input-name');
      const cleaned = nEl ? nEl.value.trim().slice(0, 20) : '';
      if (cleaned && cleaned !== myProfile.name) {
        rebuildPlayerAvatar({ name: cleaned });
      } else {
        TOTO.saveAvatarProfile(myProfile);
        sendPresence(true);
      }
    }
    STATE.avatarModalOpen = false;
    document.body.classList.remove('dressing-open');
    dressingFillLight.visible = false;
    document.getElementById('avatar-modal').style.display = 'none';
    toto.root.rotation.y = toto.yaw;
    toto.root.visible = (STATE.camMode !== 1);
  }

  function initQuickGreetingsUI() {
    const listEl = document.getElementById('emote-quick-list');
    if (!listEl) return;
    listEl.innerHTML = '';
    (TOTO.QUICK_GREETINGS || []).forEach(msg => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'emote-quick-chip';
      chip.textContent = msg;
      chip.onclick = () => sendQuickChat(msg);
      listEl.appendChild(chip);
    });
  }
  initQuickGreetingsUI();

  // ============================================================
  // 6. WORLD PROJECTION & CONTEXTUAL UI
  // ============================================================
  const projVec = new THREE.Vector3();
  function updateProjectedLabels() {
    const vp = getViewportSize();
    const w = vp.w, h = vp.h;
    const isNarrow = w <= 640;

    const emoteEl = document.getElementById('emote-menu');
    const emoteOpen = !!(emoteEl && emoteEl.style.display !== 'none');
    document.body.classList.toggle('modal-open', isModalBackdropOpen());
    document.body.classList.toggle('overlay-open', !!(emoteOpen || STATE.cookPanelOpen));

    TABLES.forEach(tbl => {
      const el = tbl.tagEl;
      if (!STATE.started || STATE.photoMode || !STATE.cookPanelOpen || tbl.status === 'EMPTY' || tbl.status === 'WALKING_IN') {
        el.style.display = 'none';
        tbl.ringMat.opacity = 0;
        return;
      }
      projVec.set(tbl.pos.x, 1.72, tbl.pos.z - 0.25);
      projVec.project(camera);
      if (projVec.z > 1) {
        el.style.display = 'none';
        return;
      }
      el.style.left = THREE.MathUtils.clamp((projVec.x * 0.5 + 0.5) * w, 52, w - 52) + 'px';
      el.style.top = THREE.MathUtils.clamp((-projVec.y * 0.5 + 0.5) * h, 64, h - 84) + 'px';
      el.style.display = 'block';
      el.textContent = tbl.status === 'WAITING' && tbl.order ? `โต๊ะ ${tbl.id}: ${tbl.order.short}` : `โต๊ะ ${tbl.id}`;
    });

    const visibleTags = [];
    charRefs.pondKrathongs.forEach(pk => {
      if (!pk.tagEl) return;
      if (STATE.started && !STATE.photoMode && !STATE.avatarModalOpen && !ritual.active && STATE.loyKrathongMode) {
        projVec.set(pk.mesh.position.x, pk.mesh.position.y + 0.65, pk.mesh.position.z);
        projVec.project(camera);
        const sx = (projVec.x * 0.5 + 0.5) * w;
        const sy = (-projVec.y * 0.5 + 0.5) * h;
        const dist = camera.position.distanceTo(pk.mesh.position);
        const maxDist = isNarrow ? 34 : 52;
        if (projVec.z <= 1 && dist < maxDist && sx >= (isNarrow ? 20 : -80) && sx <= (isNarrow ? w - 20 : w + 80) && sy >= (isNarrow ? 104 : 40) && sy <= (isNarrow ? h - 132 : h - 40)) {
          visibleTags.push({ pk, sx, sy, dist });
        } else {
          pk.tagEl.style.display = 'none';
        }
      } else {
        pk.tagEl.style.display = 'none';
      }
    });

    if (isNarrow && visibleTags.length > 5) {
      visibleTags.sort((a, b) => a.dist - b.dist);
      visibleTags.slice(5).forEach(item => { item.pk.tagEl.style.display = 'none'; });
    }
    const shownTags = isNarrow ? visibleTags.slice(0, 5) : visibleTags;
    shownTags.forEach(({ pk, sx, sy }) => {
      const clampedX = isNarrow ? THREE.MathUtils.clamp(sx, 82, w - 82) : sx;
      const clampedY = isNarrow ? THREE.MathUtils.clamp(sy, 104, h - 132) : sy;
      pk.tagEl.style.left = clampedX + 'px';
      pk.tagEl.style.top = clampedY + 'px';
      pk.tagEl.style.display = 'block';
    });

    const stallBar = document.getElementById('toto-stall-bar');
    if (stallBar) {
      stallBar.style.display = (STATE.started && !STATE.photoMode && !STATE.cookPanelOpen && !isModalBackdropOpen() && isNearCart()) ? 'block' : 'none';
    }

    // 3D Sponsor Billboards & Rental Booth World Tags
    (worldRefs.sponsorObjects || []).forEach(so => {
      if (!so.tagEl) return;
      if (STATE.started && !STATE.photoMode && !STATE.avatarModalOpen && !isModalBackdropOpen()) {
        projVec.copy(so.worldPos);
        projVec.project(camera);
        const sx = (projVec.x * 0.5 + 0.5) * w;
        const sy = (-projVec.y * 0.5 + 0.5) * h;
        const dist = camera.position.distanceTo(so.worldPos);
        if (projVec.z <= 1 && dist < 26 && sx >= 40 && sx <= w - 40 && sy >= 50 && sy <= h - 90) {
          so.tagEl.style.left = sx + 'px';
          so.tagEl.style.top = sy + 'px';
          so.tagEl.style.display = 'block';
        } else {
          so.tagEl.style.display = 'none';
        }
      } else {
        so.tagEl.style.display = 'none';
      }
    });

    // Online Remote Player Overhead Nameplates & Chat Bubbles
    for (const rp of remotePlayers.values()) {
      if (!STATE.started || STATE.photoMode) {
        rp.tagEl.style.display = 'none';
        continue;
      }
      projVec.set(rp.curPos.x, rp.curPos.y + 1.98, rp.curPos.z);
      projVec.project(camera);
      const sx = (projVec.x * 0.5 + 0.5) * w;
      const sy = (-projVec.y * 0.5 + 0.5) * h;
      const dist = camera.position.distanceTo(rp.curPos);
      if (projVec.z <= 1 && dist < 68 && sx >= -80 && sx <= w + 80 && sy >= 32 && sy <= h - 32) {
        rp.tagEl.style.left = sx + 'px';
        rp.tagEl.style.top = sy + 'px';
        rp.tagEl.style.display = 'flex';
        const vipStar = rp.data.isVip ? '👑 ' : '';
        const chatHtml = rp.chatTimer > 0 && rp.chatText
          ? `<div class="rp-chat-bubble">${escapeHtml(rp.chatText)}</div>`
          : '';
        const key = `${vipStar}${rp.data.name}|${rp.data.isVip ? 1 : 0}|${rp.chatTimer > 0 ? rp.chatText : ''}`;
        if (rp.tagEl.dataset.renderKey !== key) {
          rp.tagEl.dataset.renderKey = key;
          rp.tagEl.innerHTML = `${chatHtml}<div class="rp-name-pill ${rp.data.isVip ? 'is-vip' : ''}">${vipStar}${escapeHtml(rp.data.name)}</div>`;
        }
      } else {
        rp.tagEl.style.display = 'none';
      }
    }

    // Local Player 3rd-person nameplate / chat bubble
    if (STATE.started && !STATE.photoMode && !ritual.active && (STATE.camMode !== 1 || STATE.avatarModalOpen) && (toto.localChatTimer > 0 || STATE.avatarModalOpen)) {
      projVec.set(toto.pos.x, toto.pos.y + 1.98, toto.pos.z);
      projVec.project(camera);
      const sx = (projVec.x * 0.5 + 0.5) * w;
      const sy = (-projVec.y * 0.5 + 0.5) * h;
      if (projVec.z <= 1 && sx >= 0 && sx <= w && sy >= 24 && sy <= h) {
        localChatTagEl.style.left = sx + 'px';
        localChatTagEl.style.top = sy + 'px';
        localChatTagEl.style.display = 'flex';
        const vipStar = STATE.vipUnlocked ? '👑 ' : '';
        const chatHtml = toto.localChatTimer > 0 && toto.localChat
          ? `<div class="rp-chat-bubble">${escapeHtml(toto.localChat)}</div>`
          : '';
        const key = `${vipStar}${myProfile.name}|${STATE.vipUnlocked ? 1 : 0}|${toto.localChatTimer > 0 ? toto.localChat : ''}`;
        if (localChatTagEl.dataset.renderKey !== key) {
          localChatTagEl.dataset.renderKey = key;
          localChatTagEl.innerHTML = `${chatHtml}<div class="rp-name-pill ${STATE.vipUnlocked ? 'is-vip' : ''}">${vipStar}${escapeHtml(myProfile.name)} (คุณ)</div>`;
        }
      } else {
        localChatTagEl.style.display = 'none';
      }
    } else {
      localChatTagEl.style.display = 'none';
    }
  }

  // ============================================================
  // 7. INPUT LISTENERS (FREE 1ST PERSON MOUSE-LOOK + ZERO STUCK KEYS)
  // ============================================================
  window.addEventListener('keydown', (e) => {
    const activeTag = document.activeElement && document.activeElement.tagName;
    if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') {
      if (e.code === 'Escape') document.activeElement.blur();
      return;
    }
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    keys[e.code] = true;
    if (!STATE.started) return;

    if (e.code === 'Space' && ritual.active && ritual.stage === 'PUSH') {
      triggerRitualPush();
      return;
    }

    if (e.code === 'Digit1') setCameraMode(1);
    else if (e.code === 'Digit3') setCameraMode(3);
    else if (e.code === 'KeyT') cycleTimeOfDay();
    else if (e.code === 'Space' && STATE.cookPanelOpen && STATE.pan.active) stirPan();
    else if (e.code === 'KeyE' && STATE.cookPanelOpen && STATE.pan.active) plateFromPan();
    else if (e.code === 'Escape') {
      if (ritual.active) finishRitual(true);
      closeCookPanel();
      closeKrathongModal();
      closeDonateModal();
      closeShareCardModal();
      closeWishPopover();
      closeSponsorModal();
      closeSearchKrathongModal();
      if (STATE.avatarModalOpen) closeAvatarModal(true);
      document.getElementById('emote-menu').style.display = 'none';
      STATE.emoteMenuOpen = false;
      document.getElementById('landmark-menu').style.display = 'none';
    }
  });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });

  joyZone.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    e.preventDefault();
    joyPointerId = e.pointerId;
    joyZone.setPointerCapture(e.pointerId);
    const rect = joyZone.querySelector('.joy-ring').getBoundingClientRect();
    joyCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    updateJoystickFromEvent(e);
  });
  joyZone.addEventListener('pointermove', (e) => {
    if (e.pointerId !== joyPointerId) return;
    e.stopPropagation();
    updateJoystickFromEvent(e);
  });
  joyZone.addEventListener('pointerup', resetJoystick);
  joyZone.addEventListener('pointercancel', resetJoystick);

  function updateJoystickFromEvent(e) {
    const dx = e.clientX - joyCenter.x;
    const dy = e.clientY - joyCenter.y;
    const maxR = 30;
    const clamped = Math.min(Math.hypot(dx, dy), maxR);
    const ang = Math.atan2(dy, dx);
    const kx = Math.cos(ang) * clamped;
    const ky = Math.sin(ang) * clamped;
    joyKnob.style.transform = `translate(calc(-50% + ${kx}px), calc(-50% + ${ky}px))`;
    joyVec.x = kx / maxR;
    joyVec.y = -ky / maxR;
  }

  renderer.domElement.addEventListener('pointerdown', (e) => {
    isDragging = true;
    dragMoved = false;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    hasMousePos = true;
    hoverX = e.clientX;
    hoverY = e.clientY;
    hoverOnCanvas = true;
    document.getElementById('landmark-menu').style.display = 'none';
  });

  window.addEventListener('pointermove', (e) => {
    if (!STATE.started || e.pointerId === joyPointerId) return;
    hoverX = e.clientX;
    hoverY = e.clientY;
    hoverOnCanvas = (e.target === renderer.domElement);

    if (!hasMousePos) {
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      hasMousePos = true;
      return;
    }

    const dx = e.clientX - lastMouseX;
    const dy = e.clientY - lastMouseY;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;

    const isMouse = e.pointerType !== 'touch';
    const yawSens = isMouse ? 0.0055 : 0.0078;
    const pitchSens = isMouse ? 0.0045 : 0.0058;
    const modalOpen = isModalBackdropOpen();
    const overUI = !!(e.target && e.target.closest && e.target.closest('#cook-panel, .editorial-modal, .dressing-drawer, .emote-menu, .landmark-menu, #toto-stall-bar, #main-dock, .krathong-wish-tag, .sponsor-world-tag, #photo-mode-bar, .icon-tool-btn, .location-pill'));

    if (isDragging) {
      if (Math.hypot(dx, dy) > 4) dragMoved = true;
      if (STATE.avatarModalOpen || (STATE.photoMode && STATE.selfieMode)) {
        manualPreviewDrag = true;
        previewYaw += dx * 0.012;
      } else {
        camYaw -= dx * yawSens;
        if (STATE.camMode === 1) {
          camPitch = THREE.MathUtils.clamp(camPitch - dy * pitchSens, -0.72, 0.72);
        } else {
          camPitch = THREE.MathUtils.clamp(camPitch + dy * pitchSens, -0.35, 0.85);
        }
      }
    } else if (STATE.camMode === 1 && isMouse && !modalOpen && !overUI) {
      camYaw -= dx * 0.0058;
      camPitch = THREE.MathUtils.clamp(camPitch - dy * 0.0045, -0.72, 0.72);
    }
  });

  const sponsorRaycaster = new THREE.Raycaster();
  const rayMouseNDC = new THREE.Vector2();
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (dragMoved || !STATE.started || STATE.photoMode || isModalBackdropOpen()) return;
    const meshes = (worldRefs.sponsorObjects || []).map(x => x.mesh).filter(Boolean);
    if (!meshes.length) return;
    const vp = getViewportSize();
    rayMouseNDC.set((e.clientX / vp.w) * 2 - 1, -(e.clientY / vp.h) * 2 + 1);
    sponsorRaycaster.setFromCamera(rayMouseNDC, camera);
    const hits = sponsorRaycaster.intersectObjects(meshes, false);
    if (hits.length && hits[0].object && hits[0].object.userData && hits[0].object.userData.sponsorSlot) {
      openSponsorModal(hits[0].object.userData.sponsorSlot);
    }
  });

  window.addEventListener('pointerup', (e) => {
    if (e.pointerId === joyPointerId) return;
    isDragging = false;
  });

  // ============================================================
  // 8. UI BUTTON BINDINGS
  // ============================================================
  function startGame(nightMode, forceDressingRoom) {
    sfx.init();
    STATE.started = true;
    let hasSavedAvatar = false;
    try {
      if (localStorage.getItem('toto_vip_unlocked') === '1') STATE.vipUnlocked = true;
      hasSavedAvatar = TOTO.hasSavedAvatarProfile ? TOTO.hasSavedAvatarProfile() : !!localStorage.getItem('saluang_avatar_profile_v1');
    } catch (_) {}

    rebuildPlayerAvatar(myProfile, true);

    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('hud').style.display = 'block';

    // Position cleanly at the South Brick Promenade Pier facing North across the 90m pond
    toto.pos.set(TOTO.LOCATIONS.PIER_SPOT.x, 0, TOTO.LOCATIONS.PIER_SPOT.z);
    toto.yaw = 0;
    camYaw = 0;
    camPitch = -0.04;
    const isMobileDevice = isEffectivePortrait() || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    setCameraMode(isMobileDevice ? 3 : 1);

    worldRefs.setLoyKrathongFestival(true);
    cycleTimeOfDay(nightMode ? 'NIGHT' : 'DAY');

    trySpawnCustomer();
    fetchKrathongsFromServer();
    connectLiveStream();
    sendPresence(true);
    setInterval(fetchKrathongsFromServer, 12000);
    setInterval(() => {
      if (STATE.started) sendPresence(false);
    }, 2500);

    if (forceDressingRoom || !hasSavedAvatar) {
      openAvatarModal();
    }
  }

  function handleTabLeave() {
    if (!STATE.started) return;
    try {
      const blob = new Blob([JSON.stringify({ id: MY_PLAYER_ID })], { type: 'application/json' });
      if (navigator.sendBeacon) navigator.sendBeacon('/api/leave', blob);
    } catch (_) {}
  }
  window.addEventListener('beforeunload', handleTabLeave);
  window.addEventListener('pagehide', handleTabLeave);

  document.getElementById('btn-start-loy').onclick = () => startGame(true, false);
  document.getElementById('btn-open-avatar-start').onclick = () => startGame(true, true);
  document.getElementById('btn-start').onclick = () => startGame(false, false);

  document.getElementById('btn-customize-avatar').onclick = openAvatarModal;
  document.getElementById('btn-close-avatar').onclick = () => closeAvatarModal(true);
  document.getElementById('btn-save-avatar').onclick = () => {
    closeAvatarModal(true);
    showCamToast(`พร้อมเดินเล่นรอบสระหลวงแล้ว คุณ${myProfile.name} ✨`);
  };
  document.querySelectorAll('.av-tab-btn').forEach(btn => {
    btn.onclick = () => {
      switchAvatarTab(btn.dataset.tab || 'outfit');
      sfx.playPop();
    };
  });
  document.getElementById('btn-random-avatar').onclick = () => {
    const rnd = TOTO.randomAvatarProfile(STATE.vipUnlocked, myProfile.name);
    rebuildPlayerAvatar(rnd);
    renderAvatarCustomizer();
    sfx.playPop();
  };
  document.getElementById('av-input-name').addEventListener('input', (e) => {
    const val = e.target.value.trim().slice(0, 20);
    if (val) {
      myProfile.name = val;
      TOTO.saveAvatarProfile(myProfile);
      const kNameEl = document.getElementById('k-input-name');
      if (kNameEl && (!kNameEl.value.trim() || kNameEl.dataset.autoSynced === '1')) {
        kNameEl.value = val;
        kNameEl.dataset.autoSynced = '1';
      }
      sendPresence(true);
    }
  });

  document.getElementById('btn-emotes').onclick = (e) => {
    e.stopPropagation();
    const menu = document.getElementById('emote-menu');
    const opening = menu.style.display === 'none';
    menu.style.display = opening ? 'block' : 'none';
    STATE.emoteMenuOpen = opening;
    sfx.playPop();
  };
  document.querySelectorAll('.emote-pose-btn').forEach(btn => {
    btn.onclick = () => triggerLocalEmote(btn.dataset.emote || 'wave');
  });
  document.getElementById('btn-send-chat').onclick = () => {
    const ci = document.getElementById('emote-chat-input');
    if (ci && ci.value.trim()) {
      sendQuickChat(ci.value);
      ci.value = '';
    }
  };
  document.getElementById('emote-chat-input').addEventListener('keydown', (e) => {
    if (e.code === 'Enter') {
      e.preventDefault();
      document.getElementById('btn-send-chat').click();
    }
  });

  document.getElementById('btn-landmarks').onclick = (e) => {
    e.stopPropagation();
    const m = document.getElementById('landmark-menu');
    m.style.display = m.style.display === 'none' ? 'block' : 'none';
  };
  document.getElementById('btn-cam-mode').onclick = () => setCameraMode(STATE.camMode === 1 ? 3 : 1);
  document.getElementById('btn-time').onclick = () => cycleTimeOfDay();
  document.getElementById('btn-mute').onclick = () => {
    STATE.muted = !STATE.muted;
    document.getElementById('btn-mute').style.opacity = STATE.muted ? '0.45' : '1';
    if (STATE.muted) sfx.setSizzle(0);
  };

  document.getElementById('btn-photo-mode').onclick = () => {
    clearMovementInputs();
    STATE.photoMode = true;
    STATE.selfieMode = false;
    document.getElementById('photo-selfie-poses').style.display = 'none';
    document.getElementById('btn-photo-selfie').textContent = '🤳 กล้องเซลฟี่';
    document.getElementById('hud').style.display = 'none';
    document.getElementById('photo-mode-bar').style.display = 'flex';
  };
  document.getElementById('btn-photo-selfie').onclick = () => {
    STATE.selfieMode = !STATE.selfieMode;
    document.getElementById('photo-selfie-poses').style.display = STATE.selfieMode ? 'flex' : 'none';
    document.getElementById('btn-photo-selfie').textContent = STATE.selfieMode ? '📷 มุมกล้องปกติ' : '🤳 กล้องเซลฟี่';
    if (STATE.selfieMode) {
      const d = getDressingCamDir(toto.pos);
      previewBaseYaw = Math.atan2(-d.x, -d.z);
      previewYaw = previewBaseYaw - 0.16;
      manualPreviewDrag = false;
      toto.root.visible = true;
    } else {
      dressingFillLight.visible = false;
      toto.root.rotation.y = toto.yaw;
      toto.root.visible = (STATE.camMode !== 1);
    }
    sfx.playPop();
  };
  document.querySelectorAll('.selfie-pose-btn').forEach(btn => {
    btn.onclick = () => triggerLocalEmote(btn.dataset.emote || 'wai');
  });
  document.getElementById('btn-exit-photo').onclick = () => {
    STATE.photoMode = false;
    STATE.selfieMode = false;
    dressingFillLight.visible = false;
    document.getElementById('photo-selfie-poses').style.display = 'none';
    document.getElementById('photo-mode-bar').style.display = 'none';
    document.getElementById('hud').style.display = 'block';
    toto.root.rotation.y = toto.yaw;
    toto.root.visible = (STATE.camMode !== 1);
  };
  document.getElementById('btn-photo-capture').onclick = () => {
    renderer.render(scene, camera);
    const link = document.createElement('a');
    link.download = `sa-luang-loy-krathong-${Date.now()}.png`;
    link.href = renderer.domElement.toDataURL('image/png');
    link.click();
    showCamToast('บันทึกรูปภาพสระหลวง PNG เรียบร้อยแล้ว');
  };

  document.getElementById('btn-open-krathong').onclick = openKrathongModal;
  document.getElementById('btn-skip-ritual').onclick = () => finishRitual(true);
  document.getElementById('btn-ritual-light').onclick = () => {
    if (!ritual.active || ritual.stage !== 'LIGHT') return;
    charRefs.igniteRitualKrathong(ritual.entry);
    sfx.playMatchLight();
    toto.activeEmote = 'wai';
    toto.emoteTimer = 99;
    postEmote('wai');
    ritual.wishProgress = 0;
    ritual.wishHolding = false;
    ritual.wishAutoPray = false;
    setRitualStageUI('WISH');
  };
  const wishHoldBtn = document.getElementById('btn-ritual-wish');
  wishHoldBtn.addEventListener('pointerdown', () => {
    if (ritual.active && ritual.stage === 'WISH') {
      ritual.wishHolding = true;
      ritual.wishAutoPray = true;
    }
  });
  wishHoldBtn.addEventListener('pointerup', () => { ritual.wishHolding = false; });
  wishHoldBtn.addEventListener('pointerleave', () => { ritual.wishHolding = false; });
  wishHoldBtn.addEventListener('click', () => {
    if (ritual.active && ritual.stage === 'WISH') ritual.wishAutoPray = true;
  });
  document.getElementById('btn-ritual-push').onclick = triggerRitualPush;
  document.getElementById('btn-close-sponsor').onclick = closeSponsorModal;
  document.getElementById('btn-copy-contact-line').onclick = () => {
    const lineId = (TOTO.CONTACT_INFO && TOTO.CONTACT_INFO.lineId) || 'nineza4456';
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(lineId).catch(() => {});
    showCamToast(`คัดลอก LINE ID: ${lineId} แล้ว`);
    sfx.playPop();
  };
  document.getElementById('btn-search-krathong').onclick = openSearchKrathongModal;
  document.getElementById('btn-close-search').onclick = closeSearchKrathongModal;
  document.getElementById('krathong-search-input').addEventListener('input', renderKrathongSearchList);
  document.getElementById('btn-firework').onclick = () => {
    const fx = 8 + (Math.random() - 0.5) * 32;
    const fz = 36 + (Math.random() - 0.5) * 18;
    charRefs.launchFirework(fx, fz);
    charRefs.spawnSkyLantern(fx, fz);
    postEmote('firework', { x: fx, z: fz, isVip: STATE.vipUnlocked });
  };
  document.getElementById('btn-visit-toto').onclick = () => {
    const lm = (TOTO.LANDMARKS || []).find(l => l.id === 'toto');
    warpToLandmark(lm);
  };
  document.getElementById('btn-donate-top').onclick = openDonateModal;
  document.getElementById('btn-open-donate-from-k').onclick = openDonateModal;

  document.getElementById('btn-open-cook').onclick = openCookPanel;
  document.getElementById('btn-close-cook').onclick = closeCookPanel;
  document.getElementById('btn-stir').onclick = stirPan;
  document.getElementById('btn-plate').onclick = plateFromPan;
  document.getElementById('btn-clear-pan').onclick = () => { clearPanInternal(); updateCookPanelView(); };
  document.getElementById('btn-discard').onclick = () => { STATE.carrying = null; updateCarriedVisuals(); };
  document.getElementById('btn-auto-serve-badge').onclick = () => {
    if (!STATE.carrying) return;
    const matchTbl = TABLES.find(t => t.status === 'WAITING' && t.order && t.order.id === STATE.carrying.recipe.id);
    const tbl = matchTbl || TABLES[0];
    if (helperBoy.state === 'IDLE') {
      helperBoy.state = 'TO_TABLE';
      helperBoy.targetTable = tbl;
      helperBoy.carryingDish = STATE.carrying;
      STATE.carrying = null;
      updateCarriedVisuals();
      showCamToast(`น้องเสื้อเขียวกำลังนำอาหารไปเสิร์ฟโต๊ะ ${tbl.id}`);
    }
  };

  document.getElementById('btn-close-wish').onclick = closeWishPopover;
  document.getElementById('btn-bless-krathong').onclick = blessActiveKrathong;

  document.getElementById('btn-close-krathong').onclick = closeKrathongModal;
  document.getElementById('btn-launch-krathong').onclick = launchKrathongAction;
  document.querySelectorAll('.wish-chip').forEach(chip => {
    chip.onclick = () => {
      const wi = document.getElementById('k-input-wish');
      if (wi) wi.value = chip.dataset.wish || '';
      sfx.playPop();
    };
  });

  document.getElementById('btn-close-donate').onclick = closeDonateModal;
  document.querySelectorAll('.donate-amt-btn').forEach(btn => {
    btn.onclick = () => {
      STATE.donateAmount = Number(btn.dataset.amt) || 19;
      renderDonateQR();
      sfx.playPop();
    };
  });
  document.getElementById('btn-copy-pp').onclick = () => {
    const mono = TOTO.MONETIZATION || {};
    if (mono.customQrImageUrl) {
      const link = document.createElement('a');
      link.href = mono.customQrImageUrl;
      link.download = 'saluang-support-qr.jpg';
      document.body.appendChild(link);
      link.click();
      link.remove();
      showCamToast('บันทึกรูป QR แล้ว เปิดสแกนในแอปธนาคารได้เลย');
      sfx.playPop();
      return;
    }
    const ppId = mono.promptPayId || '';
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ppId).catch(() => {});
    showCamToast(`คัดลอกเลข PromptPay: ${ppId} แล้ว`);
    sfx.playPop();
  };
  document.getElementById('btn-confirm-donate').onclick = () => {
    STATE.vipUnlocked = true;
    STATE.selectedBase = 'gold';
    try { localStorage.setItem('toto_vip_unlocked', '1'); } catch (_) {}
    closeDonateModal();
    sfx.playCash();
    showCamToast('ปลดล็อกกระทงทองคำและชุด VIP เรียบร้อยแล้ว');
    if (afterVipDonateTarget === 'avatar_vip') {
      afterVipDonateTarget = null;
      rebuildPlayerAvatar({ outfit: 'vip_gold' });
      renderAvatarCustomizer();
    } else if (STATE.krathongModalOpen) {
      renderWorkshopChoices();
    } else if (STATE.avatarModalOpen) {
      rebuildPlayerAvatar({ outfit: 'vip_gold' });
      renderAvatarCustomizer();
    } else {
      openKrathongModal();
    }
  };

  document.getElementById('btn-close-share').onclick = closeShareCardModal;
  document.getElementById('btn-download-card').onclick = downloadKeepsakeCardPNG;
  document.getElementById('btn-share-copy').onclick = () => {
    const m = lastShareMeta || { name: 'ชาวหนองไผ่', wish: 'สุขสันต์วันลอยกระทง สระหลวง หนองไผ่' };
    const msg = `ลอยกระทงออนไลน์ ณ สระหลวง อ.หนองไผ่\nโดย: ${m.name}\n"${m.wish}"\n${window.location.href}`;
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(msg).catch(() => {});
    showCamToast('คัดลอกคำอวยพรและลิงก์แล้ว');
    sfx.playPop();
  };

  // ============================================================
  // 9. MAIN 60 FPS RENDER LOOP
  // ============================================================
  const clock = new THREE.Clock();
  const camTargetPos = new THREE.Vector3();
  const camLookAt = new THREE.Vector3();
  const curLookAt = new THREE.Vector3(8, 1.0, 26);
  let particleTimer = 0;
  let fpsTimer = 0;
  let fpsFrames = 0;
  let lowFpsStrikes = 0;

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    const elapsed = clock.getElapsedTime();

    // Rolling Auto-Quality Guard: gently cap pixelRatio if frame rate dips < 28 FPS
    fpsTimer += dt;
    fpsFrames++;
    if (fpsTimer >= 2.0) {
      const avgFps = fpsFrames / fpsTimer;
      fpsTimer = 0;
      fpsFrames = 0;
      if (avgFps < 28) {
        lowFpsStrikes++;
        if (lowFpsStrikes >= 2 && renderer.getPixelRatio() > 1.0) {
          renderer.setPixelRatio(1.0);
        }
      } else {
        lowFpsStrikes = Math.max(0, lowFpsStrikes - 1);
      }
    }

    sfx.update(dt);

    // Update custom Moonlit Water Shader, Fireflies, Fountain Plumes & Mist
    if (worldRefs.waterUniforms) {
      worldRefs.waterUniforms.uTime.value = elapsed;
    }
    if (worldRefs.fountainPlumes) {
      worldRefs.fountainPlumes.forEach(fp => {
        const pulse = 0.82 + Math.sin(elapsed * 6.5 + fp.phase) * 0.24;
        fp.mesh.scale.set(1, pulse, 1);
      });
    }
    if (worldRefs.fireflyPoints && worldRefs.fireflyPoints.visible) {
      const attr = worldRefs.fireflyPoints.geometry.getAttribute('position');
      const { basePos, seeds } = worldRefs.fireflyPoints.userData;
      for (let i = 0; i < seeds.length; i++) {
        const sd = seeds[i];
        attr.array[i * 3] = basePos[i * 3] + Math.sin(elapsed * 0.65 + sd) * 1.1;
        attr.array[i * 3 + 1] = basePos[i * 3 + 1] + Math.sin(elapsed * 1.3 + sd * 1.7) * 0.38;
        attr.array[i * 3 + 2] = basePos[i * 3 + 2] + Math.cos(elapsed * 0.55 + sd) * 1.1;
      }
      attr.needsUpdate = true;
    }
    if (worldRefs.fountainMistPoints) {
      const mAttr = worldRefs.fountainMistPoints.geometry.getAttribute('position');
      const { seeds } = worldRefs.fountainMistPoints.userData;
      for (let i = 0; i < seeds.length; i++) {
        const phase = (elapsed * 0.42 + seeds[i]) % 1.0;
        mAttr.array[i * 3 + 1] = 0.25 + phase * 2.75;
      }
      mAttr.needsUpdate = true;
    }

    const heatMult = STATE.pan.active ? 1.45 : 0.85;
    worldRefs.flameMeshes.forEach(fm => {
      fm.mesh.scale.set(1, (0.75 + Math.sin(elapsed * 18 + fm.phase) * 0.32) * heatMult, 1);
    });
    if (wokFlameTimer > 0) {
      wokFlameTimer -= dt;
      worldRefs.wokFlameRing.rotation.y += dt * 8;
      if (wokFlameTimer <= 0) worldRefs.wokFlameRing.visible = false;
    }

    charRefs.updateFestivalEffects(dt, elapsed);
    updateHelperBoy(dt);

    // Smooth 60 FPS Remote Online Peer Interpolation & Avatar Animation
    for (const rp of remotePlayers.values()) {
      if (rp.emoteTimer > 0) {
        rp.emoteTimer -= dt;
        if (rp.emoteTimer <= 0) rp.activeEmote = '';
      }
      if (rp.chatTimer > 0) {
        rp.chatTimer -= dt;
        if (rp.chatTimer <= 0) rp.chatText = '';
      }
      const stepDist = rp.curPos.distanceTo(rp.targetPos);
      rp.curPos.lerp(rp.targetPos, Math.min(1, dt * 11));
      let yDiff = rp.targetYaw - rp.curYaw;
      while (yDiff > Math.PI) yDiff -= Math.PI * 2;
      while (yDiff < -Math.PI) yDiff += Math.PI * 2;
      rp.curYaw += yDiff * Math.min(1, dt * 12);
      rp.avatarRoot.rotation.y = rp.curYaw;
      const peerMoving = rp.animMoving || stepDist > 0.05;
      TOTO.animateAvatar(rp.avatarRoot, dt, elapsed, peerMoving, rp.activeEmote);
    }

    if (STATE.pan.active) {
      const rate = 100 / STATE.pan.recipe.cookTime;
      STATE.pan.progress = Math.min(120, STATE.pan.progress + rate * dt);
      displayProgress = THREE.MathUtils.lerp(displayProgress, STATE.pan.progress, Math.min(1, dt * 14));
      const p = displayProgress;
      const grow = Math.min(1, 0.48 + (p / 55) * 0.52);
      worldRefs.panFoodGroup.scale.set(grow, 1, grow);
      worldRefs.panEggGroup.visible = p >= 14;
      worldRefs.panToppingsGroup.visible = p >= 26;
      if (panFlipAnim > 0) {
        panFlipAnim += dt * 2.6;
        if (panFlipAnim >= 1) {
          panFlipAnim = 0;
          worldRefs.panFoodGroup.position.y = 0.085;
          worldRefs.panFoodGroup.rotation.x = 0;
        } else {
          worldRefs.panFoodGroup.position.y = 0.085 + Math.sin(panFlipAnim * Math.PI) * 0.36;
          worldRefs.panFoodGroup.rotation.x = panFlipAnim * Math.PI * 2;
        }
      }
      if (p >= 104 && !STATE.pan.burnt) STATE.pan.burnt = true;
      document.getElementById('fry-fill').style.width = (p / 120 * 100) + '%';
      const statusEl = document.getElementById('fry-status');
      if (p < 58) statusEl.textContent = 'กำลังทอด... กด Space ผัด!';
      else if (p <= 92) statusEl.textContent = 'กรอบพอดีแล้ว กดตักใส่จาน (E)';
      else statusEl.textContent = 'สุกจัด รีบตักหรือล้างกระทะ';

      const dCart = Math.hypot(toto.pos.x - CART_POS.x, toto.pos.z - CART_POS.z);
      sfx.setSizzle(Math.max(0.1, 1 - dCart / 12));
      particleTimer -= dt;
      if (particleTimer <= 0) {
        spawnPanParticle(Math.random() < 0.22);
        particleTimer = 0.14;
      }
    } else {
      sfx.setSizzle(0);
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.life += dt;
      if (pt.life >= pt.maxLife) {
        scene.remove(pt.mesh);
        pt.mesh.material.dispose();
        particles.splice(i, 1);
        continue;
      }
      const r = pt.life / pt.maxLife;
      pt.mesh.position.x += pt.vx * dt;
      pt.mesh.position.y += pt.vy * dt;
      pt.mesh.position.z += pt.vz * dt;
      pt.mesh.material.opacity = (1 - r) * (pt.isSpark ? 0.9 : 0.36);
    }

    // Cinematic Start Screen Orbit over Moonlit Sa Luang Pond
    if (!STATE.started) {
      const a = elapsed * 0.1;
      camera.position.set(8 + Math.sin(a) * 32, 11.5 + Math.sin(elapsed * 0.25) * 0.8, 36 + Math.cos(a) * 28);
      camera.lookAt(8, 0.8, 36);
      renderer.render(scene, camera);
      return;
    }

    if (toto.emoteTimer > 0) {
      toto.emoteTimer -= dt;
      if (toto.emoteTimer <= 0) toto.activeEmote = '';
    }
    if (toto.localChatTimer > 0) {
      toto.localChatTimer -= dt;
      if (toto.localChatTimer <= 0) toto.localChat = '';
    }

    // Stable Direct Player Walking (locked while modal / dressing room is open)
    let isMoving = false;
    if (!isModalBackdropOpen()) {
      let inpF = joyVec.y, inpR = joyVec.x;
      if (keys['KeyW'] || keys['ArrowUp']) inpF += 1;
      if (keys['KeyS'] || keys['ArrowDown']) inpF -= 1;
      if (keys['KeyD'] || keys['ArrowRight']) inpR += 1;
      if (keys['KeyA'] || keys['ArrowLeft']) inpR -= 1;

      const inpMag = Math.hypot(inpF, inpR);
      if (inpMag > 0.14) {
        krathongCamFocusTimer = 0;
        const camFwd = new THREE.Vector3(Math.sin(camYaw), 0, Math.cos(camYaw));
        const camRight = new THREE.Vector3(-camFwd.z, 0, camFwd.x);
        const moveDir = new THREE.Vector3().addScaledVector(camFwd, inpF).addScaledVector(camRight, inpR).normalize();
        const analogFactor = Math.min(1, inpMag);
        toto.pos.x += moveDir.x * 5.2 * analogFactor * dt;
        toto.pos.z += moveDir.z * 5.2 * analogFactor * dt;
        resolvePlayerCollision(toto.pos);
        if (STATE.camMode === 1) {
          toto.yaw = camYaw;
        } else {
          const targetYaw = Math.atan2(moveDir.x, moveDir.z);
          let diff = targetYaw - toto.yaw;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          toto.yaw += diff * Math.min(1, dt * 12);
        }
        isMoving = true;
        if (STATE.cookPanelOpen && !isNearCart()) closeCookPanel();
      } else if (STATE.camMode === 1) {
        toto.yaw = camYaw;
      }
    }

    if (ritual.active) {
      toto.root.visible = true;
      fpHands.visible = false;
      toto.root.rotation.y = ritual.stage === 'WISH' ? 0.25 : 0;
      TOTO.animateAvatar(toto.root, dt, elapsed, false, toto.activeEmote);

      if (ritual.stage === 'WISH') {
        const rate = ritual.wishHolding ? 1.05 : (ritual.wishAutoPray ? 0.72 : 0);
        if (rate > 0) {
          ritual.wishProgress = Math.min(1, ritual.wishProgress + dt * rate);
          document.getElementById('ritual-wish-fill').style.width = (ritual.wishProgress * 100) + '%';
          if (ritual.wishProgress >= 1) completeRitualWish();
        }
      } else if (ritual.stage === 'PUSH') {
        ritual.timingPhase += dt;
        ritual.cursorPct = 50 + Math.sin(ritual.timingPhase * 3.1) * 45;
        document.getElementById('ritual-cursor').style.left = ritual.cursorPct + '%';
      } else if (ritual.stage === 'TRACK') {
        ritual.stageTimer -= dt;
        if (ritual.stageTimer <= 0) {
          finishRitual(false);
        }
      }
    } else if (STATE.avatarModalOpen) {
      if (!manualPreviewDrag) previewYaw = previewBaseYaw + Math.sin(elapsed * 0.85) * 0.24;
      toto.root.rotation.y = previewYaw;
      TOTO.animateAvatar(toto.root, dt, elapsed, false, toto.activeEmote);
    } else if (STATE.photoMode && STATE.selfieMode) {
      toto.root.rotation.y = previewYaw;
      TOTO.animateAvatar(toto.root, dt, elapsed, false, toto.activeEmote);
    } else {
      dressingFillLight.visible = false;
      toto.root.rotation.y = toto.yaw;
      TOTO.animateAvatar(toto.root, dt, elapsed, isMoving, toto.activeEmote);
      if (isMoving) {
        toto.walkPhase += dt * 10.5;
        toto.stepTimer -= dt;
        if (toto.stepTimer <= 0) { sfx.playStep(); toto.stepTimer = 0.34; }
      }
      sendPresence(false, isMoving);
    }

    // Camera Updates
    if (ritual.active && ritual.entry && ritual.entry.mesh) {
      toto.root.visible = true;
      fpHands.visible = false;
      const kPos = ritual.entry.mesh.position;
      if (ritual.stage === 'LIGHT') {
        camTargetPos.set(7.35, 0.88, 9.45);
        camLookAt.set(6.0, 0.08, 10.15);
        dressingFillLight.visible = true;
        dressingFillLight.position.set(6.0, 0.65, 9.85);
      } else if (ritual.stage === 'WISH') {
        camTargetPos.set(5.15, 1.48, 10.35);
        camLookAt.set(6.0, 1.18, 8.05);
        dressingFillLight.visible = true;
        dressingFillLight.position.set(5.75, 1.45, 9.15);
      } else if (ritual.stage === 'PUSH') {
        camTargetPos.set(4.45, 1.82, 6.75);
        camLookAt.set(6.0, 0.42, 9.75);
        dressingFillLight.visible = true;
        dressingFillLight.position.set(5.5, 1.4, 9.2);
      } else {
        const prog = THREE.MathUtils.clamp(1 - ritual.stageTimer / 3.5, 0, 1);
        camTargetPos.set(kPos.x - 1.35, 0.95 + prog * 1.45, kPos.z - 2.65);
        camLookAt.set(kPos.x + 0.2, 0.30, kPos.z + 4.8);
        dressingFillLight.visible = false;
      }
      camera.position.lerp(camTargetPos, Math.min(1, dt * 6));
      curLookAt.lerp(camLookAt, Math.min(1, dt * 7));
      camera.lookAt(curLookAt);
    } else if (STATE.avatarModalOpen) {
      toto.root.visible = true;
      fpHands.visible = false;
      const fwd = getDressingCamDir(toto.pos);
      const right = new THREE.Vector3(-fwd.z, 0, fwd.x);
      const mobileSheet = window.innerWidth <= 760;
      const shift = mobileSheet ? 0 : 0.62;
      const targetY = mobileSheet ? 0.72 : 1.04;
      camTargetPos.set(
        toto.pos.x - fwd.x * 2.75 + right.x * shift,
        mobileSheet ? 1.48 : 1.38,
        toto.pos.z - fwd.z * 2.75 + right.z * shift
      );
      dressingFillLight.visible = true;
      dressingFillLight.position.set(camTargetPos.x, 1.85, camTargetPos.z);
      camera.position.lerp(camTargetPos, Math.min(1, dt * 8));
      camLookAt.set(
        toto.pos.x + fwd.x * 0.5 + right.x * shift,
        targetY,
        toto.pos.z + fwd.z * 0.5 + right.z * shift
      );
      curLookAt.lerp(camLookAt, Math.min(1, dt * 10));
      camera.lookAt(curLookAt);
    } else if (STATE.photoMode && STATE.selfieMode) {
      toto.root.visible = true;
      fpHands.visible = false;
      const fwd = getDressingCamDir(toto.pos);
      camTargetPos.set(toto.pos.x - fwd.x * 2.45, 1.48, toto.pos.z - fwd.z * 2.45);
      dressingFillLight.visible = true;
      dressingFillLight.position.set(camTargetPos.x, 1.82, camTargetPos.z);
      camera.position.lerp(camTargetPos, Math.min(1, dt * 8));
      camLookAt.set(toto.pos.x + fwd.x * 0.3, 1.18, toto.pos.z + fwd.z * 0.3);
      curLookAt.lerp(camLookAt, Math.min(1, dt * 10));
      camera.lookAt(curLookAt);
    } else if (krathongCamFocusTimer > 0) {
      krathongCamFocusTimer -= dt;
      camTargetPos.set(6, 2.2, 5.8);
      camera.position.lerp(camTargetPos, Math.min(1, dt * 4));
      camLookAt.set(8, 0.2, 24);
      curLookAt.lerp(camLookAt, Math.min(1, dt * 5));
      camera.lookAt(curLookAt);
    } else if (STATE.camMode === 1) {
      if (STATE.started && hoverOnCanvas && !isModalBackdropOpen()) {
        const vp = getViewportSize();
        if (hoverX < 85) camYaw += ((85 - hoverX) / 85) * 1.85 * dt;
        else if (hoverX > vp.w - 85) camYaw -= ((hoverX - (vp.w - 85)) / 85) * 1.85 * dt;
      }
      toto.root.visible = false;
      fpHands.visible = !!(STATE.cookPanelOpen || STATE.carrying);
      camera.position.set(
        toto.pos.x,
        1.76 + (isMoving ? Math.sin(toto.walkPhase * 2) * 0.025 : 0),
        toto.pos.z
      );
      const lookDir = new THREE.Vector3(
        Math.sin(camYaw) * Math.cos(camPitch),
        Math.sin(camPitch),
        Math.cos(camYaw) * Math.cos(camPitch)
      );
      camera.lookAt(camera.position.clone().add(lookDir));
    } else {
      toto.root.visible = true;
      fpHands.visible = false;
      const dist = isEffectivePortrait() ? 6.8 : 5.4;
      const horiz = Math.cos(camPitch) * dist;
      camTargetPos.set(
        toto.pos.x - Math.sin(camYaw) * horiz,
        Math.max(1.25, 1.78 + Math.sin(camPitch) * dist + 0.65),
        toto.pos.z - Math.cos(camYaw) * horiz
      );
      camera.position.lerp(camTargetPos, Math.min(1, dt * 8));
      camLookAt.set(toto.pos.x, 1.35, toto.pos.z);
      curLookAt.lerp(camLookAt, Math.min(1, dt * 10));
      camera.lookAt(curLookAt);
    }

    updateCustomers(dt, elapsed);
    updateProjectedLabels();
    renderer.render(scene, camera);
  }

  function hbWalk(p) { return p; }

  window.addEventListener('resize', () => {
    const vp = getViewportSize();
    camera.fov = isEffectivePortrait() ? 68 : 56;
    camera.aspect = vp.w / vp.h;
    camera.updateProjectionMatrix();
    renderer.setSize(vp.w, vp.h);
  });

  animate();
})();

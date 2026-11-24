(function () {
  'use strict';

  const TOTO = (window.TOTO = window.TOTO || {});

  function createLimb(radius, length, mat) {
    const g = new THREE.Group();
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 0.9, length, 7), mat);
    cyl.position.y = -length / 2;
    const joint = new THREE.Mesh(new THREE.SphereGeometry(radius, 7, 7), mat);
    g.add(cyl, joint);
    return g;
  }

  function createSpatula(stainlessMat) {
    const g = new THREE.Group();
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.014, 0.16, 6), new THREE.MeshStandardMaterial({ color: 0x854d27, roughness: 0.7 }));
    handle.rotation.x = Math.PI / 2;
    handle.position.z = 0.08;
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.24, 6), stainlessMat);
    shaft.rotation.x = Math.PI / 2;
    shaft.position.z = 0.26;
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.008, 0.11), stainlessMat);
    blade.position.set(0, -0.01, 0.41);
    blade.rotation.x = 0.22;
    g.add(handle, shaft, blade);
    return g;
  }

  // ============================================================
  // 1. DETAILED LAYERED 3D KRATHONG WORKSHOP BUILDER
  // ============================================================
  function createKrathongMesh(baseId, flowerId, isVip, candleId, toppingId) {
    const baseKey = baseId || (isVip ? 'gold' : 'banana');
    const flowerKey = flowerId || 'lotus';
    const candleKey = candleId || 'gold';
    const toppingKey = toppingId || 'coin';
    const g = new THREE.Group();

    const isGold = baseKey === 'gold' || !!isVip;
    const baseColor = isGold ? 0xd4af6a : (baseKey === 'coconut' ? 0x5c3a21 : (baseKey === 'bread' ? 0xd99b43 : 0x166534));
    const trunkMat = new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: isGold ? 0.25 : 0.72,
      metalness: isGold ? 0.78 : 0.05
    });

    // Inner core base
    const core = new THREE.Mesh(
      baseKey === 'coconut'
        ? new THREE.SphereGeometry(0.22, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2)
        : new THREE.CylinderGeometry(0.22, 0.18, 0.085, 14),
      trunkMat
    );
    core.position.y = baseKey === 'coconut' ? 0.11 : 0.045;
    g.add(core);

    // Double-tier radial folded banana leaf cones (or fluted golden petals / scalloped bread)
    const leafMat = new THREE.MeshStandardMaterial({
      color: isGold ? 0xf3d179 : (baseKey === 'coconut' ? 0x15803d : (baseKey === 'bread' ? 0xf59e0b : 0x228b22)),
      roughness: isGold ? 0.28 : 0.58,
      metalness: isGold ? 0.75 : 0.05
    });

    const outerCount = 12;
    for (let i = 0; i < outerCount; i++) {
      const a = (i / outerCount) * Math.PI * 2;
      const petal = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.13, 4), leafMat);
      petal.position.set(Math.cos(a) * 0.21, 0.085, Math.sin(a) * 0.21);
      petal.rotation.z = -Math.cos(a) * 0.45;
      petal.rotation.x = Math.sin(a) * 0.45;
      g.add(petal);
    }

    const innerCount = 8;
    for (let i = 0; i < innerCount; i++) {
      const a = ((i + 0.5) / innerCount) * Math.PI * 2;
      const petal = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.11, 4), leafMat);
      petal.position.set(Math.cos(a) * 0.145, 0.11, Math.sin(a) * 0.145);
      petal.rotation.z = -Math.cos(a) * 0.25;
      petal.rotation.x = Math.sin(a) * 0.25;
      g.add(petal);
    }

    // Flower arrangement circle
    const fCol = flowerKey === 'marigold' ? 0xfacc15
      : (flowerKey === 'orchid' ? 0xa855f7
      : (flowerKey === 'globe' ? 0xe11d48 : 0xf472b6));
    const flowerMat = new THREE.MeshStandardMaterial({ color: fCol, roughness: 0.45 });
    const centerDotMat = flowerKey === 'globe' ? new THREE.MeshBasicMaterial({ color: 0xfde047 }) : null;
    const blossomCount = 8;
    for (let i = 0; i < blossomCount; i++) {
      const a = (i / blossomCount) * Math.PI * 2;
      const geom = flowerKey === 'lotus'
        ? new THREE.ConeGeometry(0.042, 0.075, 5)
        : new THREE.SphereGeometry(flowerKey === 'globe' ? 0.036 : 0.042, 6, 6);
      const blossom = new THREE.Mesh(geom, flowerMat);
      blossom.position.set(Math.cos(a) * 0.11, 0.125, Math.sin(a) * 0.11);
      if (flowerKey === 'lotus') {
        blossom.rotation.z = -Math.cos(a) * 0.2;
        blossom.rotation.x = Math.sin(a) * 0.2;
      } else if (flowerKey === 'globe' && centerDotMat) {
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.011, 4, 4), centerDotMat);
        dot.position.set(Math.cos(a) * 0.11, 0.155, Math.sin(a) * 0.11);
        g.add(dot);
      }
      g.add(blossom);
    }

    // Center candle (tinted by user-selected auspicious candle color) + flickering flame
    const candleHexMap = { gold: 0xfef08a, pink: 0xf9a8d4, red: 0xf87171, white: 0xf8fafc };
    const candleMat = new THREE.MeshStandardMaterial({
      color: candleHexMap[candleKey] || 0xfef08a,
      emissive: candleHexMap[candleKey] || 0xfef08a,
      emissiveIntensity: 0.22,
      roughness: 0.4
    });
    const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.019, 0.16, 8), candleMat);
    candle.position.y = 0.16;
    const flame = new THREE.Mesh(
      new THREE.SphereGeometry(0.028, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xffb703 })
    );
    flame.scale.set(0.7, 1.5, 0.7);
    flame.position.y = 0.255;
    g.add(candle, flame);

    // 3 Incense sticks with subtle glowing red ember tips
    const incenseStickMat = new THREE.MeshBasicMaterial({ color: 0x7c2d12 });
    const emberMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const embers = [];
    [-0.025, 0, 0.025].forEach((ix, idx) => {
      const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.22, 4), incenseStickMat);
      stick.position.set(ix, 0.19, idx === 1 ? -0.02 : 0.01);
      stick.rotation.z = -ix * 1.8;
      const ember = new THREE.Mesh(new THREE.SphereGeometry(0.008, 4, 4), emberMat);
      ember.position.set(ix * 1.4, 0.295, idx === 1 ? -0.02 : 0.01);
      embers.push(ember);
      g.add(stick, ember);
    });

    // Handmade ornament / auspicious topping (lightweight 2-6 primitives, zero extra lights)
    if (toppingKey === 'coin') {
      const coinMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.85, roughness: 0.2 });
      for (let c = 0; c < 3; c++) {
        const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.006, 10), coinMat);
        coin.position.set(c === 1 ? 0.014 : -0.008, 0.102 + c * 0.007, 0.072);
        g.add(coin);
      }
    } else if (toppingKey === 'swan') {
      const swanMat = new THREE.MeshStandardMaterial({ color: 0xecfccb, roughness: 0.42 });
      const wingMat = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.48 });
      const beakMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
      const swanGrp = new THREE.Group();
      const sBody = new THREE.Mesh(new THREE.SphereGeometry(0.036, 7, 6), swanMat);
      sBody.scale.set(0.85, 0.72, 1.35);
      const sNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.011, 0.072, 6), swanMat);
      sNeck.position.set(0, 0.042, 0.034);
      sNeck.rotation.x = 0.25;
      const sHead = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), swanMat);
      sHead.position.set(0, 0.076, 0.046);
      const sBeak = new THREE.Mesh(new THREE.ConeGeometry(0.006, 0.018, 4), beakMat);
      sBeak.rotation.x = Math.PI / 2;
      sBeak.position.set(0, 0.074, 0.062);
      const wL = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.048, 4), wingMat);
      wL.rotation.set(-0.5, 0, -0.35);
      wL.position.set(-0.026, 0.024, -0.01);
      const wR = wL.clone();
      wR.rotation.z = 0.35;
      wR.position.x = 0.026;
      swanGrp.add(sBody, sNeck, sHead, sBeak, wL, wR);
      swanGrp.position.set(0.056, 0.118, 0.052);
      swanGrp.rotation.y = -0.55;
      g.add(swanGrp);
    } else if (toppingKey === 'garland') {
      const jasmineMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
      const roseMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.42 });
      const torus = new THREE.Mesh(new THREE.TorusGeometry(0.066, 0.013, 6, 14), jasmineMat);
      torus.rotation.x = Math.PI / 2;
      torus.position.y = 0.114;
      const roseFront = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 6), roseMat);
      roseFront.position.set(0, 0.122, 0.066);
      const roseBack = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 6), roseMat);
      roseBack.position.set(0, 0.122, -0.066);
      g.add(torus, roseFront, roseBack);
    } else if (toppingKey === 'lotus_bud') {
      const budMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.4 });
      const cupMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.55 });
      [-1, 1].forEach(side => {
        const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.014, 0.024, 6), cupMat);
        cup.position.set(side * 0.056, 0.112, 0.042);
        const bud = new THREE.Mesh(new THREE.ConeGeometry(0.024, 0.068, 6), budMat);
        bud.position.set(side * 0.058, 0.148, 0.044);
        bud.rotation.z = -side * 0.18;
        g.add(cup, bud);
      });
    } else if (toppingKey === 'sparkler') {
      const stickMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.6, roughness: 0.3 });
      const tipMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      const spStick = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.22, 5), stickMat);
      spStick.position.set(0.055, 0.19, 0.032);
      spStick.rotation.z = -0.22;
      spStick.rotation.x = 0.14;
      const spStar = new THREE.Mesh(new THREE.OctahedronGeometry(0.022, 0), tipMat);
      spStar.position.set(0.08, 0.295, 0.048);
      const spGlow = TOTO.addGlowSprite(g, 0.08, 0.295, 0.048, 0.44, TOTO.textures.warmGlowTex, 0.85);
      g.userData.sparklerTip = spStar;
      g.userData.sparklerGlow = spGlow;
      g.add(spStick, spStar);
    }

    // Subtle soft water ripple ring around the base
    const rippleRing = new THREE.Mesh(
      new THREE.RingGeometry(0.24, 0.34, 18),
      new THREE.MeshBasicMaterial({ color: isGold ? 0xd4af6a : 0xe2e8f0, transparent: true, opacity: 0.32, side: THREE.DoubleSide })
    );
    rippleRing.rotation.x = -Math.PI / 2;
    rippleRing.position.y = 0.012;
    g.add(rippleRing);

    if (isGold) {
      const vipRing = new THREE.Mesh(
        new THREE.RingGeometry(0.36, 0.41, 20),
        new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.45, side: THREE.DoubleSide })
      );
      vipRing.rotation.x = -Math.PI / 2;
      vipRing.position.y = 0.015;
      g.add(vipRing);
    }

    const glowSprite = TOTO.addGlowSprite(g, 0, 0.26, 0, isGold ? 1.45 : 0.95, TOTO.textures.warmGlowTex, isGold ? 0.9 : 0.78);
    g.userData.flame = flame;
    g.userData.embers = embers;
    g.userData.glowSprite = glowSprite;
    g.userData.rippleRing = rippleRing;
    return g;
  }
  TOTO.createKrathongMesh = createKrathongMesh;

  function setKrathongLit(mesh, isLit) {
    if (!mesh || !mesh.userData) return;
    if (mesh.userData.flame) mesh.userData.flame.visible = !!isLit;
    if (mesh.userData.glowSprite) mesh.userData.glowSprite.visible = !!isLit;
    if (Array.isArray(mesh.userData.embers)) {
      mesh.userData.embers.forEach(e => { e.visible = !!isLit; });
    }
  }

  // ============================================================
  // 2. 3D DISH MESH BUILDER (6 MENU ITEMS)
  // ============================================================
  function createDishMesh(recipeId, isBurnt, isDirty) {
    const g = new THREE.Group();
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.13, 0.022, 12), new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.3 }));
    plate.position.y = 0.011;
    g.add(plate);

    if (isDirty) {
      const smudge = new THREE.Mesh(new THREE.CircleGeometry(0.08, 8), new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.5 }));
      smudge.rotation.x = -Math.PI / 2;
      smudge.position.y = 0.024;
      const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.005, 0.24, 5), new THREE.MeshStandardMaterial({ color: 0xd4a373 }));
      stick.rotation.z = Math.PI / 2;
      stick.position.set(0.02, 0.032, 0.02);
      g.add(smudge, stick);
      return g;
    }

    const burntCol = 0x261a14;
    if (recipeId === 'hoitod' || recipeId === 'hoitodtalay') {
      const batter = new THREE.Mesh(
        new THREE.CylinderGeometry(0.13, 0.14, 0.026, 10),
        new THREE.MeshStandardMaterial({ color: isBurnt ? burntCol : (recipeId === 'hoitodtalay' ? 0xd97706 : 0xe08b2b), roughness: 0.85 })
      );
      batter.position.y = 0.04;
      g.add(batter);
      for (let m = 0; m < 5; m++) {
        const a = (m / 5) * Math.PI * 2;
        const col = recipeId === 'hoitodtalay' && m % 2 === 0 ? 0xf97316 : 0x5c3a21;
        const piece = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 5), new THREE.MeshStandardMaterial({ color: isBurnt ? 0x1a1412 : col }));
        piece.scale.set(1.2, 0.65, 0.85);
        piece.position.set(Math.cos(a) * 0.065, 0.058, Math.sin(a) * 0.065);
        g.add(piece);
      }
      const chiliCup = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.025, 0.025, 7), new THREE.MeshStandardMaterial({ color: 0xdc2626 }));
      chiliCup.position.set(0.11, 0.035, 0.08);
      g.add(chiliCup);
    } else if (recipeId === 'orsuan') {
      const soft = new THREE.Mesh(new THREE.SphereGeometry(0.135, 10, 8), new THREE.MeshStandardMaterial({ color: isBurnt ? burntCol : 0xeec665, roughness: 0.25 }));
      soft.scale.set(1.0, 0.28, 0.95);
      soft.position.y = 0.042;
      g.add(soft);
    } else if (recipeId === 'padthaihor') {
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.135, 10, 8), new THREE.MeshStandardMaterial({ color: isBurnt ? burntCol : 0xfacc15, roughness: 0.45 }));
      dome.scale.set(1.05, 0.48, 0.9);
      dome.position.y = 0.052;
      const peek = new THREE.Mesh(new THREE.SphereGeometry(0.055, 7, 7), new THREE.MeshStandardMaterial({ color: 0xd94e1f }));
      peek.scale.set(1.2, 0.4, 0.7);
      peek.position.set(0, 0.095, 0);
      g.add(dome, peek);
    } else {
      const noodleCol = recipeId === 'padthaishrimp' ? 0xd95f27 : 0xc07a32;
      const mound = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), new THREE.MeshStandardMaterial({ color: isBurnt ? burntCol : noodleCol, roughness: 0.72 }));
      mound.scale.set(1.05, 0.46, 0.95);
      mound.position.y = 0.05;
      g.add(mound);
    }

    return g;
  }

  TOTO.createKrathongMesh = createKrathongMesh;
  TOTO.createDishMesh = createDishMesh;

  // ============================================================
  // 3. CHARACTERS (TOTO, GREEN-SHIRT HELPER BOY, SWEEPER) & REAL-SCALE FESTIVAL
  // ============================================================
  TOTO.createCharactersAndFestival = function (scene, worldRefs) {
    const stainlessMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.8, roughness: 0.25 });

    function createToto() {
      const root = new THREE.Group();
      const skinMat = new THREE.MeshStandardMaterial({ color: 0xe6b58f, roughness: 0.65 });
      const shirtMat = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.8 });
      const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.85 });
      const shoeMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.7 });
      const hairMat = new THREE.MeshStandardMaterial({ color: 0x141418, roughness: 0.85 });
      const apronMat = new THREE.MeshStandardMaterial({ map: TOTO.textures.createApronTexture(), roughness: 0.88 });
      const maskWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.75 });

      const leftLeg = createLimb(0.082, 0.74, pantsMat);
      leftLeg.position.set(-0.12, 0.78, 0);
      const rightLeg = createLimb(0.082, 0.74, pantsMat);
      rightLeg.position.set(0.12, 0.78, 0);

      const lShoe = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.26), shoeMat);
      lShoe.position.set(0, -0.74, 0.05);
      leftLeg.add(lShoe);
      const rShoe = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.26), shoeMat);
      rShoe.position.set(0, -0.74, 0.05);
      rightLeg.add(rShoe);

      const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.20, 0.62, 10), shirtMat);
      torso.scale.set(1.15, 1, 0.78);
      torso.position.y = 1.12;

      const apronFront = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.74, 0.03), apronMat);
      apronFront.position.set(0, 0.96, 0.175);

      const headGroup = new THREE.Group();
      headGroup.position.set(0, 1.58, 0);
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.12, 7), skinMat);
      neck.position.y = -0.11;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.175, 12, 10), skinMat);
      head.scale.set(0.95, 1.05, 0.96);
      const hairTop = new THREE.Mesh(new THREE.SphereGeometry(0.184, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.58), hairMat);
      hairTop.position.set(0, 0.025, -0.015);
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111827 });
      [-0.06, 0.06].forEach(ex => {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.017, 5, 5), eyeMat);
        eye.position.set(ex, 0.025, 0.155);
        headGroup.add(eye);
      });
      const whiteMask = new THREE.Mesh(
        new THREE.CylinderGeometry(0.168, 0.155, 0.115, 10, 1, false, -Math.PI * 0.42, Math.PI * 0.84),
        maskWhiteMat
      );
      whiteMask.position.set(0, -0.052, 0.022);
      headGroup.add(neck, head, hairTop, whiteMask);

      const leftArm = createLimb(0.062, 0.54, skinMat);
      leftArm.position.set(-0.29, 1.37, 0);
      const rightArm = createLimb(0.062, 0.54, skinMat);
      rightArm.position.set(0.29, 1.37, 0);

      const leftSpatula = createSpatula(stainlessMat);
      leftSpatula.position.set(0, -0.52, 0.04);
      leftSpatula.visible = false;
      leftArm.add(leftSpatula);

      const rightSpatula = createSpatula(stainlessMat);
      rightSpatula.position.set(0, -0.52, 0.04);
      rightSpatula.visible = false;
      rightArm.add(rightSpatula);

      const carryAnchor = new THREE.Group();
      carryAnchor.position.set(0, 1.06, 0.44);
      root.add(carryAnchor);

      const shadowMat = new THREE.MeshBasicMaterial({ map: TOTO.textures.contactShadowTex, transparent: true, depthWrite: false });
      const totoShadow = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.95), shadowMat);
      totoShadow.rotation.x = -Math.PI / 2;
      totoShadow.position.y = 0.02;

      root.add(leftLeg, rightLeg, torso, apronFront, headGroup, leftArm, rightArm, totoShadow);
      scene.add(root);

      return {
        root, headGroup, leftLeg, rightLeg, leftArm, rightArm,
        leftSpatula, rightSpatula, carryAnchor,
        pos: root.position,
        yaw: 0.08,
        walkPhase: 0,
        stirAnim: 0,
        stepTimer: 0
      };
    }

    const toto = createToto();
    toto.pos.set(TOTO.LOCATIONS.CART_STAND.x, 0, TOTO.LOCATIONS.CART_STAND.z);
    toto.root.rotation.y = 0.08;

    // Green-Shirt Helper Boy stationed beside Toto's stall at (-13.8, 0, -2.95)
    function createGreenShirtHelperBoy() {
      const root = new THREE.Group();
      const skinMat = new THREE.MeshStandardMaterial({ color: 0xf2ccb0, roughness: 0.65 });
      const greenJerseyMat = new THREE.MeshStandardMaterial({ color: 0x0d9488, roughness: 0.75 });
      const shortsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 });
      const hairMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.85 });

      const body = new THREE.Group();
      body.scale.set(0.75, 0.75, 0.75);
      const leftLeg = createLimb(0.075, 0.68, skinMat);
      leftLeg.position.set(-0.11, 0.7, 0);
      const rightLeg = createLimb(0.075, 0.68, skinMat);
      rightLeg.position.set(0.11, 0.7, 0);
      const shorts = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.28, 8), shortsMat);
      shorts.position.y = 0.68;
      const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.18, 0.56, 8), greenJerseyMat);
      torso.position.y = 1.04;
      const collar = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.018, 6, 10), new THREE.MeshStandardMaterial({ color: 0xfacc15 }));
      collar.rotation.x = Math.PI / 2;
      collar.position.y = 1.32;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), skinMat);
      head.position.set(0, 1.5, 0);
      const hair = new THREE.Mesh(new THREE.SphereGeometry(0.19, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.58), hairMat);
      hair.position.set(0, 1.52, -0.01);
      const eyeM = new THREE.MeshBasicMaterial({ color: 0x111827 });
      [-0.055, 0.055].forEach(ex => {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.017, 5, 5), eyeM);
        eye.position.set(ex, 1.51, 0.16);
        body.add(eye);
      });
      const leftArm = createLimb(0.056, 0.48, skinMat);
      leftArm.position.set(-0.25, 1.28, 0);
      const rightArm = createLimb(0.056, 0.48, skinMat);
      rightArm.position.set(0.25, 1.28, 0);
      const carryAnchor = new THREE.Group();
      carryAnchor.position.set(0, 0.98, 0.42);
      body.add(carryAnchor);
      body.add(leftLeg, rightLeg, shorts, torso, collar, head, hair, leftArm, rightArm);
      const hShadow = new THREE.Mesh(
        new THREE.PlaneGeometry(0.75, 0.75),
        new THREE.MeshBasicMaterial({ map: TOTO.textures.contactShadowTex, transparent: true, depthWrite: false })
      );
      hShadow.rotation.x = -Math.PI / 2;
      hShadow.position.y = 0.02;
      root.add(body, hShadow);
      scene.add(root);

      const homePos = new THREE.Vector3(-13.8, 0, -2.95);
      root.position.copy(homePos);

      return {
        root, leftLeg, rightLeg, leftArm, rightArm, carryAnchor,
        homePos,
        pos: root.position,
        walkPhase: 0,
        state: 'IDLE',
        targetTable: null,
        carryingDish: null
      };
    }

    const helperBoy = createGreenShirtHelperBoy();

    const fpHands = new THREE.Group();
    const fpSkinMat = new THREE.MeshStandardMaterial({ color: 0xe6b58f, roughness: 0.65 });
    const fpLeft = new THREE.Group();
    fpLeft.position.set(-0.28, -0.32, -0.45);
    const fpLeftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.042, 0.36, 7), fpSkinMat);
    fpLeftArm.rotation.x = Math.PI / 2.3;
    const fpLeftSpat = createSpatula(stainlessMat);
    fpLeftSpat.position.set(0, 0.04, -0.05);
    fpLeftSpat.rotation.x = -0.35;
    fpLeft.add(fpLeftArm, fpLeftSpat);

    const fpRight = new THREE.Group();
    fpRight.position.set(0.28, -0.32, -0.45);
    const fpRightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.042, 0.36, 7), fpSkinMat);
    fpRightArm.rotation.x = Math.PI / 2.3;
    const fpRightSpat = createSpatula(stainlessMat);
    fpRightSpat.position.set(0, 0.04, -0.05);
    fpRightSpat.rotation.x = -0.35;
    fpRight.add(fpRightArm, fpRightSpat);

    const fpPlateAnchor = new THREE.Group();
    fpPlateAnchor.position.set(0, -0.25, -0.55);
    fpHands.add(fpLeft, fpRight, fpPlateAnchor);
    fpHands.visible = false;

    // Municipal Street Sweeper beside Blue Bin in front of Silver Pickup (-9.4, 0, 3.9)
    const sweeper = new THREE.Group();
    const swTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.21, 0.6, 7), new THREE.MeshStandardMaterial({ color: 0x1d4ed8 }));
    swTorso.position.y = 1.04;
    const swHead = new THREE.Mesh(new THREE.SphereGeometry(0.155, 8, 8), new THREE.MeshStandardMaterial({ color: 0xdba67e }));
    swHead.position.y = 1.48;
    const swHat = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.14, 8), new THREE.MeshStandardMaterial({ color: 0x334155 }));
    swHat.position.y = 1.62;
    const swLegs = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.72, 7), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
    swLegs.position.y = 0.36;
    const broomGroup = new THREE.Group();
    broomGroup.position.set(0.24, 0.95, 0.25);
    const broomStick = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 1.3, 5), new THREE.MeshStandardMaterial({ color: 0xa16207 }));
    broomStick.rotation.x = 0.55;
    broomStick.position.y = -0.3;
    const broomBrush = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.28, 5), new THREE.MeshStandardMaterial({ color: 0x854d0e }));
    broomBrush.position.set(0, -0.82, 0.35);
    broomGroup.add(broomStick, broomBrush);
    const swShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(0.9, 0.9),
      new THREE.MeshBasicMaterial({ map: TOTO.textures.contactShadowTex, transparent: true, depthWrite: false })
    );
    swShadow.rotation.x = -Math.PI / 2;
    swShadow.position.y = 0.02;
    sweeper.add(swTorso, swHead, swHat, swLegs, broomGroup, swShadow);
    sweeper.position.set(-9.4, 0, 3.9);
    sweeper.rotation.y = 0.45;
    scene.add(sweeper);

    // Festival Visitors & Customer Generator
    const shirtPalette = [0xe11d48, 0x0284c7, 0x7c3aed, 0x16a34a, 0xd97706, 0xec4899, 0x0f766e, 0xf59e0b];
    const pantsPalette = [0x1e293b, 0x334155, 0x3f3f46, 0x1e3a8a, 0x57534e];

    function createCustomerMesh(withKrathong) {
      const g = new THREE.Group();
      const skinCol = [0xe8bc96, 0xdba67e, 0xf2ccb0][Math.floor(Math.random() * 3)];
      const skinMat = new THREE.MeshStandardMaterial({ color: skinCol, roughness: 0.68 });
      const shirtMat = new THREE.MeshStandardMaterial({ color: shirtPalette[Math.floor(Math.random() * shirtPalette.length)], roughness: 0.82 });
      const pantsMat = new THREE.MeshStandardMaterial({ color: pantsPalette[Math.floor(Math.random() * pantsPalette.length)], roughness: 0.85 });
      const hairMat = new THREE.MeshStandardMaterial({ color: Math.random() > 0.25 ? 0x18181b : 0x3b2416, roughness: 0.85 });

      const bodyGroup = new THREE.Group();
      const leftLeg = createLimb(0.075, 0.72, pantsMat);
      leftLeg.position.set(-0.11, 0.74, 0);
      const rightLeg = createLimb(0.075, 0.72, pantsMat);
      rightLeg.position.set(0.11, 0.74, 0);
      const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.19, 0.58, 8), shirtMat);
      torso.scale.set(1.1, 1, 0.76);
      torso.position.y = 1.06;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.165, 10, 8), skinMat);
      head.position.set(0, 1.50, 0);
      const hair = new THREE.Mesh(new THREE.SphereGeometry(0.175, 8, 7, 0, Math.PI * 2, 0, Math.PI * 0.6), hairMat);
      hair.position.set(0, 1.52, -0.01);
      const leftArm = createLimb(0.056, 0.5, skinMat);
      leftArm.position.set(-0.26, 1.30, 0);
      const rightArm = createLimb(0.056, 0.5, skinMat);
      rightArm.position.set(0.26, 1.30, 0);

      let heldKrathong = null;
      if (withKrathong) {
        heldKrathong = createKrathongMesh('banana', Math.random() > 0.5 ? 'lotus' : 'marigold', false);
        heldKrathong.scale.set(0.76, 0.76, 0.76);
        heldKrathong.position.set(0, 0.92, 0.34);
        bodyGroup.add(heldKrathong);
      }

      bodyGroup.add(leftLeg, rightLeg, torso, head, hair, leftArm, rightArm);
      const custShadow = new THREE.Mesh(
        new THREE.PlaneGeometry(0.88, 0.88),
        new THREE.MeshBasicMaterial({ map: TOTO.textures.contactShadowTex, transparent: true, depthWrite: false })
      );
      custShadow.rotation.x = -Math.PI / 2;
      custShadow.position.y = 0.02;
      g.add(bodyGroup, custShadow);
      scene.add(g);

      return {
        root: g,
        bodyGroup,
        leftLeg,
        rightLeg,
        leftArm,
        rightArm,
        heldKrathong,
        walkPhase: 0,
        targetPos: new THREE.Vector3(),
        stage: 0
      };
    }

    // Real-scale promenade visitors along South (Z=6.3) & North (Z=65.8) promenades
    const parkStrollers = [
      { char: createCustomerMesh(true), x: -24, z: 6.3, dir: 1, speed: 1.55 },
      { char: createCustomerMesh(true), x: 34, z: 6.3, dir: -1, speed: 1.35 },
      { char: createCustomerMesh(true), x: -12, z: 65.8, dir: 1, speed: 1.45 }
    ];
    parkStrollers.forEach(ps => {
      ps.char.root.position.set(ps.x, 0.22, ps.z);
    });

    const trafficVehicles = [];
    function createMotorbike(dir) {
      const g = new THREE.Group();
      const bodyCol = [0xdc2626, 0x2563eb, 0xf59e0b, 0xf8fafc][Math.floor(Math.random() * 4)];
      const frame = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.45, 0.42), new THREE.MeshStandardMaterial({ color: bodyCol, roughness: 0.4 }));
      frame.position.y = 0.55;
      const rider = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.16, 0.65, 7), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
      rider.position.set(-0.1, 1.05, 0);
      const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.17, 7, 7), new THREE.MeshStandardMaterial({ color: 0xf8fafc }));
      helmet.position.set(-0.08, 1.48, 0);
      g.add(frame, rider, helmet);
      g.rotation.y = dir > 0 ? 0 : Math.PI;
      g.position.set(dir > 0 ? -52 : 66, 0, dir > 0 ? 1.85 : -0.35);
      worldRefs.world.add(g);
      trafficVehicles.push({ mesh: g, dir, speed: 7.2 + Math.random() * 4.0 });
    }
    createMotorbike(1);
    createMotorbike(-1);

    const pondKrathongs = [];
    const skyLanterns = [];
    const fireworks = [];
    const ritualSparkles = [];
    const knownKrathongIds = new Set();

    function createKrathongWishTag(item) {
      const el = document.createElement('div');
      el.className = 'krathong-wish-tag' + (item.isVip ? ' vip' : '');
      el.style.display = 'none';
      const safeName = String(item.name || 'ชาวหนองไผ่').replace(/</g, '&lt;');
      const blessCount = Number(item.blessings) || 0;
      el.innerHTML = `<span class="kw-name">${item.isVip ? '✨ ' : ''}${safeName}</span>` +
        (blessCount > 0 ? `<span class="kw-bless">♡ ${blessCount}</span>` : '');
      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (TOTO.onSelectKrathongWish) {
          TOTO.onSelectKrathongWish(item);
        }
      });
      document.getElementById('world-labels').appendChild(el);
      return el;
    }

    function addPondKrathongObject(item, fromPier, onArrive) {
      const baseId = item.isVip ? 'gold' : (item.baseId || 'banana');
      const flowerId = item.flowerId || (item.typeId === 'marigold' ? 'marigold' : 'lotus');
      const candleId = item.candleId || 'gold';
      const toppingId = item.toppingId || 'coin';
      const mesh = createKrathongMesh(baseId, flowerId, !!item.isVip, candleId, toppingId);
      if (item.isVip) mesh.scale.set(1.42, 1.42, 1.42);
      else if (fromPier) mesh.scale.set(1.22, 1.22, 1.22);

      if (fromPier) {
        mesh.position.set(TOTO.LOCATIONS.POND_LAUNCH.x, TOTO.LOCATIONS.POND_LAUNCH.y, TOTO.LOCATIONS.POND_LAUNCH.z);
      } else {
        mesh.position.set(
          typeof item.x === 'number' ? item.x : (Math.random() * 76 - 30),
          -0.18,
          typeof item.z === 'number' ? item.z : (13 + Math.random() * 43)
        );
      }
      worldRefs.loyKrathongGroup.add(mesh);

      const tagEl = createKrathongWishTag(item);
      const entry = {
        id: item.id || ('local_' + Math.random()),
        name: item.name || 'ชาวหนองไผ่',
        wish: item.wish || '',
        baseId,
        flowerId,
        candleId,
        toppingId,
        isVip: !!item.isVip,
        blessings: Number(item.blessings) || 0,
        mesh,
        tagEl,
        vx: fromPier ? (Math.random() - 0.5) * 0.25 : (Math.random() - 0.5) * 0.14,
        vz: fromPier ? 1.65 : (0.05 + Math.random() * 0.06),
        phase: Math.random() * 6.28,
        isMiniGame: !!fromPier,
        life: 0,
        maxLife: 4.5,
        onDone: onArrive || null
      };
      pondKrathongs.push(entry);
      if (item.id) knownKrathongIds.add(item.id);

      while (pondKrathongs.length > 45) {
        const oldest = pondKrathongs.shift();
        worldRefs.loyKrathongGroup.remove(oldest.mesh);
        if (oldest.tagEl) oldest.tagEl.remove();
      }
      return entry;
    }

    function syncRemoteKrathongs(remoteList) {
      if (!Array.isArray(remoteList)) return;
      remoteList.forEach(item => {
        if (!item || !item.id) return;
        const existing = pondKrathongs.find(p => p.id === item.id);
        if (existing) {
          const nb = Number(item.blessings) || 0;
          if (nb !== existing.blessings) {
            existing.blessings = nb;
            const safeName = String(existing.name || 'ชาวหนองไผ่').replace(/</g, '&lt;');
            existing.tagEl.innerHTML = `<span class="kw-name">${existing.isVip ? '✨ ' : ''}${safeName}</span>` +
              (nb > 0 ? `<span class="kw-bless">♡ ${nb}</span>` : '');
          }
          return;
        }
        addPondKrathongObject(item, false);
      });
    }

    function updateKrathongBlessingUI(id, blessings) {
      const pk = pondKrathongs.find(p => p.id === id);
      if (!pk) return;
      pk.blessings = blessings;
      const safeName = String(pk.name || 'ชาวหนองไผ่').replace(/</g, '&lt;');
      pk.tagEl.innerHTML = `<span class="kw-name">${pk.isVip ? '✨ ' : ''}${safeName}</span>` +
        (blessings > 0 ? `<span class="kw-bless">♡ ${blessings}</span>` : '');
    }

    function removeKrathongById(id) {
      const idx = pondKrathongs.findIndex(p => p.id === id);
      if (idx === -1) return false;
      const pk = pondKrathongs[idx];
      if (pk.mesh) {
        worldRefs.loyKrathongGroup.remove(pk.mesh);
        scene.remove(pk.mesh);
      }
      if (pk.tagEl) pk.tagEl.remove();
      pondKrathongs.splice(idx, 1);
      knownKrathongIds.delete(id);
      return true;
    }

    function launchMiniGameKrathong(baseId, flowerId, meta, onArrive) {
      const item = {
        id: (meta && meta.id) || ('my_' + Date.now()),
        name: (meta && meta.name) || 'ชาวหนองไผ่',
        wish: (meta && meta.wish) || 'ขอให้มีความสุข',
        baseId: baseId || 'banana',
        flowerId: flowerId || 'lotus',
        candleId: (meta && meta.candleId) || 'gold',
        toppingId: (meta && meta.toppingId) || 'coin',
        isVip: !!(meta && meta.isVip),
        blessings: 0
      };
      return addPondKrathongObject(item, true, onArrive);
    }

    function spawnRitualKrathong(baseId, flowerId, meta) {
      const item = {
        id: (meta && meta.id) || ('my_' + Date.now()),
        name: (meta && meta.name) || 'ชาวหนองไผ่',
        wish: (meta && meta.wish) || 'ขอให้มีความสุข',
        baseId: baseId || 'banana',
        flowerId: flowerId || 'lotus',
        candleId: (meta && meta.candleId) || 'gold',
        toppingId: (meta && meta.toppingId) || 'coin',
        isVip: !!(meta && meta.isVip),
        blessings: 0
      };
      const entry = addPondKrathongObject(item, true, null);
      entry.mesh.position.set(TOTO.LOCATIONS.POND_LAUNCH.x, -0.16, 10.15);
      entry.isRitualHeld = true;
      entry.isMiniGame = false;
      entry.vx = 0;
      entry.vz = 0;
      setKrathongLit(entry.mesh, false);
      return entry;
    }

    // Zero-Lag Live 3D Workshop Preview (reuses main scene, no extra WebGL context)
    const PREVIEW_POS = { x: 6.0, y: -0.10, z: 9.65 };
    const workshopPreview = { group: null, mesh: null, popT: 1, yaw: 0 };
    const coinTosses = [];

    function disposeGroupMeshes(grp) {
      if (!grp) return;
      grp.traverse(obj => {
        if (obj.geometry && obj.geometry.dispose) obj.geometry.dispose();
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach(m => { if (m && m.dispose) m.dispose(); });
        }
      });
    }

    function hideWorkshopPreview() {
      if (workshopPreview.group) {
        scene.remove(workshopPreview.group);
        disposeGroupMeshes(workshopPreview.group);
        workshopPreview.group = null;
        workshopPreview.mesh = null;
      }
    }

    function showWorkshopPreview(baseId, flowerId, isVip, candleId, toppingId, animatePop) {
      hideWorkshopPreview();
      const wrap = new THREE.Group();
      wrap.position.set(PREVIEW_POS.x, PREVIEW_POS.y, PREVIEW_POS.z);

      const halo = new THREE.Mesh(
        new THREE.RingGeometry(0.48, 0.56, 24),
        new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
      );
      halo.rotation.x = -Math.PI / 2;
      halo.position.y = 0.015;
      wrap.add(halo);

      const kMesh = createKrathongMesh(baseId, flowerId, isVip, candleId, toppingId);
      kMesh.scale.set(1.65, 1.65, 1.65);
      if (kMesh.userData && kMesh.userData.glowSprite) {
        kMesh.userData.glowSprite.scale.set(0.52, 0.52, 1);
        kMesh.userData.glowSprite.material.opacity = 0.32;
      }
      wrap.add(kMesh);
      wrap.rotation.y = workshopPreview.yaw;
      scene.add(wrap);

      workshopPreview.group = wrap;
      workshopPreview.mesh = kMesh;
      workshopPreview.popT = animatePop ? 0 : 1;

      if (animatePop) {
        for (let i = 0; i < 5; i++) {
          const ang = (i / 5) * Math.PI * 2;
          const sp = new THREE.Mesh(
            new THREE.SphereGeometry(0.028, 5, 5),
            new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0xfef08a : 0xf9a8d4, transparent: true, opacity: 1 })
          );
          sp.position.set(PREVIEW_POS.x, PREVIEW_POS.y + 0.32, PREVIEW_POS.z);
          scene.add(sp);
          ritualSparkles.push({
            mesh: sp,
            vx: Math.cos(ang) * 0.65,
            vy: 0.7 + Math.random() * 0.5,
            vz: Math.sin(ang) * 0.65,
            life: 0,
            maxLife: 0.55
          });
        }
      }
    }

    function setWorkshopPreviewYaw(yaw) {
      workshopPreview.yaw = yaw;
      if (workshopPreview.group) workshopPreview.group.rotation.y = yaw;
    }

    function launchCoinToss(startPos, isHit, onLand) {
      const coinMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.09, 0.02, 12),
        new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.88, roughness: 0.18, emissive: 0xca8a04, emissiveIntensity: 0.25 })
      );
      const sx = startPos ? startPos.x : 6.0;
      const sz = startPos ? startPos.z : 6.2;
      const tx = isHit ? 8.0 : (8.0 + (Math.random() > 0.5 ? 4.4 : -4.4));
      const ty = isHit ? 0.65 : -0.15;
      const tz = isHit ? 36.0 : 34.2;
      coinMesh.position.set(sx, 1.35, sz);
      scene.add(coinMesh);
      coinTosses.push({
        mesh: coinMesh,
        sx, sy: 1.35, sz,
        tx, ty, tz,
        life: 0,
        dur: 1.15,
        isHit: !!isHit,
        onLand: onLand || null
      });
    }

    function igniteRitualKrathong(entry) {
      if (!entry || !entry.mesh) return;
      setKrathongLit(entry.mesh, true);
      const pos = entry.mesh.position;
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2;
        const sp = new THREE.Mesh(
          new THREE.SphereGeometry(0.032, 6, 6),
          new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0xfef08a : 0xfb923c, transparent: true, opacity: 1 })
        );
        sp.position.set(pos.x, pos.y + 0.32, pos.z);
        scene.add(sp);
        ritualSparkles.push({
          mesh: sp,
          vx: Math.cos(ang) * 0.75,
          vy: 0.9 + Math.random() * 0.65,
          vz: Math.sin(ang) * 0.75,
          life: 0,
          maxLife: 0.75
        });
      }
    }

    function releaseRitualKrathong(entry, isPerfect, onArrive) {
      if (!entry || !entry.mesh) return;
      setKrathongLit(entry.mesh, true);
      entry.isRitualHeld = false;
      entry.isMiniGame = true;
      entry.life = 0;
      entry.maxLife = 3.5;
      entry.onDone = onArrive || null;

      const cur = entry.mesh.position;
      const targetX = isPerfect ? 8.0 : (8.0 + (Math.random() - 0.5) * 4.5);
      const targetZ = isPerfect ? 25.0 : 20.0;
      entry.vx = (targetX - cur.x) / entry.maxLife;
      entry.vz = (targetZ - cur.z) / entry.maxLife;

      if (isPerfect && entry.mesh.userData.rippleRing) {
        entry.mesh.userData.rippleRing.material.color.setHex(0xfde047);
        entry.mesh.userData.rippleRing.material.opacity = 0.65;
      }
    }

    function spawnSkyLantern(x, z) {
      if (skyLanterns.length > 10) return;
      const g = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32, 0.2, 0.62, 7, 1, true),
        new THREE.MeshBasicMaterial({ color: 0xfdba74, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
      );
      g.add(body);
      TOTO.addGlowSprite(g, 0, -0.05, 0, 1.5, TOTO.textures.warmGlowTex, 0.85);
      g.position.set(
        x !== undefined ? x : (Math.random() * 68 - 26),
        1.5,
        z !== undefined ? z : (14 + Math.random() * 38)
      );
      scene.add(g);
      skyLanterns.push({
        mesh: g,
        vy: 1.2 + Math.random() * 0.65,
        driftX: (Math.random() - 0.5) * 0.45,
        life: 0,
        maxLife: 18
      });
    }

    function launchFirework(x, z) {
      const fx = x !== undefined ? x : (8 + (Math.random() - 0.5) * 32);
      const fz = z !== undefined ? z : (30 + (Math.random() - 0.5) * 18);
      const colorPalette = [0xfde047, 0xd4af6a, 0xfb923c, 0xf472b6, 0x38bdf8];
      const col = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      const rocket = new THREE.Mesh(new THREE.SphereGeometry(0.14, 5, 5), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      rocket.position.set(fx, 0.6, fz);
      scene.add(rocket);
      TOTO.sfx.playFirework();
      fireworks.push({
        type: 'ROCKET',
        mesh: rocket,
        vy: 16 + Math.random() * 4,
        targetY: 14 + Math.random() * 5,
        color: col
      });
    }

    function launchVipFireworkSalute() {
      [[-4, 34], [8, 36], [20, 38], [8, 32]].forEach(([fx, fz], i) => {
        setTimeout(() => launchFirework(fx, fz), i * 320);
      });
      spawnSkyLantern(5, 30);
      spawnSkyLantern(12, 34);
    }

    function updateFestivalEffects(dt, elapsed) {
      // Chef Toto NPC gently tends his hot griddle stall when not in active mini-game cooking
      if (!TOTO.STATE.cookPanelOpen && !TOTO.STATE.pan.active) {
        toto.headGroup.rotation.y = Math.sin(elapsed * 0.9) * 0.14;
        toto.leftArm.rotation.x = -0.32 + Math.sin(elapsed * 2.4) * 0.12;
        toto.rightArm.rotation.x = -0.28 + Math.cos(elapsed * 2.4) * 0.10;
      }

      sweeper.position.x = -9.4 + Math.sin(elapsed * 0.35) * 0.7;
      broomGroup.rotation.z = Math.sin(elapsed * 4.5) * 0.25;

      parkStrollers.forEach(ps => {
        ps.x += ps.dir * ps.speed * dt;
        if (ps.x > 46) ps.dir = -1;
        if (ps.x < -30) ps.dir = 1;
        ps.char.root.position.x = ps.x;
        ps.char.root.rotation.y = ps.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
        ps.char.walkPhase += dt * 7;
        ps.char.leftLeg.rotation.x = Math.sin(ps.char.walkPhase) * 0.45;
        ps.char.rightLeg.rotation.x = -Math.sin(ps.char.walkPhase) * 0.45;
        ps.char.leftArm.rotation.x = -Math.sin(ps.char.walkPhase) * 0.35;
        ps.char.rightArm.rotation.x = Math.sin(ps.char.walkPhase) * 0.35;
      });

      trafficVehicles.forEach(v => {
        v.mesh.position.x += v.dir * v.speed * dt;
        if (v.dir > 0 && v.mesh.position.x > 72) v.mesh.position.x = -56 - Math.random() * 14;
        if (v.dir < 0 && v.mesh.position.x < -56) v.mesh.position.x = 72 + Math.random() * 14;
      });

      if (TOTO.STATE.loyKrathongMode) {
        if (workshopPreview.group) {
          workshopPreview.group.position.y = PREVIEW_POS.y + Math.sin(elapsed * 2.5) * 0.018;
          workshopPreview.group.rotation.y = workshopPreview.yaw;
          if (workshopPreview.popT < 1 && workshopPreview.mesh) {
            workshopPreview.popT = Math.min(1, workshopPreview.popT + dt * 3.125);
            const p = workshopPreview.popT;
            const mult = p < 0.65 ? (0.78 + (p / 0.65) * 0.29) : (1.07 - ((p - 0.65) / 0.35) * 0.07);
            const s = 1.65 * mult;
            workshopPreview.mesh.scale.set(s, s, s);
          }
          if (workshopPreview.mesh && workshopPreview.mesh.userData.sparklerTip) {
            const st = 0.85 + Math.sin(elapsed * 18) * 0.28;
            workshopPreview.mesh.userData.sparklerTip.scale.set(st, st, st);
          }
        }

        for (let i = coinTosses.length - 1; i >= 0; i--) {
          const ct = coinTosses[i];
          ct.life += dt;
          const u = Math.min(1, ct.life / ct.dur);
          ct.mesh.position.x = ct.sx + (ct.tx - ct.sx) * u;
          ct.mesh.position.z = ct.sz + (ct.tz - ct.sz) * u;
          ct.mesh.position.y = ct.sy + (ct.ty - ct.sy) * u + Math.sin(u * Math.PI) * 5.2;
          ct.mesh.rotation.x += dt * 16;
          ct.mesh.rotation.z += dt * 11;
          if (u >= 1) {
            const landPos = ct.mesh.position.clone();
            scene.remove(ct.mesh);
            ct.mesh.geometry.dispose();
            ct.mesh.material.dispose();
            coinTosses.splice(i, 1);
            for (let k = 0; k < 6; k++) {
              const ang = (k / 6) * Math.PI * 2;
              const sp = new THREE.Mesh(
                new THREE.SphereGeometry(0.045, 5, 5),
                new THREE.MeshBasicMaterial({ color: ct.isHit ? (k % 2 === 0 ? 0xfde047 : 0xffffff) : 0x7dd3fc, transparent: true, opacity: 1 })
              );
              sp.position.set(landPos.x, landPos.y + 0.12, landPos.z);
              scene.add(sp);
              ritualSparkles.push({
                mesh: sp,
                vx: Math.cos(ang) * 1.15,
                vy: 1.2 + Math.random() * 0.8,
                vz: Math.sin(ang) * 1.15,
                life: 0,
                maxLife: 0.72
              });
            }
            if (ct.onLand) ct.onLand(ct.isHit);
          }
        }

        for (let i = ritualSparkles.length - 1; i >= 0; i--) {
          const rs = ritualSparkles[i];
          rs.life += dt;
          if (rs.life >= rs.maxLife) {
            scene.remove(rs.mesh);
            rs.mesh.geometry.dispose();
            rs.mesh.material.dispose();
            ritualSparkles.splice(i, 1);
            continue;
          }
          rs.mesh.position.x += rs.vx * dt;
          rs.mesh.position.y += rs.vy * dt;
          rs.mesh.position.z += rs.vz * dt;
          rs.mesh.material.opacity = 1 - rs.life / rs.maxLife;
        }

        for (let i = pondKrathongs.length - 1; i >= 0; i--) {
          const pk = pondKrathongs[i];
          if (pk.isRitualHeld) {
            pk.mesh.position.y = -0.18 + Math.sin(elapsed * 2.4 + pk.phase) * 0.018;
            pk.mesh.rotation.y += dt * 0.2;
            if (pk.mesh.userData.rippleRing) {
              const rp = 1 + Math.sin(elapsed * 2.6 + pk.phase) * 0.08;
              pk.mesh.userData.rippleRing.scale.set(rp, rp, 1);
            }
            continue;
          }
          pk.mesh.position.x += pk.vx * dt;
          pk.mesh.position.z += pk.vz * dt;
          pk.mesh.position.y = -0.18 + Math.sin(elapsed * 2.2 + pk.phase) * 0.024;
          pk.mesh.rotation.y += dt * 0.14;
          if (pk.mesh.userData.rippleRing) {
            const rp = 1 + Math.sin(elapsed * 3.0 + pk.phase) * 0.12;
            pk.mesh.userData.rippleRing.scale.set(rp, rp, 1);
          }
          if (pk.mesh.userData.sparklerTip) {
            const st = 0.85 + Math.sin(elapsed * 18 + pk.phase) * 0.28;
            pk.mesh.userData.sparklerTip.scale.set(st, st, st);
          }

          if (pk.isMiniGame) {
            pk.life += dt;
            if (pk.life >= pk.maxLife) {
              pk.isMiniGame = false;
              pk.vx = (Math.random() - 0.5) * 0.14;
              pk.vz = 0.06;
              if (pk.onDone) {
                pk.onDone();
                pk.onDone = null;
              }
            }
          } else {
            if (pk.mesh.position.z > 60) pk.mesh.position.z = 11.5;
            if (pk.mesh.position.x > 49) pk.mesh.position.x = -33;
            if (pk.mesh.position.x < -33) pk.mesh.position.x = 49;
          }
        }
      }

      for (let i = skyLanterns.length - 1; i >= 0; i--) {
        const sl = skyLanterns[i];
        sl.life += dt;
        sl.mesh.position.y += sl.vy * dt;
        sl.mesh.position.x += sl.driftX * dt;
        if (sl.life >= sl.maxLife) {
          scene.remove(sl.mesh);
          skyLanterns.splice(i, 1);
        }
      }

      for (let i = fireworks.length - 1; i >= 0; i--) {
        const fw = fireworks[i];
        if (fw.type === 'ROCKET') {
          fw.mesh.position.y += fw.vy * dt;
          if (fw.mesh.position.y >= fw.targetY) {
            const origin = fw.mesh.position.clone();
            scene.remove(fw.mesh);
            fireworks.splice(i, 1);
            for (let p = 0; p < 18; p++) {
              const theta = Math.random() * Math.PI * 2;
              const phi = Math.random() * Math.PI;
              const speed = 3.8 + Math.random() * 4.5;
              const spark = new THREE.Mesh(
                new THREE.SphereGeometry(0.13, 4, 4),
                new THREE.MeshBasicMaterial({ color: fw.color, transparent: true, opacity: 1 })
              );
              spark.position.copy(origin);
              scene.add(spark);
              fireworks.push({
                type: 'SPARK',
                mesh: spark,
                vx: Math.sin(phi) * Math.cos(theta) * speed,
                vy: Math.cos(phi) * speed,
                vz: Math.sin(phi) * Math.sin(theta) * speed,
                life: 0,
                maxLife: 1.35
              });
            }
          }
        } else {
          fw.life += dt;
          if (fw.life >= fw.maxLife) {
            scene.remove(fw.mesh);
            fw.mesh.material.dispose();
            fireworks.splice(i, 1);
            continue;
          }
          fw.mesh.position.x += fw.vx * dt;
          fw.mesh.position.y += fw.vy * dt;
          fw.mesh.position.z += fw.vz * dt;
          fw.vy -= 3.8 * dt;
          fw.mesh.material.opacity = 1 - fw.life / fw.maxLife;
        }
      }
    }

    return {
      toto,
      helperBoy,
      fpHands,
      fpLeft,
      fpRight,
      fpLeftSpat,
      fpRightSpat,
      fpPlateAnchor,
      pondKrathongs,
      syncRemoteKrathongs,
      updateKrathongBlessingUI,
      removeKrathongById,
      createCustomerMesh,
      launchMiniGameKrathong,
      spawnRitualKrathong,
      igniteRitualKrathong,
      releaseRitualKrathong,
      showWorkshopPreview,
      hideWorkshopPreview,
      setWorkshopPreviewYaw,
      launchCoinToss,
      spawnSkyLantern,
      launchFirework,
      launchVipFireworkSalute,
      updateFestivalEffects
    };
  };
})();

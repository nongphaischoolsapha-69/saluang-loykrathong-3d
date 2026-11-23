(function () {
  'use strict';

  const TOTO = (window.TOTO = window.TOTO || {});

  function addGlowSprite(parent, x, y, z, scale, tex, opacity) {
    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      opacity: opacity === undefined ? 0.85 : opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const sp = new THREE.Sprite(mat);
    sp.position.set(x, y, z);
    sp.scale.set(scale, scale, 1);
    parent.add(sp);
    return sp;
  }

  TOTO.addGlowSprite = addGlowSprite;

  TOTO.buildWorld = function (scene) {
    const tex = TOTO.textures;
    const world = new THREE.Group();
    scene.add(world);

    // ============================================================
    // 1. SKY DOME, MOONLIT ATMOSPHERE & HIGH-FPS LIGHTING
    // ============================================================
    const nightSkyTex = tex.createSkyGradientTexture(true);
    const daySkyTex = tex.createSkyGradientTexture(false);
    const skyMat = new THREE.MeshBasicMaterial({
      map: nightSkyTex,
      side: THREE.BackSide,
      depthWrite: false
    });
    const skyDome = new THREE.Mesh(new THREE.SphereGeometry(195, 24, 16), skyMat);
    scene.add(skyDome);

    const hemiLight = new THREE.HemisphereLight(0x4b6b9e, 0x1a1512, 0.65);
    scene.add(hemiLight);

    const mainDirLight = new THREE.DirectionalLight(0xb8cdf7, 0.72);
    mainDirLight.position.set(18, 42, 65);
    mainDirLight.castShadow = true;
    mainDirLight.shadow.mapSize.width = 1024;
    mainDirLight.shadow.mapSize.height = 1024;
    mainDirLight.shadow.camera.near = 2;
    mainDirLight.shadow.camera.far = 160;
    const sd = 48;
    mainDirLight.shadow.camera.left = -sd;
    mainDirLight.shadow.camera.right = sd;
    mainDirLight.shadow.camera.top = sd;
    mainDirLight.shadow.camera.bottom = -sd;
    scene.add(mainDirLight);

    const nightSkyGroup = new THREE.Group();
    const starGeo = new THREE.BufferGeometry();
    const starPos = [];
    for (let i = 0; i < 420; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.44;
      const r = 165;
      starPos.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi) + 8,
        r * Math.sin(phi) * Math.sin(theta)
      );
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    nightSkyGroup.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xe2e8f0, size: 0.55, transparent: true, opacity: 0.88 })));

    const moonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(4.2, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xfef4d1 })
    );
    moonMesh.position.set(18, 42, 130);
    nightSkyGroup.add(moonMesh);
    addGlowSprite(nightSkyGroup, 18, 42, 128, 24, tex.warmGlowTex, 0.72);
    scene.add(nightSkyGroup);

    const glowSprites = [];

    // ============================================================
    // 2. REAL-SCALE POND WATER (90m x 56m) + CUSTOM MOONLIT SHADER
    // ============================================================
    const waterUniforms = {
      uTime: { value: 0 },
      uNightMix: { value: 1.0 },
      uMoonDir: { value: new THREE.Vector3(18, 42, 130).normalize() }
    };

    const waterVertexShader = `
      uniform float uTime;
      varying vec3 vWorldPos;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        float w1 = sin(wp.x * 0.38 + uTime * 1.45) * 0.028;
        float w2 = cos(wp.z * 0.44 + uTime * 1.15) * 0.024;
        float w3 = sin((wp.x + wp.z) * 0.65 - uTime * 1.8) * 0.014;
        wp.y += w1 + w2 + w3;
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `;

    const waterFragmentShader = `
      uniform float uTime;
      uniform float uNightMix;
      uniform vec3 uMoonDir;
      varying vec3 vWorldPos;

      void main() {
        vec2 p = vWorldPos.xz;
        // 4-octave directional micro-ripple normal computation (zero extra draw calls!)
        float nx = 0.0;
        float nz = 0.0;
        nx += cos(p.x * 1.2 + p.y * 0.4 + uTime * 1.7) * 0.045;
        nz += cos(p.x * 0.4 + p.y * 1.3 - uTime * 1.4) * 0.045;
        nx += cos(p.x * 2.7 - p.y * 1.9 + uTime * 2.5) * 0.028;
        nz -= cos(p.x * 2.7 - p.y * 1.9 + uTime * 2.5) * 0.024;
        nx += sin(p.x * 4.8 + p.y * 3.6 - uTime * 3.2) * 0.016;
        nz += cos(p.x * 3.9 + p.y * 5.1 + uTime * 2.9) * 0.016;

        // Concentric ripples around Central Pond Fountain at (8.0, 36.0)
        vec2 fDelta = p - vec2(8.0, 36.0);
        float fDist = length(fDelta);
        float fRipple = cos(fDist * 3.2 - uTime * 5.0) * exp(-fDist * 0.12) * 0.065;
        vec2 fDir = fDelta / max(fDist, 0.01);
        nx += fDir.x * fRipple;
        nz += fDir.y * fRipple;

        vec3 N = normalize(vec3(-nx, 1.0, -nz));
        vec3 V = normalize(cameraPosition - vWorldPos);
        vec3 L = normalize(uMoonDir);
        vec3 R = reflect(-L, N);

        float specTight = pow(max(dot(V, R), 0.0), 64.0);
        float specBroad = pow(max(dot(V, R), 0.0), 10.0);
        float shimmer = sin(p.x * 2.4 + p.y * 1.7 + uTime * 2.6) * 0.5 + 0.5;
        float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.2);

        vec3 dayBase = vec3(0.21, 0.30, 0.25);
        vec3 daySky = vec3(0.46, 0.65, 0.78);
        vec3 nightBase = vec3(0.02, 0.055, 0.125);
        vec3 nightDeep = vec3(0.05, 0.12, 0.25);

        vec3 baseCol = mix(dayBase, mix(nightBase, nightDeep, fresnel), uNightMix);
        vec3 moonCol = mix(vec3(0.96, 0.98, 0.95), vec3(1.0, 0.90, 0.68), uNightMix);

        float edgeDist = min(min(abs(p.x - (-37.0)), abs(53.0 - p.x)), min(abs(p.y - 8.0), abs(64.0 - p.y)));
        float bankWarmGlow = exp(-edgeDist * 0.15) * 0.24 * uNightMix;
        float perimeterSparkle = pow(max(sin(p.x * 0.95 + nz * 8.0) * cos(p.y * 0.85 + nx * 8.0), 0.0), 3.0) * bankWarmGlow;
        float foam = smoothstep(2.6, 1.0, fDist) * 0.32;

        vec3 col = baseCol;
        col = mix(col, daySky, fresnel * 0.48 * (1.0 - uNightMix));
        col += moonCol * (specBroad * 0.24 + specTight * (0.95 + 0.45 * shimmer)) * (0.35 + 0.68 * uNightMix);
        col += vec3(0.96, 0.68, 0.28) * (bankWarmGlow * (0.65 + 0.35 * sin(p.x * 0.4 + uTime)) + perimeterSparkle * 1.2);
        col += vec3(0.75, 0.90, 1.0) * foam * (0.55 + 0.45 * uNightMix);

        gl_FragColor = vec4(col, 0.96);
      }
    `;

    const waterMat = new THREE.ShaderMaterial({
      uniforms: waterUniforms,
      vertexShader: waterVertexShader,
      fragmentShader: waterFragmentShader,
      transparent: true
    });

    const waterMesh = new THREE.Mesh(new THREE.PlaneGeometry(90, 56, 48, 32), waterMat);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.set(8, -0.22, 36);
    world.add(waterMesh);

    // Central Sa Luang Pond Water Fountain at (8, -0.15, 36)
    const fountainGroup = new THREE.Group();
    fountainGroup.position.set(8, -0.15, 36);
    const curbWallMat = new THREE.MeshStandardMaterial({ color: 0x9a968e, roughness: 0.9 });
    const fBase = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.15, 0.35, 14), curbWallMat);
    fountainGroup.add(fBase);
    const fountainPlumes = [];
    const plumeMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.72 });
    for (let f = 0; f < 7; f++) {
      const isCenter = f === 0;
      const a = ((f - 1) / 6) * Math.PI * 2;
      const plume = new THREE.Mesh(
        new THREE.ConeGeometry(isCenter ? 0.22 : 0.12, isCenter ? 3.4 : 2.1, 7),
        plumeMat
      );
      plume.position.set(isCenter ? 0 : Math.cos(a) * 0.48, isCenter ? 1.7 : 1.05, isCenter ? 0 : Math.sin(a) * 0.48);
      if (!isCenter) {
        plume.rotation.z = -Math.cos(a) * 0.28;
        plume.rotation.x = Math.sin(a) * 0.28;
      }
      fountainGroup.add(plume);
      fountainPlumes.push({ mesh: plume, phase: f * 0.85 });
    }
    const fRing = new THREE.Mesh(
      new THREE.RingGeometry(1.15, 1.9, 24),
      new THREE.MeshBasicMaterial({ color: 0xfef3c7, transparent: true, opacity: 0.32, side: THREE.DoubleSide })
    );
    fRing.rotation.x = -Math.PI / 2;
    fRing.position.y = 0.03;
    fountainGroup.add(fRing);
    glowSprites.push(addGlowSprite(fountainGroup, 0, 1.1, 0, 7.5, tex.warmGlowTex, 0.55));
    world.add(fountainGroup);

    // ============================================================
    // 3. 360° REAL-SCALE PERIMETER ROADS, BRICK PROMENADE & BANK WALLS
    // ============================================================
    const roadMat = new THREE.MeshStandardMaterial({ map: tex.createAsphaltTexture(), roughness: 0.88 });
    // South: Soi Sa Luang Tai / Soi Thetsaban 34
    const southRoad = new THREE.Mesh(new THREE.PlaneGeometry(140, 7.8), roadMat);
    southRoad.rotation.x = -Math.PI / 2;
    southRoad.position.set(8, 0, 0.85);
    southRoad.receiveShadow = true;
    world.add(southRoad);

    // North: Soi Thetsaban 32
    const northRoad = new THREE.Mesh(new THREE.PlaneGeometry(130, 6.8), roadMat);
    northRoad.rotation.x = -Math.PI / 2;
    northRoad.position.set(8, 0.01, 69.5);
    world.add(northRoad);

    // East: Narrow Perimeter Road (Orange tractor side, -X)
    const eastRoad = new THREE.Mesh(new THREE.PlaneGeometry(6.8, 86), roadMat);
    eastRoad.rotation.x = -Math.PI / 2;
    eastRoad.position.set(-43.0, 0.01, 34.0);
    world.add(eastRoad);

    // West: Thanon Khotchaseni Frontage Road (+X, beside Park Gateway)
    const westRoad = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 92), roadMat);
    westRoad.rotation.x = -Math.PI / 2;
    westRoad.position.set(68.0, 0.01, 34.0);
    world.add(westRoad);

    // SE T-Intersection Crosshatch Box Junction + Dual Drainage Grates
    const boxJunction = new THREE.Mesh(
      new THREE.PlaneGeometry(7.0, 6.2),
      new THREE.MeshBasicMaterial({ map: tex.createIntersectionBoxTexture(), transparent: true, depthWrite: false })
    );
    boxJunction.rotation.x = -Math.PI / 2;
    boxJunction.position.set(-37.5, 0.02, 0.85);
    world.add(boxJunction);

    const grateMat = new THREE.MeshStandardMaterial({ color: 0x262930, roughness: 0.6, metalness: 0.7 });
    [[-33.5, 0.4], [-34.8, 1.8], [-22, -1.7], [-14, -1.7], [-4, -1.7], [6, -1.7], [16, -1.7], [28, -1.7]].forEach(([gx, gz]) => {
      const grate = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.03, 0.68), grateMat);
      grate.position.set(gx, 0.015, gz);
      world.add(grate);
    });

    const apronMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(120, 4.2),
      new THREE.MeshStandardMaterial({ color: 0x686c73, roughness: 0.9 })
    );
    apronMesh.rotation.x = -Math.PI / 2;
    apronMesh.position.set(8, 0.015, -5.0);
    apronMesh.receiveShadow = true;
    world.add(apronMesh);

    const signPole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.0, 8), new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.5 }));
    signPole.position.set(-1.5, 1.5, -2.9);
    const signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.52, 0.06),
      new THREE.MeshStandardMaterial({ map: tex.createRoadSignTexture(), roughness: 0.4 })
    );
    signBoard.position.set(-1.5, 2.75, -2.9);
    world.add(signPole, signBoard);

    // Lakeside Brick Promenade & Park Lawns around Pond
    const brickMat = new THREE.MeshStandardMaterial({ map: tex.createBrickPromenadeTexture(), roughness: 0.9 });
    const walkwayMat = new THREE.MeshStandardMaterial({ color: 0x8e887f, roughness: 0.92 });
    const lawnMat = new THREE.MeshStandardMaterial({ color: 0x274d2c, roughness: 0.95 });
    const whitePlanterMat = new THREE.MeshStandardMaterial({ color: 0xe7e5e0, roughness: 0.85 });
    const railPipeMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.6, roughness: 0.35 });
    const whiteRailMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
    const bushLeafMat = new THREE.MeshStandardMaterial({ color: 0x26632e, roughness: 0.85 });
    const redIxoraMat = new THREE.MeshStandardMaterial({ color: 0xd9381e, roughness: 0.75 });
    const pinkBougMat = new THREE.MeshStandardMaterial({ color: 0xdb2777, roughness: 0.75 });
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b5647, roughness: 0.95 });

    // South Promenade (Brick-paved lakeside walkway)
    const pondWalkway = new THREE.Mesh(new THREE.BoxGeometry(96, 0.22, 3.2), brickMat);
    pondWalkway.position.set(8, 0.11, 6.2);
    pondWalkway.receiveShadow = true;
    world.add(pondWalkway);

    // North Promenade
    const northWalkway = new THREE.Mesh(new THREE.BoxGeometry(96, 0.22, 3.0), walkwayMat);
    northWalkway.position.set(8, 0.11, 65.8);
    world.add(northWalkway);

    // East Perimeter Walkway (-X)
    const eastWalkway = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.22, 62), walkwayMat);
    eastWalkway.position.set(-38.6, 0.11, 36);
    world.add(eastWalkway);

    // West Nong Phai Public Park Lawn + Brick Walkway (+X)
    const westParkLawn = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.18, 62), lawnMat);
    westParkLawn.position.set(56.8, 0.09, 36);
    const westBrickWalk = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.22, 62), brickMat);
    westBrickWalk.position.set(54.2, 0.11, 36);
    world.add(westParkLawn, westBrickWalk);

    // Sloping stone riprap banks on all 4 pond sides
    const bankStoneMat = new THREE.MeshStandardMaterial({ color: 0x6b7078, roughness: 0.95 });
    const southBank = new THREE.Mesh(new THREE.BoxGeometry(92, 0.9, 1.5), bankStoneMat);
    southBank.position.set(8, -0.15, 8.2);
    southBank.rotation.x = 0.28;
    const northBank = new THREE.Mesh(new THREE.BoxGeometry(92, 0.9, 1.5), bankStoneMat);
    northBank.position.set(8, -0.15, 64.1);
    northBank.rotation.x = -0.28;
    const westBank = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.9, 58), bankStoneMat);
    westBank.position.set(53.0, -0.15, 36);
    westBank.rotation.z = 0.28;
    const eastBank = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.9, 58), bankStoneMat);
    eastBank.position.set(-37.0, -0.15, 36);
    eastBank.rotation.z = -0.28;
    world.add(southBank, northBank, westBank, eastBank);

    // ============================================================
    // 4. REAL LAKESIDE FIXTURES: BENCHES, PERGOLA, SIGN, TREES & GREEN LAMP POSTS
    // ============================================================
    // Low South wall along Z=4.8 (gap at X=4.2..7.8 for pier!) + White 2-rail guardrail at Z=7.75
    function addHorizontalWallSegment(xCenter, width, z) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(width, 0.34, 0.22), curbWallMat);
      wall.position.set(xCenter, 0.17, z);
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, width, 8), railPipeMat);
      pipe.rotation.z = Math.PI / 2;
      pipe.position.set(xCenter, 0.50, z);
      world.add(wall, pipe);
    }
    addHorizontalWallSegment(-17.8, 44.0, 4.8);
    addHorizontalWallSegment(31.8, 48.0, 4.8);

    // North bank low curb wall
    addHorizontalWallSegment(8, 92, 67.3);

    // White 2-rail steel pond guardrail (South Z=7.75 with pier opening at X=4.2..7.8, and North Z=64.2)
    function addWhiteGuardrail(xCenter, width, z) {
      const rTop = new THREE.Mesh(new THREE.BoxGeometry(width, 0.05, 0.05), whiteRailMat);
      rTop.position.set(xCenter, 0.78, z);
      const rMid = new THREE.Mesh(new THREE.BoxGeometry(width, 0.04, 0.04), whiteRailMat);
      rMid.position.set(xCenter, 0.48, z);
      world.add(rTop, rMid);
    }
    addWhiteGuardrail(-16.5, 41.0, 7.75);
    addWhiteGuardrail(30.5, 45.0, 7.75);
    addWhiteGuardrail(8, 90, 64.2);

    // East wall + rail along X=-37.0 (leaving North/South corners neat)
    const eastWall = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.36, 56), curbWallMat);
    eastWall.position.set(-40.2, 0.18, 36);
    const eastPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 56, 8), railPipeMat);
    eastPipe.rotation.x = Math.PI / 2;
    eastPipe.position.set(-40.2, 0.54, 36);
    world.add(eastWall, eastPipe);

    // Pier stone steps down to the water at (6, 0, 7.6..9.6)
    for (let st = 0; st < 4; st++) {
      const step = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 0.18, 0.54),
        new THREE.MeshStandardMaterial({ color: 0xa1a6ad, roughness: 0.88 })
      );
      step.position.set(TOTO.LOCATIONS.PIER_SPOT.x, 0.12 - st * 0.09, 7.6 + st * 0.48);
      world.add(step);
    }

    // Blue municipal notice sign on South promenade ("ประกาศเทศบาลตำบลหนองไผ่")
    const noticePost = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.5, 6), railPipeMat);
    noticePost.position.set(3.2, 0.75, 6.9);
    const noticeBoard = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 0.78, 0.05),
      new THREE.MeshStandardMaterial({ map: tex.createMunicipalSignTexture(), roughness: 0.45 })
    );
    noticeBoard.position.set(3.2, 1.35, 6.9);
    world.add(noticePost, noticeBoard);

    // Concrete park benches & metal pergola with orange flowers (matching step_59_shot_1)
    function createBench(x, z, rotY) {
      const g = new THREE.Group();
      const seat = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 0.46), whitePlanterMat);
      seat.position.y = 0.48;
      const legL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.45, 0.42), curbWallMat);
      legL.position.set(-0.56, 0.25, 0);
      const legR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.45, 0.42), curbWallMat);
      legR.position.set(0.56, 0.25, 0);
      g.add(seat, legL, legR);
      g.position.set(x, 0.15, z);
      g.rotation.y = rotY || 0;
      world.add(g);
    }
    createBench(-12, 6.6);
    createBench(-3, 6.6);
    createBench(12.5, 6.3);
    createBench(26, 6.6);
    createBench(40, 6.6);

    // Metal Pergola with orange climbing flowers over bench at (12.5, 6.3)
    const pergola = new THREE.Group();
    pergola.position.set(12.5, 0.2, 6.3);
    const pergSteelMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.4 });
    [[-1.1, -0.45], [1.1, -0.45], [-1.1, 0.45], [1.1, 0.45]].forEach(([px, pz]) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.35, 6), pergSteelMat);
      post.position.set(px, 1.18, pz);
      pergola.add(post);
    });
    const pergTop = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.08, 1.25), pergSteelMat);
    pergTop.position.y = 2.35;
    const pergLeaf = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.22, 1.35), bushLeafMat);
    pergLeaf.position.y = 2.48;
    const orangeFlowerMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.7 });
    for (let fl = -1.0; fl <= 1.0; fl += 0.5) {
      const bl = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22, 0), orangeFlowerMat);
      bl.position.set(fl, 2.55, (fl * 10) % 2 === 0 ? 0.35 : -0.35);
      pergola.add(bl);
    }
    pergola.add(pergTop, pergLeaf);
    world.add(pergola);

    // Pink Bougainvillea & Flat-Top Trimmed Red Ixora Hedges along South Pond Edge
    [[-1.5, 5.35], [15.5, 5.35], [34, 5.35]].forEach(([bx, bz]) => {
      const pl = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.26, 0.8), whitePlanterMat);
      pl.position.set(bx, 0.22, bz);
      const lf = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.45, 0.68), bushLeafMat);
      lf.position.set(bx, 0.48, bz);
      const pk = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45, 0), pinkBougMat);
      pk.position.set(bx - 0.35, 0.76, bz);
      const wh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.38, 0), whiteRailMat);
      wh.position.set(bx + 0.4, 0.72, bz);
      world.add(pl, lf, pk, wh);
    });

    [[-14, 7.2], [1.2, 7.2], [19, 7.2], [38, 7.2]].forEach(([hx, hz]) => {
      const hBase = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.24, 0.78), whitePlanterMat);
      hBase.position.set(hx, 0.22, hz);
      const hTop = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.48, 0.64), redIxoraMat);
      hTop.position.set(hx, 0.46, hz);
      world.add(hBase, hTop);
    });

    // North trimmed rectangular hedges along North bank
    for (let nx = -28; nx <= 44; nx += 12) {
      const nh = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.56, 0.7), bushLeafMat);
      nh.position.set(nx, 0.42, 65.0);
      world.add(nh);
    }

    // Tall Park Trees with Multi-Branching Trunks & Single-Draw-Call InstancedMesh Canopies
    const foliageTransforms = [];
    const shadowDiscMat = new THREE.MeshBasicMaterial({ map: tex.contactShadowTex, transparent: true, depthWrite: false });
    function createPondTree(x, z) {
      const g = new THREE.Group();
      const seed = Math.abs(x * 13 + z * 7);
      const h = 5.6 + (seed % 3) * 0.55;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.25, h * 0.72, 7), trunkMat);
      trunk.position.y = h * 0.36;
      trunk.castShadow = true;
      g.add(trunk);

      // 3 angled wooden Y-branches for natural tropical park silhouette
      [0, 2.1, 4.2].forEach((ang, bi) => {
        const bLen = 2.0 + (bi % 2) * 0.4;
        const br = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.11, bLen, 6), trunkMat);
        br.position.set(Math.cos(ang + seed) * 0.62, h * 0.68 + bi * 0.18, Math.sin(ang + seed) * 0.62);
        br.rotation.z = -Math.cos(ang + seed) * 0.52;
        br.rotation.x = Math.sin(ang + seed) * 0.52;
        g.add(br);
      });

      const treeShadow = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), shadowDiscMat);
      treeShadow.rotation.x = -Math.PI / 2;
      treeShadow.position.y = 0.13;
      g.add(treeShadow);

      g.position.set(x, 0.1, z);
      world.add(g);

      // Record 5 clustered foliage lobes for batched InstancedMesh rendering
      const puffOffsets = [
        [0, h + 0.55, 0, 1.55, 0.92, 1.55],
        [-1.05, h + 0.15, 0.55, 1.15, 0.85, 1.15],
        [1.05, h + 0.20, -0.45, 1.22, 0.86, 1.22],
        [0.25, h + 0.12, 1.02, 1.08, 0.80, 1.08],
        [-0.35, h + 0.95, -0.35, 1.12, 0.82, 1.12]
      ];
      puffOffsets.forEach(([ox, oy, oz, sx, sy, sz], pi) => {
        foliageTransforms.push({
          pos: new THREE.Vector3(x + ox, 0.1 + oy, z + oz),
          rotY: (seed + pi) * 0.7,
          scale: new THREE.Vector3(sx, sy, sz)
        });
      });
    }
    [-28, -16, -4, 9.5, 22, 35, 48].forEach(tx => createPondTree(tx, 6.2));
    [-26, -8, 10, 28, 46].forEach(tx => createPondTree(tx, 65.8));
    [14, 28, 44, 56].forEach(tz => {
      createPondTree(-38.6, tz);
      createPondTree(55.5, tz);
    });

    const instancedFoliage = new THREE.InstancedMesh(
      new THREE.IcosahedronGeometry(1.1, 1),
      new THREE.MeshStandardMaterial({ color: 0x26632e, roughness: 0.86 }),
      foliageTransforms.length
    );
    const dummyMtx = new THREE.Object3D();
    foliageTransforms.forEach((ft, idx) => {
      dummyMtx.position.copy(ft.pos);
      dummyMtx.rotation.set(0, ft.rotY, 0);
      dummyMtx.scale.copy(ft.scale);
      dummyMtx.updateMatrix();
      instancedFoliage.setMatrixAt(idx, dummyMtx.matrix);
    });
    instancedFoliage.instanceMatrix.needsUpdate = true;
    world.add(instancedFoliage);

    // Ornate Green Double-Arm Municipal Lamp Posts around ALL 4 Sides
    const greenPoleMat = new THREE.MeshStandardMaterial({ color: 0x2f6344, roughness: 0.5, metalness: 0.35 });
    const lampPoolPositions = [];
    function createLampPost(x, z, rotY) {
      const g = new THREE.Group();
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 0.75, 7), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
      base.position.y = 0.38;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 5.8, 7), greenPoleMat);
      pole.position.y = 3.2;
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 1.4), greenPoleMat);
      arm.position.set(0, 5.85, 0);
      const bulb1 = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), new THREE.MeshBasicMaterial({ color: 0xfff1c2 }));
      bulb1.position.set(0, 5.72, -0.65);
      const bulb2 = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), new THREE.MeshBasicMaterial({ color: 0xfff1c2 }));
      bulb2.position.set(0, 5.72, 0.65);
      const finial = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.5, 6), new THREE.MeshStandardMaterial({ color: 0xd4af6a, metalness: 0.6 }));
      finial.position.y = 6.3;
      g.add(base, pole, arm, bulb1, bulb2, finial);
      glowSprites.push(addGlowSprite(g, 0, 5.72, -0.65, 3.2, tex.warmGlowTex, 0.85));
      glowSprites.push(addGlowSprite(g, 0, 5.72, 0.65, 3.2, tex.warmGlowTex, 0.85));
      g.position.set(x, 0.12, z);
      g.rotation.y = rotY || 0;
      world.add(g);
      lampPoolPositions.push([x, z]);
    }
    [-24, -10, 4.0, 18, 32, 46].forEach(lx => createLampPost(lx, 5.6, 0));
    [-22, -4, 14, 32, 48].forEach(lx => createLampPost(lx, 66.2, 0));
    [16, 31, 41, 54].forEach(lz => {
      createLampPost(-39.2, lz, Math.PI / 2);
      createLampPost(53.8, lz, Math.PI / 2);
    });

    // Batched InstancedMesh warm ground light pools under all lamp posts (1 draw call)
    const instancedLightPools = new THREE.InstancedMesh(
      new THREE.PlaneGeometry(5.6, 5.6),
      new THREE.MeshBasicMaterial({
        map: tex.warmGlowTex,
        transparent: true,
        opacity: 0.24,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      }),
      lampPoolPositions.length
    );
    lampPoolPositions.forEach(([lx, lz], idx) => {
      dummyMtx.position.set(lx, 0.24, lz);
      dummyMtx.rotation.set(-Math.PI / 2, 0, 0);
      dummyMtx.scale.set(1, 1, 1);
      dummyMtx.updateMatrix();
      instancedLightPools.setMatrixAt(idx, dummyMtx.matrix);
    });
    instancedLightPools.instanceMatrix.needsUpdate = true;
    world.add(instancedLightPools);

    // Municipal Blue Trash Bins
    function createBlueBin(x, z) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.76, 0.44), new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.45 }));
      body.position.y = 0.38;
      const lid = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.48), new THREE.MeshStandardMaterial({ color: 0x1e40af, roughness: 0.4 }));
      lid.position.y = 0.79;
      g.add(body, lid);
      g.position.set(x, 0, z);
      world.add(g);
    }
    createBlueBin(-8.8, 4.1);
    createBlueBin(11.5, 4.3);
    createBlueBin(36, 4.3);
    createBlueBin(-18.2, -4.4);

    // ============================================================
    // 5. WEST SIDE: NONG PHAI PUBLIC PARK GATEWAY, BRIDGE, TOPIARY, MAILBOX & NW OFFICE (+X)
    // ============================================================
    const westParkGroup = new THREE.Group();
    const whiteWallMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.8 });
    const blueCapMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.6 });
    const terracottaMat = new THREE.MeshStandardMaterial({ color: 0x9a4633, roughness: 0.72 });
    const goldAccentMat = new THREE.MeshStandardMaterial({ color: 0xd4af6a, metalness: 0.55, roughness: 0.35 });

    // Low White Perimeter Wall with Blue Cap along West Park edge (split around Gateway at Z=32..40)
    [[19, 25], [53, 25]].forEach(([wz, len]) => {
      const wWall = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.85, len), whiteWallMat);
      wWall.position.set(59.5, 0.42, wz);
      const wCap = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.1, len), blueCapMat);
      wCap.position.set(59.5, 0.88, wz);
      westParkGroup.add(wWall, wCap);
    });

    // Iconic Terracotta Arched Gateway ("เทศบาลตำบลหนองไผ่") + Golden Thai Finial at (59.5, 0, 36)
    const gateway = new THREE.Group();
    gateway.position.set(59.5, 0, 36);
    gateway.rotation.y = Math.PI / 2;
    const stonePillarMat = new THREE.MeshStandardMaterial({
      map: tex.createStonePillarTexture(),
      roughness: 0.72
    });
    [-3.6, 3.6].forEach(gx => {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.9, 3.85, 0.9), stonePillarMat);
      col.position.set(gx, 1.92, 0);
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.52, 1.16), goldAccentMat);
      plinth.position.set(gx, 0.26, 0);
      // 3-tier Thai stepped column capital
      const cap1 = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.16, 1.12), terracottaMat);
      cap1.position.set(gx, 3.88, 0);
      const cap2 = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.14, 1.24), goldAccentMat);
      cap2.position.set(gx, 4.03, 0);
      const cap3 = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.18, 1.06), terracottaMat);
      cap3.position.set(gx, 4.19, 0);
      gateway.add(col, plinth, cap1, cap2, cap3);
    });
    const archCurve = new THREE.Mesh(
      new THREE.TorusGeometry(3.6, 0.4, 12, 26, Math.PI),
      terracottaMat
    );
    archCurve.position.set(0, 3.9, 0);
    const gateSign = new THREE.Mesh(
      new THREE.BoxGeometry(5.8, 1.02, 0.26),
      new THREE.MeshStandardMaterial({ map: tex.createMunicipalGatewayTexture(), roughness: 0.42 })
    );
    gateSign.position.set(0, 6.28, 0);
    const finialBase = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.48, 0.52, 8), terracottaMat);
    finialBase.position.set(0, 7.65, 0);
    const finialSpire = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.55, 8), goldAccentMat);
    finialSpire.position.set(0, 8.65, 0);
    gateway.add(archCurve, gateSign, finialBase, finialSpire);
    glowSprites.push(addGlowSprite(gateway, 0, 6.28, 0.6, 6.5, tex.warmGlowTex, 0.75));
    glowSprites.push(addGlowSprite(gateway, 0, 6.28, -0.6, 6.5, tex.warmGlowTex, 0.75));
    westParkGroup.add(gateway);

    // Concrete Entrance Bridge over Roadside Drainage Canal with Shimmering Canal Strip
    const canalWaterStrip = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 56),
      new THREE.MeshStandardMaterial({ color: 0x0c243c, roughness: 0.22, metalness: 0.45 })
    );
    canalWaterStrip.rotation.x = -Math.PI / 2;
    canalWaterStrip.position.set(62.2, -0.22, 36);
    westParkGroup.add(canalWaterStrip);

    const canalDeck = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.25, 6.4), curbWallMat);
    canalDeck.position.set(62.2, 0.14, 36);
    westParkGroup.add(canalDeck);
    [-3.1, 3.1].forEach(bz => {
      const pRail = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.65, 0.14), new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.6 }));
      pRail.position.set(62.2, 0.56, 36 + bz);
      const pCap = new THREE.Mesh(new THREE.BoxGeometry(4.9, 0.08, 0.18), whiteRailMat);
      pCap.position.set(62.2, 0.9, 36 + bz);
      westParkGroup.add(pRail, pCap);
    });

    // Sculpted Topiary Letter Hedges ("เทศบาลตำบลหนองไผ่") + Red Thailand Post Mailbox
    [22.5, 49.5].forEach(tz => {
      const topiary = new THREE.Mesh(
        new THREE.BoxGeometry(0.75, 1.45, 7.8),
        new THREE.MeshStandardMaterial({ map: tex.createTopiaryBannerTexture(), roughness: 0.85 })
      );
      topiary.position.set(58.4, 0.85, tz);
      westParkGroup.add(topiary);
    });
    const postBox = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 1.15, 10),
      new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.35 })
    );
    postBox.position.set(60.2, 0.58, 28.5);
    westParkGroup.add(postBox);

    // NW Corner 1-Story Municipal Office Building (white walls, terracotta tiled hip roof, pink base trim, picnic tables)
    const nwBuilding = new THREE.Group();
    nwBuilding.position.set(56.5, 0, 61.5);
    const nwBody = new THREE.Mesh(new THREE.BoxGeometry(6.2, 2.8, 5.2), whiteWallMat);
    nwBody.position.y = 1.4;
    const nwPinkBase = new THREE.Mesh(new THREE.BoxGeometry(6.28, 0.45, 5.28), new THREE.MeshStandardMaterial({ color: 0xf472b6 }));
    nwPinkBase.position.y = 0.23;
    const nwRoof = new THREE.Mesh(new THREE.ConeGeometry(4.8, 1.6, 4), terracottaMat);
    nwRoof.rotation.y = Math.PI / 4;
    nwRoof.position.y = 3.6;
    nwBuilding.add(nwBody, nwPinkBase, nwRoof);
    westParkGroup.add(nwBuilding);
    createBench(55.5, 55.5, Math.PI / 2);
    createBench(57.2, 55.5, Math.PI / 2);

    world.add(westParkGroup);

    // ============================================================
    // 6. NORTH SIDE: 18 THREE-STORY SHOPHOUSES + ADVICE 3D ARCHITECTURAL DEPTH (+Z)
    // ============================================================
    const shophouseTex = tex.createAdviceShophouseTexture();
    const shophouseMat = new THREE.MeshStandardMaterial({
      map: shophouseTex,
      emissive: 0x3b2a14,
      emissiveMap: shophouseTex,
      emissiveIntensity: 0.35,
      roughness: 0.8
    });
    const farShophouses = new THREE.Mesh(new THREE.BoxGeometry(88, 11.2, 5.5), shophouseMat);
    farShophouses.position.set(8, 5.6, 75.5);
    world.add(farShophouses);

    // Architectural 3D roof pitch ridge, balcony ledges, awnings & bay party-wall fins (minimal draw calls!)
    const northPitchRoof = new THREE.Mesh(
      new THREE.BoxGeometry(88.4, 0.75, 5.9),
      new THREE.MeshStandardMaterial({ color: 0x6b281c, roughness: 0.78 })
    );
    northPitchRoof.position.set(8, 11.55, 75.4);
    const northBalconyLedge = new THREE.Mesh(
      new THREE.BoxGeometry(88.2, 0.28, 0.85),
      new THREE.MeshStandardMaterial({ color: 0xdbd4c8, roughness: 0.85 })
    );
    northBalconyLedge.position.set(8, 4.15, 72.4);
    const northGroundAwning = new THREE.Mesh(
      new THREE.BoxGeometry(88.2, 0.12, 1.45),
      new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.65 })
    );
    northGroundAwning.position.set(8, 3.05, 72.15);
    northGroundAwning.rotation.x = -0.22;
    world.add(northPitchRoof, northBalconyLedge, northGroundAwning);

    // 19 Instanced party-wall vertical fins dividing the 18 North shophouses
    const instancedFins = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.28, 11.2, 0.55),
      new THREE.MeshStandardMaterial({ color: 0xd6cfc2, roughness: 0.85 }),
      19
    );
    for (let i = 0; i < 19; i++) {
      dummyMtx.position.set(-36 + i * (88 / 18), 5.6, 72.55);
      dummyMtx.rotation.set(0, 0, 0);
      dummyMtx.scale.set(1, 1, 1);
      dummyMtx.updateMatrix();
      instancedFins.setMatrixAt(i, dummyMtx.matrix);
    }
    instancedFins.instanceMatrix.needsUpdate = true;
    world.add(instancedFins);

    // Protruding 3D glowing "แอดไวซ์ Advice" sign box above North-East center bay (X = 18.0)
    const adviceCanvas = document.createElement('canvas');
    adviceCanvas.width = 512;
    adviceCanvas.height = 192;
    const actx = adviceCanvas.getContext('2d');
    actx.fillStyle = '#0ea5e9';
    actx.fillRect(0, 0, 512, 192);
    actx.fillStyle = '#84cc16';
    actx.fillRect(0, 146, 512, 46);
    actx.textAlign = 'center';
    actx.fillStyle = '#ffffff';
    actx.font = '800 56px Prompt, Kanit, Tahoma, sans-serif';
    actx.fillText('Advice แอดไวซ์', 256, 76);
    actx.fillStyle = '#0f172a';
    actx.font = 'bold 28px Prompt, Kanit, Tahoma, sans-serif';
    actx.fillText('ไอทีหนองไผ่ • สระหลวง', 256, 175);
    const adviceSignTex = new THREE.CanvasTexture(adviceCanvas);
    adviceSignTex.encoding = THREE.sRGBEncoding;

    const adviceBox = new THREE.Mesh(
      new THREE.BoxGeometry(5.6, 2.05, 0.36),
      new THREE.MeshStandardMaterial({
        map: adviceSignTex,
        emissive: 0x38bdf8,
        emissiveMap: adviceSignTex,
        emissiveIntensity: 0.65,
        roughness: 0.35
      })
    );
    adviceBox.position.set(18.0, 4.4, 72.18);
    adviceBox.rotation.y = Math.PI;
    world.add(adviceBox);
    glowSprites.push(addGlowSprite(world, 18.0, 4.4, 71.8, 6.2, tex.warmGlowTex, 0.45));

    // NE Corner 1-Story Hip-Roofed Building with Dark Reddish-Brown Roof & Light-Blue Eaves
    const neCornerHouse = new THREE.Group();
    neCornerHouse.position.set(-34.5, 0, 66.2);
    const neBody = new THREE.Mesh(new THREE.BoxGeometry(6.8, 3.0, 5.4), new THREE.MeshStandardMaterial({ color: 0xe6ddd3 }));
    neBody.position.y = 1.5;
    const neEaves = new THREE.Mesh(new THREE.BoxGeometry(7.3, 0.18, 5.9), new THREE.MeshStandardMaterial({ color: 0x7dd3fc }));
    neEaves.position.y = 3.05;
    const neRoof = new THREE.Mesh(new THREE.ConeGeometry(5.2, 1.7, 4), new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.72 }));
    neRoof.rotation.y = Math.PI / 4;
    neRoof.position.y = 3.95;
    const redPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 6.2, 6), new THREE.MeshStandardMaterial({ color: 0xdc2626 }));
    redPipe.rotation.z = Math.PI / 2.3;
    redPipe.position.set(1.5, 1.1, -3.5);
    neCornerHouse.add(neBody, neEaves, neRoof, redPipe);
    world.add(neCornerHouse);

    // ============================================================
    // 7. EAST SIDE (-X): ORANGE KUBOTA FARM TRACTOR + 4-DISC PLOW & PERIMETER HOMES
    // ============================================================
    const eastGroup = new THREE.Group();
    const orangeMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.38 });
    const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.55, metalness: 0.65 });
    const steelDiscMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.75, roughness: 0.35 });

    // Recognizable Orange Kubota Farm Tractor with 4-Disc Plow along East road (-41.5, 0, 22)
    const tractor = new THREE.Group();
    tractor.position.set(-41.5, 0, 22);
    const trBody = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.85, 2.25), orangeMat);
    trBody.position.set(0, 0.95, 0);
    const trCab = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.05, 1.15), darkMetalMat);
    trCab.position.set(0, 1.78, -0.35);
    const trRoof = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.12, 1.35), orangeMat);
    trRoof.position.set(0, 2.35, -0.35);
    const trExhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.1, 7), darkMetalMat);
    trExhaust.position.set(0.45, 1.65, 0.75);
    tractor.add(trBody, trCab, trRoof, trExhaust);
    // Big rear wheels & smaller front wheels
    [-0.68, 0.68].forEach(wx => {
      const rw = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.32, 14), new THREE.MeshStandardMaterial({ color: 0x171717 }));
      rw.rotation.z = Math.PI / 2;
      rw.position.set(wx, 0.62, -0.65);
      const rwRim = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.35, 10), orangeMat);
      rwRim.rotation.z = Math.PI / 2;
      rwRim.position.set(wx, 0.62, -0.65);
      const fw = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.22, 12), new THREE.MeshStandardMaterial({ color: 0x171717 }));
      fw.rotation.z = Math.PI / 2;
      fw.position.set(wx * 0.88, 0.38, 0.88);
      tractor.add(rw, rwRim, fw);
    });
    // 4-Disc Plow attachment at rear
    const plowBeam = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 2.1), new THREE.MeshStandardMaterial({ color: 0x475569 }));
    plowBeam.position.set(0, 0.55, -2.0);
    plowBeam.rotation.y = 0.25;
    tractor.add(plowBeam);
    for (let d = 0; d < 4; d++) {
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.03, 12), steelDiscMat);
      disc.rotation.z = Math.PI / 2.2;
      disc.rotation.y = 0.35;
      disc.position.set(-0.2 + d * 0.14, 0.34, -1.35 - d * 0.45);
      tractor.add(disc);
    }
    eastGroup.add(tractor);

    // East perimeter buildings across the narrow road
    const eastWhiteHouse = new THREE.Mesh(new THREE.BoxGeometry(5.5, 5.2, 8.5), whiteWallMat);
    eastWhiteHouse.position.set(-49.0, 2.6, 12.0);
    const eastBlueTrim = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.45, 8.6), blueCapMat);
    eastBlueTrim.position.set(-49.0, 3.1, 12.0);
    const eastCornerRedHouse = new THREE.Group();
    eastCornerRedHouse.position.set(-49.0, 2.9, 2.5);
    const ecrBody = new THREE.Mesh(new THREE.BoxGeometry(6.8, 5.8, 5.6), new THREE.MeshStandardMaterial({ color: 0x6b4c35, roughness: 0.9 }));
    const ecrRoof = new THREE.Mesh(new THREE.ConeGeometry(5.0, 1.25, 4), new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.65 }));
    ecrRoof.rotation.y = Math.PI / 4;
    ecrRoof.position.y = 3.5;
    eastCornerRedHouse.add(ecrBody, ecrRoof);
    const streetCartUmbrella1 = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.7, 6), blueCapMat);
    streetCartUmbrella1.position.set(-47.2, 2.4, 24.0);
    const streetCartUmbrella2 = new THREE.Mesh(new THREE.ConeGeometry(1.4, 0.7, 6), bushLeafMat);
    streetCartUmbrella2.position.set(-47.2, 2.4, 27.5);
    eastGroup.add(eastWhiteHouse, eastBlueTrim, eastCornerRedHouse, streetCartUmbrella1, streetCartUmbrella2);

    // 4 Blue-roof 1-story houses at SE T-junction
    const creamWallMat = new THREE.MeshStandardMaterial({ color: 0xe6ddd3, roughness: 0.85 });
    const blueRoofMat = new THREE.MeshStandardMaterial({ color: 0x1e40af, roughness: 0.6 });
    for (let h = 0; h < 4; h++) {
      const hx = -28.0 - h * 4.2;
      const hBox = new THREE.Mesh(new THREE.BoxGeometry(3.8, 3.2, 4.8), creamWallMat);
      hBox.position.set(hx, 1.6, -6.5);
      const hRoof = new THREE.Mesh(new THREE.ConeGeometry(3.1, 1.3, 4), blueRoofMat);
      hRoof.rotation.y = Math.PI / 4;
      hRoof.position.set(hx, 3.85, -6.5);
      eastGroup.add(hBox, hRoof);
    }

    // Blue water barrel & striped traffic pole at SE corner
    const blueBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.24, 0.78, 10), new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.45 }));
    blueBarrel.position.set(-25.5, 0.39, -3.1);
    const stripedPole = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 2.2, 8), whiteRailMat);
    stripedPole.position.set(-24.9, 1.1, -3.2);
    [-0.5, 0.1, 0.7].forEach(sy => {
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.25, 8), darkMetalMat);
      band.position.set(-24.9, 1.1 + sy, -3.2);
      eastGroup.add(band);
    });
    eastGroup.add(blueBarrel, stripedPole);

    world.add(eastGroup);

    // ============================================================
    // 8. SOUTH COMMERCIAL ROW: TOTO'S PINK BUILDING + WHITE #185 + SW CORNER + VEHICLES
    // ============================================================
    function createPickupTruck(x, z, rotY, colorHex) {
      const g = new THREE.Group();
      const bodyMat = new THREE.MeshStandardMaterial({ color: colorHex, metalness: 0.5, roughness: 0.35 });
      const glassMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.15 });
      const tireMat = new THREE.MeshStandardMaterial({ color: 0x171717, roughness: 0.9 });

      const lower = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.74, 1.65), bodyMat);
      lower.position.y = 0.68;
      const cab = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.68, 1.52), bodyMat);
      cab.position.set(-0.35, 1.38, 0);
      const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.52, 1.4), glassMat);
      windshield.position.set(-0.35, 1.4, 0);
      const bedInner = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.25, 1.44), new THREE.MeshStandardMaterial({ color: 0x1f242c }));
      bedInner.position.set(1.25, 0.96, 0);
      g.add(lower, cab, windshield, bedInner);

      [[-1.3, -0.8], [-1.3, 0.8], [1.3, -0.8], [1.3, 0.8]].forEach(([wx, wz]) => {
        const w = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.22, 10), tireMat);
        w.rotation.x = Math.PI / 2;
        w.position.set(wx, 0.33, wz);
        g.add(w);
      });
      const truckShadow = new THREE.Mesh(new THREE.PlaneGeometry(4.7, 2.3), shadowDiscMat);
      truckShadow.rotation.x = -Math.PI / 2;
      truckShadow.position.y = 0.025;
      g.add(truckShadow);
      g.position.set(x, 0, z);
      g.rotation.y = rotY;
      world.add(g);
    }
    createPickupTruck(-5.5, 3.35, 0.02, 0xb0b7c0);
    createPickupTruck(18.0, 3.35, 0.0, 0x334155);

    // Overhead Electrical Poles & Wires along Soi Sa Luang Tai
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x8d9299, roughness: 0.9 });
    const poleXList = [-28, -18.5, -5.0, 8.5, 22, 36, 50];
    const cablePoints = [];
    poleXList.forEach((px, idx) => {
      const pole = new THREE.Mesh(new THREE.BoxGeometry(0.22, 7.5, 0.22), poleMat);
      pole.position.set(px, 3.75, -5.85);
      const cross = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.1), poleMat);
      cross.position.set(px, 7.0, -5.85);
      world.add(pole, cross);

      if (idx < poleXList.length - 1) {
        const nextX = poleXList[idx + 1];
        [-0.35, 0, 0.35].forEach(offsetZ => {
          let prevPt = new THREE.Vector3(px, 6.95, -5.85 + offsetZ);
          for (let s = 1; s <= 6; s++) {
            const t = s / 6;
            const cx = THREE.MathUtils.lerp(px, nextX, t);
            const sag = Math.sin(t * Math.PI) * -0.42;
            const nextPt = new THREE.Vector3(cx, 6.95 + sag, -5.85 + offsetZ);
            cablePoints.push(prevPt, nextPt);
            prevPt = nextPt;
          }
        });
      }
    });
    world.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(cablePoints), new THREE.LineBasicMaterial({ color: 0x1e2229 })));

    // White 2-story Tutoring Building (#185) at West half of Soi Sa Luang Tai
    const tutBuilding = new THREE.Group();
    tutBuilding.position.set(24, 0, -9.2);
    const tutBody = new THREE.Mesh(new THREE.BoxGeometry(12.0, 6.8, 6.0), whiteWallMat);
    tutBody.position.y = 3.4;
    const tutAwning = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.1, 2.2), whiteRailMat);
    tutAwning.position.set(0, 3.1, 3.8);
    tutAwning.rotation.x = 0.22;
    const tutSign = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.0, 0.12), new THREE.MeshStandardMaterial({ color: 0x0284c7 }));
    tutSign.position.set(0, 4.2, 3.05);
    tutBuilding.add(tutBody, tutAwning, tutSign);
    world.add(tutBuilding);

    // SW Corner 3-Story Blue-Awning Shophouse (Krungthai Bank corner)
    const swBank = new THREE.Group();
    swBank.position.set(56, 0, -9.5);
    const swBody = new THREE.Mesh(new THREE.BoxGeometry(10.0, 10.5, 7.0), creamWallMat);
    swBody.position.y = 5.25;
    const swAwning = new THREE.Mesh(new THREE.BoxGeometry(10.4, 0.25, 2.4), blueCapMat);
    swAwning.position.set(0, 3.4, 4.4);
    swBank.add(swBody, swAwning);
    world.add(swBank);

    // Toto's 2-Story Salmon-Pink House behind Hoi Tod Stall (textured pastel-pink stucco wall!)
    const shopBuilding = new THREE.Group();
    const pinkWallMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: tex.createPinkHouseWallTexture(),
      roughness: 0.90
    });
    const whiteBalusterMat = new THREE.MeshStandardMaterial({ color: 0xf1ede4, roughness: 0.75 });
    const darkSteelMat = new THREE.MeshStandardMaterial({ color: 0x2c3038, metalness: 0.65, roughness: 0.55 });
    const zincTex = tex.createZincTextures();

    const mainWalls = new THREE.Mesh(new THREE.BoxGeometry(6.8, 7.2, 5.8), pinkWallMat);
    mainWalls.position.set(-17.0, 3.6, -9.2);
    shopBuilding.add(mainWalls);

    const balconyFloor = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.22, 1.3), creamWallMat);
    balconyFloor.position.set(-17.0, 3.65, -6.35);
    const balconyRailTop = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.12, 0.2), whiteBalusterMat);
    balconyRailTop.position.set(-17.0, 4.65, -5.85);
    const balconyRailBot = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.14, 0.2), whiteBalusterMat);
    balconyRailBot.position.set(-17.0, 3.82, -5.85);
    shopBuilding.add(balconyFloor, balconyRailTop, balconyRailBot);

    for (let bx = -19.8; bx <= -14.2; bx += 0.43) {
      const baluster = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.068, 0.76, 7), whiteBalusterMat);
      baluster.position.set(bx, 4.24, -5.85);
      shopBuilding.add(baluster);
    }

    const acUnit = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.58, 0.34), new THREE.MeshStandardMaterial({ color: 0xd6d3cd, roughness: 0.6 }));
    acUnit.position.set(-17.0, 4.18, -6.45);
    shopBuilding.add(acUnit);

    const awning = new THREE.Mesh(
      new THREE.BoxGeometry(6.6, 0.08, 1.65),
      new THREE.MeshStandardMaterial({ map: zincTex.map, metalness: 0.55, roughness: 0.45 })
    );
    awning.position.set(-17.0, 3.35, -5.85);
    awning.rotation.x = 0.22;
    shopBuilding.add(awning);

    const neonTube = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.65, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    neonTube.rotation.z = Math.PI / 2;
    neonTube.position.set(-16.7, 3.12, -5.3);
    shopBuilding.add(neonTube);

    const dishGroup = new THREE.Group();
    dishGroup.position.set(-14.2, 3.65, -5.25);
    const dishBowl = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 12, 8, 0, Math.PI * 2, 0, 0.72),
      new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.45, side: THREE.DoubleSide })
    );
    dishBowl.rotation.x = Math.PI * 0.72;
    dishBowl.position.set(0, 0.14, 0.1);
    dishGroup.add(dishBowl);
    shopBuilding.add(dishGroup);

    [-18.3, -14.7].forEach(lx => {
      const lan = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 10, 8),
        new THREE.MeshStandardMaterial({ color: 0xdc2626, emissive: 0x991b1b, emissiveIntensity: 0.75 })
      );
      lan.scale.set(0.95, 1.15, 0.95);
      lan.position.set(lx, 2.82, -5.5);
      shopBuilding.add(lan);
      glowSprites.push(addGlowSprite(shopBuilding, lx, 2.82, -5.5, 0.9, tex.fireGlowTex, 0.58));
    });

    const accordionDoor = new THREE.Mesh(
      new THREE.BoxGeometry(3.8, 3.0, 0.14),
      new THREE.MeshStandardMaterial({ map: tex.createAccordionDoorTexture(), roughness: 0.45, metalness: 0.55 })
    );
    accordionDoor.position.set(-16.5, 1.5, -6.28);
    const sideCreamWall = new THREE.Mesh(new THREE.BoxGeometry(0.25, 7.2, 5.8), creamWallMat);
    sideCreamWall.position.set(-13.5, 3.6, -9.2);
    const iceCooler = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.65, 0.52), new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 }));
    iceCooler.position.set(-17.8, 0.33, -4.15);
    const iceLid = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.08, 0.56), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 }));
    iceLid.position.set(-17.8, 0.68, -4.15);
    const blueBackBuilding = new THREE.Mesh(new THREE.BoxGeometry(12, 6.4, 5.5), new THREE.MeshStandardMaterial({ color: 0xa5c8e4, roughness: 0.85 }));
    blueBackBuilding.position.set(-6.5, 3.2, -10.5);
    shopBuilding.add(accordionDoor, sideCreamWall, iceCooler, iceLid, blueBackBuilding);
    world.add(shopBuilding);

    // Flanking Corrugated Zinc Fences & Front Utility Pole with "โตโต้ ซัก อบ รีด"
    const zincMat = new THREE.MeshStandardMaterial({
      map: zincTex.map,
      bumpMap: zincTex.bump,
      bumpScale: 0.07,
      metalness: 0.6,
      roughness: 0.42
    });
    const zincFenceGroup = new THREE.Group();
    const westZincPanel = new THREE.Mesh(new THREE.BoxGeometry(12.4, 2.75, 0.12), zincMat);
    westZincPanel.position.set(-7.4, 1.38, -5.55);
    const eastZincPanel = new THREE.Mesh(new THREE.BoxGeometry(6.4, 2.75, 0.12), zincMat);
    eastZincPanel.position.set(-23.6, 1.38, -5.55);
    zincFenceGroup.add(westZincPanel, eastZincPanel);

    const frontPole = new THREE.Mesh(new THREE.BoxGeometry(0.22, 7.2, 0.22), poleMat);
    frontPole.position.set(-21.5, 3.6, -3.0);
    const cableCoil = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.04, 6, 12), new THREE.MeshStandardMaterial({ color: 0x111827 }));
    cableCoil.position.set(-21.3, 5.35, -3.0);
    const poleLaundrySign = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 1.45, 0.07),
      new THREE.MeshStandardMaterial({ map: tex.createLaundrySignTexture(), roughness: 0.5 })
    );
    poleLaundrySign.position.set(-21.5, 1.05, -2.82);
    poleLaundrySign.rotation.y = 0.22;
    zincFenceGroup.add(frontPole, cableCoil, poleLaundrySign);

    const porcelainPotMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: tex.createPorcelainPotTexture(),
      roughness: 0.42
    });
    [-15.0, -14.4, -19.5].forEach(px => {
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.34, 10), porcelainPotMat);
      pot.position.set(px, 0.17, -5.15);
      const leaves = new THREE.Mesh(new THREE.DodecahedronGeometry(0.29, 0), bushLeafMat);
      leaves.position.set(px, 0.46, -5.15);
      const potShadow = new THREE.Mesh(new THREE.PlaneGeometry(0.65, 0.65), shadowDiscMat);
      potShadow.rotation.x = -Math.PI / 2;
      potShadow.position.set(px, 0.02, -5.15);
      zincFenceGroup.add(pot, leaves, potShadow);
    });

    const scooter = new THREE.Group();
    scooter.position.set(-2.8, 0, -4.5);
    scooter.rotation.y = -0.25;
    const scBody = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.42, 0.36), new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.35 }));
    scBody.position.y = 0.55;
    const scSeat = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.14, 0.32), darkSteelMat);
    scSeat.position.set(-0.15, 0.78, 0);
    const scShadow = new THREE.Mesh(new THREE.PlaneGeometry(1.75, 0.75), shadowDiscMat);
    scShadow.rotation.x = -Math.PI / 2;
    scShadow.position.y = 0.02;
    scooter.add(scShadow);
    [-0.52, 0.52].forEach(wx => {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.08, 10), new THREE.MeshStandardMaterial({ color: 0x171717 }));
      w.rotation.x = Math.PI / 2;
      w.position.set(wx, 0.24, 0);
      scooter.add(w);
    });
    scooter.add(scBody, scSeat);
    zincFenceGroup.add(scooter);

    for (let i = 0; i < 10; i++) {
      const x = -12.6 + i * 1.1;
      const fBulb = new THREE.Mesh(new THREE.SphereGeometry(0.055, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffdf8e }));
      fBulb.position.set(x, 2.66, -5.32);
      zincFenceGroup.add(fBulb);
      glowSprites.push(addGlowSprite(zincFenceGroup, x, 2.66, -5.32, 0.75, tex.warmGlowTex, 0.75));
    }
    world.add(zincFenceGroup);

    // ============================================================
    // 9. TOTO'S STALL + 4-STAGE 3D SIZZLING GRIDDLE + 4 CAMPING TABLES
    // ============================================================
    const CART_POS = new THREE.Vector3(TOTO.LOCATIONS.CART_POS.x, 0, TOTO.LOCATIONS.CART_POS.z);
    const cartGroup = new THREE.Group();
    cartGroup.position.copy(CART_POS);
    world.add(cartGroup);

    const stainlessMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.8, roughness: 0.25 });
    const castIronMat = new THREE.MeshStandardMaterial({ color: 0x18191c, metalness: 0.55, roughness: 0.68 });

    const cartBase = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.88, 1.08), stainlessMat);
    cartBase.position.set(0, 0.52, 0);
    cartGroup.add(cartBase);

    const cartSkirt = new THREE.Mesh(new THREE.PlaneGeometry(2.44, 0.84), new THREE.MeshStandardMaterial({ map: tex.createCartSkirtTexture(), roughness: 0.5 }));
    cartSkirt.position.set(0, 0.52, 0.552);
    cartGroup.add(cartSkirt);

    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x161616, roughness: 0.9 });
    [[-1.0, -0.4], [-1.0, 0.4], [1.0, -0.4], [1.0, 0.4]].forEach(([wx, wz]) => {
      const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.08, 10), wheelMat);
      wh.rotation.x = Math.PI / 2;
      wh.position.set(wx, 0.11, wz);
      cartGroup.add(wh);
    });

    const prepTable = new THREE.Group();
    prepTable.position.set(1.65, 0, -0.08);
    const ptTop = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.05, 0.86), stainlessMat);
    ptTop.position.y = 0.78;
    prepTable.add(ptTop);
    [[-0.38, -0.38], [0.38, -0.38], [-0.38, 0.38], [0.38, 0.38]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.78, 6), stainlessMat);
      leg.position.set(lx, 0.39, lz);
      prepTable.add(leg);
    });
    const cabbageMat = new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.7 });
    [-0.22, 0.02].forEach((cx, i) => {
      const cab = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), cabbageMat);
      cab.position.set(cx, 0.88, -0.18 + i * 0.12);
      prepTable.add(cab);
    });
    const sproutTray = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.34), stainlessMat);
    sproutTray.position.set(0.18, 0.86, 0.16);
    const sproutPile = new THREE.Mesh(new THREE.SphereGeometry(0.16, 7, 6), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.8 }));
    sproutPile.scale.set(1.1, 0.45, 0.9);
    sproutPile.position.set(0.18, 0.93, 0.16);
    const plateStack = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.12, 10), new THREE.MeshStandardMaterial({ color: 0xf1f5f9 }));
    plateStack.position.set(-0.22, 0.86, 0.22);
    prepTable.add(sproutTray, sproutPile, plateStack);
    cartGroup.add(prepTable);

    const griddleGroup = new THREE.Group();
    griddleGroup.position.set(0.32, 0.97, 0.02);
    cartGroup.add(griddleGroup);

    const panRim = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.062, 10, 20), castIronMat);
    panRim.rotation.x = Math.PI / 2;
    panRim.position.y = 0.07;
    const panPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.42, 0.04, 16), castIronMat);
    panPlate.position.y = 0.04;
    const oilSheen = new THREE.Mesh(
      new THREE.CircleGeometry(0.42, 16),
      new THREE.MeshStandardMaterial({ color: 0xc27816, roughness: 0.18, metalness: 0.25 })
    );
    oilSheen.rotation.x = -Math.PI / 2;
    oilSheen.position.y = 0.065;
    griddleGroup.add(panRim, panPlate, oilSheen);

    const flamesGroup = new THREE.Group();
    const flameMeshes = [];
    for (let f = 0; f < 6; f++) {
      const ang = (f / 6) * Math.PI * 2;
      const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.055, 0.11, 5),
        new THREE.MeshBasicMaterial({ color: f % 2 === 0 ? 0xf97316 : 0x38bdf8 })
      );
      flame.position.set(Math.cos(ang) * 0.24, 0.02, Math.sin(ang) * 0.24);
      flamesGroup.add(flame);
      flameMeshes.push({ mesh: flame, phase: f * 1.1 });
    }
    griddleGroup.add(flamesGroup);

    const wokFlameRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.46, 0.065, 6, 16),
      new THREE.MeshBasicMaterial({ color: 0xffa030, transparent: true, opacity: 0.85 })
    );
    wokFlameRing.rotation.x = Math.PI / 2;
    wokFlameRing.position.y = 0.11;
    wokFlameRing.visible = false;
    griddleGroup.add(wokFlameRing);

    const panFoodGroup = new THREE.Group();
    panFoodGroup.position.set(0, 0.085, 0);
    panFoodGroup.visible = false;
    griddleGroup.add(panFoodGroup);

    const panBatterMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.65 });
    const panBatterDisk = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.37, 0.024, 16), panBatterMat);
    panFoodGroup.add(panBatterDisk);

    const panBubbles = [];
    const bubbleMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    for (let b = 0; b < 6; b++) {
      const ba = (b / 6) * Math.PI * 2;
      const br = 0.14 + (b % 2) * 0.11;
      const bub = new THREE.Mesh(new THREE.SphereGeometry(0.022, 5, 5), bubbleMat);
      bub.position.set(Math.cos(ba) * br, 0.018, Math.sin(ba) * br);
      panFoodGroup.add(bub);
      panBubbles.push({ mesh: bub, phase: b * 1.4 });
    }

    const panEggGroup = new THREE.Group();
    const eggWhite = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.13, 0.014, 12), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 }));
    eggWhite.position.y = 0.02;
    const eggYolk = new THREE.Mesh(new THREE.SphereGeometry(0.048, 8, 8), new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.2 }));
    eggYolk.scale.set(1, 0.55, 1);
    eggYolk.position.y = 0.032;
    panEggGroup.add(eggWhite, eggYolk);
    panFoodGroup.add(panEggGroup);

    const panToppingsGroup = new THREE.Group();
    const panToppings = [];
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const r = 0.08 + (i % 3) * 0.06;
      const piece = new THREE.Mesh(new THREE.SphereGeometry(0.032, 6, 6), new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.45 }));
      piece.scale.set(1.25, 0.65, 0.85);
      piece.position.set(Math.cos(a) * r, 0.028, Math.sin(a) * r);
      panToppingsGroup.add(piece);
      panToppings.push(piece);
    }
    const chiveMat = new THREE.MeshStandardMaterial({ color: 0x16a34a });
    for (let c = 0; c < 6; c++) {
      const ch = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.01, 0.035), chiveMat);
      ch.position.set((Math.random() - 0.5) * 0.28, 0.03, (Math.random() - 0.5) * 0.28);
      ch.rotation.y = Math.random() * 3;
      panToppingsGroup.add(ch);
    }
    panFoodGroup.add(panToppingsGroup);

    const batterPot = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.24, 10), stainlessMat);
    batterPot.position.set(-0.28, 1.1, 0.1);
    cartGroup.add(batterPot);

    const pinkBasket = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.14, 0.34), new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.5 }));
    pinkBasket.position.set(-0.82, 1.03, 0.15);
    cartGroup.add(pinkBasket);
    for (let s = 0; s < 3; s++) {
      const bag = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.16, 0.14), new THREE.MeshStandardMaterial({ color: 0xd9a05b, roughness: 0.85 }));
      bag.position.set(-0.95 + s * 0.13, 1.15, 0.14);
      cartGroup.add(bag);
    }

    [0xdc2626, 0x92400e, 0xfef9c3, 0x16a34a].forEach((sc, i) => {
      const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.036, 0.18, 8), new THREE.MeshStandardMaterial({ color: sc, roughness: 0.35 }));
      bottle.position.set(-0.42 - i * 0.11, 1.06, -0.32);
      cartGroup.add(bottle);
    });

    [[-1.2, -0.5], [1.2, -0.5], [-1.2, 0.5], [1.2, 0.5]].forEach(([px, pz]) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 1.9, 8), darkSteelMat);
      post.position.set(px, 1.9, pz);
      cartGroup.add(post);
    });

    const stallRoof = new THREE.Mesh(new THREE.BoxGeometry(2.95, 0.06, 1.65), new THREE.MeshStandardMaterial({ map: tex.createRedRoofTextures(), metalness: 0.4, roughness: 0.5 }));
    stallRoof.position.set(0, 2.85, 0.08);
    stallRoof.rotation.x = 0.18;
    cartGroup.add(stallRoof);

    const menuTex = tex.createMenuBannerTexture();
    const backWoodMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.85 });
    const frontMenuMat = new THREE.MeshStandardMaterial({ map: menuTex, roughness: 0.5 });
    const menuBoard = new THREE.Mesh(new THREE.BoxGeometry(2.58, 0.56, 0.05), [
      backWoodMat, backWoodMat, backWoodMat, backWoodMat, frontMenuMat, backWoodMat
    ]);
    menuBoard.position.set(0, 2.48, 0.54);
    cartGroup.add(menuBoard);

    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfff3c4 });
    [-0.92, -0.1, 0.92].forEach(bx => {
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), bulbMat);
      bulb.position.set(bx, 2.42, 0.64);
      cartGroup.add(bulb);
      glowSprites.push(addGlowSprite(cartGroup, bx, 2.42, 0.64, 0.85, tex.warmGlowTex, 0.85));
    });

    // Hanging Lucky Jasmine & Marigold Garland + Ground Contact Shadow under Toto's Cart
    const cartShadow = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.85), shadowDiscMat);
    cartShadow.rotation.x = -Math.PI / 2;
    cartShadow.position.set(0, 0.02, 0.05);
    cartGroup.add(cartShadow);

    const garlandGroup = new THREE.Group();
    garlandGroup.position.set(-0.95, 2.25, 0.68);
    const malaiRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.11, 0.032, 7, 14),
      new THREE.MeshStandardMaterial({ color: 0xfefefe, roughness: 0.5 })
    );
    const malaiFlower = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.45 })
    );
    malaiFlower.position.y = -0.14;
    const malaiTail = new THREE.Mesh(
      new THREE.ConeGeometry(0.035, 0.12, 6),
      new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.5 })
    );
    malaiTail.rotation.x = Math.PI;
    malaiTail.position.y = -0.23;
    garlandGroup.add(malaiRing, malaiFlower, malaiTail);
    cartGroup.add(garlandGroup);

    const stallMainLight = new THREE.PointLight(0xffb454, 1.15, 16, 1.5);
    stallMainLight.position.set(1.5, 2.8, 0.6);
    cartGroup.add(stallMainLight);

    const TABLES = [];
    const chairColors = [0x1f242c, 0x262b34, 0x1e222a, 0x2c323d];
    function createSmallCampingChair(colorHex) {
      const g = new THREE.Group();
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x272a30, metalness: 0.7, roughness: 0.35 });
      const clothMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.88 });
      [[-0.22], [0.22]].forEach(([lx]) => {
        const leg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 5), frameMat);
        leg1.position.set(lx, 0.19, 0);
        leg1.rotation.x = 0.58;
        const leg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 5), frameMat);
        leg2.position.set(lx, 0.19, 0);
        leg2.rotation.x = -0.58;
        g.add(leg1, leg2);
      });
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.035, 0.38), clothMat);
      seat.position.set(0, 0.35, 0.02);
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.42, 0.035), clothMat);
      back.position.set(0, 0.56, -0.17);
      back.rotation.x = -0.18;
      g.add(seat, back);
      return g;
    }

    function createCampingTableUnit(index, x, z) {
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      const aluMat = new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.72, roughness: 0.35 });
      const topMat = new THREE.MeshStandardMaterial({ color: 0x1f242c, roughness: 0.6 });
      const tableTop = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.04, 0.62), topMat);
      tableTop.position.y = 0.54;
      g.add(tableTop);
      [[-0.36, -0.22], [0.36, -0.22], [-0.36, 0.22], [0.36, 0.22]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.54, 5), aluMat);
        leg.position.set(lx, 0.27, lz);
        g.add(leg);
      });
      const tissue = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.11, 7), new THREE.MeshStandardMaterial({ color: 0xf8fafc }));
      tissue.position.set(0.32, 0.61, -0.15);
      const chiliBottle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.028, 0.13, 7), new THREE.MeshStandardMaterial({ color: 0xdc2626 }));
      chiliBottle.position.set(0.34, 0.62, 0.06);
      g.add(tissue, chiliBottle);

      const chair1 = createSmallCampingChair(chairColors[index % chairColors.length]);
      chair1.position.set(-0.08, 0, -0.68);
      chair1.rotation.y = 0.06;
      const chair2 = createSmallCampingChair(chairColors[(index + 1) % chairColors.length]);
      chair2.position.set(0.72, 0, -0.32);
      chair2.rotation.y = -Math.PI / 2.6;
      const tblShadow = new THREE.Mesh(new THREE.PlaneGeometry(1.55, 1.25), shadowDiscMat);
      tblShadow.rotation.x = -Math.PI / 2;
      tblShadow.position.set(0.1, 0.02, -0.15);
      g.add(chair1, chair2, tblShadow);

      const ringMat = new THREE.MeshBasicMaterial({ color: 0xd4af6a, transparent: true, opacity: 0, side: THREE.DoubleSide });
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.72, 0.86, 20), ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.03;
      g.add(ring);

      const dishAnchor = new THREE.Group();
      dishAnchor.position.set(-0.08, 0.565, 0.02);
      g.add(dishAnchor);
      world.add(g);

      const tagEl = document.createElement('div');
      tagEl.className = 'table-tag';
      tagEl.style.display = 'none';
      document.getElementById('world-labels').appendChild(tagEl);

      TABLES.push({
        id: index + 1,
        group: g,
        pos: new THREE.Vector3(x, 0, z),
        seatPos: new THREE.Vector3(x - 0.08, 0, z - 0.65),
        serveSpot: new THREE.Vector3(x, 0, z + 1.0),
        dishAnchor,
        ringMat,
        tagEl,
        status: 'EMPTY',
        customer: null,
        order: null,
        patience: 1,
        maxPatience: 75,
        eatTimer: 0
      });
    }
    createCampingTableUnit(0, -12.3, -4.05);
    createCampingTableUnit(1, -10.0, -4.05);
    createCampingTableUnit(2, -7.7, -4.05);
    createCampingTableUnit(3, -5.4, -4.05);

    // ============================================================
    // 10. LOY KRATHONG FESTIVAL DECORATIONS & SUBTLE PIER LANTERNS
    // ============================================================
    const loyKrathongGroup = new THREE.Group();
    loyKrathongGroup.visible = true;
    world.add(loyKrathongGroup);

    const buntingMat = new THREE.MeshBasicMaterial({ map: tex.createBuntingTexture(), transparent: true, side: THREE.DoubleSide });
    const pondBuntingLeft = new THREE.Mesh(new THREE.PlaneGeometry(39.8, 0.42), buntingMat);
    pondBuntingLeft.position.set(-16.1, 1.02, 4.82);
    const pondBuntingRight = new THREE.Mesh(new THREE.PlaneGeometry(43.8, 0.42), buntingMat);
    pondBuntingRight.position.set(30.1, 1.02, 4.82);
    loyKrathongGroup.add(pondBuntingLeft, pondBuntingRight);

    // Refined warm Thai wood & gold lanterns flanking the brick promenade pier (X = 6)
    const pierX = TOTO.LOCATIONS.PIER_SPOT.x;
    const teakMat = new THREE.MeshStandardMaterial({ color: 0x5c341d, roughness: 0.72 });
    const lanternPaperMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, emissive: 0xd97706, emissiveIntensity: 0.85 });
    [-1.7, 1.7].forEach(ax => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, 2.25, 8), teakMat);
      pillar.position.set(pierX + ax, 1.12, 7.25);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.2, 6), goldAccentMat);
      cap.position.set(pierX + ax, 2.48, 7.25);
      const lanternBody = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.34, 8), lanternPaperMat);
      lanternBody.position.set(pierX + ax, 2.22, 7.25);
      loyKrathongGroup.add(pillar, cap, lanternBody);
      glowSprites.push(addGlowSprite(loyKrathongGroup, pierX + ax, 2.22, 7.25, 1.8, tex.warmGlowTex, 0.82));
    });

    // Catenary Draped Festival String Lights along South Boardwalk (1 InstancedMesh draw call!)
    const stringBulbCoords = [];
    const cordPts = [];
    const postXs = [-32, -22, -12, -2, 3.8, 8.2, 16, 24, 34, 44, 52];
    const poleSteelMat = new THREE.MeshStandardMaterial({ color: 0x3f2e21, roughness: 0.7 });
    postXs.forEach((px, idx) => {
      const fPole = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.04, 2.65, 6), poleSteelMat);
      fPole.position.set(px, 1.38, 7.62);
      loyKrathongGroup.add(fPole);
      if (idx < postXs.length - 1) {
        const nextX = postXs[idx + 1];
        let prevP = new THREE.Vector3(px, 2.65, 7.62);
        const steps = 6;
        for (let s = 1; s <= steps; s++) {
          const t = s / steps;
          const cx = THREE.MathUtils.lerp(px, nextX, t);
          const sag = Math.sin(t * Math.PI) * -0.45;
          const cy = 2.65 + sag;
          const nextP = new THREE.Vector3(cx, cy, 7.62);
          cordPts.push(prevP, nextP);
          if (s < steps) stringBulbCoords.push([cx, cy - 0.06, 7.62]);
          prevP = nextP;
        }
      }
    });
    loyKrathongGroup.add(new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints(cordPts),
      new THREE.LineBasicMaterial({ color: 0x1e2229 })
    ));

    const instancedStringBulbs = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.068, 7, 7),
      new THREE.MeshBasicMaterial({ color: 0xffe094 }),
      stringBulbCoords.length
    );
    stringBulbCoords.forEach(([bx, by, bz], idx) => {
      dummyMtx.position.set(bx, by, bz);
      dummyMtx.rotation.set(0, 0, 0);
      dummyMtx.scale.set(1, 1, 1);
      dummyMtx.updateMatrix();
      instancedStringBulbs.setMatrixAt(idx, dummyMtx.matrix);
    });
    instancedStringBulbs.instanceMatrix.needsUpdate = true;
    loyKrathongGroup.add(instancedStringBulbs);

    // 2 Roadside Krathong Vendor Booths / Rental Showcase Booth + 3D Sponsor Billboards
    const sponsorObjects = [];
    function registerSponsorTag(slot, worldPos, boardMesh) {
      const tagEl = document.createElement('button');
      tagEl.type = 'button';
      tagEl.className = 'sponsor-world-tag' + (slot.isAvailable === false ? ' active-sponsor' : '');
      tagEl.style.display = 'none';
      tagEl.textContent = slot.isAvailable === false ? `🏪 ${slot.title}` : `📢 ${slot.badge || 'พื้นที่โฆษณาว่าง • ติดต่อ'}`;
      tagEl.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (TOTO.onSelectSponsorSlot) TOTO.onSelectSponsorSlot(slot);
      });
      document.getElementById('world-labels').appendChild(tagEl);
      sponsorObjects.push({ slot, mesh: boardMesh, worldPos, tagEl });
    }

    function createKrathongBooth(bx, bz, rentalSlot) {
      const bg = new THREE.Group();
      bg.position.set(bx, 0.12, bz);
      const woodMat = new THREE.MeshStandardMaterial({ color: 0x7c4a26, roughness: 0.8 });
      const canopyMat = new THREE.MeshStandardMaterial({ color: rentalSlot ? 0x1e3a8a : 0x991b1b, roughness: 0.65 });
      const clothTrimMat = new THREE.MeshStandardMaterial({ color: 0xf6e3ba, roughness: 0.7 });

      const boothShadow = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 2.2), shadowDiscMat);
      boothShadow.rotation.x = -Math.PI / 2;
      boothShadow.position.y = 0.02;
      bg.add(boothShadow);

      [[-1.1, -0.65], [1.1, -0.65], [-1.1, 0.65], [1.1, 0.65]].forEach(([px, pz]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 2.35, 6), woodMat);
        leg.position.set(px, 1.18, pz);
        bg.add(leg);
      });
      const table = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.1, 1.1), woodMat);
      table.position.set(0, 0.88, 0.1);
      const apronSkirt = new THREE.Mesh(new THREE.BoxGeometry(2.32, 0.78, 0.95), clothTrimMat);
      apronSkirt.position.set(0, 0.45, 0.1);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.9, 0.75, 4), canopyMat);
      roof.rotation.y = Math.PI / 4;
      roof.position.set(0, 2.68, 0);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffe49e }));
      bulb.position.set(0, 2.15, 0.25);
      glowSprites.push(addGlowSprite(bg, 0, 2.15, 0.25, 1.8, tex.warmGlowTex, 0.78));

      // Display Krathongs on counter
      [-0.65, 0, 0.65].forEach((kx, ki) => {
        const kBase = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.1, 9), new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.65 }));
        kBase.position.set(kx, 0.98, 0.15);
        const kTop = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.16, 8), new THREE.MeshStandardMaterial({
          color: ki === 1 ? 0xfacc15 : (ki === 0 ? 0xf472b6 : 0xa855f7),
          roughness: 0.55
        }));
        kTop.position.set(kx, 1.10, 0.15);
        bg.add(kBase, kTop);
      });

      if (rentalSlot) {
        const bTex = tex.createBoothBannerTexture(rentalSlot);
        const signMat = new THREE.MeshStandardMaterial({
          map: bTex,
          emissive: 0x3b2a14,
          emissiveMap: bTex,
          emissiveIntensity: 0.45,
          roughness: 0.35
        });
        const signBoard = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.62, 0.08), signMat);
        signBoard.position.set(0, 2.12, -0.68);
        signBoard.rotation.y = Math.PI;
        signBoard.userData.sponsorSlot = rentalSlot;

        const signFront = signBoard.clone();
        signFront.position.set(0, 2.12, 0.68);
        signFront.rotation.y = 0;
        signFront.userData.sponsorSlot = rentalSlot;
        bg.add(signBoard, signFront);
        registerSponsorTag(rentalSlot, new THREE.Vector3(bx, 2.95, bz), signBoard);
      }

      bg.add(table, apronSkirt, roof, bulb);
      loyKrathongGroup.add(bg);
    }

    function createSponsorBillboard(slot) {
      const g = new THREE.Group();
      g.position.set(slot.x, 0.12, slot.z);
      g.rotation.y = slot.rotY || 0;

      const frameMat = new THREE.MeshStandardMaterial({ color: 0x452b16, roughness: 0.72 });
      const bGoldMat = new THREE.MeshStandardMaterial({ color: 0xd4af6a, metalness: 0.6, roughness: 0.35 });
      const bTex = tex.createSponsorBillboardTexture(slot);
      const panelMat = new THREE.MeshStandardMaterial({
        map: bTex,
        emissive: 0x1e293b,
        emissiveMap: bTex,
        emissiveIntensity: 0.62,
        roughness: 0.35
      });

      const sh = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.5), shadowDiscMat);
      sh.rotation.x = -Math.PI / 2;
      sh.position.y = 0.02;
      g.add(sh);

      [-1.35, 1.35].forEach(px => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 2.7, 7), frameMat);
        post.position.set(px, 1.35, 0);
        const cap = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.22, 6), bGoldMat);
        cap.position.set(px, 2.8, 0);
        g.add(post, cap);
      });

      const backing = new THREE.Mesh(new THREE.BoxGeometry(3.12, 1.56, 0.14), frameMat);
      backing.position.set(0, 1.92, 0);
      const faceFront = new THREE.Mesh(new THREE.PlaneGeometry(2.96, 1.42), panelMat);
      faceFront.position.set(0, 1.92, 0.08);
      faceFront.userData.sponsorSlot = slot;
      const faceBack = new THREE.Mesh(new THREE.PlaneGeometry(2.96, 1.42), panelMat);
      faceBack.position.set(0, 1.92, -0.08);
      faceBack.rotation.y = Math.PI;
      faceBack.userData.sponsorSlot = slot;

      [-0.85, 0.85].forEach(lx => {
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffe49e }));
        bulb.position.set(lx, 2.75, 0.22);
        g.add(bulb);
        glowSprites.push(addGlowSprite(g, lx, 2.75, 0.22, 1.1, tex.warmGlowTex, 0.65));
      });

      g.add(backing, faceFront, faceBack);
      world.add(g);
      registerSponsorTag(slot, new THREE.Vector3(slot.x, 2.95, slot.z), faceFront);
    }

    const slots = TOTO.SPONSOR_SLOTS || [];
    const rentalSlot = slots.find(s => s.kind === 'booth') || null;
    createKrathongBooth(-23.5, 4.95, null);
    createKrathongBooth(24.5, 4.95, rentalSlot);
    slots.filter(s => s.kind === 'billboard').forEach(s => createSponsorBillboard(s));

    // Drifting Golden Fireflies over Pond Margins & West Park Lawn (1 draw call THREE.Points)
    const fireflyCount = 56;
    const fireflyPos = new Float32Array(fireflyCount * 3);
    const fireflySeeds = new Float32Array(fireflyCount);
    for (let i = 0; i < fireflyCount; i++) {
      fireflyPos[i * 3] = -34 + Math.random() * 90;
      fireflyPos[i * 3 + 1] = 0.65 + Math.random() * 2.1;
      fireflyPos[i * 3 + 2] = 6.0 + Math.random() * 58;
      fireflySeeds[i] = Math.random() * Math.PI * 2;
    }
    const fireflyGeo = new THREE.BufferGeometry();
    fireflyGeo.setAttribute('position', new THREE.BufferAttribute(fireflyPos, 3));
    const fireflyPoints = new THREE.Points(
      fireflyGeo,
      new THREE.PointsMaterial({
        color: 0xfde047,
        size: 0.42,
        map: tex.warmGlowTex,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    );
    fireflyPoints.userData = { basePos: Float32Array.from(fireflyPos), seeds: fireflySeeds };
    loyKrathongGroup.add(fireflyPoints);

    // Central Fountain Mist Droplets Spray (1 draw call THREE.Points)
    const mistCount = 44;
    const mistPos = new Float32Array(mistCount * 3);
    const mistSeeds = new Float32Array(mistCount);
    for (let i = 0; i < mistCount; i++) {
      const ang = Math.random() * Math.PI * 2;
      const rad = 0.25 + Math.random() * 1.45;
      mistPos[i * 3] = 8 + Math.cos(ang) * rad;
      mistPos[i * 3 + 1] = Math.random() * 2.8;
      mistPos[i * 3 + 2] = 36 + Math.sin(ang) * rad;
      mistSeeds[i] = Math.random();
    }
    const mistGeo = new THREE.BufferGeometry();
    mistGeo.setAttribute('position', new THREE.BufferAttribute(mistPos, 3));
    const fountainMistPoints = new THREE.Points(
      mistGeo,
      new THREE.PointsMaterial({
        color: 0xe0f2fe,
        size: 0.55,
        map: tex.smokeTex,
        transparent: true,
        opacity: 0.42,
        depthWrite: false
      })
    );
    fountainMistPoints.userData = { seeds: mistSeeds };
    world.add(fountainMistPoints);

    const lotusTargetRing = new THREE.Group();
    lotusTargetRing.position.set(TOTO.LOCATIONS.POND_TARGET.x, -0.14, TOTO.LOCATIONS.POND_TARGET.z);
    const outerTargetRing = new THREE.Mesh(
      new THREE.RingGeometry(1.15, 1.35, 28),
      new THREE.MeshBasicMaterial({ color: 0xd4af6a, transparent: true, opacity: 0.45, side: THREE.DoubleSide })
    );
    outerTargetRing.rotation.x = -Math.PI / 2;
    lotusTargetRing.add(outerTargetRing);
    loyKrathongGroup.add(lotusTargetRing);

    const pierTagEl = document.createElement('div');
    pierTagEl.className = 'table-tag pier-tag';
    pierTagEl.style.display = 'none';
    pierTagEl.innerHTML = `<div class="t-head">ท่าน้ำสระหลวง</div><div class="t-dish">วางกระทงลงสระ</div>`;
    document.getElementById('world-labels').appendChild(pierTagEl);

    // ============================================================
    // 11. TIME OF DAY & FESTIVAL CONTROLLERS
    // ============================================================
    function setTimeOfDay(mode) {
      TOTO.STATE.timeMode = mode;
      const isDay = mode === 'DAY';
      const isSunset = mode === 'SUNSET';

      if (isDay) {
        skyMat.map = daySkyTex;
        skyMat.needsUpdate = true;
        scene.background = new THREE.Color(0xc8dff2);
        scene.fog = new THREE.FogExp2(0xc8dff2, 0.0028);
        hemiLight.color.setHex(0xffffff);
        hemiLight.groundColor.setHex(0x7c756a);
        hemiLight.intensity = 1.05;
        mainDirLight.color.setHex(0xfff6e5);
        mainDirLight.intensity = 1.25;
        mainDirLight.position.set(22, 48, 20);
        waterUniforms.uNightMix.value = 0.0;
        shophouseMat.emissiveIntensity = 0.04;
        stallMainLight.intensity = 0.30;
        instancedLightPools.visible = false;
        fireflyPoints.visible = false;
        nightSkyGroup.visible = false;
      } else if (isSunset) {
        skyMat.map = nightSkyTex;
        skyMat.needsUpdate = true;
        scene.background = new THREE.Color(0x2a1f36);
        scene.fog = new THREE.FogExp2(0x3a263e, 0.0038);
        hemiLight.color.setHex(0xfdba74);
        hemiLight.groundColor.setHex(0x2d1b26);
        hemiLight.intensity = 0.85;
        mainDirLight.color.setHex(0xff944d);
        mainDirLight.intensity = 0.95;
        mainDirLight.position.set(-30, 18, 28);
        waterUniforms.uNightMix.value = 0.65;
        shophouseMat.emissiveIntensity = 0.25;
        stallMainLight.intensity = 0.95;
        instancedLightPools.visible = true;
        fireflyPoints.visible = true;
        nightSkyGroup.visible = true;
      } else {
        skyMat.map = nightSkyTex;
        skyMat.needsUpdate = true;
        scene.background = new THREE.Color(0x070e1c);
        scene.fog = new THREE.FogExp2(0x0b1324, 0.0035);
        hemiLight.color.setHex(0x4b6b9e);
        hemiLight.groundColor.setHex(0x1a1512);
        hemiLight.intensity = 0.62;
        mainDirLight.color.setHex(0xa8c5f0);
        mainDirLight.intensity = 0.68;
        mainDirLight.position.set(18, 42, 85);
        waterUniforms.uNightMix.value = 1.0;
        shophouseMat.emissiveIntensity = 0.42;
        stallMainLight.intensity = 1.15;
        instancedLightPools.visible = true;
        fireflyPoints.visible = true;
        nightSkyGroup.visible = true;
      }

      glowSprites.forEach(sp => {
        sp.visible = !isDay;
      });
    }

    function setLoyKrathongFestival(enabled) {
      TOTO.STATE.loyKrathongMode = enabled;
      loyKrathongGroup.visible = enabled;
      if (enabled && TOTO.STATE.timeMode === 'DAY') {
        setTimeOfDay('NIGHT');
      }
    }

    setTimeOfDay(TOTO.STATE.timeMode);

    return {
      world,
      cartGroup,
      griddleGroup,
      panFoodGroup,
      panBatterMat,
      panBubbles,
      panEggGroup,
      panToppingsGroup,
      panToppings,
      wokFlameRing,
      flamesGroup,
      flameMeshes,
      stallMainLight,
      TABLES,
      waterUniforms,
      fountainPlumes,
      fireflyPoints,
      fountainMistPoints,
      sponsorObjects,
      loyKrathongGroup,
      lotusTargetRing,
      pierTagEl,
      setTimeOfDay,
      setLoyKrathongFestival
    };
  };
})();

(function () {
  'use strict';

  const TOTO = (window.TOTO = window.TOTO || {});

  TOTO.AVATAR_OPTIONS = {
    outfits: [
      { id: 'sabai', name: 'ชุดไทยสไบเฉียง', desc: 'สไบผ้าไหมทอลาย + โจงกระเบน', vipOnly: false },
      { id: 'rajpatan', name: 'เสื้อราชปะแตน', desc: 'คอตั้งกระดุม 5 เม็ด + ผ้าม่วง', vipOnly: false },
      { id: 'lanna', name: 'ชุดไทยล้านนา', desc: 'เสื้อแขนกระบอก + ผ้าซิ่นลายโบราณ', vipOnly: false },
      { id: 'student', name: 'ชุดนักเรียนไทย', desc: 'เสื้อขาวโบว์/เนกไท + กางเกง/กระโปรงกรมท่า', vipOnly: false },
      { id: 'street', name: 'สตรีทเที่ยวงาน', desc: 'เสื้อยืดชิลล์ๆ + กางเกงยีนส์', vipOnly: false },
      { id: 'chef', name: 'เชฟเจ๊แพรรี่', desc: 'ผ้ากันเปื้อนร้านดัง + ผ้าพันคอ', vipOnly: false },
      { id: 'likay', name: 'ชุดลิเก / แฟนซี', desc: 'กรองคอเพชร + อินทรธนูระยิบระยับ', vipOnly: false },
      { id: 'vip_gold', name: 'ชุดทองคำสระหลวง', desc: 'ชุดไทยจักรพรรดิสีทอง + มงกุฎชฎา', vipOnly: true }
    ],
    colors: [
      { id: '#d97724', name: 'ส้มทองอำพัน' },
      { id: '#c83e6b', name: 'ชมพูบานเย็น' },
      { id: '#1d6fa5', name: 'น้ำเงินคราม' },
      { id: '#15805d', name: 'เขียวมรกต' },
      { id: '#7c3aed', name: 'ม่วงกลีบบัว' },
      { id: '#ebe5d8', name: 'ขาวงาช้าง' }
    ],
    hairs: [
      { id: 'short', name: 'สั้นสุภาพ', desc: 'ผมสั้นเรียบร้อยเที่ยวงาน' },
      { id: 'bun', name: 'เกล้ามวยปิ่น', desc: 'มวยผมไทยปักปิ่นดอกไม้' },
      { id: 'long', name: 'ยาวสลวย', desc: 'ผมยาวพลิ้วระดับบ่า' },
      { id: 'bob', name: 'บ๊อบหน้าม้า', desc: 'ทรงบ๊อบร่วมสมัยน่ารัก' },
      { id: 'ponytail', name: 'มัดหางม้า', desc: 'รวบหางม้าเดินคล่องตัว' },
      { id: 'twintails', name: 'แกละคู่ทวินเทล', desc: 'มัดแกละสองข้างสุดคิวท์' },
      { id: 'wolfcut', name: 'วูล์ฟคัทสตรีท', desc: 'รากไทรแฟชั่นยอดฮิต' }
    ],
    hairColors: [
      { id: '#1b1817', name: 'ดำขลับ' },
      { id: '#4b3120', name: 'น้ำตาลเข้ม' },
      { id: '#8c5a32', name: 'น้ำตาลประกาย' },
      { id: '#cbd5e1', name: 'เงินประกายมุก' },
      { id: '#f472b6', name: 'ชมพูพาสเทล' },
      { id: '#3b82f6', name: 'น้ำเงินมิดไนท์' }
    ],
    skins: [
      { id: 'light', name: 'ขาวนวล', hex: '#f4cfb4' },
      { id: 'warm', name: 'น้ำผึ้ง', hex: '#e2ae84' },
      { id: 'tan', name: 'สีแทนทอง', hex: '#c7895c' },
      { id: 'deep', name: 'คมเข้ม', hex: '#94613f' }
    ],
    hats: [
      { id: 'none', name: 'ไม่ใส่หมวก', desc: 'โชว์ทรงผมสวยๆ' },
      { id: 'flower_crown', name: 'มงกุฎดอกไม้', desc: 'มาลัยดอกไม้พาสเทลเรืองแสง' },
      { id: 'cat_ears', name: 'หูแมวคิวท์', desc: 'ที่คาดผมหูแมวสุดน่ารัก' },
      { id: 'cap', name: 'หมวกแก๊ปสตรีท', desc: 'เข้าคู่สีชุดเที่ยวงาน' },
      { id: 'ngob', name: 'งอบไทยงานวัด', desc: 'งอบสานภูมิปัญญาน่ารัก' },
      { id: 'horns', name: 'เขามังกรทอง', desc: 'เขาแฟนตาซีเรืองแสง' },
      { id: 'chada', name: 'ชฎาทองคำ', desc: 'มงกุฎไทยทรงสูงคู่บารมี', vipOnly: true }
    ],
    glasses: [
      { id: 'none', name: 'หน้าใสธรรมชาติ', desc: 'แก้มชมพูระเรื่อ' },
      { id: 'sunglasses', name: 'แว่นกันแดดเท่ๆ', desc: 'เฟรมดำเงาสไตล์คูล' },
      { id: 'round', name: 'แว่นกลมวินเทจ', desc: 'กรอบทองบางน่ารัก' },
      { id: 'heart', name: 'แว่นหัวใจชมพู', desc: 'สายคอนเทนต์น่ารัก' },
      { id: 'fox_mask', name: 'หน้ากากจิ้งจอก', desc: 'หน้ากากงานเทศกาลญี่ปุ่น-ไทย' },
      { id: 'gold_mask', name: 'หน้ากากแฟนซีทอง', desc: 'หน้ากากราตรีหรูหรา' }
    ],
    backs: [
      { id: 'none', name: 'ไม่ใส่ของหลัง', desc: 'คล่องตัวสบายๆ' },
      { id: 'butterfly_wings', name: 'ปีกผีเสื้อราตรี', desc: 'ปีกคริสตัลเรืองแสงขยับได้' },
      { id: 'cape', name: 'ผ้าคลุมจอมยุทธ์', desc: 'ผ้าคลุมพลิ้วตามจังหวะเดิน' },
      { id: 'bear_bag', name: 'เป้น้องหมี', desc: 'กระเป๋าเป้ตุ๊กตาหมีน่ารัก' },
      { id: 'angel_wings', name: 'ปีกนางฟ้าสีทอง', desc: 'ปีกขนนกสีทองอร่ามขยับได้', vipOnly: true }
    ],
    auras: [
      { id: 'none', name: 'ไม่มีออร่า', desc: 'เรียบง่ายธรรมชาติ' },
      { id: 'fireflies', name: 'หิ่งห้อยทอง', desc: 'แสงหิ่งห้อยบินวนรอบตัว' },
      { id: 'mini_lantern', name: 'โคมจิ๋วลอยตาม', desc: 'โคมยี่เป็งน้อยลอยข้างไหล่' },
      { id: 'krathong_spirit', name: 'ภูตกระทงจิ๋ว', desc: 'น้องกระทงมีหน้ายิ้มลอยตาม' },
      { id: 'lotus_ring', name: 'วงแสงกลีบบัว', desc: 'วงเวทกลีบบัวหมุนใต้เท้า' }
    ],
    props: [
      { id: 'none', name: 'มือเปล่า', desc: 'เดินสบายๆ ชมสระหลวง' },
      { id: 'lantern', name: 'โคมยี่เป็ง', desc: 'โคมกระดาษเรืองแสงอุ่น' },
      { id: 'flower', name: 'พวงมาลัย', desc: 'มาลัยดอกมะลิ-ดาวเรือง' },
      { id: 'fan', name: 'พัดสานไทย', desc: 'พัดไม้ไผ่สานคลายร้อน' },
      { id: 'cotton_candy', name: 'สายไหมงานวัด', desc: 'สายไหมสีพาสเทลนุ่มฟู' },
      { id: 'sparkler', name: 'ไฟเย็นเรืองแสง', desc: 'ไฟเย็นประกายทองสุดคึกคัก' }
    ]
  };

  TOTO.AVATAR_PRESETS = [
    {
      id: 'noppamas',
      name: 'นางนพมาศ',
      profile: { outfit: 'sabai', color: '#c83e6b', hair: 'bun', hairColor: '#1b1817', skin: 'light', hat: 'flower_crown', glasses: 'none', back: 'none', aura: 'lotus_ring', prop: 'lantern' }
    },
    {
      id: 'teen',
      name: 'วัยรุ่นสระหลวง',
      profile: { outfit: 'street', color: '#1d6fa5', hair: 'wolfcut', hairColor: '#3b82f6', skin: 'warm', hat: 'cap', glasses: 'sunglasses', back: 'bear_bag', aura: 'fireflies', prop: 'cotton_candy' }
    },
    {
      id: 'fairy',
      name: 'เทพธิดาปีกแสง',
      profile: { outfit: 'lanna', color: '#7c3aed', hair: 'long', hairColor: '#f472b6', skin: 'light', hat: 'flower_crown', glasses: 'heart', back: 'butterfly_wings', aura: 'krathong_spirit', prop: 'sparkler' }
    },
    {
      id: 'student',
      name: 'นักเรียนหนองไผ่',
      profile: { outfit: 'student', color: '#1d6fa5', hair: 'twintails', hairColor: '#1b1817', skin: 'warm', hat: 'cat_ears', glasses: 'round', back: 'bear_bag', aura: 'mini_lantern', prop: 'flower' }
    }
  ];

  TOTO.DEFAULT_AVATAR_PROFILE = {
    name: 'นักท่องเที่ยว',
    outfit: 'sabai',
    color: '#d97724',
    hair: 'short',
    hairColor: '#1b1817',
    skin: 'warm',
    hat: 'none',
    glasses: 'none',
    back: 'none',
    aura: 'none',
    prop: 'lantern'
  };

  const PROFILE_STORAGE_KEY = 'saluang_avatar_profile_v1';
  const TAB_STORAGE_KEY = 'saluang_tab_avatar_v2';
  let cachedShadowTex = null;

  function getShadowTexture() {
    if (TOTO.textures && TOTO.textures.contactShadowTex) return TOTO.textures.contactShadowTex;
    if (cachedShadowTex) return cachedShadowTex;
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(32, 32, 4, 32, 32, 30);
    g.addColorStop(0, 'rgba(6, 10, 18, 0.52)');
    g.addColorStop(0.55, 'rgba(6, 10, 18, 0.22)');
    g.addColorStop(1, 'rgba(6, 10, 18, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    cachedShadowTex = new THREE.CanvasTexture(c);
    return cachedShadowTex;
  }

  TOTO.getSkinHex = function (skinId) {
    const found = TOTO.AVATAR_OPTIONS.skins.find(s => s.id === skinId);
    return found ? found.hex : '#e2ae84';
  };

  function normalizeProfile(rawObj) {
    const base = Object.assign({}, TOTO.DEFAULT_AVATAR_PROFILE);
    if (rawObj && typeof rawObj === 'object') {
      if (typeof rawObj.name === 'string' && rawObj.name.trim()) base.name = rawObj.name.trim().slice(0, 20);
      if (TOTO.AVATAR_OPTIONS.outfits.some(o => o.id === rawObj.outfit)) base.outfit = rawObj.outfit;
      if (/^#[0-9a-fA-F]{6}$/.test(rawObj.color || '')) base.color = rawObj.color.toLowerCase();
      if (TOTO.AVATAR_OPTIONS.hairs.some(h => h.id === rawObj.hair)) base.hair = rawObj.hair;
      if (/^#[0-9a-fA-F]{6}$/.test(rawObj.hairColor || '')) base.hairColor = rawObj.hairColor.toLowerCase();
      if (TOTO.AVATAR_OPTIONS.skins.some(s => s.id === rawObj.skin)) base.skin = rawObj.skin;
      if (TOTO.AVATAR_OPTIONS.hats.some(x => x.id === rawObj.hat)) base.hat = rawObj.hat;
      if (TOTO.AVATAR_OPTIONS.glasses.some(x => x.id === rawObj.glasses)) base.glasses = rawObj.glasses;
      if (TOTO.AVATAR_OPTIONS.backs.some(x => x.id === rawObj.back)) base.back = rawObj.back;
      if (TOTO.AVATAR_OPTIONS.auras.some(x => x.id === rawObj.aura)) base.aura = rawObj.aura;
      if (TOTO.AVATAR_OPTIONS.props.some(p => p.id === rawObj.prop)) base.prop = rawObj.prop;
    }
    const vip = !!(TOTO.STATE && TOTO.STATE.vipUnlocked);
    if (!vip) {
      if (base.outfit === 'vip_gold') base.outfit = 'sabai';
      if (base.hat === 'chada') base.hat = 'none';
      if (base.back === 'angel_wings') base.back = 'none';
    }
    return base;
  }

  TOTO.hasSavedAvatarProfile = function () {
    try {
      return !!(sessionStorage.getItem(TAB_STORAGE_KEY) || localStorage.getItem(PROFILE_STORAGE_KEY));
    } catch (e) {
      return false;
    }
  };

  TOTO.loadAvatarProfile = function () {
    let parsed = null;
    try {
      const tabRaw = sessionStorage.getItem(TAB_STORAGE_KEY);
      if (tabRaw) parsed = JSON.parse(tabRaw);
    } catch (e) { /* ignore */ }
    if (!parsed) {
      try {
        const localRaw = localStorage.getItem(PROFILE_STORAGE_KEY);
        if (localRaw) parsed = JSON.parse(localRaw);
      } catch (e) { /* ignore */ }
    }
    return normalizeProfile(parsed);
  };

  TOTO.saveAvatarProfile = function (profile) {
    const clean = normalizeProfile(profile);
    try { sessionStorage.setItem(TAB_STORAGE_KEY, JSON.stringify(clean)); } catch (e) { /* ignore */ }
    try { localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(clean)); } catch (e) { /* ignore */ }
  };

  TOTO.randomAvatarProfile = function (isVip, currentName) {
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const outfits = TOTO.AVATAR_OPTIONS.outfits.filter(x => !x.vipOnly || isVip);
    const hats = TOTO.AVATAR_OPTIONS.hats.filter(x => !x.vipOnly || isVip);
    const backs = TOTO.AVATAR_OPTIONS.backs.filter(x => !x.vipOnly || isVip);
    return normalizeProfile({
      name: currentName || TOTO.DEFAULT_AVATAR_PROFILE.name,
      outfit: pick(outfits).id,
      color: pick(TOTO.AVATAR_OPTIONS.colors).id,
      hair: pick(TOTO.AVATAR_OPTIONS.hairs).id,
      hairColor: pick(TOTO.AVATAR_OPTIONS.hairColors).id,
      skin: pick(TOTO.AVATAR_OPTIONS.skins).id,
      hat: pick(hats).id,
      glasses: pick(TOTO.AVATAR_OPTIONS.glasses).id,
      back: pick(backs).id,
      aura: pick(TOTO.AVATAR_OPTIONS.auras).id,
      prop: pick(TOTO.AVATAR_OPTIONS.props).id
    });
  };

  function makeSilkPatternTexture(baseHex, isVip) {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext('2d');
    ctx.fillStyle = isVip ? '#eab308' : (baseHex || '#d97724');
    ctx.fillRect(0, 0, 128, 128);

    ctx.strokeStyle = isVip ? 'rgba(255, 250, 210, 0.45)' : 'rgba(255, 232, 168, 0.25)';
    ctx.lineWidth = 2;
    for (let y = 0; y < 128; y += 16) {
      for (let x = 0; x < 128; x += 16) {
        ctx.beginPath();
        ctx.moveTo(x + 8, y + 2);
        ctx.lineTo(x + 14, y + 8);
        ctx.lineTo(x + 8, y + 14);
        ctx.lineTo(x + 2, y + 8);
        ctx.closePath();
        ctx.stroke();
      }
    }
    ctx.fillStyle = isVip ? '#fef08a' : '#f59e0b';
    ctx.fillRect(0, 108, 128, 10);
    ctx.fillStyle = isVip ? '#78350f' : '#1e1b18';
    ctx.fillRect(0, 118, 128, 10);

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.userData = { disposable: true };
    return tex;
  }

  function buildHandheldProp(propId) {
    const g = new THREE.Group();
    if (propId === 'lantern') {
      const stick = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.36, 6),
        new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.7 })
      );
      stick.rotation.x = Math.PI / 2;
      stick.position.set(0, -0.02, 0.12);
      g.add(stick);

      const cord = new THREE.Mesh(
        new THREE.CylinderGeometry(0.006, 0.006, 0.14, 5),
        new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5 })
      );
      cord.position.set(0, -0.1, 0.28);
      g.add(cord);

      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.095, 0.078, 0.22, 10),
        new THREE.MeshStandardMaterial({
          color: 0xfef3c7,
          emissive: 0xf59e0b,
          emissiveIntensity: 0.9,
          roughness: 0.45
        })
      );
      body.position.set(0, -0.25, 0.28);
      g.add(body);

      const rimMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.4, metalness: 0.3 });
      const topRim = new THREE.Mesh(new THREE.CylinderGeometry(0.098, 0.098, 0.022, 10), rimMat);
      topRim.position.set(0, -0.14, 0.28);
      const botRim = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.082, 0.022, 10), rimMat);
      botRim.position.set(0, -0.36, 0.28);
      g.add(topRim, botRim);

      if (TOTO.addGlowSprite && TOTO.textures && TOTO.textures.warmGlowTex) {
        TOTO.addGlowSprite(g, 0, -0.25, 0.28, 0.72, TOTO.textures.warmGlowTex, 0.62);
      }
      g.userData.propLantern = body;
    } else if (propId === 'flower') {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.08, 0.026, 8, 16),
        new THREE.MeshStandardMaterial({ color: 0xfefefe, roughness: 0.55 })
      );
      ring.position.set(0, -0.08, 0.06);
      g.add(ring);

      const marigold = new THREE.Mesh(
        new THREE.SphereGeometry(0.036, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0x78350f, emissiveIntensity: 0.15, roughness: 0.5 })
      );
      marigold.position.set(0, -0.16, 0.06);
      const tassel = new THREE.Mesh(
        new THREE.ConeGeometry(0.024, 0.09, 7),
        new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.55 })
      );
      tassel.rotation.x = Math.PI;
      tassel.position.set(0, -0.22, 0.06);
      g.add(marigold, tassel);
    } else if (propId === 'fan') {
      const handle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.014, 0.016, 0.18, 6),
        new THREE.MeshStandardMaterial({ color: 0x784b26, roughness: 0.7 })
      );
      handle.position.set(0, 0.04, 0.05);
      const blade = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.14, 0.014, 12),
        new THREE.MeshStandardMaterial({ color: 0xe6c385, roughness: 0.65 })
      );
      blade.rotation.x = Math.PI / 2;
      blade.scale.set(1.0, 1.0, 1.12);
      blade.position.set(0, 0.18, 0.05);
      const trim = new THREE.Mesh(
        new THREE.TorusGeometry(0.142, 0.01, 6, 16),
        new THREE.MeshStandardMaterial({ color: 0xc83e6b, roughness: 0.5 })
      );
      trim.scale.set(1, 1.12, 1);
      trim.position.set(0, 0.18, 0.05);
      g.add(handle, blade, trim);
    } else if (propId === 'cotton_candy') {
      const stick = new THREE.Mesh(
        new THREE.CylinderGeometry(0.01, 0.01, 0.28, 6),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 })
      );
      stick.rotation.x = 0.35;
      stick.position.set(0, 0.09, 0.08);
      const p1 = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.115, 1),
        new THREE.MeshStandardMaterial({ color: 0xf9a8d4, emissive: 0x831843, emissiveIntensity: 0.16, roughness: 0.85 })
      );
      p1.position.set(0, 0.24, 0.11);
      const p2 = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.085, 1),
        new THREE.MeshStandardMaterial({ color: 0x93c5fd, emissive: 0x1e3a8a, emissiveIntensity: 0.14, roughness: 0.85 })
      );
      p2.position.set(0.05, 0.28, 0.10);
      g.add(stick, p1, p2);
    } else if (propId === 'sparkler') {
      const wire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.008, 0.26, 6),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7, roughness: 0.3 })
      );
      wire.rotation.x = 0.5;
      wire.position.set(0, 0.10, 0.06);
      const star = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.055, 0),
        new THREE.MeshBasicMaterial({ color: 0xfef08a })
      );
      star.position.set(0, 0.24, 0.08);
      g.add(wire, star);
      if (TOTO.addGlowSprite && TOTO.textures && TOTO.textures.warmGlowTex) {
        TOTO.addGlowSprite(g, 0, 0.24, 0.08, 0.55, TOTO.textures.warmGlowTex, 0.85);
      }
      g.userData.sparkStar = star;
    }
    return g;
  }

  function buildHat(hatId, goldMat, accentHex) {
    const g = new THREE.Group();
    if (!hatId || hatId === 'none') return g;

    if (hatId === 'flower_crown') {
      const band = new THREE.Mesh(
        new THREE.TorusGeometry(0.168, 0.016, 6, 18),
        new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 })
      );
      band.rotation.x = Math.PI / 2 - 0.16;
      band.position.y = 0.095;
      g.add(band);
      const petalCols = [0xf472b6, 0xfef08a, 0xf8fafc, 0xc084fc, 0xfb923c];
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const fl = new THREE.Mesh(
          new THREE.SphereGeometry(0.032, 7, 7),
          new THREE.MeshStandardMaterial({
            color: petalCols[i % petalCols.length],
            emissive: petalCols[i % petalCols.length],
            emissiveIntensity: 0.28,
            roughness: 0.45
          })
        );
        fl.position.set(Math.cos(a) * 0.172, 0.095 + Math.sin(a) * -0.025, Math.sin(a) * 0.172);
        g.add(fl);
      }
    } else if (hatId === 'cat_ears') {
      const bandMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.6 });
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.165, 0.014, 6, 16, Math.PI), bandMat);
      band.position.y = 0.04;
      g.add(band);
      const pinkInner = new THREE.MeshStandardMaterial({ color: 0xf472b6, emissive: 0x831843, emissiveIntensity: 0.2, roughness: 0.5 });
      [-1, 1].forEach(side => {
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.11, 4), bandMat);
        ear.position.set(side * 0.11, 0.19, 0.01);
        ear.rotation.z = -side * 0.34;
        ear.rotation.y = Math.PI / 4;
        const inner = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.068, 4), pinkInner);
        inner.position.set(side * 0.11, 0.185, 0.028);
        inner.rotation.z = -side * 0.34;
        inner.rotation.y = Math.PI / 4;
        g.add(ear, inner);
      });
    } else if (hatId === 'cap') {
      const capMat = new THREE.MeshStandardMaterial({ color: accentHex, roughness: 0.68 });
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.52), capMat);
      dome.position.y = 0.04;
      const brim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.175, 0.18, 0.022, 12, 1, false, -Math.PI * 0.42, Math.PI * 0.84),
        capMat
      );
      brim.position.set(0, 0.055, 0.085);
      brim.rotation.x = 0.14;
      g.add(dome, brim);
    } else if (hatId === 'ngob') {
      const bambooMat = new THREE.MeshStandardMaterial({ color: 0xd9b36c, roughness: 0.82 });
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.17, 16), bambooMat);
      cone.position.set(0, 0.185, -0.01);
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.175, 0.05, 12), new THREE.MeshStandardMaterial({ color: 0x784b26, roughness: 0.8 }));
      crown.position.set(0, 0.11, -0.01);
      g.add(cone, crown);
    } else if (hatId === 'horns') {
      const hornMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xd97706,
        emissiveIntensity: 0.45,
        roughness: 0.35,
        metalness: 0.4
      });
      [-1, 1].forEach(side => {
        const lower = new THREE.Mesh(new THREE.ConeGeometry(0.038, 0.15, 8), hornMat);
        lower.position.set(side * 0.11, 0.18, 0.02);
        lower.rotation.z = -side * 0.48;
        lower.rotation.x = -0.22;
        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.024, 0.12, 8), hornMat);
        tip.position.set(side * 0.16, 0.27, 0.0);
        tip.rotation.z = -side * 0.12;
        g.add(lower, tip);
      });
    } else if (hatId === 'chada') {
      const baseRing = new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.16, 0.055, 12), goldMat);
      baseRing.position.y = 0.165;
      const tier2 = new THREE.Mesh(new THREE.ConeGeometry(0.115, 0.22, 10), goldMat);
      tier2.position.y = 0.29;
      const spire = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.18, 8), goldMat);
      spire.position.y = 0.45;
      g.add(baseRing, tier2, spire);
    }
    return g;
  }

  function buildGlasses(glassesId, goldMat) {
    const g = new THREE.Group();
    if (!glassesId || glassesId === 'none') {
      const blushMat = new THREE.MeshBasicMaterial({ color: 0xf472b6, transparent: true, opacity: 0.55 });
      [-0.09, 0.09].forEach(bx => {
        const b = new THREE.Mesh(new THREE.SphereGeometry(0.024, 6, 6), blushMat);
        b.scale.set(1.2, 0.65, 0.4);
        b.position.set(bx, -0.022, 0.142);
        g.add(b);
      });
      return g;
    }

    if (glassesId === 'sunglasses') {
      const lensMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.15, metalness: 0.85 });
      [-0.058, 0.058].forEach(lx => {
        const l = new THREE.Mesh(new THREE.BoxGeometry(0.088, 0.052, 0.02), lensMat);
        l.position.set(lx, 0.015, 0.16);
        g.add(l);
      });
      const br = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.014, 0.016), lensMat);
      br.position.set(0, 0.022, 0.16);
      g.add(br);
    } else if (glassesId === 'round') {
      [-0.058, 0.058].forEach(lx => {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.007, 6, 14), goldMat);
        ring.position.set(lx, 0.015, 0.16);
        g.add(ring);
      });
      const br = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.008, 0.008), goldMat);
      br.position.set(0, 0.018, 0.16);
      g.add(br);
    } else if (glassesId === 'heart') {
      const heartMat = new THREE.MeshStandardMaterial({ color: 0xec4899, emissive: 0x9d174d, emissiveIntensity: 0.25, roughness: 0.35 });
      [-0.058, 0.058].forEach(lx => {
        const l = new THREE.Mesh(new THREE.TorusGeometry(0.042, 0.011, 6, 12), heartMat);
        l.scale.set(1.08, 0.92, 1);
        l.position.set(lx, 0.015, 0.16);
        const core = new THREE.Mesh(new THREE.CircleGeometry(0.036, 10), new THREE.MeshBasicMaterial({ color: 0xf472b6, transparent: true, opacity: 0.45 }));
        core.position.set(lx, 0.015, 0.161);
        g.add(l, core);
      });
      const br = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.01, 0.01), heartMat);
      br.position.set(0, 0.02, 0.16);
      g.add(br);
    } else if (glassesId === 'fox_mask') {
      const maskWhite = new THREE.MeshStandardMaterial({ color: 0xfefefe, roughness: 0.4 });
      const maskRed = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.45 });
      const face = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.17, 0.05), maskWhite);
      face.position.set(0.08, 0.11, 0.11);
      face.rotation.z = -0.32;
      face.rotation.y = 0.35;
      [-0.06, 0.06].forEach(ex => {
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.038, 0.075, 4), maskWhite);
        ear.position.set(0.08 + ex * 0.9, 0.22, 0.10);
        ear.rotation.z = -0.32;
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.018, 0.055), maskRed);
        stripe.position.set(0.08 + ex * 1.1, 0.10, 0.115);
        stripe.rotation.z = -0.32;
        g.add(ear, stripe);
      });
      g.add(face);
    } else if (glassesId === 'gold_mask') {
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.075, 0.04), goldMat);
      plate.position.set(0, 0.02, 0.155);
      const wingL = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.09, 4), goldMat);
      wingL.rotation.z = 1.1;
      wingL.position.set(-0.145, 0.045, 0.14);
      const wingR = wingL.clone();
      wingR.rotation.z = -1.1;
      wingR.position.x = 0.145;
      g.add(plate, wingL, wingR);
    }
    return g;
  }

  function buildBackItem(backId, primaryMat, goldMat) {
    const res = { group: new THREE.Group(), wingL: null, wingR: null, cape: null };
    if (!backId || backId === 'none') return res;

    if (backId === 'angel_wings') {
      const wingMat = new THREE.MeshStandardMaterial({
        color: 0xfffbeb,
        emissive: 0xfef08a,
        emissiveIntensity: 0.45,
        roughness: 0.32
      });
      const makeWing = (side) => {
        const piv = new THREE.Group();
        piv.position.set(side * 0.12, 1.24, -0.18);
        const upper = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.22, 0.04), wingMat);
        upper.position.set(side * 0.28, 0.12, -0.03);
        upper.rotation.z = side * 0.32;
        const lower = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.035), goldMat);
        lower.position.set(side * 0.21, -0.05, -0.03);
        lower.rotation.z = side * 0.12;
        piv.add(upper, lower);
        return piv;
      };
      res.wingL = makeWing(-1);
      res.wingR = makeWing(1);
      res.group.add(res.wingL, res.wingR);
    } else if (backId === 'butterfly_wings') {
      const upperMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x7c3aed,
        emissiveIntensity: 0.52,
        transparent: true,
        opacity: 0.86,
        roughness: 0.25
      });
      const lowerMat = new THREE.MeshStandardMaterial({
        color: 0xc084fc,
        emissive: 0x2563eb,
        emissiveIntensity: 0.42,
        transparent: true,
        opacity: 0.82,
        roughness: 0.3
      });
      const makeButterfly = (side) => {
        const piv = new THREE.Group();
        piv.position.set(side * 0.09, 1.24, -0.18);
        const up = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.16, 0.025, 10), upperMat);
        up.rotation.x = Math.PI / 2;
        up.scale.set(1.25, 1, 1.05);
        up.position.set(side * 0.27, 0.14, -0.02);
        up.rotation.z = side * 0.38;
        const lo = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.13, 0.025, 10), lowerMat);
        lo.rotation.x = Math.PI / 2;
        lo.position.set(side * 0.21, -0.12, -0.02);
        lo.rotation.z = -side * 0.22;
        piv.add(up, lo);
        return piv;
      };
      res.wingL = makeButterfly(-1);
      res.wingR = makeButterfly(1);
      res.group.add(res.wingL, res.wingR);
    } else if (backId === 'cape') {
      const piv = new THREE.Group();
      piv.position.set(0, 1.36, -0.18);
      const cloth = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.86, 0.03), primaryMat);
      cloth.position.set(0, -0.43, -0.03);
      cloth.rotation.x = 0.12;
      piv.add(cloth);
      res.cape = piv;
      res.group.add(piv);
    } else if (backId === 'bear_bag') {
      const furMat = new THREE.MeshStandardMaterial({ color: 0xa16207, roughness: 0.88 });
      const bellyMat = new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.85 });
      const bg = new THREE.Group();
      bg.position.set(0, 1.15, -0.24);
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 10), furMat);
      body.scale.set(0.95, 1.15, 0.65);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.115, 10, 10), furMat);
      head.position.y = 0.18;
      const snout = new THREE.Mesh(new THREE.SphereGeometry(0.048, 8, 8), bellyMat);
      snout.position.set(0, 0.16, -0.095);
      [-0.085, 0.085].forEach(ex => {
        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.042, 7, 7), furMat);
        ear.position.set(ex, 0.26, 0);
        bg.add(ear);
      });
      bg.add(body, head, snout);
      res.group.add(bg);
    }
    return res;
  }

  function buildAuraItem(auraId) {
    const res = { group: new THREE.Group(), orbitGroup: null, floatGroup: null, lotusRing: null };
    if (!auraId || auraId === 'none') return res;

    if (auraId === 'fireflies') {
      const orb = new THREE.Group();
      orb.position.set(0, 1.1, 0);
      const dotMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const d = new THREE.Mesh(new THREE.SphereGeometry(0.036, 6, 6), dotMat);
        d.position.set(Math.cos(a) * 0.56, Math.sin(a * 2) * 0.25, Math.sin(a) * 0.56);
        orb.add(d);
      }
      res.orbitGroup = orb;
      res.group.add(orb);
    } else if (auraId === 'mini_lantern') {
      const fl = new THREE.Group();
      fl.position.set(0.46, 1.62, 0.08);
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.075, 0.06, 0.17, 10),
        new THREE.MeshStandardMaterial({ color: 0xfef3c7, emissive: 0xf59e0b, emissiveIntensity: 0.95, roughness: 0.4 })
      );
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.078, 0.02, 10), new THREE.MeshStandardMaterial({ color: 0xb45309 }));
      rim.position.y = 0.09;
      fl.add(body, rim);
      if (TOTO.addGlowSprite && TOTO.textures && TOTO.textures.warmGlowTex) {
        TOTO.addGlowSprite(fl, 0, 0, 0, 0.6, TOTO.textures.warmGlowTex, 0.65);
      }
      res.floatGroup = fl;
      res.group.add(fl);
    } else if (auraId === 'krathong_spirit') {
      const fl = new THREE.Group();
      fl.position.set(-0.48, 1.60, 0.12);
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.085, 0.08, 10),
        new THREE.MeshStandardMaterial({ color: 0x16a34a, emissive: 0x14532d, emissiveIntensity: 0.35, roughness: 0.6 })
      );
      const lotus = new THREE.Mesh(
        new THREE.ConeGeometry(0.08, 0.12, 8),
        new THREE.MeshStandardMaterial({ color: 0xf472b6, emissive: 0xdb2777, emissiveIntensity: 0.45, roughness: 0.45 })
      );
      lotus.position.y = 0.09;
      const eyeM = new THREE.MeshBasicMaterial({ color: 0x0f172a });
      [-0.032, 0.032].forEach(ex => {
        const e = new THREE.Mesh(new THREE.SphereGeometry(0.014, 5, 5), eyeM);
        e.position.set(ex, 0.02, 0.095);
        fl.add(e);
      });
      fl.add(base, lotus);
      if (TOTO.addGlowSprite && TOTO.textures && TOTO.textures.warmGlowTex) {
        TOTO.addGlowSprite(fl, 0, 0.08, 0, 0.58, TOTO.textures.warmGlowTex, 0.55);
      }
      res.floatGroup = fl;
      res.group.add(fl);
    } else if (auraId === 'lotus_ring') {
      const rg = new THREE.Group();
      rg.position.set(0, 0.04, 0);
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.55, 0.018, 6, 24),
        new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.72 })
      );
      ring.rotation.x = Math.PI / 2;
      rg.add(ring);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const p = new THREE.Mesh(
          new THREE.SphereGeometry(0.035, 6, 6),
          new THREE.MeshBasicMaterial({ color: 0xf472b6 })
        );
        p.position.set(Math.cos(a) * 0.55, 0.02, Math.sin(a) * 0.55);
        rg.add(p);
      }
      res.lotusRing = rg;
      res.group.add(rg);
    }
    return res;
  }

  TOTO.createCustomAvatar = function (profileInput) {
    const profile = normalizeProfile(profileInput);
    const isVip = profile.outfit === 'vip_gold' || Boolean(profileInput && profileInput.isVip);

    const root = new THREE.Group();
    const skinMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(TOTO.getSkinHex(profile.skin)),
      roughness: 0.68,
      metalness: 0.02
    });
    const hairMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(profile.hairColor || '#1b1817'),
      roughness: 0.72,
      metalness: 0.06
    });
    const silkTex = makeSilkPatternTexture(profile.color, isVip && profile.outfit === 'vip_gold');
    const primaryMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: silkTex,
      roughness: profile.outfit === 'vip_gold' ? 0.35 : 0.62,
      metalness: profile.outfit === 'vip_gold' ? 0.38 : 0.05,
      emissive: profile.outfit === 'vip_gold' ? 0x713f12 : 0x000000,
      emissiveIntensity: profile.outfit === 'vip_gold' ? 0.25 : 0
    });
    const accentHex = new THREE.Color(profile.color || '#d97724');
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0x713f12,
      emissiveIntensity: isVip ? 0.32 : 0.14,
      roughness: 0.28,
      metalness: 0.72
    });
    const creamMat = new THREE.MeshStandardMaterial({ color: 0xf8f3e8, roughness: 0.65 });
    const silverMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.75, roughness: 0.28 });

    let lowerColor = 0x3b1f3b;
    if (profile.outfit === 'street') lowerColor = 0x243b5c;
    else if (profile.outfit === 'student') lowerColor = 0x172554;
    else if (profile.outfit === 'chef') lowerColor = 0x1f2937;
    else if (profile.outfit === 'vip_gold') lowerColor = 0x92400e;
    const navyPantMat = new THREE.MeshStandardMaterial({ color: lowerColor, roughness: 0.78 });

    const shoeMat = new THREE.MeshStandardMaterial({
      color: (profile.outfit === 'street' || profile.outfit === 'student') ? 0xf3f4f6 : 0x3a2618,
      roughness: 0.68
    });

    // Contact shadow disc
    const shadowDisc = new THREE.Mesh(
      new THREE.PlaneGeometry(0.95, 0.95),
      new THREE.MeshBasicMaterial({ map: getShadowTexture(), transparent: true, depthWrite: false })
    );
    shadowDisc.rotation.x = -Math.PI / 2;
    shadowDisc.position.y = 0.018;
    root.add(shadowDisc);

    const bodyPivot = new THREE.Group();
    root.add(bodyPivot);

    // Lower body / Legs (Pivots at hip y = 0.74)
    const leftLegPivot = new THREE.Group();
    leftLegPivot.position.set(-0.125, 0.74, 0);
    const rightLegPivot = new THREE.Group();
    rightLegPivot.position.set(0.125, 0.74, 0);

    function buildLeg(pivot) {
      const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.072, 0.40, 10), navyPantMat);
      upper.position.y = -0.20;
      const bareLower = (profile.outfit === 'sabai' || profile.outfit === 'lanna' || profile.outfit === 'student');
      const lower = new THREE.Mesh(
        new THREE.CylinderGeometry(0.062, 0.052, 0.30, 9),
        bareLower ? skinMat : navyPantMat
      );
      lower.position.y = -0.52;
      const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.07, 0.21), shoeMat);
      shoe.position.set(0, -0.70, 0.035);
      pivot.add(upper, lower, shoe);
    }
    buildLeg(leftLegPivot);
    buildLeg(rightLegPivot);
    bodyPivot.add(leftLegPivot, rightLegPivot);

    // Hip / Waist garment
    const hipGroup = new THREE.Group();
    hipGroup.position.set(0, 0.82, 0);
    if (profile.outfit === 'sabai' || profile.outfit === 'lanna') {
      const sinh = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.24, profile.outfit === 'lanna' ? 0.56 : 0.42, 14), primaryMat);
      sinh.position.y = profile.outfit === 'lanna' ? -0.14 : -0.08;
      hipGroup.add(sinh);
    } else if (profile.outfit === 'student') {
      const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.195, 0.25, 0.36, 12), navyPantMat);
      skirt.position.y = -0.08;
      hipGroup.add(skirt);
    } else if (profile.outfit === 'rajpatan' || profile.outfit === 'vip_gold' || profile.outfit === 'likay') {
      const chong = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.25, 0.34, 14), profile.outfit === 'likay' ? primaryMat : navyPantMat);
      chong.position.y = -0.05;
      hipGroup.add(chong);
    } else {
      const waistBand = new THREE.Mesh(new THREE.CylinderGeometry(0.195, 0.205, 0.22, 12), navyPantMat);
      waistBand.position.y = -0.02;
      hipGroup.add(waistBand);
    }
    bodyPivot.add(hipGroup);

    // Torso (y = 0.88 .. 1.44)
    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 1.14, 0);

    if (profile.outfit === 'sabai') {
      const bodice = new THREE.Mesh(new THREE.CylinderGeometry(0.185, 0.175, 0.48, 14), creamMat);
      const sabaiWrap = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.56, 0.29), primaryMat);
      sabaiWrap.rotation.z = 0.36;
      sabaiWrap.position.set(-0.04, 0.02, 0.01);
      const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.055, 14), goldMat);
      belt.position.y = -0.22;
      const brooch = new THREE.Mesh(new THREE.OctahedronGeometry(0.042, 0), goldMat);
      brooch.position.set(-0.11, 0.18, 0.16);
      torsoGroup.add(bodice, sabaiWrap, belt, brooch);
    } else if (profile.outfit === 'lanna') {
      const blouse = new THREE.Mesh(new THREE.CylinderGeometry(0.188, 0.18, 0.48, 14), creamMat);
      const sash = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.52, 0.37), primaryMat);
      sash.rotation.z = 0.35;
      sash.position.set(-0.03, 0.02, 0);
      const silverBelt = new THREE.Mesh(new THREE.CylinderGeometry(0.195, 0.195, 0.06, 14), silverMat);
      silverBelt.position.y = -0.22;
      torsoGroup.add(blouse, sash, silverBelt);
    } else if (profile.outfit === 'student') {
      const whiteShirt = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.18, 0.48, 12), creamMat);
      const tieBow = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.055, 0.04),
        new THREE.MeshStandardMaterial({ color: accentHex, roughness: 0.55 })
      );
      tieBow.position.set(0, 0.18, 0.185);
      const tieTail = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.14, 0.025),
        new THREE.MeshStandardMaterial({ color: accentHex, roughness: 0.55 })
      );
      tieTail.position.set(0, 0.10, 0.19);
      const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.045, 12), new THREE.MeshStandardMaterial({ color: 0x111827 }));
      belt.position.y = -0.22;
      torsoGroup.add(whiteShirt, tieBow, tieTail, belt);
    } else if (profile.outfit === 'likay') {
      const tunic = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.185, 0.50, 14), primaryMat);
      const jeweledCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.195, 0.23, 0.11, 14), goldMat);
      jeweledCollar.position.y = 0.20;
      const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.20, 0.06, 14), goldMat);
      belt.position.y = -0.21;
      [-1, 1].forEach(side => {
        const ep = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.045, 0.14), goldMat);
        ep.rotation.z = -side * 0.25;
        ep.position.set(side * 0.22, 0.23, 0);
        torsoGroup.add(ep);
      });
      torsoGroup.add(tunic, jeweledCollar, belt);
    } else if (profile.outfit === 'rajpatan' || profile.outfit === 'vip_gold') {
      const jacket = new THREE.Mesh(
        new THREE.CylinderGeometry(0.205, 0.19, 0.50, 14),
        profile.outfit === 'vip_gold' ? primaryMat : creamMat
      );
      const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.105, 0.08, 12), profile.outfit === 'vip_gold' ? goldMat : creamMat);
      collar.position.y = 0.27;
      torsoGroup.add(jacket, collar);

      for (let i = 0; i < 5; i++) {
        const btn = new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 6), goldMat);
        btn.position.set(0, 0.18 - i * 0.085, 0.198);
        torsoGroup.add(btn);
      }
      const sash = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.52, 0.39), primaryMat);
      sash.rotation.z = -0.35;
      sash.position.set(0.03, 0.01, 0);
      const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.202, 0.202, 0.055, 14), goldMat);
      belt.position.y = -0.21;
      torsoGroup.add(sash, belt);

      if (profile.outfit === 'vip_gold') {
        [-1, 1].forEach(side => {
          const ep = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.045, 0.14), goldMat);
          ep.rotation.z = -side * 0.22;
          ep.position.set(side * 0.22, 0.23, 0);
          torsoGroup.add(ep);
        });
      }
    } else if (profile.outfit === 'chef') {
      const shirt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.195, 0.188, 0.48, 12),
        new THREE.MeshStandardMaterial({ color: accentHex, roughness: 0.72 })
      );
      const apron = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.56, 0.06),
        new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.65 })
      );
      apron.position.set(0, -0.05, 0.17);
      const badge = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.07, 0.02), goldMat);
      badge.position.set(0, 0.08, 0.205);
      const scarf = new THREE.Mesh(
        new THREE.TorusGeometry(0.10, 0.028, 8, 16),
        new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.6 })
      );
      scarf.rotation.x = Math.PI / 2;
      scarf.position.y = 0.23;
      torsoGroup.add(shirt, apron, badge, scarf);
    } else {
      const tee = new THREE.Mesh(
        new THREE.CylinderGeometry(0.195, 0.185, 0.48, 12),
        new THREE.MeshStandardMaterial({ color: accentHex, roughness: 0.76 })
      );
      const printPatch = new THREE.Mesh(
        new THREE.PlaneGeometry(0.16, 0.14),
        new THREE.MeshBasicMaterial({ color: 0xfef3c7 })
      );
      printPatch.position.set(0, 0.06, 0.192);
      const strap = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.52, 0.39),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 })
      );
      strap.rotation.z = 0.42;
      torsoGroup.add(tee, printPatch, strap);
    }
    bodyPivot.add(torsoGroup);

    // Arms (Pivots at y = 1.35)
    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(-0.24, 1.35, 0);
    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(0.24, 1.35, 0);

    function buildArm(pivot, sleeveType) {
      if (sleeveType === 'bare') {
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.054, 0.044, 0.44, 9), skinMat);
        arm.position.y = -0.22;
        const bangle = new THREE.Mesh(new THREE.TorusGeometry(0.048, 0.011, 6, 12), goldMat);
        bangle.rotation.x = Math.PI / 2;
        bangle.position.y = -0.37;
        pivot.add(arm, bangle);
      } else {
        const longS = (sleeveType === 'long');
        const upperMat = (profile.outfit === 'rajpatan' || profile.outfit === 'lanna' || profile.outfit === 'student')
          ? creamMat
          : (profile.outfit === 'vip_gold' || profile.outfit === 'likay'
            ? primaryMat
            : new THREE.MeshStandardMaterial({ color: accentHex, roughness: 0.72 }));
        const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.054, longS ? 0.34 : 0.19, 9), upperMat);
        sleeve.position.y = longS ? -0.17 : -0.10;
        const fore = new THREE.Mesh(
          new THREE.CylinderGeometry(0.048, 0.042, longS ? 0.14 : 0.28, 9),
          skinMat
        );
        fore.position.y = longS ? -0.38 : -0.31;
        pivot.add(sleeve, fore);
      }
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), skinMat);
      hand.position.y = -0.45;
      pivot.add(hand);
    }
    const sleeveMode = profile.outfit === 'sabai'
      ? 'bare'
      : ((profile.outfit === 'rajpatan' || profile.outfit === 'vip_gold' || profile.outfit === 'lanna' || profile.outfit === 'likay') ? 'long' : 'short');
    buildArm(leftArmPivot, sleeveMode);
    buildArm(rightArmPivot, sleeveMode);

    let propMesh = null;
    if (profile.prop && profile.prop !== 'none') {
      propMesh = buildHandheldProp(profile.prop);
      propMesh.position.set(0, -0.45, 0.02);
      leftArmPivot.add(propMesh);
    }
    bodyPivot.add(leftArmPivot, rightArmPivot);

    // Wings / Back Accessories mounted on bodyPivot
    const backBuilt = buildBackItem(profile.back, primaryMat, goldMat);
    bodyPivot.add(backBuilt.group);

    // Head, Hair, Glasses/Mask & Hat (y = 1.56)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.56, 0);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.10, 10), skinMat);
    neck.position.y = -0.14;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.165, 14, 12), skinMat);
    head.scale.set(0.96, 1.04, 0.95);
    headGroup.add(neck, head);

    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x161210 });
    const shineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    [-0.058, 0.058].forEach(ex => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.021, 8, 8), eyeMat);
      eye.position.set(ex, 0.015, 0.145);
      const shine = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 6), shineMat);
      shine.position.set(ex + 0.006, 0.024, 0.162);
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.012, 0.012), hairMat);
      brow.position.set(ex, 0.056, 0.148);
      headGroup.add(eye, shine, brow);
    });
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 6), skinMat);
    nose.position.set(0, -0.015, 0.162);
    const smile = new THREE.Mesh(
      new THREE.TorusGeometry(0.032, 0.009, 6, 10, Math.PI),
      new THREE.MeshBasicMaterial({ color: 0xb9534c })
    );
    smile.rotation.z = Math.PI;
    smile.position.set(0, -0.05, 0.146);
    headGroup.add(nose, smile);

    // Hairstyles (7 options)
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.172, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.56), hairMat);
    cap.rotation.x = -0.15;
    cap.position.y = 0.015;
    headGroup.add(cap);

    if (profile.hair === 'short') {
      const backFade = new THREE.Mesh(new THREE.CylinderGeometry(0.166, 0.148, 0.14, 12, 1, false, Math.PI * 0.45, Math.PI * 1.1), hairMat);
      backFade.position.set(0, -0.02, -0.01);
      const quiff = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.055, 0.12), hairMat);
      quiff.position.set(0, 0.135, 0.085);
      quiff.rotation.x = -0.25;
      headGroup.add(backFade, quiff);
    } else if (profile.hair === 'bun') {
      const bun = new THREE.Mesh(new THREE.SphereGeometry(0.088, 10, 10), hairMat);
      bun.position.set(0, 0.15, -0.135);
      const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.24, 6), goldMat);
      pin.rotation.z = 1.2;
      pin.position.set(0, 0.15, -0.135);
      const orchidPin = new THREE.Mesh(new THREE.SphereGeometry(0.03, 7, 7), new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.5 }));
      orchidPin.position.set(0.085, 0.18, -0.11);
      headGroup.add(bun, pin, orchidPin);
    } else if (profile.hair === 'long') {
      const curtain = new THREE.Mesh(new THREE.CylinderGeometry(0.172, 0.20, 0.36, 12, 1, false, Math.PI * 0.4, Math.PI * 1.2), hairMat);
      curtain.position.set(0, -0.14, -0.02);
      const sideL = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.036, 0.30, 8), hairMat);
      sideL.position.set(-0.145, -0.10, 0.04);
      const sideR = sideL.clone();
      sideR.position.x = 0.145;
      headGroup.add(curtain, sideL, sideR);
    } else if (profile.hair === 'bob') {
      const bangs = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.065, 0.09), hairMat);
      bangs.position.set(0, 0.095, 0.12);
      const bobCurved = new THREE.Mesh(new THREE.CylinderGeometry(0.175, 0.185, 0.24, 12, 1, false, Math.PI * 0.35, Math.PI * 1.3), hairMat);
      bobCurved.position.set(0, -0.07, -0.01);
      headGroup.add(bangs, bobCurved);
    } else if (profile.hair === 'ponytail') {
      const tie = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.012, 6, 10), goldMat);
      tie.rotation.x = Math.PI / 2.2;
      tie.position.set(0, 0.09, -0.16);
      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.28, 9), hairMat);
      tail.rotation.x = -2.45;
      tail.position.set(0, -0.02, -0.23);
      headGroup.add(tie, tail);
    } else if (profile.hair === 'twintails') {
      const bangs = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.055, 0.08), hairMat);
      bangs.position.set(0, 0.098, 0.122);
      headGroup.add(bangs);
      [-1, 1].forEach(side => {
        const tie = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.01, 6, 10), new THREE.MeshStandardMaterial({ color: 0xf472b6 }));
        tie.position.set(side * 0.17, 0.08, -0.02);
        tie.rotation.y = Math.PI / 2;
        const tail = new THREE.Mesh(new THREE.ConeGeometry(0.058, 0.30, 8), hairMat);
        tail.position.set(side * 0.21, -0.08, -0.03);
        tail.rotation.z = side * 0.26;
        tail.rotation.x = Math.PI;
        headGroup.add(tie, tail);
      });
    } else if (profile.hair === 'wolfcut') {
      const topSpike = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.075, 0.15), hairMat);
      topSpike.position.set(0, 0.13, 0.06);
      topSpike.rotation.x = -0.22;
      const mullet = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.20, 0.26, 12, 1, false, Math.PI * 0.45, Math.PI * 1.1), hairMat);
      mullet.position.set(0, -0.12, -0.03);
      headGroup.add(topSpike, mullet);
    }

    // Glasses / Mask
    headGroup.add(buildGlasses(profile.glasses, goldMat));

    // Hat (auto-render Chada if outfit is vip_gold & hat is none)
    const effectiveHat = (profile.outfit === 'vip_gold' && (!profile.hat || profile.hat === 'none')) ? 'chada' : profile.hat;
    headGroup.add(buildHat(effectiveHat, goldMat, accentHex));

    bodyPivot.add(headGroup);

    // Aura / Floating Companions
    const auraBuilt = buildAuraItem(profile.aura);
    root.add(auraBuilt.group);

    const carryAnchor = new THREE.Group();
    carryAnchor.position.set(0, 1.04, 0.42);
    bodyPivot.add(carryAnchor);

    root.userData = {
      profile,
      bodyPivot,
      carryAnchor,
      headGroup,
      torsoGroup,
      hipGroup,
      leftArmPivot,
      rightArmPivot,
      leftLegPivot,
      rightLegPivot,
      propMesh,
      shadowDisc,
      wingL: backBuilt.wingL,
      wingR: backBuilt.wingR,
      cape: backBuilt.cape,
      auraOrbit: auraBuilt.orbitGroup,
      auraFloat: auraBuilt.floatGroup,
      lotusRing: auraBuilt.lotusRing,
      walkPhase: 0,
      curEmote: '',
      emoteTimer: 0
    };
    return root;
  };

  TOTO.animateAvatar = function (avatar, dt, elapsed, isMoving, activeEmote) {
    if (!avatar || !avatar.userData) return;
    const u = avatar.userData;
    const lerpAmt = Math.min(1, dt * 13);

    let targetBodyY = Math.sin(elapsed * 2.2) * 0.012;
    let targetBodyRx = 0;
    let targetBodyRz = 0;
    let targetHeadRx = 0;
    let targetHeadRz = 0;
    let targetLArmRx = 0;
    let targetLArmRz = 0.08;
    let targetRArmRx = 0;
    let targetRArmRz = -0.08;
    let targetLLegRx = 0;
    let targetRLegRx = 0;

    if (activeEmote === 'wai') {
      targetBodyRx = 0.10;
      targetHeadRx = 0.26;
      targetLArmRx = -1.15;
      targetLArmRz = -0.46;
      targetRArmRx = -1.15;
      targetRArmRz = 0.46;
    } else if (activeEmote === 'wave') {
      targetBodyY += Math.abs(Math.sin(elapsed * 7.5)) * 0.035;
      targetHeadRz = 0.08;
      targetRArmRx = -2.42;
      targetRArmRz = -0.35 + Math.sin(elapsed * 11.5) * 0.38;
      if (isMoving) {
        u.walkPhase += dt * 8.6;
        const s = Math.sin(u.walkPhase);
        targetLLegRx = s * 0.56;
        targetRLegRx = -s * 0.56;
        targetLArmRx = -s * 0.42;
      }
    } else if (activeEmote === 'ramwong') {
      // Graceful Thai Ramwong dance sway
      const beat = elapsed * 4.4;
      const sway = Math.sin(beat);
      targetBodyY = Math.abs(Math.sin(beat)) * 0.055;
      targetBodyRz = sway * 0.065;
      targetHeadRz = -sway * 0.12;
      targetLArmRx = -1.15 + sway * 0.55;
      targetLArmRz = 0.55 + sway * 0.28;
      targetRArmRx = -1.15 - sway * 0.55;
      targetRArmRz = -0.55 + sway * 0.28;
      targetLLegRx = sway * 0.24;
      targetRLegRx = -sway * 0.24;
    } else if (activeEmote === 'jump') {
      // Cheerful festive jumps with arms raised!
      const hop = Math.abs(Math.sin(elapsed * 6.8));
      targetBodyY = hop * 0.38;
      targetHeadRx = -0.10;
      targetLArmRx = -2.45;
      targetLArmRz = 0.45 + Math.sin(elapsed * 12) * 0.2;
      targetRArmRx = -2.45;
      targetRArmRz = -0.45 - Math.sin(elapsed * 12) * 0.2;
      targetLLegRx = -hop * 0.32;
      targetRLegRx = -hop * 0.32;
    } else if (isMoving) {
      u.walkPhase += dt * 8.8;
      const s = Math.sin(u.walkPhase);
      targetBodyY = Math.abs(Math.sin(u.walkPhase)) * 0.048;
      targetLLegRx = s * 0.58;
      targetRLegRx = -s * 0.58;
      targetRArmRx = s * 0.46;
      targetLArmRx = (u.profile.prop && u.profile.prop !== 'none') ? (-0.38 + -s * 0.12) : (-s * 0.46);
    } else {
      if (u.profile.prop && u.profile.prop !== 'none') {
        targetLArmRx = -0.42 + Math.sin(elapsed * 1.8) * 0.04;
      }
    }

    u.bodyPivot.position.y += (targetBodyY - u.bodyPivot.position.y) * lerpAmt;
    u.bodyPivot.rotation.x += (targetBodyRx - u.bodyPivot.rotation.x) * lerpAmt;
    u.bodyPivot.rotation.z += (targetBodyRz - u.bodyPivot.rotation.z) * lerpAmt;
    u.headGroup.rotation.x += (targetHeadRx - u.headGroup.rotation.x) * lerpAmt;
    u.headGroup.rotation.z += (targetHeadRz - u.headGroup.rotation.z) * lerpAmt;
    u.leftArmPivot.rotation.x += (targetLArmRx - u.leftArmPivot.rotation.x) * lerpAmt;
    u.leftArmPivot.rotation.z += (targetLArmRz - u.leftArmPivot.rotation.z) * lerpAmt;
    u.rightArmPivot.rotation.x += (targetRArmRx - u.rightArmPivot.rotation.x) * lerpAmt;
    u.rightArmPivot.rotation.z += (targetRArmRz - u.rightArmPivot.rotation.z) * lerpAmt;
    u.leftLegPivot.rotation.x += (targetLLegRx - u.leftLegPivot.rotation.x) * lerpAmt;
    u.rightLegPivot.rotation.x += (targetRLegRx - u.rightLegPivot.rotation.x) * lerpAmt;

    // Animated Wings, Cape, Sparkler & Auras
    if (u.wingL && u.wingR) {
      const flap = Math.sin(elapsed * (isMoving ? 8.5 : 3.2)) * 0.24;
      u.wingL.rotation.y = 0.22 + flap;
      u.wingR.rotation.y = -0.22 - flap;
    }
    if (u.cape) {
      const billow = isMoving ? 0.36 + Math.sin(elapsed * 10) * 0.09 : 0.08 + Math.sin(elapsed * 2.2) * 0.03;
      u.cape.rotation.x += (billow - u.cape.rotation.x) * lerpAmt;
    }
    if (u.auraOrbit) {
      u.auraOrbit.rotation.y = elapsed * 1.35;
      u.auraOrbit.position.y = 1.05 + Math.sin(elapsed * 2.4) * 0.08;
    }
    if (u.auraFloat) {
      u.auraFloat.position.y = 1.62 + Math.sin(elapsed * 2.8) * 0.11;
      u.auraFloat.rotation.y = Math.sin(elapsed * 1.5) * 0.35;
    }
    if (u.lotusRing) {
      u.lotusRing.rotation.y = elapsed * 0.9;
    }
    if (u.propMesh && u.propMesh.userData && u.propMesh.userData.sparkStar) {
      const s = 0.8 + Math.sin(elapsed * 24) * 0.35;
      u.propMesh.userData.sparkStar.scale.set(s, s, s);
      u.propMesh.userData.sparkStar.rotation.z = elapsed * 7;
    }
  };
})();

(function () {
  'use strict';

  const TOTO = (window.TOTO = window.TOTO || {});

  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }

  // Smooth gradient dome texture for Moonlit Night & Tropical Day Skies
  function createSkyGradientTexture(isNight) {
    const c = makeCanvas(64, 512);
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, 512);
    if (isNight) {
      g.addColorStop(0.0, '#040814');
      g.addColorStop(0.35, '#0a1428');
      g.addColorStop(0.68, '#13213e');
      g.addColorStop(0.88, '#1f2b48');
      g.addColorStop(1.0, '#2a2c3d');
    } else {
      g.addColorStop(0.0, '#3b7dd8');
      g.addColorStop(0.42, '#78b6eb');
      g.addColorStop(0.78, '#c5e2f6');
      g.addColorStop(1.0, '#e6efe9');
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 512);
    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  // Herringbone / brick-paved lakeside promenade texture matching South bank Street View
  function createBrickPromenadeTexture() {
    const c = makeCanvas(512, 512);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#8b6f5c';
    ctx.fillRect(0, 0, 512, 512);

    const bw = 64, bh = 32;
    for (let row = 0; row < 512 / bh; row++) {
      const offset = (row % 2) * (bw / 2);
      for (let col = -1; col < 512 / bw + 1; col++) {
        const x = col * bw + offset;
        const y = row * bh;
        const tone = ((row * 7 + col * 13) % 5);
        const palette = ['#9b7561', '#8d6a58', '#a58069', '#816252', '#95705c'];
        ctx.fillStyle = palette[Math.abs(tone)];
        ctx.fillRect(x + 2, y + 2, bw - 4, bh - 4);
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(22, 1.5);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  // Iconic Terracotta Arched Gateway Banner: "เทศบาลตำบลหนองไผ่"
  function createMunicipalGatewayTexture() {
    const c = makeCanvas(1024, 192);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#8e4532';
    ctx.fillRect(0, 0, 1024, 192);
    ctx.strokeStyle = '#d6b26e';
    ctx.lineWidth = 10;
    ctx.strokeRect(8, 8, 1008, 176);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f8e6b8';
    ctx.font = '800 72px Prompt, Kanit, Tahoma, sans-serif';
    ctx.fillText('เทศบาลตำบลหนองไผ่', 512, 98);

    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  // Sculpted Green Topiary Bush Letters: "เทศบาลตำบลหนองไผ่"
  function createTopiaryBannerTexture() {
    const c = makeCanvas(1024, 192);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#1f4224';
    ctx.fillRect(0, 0, 1024, 192);

    for (let i = 0; i < 1400; i++) {
      ctx.fillStyle = i % 3 === 0 ? 'rgba(62, 125, 58, 0.35)' : 'rgba(18, 42, 22, 0.4)';
      ctx.fillRect(Math.random() * 1024, Math.random() * 192, 6, 6);
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#0f2312';
    ctx.font = '900 74px Prompt, Kanit, Tahoma, sans-serif';
    ctx.strokeText('เทศบาลตำบลหนองไผ่', 512, 98);
    ctx.fillStyle = '#84cc16';
    ctx.fillText('เทศบาลตำบลหนองไผ่', 512, 98);

    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  // Royal-Blue Municipal Lakeside Sign along South Promenade
  function createMunicipalSignTexture() {
    const c = makeCanvas(384, 256);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(0, 0, 384, 256);
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 8;
    ctx.strokeRect(8, 8, 368, 240);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#fde047';
    ctx.font = '800 32px Prompt, Kanit, Tahoma, sans-serif';
    ctx.fillText('ประกาศเทศบาลตำบลหนองไผ่', 192, 72);
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 26px Prompt, Kanit, Tahoma, sans-serif';
    ctx.fillText('บริเวณสวนสาธารณะสระหลวง', 192, 132);
    ctx.fillText('โปรดช่วยกันรักษาความสะอาด', 192, 184);

    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  // Top Menu Banner matching Toto's actual cart
  function createMenuBannerTexture() {
    const c = makeCanvas(1024, 256);
    const ctx = c.getContext('2d');

    const bg = ctx.createLinearGradient(0, 0, 0, 256);
    bg.addColorStop(0, '#f5efe6');
    bg.addColorStop(0.55, '#e8dfd1');
    bg.addColorStop(1, '#d6c7b4');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1024, 256);

    ctx.strokeStyle = 'rgba(130, 95, 65, 0.08)';
    for (let i = 0; i < 36; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * 7);
      ctx.lineTo(1024, i * 7);
      ctx.stroke();
    }

    ctx.fillStyle = '#fff9f0';
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 4;
    ctx.fillRect(16, 22, 134, 212);
    ctx.strokeRect(16, 22, 134, 212);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#b91c1c';
    ctx.font = '800 28px Kanit, Tahoma, sans-serif';
    ctx.fillText('ร้าน', 83, 86);
    ctx.font = '900 40px Kanit, Tahoma, sans-serif';
    ctx.fillText('โตโต้', 83, 138);
    ctx.fillStyle = '#15803d';
    ctx.font = '700 20px Kanit, Tahoma, sans-serif';
    ctx.fillText('หอยทอด', 83, 178);
    ctx.fillText('ผัดไทย', 83, 206);

    const items = [
      { name: 'หอยทอด', x: 222, plateCol: '#e08b2b', accent: '#3d2b1f', topText: false },
      { name: 'ออส่วน', x: 368, plateCol: '#f2d06b', accent: '#68a347', topText: true },
      { name: 'ผัดไทยกุ้งสด', x: 514, plateCol: '#ec6b2d', accent: '#ff9671', topText: false },
      { name: 'ผัดไทยวุ้นเส้น', x: 660, plateCol: '#c96f28', accent: '#ffd166', topText: true },
      { name: 'ผัดไทยห่อไข่', x: 806, plateCol: '#facc15', accent: '#ef4444', topText: false },
      { name: 'หอยทอดทะเล', x: 950, plateCol: '#d97706', accent: '#f97316', topText: true }
    ];

    items.forEach((it, idx) => {
      const cy = it.topText ? 148 : 108;
      const r = 56;
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.35)';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(it.x, cy, r + 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = it.plateCol;
      ctx.beginPath();
      ctx.arc(it.x, cy, r - 2, 0, Math.PI * 2);
      ctx.fill();

      for (let k = 0; k < 22; k++) {
        const ang = Math.random() * Math.PI * 2;
        const dist = Math.random() * (r - 12);
        const fx = it.x + Math.cos(ang) * dist;
        const fy = cy + Math.sin(ang) * dist;
        ctx.fillStyle = k % 3 === 0 ? it.accent : (k % 3 === 1 ? '#ffe4a0' : '#65a30d');
        ctx.beginPath();
        ctx.ellipse(fx, fy, 4 + Math.random() * 6, 3 + Math.random() * 4, Math.random() * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      if (idx === 4) {
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(it.x, cy, r - 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.moveTo(it.x - 14, cy - 14);
        ctx.lineTo(it.x + 18, cy - 5);
        ctx.lineTo(it.x + 4, cy + 16);
        ctx.closePath();
        ctx.fill();
      }

      ctx.fillStyle = '#7c2d12';
      ctx.font = '800 22px Kanit, Tahoma, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(it.name, it.x, it.topText ? 54 : 212);
    });

    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  function createCartSkirtTexture() {
    const c = makeCanvas(768, 256);
    const ctx = c.getContext('2d');

    ctx.fillStyle = '#facc15';
    ctx.fillRect(0, 0, 768, 256);

    ctx.save();
    ctx.translate(384, 140);
    for (let i = 0; i < 24; i++) {
      ctx.rotate((Math.PI * 2) / 24);
      ctx.fillStyle = i % 2 === 0 ? 'rgba(254, 240, 138, 0.7)' : 'rgba(234, 179, 8, 0.65)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-40, -450);
      ctx.lineTo(40, -450);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    ctx.fillStyle = '#65a30d';
    ctx.beginPath();
    ctx.arc(88, 64, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#bef264';
    ctx.beginPath();
    ctx.arc(84, 62, 26, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.ellipse(670, 78, 38, 18, -0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.font = '900 86px Kanit, Tahoma, sans-serif';
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#ffffff';
    ctx.strokeText('โตโต้', 384, 108);
    ctx.fillStyle = '#dc2626';
    ctx.fillText('โตโต้', 384, 108);

    ctx.font = '800 46px Kanit, Tahoma, sans-serif';
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#ffffff';
    ctx.strokeText('หอยทอด  ผัดไทย', 384, 174);
    ctx.fillStyle = '#b91c1c';
    ctx.fillText('หอยทอด  ผัดไทย', 384, 174);

    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  function createLaundrySignTexture() {
    const c = makeCanvas(256, 384);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fdf2f8';
    ctx.fillRect(0, 0, 256, 384);

    ctx.fillStyle = '#ec4899';
    ctx.fillRect(0, 0, 256, 48);
    ctx.fillRect(0, 330, 256, 54);

    ctx.strokeStyle = '#db2777';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, 248, 376);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#15803d';
    ctx.font = '900 42px Kanit, Tahoma, sans-serif';
    ctx.fillText('โตโต้', 128, 38);

    ctx.fillStyle = '#ea580c';
    ctx.font = '900 68px Kanit, Tahoma, sans-serif';
    ctx.fillText('ซัก', 128, 128);
    ctx.fillStyle = '#16a34a';
    ctx.fillText('อบ', 128, 210);
    ctx.fillStyle = '#0284c7';
    ctx.fillText('รีด', 128, 294);

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 22px Kanit, Tahoma, sans-serif';
    ctx.fillText('ซอยสระหลวงใต้', 128, 365);

    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  function createZincTextures() {
    const c = makeCanvas(512, 512);
    const ctx = c.getContext('2d');
    const b = makeCanvas(512, 512);
    const bctx = b.getContext('2d');

    const ribs = 28;
    const ribW = 512 / ribs;
    for (let x = 0; x < 512; x++) {
      const wave = Math.sin((x / ribW) * Math.PI * 2) * 0.5 + 0.5;
      const base = Math.floor(158 + wave * 68);
      ctx.fillStyle = `rgb(${base - 4}, ${base}, ${base + 8})`;
      ctx.fillRect(x, 0, 1, 512);
      const bv = Math.floor(wave * 255);
      bctx.fillStyle = `rgb(${bv},${bv},${bv})`;
      bctx.fillRect(x, 0, 1, 512);
    }

    for (let i = 0; i < 600; i++) {
      const rx = Math.random() * 512;
      const ry = Math.random() * 512;
      ctx.fillStyle = Math.random() > 0.86 ? 'rgba(130, 88, 52, 0.18)' : 'rgba(255,255,255,0.08)';
      ctx.fillRect(rx, ry, 4 + Math.random() * 10, 6 + Math.random() * 22);
    }
    ctx.fillStyle = 'rgba(110, 74, 48, 0.35)';
    ctx.fillRect(0, 240, 512, 10);
    ctx.fillRect(0, 480, 512, 8);

    const map = new THREE.CanvasTexture(c);
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(4, 1);
    map.encoding = THREE.sRGBEncoding;

    const bump = new THREE.CanvasTexture(b);
    bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
    bump.repeat.set(4, 1);

    return { map, bump };
  }

  function createRedRoofTextures() {
    const c = makeCanvas(256, 256);
    const ctx = c.getContext('2d');
    const ribs = 16;
    const ribW = 256 / ribs;
    for (let x = 0; x < 256; x++) {
      const wave = Math.sin((x / ribW) * Math.PI * 2) * 0.5 + 0.5;
      const r = Math.floor(178 + wave * 56);
      const g = Math.floor(72 + wave * 36);
      const bl = Math.floor(62 + wave * 30);
      ctx.fillStyle = `rgb(${r},${g},${bl})`;
      ctx.fillRect(x, 0, 1, 256);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 1);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  function createAsphaltTexture() {
    const c = makeCanvas(512, 512);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#3c4048';
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 10000; i++) {
      const v = 46 + Math.floor(Math.random() * 34);
      ctx.fillStyle = `rgb(${v},${v},${v + 3})`;
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
    }
    ctx.fillStyle = 'rgba(242,242,235,0.68)';
    ctx.fillRect(0, 22, 512, 10);
    ctx.fillRect(0, 480, 512, 10);

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(22, 1);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  function createIntersectionBoxTexture() {
    const c = makeCanvas(256, 256);
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, 256, 256);
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.72)';
    ctx.lineWidth = 8;
    ctx.strokeRect(8, 8, 240, 240);
    for (let i = -256; i < 512; i += 44) {
      ctx.beginPath();
      ctx.moveTo(i, 8);
      ctx.lineTo(i + 240, 248);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(i + 240, 8);
      ctx.lineTo(i, 248);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  function createAccordionDoorTexture() {
    const c = makeCanvas(256, 512);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#1d4f82';
    ctx.fillRect(0, 0, 256, 512);
    for (let x = 0; x < 256; x += 22) {
      ctx.fillStyle = '#2b6cb0';
      ctx.fillRect(x, 0, 12, 512);
      ctx.fillStyle = '#133457';
      ctx.fillRect(x + 12, 0, 10, 512);
    }
    ctx.strokeStyle = '#63a4e8';
    ctx.lineWidth = 2;
    for (let y = 0; y < 512; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y + 40);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(256, y);
      ctx.lineTo(0, y + 40);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  // Real 18-unit three-story shophouse row along Soi Thetsaban 32 (North bank of Sa Luang)
  // Note: West 8 units (+X side) have warm brown/red gables; East 10 units (-X side) have crisp white gables & blue Advice IT sign at NE!
  function createAdviceShophouseTexture() {
    const c = makeCanvas(2048, 512);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#e7e4dc';
    ctx.fillRect(0, 0, 2048, 512);

    const units = 18;
    const uw = 2048 / units;
    for (let col = 0; col < units; col++) {
      const x = col * uw;
      // col 0..2 are East/Advice side when mapped onto Front (-Z looking) face of farShophouses!
      // Remember: BoxGeometry +Z/+Z mirror: when camera at (8, 0, 6) looks +Z toward farShophouses at z=75.5,
      // Box's (-Z) face renders u=0 on East (-X right? Wait: let's map u=0 on +X West (left on screen) and u=1 on -X East (right on screen)).
      // On a BoxGeometry's front (-Z) face, left-to-right on screen corresponds to u = 0 to u = 1!
      // In real Street View (step_59_shot_1): Screen LEFT (West) has dark brown gables (cols 0..7),
      // Screen RIGHT (East) has crisp white gables (cols 8..17), and BLUE ADVICE SIGN on the far right (cols 15..16)!
      const isBrownSection = col < 8;
      ctx.fillStyle = isBrownSection ? '#7c3f32' : '#4a5568';
      ctx.beginPath();
      ctx.moveTo(x, 68);
      ctx.lineTo(x + uw / 2, 10);
      ctx.lineTo(x + uw, 68);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = isBrownSection ? '#e7d8ce' : '#f8fafc';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Vertical party pillar
      ctx.fillStyle = '#cac4b8';
      ctx.fillRect(x, 68, 5, 444);

      // 3rd floor arched window/balcony + 2nd floor window
      [104, 224].forEach((wy, fl) => {
        const lit = (col + fl) % 3 !== 0;
        ctx.fillStyle = lit ? '#fde68a' : '#263347';
        ctx.fillRect(x + 15, wy, uw - 30, 74);
        if (fl === 0) {
          // Arched trim on 3rd floor
          ctx.beginPath();
          ctx.arc(x + uw / 2, wy + 18, (uw - 30) / 2, Math.PI, 0);
          ctx.fillStyle = lit ? '#fef08a' : '#1e293b';
          ctx.fill();
        }
        ctx.strokeStyle = '#685544';
        ctx.lineWidth = 3;
        ctx.strokeRect(x + 15, wy, uw - 30, 74);
        ctx.fillStyle = '#f3f1eb';
        ctx.fillRect(x + 8, wy + 72, uw - 16, 22);
      });

      // Ground floor roll-up shutters & Advice IT sign at NE end (col 15..16)
      if (col === 15 || col === 16) {
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(x + 3, 344, uw - 6, 48);
        ctx.fillStyle = '#ffffff';
        ctx.font = '800 22px Prompt, Kanit, Tahoma, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(col === 15 ? 'แอดไวซ์' : 'Advice', x + uw / 2, 376);
      } else {
        ctx.fillStyle = col % 4 === 0 ? '#b45309' : '#64748b';
        ctx.fillRect(x + 8, 350, uw - 16, 24);
      }
      ctx.fillStyle = col % 2 === 0 ? '#cbd5e1' : '#334155';
      ctx.fillRect(x + 10, 392, uw - 20, 114);
    }

    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  function createApronTexture() {
    const c = makeCanvas(256, 256);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#1b202b';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    for (let i = 0; i < 256; i += 6) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(256, i);
      ctx.stroke();
    }
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 4;
    ctx.strokeRect(56, 138, 144, 74);

    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(68, 52, 120, 44);
    ctx.fillStyle = '#111827';
    ctx.font = '800 30px Kanit, Tahoma, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('โตโต้', 128, 84);

    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  function createRoadSignTexture() {
    const c = makeCanvas(256, 96);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#1e40af';
    ctx.fillRect(0, 0, 256, 96);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.strokeRect(5, 5, 246, 86);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px Prompt, Kanit, Tahoma, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ซอยสระหลวงใต้', 128, 60);
    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  function createBuntingTexture() {
    const c = makeCanvas(512, 64);
    const ctx = c.getContext('2d');
    const cols = ['#d4af6a', '#f6f0e4', '#e09f3e', '#d97706', '#f6f0e4', '#d4af6a'];
    const seg = 512 / 12;
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = cols[i % cols.length];
      ctx.beginPath();
      ctx.moveTo(i * seg, 0);
      ctx.lineTo((i + 1) * seg, 0);
      ctx.lineTo(i * seg + seg / 2, 56);
      ctx.closePath();
      ctx.fill();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.repeat.set(5, 1);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  function createGlowTexture(colorHex) {
    const c = makeCanvas(128, 128);
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(64, 64, 2, 64, 64, 62);
    g.addColorStop(0, 'rgba(255,255,245,1)');
    g.addColorStop(0.28, colorHex);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  function createContactShadowTexture() {
    const c = makeCanvas(128, 128);
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(64, 64, 6, 64, 64, 60);
    g.addColorStop(0, 'rgba(5, 9, 16, 0.56)');
    g.addColorStop(0.48, 'rgba(5, 9, 16, 0.25)');
    g.addColorStop(1, 'rgba(5, 9, 16, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }

  // Real-feel pastel-pink stucco wall for Toto's townhouse (no wash-out under warm lamp!)
  function createPinkHouseWallTexture() {
    const c = makeCanvas(512, 512);
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, '#eca7bf');
    g.addColorStop(0.78, '#e39cb4');
    g.addColorStop(0.84, '#d9d0cb');
    g.addColorStop(1, '#9f9694');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 512);

    // Subtle plaster texture stipple
    for (let i = 0; i < 2600; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(90,45,65,0.05)';
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 3, 3);
    }
    // Horizontal concrete beam line + base plinth border
    ctx.fillStyle = '#f3e9e4';
    ctx.fillRect(0, 198, 512, 16);
    ctx.fillRect(0, 412, 512, 12);

    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  // Glazed Thai stoneware porcelain pot texture
  function createPorcelainPotTexture() {
    const c = makeCanvas(256, 128);
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, '#5a3a26');
    g.addColorStop(0.5, '#462c1c');
    g.addColorStop(1, '#2b1a10');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 128);

    ctx.strokeStyle = '#d6ad60';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 26);
    ctx.lineTo(256, 26);
    ctx.stroke();

    ctx.fillStyle = 'rgba(232, 198, 120, 0.55)';
    for (let x = 24; x < 256; x += 48) {
      ctx.beginPath();
      ctx.ellipse(x, 66, 14, 20, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  // Terracotta sandstone block texture for West Municipal Gateway pillars
  function createStonePillarTexture() {
    const c = makeCanvas(256, 512);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#8b4735';
    ctx.fillRect(0, 0, 256, 512);

    for (let y = 0; y < 512; y += 32) {
      ctx.fillStyle = 'rgba(55, 22, 15, 0.35)';
      ctx.fillRect(0, y, 256, 3);
      const offset = (y / 32) % 2 === 0 ? 0 : 64;
      for (let x = offset; x < 256; x += 128) {
        ctx.fillRect(x, y, 3, 32);
      }
    }
    ctx.fillStyle = '#e7cf96';
    ctx.fillRect(0, 24, 256, 14);
    ctx.fillRect(0, 448, 256, 22);

    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  function createSponsorBillboardTexture(slot) {
    const s = slot || {};
    const c = makeCanvas(512, 256);
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 512, 256);
    g.addColorStop(0, '#0a1428');
    g.addColorStop(1, '#17284a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 256);

    ctx.strokeStyle = '#d4af6a';
    ctx.lineWidth = 8;
    ctx.strokeRect(8, 8, 496, 240);
    ctx.strokeStyle = 'rgba(212, 175, 106, 0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(18, 18, 476, 220);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f5d896';
    ctx.font = '600 22px Prompt, Tahoma, sans-serif';
    ctx.fillText(s.badge || 'พื้นที่โฆษณา 3D สระหลวง', 256, 62);

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 34px Prompt, Tahoma, sans-serif';
    ctx.fillText(s.title || 'เปิดรับร้านค้า / สปอนเซอร์', 256, 118);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '400 20px Prompt, Tahoma, sans-serif';
    ctx.fillText(s.subtitle || 'ติดต่อตั้งป้ายไฟ & บูธ 3D', 256, 160);

    const lineId = (TOTO.CONTACT_INFO && TOTO.CONTACT_INFO.lineId) || 'nineza4456';

    // CTA pill at bottom
    ctx.fillStyle = s.isAvailable !== false ? '#d4af6a' : '#22c55e';
    ctx.beginPath();
    ctx.roundRect(76, 182, 360, 40, 20);
    ctx.fill();
    ctx.fillStyle = '#091224';
    ctx.font = '700 18px Prompt, Tahoma, sans-serif';
    ctx.fillText(s.isAvailable !== false ? `ติดต่อลงป้าย • LINE: ${lineId}` : (s.promo || 'คลิกดูรายละเอียดร้านค้า'), 256, 208);

    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  function createBoothBannerTexture(slot) {
    const s = slot || {};
    const c = makeCanvas(512, 128);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#7c2d12';
    ctx.fillRect(0, 0, 512, 128);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 6;
    ctx.strokeRect(5, 5, 502, 118);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#fef08a';
    ctx.font = '700 30px Prompt, Tahoma, sans-serif';
    ctx.fillText(s.badge || 'ซุ้มร้านค้า 3D ว่าง • เปิดให้เช่า', 256, 52);

    ctx.fillStyle = '#ffffff';
    ctx.font = '500 22px Prompt, Tahoma, sans-serif';
    ctx.fillText(s.title || 'ติดต่อออกบูธ 3D + คูปองหน้าร้าน', 256, 94);

    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  TOTO.textures = {
    createSkyGradientTexture,
    createBrickPromenadeTexture,
    createMunicipalGatewayTexture,
    createTopiaryBannerTexture,
    createMunicipalSignTexture,
    createMenuBannerTexture,
    createCartSkirtTexture,
    createLaundrySignTexture,
    createZincTextures,
    createRedRoofTextures,
    createAsphaltTexture,
    createIntersectionBoxTexture,
    createAccordionDoorTexture,
    createAdviceShophouseTexture,
    createApronTexture,
    createRoadSignTexture,
    createBuntingTexture,
    createPinkHouseWallTexture,
    createPorcelainPotTexture,
    createStonePillarTexture,
    createContactShadowTexture,
    createSponsorBillboardTexture,
    createBoothBannerTexture,
    contactShadowTex: createContactShadowTexture(),
    warmGlowTex: createGlowTexture('rgba(255, 195, 95, 0.72)'),
    fireGlowTex: createGlowTexture('rgba(255, 105, 35, 0.75)'),
    pinkGlowTex: createGlowTexture('rgba(246, 210, 125, 0.75)'),
    smokeTex: createGlowTexture('rgba(220, 226, 238, 0.36)')
  };
})();

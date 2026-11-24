(function () {
  'use strict';

  const TOTO = (window.TOTO = window.TOTO || {});

  // ============================================================
  // MONETIZATION & SHOP INFO SETTINGS (Nine สามารถแก้ข้อมูลจริงตรงนี้)
  // ============================================================
  TOTO.MONETIZATION = {
    promptPayId: '',
    promptPayName: 'ด.ช. วรพัทธ์ ส่งกรม',
    promptPayMasked: 'บัญชี xxx-x-x5044-x (รับเงินได้จากทุกธนาคาร)',
    customQrImageUrl: 'assets/promptpay-qr.jpg',
    shopCardTitle: 'เจ๊แพรรี่ หอยทอด ผัดไทย • สระหลวง หนองไผ่',
    shopCardSubtitle: 'แวะชิมหอยทอดกรอบ ออส่วน ผัดไทยร้อนๆ ได้ที่หน้าร้านจริง',
    shopAddress: 'ซอยสระหลวงใต้ (ซอยเทศบาล 34) หน้าร้านตึกชมพู สระหลวง อ.หนองไผ่'
  };

  TOTO.KRATHONG_BASES = [
    { id: 'banana', name: 'ใบตองพับกลีบ', cost: 0, desc: 'กลีบใบตองสดพับสองชั้นแบบดั้งเดิม' },
    { id: 'coconut', name: 'กะลามะพร้าว', cost: 0, desc: 'กะลาขัดเงาธรรมชาติ สืบสานภูมิปัญญา' },
    { id: 'bread', name: 'ขนมปัง', cost: 0, desc: 'ขนมปังสีทองเป็นมิตรต่อปลาในสระหลวง' },
    { id: 'gold', name: 'กระทงทองคำพิเศษ', cost: 0, vipOnly: true, desc: 'กลีบทองคำเปล่งประกาย + จุดพลุฉลองชื่อ' }
  ];

  TOTO.KRATHONG_FLOWERS = [
    { id: 'lotus', name: 'ดอกบัวชมพู', color: 0xf472b6, desc: 'กลีบบัวฉัตรสิริมงคล' },
    { id: 'marigold', name: 'ดอกดาวเรือง', color: 0xfacc15, desc: 'สีทองรุ่งเรืองสว่างไสว' },
    { id: 'orchid', name: 'กล้วยไม้ม่วง', color: 0xa855f7, desc: 'อ่อนช้อยงดงามร่วมสมัย' },
    { id: 'globe', name: 'บานไม่รู้โรย', color: 0xe11d48, desc: 'สีบานเย็นสดใส รักมั่นคงไม่โรยรา' }
  ];

  TOTO.KRATHONG_CANDLES = [
    { id: 'gold', name: 'เทียนเหลืองทอง', color: 0xfde047, hex: '#fde047', desc: 'เสริมการเงินรุ่งเรือง' },
    { id: 'pink', name: 'เทียนชมพู', color: 0xf9a8d4, hex: '#f9a8d4', desc: 'เสริมความรักเมตตา' },
    { id: 'red', name: 'เทียนแดงมงคล', color: 0xef4444, hex: '#ef4444', desc: 'เสริมโชคลาภพุ่งแรง' },
    { id: 'white', name: 'เทียนขาวบริสุทธิ์', color: 0xf8fafc, hex: '#f8fafc', desc: 'เสริมความสงบร่มเย็น' }
  ];

  TOTO.KRATHONG_TOPPINGS = [
    { id: 'coin', name: '🪙 เหรียญมงคล 9 บาท', desc: 'วางเหรียญทองเสริมทรัพย์' },
    { id: 'swan', name: '🦢 หงส์ใบตองจิ๋ว', desc: 'พับหงส์น้อยประณีตสง่างาม' },
    { id: 'garland', name: '🌺 พวงมาลัยจิ๋ว', desc: 'มาลัยดอกมะลิ-กุหลาบคล้องขอบ' },
    { id: 'lotus_bud', name: '🪷 บัวตูมคู่มงคล', desc: 'ดอกบัวตูมสีชมพูตั้งคู่กลาง' },
    { id: 'sparkler', name: '✨ ไฟเย็นจิ๋ว', desc: 'ก้านไฟเย็นเปล่งประกายระยิบ' }
  ];

  TOTO.PASSPORT_SPOTS = [
    { id: 'pier', landmarkId: 'pier', icon: '🪷', title: 'ท่าน้ำสระหลวง (ทิศใต้)', task: 'ลอยกระทง หรือ โยนเหรียญน้ำพุ' },
    { id: 'toto', landmarkId: 'toto', icon: '🦪', title: 'เจ๊แพรรี่ หอยทอด ผัดไทย', task: 'ลองผัดหอยทอด/ผัดไทย 1 กระทะ' },
    { id: 'west_gate', landmarkId: 'west_gate', icon: '🏮', title: 'ซุ้มประตูเทศบาลฯ (ทิศตะวันตก)', task: 'ปล่อยโคมยี่เป็งเลี้ยงลมร้อน' },
    { id: 'north_advice', landmarkId: 'north_advice', icon: '🎯', title: 'ฝั่งตึกแถวแอดไวซ์ (ทิศเหนือ)', task: 'เล่นซุ้มปาโป่งงานวัดหนองไผ่' }
  ];

  TOTO.KRATHONG_QUOTA = {
    maxPerHour: 3,
    windowMs: 60 * 60 * 1000
  };

  // Kept clean for fallback/compatibility
  TOTO.KRATHONG_TYPES = [
    { id: 'lotus', name: 'กระทงใบตองดอกบัว', cost: 0, mult: 1.0, desc: 'ประดิษฐ์และลอยในสระหลวงฟรี' },
    { id: 'marigold', name: 'กระทงดอกดาวเรือง', cost: 0, mult: 1.25, desc: 'สีทองสิริมงคล' },
    { id: 'toto', name: 'กระทงทองคำพิเศษ', cost: 0, mult: 2.5, vipOnly: true, desc: 'ปลดล็อกเมื่อร่วมสนับสนุน' }
  ];

  TOTO.RECIPES = [
    { id: 'hoitod', name: 'หอยทอดกรอบ', short: 'หอยทอด', icon: '🦪', price: 60, cookTime: 7.2, color: '#e6a23c' },
    { id: 'orsuan', name: 'ออส่วนกระทะร้อน', short: 'ออส่วน', icon: '🍲', price: 80, cookTime: 7.8, color: '#f3d179' },
    { id: 'padthaishrimp', name: 'ผัดไทยกุ้งสด', short: 'ผัดไทยกุ้งสด', icon: '🍤', price: 75, cookTime: 8.2, color: '#ea6a32' },
    { id: 'padthaiwoonsen', name: 'ผัดไทยวุ้นเส้น', short: 'ผัดไทยวุ้นเส้น', icon: '🍜', price: 65, cookTime: 6.8, color: '#d48238' },
    { id: 'padthaihor', name: 'ผัดไทยห่อไข่', short: 'ผัดไทยห่อไข่', icon: '🍳', price: 70, cookTime: 8.5, color: '#facc15' },
    { id: 'hoitodtalay', name: 'หอยทอดทะเลรวม', short: 'หอยทอดทะเล', icon: '🦑', price: 90, cookTime: 8.2, color: '#d97706' }
  ];

  TOTO.UPGRADES = [
    { id: 'burner', name: 'หัวแก๊สแรงดันสูง', desc: 'ผัดสุกเร็วขึ้น +22%', baseCost: 120, level: 0, max: 3 },
    { id: 'pan', name: 'กระทะเหล็กหล่อ', desc: 'ช่วงกรอบพอดีกว้างขึ้น', baseCost: 140, level: 0, max: 3 },
    { id: 'shoes', name: 'รองเท้าคล่องตัว', desc: 'เดินรอบสระเร็วขึ้น +18%', baseCost: 100, level: 0, max: 3 },
    { id: 'sauce', name: 'ซอสพริกสูตรเด็ด', desc: 'ทิปลูกค้าเพิ่ม +25%', baseCost: 160, level: 0, max: 3 }
  ];

  TOTO.WISH_BUFFS = [
    { id: 'wealth', name: 'ค้าขายร่ำรวย', duration: 90, desc: 'ขอพรการงานการเงิน' },
    { id: 'patience', name: 'ร่มเย็นเป็นสุข', duration: 90, desc: 'ขอพรครอบครัวสุขภาพ' },
    { id: 'fastfire', name: 'สมหวังดังใจ', duration: 90, desc: 'ขอพรความสำเร็จสมหวัง' }
  ];

  TOTO.QUICK_GREETINGS = [
    'สวัสดีวันลอยกระทง ✨',
    'ขอให้เฮงๆ ปังๆ ตลอดปี 🏮',
    'กระทงสวยมาก สาธุ! 🙏',
    'แวะกินหอยทอดเจ๊แพรรี่กัน 🦪',
    'มาเดินเล่นสระหลวงหนองไผ่ด้วยกัน 🎉'
  ];

  TOTO.FORTUNES = [
    { num: 1, level: 'ดีเยี่ยมมาก', title: 'จันทร์เพ็ญส่องทางรุ่งโรจน์', text: 'คิดสิ่งใดสมปรารถนา งานใหญ่ที่รอคอยกำลังจะสำเร็จงดงาม มีผู้ใหญ่คอยหนุนหลัง' },
    { num: 3, level: 'ดีมาก', title: 'สายน้ำพาโชคลาภไหลมา', text: 'การเงินคล่องตัว ค้าขายคึกคัก มีเกณฑ์ได้โชคลาภหรือข่าวดีแบบไม่ทันตั้งตัว' },
    { num: 5, level: 'ดีมาก', title: 'ดอกบัวบานกลางสระหลวง', text: 'เสน่ห์เมตตามหานิยมแรง เจอเพื่อนใหม่และกัลยาณมิตรที่ดี คอยช่วยเหลือตลอดปี' },
    { num: 7, level: 'ดี', title: 'ประทีปนำชัยปลอดภัยทุกเส้นทาง', text: 'เดินทางใกล้ไกลแคล้วคลาดปลอดภัย สุขภาพร่างกายแข็งแรง โรคภัยคลายตัว' },
    { num: 9, level: 'เฮงสุดขีด', title: 'เก้าหน้าเก้าไกลการงานพุ่งแรง', text: 'ทำอะไรก็ราบรื่นก้าวหน้าแบบก้าวกระโดด เหมาะเริ่มต้นโปรเจกต์ใหม่หรือขยายกิจการ' },
    { num: 12, level: 'ดีเยี่ยม', title: 'ความรักอบอุ่นดั่งแสงเทียน', text: 'คนมีคู่เข้าใจกันลึกซึ้งยิ่งขึ้น คนโสดมีเกณฑ์ได้เจอคนถูกใจในงานเทศกาลหรือทางออนไลน์' },
    { num: 15, level: 'ดีมาก', title: 'เพ็ญสิบห้าค่ำทรัพย์สินงอกเงย', text: 'เงินที่ลงทุนหรือแรงที่ลงไว้จะเริ่มผลิดอกออกผล มีรายได้เสริมเข้ามาเรื่อยๆ' },
    { num: 18, level: 'ดี', title: 'ลมพัดสิ่งร้ายให้ลอยพ้นไป', text: 'เรื่องติดขัดใจหรือความเครียดที่ผ่านมาจะคลี่คลายลง เหลือแต่ความสบายใจนับจากนี้' },
    { num: 21, level: 'ดีมาก', title: 'ดาวเรืองทองส่องแสงชัยชนะ', text: 'การเรียนและการสอบผ่านฉลุย ความพยายามที่ทุ่มเทจะสร้างชื่อเสียงและความภูมิใจ' },
    { num: 24, level: 'ดีเยี่ยม', title: 'ร่มเย็นเป็นสุขทั้งครอบครัว', text: 'คนในบ้านปรองดองอบอุ่น มีโอกาสได้กินข้าวพร้อมหน้าพร้อมตา อบอวลด้วยรอยยิ้ม' },
    { num: 27, level: 'เฮงสุดขีด', title: 'พลุฉลองชัยข่าวดีสองเด้ง', text: 'จะได้ข่าวดีซ้อนกัน 2 เรื่อง ทั้งเรื่องงานและเรื่องส่วนตัว ยิ้มรับทรัพย์ปลายปี' },
    { num: 29, level: 'ดีมาก', title: 'หอยทอดร้อนๆ เติมพลังชีวิต', text: 'พลังใจกลับมาเต็มร้อย คิดไวทำไว โอกาสทองอยู่ตรงหน้า ลงมือทำได้เลยแล้วจะปัง!' }
  ];

  // Real-Scale Pond Coordinates (Pond 90m x 56m centered at (8, 0, 36); Water X: -37..+53, Z: 8..64)
  TOTO.LOCATIONS = {
    PIER_SPOT: { x: 6, y: 0, z: 6.2 },
    POND_LAUNCH: { x: 6, y: -0.15, z: 9.2 },
    POND_TARGET: { x: 8, y: -0.15, z: 26.0 },
    CART_POS: { x: -16.0, y: 0, z: -3.8 },
    CART_STAND: { x: -15.7, y: 0, z: -4.9 }
  };

  TOTO.LANDMARKS = [
    { id: 'pier', name: 'ท่าน้ำลอยกระทง สระหลวง', x: 6, z: 6.2, yaw: 0.0, pitch: -0.04 },
    { id: 'toto', name: 'เจ๊แพรรี่ หอยทอด ผัดไทย (ซอยสระหลวงใต้)', x: -14.8, z: 0.8, yaw: Math.PI + 0.12, pitch: -0.02 },
    { id: 'west_gate', name: 'ซุ้มประตูเทศบาลตำบลหนองไผ่ (ทิศตะวันตก)', x: 65.5, z: 36, yaw: -Math.PI / 2, pitch: 0.03 },
    { id: 'north_advice', name: 'ฝั่งตึกแถวแอดไวซ์ (ทิศเหนือ)', x: 6, z: 66.2, yaw: Math.PI, pitch: -0.04 }
  ];

  // ============================================================
  // SPONSOR & ADVERTISING BILLBOARDS (Nine แก้ข้อมูลร้านค้าสปอนเซอร์จริงตรงนี้!)
  // ============================================================
  TOTO.CONTACT_INFO = {
    brandName: 'พื้นที่โฆษณา 3D สระหลวง หนองไผ่',
    headline: 'พื้นที่โฆษณาบนป้าย 3D สระหลวง',
    subhead: 'สนใจลงป้ายโฆษณาร้านค้า / สปอนเซอร์ริมสระหลวง อ.หนองไผ่ ติดต่อได้โดยตรงทาง LINE',
    lineId: 'nineza4456',
    lineUrl: 'https://line.me/ti/p/~nineza4456'
  };

  TOTO.SPONSOR_SLOTS = [
    {
      id: 'south_pier_billboard',
      kind: 'billboard',
      x: 13.8,
      z: 4.95,
      rotY: 0,
      isAvailable: true,
      badge: 'พื้นที่โฆษณา 3D • จุดที่ 1',
      title: 'เปิดรับร้านค้า / สปอนเซอร์',
      subtitle: 'สนใจลงป้ายติดต่อ LINE: nineza4456',
      promo: '',
      linkUrl: ''
    },
    {
      id: 'west_gate_billboard',
      kind: 'billboard',
      x: 56.8,
      z: 30.8,
      rotY: -Math.PI / 2,
      isAvailable: true,
      badge: 'พื้นที่โฆษณา 3D • จุดที่ 2',
      title: 'ป้ายไฟหน้าสวนสาธารณะ',
      subtitle: 'สนใจลงป้ายติดต่อ LINE: nineza4456',
      promo: '',
      linkUrl: ''
    }
  ];

  TOTO.STATE = {
    started: false,
    money: 0,
    served: 0,
    rating: 5.0,
    ratingCount: 0,
    combo: 0,
    gameMinutes: 20 * 60,
    endless: false,
    shiftShown: false,
    camMode: 1,
    autoCamera: false,
    timeMode: 'NIGHT',
    loyKrathongMode: true,
    muted: false,
    photoMode: false,
    selfieMode: false,
    sponsorModalOpen: false,
    searchModalOpen: false,
    avatarModalOpen: false,
    minigameModalOpen: false,
    passportModalOpen: false,
    emoteMenuOpen: false,
    onlineCount: 1,
    cookPanelOpen: false,
    krathongModalOpen: false,
    carrying: null,
    pan: {
      active: false,
      recipe: null,
      progress: 0,
      flips: 0,
      burnt: false
    },
    selectedBase: 'banana',
    selectedFlower: 'lotus',
    selectedCandle: 'gold',
    selectedTopping: 'coin',
    selectedKrathong: 'lotus',
    selectedWish: 'wealth',
    vipUnlocked: false,
    donateAmount: 19,
    krathongLaunched: 0,
    krathongScore: 0,
    blessingType: null,
    blessingTimer: 0,
    ramwongBeatPhase: 0,
    ramwongCombo: 0,
    qualityMode: 'AUTO'
  };
})();

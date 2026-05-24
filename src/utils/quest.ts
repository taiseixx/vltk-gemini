import { Quest, MartialManual, Rarity, HeritagePrefix } from '../types';

export const getInitialManualsForSect = (sectId: string): MartialManual[] => {
  const sectNames: Record<string, string> = {
    sl: 'Thập Đại La Hán Quyết',
    vd: 'Thái Cực Chân Nguyên Quyết',
    cb: 'Hàng Long Thập Bát Kinh',
    nm: 'Thanh Tâm Thần Diệu Kinh',
    cl: 'Phong Sương Toái Ngọc Tâm Pháp',
    nd: 'Vạn Vô Kịch Độc Bản Chỉ',
    tm: 'Quỷ Ảnh Mê Tung Sa Điệu',
    ty: 'Băng Tức Kiếm Khí Chân Bản',
    tv: 'Thiên Vương Điệp Giáp Lục',
    tn: 'Ma Diệm Phần Thiên Quyết',
  };
  const title = sectNames[sectId] || 'Giang Hồ Sơ Cất Quyết';
  
  return [
    {
      id: `manual_init_${sectId}`,
      name: `📚 Sơ Cấp ${title}`,
      sectId,
      rarity: 'common',
      effectName: 'Trợ lực bản môn: +4% Tỉ lệ Chí Mạng',
      statBoost: { atkChance: 0.04 },
      icon: '📚',
      equipped: true,
      level: 1,
      maxLevel: 5,
      levelRequirement: 1
    }
  ];
};

export const SECT_LEVEL_MANUALS: Record<string, { name: string; rarity: 'rare' | 'epic' | 'legendary'; effect: string; statBoost: MartialManual['statBoost'] }[]> = {
  sl: [
    { name: 'Trung Cấp Đạt Ma Tâm Pháp', rarity: 'rare', effect: 'Tăng 8% Kháng Phòng Thủ', statBoost: { resBonus: 0.08 } },
    { name: 'Cao Cấp Kim Cang Thần Chú', rarity: 'epic', effect: 'Hồi sinh khí: +60 HP dồi dào cực đại', statBoost: { hpBonus: 60 } },
    { name: 'Tuyệt Thế Dịch Cân Tẩy Tủy Kinh', rarity: 'legendary', effect: 'Lực tay: Rút ngắn 12% CD xuất phát chiêu', statBoost: { atkSpeed: 0.12 } }
  ],
  vd: [
    { name: 'Trung Cấp Chân Vũ Cửu Biến', rarity: 'rare', effect: 'Kháng phòng thủ: +10% kháng toàn bộ', statBoost: { resBonus: 0.10 } },
    { name: 'Cao Cấp Lưỡng Nghi Vực Cực', rarity: 'epic', effect: 'Hồi chân khí: +45 MP dự trữ nội tạng', statBoost: { mpBonus: 45 } },
    { name: 'Tuyệt Thế Thái Cực Quy Tông Pháp', rarity: 'legendary', effect: 'Tích tụ khí: +8% Tỉ lệ Chí Mạng sát phạt', statBoost: { atkChance: 0.08 } }
  ],
  cb: [
    { name: 'Trung Cấp Đả Cẩu Thần Pháp', rarity: 'rare', effect: 'Thân thủ: Rút ngắn 8% CD ra đòn quyết kích', statBoost: { atkSpeed: 0.08 } },
    { name: 'Cao Cấp Hàng Long Sơ Chưởng', rarity: 'epic', effect: 'Hồi sinh khí: +75 HP dồi dào mãnh liệt', statBoost: { hpBonus: 75 } },
    { name: 'Tuyệt Thế Đỉnh Cao Thập Bát Chưởng', rarity: 'legendary', effect: 'Tài phúc bộ: +15% lượng Ngân lượng thu được', statBoost: { goldMult: 0.15 } }
  ],
  nm: [
    { name: 'Trung Cấp Ngọc Nữ Chữa Triệu', rarity: 'rare', effect: 'Kháng phòng thủ: +10% kháng sát thương pháp', statBoost: { resBonus: 0.10 } },
    { name: 'Cao Cấp Hộ Thể Hoa Sen Chú', rarity: 'epic', effect: 'Hồi sinh khí: +55 HP sung mãn', statBoost: { hpBonus: 55 } },
    { name: 'Tuyệt Thế Cửu Âm Chân Kinh Bản Thần', rarity: 'legendary', effect: 'Đạt đạo: Rút ngắn 10% CD xuất chiêu, +6% Chí mạng', statBoost: { atkSpeed: 0.10, atkChance: 0.06 } }
  ],
  cl: [
    { name: 'Trung Cấp Kiếm Khiếu Cô Sương', rarity: 'rare', effect: 'Hồi chân khí: +35 MP nội công dạt dào', statBoost: { mpBonus: 35 } },
    { name: 'Cao Cấp Lôi Chấn Vũ Uy Kinh', rarity: 'epic', effect: 'Sát lực: Tăng +5% Tỉ lệ Chí Mạng thi triển', statBoost: { atkChance: 0.05 } },
    { name: 'Tuyệt Thế Khí Long Điệp Trảm Thần Công', rarity: 'legendary', effect: 'Sấm sét: Rút ngắn 10% thời gian xuất đao chiêu thức', statBoost: { atkSpeed: 0.10 } }
  ],
  nd: [
    { name: 'Trung Cấp Xuyên Tâm Độc Kinh', rarity: 'rare', effect: 'Du hành: +10% Ngân lượng rơi hằng trận', statBoost: { goldMult: 0.10 } },
    { name: 'Cao Cấp Ngũ Độc Toái Linh Phù', rarity: 'epic', effect: 'Phật thân: +8% kháng toàn bộ lực', statBoost: { resBonus: 0.08 } },
    { name: 'Tuyệt Thế Ma Kha Vạn Cổ Hồn Kinh', rarity: 'legendary', effect: 'Tối độc: Trực tiếp tăng +40 MP và +45 HP cực hạn', statBoost: { hpBonus: 45, mpBonus: 40 } }
  ],
  tm: [
    { name: 'Trung Cấp Ám Khí Bát Quái', rarity: 'rare', effect: 'Rút ngắn 6% CD ra đòn ám khí tiễn cốt', statBoost: { atkSpeed: 0.06 } },
    { name: 'Cao Cấp Cửu Cung Phi Phi Tiêu', rarity: 'epic', effect: 'Kháng thể: +8% Kháng sát thương dính độc', statBoost: { resBonus: 0.08 } },
    { name: 'Tuyệt Thế Vô Ảnh Liên Châu Luận Pháp', rarity: 'legendary', effect: 'Bảo tiêu: Tăng lớn +7% Tỉ lệ Chí Mạng ám đòn', statBoost: { atkChance: 0.07 } }
  ],
  ty: [
    { name: 'Trung Cấp Tuyết Ảnh Thao Lược', rarity: 'rare', effect: 'Hồng đan: +45 HP dồi dào', statBoost: { hpBonus: 45 } },
    { name: 'Cao Cấp Băng Sương Hóa Thân', rarity: 'epic', effect: 'Đạo nhân: +30 MP tĩnh khí hồi tâm', statBoost: { mpBonus: 30 } },
    { name: 'Tuyệt Thế Lăng Ba Vi Bộ Thần Quyết', rarity: 'legendary', effect: 'Thượng tiên: Tăng +12% Ngân lượng và rút ngắn 8% CD', statBoost: { goldMult: 0.12, atkSpeed: 0.08 } }
  ],
  tv: [
    { name: 'Trung Cấp Phá Giáp Thương Pháp', rarity: 'rare', effect: 'Kháng thiết: +9% Kháng toàn bộ vật lý ngoại', statBoost: { resBonus: 0.09 } },
    { name: 'Cao Cấp Hoành Tảo Sa Trường Lục', rarity: 'epic', effect: 'Cương cốt: +75 HP cực đại dũng sĩ', statBoost: { hpBonus: 75 } },
    { name: 'Tuyệt Thế Bá Vương Thiết Kích Kinh', rarity: 'legendary', effect: 'Trọng đả: Rút ngắn +8% CD và tăng +5% Chí Mạng', statBoost: { atkSpeed: 0.08, atkChance: 0.05 } }
  ],
  tn: [
    { name: 'Trung Cấp Phệ Hồn Chỉ Bản', rarity: 'rare', effect: 'Hồi MP: +35 MP nội dự chân lực', statBoost: { mpBonus: 35 } },
    { name: 'Cao Cấp Thiết Mã Liên Hoàn Sa', rarity: 'epic', effect: 'Vàng ròng: Tăng +12% Ngân lượng quy đổi võ giới', statBoost: { goldMult: 0.12 } },
    { name: 'Tuyệt Thế Ma Diệm Phần Thiên Mật Sử', rarity: 'legendary', effect: 'Hoả vương: +40 HP cực đỉnh cùng +6% Chí Mạng nổ', statBoost: { hpBonus: 40, atkChance: 0.06 } }
  ]
};

export const generateRandomQuest = (idSuffix: string, stage: number, difficultyOverride?: Quest['difficulty']): Quest => {
  const types: Quest['type'][] = ['escort', 'jailbreak', 'sect', 'songjin'];
  // Ensure that at lower stages we can also spawn various kinds
  const randType = types[Math.floor(Math.random() * types.length)];
  
  let difficulty: Quest['difficulty'] = 'Giang Hồ';
  if (difficultyOverride) {
    difficulty = difficultyOverride;
  } else {
    const rand = Math.random();
    if (rand < 0.28) difficulty = 'Trầm Tích';
    else if (rand < 0.65) difficulty = 'Giang Hồ';
    else if (rand < 0.88) difficulty = 'Tông Môn';
    else difficulty = 'Hoàng Kim';
  }

  // Exact image paths matching our generated icons!
  let banner = '/src/assets/images/wuxia_escort_1779615647384.png';
  let title = 'Nhiệm Vụ Thủy Mặc';
  let description = '';
  let targetCount = 30;
  let rewardLabel = 'Chấn Hà Ngân Lượng & Thiết Kỳ';

  if (randType === 'escort') {
    banner = '/src/assets/images/wuxia_escort_1779615647384.png';
    const subTitles = ['Hộ Tống Vong Xuyên Đan Dược', 'Áp Giải Thần Binh Kiếm Các', 'Vận Chuyển Lương Thảo Ngụy Thành'];
    title = `🐎 ${subTitles[Math.floor(Math.random() * subTitles.length)]}`;
    description = 'Đồng hành cùng tiêu cục hộ tống các rương châu báu, võ lâm dược thảo thiết yếu vượt qua mạn đồi núi trập trùng đầy dẫy phỉ tặc.';
    targetCount = 25 + Math.floor(Math.random() * 20);
    rewardLabel = 'Ngân lượng dồi dào & Ngẫu nhiên trang bị ' + (difficulty === 'Hoàng Kim' ? 'Hoàng Kim' : 'Hiếm');
  } else if (randType === 'jailbreak') {
    banner = '/src/assets/images/wuxia_jailbreak_1779615665670.png';
    const subTitles = ['Cướp Ngục Giải Cứu Nghĩa Sĩ', 'Đột Nhập Phủ Viện Quan Minh', 'Huyết Tẩy Đại Lao Biện Kinh'];
    title = `⛓️ ${subTitles[Math.floor(Math.random() * subTitles.length)]}`;
    description = 'Bằng hữu vô tội bị nha môn giam giữ chờ xử quyết. Hãy dũng cảm đột nhập ngục đài tối om mở khóa xích sắt gông cùm cứu nguy nghĩa sĩ.';
    targetCount = 1; // defeat sub boss or boss
    rewardLabel = 'Võ học Bí Kíp quý hiếm hoặc Trang bị Tông Truyền';
  } else if (randType === 'sect') {
    banner = '/src/assets/images/wuxia_sect_1779615686566.png';
    const subTitles = ['Diệt Ác Trừ Gian Sư Môn', 'Vượt Ải Giáo Huấn Đệ Tử', 'Sưu Tầm Cổ Vật Minh Ngôn'];
    title = `🏔️ ${subTitles[Math.floor(Math.random() * subTitles.length)]}`;
    description = 'Trách nhiệm tông môn nặng trĩu. Trưởng môn tối cao ban bố huấn chỉ yêu cầu đệ tử lập liên hoán chiến tích trừ ma diệt đạo vang danh thiên hạ.';
    targetCount = 2; // stages to clear
    rewardLabel = 'Tu vi EXP dồi dào & Trang bị Gia Truyền cường hóa';
  } else {
    banner = '/src/assets/images/wuxia_songjin_1779615704844.png';
    title = '🚩 Tống Kim Cứu Quốc Đại Chiến';
    description = 'Chiến sự Sa Phụ Tháp bùng nổ hoành tráng, giặc xâm lược lấn át bờ cõi Thần Châu. Hãy giương cao bảo kiếm, cưỡi chiến mã dũng mãnh dẹp loạn cứu thế!';
    targetCount = 1; // Defeat Boss
    difficulty = 'Hoàng Kim'; // Always golden for Song-Jin
    rewardLabel = 'Bảo Quà Ẩn Tích Võ Lâm (Phần thưởng ngẫu nhiên cực tài)';
  }

  const baseGold = 500 * stage;
  const baseExp = 250 * stage;
  
  const rarities: Record<Quest['difficulty'], Rarity> = {
    'Trầm Tích': 'rare',
    'Giang Hồ': 'epic',
    'Tông Môn': 'legendary',
    'Hoàng Kim': 'gold_rarity'
  };

  const heritages: Record<Quest['difficulty'], HeritagePrefix> = {
    'Trầm Tích': 'thất truyền',
    'Giang Hồ': 'gia truyền',
    'Tông Môn': 'tông truyền',
    'Hoàng Kim': 'ân điển'
  };

  const mult = difficulty === 'Trầm Tích' ? 0.8 : difficulty === 'Giang Hồ' ? 1.2 : difficulty === 'Tông Môn' ? 2.0 : 3.5;

  return {
    id: `quest_${Date.now()}_${idSuffix}`,
    title,
    description,
    type: randType,
    difficulty,
    banner,
    targetCount,
    currentCount: 0,
    status: 'available',
    rewardLabel,
    rewardValue: {
      gold: Math.floor(baseGold * mult),
      exp: Math.floor(baseExp * mult),
      equipRarity: rarities[difficulty],
      equipPrefix: heritages[difficulty]
    }
  };
};

export const HERITAGE_BADGES: Record<HeritagePrefix, { text: string; label: string; bg: string; textCol: string }> = {
  'thất truyền': { text: '失', label: 'Thất Truyền', bg: 'bg-zinc-700/80', textCol: 'text-zinc-300' },
  'gia truyền': { text: '家', label: 'Gia Truyền', bg: 'bg-blue-600/80', textCol: 'text-blue-100' },
  'tông truyền': { text: '宗', label: 'Tông Truyền', bg: 'bg-amber-600/80', textCol: 'text-amber-100' },
  'ân điển': { text: '恩', label: 'Ân Điển', bg: 'bg-yellow-500/90 shadow-[0_0_8px_#f1c40f]', textCol: 'text-amber-950 font-black' }
};

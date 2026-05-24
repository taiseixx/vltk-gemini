import { Companion } from '../types';

export function getCompanionForSect(sectId: string): Companion {
  let type = 'Thần Thú';
  let name = 'Cổ Thần Thú';
  let emoji = '🐱';
  
  switch(sectId) {
    case 'sl':
      type = 'Bạch Hổ';
      name = 'Tuyết Ảnh Bạch Hổ';
      emoji = '🐯';
      break;
    case 'vd':
      type = 'Thanh Long';
      name = 'Lôi Cơ Thanh Long';
      emoji = '🐉';
      break;
    case 'cb':
      type = 'Chiến Lang';
      name = 'Thiết Huyết Chiến Lang';
      emoji = '🐺';
      break;
    case 'nm':
      type = 'Ngọc Phượng';
      name = 'Thải Vân Ngọc Phượng';
      emoji = '🦅';
      break;
    case 'cl':
      type = 'Linh Hạc';
      name = 'Côn Lôn Linh Hạc';
      emoji = '🐦';
      break;
    case 'nd':
      type = 'Thiên Chỉ Ngô Huyết';
      name = 'Ngũ Độc Kim Ngô';
      emoji = '🦂';
      break;
    case 'tm':
      type = 'U Ảnh Báo';
      name = 'Quỷ Ảnh Dạ Báo';
      emoji = '🐱';
      break;
    case 'ty':
      type = 'Tuyết Nhạn';
      name = 'Băng Phong Tuyết Nhạn';
      emoji = '🦢';
      break;
    case 'tv':
      type = 'Hoang Dã Tê Ngưu';
      name = 'Hám Thiên Kim Ngưu';
      emoji = '🐂';
      break;
    case 'tn':
      type = 'Hỏa Kỳ Lân';
      name = 'Hỏa Vân Kỳ Lân';
      emoji = '🔥';
      break;
  }

  return {
    name,
    type,
    emoji,
    level: 1,
    exp: 0,
    hp: 150,
    maxHp: 150,
    atk: 15,
    unlocked: true, // Companion is instantly ready and unlocked for battlefield action!
    equipment: {
      weapon: {
        name: 'Linh Quy Ngoại Trảo',
        rarity: 'rare',
        power: 0,
        tier: 1,
        type: 'weapon',
        upgradeLvl: 0
      },
      armor: {
        name: 'Chiến Thú Kháp Giáp',
        rarity: 'rare',
        power: 0,
        tier: 1,
        type: 'armor',
        upgradeLvl: 0
      }
    }
  };
}

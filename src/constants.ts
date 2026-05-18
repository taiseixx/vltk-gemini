import { Sect, Rarity } from './types';

export const SECTS: Sect[] = [
  {
    id: 'sl',
    name: 'Thiếu Lâm',
    icon: '📿',
    color: '#e67e22',
    motto: 'Thiền võ nhất thể, Kim Cang Bất Hoại',
    stats: { str: 3, agi: 1, con: 4, int: 1, nei: 1 },
    skills: ['La Hán Quyền', 'Đạt Ma Trượng', 'Sư Tử Hống']
  },
  {
    id: 'vd',
    name: 'Võ Đang',
    icon: '☯️',
    color: '#3498db',
    motto: 'Lấy nhu khắc cương, Thái Cực Vô Lượng',
    stats: { str: 1, agi: 2, con: 2, int: 3, nei: 2 },
    skills: ['Thái Cực Kiếm', 'Lưỡng Nghi Trận', 'Chân Vũ Kiếm']
  },
  {
    id: 'cb',
    name: 'Cái Bang',
    icon: '🐉',
    color: '#27ae60',
    motto: 'Tứ hải giai huynh đệ, Hàng Long Thập Bát Chưởng',
    stats: { str: 4, agi: 2, con: 2, int: 1, nei: 1 },
    skills: ['Đả Cẩu Bổng', 'Kháng Long Hữu Hồi', 'Thiên Hạ Vô Cẩu']
  },
  {
    id: 'nm',
    name: 'Nga Mi',
    icon: '🌸',
    color: '#e91e63',
    motto: 'Phật tâm phổ độ, Băng thanh ngọc khiết',
    stats: { str: 1, agi: 2, con: 1, int: 4, nei: 2 },
    skills: ['Phiêu Tuyết Xuyên Vân', 'Phật Quang Phổ Chiếu', 'Phong Ấn Kiếm']
  },
  {
    id: 'cl',
    name: 'Côn Lôn',
    icon: '🏔️',
    color: '#f39c12',
    motto: 'Kiếm khí tung hoành, Lôi động cửu tiêu',
    stats: { str: 2, agi: 3, con: 1, int: 2, nei: 2 },
    skills: ['Phong Sương Cửu Kiếm', 'Phi Yến Hồi Tường', 'Lôi Động Cửu Thiên']
  },
  {
    id: 'nd',
    name: 'Ngũ Độc',
    icon: '🦂',
    color: '#9b59b6',
    motto: 'Độc bộ thiên hạ, Vạn độc xuyên tâm',
    stats: { str: 1, agi: 2, con: 1, int: 4, nei: 2 },
    skills: ['Vạn Độc Tâm Kinh', 'Xuyên Tâm Độc Thương', 'Thiên Châu Vạn Độc']
  },
  {
    id: 'tm',
    name: 'Đường Môn',
    icon: '🎯',
    color: '#8a2be2', // vivid purple (changed from #34495e)
    motto: 'Ám khí vô song, Quỷ ảnh mê tung',
    stats: { str: 2, agi: 4, con: 1, int: 1, nei: 2 },
    skills: ['Phù Vân Xuyên Nguyệt', 'Bạo Vũ Lê Hoa Trâm', 'Độc Thích Cốt']
  },
  {
    id: 'ty',
    name: 'Thúy Yên',
    icon: '❄️',
    color: '#00bcd4',
    motto: 'Băng cơ ngọc cốt, Lăng ba vi bộ',
    stats: { str: 1, agi: 3, con: 2, int: 2, nei: 2 },
    skills: ['Băng Tức Kiếm Khí', 'Tuyết Ảnh Vô Tung', 'Băng Tâm Quyết']
  },
  {
    id: 'tv',
    name: 'Thiên Vương',
    icon: '🛡️',
    color: '#f44336',
    motto: 'Thương phạt thiên hạ, Chiến ý kiêu hùng',
    stats: { str: 4, agi: 1, con: 3, int: 1, nei: 1 },
    skills: ['Thiên Vương Tọa Giáp', 'Phá Giáp Kích', 'Thiên Vương Trảm']
  },
  {
    id: 'tn',
    name: 'Thiên Nhẫn',
    icon: '🔥',
    color: '#d35400',
    motto: 'Hồn phi phách tán, Hỏa diệm thiêu sa',
    stats: { str: 3, agi: 2, con: 2, int: 2, nei: 1 },
    skills: ['Hỏa Diệm Vũ', 'Thiên Ma Giải Thể', 'Phệ Hồn Chiếu']
  }
];

export const RARITIES: Rarity[] = ['common', 'rare', 'epic', 'legendary', 'mythical'];

export const RARITY_MULTIPLIERS = {
  common: 1,
  rare: 1.5,
  epic: 2.2,
  legendary: 3.5,
  mythical: 6.0
};

export const WEAPON_NAMES = ['Mộc Kiếm', 'Thanh Đồng Kiếm', 'Huyền Thiết Trọng Kiếm', 'Ỷ Thiên Kiếm', 'Đồ Long Đao'];

export const RARITY_COLORS = {
  common: '#aaa',
  rare: '#2ecc71',
  epic: '#9b59b6',
  legendary: '#e67e22',
  mythical: '#f1c40f'
};

export const MAP_SIZE = 4000;

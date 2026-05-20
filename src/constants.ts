import { Sect, Rarity } from './types';

export const SECTS: Sect[] = [
  {
    id: 'sl',
    name: 'Thiếu Lâm',
    icon: '📿',
    color: '#e67e22',
    motto: 'Thiền võ nhất thể, Kim Cang Bất Hoại',
    stats: { str: 3, agi: 1, con: 4, int: 1, nei: 1 },
    skills: [
      'La Hán Quyền',
      'Đạt Ma Trượng',
      'Sư Tử Hống',
      'Như Lai Thần Chưởng',
      'Kim Cang Phục Ma Khuyên',
      'Dịch Cân Kinh Vô Ảnh'
    ]
  },
  {
    id: 'vd',
    name: 'Võ Đang',
    icon: '☯️',
    color: '#3498db',
    motto: 'Lấy nhu khắc cương, Thái Cực Vô Lượng',
    stats: { str: 1, agi: 2, con: 2, int: 3, nei: 2 },
    skills: [
      'Thái Cực Kiếm',
      'Lưỡng Nghi Trận',
      'Chân Vũ Kiếm',
      'Kiếm Khí Vô Cực',
      'Thái Cực Thần Công',
      'Tam Thanh Kiếm Khí'
    ]
  },
  {
    id: 'cb',
    name: 'Cái Bang',
    icon: '🐉',
    color: '#27ae60',
    motto: 'Tứ hải giai huynh đệ, Hàng Long Thập Bát Chưởng',
    stats: { str: 4, agi: 2, con: 2, int: 1, nei: 1 },
    skills: [
      'Đả Cẩu Bổng',
      'Kháng Long Hữu Hồi',
      'Thiên Hạ Vô Cẩu',
      'Phi Long Tại Thiên',
      'Thần Long Bái Vĩ',
      'Thập Bát Chưởng Hàng Long'
    ]
  },
  {
    id: 'nm',
    name: 'Nga Mi',
    icon: '🌸',
    color: '#e91e63',
    motto: 'Phật tâm phổ độ, Băng thanh ngọc khiết',
    stats: { str: 1, agi: 2, con: 1, int: 4, nei: 2 },
    skills: [
      'Phiêu Tuyết Xuyên Vân',
      'Phật Quang Phổ Chiếu',
      'Phong Ấn Kiếm',
      'Ngọc Nữ Kiếm Pháp',
      'Thanh Tâm Chú',
      'Cửu Âm Bạch Cốt Trảo'
    ]
  },
  {
    id: 'cl',
    name: 'Côn Lôn',
    icon: '🏔️',
    color: '#f39c12',
    motto: 'Kiếm khí tung hoành, Lôi động cửu tiêu',
    stats: { str: 2, agi: 3, con: 1, int: 2, nei: 2 },
    skills: [
      'Phong Sương Cửu Kiếm',
      'Phi Yến Hồi Tường',
      'Lôi Động Cửu Thiên',
      'Kiếm Khiếu Thần Lôi',
      'Thiên Lôi Chấn Vũ',
      'Côn Lôn Khí Long Tam Trảm'
    ]
  },
  {
    id: 'nd',
    name: 'Ngũ Độc',
    icon: '🦂',
    color: '#9b59b6',
    motto: 'Độc bộ thiên hạ, Vạn độc xuyên tâm',
    stats: { str: 1, agi: 2, con: 1, int: 4, nei: 2 },
    skills: [
      'Vạn Độc Tâm Kinh',
      'Xuyên Tâm Độc Thương',
      'Thiên Châu Vạn Độc',
      'Bách Độc Xuyên Linh',
      'Vạn Cổ Phệ Hồn',
      'Ngũ Độc Thần Sa'
    ]
  },
  {
    id: 'tm',
    name: 'Đường Môn',
    icon: '🎯',
    color: '#8a2be2',
    motto: 'Ám khí vô song, Quỷ ảnh mê tung',
    stats: { str: 2, agi: 4, con: 1, int: 1, nei: 2 },
    skills: [
      'Phù Vân Xuyên Nguyệt',
      'Bạo Vũ Lê Hoa Trâm',
      'Độc Thích Cốt',
      'Cửu Cung Phi Tinh',
      'Thiên Địa Vô Ảnh',
      'Đường Môn Thần Tiễn'
    ]
  },
  {
    id: 'ty',
    name: 'Thúy Yên',
    icon: '❄️',
    color: '#00bcd4',
    motto: 'Băng cơ ngọc cốt, Lăng ba vi bộ',
    stats: { str: 1, agi: 3, con: 2, int: 2, nei: 2 },
    skills: [
      'Băng Tức Kiếm Khí',
      'Tuyết Ảnh Vô Tung',
      'Băng Tâm Quyết',
      'Băng Sương Tỏa Ngọc',
      'Phiêu Phong Chấn Tuyết',
      'Diệu Thủ Chức Thiên'
    ]
  },
  {
    id: 'tv',
    name: 'Thiên Vương',
    icon: '🛡️',
    color: '#f44336',
    motto: 'Thương phạt thiên hạ, Chiến ý kiêu hùng',
    stats: { str: 4, agi: 1, con: 3, int: 1, nei: 1 },
    skills: [
      'Thiên Vương Tọa Giáp',
      'Phá Giáp Kích',
      'Thiên Vương Trảm',
      'Hoành Tảo Thiên Quân',
      'Bá Vương Thương Pháp',
      'Vạn Chúng Nhất Tâm'
    ]
  },
  {
    id: 'tn',
    name: 'Thiên Nhẫn',
    icon: '🔥',
    color: '#d35400',
    motto: 'Hồn phi phách tán, Hỏa diệm thiêu sa',
    stats: { str: 3, agi: 2, con: 2, int: 2, nei: 1 },
    skills: [
      'Hỏa Diệm Vũ',
      'Thiên Ma Giải Thể',
      'Phệ Hồn Chiếu',
      'Ma Diệm Phần Thiên',
      'Cửu Phong Phi Hỏa',
      'Thiên Ma Loạn Thần'
    ]
  }
];

export const RARITIES: Rarity[] = [
  'common',
  'rare',
  'epic',
  'legendary',
  'emerald',
  'gold_rarity',
  'crimson',
  'pink'
];

export const RARITY_MULTIPLIERS = {
  common: 1,
  rare: 1.5,
  epic: 2.2,
  legendary: 3.5,
  emerald: 5.5,
  gold_rarity: 9.0,
  crimson: 15.0,
  pink: 25.0
};

export const RARITY_COLORS = {
  common: '#95a5a6',
  rare: '#2980b9',
  epic: '#8e44ad',
  legendary: '#e67e22',
  emerald: '#1abc9c',
  gold_rarity: '#f1c40f',
  crimson: '#e74c3c',
  pink: '#fd79a8'
};

export const EQUIPMENT_NAME_MAP: Record<string, Record<Rarity, string>> = {
  weapon: {
    common: 'Mộc Kiếm',
    rare: 'Thanh Đồng Đoản Kiếm',
    epic: 'Phục Ma Trảm Yêu Đao',
    legendary: 'Huyền Thiết Trọng Kiếm',
    emerald: 'Bích Huyết Ma Kiếm',
    gold_rarity: 'Ỷ Thiên Thần Kiếm',
    crimson: 'Đồ Long Thánh Đao',
    pink: 'Vô Thượng Thiên Tôn Dạ Quang Kiếm'
  },
  armor: {
    common: 'Bố Y',
    rare: 'Thiết Giáp',
    epic: 'Thanh Long Khải',
    legendary: 'Kim Ti Giáp',
    emerald: 'Bích Hải Ngọc Giáp',
    gold_rarity: 'Hoàng Kim Chiến Giáp',
    crimson: 'Cửu Lân Tử Kim Giáp',
    pink: 'Vô Cực Bát Quái Ngọc Giáp'
  },
  accessory: {
    common: 'Đồng Chỉ Hoàn',
    rare: 'Ngân Hạng Liên',
    epic: 'Phỉ Thúy Chỉ Hoàn',
    legendary: 'Càn Khôn Giới Chỉ',
    emerald: 'Huyền Vũ Minh Châu',
    gold_rarity: 'Thái Cực Bát Quái Bội',
    crimson: 'Long Hồn Ngọc Bội',
    pink: 'Vạn Niên Đăng Thần Ngọc Giới Chỉ'
  },
  special: {
    common: 'Thạch Sách',
    rare: 'Thiết Phiến',
    epic: 'Vô Tự Thiên Thư',
    legendary: 'Thần Nông Đỉnh',
    emerald: 'Thần Thú Ngọc Hỷ',
    gold_rarity: 'Đông Hoàng Chuông',
    crimson: 'Hạo Thiên Kính',
    pink: 'Giang Sơn Xã Tắc Đồ'
  },
  horse: {
    common: 'Thiết Mã',
    rare: 'Táo Hồng Mã',
    epic: 'Hãn Huyết Bảo Mã',
    legendary: 'Độc Giác Ma Thú',
    emerald: 'Tuyết Lang',
    gold_rarity: 'Tây Vực Ô Truy',
    crimson: 'Xích Thố',
    pink: 'Cửu Tiêu Phượng Hoàng Kiệu'
  },
  cloak: {
    common: 'Thô Phi Phong',
    rare: 'Hắc Sa Bào',
    epic: 'Tử Vân Phi Phong',
    legendary: 'Chu Tước Phi Phong',
    emerald: 'Bích Nguyệt Khinh Sa',
    gold_rarity: 'Hoàng Kim Hổ Bì Bào',
    crimson: 'Cửu Thiên Huyền Vũ Bào',
    pink: 'Ngũ Sắc Phượng Hoàng Phi Phong'
  },
  seal: {
    common: 'Thạch Ấn',
    rare: 'Thiết Lệnh Bài',
    epic: 'Ngũ Độc Vương Ấn',
    legendary: 'Nga Mi Kiếm Ấn',
    emerald: 'Bích Ngọc Ấn',
    gold_rarity: 'Thiếu Lâm Phục Ma Lệnh',
    crimson: 'Võ Đang Chân Vũ Ấn',
    pink: 'Võ Lâm Minh Chủ Thần Long Lệnh'
  },
  banner: {
    common: 'Vải Lệnh Kỳ',
    rare: 'Thanh Kỳ',
    epic: 'Phục Ma Kỳ',
    legendary: 'Bá Vương Kỳ',
    emerald: 'Lam Bích Kỳ',
    gold_rarity: 'Hoàng Đế Soái Kỳ',
    crimson: 'Thiên Ma Diệt Thế Kỳ',
    pink: 'Vạn Cổ Tru Tiên Đại Đội Lệnh Kỳ'
  }
};

export const WEAPON_NAMES = ['Mộc Kiếm', 'Thanh Đồng Kiếm', 'Huyền Thiết Trọng Kiếm', 'Ỷ Thiên Kiếm', 'Đồ Long Đao'];

export const MAP_SIZE = 4000;

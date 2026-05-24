import { useState } from 'react';
import { GameState, Equipment, Rarity } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { RARITY_COLORS, SECTS } from '../constants';
// @ts-ignore
import equipmentBg from '../assets/images/equipment_bg_1779367218827.png';
// @ts-ignore
import volamWeaponsImg from '../assets/images/volam_sect_weapons_1779556373416.png';
// @ts-ignore
import volamArmorImg from '../assets/images/volam_sect_armor_1779556389670.png';

interface Props {
  gameState: GameState;
  onAvatarClick: () => void;
  onTargetTextClick: () => void;
}

const formatGold = (value: number): string => {
  if (value >= 100000000) {
    return Math.floor(value / 1000000).toLocaleString('en-US') + 'M';
  }
  if (value >= 1000000) {
    return Math.floor(value / 1000).toLocaleString('en-US') + 'K';
  }
  return value.toLocaleString('en-US');
};

export default function Sidebar({ gameState, onAvatarClick }: Props) {
  const p = gameState.player;
  const eq = p.equipment;
  const sect = SECTS.find(s => s.color === p.color);

  const [selectedGear, setSelectedGear] = useState<{ type: string; item: Equipment | null; emoji: string; slotKey: string } | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showEquipment, setShowEquipment] = useState(true);

  const handleSlotClick = (type: string, item: Equipment | null, emoji: string, slotKey: string) => {
    if (selectedGear && selectedGear.slotKey === slotKey) {
      setSelectedGear(null);
    } else {
      setSelectedGear({ type, item, emoji, slotKey });
    }
  };

  const getTierBadge = (tier?: number): string => {
    const badges = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
    return badges[tier || 1] || '一';
  };

  const getTierName = (tier?: number): string => {
    const names = [
      '',
      'Nhất Đẳng (一)',
      'Nhị Đẳng (二)',
      'Tam Đẳng (三)',
      'Tứ Đẳng (四)',
      'Ngũ Đẳng (五)',
      'Lục Đẳng (六)',
      'Thất Đẳng (七)',
      'Bát Đẳng (八)',
      'Cửu Đẳng (九)'
    ];
    return names[tier || 1] || 'Nhất Đẳng (一)';
  };

  const getRarityName = (rarity: Rarity): string => {
    const names: Record<Rarity, string> = {
      common: 'Phổ Thông (Trắng)',
      rare: 'Ưu Tú (Lam)',
      epic: 'Quý Hiếm (Tím)',
      legendary: 'Truyền Thuyết (Cam)',
      emerald: 'Phỉ Thúy (Lục)',
      gold_rarity: 'Hoàng Kim (Vàng)',
      crimson: 'Huyết Ảnh (Đỏ)',
      pink: 'Vô Thượng (Phòng)'
    };
    return names[rarity] || rarity;
  };

  const Slot = ({ type, item, emoji, slotKey }: { type: string; item: Equipment | null; emoji: string; slotKey: string }) => {
    const rarityColor = item ? RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS] : undefined;
    const isSelected = selectedGear?.slotKey === slotKey;

    return (
      <button 
        type="button"
        onClick={() => handleSlotClick(type, item, emoji, slotKey)}
        className={`flex flex-col items-center group cursor-pointer pointer-events-auto p-1.5 rounded-lg border transition-all duration-200 focus:outline-none
          ${isSelected 
            ? 'bg-gold/15 border-gold/50 shadow-inner scale-105' 
            : 'bg-white/[0.01] border-transparent hover:bg-white/[0.05] hover:border-white/10 hover:scale-105 active:scale-95'}`}
      >
        <div className={`w-11 h-11 md:w-13 md:h-13 bg-gray-950 rounded-lg flex flex-col items-center justify-center relative transition-all border ${isSelected ? 'border-gold shadow-[0_0_15px_rgba(212,175,55,0.6)]' : 'border-gray-850 hover:border-gray-600'}`}>
          {item ? (
            <>
              {/* Majestic Luminous Divine Aura (Hào Quang Luminous Thánh Thể) - High Performance & Extremely Clear */}
              <div className="absolute inset-[-4px] rounded-lg overflow-visible pointer-events-none z-20">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <radialGradient id={`slotLuminous-${slotKey}`} cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                      <stop offset="30%" stopColor={rarityColor} stopOpacity="0.85" />
                      <stop offset="70%" stopColor={rarityColor} stopOpacity="0.2" />
                      <stop offset="100%" stopColor={rarityColor} stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  
                  {/* Soft white core diffusing into a misty color haze */}
                  <circle cx="50" cy="50" r="44" fill={`url(#slotLuminous-${slotKey})`} className="animate-pulse origin-center" />
                  
                  {/* Majestic 4-point/8-point Star Light Rays spinning serenely slowly (equal to skill tempo) */}
                  <g className="origin-center animate-[spin_18s_linear_infinite]">
                    {/* Primary vertical and horizontal slender diamonds */}
                    <path d="M50 8 L52.5 50 L50 92 L47.5 50 Z" fill={rarityColor} fillOpacity="0.5" />
                    <path d="M8 50 L50 52.5 L92 50 L50 47.5 Z" fill={rarityColor} fillOpacity="0.5" />
                    
                    {/* Secondary diagonal diamonds for legendary/premium gear classes to establish grandeur */}
                    {(item.rarity === 'pink' || item.rarity === 'crimson' || item.rarity === 'gold_rarity') && (
                      <g transform="rotate(45 50 50)">
                        <path d="M50 16 L52 50 L50 84 L48 50 Z" fill={rarityColor} fillOpacity="0.4" />
                        <path d="M16 50 L50 52 L84 50 L50 48 Z" fill={rarityColor} fillOpacity="0.4" />
                      </g>
                    )}
                  </g>
                </svg>
              </div>
              <div className="absolute inset-[2.5px] rounded bg-gray-900 z-10 pointer-events-none"
                   style={{ boxShadow: `inset 0 0 10px ${rarityColor}40` }} />
              
              {/* Tier Level Display Badge */}
              <div className="absolute top-0.5 right-1.5 text-[8.5px] md:text-[10px] font-black font-serif z-30 select-none scale-90"
                   style={{ color: rarityColor, textShadow: `0 0 4px ${rarityColor}` }}>
                {getTierBadge(item.tier)}
              </div>
            </>
          ) : (
            <div className="absolute inset-0 border border-gray-800 rounded z-0 pointer-events-none" />
          )}
          <span className="text-xl md:text-2xl z-20 drop-shadow-md relative" style={{ filter: item ? '' : 'grayscale(100%) opacity(40%)', textShadow: item ? `0 0 8px ${rarityColor}` : undefined }}>
            {emoji}
          </span>
        </div>
        <span className="text-[7.5px] md:text-[9px] text-gray-400 mt-1 uppercase tracking-wider font-bold group-hover:text-gold transition-colors z-20 truncate w-12 text-center">
          {type}
        </span>
      </button>
    );
  };

  return (
    <>
      {/* Sect Avatar / Character Info & Help ? Button */}
      <aside className="fixed bottom-24 md:bottom-[7.5rem] left-4 z-40 pointer-events-auto flex items-center gap-2">
        <div className="bg-black/90 backdrop-blur-md border border-gray-800 hover:border-gold/50 rounded-lg p-2 md:p-3 flex items-center gap-3 shadow-[0_0_20px_rgba(0,0,0,0.8)] transition-all hover:scale-105 cursor-pointer" onClick={onAvatarClick}>
          <div className="w-12 h-12 md:w-16 md:h-16 rounded bg-[#0c0c12] border flex items-center justify-center text-2xl md:text-3xl shadow-inner relative overflow-hidden" style={{ borderColor: p.color }}>
            <div className="absolute inset-0 opacity-20" style={{ backgroundColor: p.color }} />
            <span style={{ color: p.color, textShadow: `0 0 15px ${p.color}` }} className="relative z-10">{p.icon}</span>
            {p.statPoints > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse border-2 border-black z-20" />}
          </div>
          <div className="flex flex-col pr-2">
            <span className="text-white font-serif font-bold text-sm md:text-lg tracking-wider" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
              {sect?.name || 'Đại Hiệp'}
            </span>
            <span className="text-gold text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] mt-0.5 opacity-80">
              [Thông Tin]
            </span>
          </div>
        </div>

        {/* Game Info ? Button */}
        <button 
          onClick={() => setShowHelp(true)}
          className="w-10 h-10 md:w-12 md:h-12 border border-gray-800 hover:border-gold/70 bg-black text-gold hover:text-white rounded-lg flex items-center justify-center text-xl font-bold cursor-pointer transition-all shadow-md active:scale-95 select-none"
          title="Thông Tin Cơ Chế & Chỉ Số"
        >
          ❔
        </button>
      </aside>

      {/* Equipment Display Right */}
      <aside className="fixed top-24 md:top-28 right-4 w-auto flex flex-col items-end z-[100] pointer-events-none gap-2">
        {/* Compact stats: Gold and Lives above the button */}
        <div className="flex items-center gap-2.5 bg-black/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-gold/30 shadow-[0_0_15px_rgba(212,175,55,0.15)] pointer-events-auto select-none scale-95 sm:scale-100 origin-right">
          <div className="flex items-center gap-1">
            <span className="text-yellow-500 text-xs text-shadow">💰</span>
            <span className="text-gold font-serif font-black text-xs sm:text-sm tracking-wide">
              {formatGold(gameState.gold)}
            </span>
          </div>
          <div className="w-[1px] h-3 bg-white/10" />
          <div className="flex items-center gap-1">
            <span className="text-red-500 text-xs text-shadow animate-pulse">❤️</span>
            <span className="text-red-400 font-serif font-black text-xs sm:text-sm">
              x{gameState.lives}
            </span>
          </div>
        </div>

        <button 
          onClick={() => setShowEquipment(!showEquipment)}
          className="pointer-events-auto border border-white/10 hover:border-gold bg-black/90 hover:bg-[#121216] text-[8px] md:text-[10px] text-gold hover:text-white font-sans font-black px-2 py-1.5 rounded shadow-md z-[110] active:scale-95 transition-all flex items-center gap-1"
        >
          {showEquipment ? "👁️ Ẩn Trang Bị" : "🎒 Hiện Trang Bị"}
        </button>
        
        <AnimatePresence>
          {showEquipment && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: 20 }}
              className="relative p-3.5 flex flex-col items-center rounded-xl border border-white/15 pointer-events-auto min-w-[145px] md:min-w-[165px] select-none"
              style={{
                backgroundColor: 'rgba(23, 10, 12, 0.40)', // Liquid glass with 40% opacity
                backgroundImage: `
                  radial-gradient(circle at center, rgba(30, 5, 8, 0.45) 0%, rgba(5, 1, 2, 0.9) 100%),
                  url(${equipmentBg})
                `,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundBlendMode: 'overlay',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.95), inset 0 1px 0 rgba(255,255,255,0.15)',
              }}
            >
              <p className="text-[9px] md:text-[11px] text-gray-350 font-bold mb-2 uppercase tracking-[0.2em] font-serif border-b border-white/10 pb-1 w-full text-center" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Trang Bị</p>
              <div className="grid grid-cols-2 gap-x-2.5 gap-y-2">
                <Slot type="Vũ khí" item={eq.weapon} emoji="🗡️" slotKey="weapon" />
                <Slot type="Giáp" item={eq.armor} emoji="🛡️" slotKey="armor" />
                <Slot type="Trang sức" item={eq.accessory} emoji="💍" slotKey="accessory" />
                <Slot type="Bảo vật" item={eq.special} emoji="🔮" slotKey="special" />
                <Slot type="Tọa kỵ" item={eq.horse} emoji="🐴" slotKey="horse" />
                <Slot type="Phi phong" item={eq.cloak} emoji="🧥" slotKey="cloak" />
                <Slot type="Mật ấn" item={eq.seal} emoji="🈶" slotKey="seal" />
                <Slot type="Cờ lệnh" item={eq.banner} emoji="🚩" slotKey="banner" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Equipment Description Card Panel */}
        <AnimatePresence>
          {showEquipment && selectedSelectedDescCard(selectedGear)}
        </AnimatePresence>
      </aside>

      {/* Stats Help Modal Dialog */}
      <AnimatePresence>
        {showHelp && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowHelp(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 pointer-events-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0b0b10] border border-gold/40 rounded-xl max-w-lg w-full p-6 text-left shadow-2xl overflow-y-auto max-h-[85vh]"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
                <h3 className="font-serif italic font-bold text-2xl text-gold">Cơ Chế & Chỉ Số Tuyệt Học</h3>
                <button 
                  onClick={() => setShowHelp(false)}
                  className="text-gray-400 hover:text-white text-2xl font-bold cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-4 font-serif text-sm text-gray-300">
                <p className="text-gray-400 italic text-xs mb-3">Thông qua ngũ hành sinh khắc và tu luyện tâm pháp, các thuộc tính võ học của Đại Hiệp tăng lên tương ứng:</p>
                
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-start gap-3 bg-white/5 p-2 rounded">
                    <span className="text-xl">💪🏻</span>
                    <div>
                      <p className="text-gold font-bold">Sức Mạnh (STR) &rarr; 🗡️ Sát Thương</p>
                      <p className="text-xs text-gray-400">Tăng mạnh sức công kích cơ bản và lực sát thương vật lý của chưởng pháp.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white/5 p-2 rounded">
                    <span className="text-xl">🐎</span>
                    <div>
                      <p className="text-gold font-bold">Thân Pháp (AGI) &rarr; ⏳ Tốc Độ & Hồi Chiêu</p>
                      <p className="text-xs text-gray-400">Tăng tốc độ di chuyển cơ bản và tỉ lệ xuất kích chí mạng (Crit Chance +0.5% mỗi điểm AGI).</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white/5 p-2 rounded">
                    <span className="text-xl">🩸</span>
                    <div>
                      <p className="text-gold font-bold">Sinh Khí (CON) &rarr; 🩸 Máu & Hồi HP</p>
                      <p className="text-xs text-gray-400">Cường hóa HP cực đại (+20 HP mỗi điểm CON) và tốc độ tự động khôi phục sinh khí hằng giây.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white/5 p-2 rounded">
                    <span className="text-xl">🧠</span>
                    <div>
                      <p className="text-gold font-bold">Nội Công (INT) &rarr; 🔮 Sức Mạnh Chưởng Lực</p>
                      <p className="text-xs text-gray-400">Gia cường thêm sát thương bạo kích phép thuật cộng thẳng vào chiêu thức tầm rộng.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white/5 p-2 rounded">
                    <span className="text-xl">🌀</span>
                    <div>
                      <p className="text-gold font-bold">Nội Lực (NEI) &rarr; 🌀 MP & Hồi MP</p>
                      <p className="text-xs text-gray-400">Tăng dự trữ chân khí (MP cực đại) và khôi phục mp dồn nội lực hằng giây để cast Tuyệt Học liên tục.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white/5 p-2 rounded">
                    <span className="text-xl">🧥</span>
                    <div>
                      <p className="text-gold font-bold">Phi Phong (Cloak) &rarr; 💥 Sát Sương Chí Mạng</p>
                      <p className="text-xs text-gray-400">Kích hoạt thần trang cho phép thi triển đòn đánh bạo phát sát thương cực đại.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white/5 p-2 rounded">
                    <span className="text-xl">🈶</span>
                    <div>
                      <p className="text-gold font-bold">Mật Ấn (Seal) &rarr; 🌀 Đại Phạm Vi Tuyệt Kỹ</p>
                      <p className="text-xs text-gray-400">Mở rộng diện tích bùng nổ của các đạo chưởng lực giúp quét sạch binh lính nhanh hơn.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white/5 p-2 rounded">
                    <span className="text-xl">🚩</span>
                    <div>
                      <p className="text-gold font-bold">Cờ Lệnh (Banner) &rarr; 🚩 Trận Pháp Hào Quang</p>
                      <p className="text-xs text-gray-400">Hiển thị hào quang tôn phái xoay quanh chủ tướng, gây sát thương liên tục lên mọi yêu binh lân cận.</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 text-center text-xs text-gold font-serif">
                  Chúc Đại Hiệp Sớm Đạt Cảnh Giới Chí Tôn Thiên Hạ!
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  function selectedSelectedDescCard(selected: typeof selectedGear) {
    if (!selected) return null;

    const { type, item, emoji, slotKey } = selected;
    const rarityColor = item ? RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS] : undefined;
    const itemVisual = slotKey === 'weapon' ? volamWeaponsImg : slotKey === 'armor' ? volamArmorImg : equipmentBg;

    return (
      <motion.div 
        initial={{ opacity: 0, x: -20, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: -20, scale: 0.95 }}
        className="fixed top-24 sm:top-28 left-4 right-4 sm:right-auto w-auto sm:w-[285px] rounded-xl p-4 border border-white/15 shadow-[0_12px_42px_rgba(0,0,0,0.95)] pointer-events-auto flex flex-col items-stretch text-left font-serif z-50 text-xs text-gray-300 max-h-[42vh] sm:max-h-none overflow-y-auto"
        style={{
          backgroundColor: 'rgba(23, 10, 12, 0.40)', // Liquid glass styled at 40% opacity
          backgroundImage: `
            radial-gradient(circle at center, rgba(30, 5, 8, 0.45) 0%, rgba(5, 1, 2, 0.92) 100%),
            url(${itemVisual})
          `,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'overlay',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.95), inset 0 1px 0 rgba(255,255,255,0.15)',
        }}
      >
        <div className="flex justify-between items-start border-b border-white/5 pb-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl p-1 bg-white/[0.03] rounded border border-white/5">{emoji}</span>
            <div>
              <p className="font-bold text-sm tracking-wide" style={{ color: rarityColor || '#888', textShadow: rarityColor ? `0 0 5px ${rarityColor}40` : '' }}>
                {item ? item.name : 'Vô Danh Pháp Bảo'}
              </p>
              <p className="text-[9px] text-yellow-400 font-sans uppercase font-black tracking-widest">{type}</p>
            </div>
          </div>
          <button 
            onClick={() => setSelectedGear(null)}
            className="text-gray-500 hover:text-white text-lg font-bold cursor-pointer transition-colors p-1"
          >
            &times;
          </button>
        </div>

        {item && (
          <div className="relative w-full h-24 rounded-lg overflow-hidden border border-amber-500/20 mb-2 bg-[#09090e] shadow-inner group">
            <img 
              src={itemVisual} 
              className="w-full h-full object-cover object-center scale-102 group-hover:scale-108 transition-transform duration-500" 
              alt={item.name} 
              referrerPolicy="no-referrer"
            />
            {/* Elegant corner lighting */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0e0c12]/90 via-[#0e0c12]/10 to-[#0e0c12]/50 pointer-events-none" />
            <div className="absolute inset-[-3px] border rounded-lg pointer-events-none transition-colors duration-300" style={{ borderColor: `${rarityColor}50` }} />
            <div className="absolute bottom-1.5 left-2 flex items-center gap-1 z-10">
              <span className="text-[8.5px] uppercase font-bold tracking-wider font-sans bg-black/60 border rounded px-1.5 py-0.5" style={{ color: rarityColor, borderColor: `${rarityColor}40` }}>
                {getRarityName(item.rarity).split(' (')[0]}
              </span>
            </div>
          </div>
        )}

        {item ? (
          <div className="space-y-2">
            <p className="text-[10px] text-gray-450 uppercase tracking-widest font-bold font-sans">
              Phẩm Cấp: <span style={{ color: rarityColor }}>{getRarityName(item.rarity)}</span>
            </p>
            <p className="text-[10px] text-gray-450 uppercase tracking-widest font-bold font-sans">
              Thời Đại / Cấp Độ: <span className="text-amber-400 font-bold font-serif">{getTierName(item.tier)}</span>
            </p>
            <p className="text-[10px] text-gray-450 uppercase tracking-widest font-bold font-sans">
              Trị Số Uy Lực: <span className="text-gold font-serif text-xs">{item.power.toFixed(1)}</span>
            </p>

            <div className="bg-white/5 p-2.5 rounded border border-white/5 text-gray-300 italic mt-2">
              <p className="text-yellow-500 font-bold mb-1 uppercase text-[9px] tracking-wide font-sans">✨ Hiệu Quả Cơ Bản</p>
              {slotKey === 'weapon' && (
                <p>🗡 Tăng Sát Thương Công Kích dồn thêm: <span className="text-green-500 font-bold font-sans">+{(item.power * 10).toFixed(0)}%</span></p>
              )}
              {slotKey === 'armor' && (
                <p>🛡 Tăng Sinh Lực Tối Đa vật lý: <span className="text-green-500 font-bold font-sans">+{(item.power * 5).toFixed(0)}%</span></p>
              )}
              {slotKey === 'accessory' && (
                <p>💍 Tăng Giảm Hồi Chiêu Tuyệt Học: <span className="text-green-500 font-bold font-sans">+{(item.power * 2).toFixed(0)}%</span> (Tối đa 75%).</p>
              )}
              {slotKey === 'special' && (
                <p>🔮 Tăng Phòng Thủ kháng chiêu thức: <span className="text-green-500 font-bold font-sans">+{(item.power * 10).toFixed(0)}%</span></p>
              )}
              {slotKey === 'horse' && (
                <p>🐎 Tăng Tốc Độ Chạy bản đồ: <span className="text-green-500 font-bold font-sans">+{(item.power * 4).toFixed(0)} px/s</span> và giảm CD tuyệt học <span className="text-green-500 font-bold font-sans">+{(item.power * 1).toFixed(0)}%</span>.</p>
              )}
              {slotKey === 'cloak' && (
                <p>🧥 Tăng Thêm Sát Thương Chí Mạng: <span className="text-green-500 font-bold font-sans">+{(item.power * 3).toFixed(0)}%</span> và kích hoạt Đôi Cánh Hào Quang rực rỡ sau lưng.</p>
              )}
              {slotKey === 'seal' && (
                <p>🈶 Tăng Diện Tích Vụ Nổ chưởng lực: <span className="text-green-500 font-bold font-sans">+{(item.power * 2.5).toFixed(0)} px</span>.</p>
              )}
              {slotKey === 'banner' && (
                <p>🚩 Triệu hồi Trận Pháp Hào Quang quanh bản thể gây <span className="text-green-500 font-bold font-sans">{(10 + item.power * 5).toFixed(0)} Sát Thương/s</span> và gắn linh kỳ thủ lĩnh.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="py-4 text-center text-gray-600 italic">
            Chưa thu thập được vật phẩm trong slot này. Hãy rèn luyện tiêu diệt thêm Yêu Binh hoặc Thủ Lĩnh tại các Ải để nhặt!
          </div>
        )}
      </motion.div>
    );
  }
}

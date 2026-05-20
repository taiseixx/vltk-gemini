import { useState } from 'react';
import { GameState, Equipment, Rarity } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { RARITY_COLORS, SECTS } from '../constants';

interface Props {
  gameState: GameState;
  onAvatarClick: () => void;
  onTargetTextClick: () => void;
}

export default function Sidebar({ gameState, onAvatarClick }: Props) {
  const p = gameState.player;
  const eq = p.equipment;
  const sect = SECTS.find(s => s.color === p.color);

  const [selectedGear, setSelectedGear] = useState<{ type: string; item: Equipment | null; emoji: string; slotKey: string } | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const handleSlotClick = (type: string, item: Equipment | null, emoji: string, slotKey: string) => {
    if (selectedGear && selectedGear.slotKey === slotKey) {
      setSelectedGear(null);
    } else {
      setSelectedGear({ type, item, emoji, slotKey });
    }
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
      <div 
        onClick={() => handleSlotClick(type, item, emoji, slotKey)}
        className={`flex flex-col items-center group cursor-pointer pointer-events-auto transition-all ${isSelected ? 'scale-110 mb-1' : 'hover:scale-105'}`}
      >
        <div className={`w-11 h-11 md:w-13 md:h-13 bg-gray-900 rounded-lg flex flex-col items-center justify-center relative transition-all border ${isSelected ? 'border-gold shadow-[0_0_15px_rgba(212,175,55,0.6)]' : 'border-gray-800 hover:border-gray-600'}`}>
          {item ? (
            <>
              <div className="absolute inset-[-2px] rounded-[inherit] overflow-hidden opacity-80 group-hover:opacity-100 transition-opacity z-0 pointer-events-none">
                <div className="absolute inset-[-50%] w-[200%] h-[200%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin-normal"
                     style={{ background: `conic-gradient(from 0deg, transparent 0%, ${rarityColor} 40%, white 48%, transparent 50%, transparent 50%, ${rarityColor} 90%, white 98%, transparent 100%)` }} />
              </div>
              <div className="absolute inset-[2px] rounded bg-gray-900 z-10 pointer-events-none"
                   style={{ boxShadow: `inset 0 0 10px ${rarityColor}40` }} />
              
              {/* Tier Level Display Badge */}
              <div className="absolute top-0 right-1 text-[8.5px] md:text-[10px] font-black font-serif z-30 select-none scale-90"
                   style={{ color: rarityColor, textShadow: `0 0 4px ${rarityColor}` }}>
                {item.tier === 3 ? '三' : item.tier === 2 ? '二' : '一'}
              </div>
            </>
          ) : (
            <div className="absolute inset-0 border border-gray-800 rounded z-0 pointer-events-none" />
          )}
          <span className="text-xl md:text-2xl z-20 drop-shadow-md relative" style={{ filter: item ? '' : 'grayscale(100%) opacity(40%)', textShadow: item ? `0 0 8px ${rarityColor}` : undefined }}>
            {emoji}
          </span>
        </div>
        <span className="text-[7.5px] md:text-[9px] text-gray-500 mt-0.5 uppercase tracking-wider font-bold group-hover:text-gold transition-colors z-20 truncate w-12 text-center">
          {type}
        </span>
      </div>
    );
  };

  return (
    <>
      {/* Target Info */}
      <aside className="fixed top-24 md:top-28 left-4 w-auto flex flex-col items-start z-40 pointer-events-none gap-4">
        <div className="bg-red-950/40 backdrop-blur border border-red-900/50 rounded-lg p-3 text-center min-w-[124px] pointer-events-auto shadow-lg shadow-black/50">
          <p className="text-[8px] md:text-[10px] text-red-500 font-bold mb-1 uppercase tracking-widest text-left">Mục Tiêu</p>
          <div className="text-xs md:text-sm font-serif font-bold text-red-400 text-left">
            {p.target ? (
              <p className="truncate drop-shadow-sm">{p.target.isBoss ? '👑 ' : p.target.isSubBoss ? '⚡ ' : ''}{p.target.name || 'Quái Vật'}</p>
            ) : (
              <p className="text-gray-600 italic text-[10px] md:text-xs">Phạm vi vắng lặng...</p>
            )}
          </div>
          {p.target && (
             <div className="w-full h-1 bg-red-950 rounded-full mt-2 overflow-hidden">
               <div className="h-full bg-red-500 transition-all" style={{ width: `${(p.target.hp / p.target.maxHp) * 100}%` }} />
             </div>
          )}
        </div>
      </aside>

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
          className="w-10 h-10 md:w-12 md:h-12 border border-gray-800 hover:border-gold/70 bg-black text-gold hover:text-white rounded-lg flex items-center justify-center text-xl font-bold cursor-pointer transition-all shadow-md active:scale-95"
          title="Thông Tin Cơ Chế & Chỉ Số"
        >
          ❔
        </button>
      </aside>

      {/* Equipment Display Right */}
      <aside className="fixed top-24 md:top-28 right-4 w-auto flex flex-col items-end z-40 pointer-events-none gap-4">
        <div className="bg-black/85 backdrop-blur-md border border-white/10 rounded-lg p-3 flex flex-col items-center shadow-lg pointer-events-auto min-w-[130px] md:min-w-[150px]">
          <p className="text-[9px] md:text-[11px] text-gray-400 font-bold mb-2 uppercase tracking-[0.2em] font-serif border-b border-white/5 pb-1 w-full text-center">Trang Bị</p>
          <div className="grid grid-cols-2 gap-x-2.5 gap-y-2">
            <Slot type="Vũ khí" item={eq.weapon} emoji="🗡️" slotKey="weapon" />
            <Slot type="Giáp" item={eq.armor} emoji="🛡️" slotKey="armor" />
            <Slot type="Trang sức" item={eq.accessory} emoji="💍" slotKey="accessory" />
            <Slot type="Bảo vật" item={eq.special} emoji="🔮" slotKey="special" />
            <Slot type="Tọa kỵ" item={eq.horse} emoji="🐴" slotKey="horse" />
            <Slot type="Phi phong" item={eq.cloak} emoji="🧥" slotKey="cloak" />
            <Slot type="Mật ấn" item={eq.seal} emoji="🔏" slotKey="seal" />
            <Slot type="Cờ lệnh" item={eq.banner} emoji="🚩" slotKey="banner" />
          </div>
        </div>

        {/* Dynamic Equipment Description Card Panel */}
        <AnimatePresence>
          {selectedSelectedDescCard(selectedGear)}
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
                    <span className="text-xl">🪽</span>
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

    return (
      <motion.div 
        initial={{ opacity: 0, x: 50, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 50, scale: 0.95 }}
        className="w-64 bg-[#0a0a0f]/95 backdrop-blur-md border border-gray-800 rounded-lg p-4 shadow-xl pointer-events-auto flex flex-col items-stretch text-left font-serif z-50 text-xs text-gray-300"
      >
        <div className="flex justify-between items-start border-b border-white/5 pb-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{emoji}</span>
            <div>
              <p className="font-bold text-sm" style={{ color: rarityColor || '#888' }}>
                {item ? item.name : 'Vô Danh Pháp Bảo'}
              </p>
              <p className="text-[9px] text-gray-500 uppercase tracking-wider">{type}</p>
            </div>
          </div>
          <button 
            onClick={() => setSelectedGear(null)}
            className="text-gray-500 hover:text-white text-base font-bold cursor-pointer"
          >
            &times;
          </button>
        </div>

        {item ? (
          <div className="space-y-2">
            <p className="text-[10px] text-gray-450 uppercase tracking-widest font-bold font-sans">
              Phẩm Cấp: <span style={{ color: rarityColor }}>{getRarityName(item.rarity)}</span>
            </p>
            <p className="text-[10px] text-gray-450 uppercase tracking-widest font-bold font-sans">
              Thời Đại / Cấp Độ: <span className="text-amber-400 font-bold font-serif">{item.tier === 3 ? 'Tam Đại Di Ma (三)' : item.tier === 2 ? 'Nhị Đại Thần Linh (二)' : 'Nhất Đại Phàm Nhân (一)'}</span>
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
                <p>🪽 Tăng Thêm Sát Thương Chí Mạng: <span className="text-green-500 font-bold font-sans">+{(item.power * 3).toFixed(0)}%</span> và kích hoạt Đôi Cánh Hào Quang rực rỡ sau lưng.</p>
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

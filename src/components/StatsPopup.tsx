import { Dispatch, SetStateAction } from 'react';
import { GameState } from '../types';
import { motion } from 'motion/react';
import { Plus, Zap } from 'lucide-react';
import { SECTS } from '../constants';
import { getItemCostMultiplier, formatGoldValue } from '../utils/economy';

interface Props {
  gameState: GameState;
  setGameState: Dispatch<SetStateAction<GameState | null>>;
  onClose: () => void;
  activeTab: 'stats' | 'skills' | 'companion';
  setActiveTab: (t: 'stats' | 'skills' | 'companion') => void;
}

export function getSectElement(sectId: string): { name: string; emoji: string; color: string; description: string } {
  const elements: Record<string, { name: string; emoji: string; color: string; description: string }> = {
    sl: { name: 'Thổ (Thiếu Lâm Thần Công)', emoji: '🪨', color: '#e67e22', description: 'Hệ Thổ: Sát thương phản đòn phản phách cương trực.' },
    vd: { name: 'Thổ (Thái Cực Kiếm)', emoji: '🪨', color: '#3498db', description: 'Hệ Thổ: Khí lực dồi dào, lấy nhu khắc cương hoàn mỹ.' },
    cb: { name: 'Mộc (Hàng Long Chưởng)', emoji: '🪵', color: '#27ae60', description: 'Hệ Mộc: Sát thương quật cường, chưởng lực cuồn cuộn.' },
    nm: { name: 'Thủy (Phật Phổ Độ)', emoji: '💧', color: '#e91e63', description: 'Hệ Thủy: Tịnh hóa tâm khí, trị liệu hồi HP vượt trội.' },
    cl: { name: 'Kim (Lôi Điện Thần Kiếm)', emoji: '⚡', color: '#f39c12', description: 'Hệ Kim: Chưởng lôi dữ dội, lôi động cửu tiêu thần công.' },
    nd: { name: 'Mộc (Vạn Độc)', emoji: '🦂', color: '#9b59b6', description: 'Hệ Mộc: Độc sát kéo dài ăn mòn thể phách sinh cơ.' },
    tm: { name: 'Mộc (Ám Khí)', emoji: '🎯', color: '#8a2be2', description: 'Hệ Mộc: Thân pháp biến hóa quỷ mị phi dao tốc độ.' },
    ty: { name: 'Thủy (Hàn Băng)', emoji: '❄️', color: '#00bcd4', description: 'Hệ Thủy: Băng tuyết chậm chạp đóng băng linh hồn.' },
    tv: { name: 'Kim (Kim Cang Thể)', emoji: '⚔️', color: '#f44336', description: 'Hệ Kim: Sát thương ngoại công kinh hồn trảm phách bạt mạng.' },
    tn: { name: 'Hỏa (Ma Diệm Liệt Hỏa)', emoji: '🔥', color: '#d35400', description: 'Hệ Hỏa: Thiêu rụi trời đất dồn liên công bạo phát bộc phát.' },
  };
  return elements[sectId] || { name: 'Vô Hệ', emoji: '🌀', color: '#95a5a6', description: 'Nội lực cuồn cuộn dung hợp ngũ hành kỳ vĩ.' };
}

export default function StatsPopup({ gameState, setGameState, onClose, activeTab, setActiveTab }: Props) {
  const p = gameState.player;
  const sect = SECTS.find(s => s.color === p.color);
  const elementInfo = sect ? getSectElement(sect.id) : null;
  const priceMultiplier = getItemCostMultiplier(gameState.stage);

  const upgradeCompanionEquip = (slot: 'weapon' | 'armor') => {
    if (!gameState.companion) return;
    const item = gameState.companion.equipment[slot];
    if (!item) return;
    
    const cost = Math.floor(150 * Math.pow(1.2, item.upgradeLvl || 0) * priceMultiplier);
    if (gameState.gold < cost) return;

    setGameState(prev => {
      if (!prev || !prev.companion) return null;
      const gold = prev.gold - cost;
      const comp = { ...prev.companion };
      const eq = { ...comp.equipment };
      const subItem = { ...eq[slot]! };
      
      subItem.upgradeLvl = (subItem.upgradeLvl || 0) + 1;
      eq[slot] = subItem;
      comp.equipment = eq;

      // recalculate companion stats based on new equip level
      if (slot === 'weapon') {
        comp.atk = 15 + comp.level * 4 + subItem.upgradeLvl * 20;
      } else {
        comp.maxHp = 150 + comp.level * 25 + subItem.upgradeLvl * 250;
        comp.hp = comp.maxHp;
      }

      return {
        ...prev,
        gold,
        companion: comp
      };
    });
  };

  const addStat = (st: keyof typeof p.baseStats, pts: number = 1) => {
    if (p.statPoints < pts) pts = p.statPoints;
    if (pts <= 0) return;
    
    setGameState(prev => {
      if (!prev) return null;
      const newBase = { ...prev.player.baseStats, [st]: prev.player.baseStats[st] + pts };
      
      // Recalc current stats and dependant values
      const buffs = prev.buffs;
      const newMaxHp = Math.floor((300 + newBase.con * 20) * buffs.hpMult);
      const newAtk = Math.floor((25 + newBase.str * 3) * buffs.dmgMult);
      
      return {
        ...prev,
        player: { 
          ...prev.player, 
          statPoints: prev.player.statPoints - pts, 
          baseStats: newBase,
          currentStats: { ...newBase }, // Simple copy for now
          maxHp: newMaxHp,
          atk: newAtk
        }
      };
    });
  };

  const upgradeSkill = (idx: number) => {
    if (p.skillPoints <= 0) return;
    setGameState(prev => {
      if (!prev) return null;
      const newSkills = [...prev.skills];
      if (idx < 0 || idx >= newSkills.length) return prev;
      if (newSkills[idx].level >= newSkills[idx].maxLevel) return prev;
      newSkills[idx].level++;
      return {
        ...prev,
        player: { ...prev.player, skillPoints: prev.player.skillPoints - 1 },
        skills: newSkills
      };
    });
  };

  const StatRow = ({ label, value, stKey, emoji, bonusText }: { label: string; value: number; stKey?: keyof typeof p.baseStats; emoji: string; bonusText: string }) => (
    <div className="flex flex-col py-2 border-b border-zinc-800/40 group font-serif">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-base select-none">{emoji}</span>
          <span className="text-zinc-300 text-xs font-bold">{label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-yellow-500 font-extrabold text-xs mr-1">{value}</span>
          {stKey && p.statPoints > 0 && (
            <>
              <button 
                onPointerDown={(e) => { e.stopPropagation(); addStat(stKey, 1); }}
                className="w-5 h-5 bg-green-600/80 hover:bg-green-600 text-white rounded flex items-center justify-center transition-colors pointer-events-auto cursor-pointer"
                title="+1"
              >
                <Plus className="w-3 h-3" />
              </button>
              {p.statPoints >= 10 && (
                <button 
                  onPointerDown={(e) => { e.stopPropagation(); addStat(stKey, 10); }}
                  className="px-1 h-5 bg-green-600/80 hover:bg-green-600 text-[9px] font-bold text-white rounded flex items-center justify-center transition-colors pointer-events-auto cursor-pointer"
                  title="+10"
                >
                  +10
                </button>
              )}
            </>
          )}
        </div>
      </div>
      <span className="text-[9.2px] text-gray-500 font-sans tracking-wide leading-none mt-0.5 select-none">
        &rarr; {bonusText}
      </span>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4 bg-[radial-gradient(circle_at_center,_#1a1a24_0%,_#050508_100%)]"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-[320px] md:max-w-[340px] bg-sidebar-bg border-2 border-gold rounded-lg overflow-hidden shadow-[0_0_40px_rgba(212,175,55,0.25)] flex flex-col"
      >
        <div className="flex border-b border-white/5 bg-black/40">
          <button 
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-[0.2em] transition-all cursor-pointer ${activeTab === 'stats' ? 'text-gold bg-gold/5 border-b border-gold' : 'text-gray-600 hover:text-gray-400'}`}
          >
            Chỉ Số
          </button>
          <button 
            onClick={() => setActiveTab('skills')}
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-[0.2em] transition-all cursor-pointer ${activeTab === 'skills' ? 'text-gold bg-gold/5 border-b border-gold' : 'text-gray-600 hover:text-gray-400'}`}
          >
            Tuyệt Học
          </button>
          <button 
            onClick={() => setActiveTab('companion')}
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-[0.2em] transition-all cursor-pointer ${activeTab === 'companion' ? 'text-gold bg-gold/5 border-b border-gold' : 'text-gray-600 hover:text-gray-400'}`}
          >
            Đồng Hành
          </button>
        </div>

        <div className="p-4 md:p-5 max-h-[65vh] overflow-y-auto custom-scrollbar">
          {activeTab === 'stats' ? (
            <div className="space-y-4">
              {elementInfo && (
                <div className="bg-white/[0.02] border border-white/5 rounded-lg p-2.5 flex items-center gap-3 shadow-inner">
                  <span className="text-2xl select-none filter drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]">
                    {elementInfo.emoji}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-white text-[10.5px] font-black uppercase tracking-wider font-serif">
                      Ngũ Hành: <span style={{ color: elementInfo.color }}>{elementInfo.name}</span>
                    </span>
                    <span className="text-gray-400 text-[9.5px] italic leading-tight font-sans mt-0.5">
                      {elementInfo.description}
                    </span>
                  </div>
                </div>
              )}

              {p.statPoints > 0 && (
                <div className="bg-gold/5 border border-gold/20 rounded p-2.5 text-center">
                  <p className="text-gold text-[10.5px] font-bold flex items-center justify-center gap-1.5 uppercase tracking-widest leading-none">
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    Điểm Tiềm Năng: {p.statPoints}
                  </p>
                </div>
              )}

              {/* Bug 12: Disabled 4-slot redundant equipment layout as agreed */}

              <div className="space-y-0.5">
                <StatRow label="Sức Mạnh (STR)" value={p.baseStats.str} stKey="str" emoji="💪🏻" bonusText="Tăng công kích sát thương vật lý cơ bản (+3 công kích / điểm)" />
                <StatRow label="Thân Pháp (AGI)" value={p.baseStats.agi} stKey="agi" emoji="🐎" bonusText="Tăng tốc chạy, tỉ lệ ra đòn chí mạng (+0.5% chí mạng / điểm)" />
                <StatRow label="Sinh Khí (CON)" value={p.baseStats.con} stKey="con" emoji="🩸" bonusText="Cường hóa lượng sinh khí HP cực đại dồi dào (+20 HP / điểm)" />
                <StatRow label="Nội Công (INT)" value={p.baseStats.int} stKey="int" emoji="🧠" bonusText="Gia cường sát thương thần chưởng pháp chưởng pháp thuật (+5 sát thương / điểm)" />
                <StatRow label="Nội Lực (NEI)" value={p.baseStats.nei} stKey="nei" emoji="🌀" bonusText="Gia tăng tối đa MP tiềm khí hồi chân khí nội tạng dồn tấp tốc" />
              </div>

              <div className="pt-3 border-t border-white/5 space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest font-sans">
                  <span className="text-gray-500">Lực Tay (ATK)</span>
                  <span className="text-red-500 font-serif font-bold text-xs">{p.atk}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest font-sans">
                  <span className="text-gray-500">Máu Tối Đa (HP)</span>
                  <span className="text-green-500 font-serif font-bold text-xs">{p.maxHp}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest font-sans">
                  <span className="text-gray-500">Nội Lực (MP)</span>
                  <span className="text-blue-500 font-serif font-bold text-xs">{p.maxMp}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest font-sans">
                  <span className="text-gray-500">Tỉ Lệ Chí Mạng</span>
                  <span className="text-purple-400 font-serif font-bold text-xs">{(10 + p.currentStats.agi * 0.5 + (gameState.buffs.critChanceBonus || 0) * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest font-sans">
                  <span className="text-gray-500">Sát Thương Chí Mạng</span>
                  <span className="text-purple-400 font-serif font-bold text-xs">{((gameState.buffs.critDmgMult || 1.5) * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest font-sans">
                  <span className="text-gray-500">Tốc Độ Hồi HP</span>
                  <span className="text-green-400 font-serif font-bold text-xs">+{(p.currentStats.con * 0.15 + 0.4 + (gameState.buffs.hpRegenBonus || 0)).toFixed(1)}/s</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest font-sans">
                  <span className="text-gray-500">Tốc Độ Hồi MP</span>
                  <span className="text-blue-400 font-serif font-bold text-xs">+{(p.currentStats.nei * 0.35 + 0.6 + (gameState.buffs.mpRegenBonus || 0)).toFixed(1)}/s</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest font-sans">
                  <span className="text-gray-500">Sát Thương Tuyệt Học</span>
                  <span className="text-yellow-500 font-serif font-bold text-xs">+{p.currentStats.int * 5}</span>
                </div>
              </div>

              <div className="bg-black/35 border border-white/5 rounded p-3">
                <p className="text-[9px] text-gray-500 font-bold mb-1.5 uppercase tracking-[0.2em] font-sans">Cơ Duyên Hiện Tại</p>
                <div className="space-y-1 text-[10px] text-gold/75 italic font-serif">
                  {gameState.buffs.dmgMult > 1 && <p>+ Tăng sát thương: {Math.floor(gameState.buffs.dmgMult * 100 - 100)}%</p>}
                  {gameState.buffs.hpMult > 1 && <p>+ Tăng sinh lực tối đa: {Math.floor(gameState.buffs.hpMult * 100 - 100)}%</p>}
                  {(gameState.buffs.resMult || 1) > 1 && <p>+ Kháng sát thương: {Math.floor((gameState.buffs.resMult - 1) * 100)}%</p>}
                  {gameState.buffs.cdReduc > 0 && <p>+ Giảm thời gian hồi chiêu: {Math.floor(gameState.buffs.cdReduc * 100)}% / 75%</p>}
                  {(gameState.buffs.lifeSteal || 0) > 0 && <p>+ Hút máu sinh mệnh: {Math.floor((gameState.buffs.lifeSteal || 0) * 100)}%</p>}
                  {(!gameState.buffs.dmgMult && !gameState.buffs.hpMult && !gameState.buffs.cdReduc) && <p className="text-gray-600">Chưa tìm thấy cơ duyên tăng chí...</p>}
                </div>
              </div>
            </div>
          ) : activeTab === 'skills' ? (
            <div className="space-y-3.5">
              {p.skillPoints > 0 && (
                <div className="bg-blue-950/20 border border-blue-900/30 rounded p-2.5 text-center">
                  <p className="text-blue-400 text-[10.5px] font-bold uppercase tracking-widest leading-none">✨ Điểm Tuyệt Học: {p.skillPoints}</p>
                </div>
              )}
              
              {gameState.skills.map((sk, idx) => {
                const reqLevel = [1, 1, 1, 15, 25, 30][idx];
                const isLvlLocked = p.level < reqLevel;
                const skillEmojis = ['👊', '🗡️', '💥', '🌀', '🌩️', '🐉'];
                const damage = Math.floor((sk.baseDamage + sk.level * 20 + p.currentStats.int * 5) * gameState.buffs.dmgMult);
                const nextDamage = sk.level < sk.maxLevel ? Math.floor((sk.baseDamage + (sk.level + 1) * 20 + p.currentStats.int * 5) * gameState.buffs.dmgMult) : null;
                const canUpgrade = p.skillPoints > 0 && sk.level < sk.maxLevel && !isLvlLocked;
                
                return (
                  <div key={sk.name} className="bg-black/40 border border-white/5 rounded p-3.5 space-y-2.5 hover:border-gold/30 transition-colors group flex items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{isLvlLocked ? '🔒' : skillEmojis[idx] || '👊'}</span>
                        <h4 className="font-serif italic font-bold text-base group-hover:text-gold transition-colors" style={{ color: isLvlLocked ? '#555' : sk.color }}>
                          {sk.name}
                        </h4>
                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest ml-auto">
                          {isLvlLocked ? 'Chưa mở' : `Cấp ${sk.level} / ${sk.maxLevel}`}
                        </span>
                      </div>
                      
                      {isLvlLocked ? (
                        <p className="text-[10px] text-red-500/85 font-serif font-medium">Yêu cầu đại hiệp đạt cấp {reqLevel} mới có thể tu luyện tuyệt kỹ này.</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[9px] uppercase font-bold tracking-normal text-gray-400 font-sans">
                          <p>Sát thương: <span className="text-gray-200 font-serif font-bold">{damage}</span>
                            {nextDamage && <span className="text-green-400 ml-1">(&rarr; {nextDamage})</span>}
                          </p>
                          <p>Tiêu hao: <span className="text-gray-200 font-serif font-bold">{sk.manaCost} MP</span></p>
                          <p>Hồi chiêu: <span className="text-gray-200 font-serif font-bold">{(sk.cooldown * (1 - gameState.buffs.cdReduc)).toFixed(1)}s</span></p>
                          <p>Tầm đánh: <span className="text-gray-200 font-serif font-bold">{sk.range}</span></p>
                        </div>
                      )}
                    </div>
                    
                    {!isLvlLocked && sk.level < sk.maxLevel && (
                      <button
                        onClick={() => upgradeSkill(idx)}
                        disabled={!canUpgrade}
                        className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider font-serif transition-all border flex-shrink-0
                          ${canUpgrade 
                            ? 'bg-yellow-500 hover:bg-yellow-400 text-black border-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.25)] hover:scale-105 active:scale-95 cursor-pointer' 
                            : 'bg-zinc-950 text-gray-600 border-zinc-800 cursor-not-allowed opacity-50'}`}
                      >
                        + Thăng Cấp
                      </button>
                    )}
                    {sk.level >= sk.maxLevel && (
                      <span className="text-[9px] text-yellow-500 font-black tracking-widest uppercase border border-yellow-500/30 px-2 py-1 bg-yellow-500/10 rounded flex-shrink-0">Tối Đa</span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Centered large Avatar and title */}
              <div className="text-center space-y-1.5 p-3.5 bg-black/40 rounded-lg border border-gold/20 select-none">
                <span className="text-5xl block animate-bounce" style={{ filter: 'drop-shadow(0 0 12px rgba(212,175,55,0.5))' }}>
                  {gameState.companion?.emoji || "🐯"}
                </span>
                <h4 className="text-gold font-serif italic text-lg font-black tracking-wide">
                  {gameState.companion?.name || "Cổ Linh Thú"}
                </h4>
                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest font-sans">
                  Tuyệt Hảo Linh Thú &bull; Đồng Hành
                </p>
              </div>

              {/* Stat rows for companion */}
              <div className="bg-black/30 p-3 rounded border border-white/5 space-y-2.5 font-serif text-xs">
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-gray-400">Đẳng Cấp</span>
                  <span className="text-yellow-400 font-bold">Cấp {gameState.companion?.level || 1}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-gray-400">Kinh Nghiệm</span>
                  <span className="text-blue-400">{(gameState.companion?.exp || 0).toFixed(0)} / {120 * (gameState.companion?.level || 1)}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-gray-400">Linh Lực Sinh Khí (HP)</span>
                  <span className="text-lime-400">{150 + (gameState.companion?.level || 1) * 25 + (gameState.companion?.equipment.armor?.upgradeLvl || 0) * 50} HP</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-gray-400">Linh Lực Công Kích (ATK)</span>
                  <span className="text-red-500">{15 + (gameState.companion?.level || 1) * 4 + (gameState.companion?.equipment.weapon?.upgradeLvl || 0) * 5} ATK</span>
                </div>
              </div>

              {/* Special Abilities of companion */}
              <div className="bg-amber-950/20 p-3 rounded border border-amber-900/20 space-y-1.5 font-serif text-[10px] text-gray-300">
                <p className="text-gold uppercase font-black tracking-widest text-[9.5px] border-b border-amber-900/10 pb-0.5">🌟 Chưởng Pháp Thần Hộ</p>
                <p className="flex items-center gap-1.5"><span className="text-yellow-500">✔</span> Tự động tầm kích Chưởng Thế hỗ trợ</p>
                <p className="flex items-center gap-1.5"><span className="text-yellow-500">✔</span> Gia cường thêm <span className="text-green-400 font-bold font-sans">+15% Vàng</span> nhặt lượm</p>
                <p className="flex items-center gap-1.5"><span className="text-yellow-500">✔</span> Tăng tiến <span className="text-green-400 font-bold font-sans">+15% Kinh Nghiệm (EXP)</span> chiến đấu</p>
                <p className="flex items-center gap-1.5"><span className="text-yellow-500">✔</span> Auto thu nhặt chiến lợi phẩm cự ly rộng ({gameState.companion ? "180px" : "50px"})</p>
              </div>

              {/* Companion Equipment Slots */}
              <div className="space-y-2">
                <div className="flex justify-between items-center bg-transparent border-none p-0">
                  <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider font-sans">Cổ Linh Thần Khí</p>
                  {priceMultiplier > 1 && (
                    <span className="text-[9.5px] text-red-400 font-serif italic">
                      ⚠️ Lạm phát ải: x{priceMultiplier} giá nâng
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {/* Slot 1: Weapon */}
                  <div className="bg-black/40 p-2.5 rounded border border-white/5 flex items-center justify-between font-serif text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🐾⚔️</span>
                      <div>
                        <p className="text-white font-bold">{gameState.companion?.equipment.weapon?.name || "Linh Quy Ngoại Trảo"}</p>
                        <p className="text-[10px] text-gray-500 font-sans">Cấp {gameState.companion?.equipment.weapon?.upgradeLvl || 0} (ATK +{(gameState.companion?.equipment.weapon?.upgradeLvl || 0) * 5})</p>
                      </div>
                    </div>
                    <div>
                      <button 
                        onClick={() => upgradeCompanionEquip('weapon')}
                        disabled={gameState.gold < Math.floor(150 * Math.pow(1.6, gameState.companion?.equipment.weapon?.upgradeLvl || 0) * priceMultiplier)}
                        className="px-2.5 py-1 text-[10px] font-sans font-black tracking-wide border border-gold text-gold hover:bg-gold hover:text-black rounded transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gold pointer-events-auto cursor-pointer"
                      >
                        Nâng (+{formatGoldValue(Math.floor(150 * Math.pow(1.6, gameState.companion?.equipment.weapon?.upgradeLvl || 0) * priceMultiplier))})
                      </button>
                    </div>
                  </div>

                  {/* Slot 2: Armor */}
                  <div className="bg-black/40 p-2.5 rounded border border-white/5 flex items-center justify-between font-serif text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🐾🛡️</span>
                      <div>
                        <p className="text-white font-bold">{gameState.companion?.equipment.armor?.name || "Chiến Thú Kháp Giáp"}</p>
                        <p className="text-[10px] text-gray-500 font-sans">Cấp {gameState.companion?.equipment.armor?.upgradeLvl || 0} (HP +{(gameState.companion?.equipment.armor?.upgradeLvl || 0) * 50})</p>
                      </div>
                    </div>
                    <div>
                      <button 
                        onClick={() => upgradeCompanionEquip('armor')}
                        disabled={gameState.gold < Math.floor(150 * Math.pow(1.6, gameState.companion?.equipment.armor?.upgradeLvl || 0) * priceMultiplier)}
                        className="px-2.5 py-1 text-[10px] font-sans font-black tracking-wide border border-gold text-gold hover:bg-gold hover:text-black rounded transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gold pointer-events-auto cursor-pointer"
                      >
                        Nâng (+{formatGoldValue(Math.floor(150 * Math.pow(1.6, gameState.companion?.equipment.armor?.upgradeLvl || 0) * priceMultiplier))})
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/5 bg-black/40">
          <button 
            onClick={onClose}
            className="w-full py-3 border border-gold text-gold font-serif text-base hover:bg-gold hover:text-black transition-all active:scale-95 cursor-pointer"
          >
            QUAY LẠI
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

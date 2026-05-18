import { Dispatch, SetStateAction } from 'react';
import { GameState } from '../types';
import { motion } from 'motion/react';
import { X, Plus, Zap, Shield, Heart, Target, Gem, Sword, Star } from 'lucide-react';
import { RARITY_COLORS } from '../constants';

interface Props {
  gameState: GameState;
  setGameState: Dispatch<SetStateAction<GameState | null>>;
  onClose: () => void;
  activeTab: 'stats' | 'skills';
  setActiveTab: (t: 'stats' | 'skills') => void;
}

export default function StatsPopup({ gameState, setGameState, onClose, activeTab, setActiveTab }: Props) {
  const p = gameState.player;

  const addStat = (st: keyof typeof p.baseStats) => {
    if (p.statPoints <= 0) return;
    setGameState(prev => {
      if (!prev) return null;
      const newBase = { ...prev.player.baseStats, [st]: prev.player.baseStats[st] + 1 };
      
      // Recalc current stats and dependant values
      const buffs = prev.buffs;
      const newMaxHp = Math.floor((100 + newBase.con * 20) * buffs.hpMult);
      const newAtk = Math.floor((10 + newBase.str * 3) * buffs.dmgMult);
      
      return {
        ...prev,
        player: { 
          ...prev.player, 
          statPoints: prev.player.statPoints - 1, 
          baseStats: newBase,
          currentStats: { ...newBase }, // Simple copy for now
          maxHp: newMaxHp,
          atk: newAtk
        }
      };
    });
  };

  const StatRow = ({ label, value, stKey, icon: Icon }: { label: string; value: number; stKey?: keyof typeof p.baseStats; icon: any }) => (
    <div className="flex justify-between items-center py-2 border-b border-zinc-800/50 group">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-zinc-500" />
        <span className="text-zinc-400 text-xs">{label}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-yellow-500 font-bold">{value}</span>
        {stKey && p.statPoints > 0 && (
          <button 
            onPointerDown={(e) => { e.stopPropagation(); addStat(stKey); }}
            className="w-6 h-6 bg-green-600/80 hover:bg-green-600 text-white rounded flex items-center justify-center transition-colors pointer-events-auto"
          >
            <Plus className="w-3 h-3" />
          </button>
        )}
      </div>
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
        className="w-full max-w-md bg-sidebar-bg border-2 border-gold rounded-lg overflow-hidden shadow-[0_0_50px_rgba(212,175,55,0.2)] flex flex-col"
      >
        <div className="flex border-b border-white/5 bg-black/40">
          <button 
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-5 text-xs font-bold uppercase tracking-[0.2em] transition-all ${activeTab === 'stats' ? 'text-gold bg-gold/5' : 'text-gray-600 hover:text-gray-400'}`}
          >
            Chỉ Số
          </button>
          <button 
            onClick={() => setActiveTab('skills')}
            className={`flex-1 py-5 text-xs font-bold uppercase tracking-[0.2em] transition-all ${activeTab === 'skills' ? 'text-gold bg-gold/5' : 'text-gray-600 hover:text-gray-400'}`}
          >
            Tuyệt Học
          </button>
        </div>

        <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {activeTab === 'stats' ? (
            <div className="space-y-6">
              {p.statPoints > 0 && (
                <div className="bg-gold/5 border border-gold/20 rounded p-4 text-center mb-6">
                  <p className="text-gold text-xs font-bold flex items-center justify-center gap-2 uppercase tracking-widest">
                    <Zap className="w-4 h-4 fill-current" />
                    Điểm Tiềm Năng: {p.statPoints}
                  </p>
                </div>
              )}

              {/* Equipment (Moved from Sidebar) */}
              <div className="grid grid-cols-4 gap-3 bg-black/40 border border-white/5 rounded p-4 items-center justify-center">
                <div className="flex flex-col items-center group cursor-help" title={p.equipment.weapon ? `Vũ khí: ${p.equipment.weapon.name}` : undefined}>
                   <div className="w-12 h-12 bg-gray-900 rounded flex flex-col items-center justify-center relative transition-colors">
                      {p.equipment.weapon ? (
                        <>
                          <div className="absolute inset-[-2px] rounded-[inherit] overflow-hidden opacity-80 group-hover:opacity-100 transition-opacity z-0 pointer-events-none">
                            <div className="absolute inset-[-50%] w-[200%] h-[200%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin-normal"
                                 style={{ background: `conic-gradient(from 0deg, transparent 0%, ${RARITY_COLORS[p.equipment.weapon.rarity as keyof typeof RARITY_COLORS]} 40%, white 48%, transparent 50%, transparent 50%, ${RARITY_COLORS[p.equipment.weapon.rarity as keyof typeof RARITY_COLORS]} 90%, white 98%, transparent 100%)` }} />
                          </div>
                          <div className="absolute inset-[2px] rounded bg-gray-900 z-10 pointer-events-none"
                               style={{ boxShadow: `inset 0 0 10px ${RARITY_COLORS[p.equipment.weapon.rarity as keyof typeof RARITY_COLORS]}40` }} />
                        </>
                      ) : (
                        <div className="absolute inset-0 border border-gray-800 rounded z-0 pointer-events-none" />
                      )}
                      <span className="text-xl z-20 drop-shadow-md relative" style={{ filter: p.equipment.weapon ? '' : 'grayscale(100%) opacity(50%)', textShadow: p.equipment.weapon ? `0 0 8px ${RARITY_COLORS[p.equipment.weapon.rarity as keyof typeof RARITY_COLORS]}` : undefined }}>
                        🗡️
                      </span>
                   </div>
                   <span className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest font-bold group-hover:text-gold transition-colors z-20">VK</span>
                </div>
                <div className="flex flex-col items-center group cursor-help" title={p.equipment.armor ? `Giáp: ${p.equipment.armor.name}` : undefined}>
                   <div className="w-12 h-12 bg-gray-900 rounded flex flex-col items-center justify-center relative transition-colors">
                      {p.equipment.armor ? (
                        <>
                          <div className="absolute inset-[-2px] rounded-[inherit] overflow-hidden opacity-80 group-hover:opacity-100 transition-opacity z-0 pointer-events-none">
                            <div className="absolute inset-[-50%] w-[200%] h-[200%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin-normal"
                                 style={{ background: `conic-gradient(from 0deg, transparent 0%, ${RARITY_COLORS[p.equipment.armor.rarity as keyof typeof RARITY_COLORS]} 40%, white 48%, transparent 50%, transparent 50%, ${RARITY_COLORS[p.equipment.armor.rarity as keyof typeof RARITY_COLORS]} 90%, white 98%, transparent 100%)` }} />
                          </div>
                          <div className="absolute inset-[2px] rounded bg-gray-900 z-10 pointer-events-none"
                               style={{ boxShadow: `inset 0 0 10px ${RARITY_COLORS[p.equipment.armor.rarity as keyof typeof RARITY_COLORS]}40` }} />
                        </>
                      ) : (
                        <div className="absolute inset-0 border border-gray-800 rounded z-0 pointer-events-none" />
                      )}
                      <span className="text-xl z-20 drop-shadow-md relative" style={{ filter: p.equipment.armor ? '' : 'grayscale(100%) opacity(50%)', textShadow: p.equipment.armor ? `0 0 8px ${RARITY_COLORS[p.equipment.armor.rarity as keyof typeof RARITY_COLORS]}` : undefined }}>
                        🛡️
                      </span>
                   </div>
                   <span className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest font-bold group-hover:text-gold transition-colors z-20">GIÁP</span>
                </div>
                <div className="flex flex-col items-center group cursor-help" title={p.equipment.accessory ? `Phụ kiện: ${p.equipment.accessory.name}` : undefined}>
                   <div className="w-12 h-12 bg-gray-900 rounded flex flex-col items-center justify-center relative transition-colors">
                      {p.equipment.accessory ? (
                        <>
                          <div className="absolute inset-[-2px] rounded-[inherit] overflow-hidden opacity-80 group-hover:opacity-100 transition-opacity z-0 pointer-events-none">
                            <div className="absolute inset-[-50%] w-[200%] h-[200%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin-normal"
                                 style={{ background: `conic-gradient(from 0deg, transparent 0%, ${RARITY_COLORS[p.equipment.accessory.rarity as keyof typeof RARITY_COLORS]} 40%, white 48%, transparent 50%, transparent 50%, ${RARITY_COLORS[p.equipment.accessory.rarity as keyof typeof RARITY_COLORS]} 90%, white 98%, transparent 100%)` }} />
                          </div>
                          <div className="absolute inset-[2px] rounded bg-gray-900 z-10 pointer-events-none"
                               style={{ boxShadow: `inset 0 0 10px ${RARITY_COLORS[p.equipment.accessory.rarity as keyof typeof RARITY_COLORS]}40` }} />
                        </>
                      ) : (
                        <div className="absolute inset-0 border border-gray-800 rounded z-0 pointer-events-none" />
                      )}
                      <span className="text-xl z-20 drop-shadow-md relative" style={{ filter: p.equipment.accessory ? '' : 'grayscale(100%) opacity(50%)', textShadow: p.equipment.accessory ? `0 0 8px ${RARITY_COLORS[p.equipment.accessory.rarity as keyof typeof RARITY_COLORS]}` : undefined }}>
                        💍
                      </span>
                   </div>
                   <span className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest font-bold group-hover:text-gold transition-colors z-20">PK</span>
                </div>
                <div className="flex flex-col items-center group cursor-help" title={p.equipment.special ? `Bảo vật: ${p.equipment.special.name}` : undefined}>
                   <div className="w-12 h-12 bg-gray-900 rounded flex flex-col items-center justify-center relative transition-colors">
                      {p.equipment.special ? (
                        <>
                          <div className="absolute inset-[-2px] rounded-[inherit] overflow-hidden opacity-80 group-hover:opacity-100 transition-opacity z-0 pointer-events-none">
                            <div className="absolute inset-[-50%] w-[200%] h-[200%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin-normal"
                                 style={{ background: `conic-gradient(from 0deg, transparent 0%, ${RARITY_COLORS[p.equipment.special.rarity as keyof typeof RARITY_COLORS]} 40%, white 48%, transparent 50%, transparent 50%, ${RARITY_COLORS[p.equipment.special.rarity as keyof typeof RARITY_COLORS]} 90%, white 98%, transparent 100%)` }} />
                          </div>
                          <div className="absolute inset-[2px] rounded bg-gray-900 z-10 pointer-events-none"
                               style={{ boxShadow: `inset 0 0 10px ${RARITY_COLORS[p.equipment.special.rarity as keyof typeof RARITY_COLORS]}40` }} />
                        </>
                      ) : (
                        <div className="absolute inset-0 border border-gray-800 rounded z-0 pointer-events-none" />
                      )}
                      <span className="text-xl z-20 drop-shadow-md relative" style={{ filter: p.equipment.special ? '' : 'grayscale(100%) opacity(50%)', textShadow: p.equipment.special ? `0 0 8px ${RARITY_COLORS[p.equipment.special.rarity as keyof typeof RARITY_COLORS]}` : undefined }}>
                        🔮
                      </span>
                   </div>
                   <span className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest font-bold group-hover:text-gold transition-colors z-20">BV</span>
                </div>
              </div>

              <div className="space-y-1 mt-4">
                <StatRow label="Sức Mạnh" value={p.baseStats.str} stKey="str" icon={Sword} />
                <StatRow label="Thân Pháp" value={p.baseStats.agi} stKey="agi" icon={Zap} />
                <StatRow label="Sinh Khí" value={p.baseStats.con} stKey="con" icon={Heart} />
                <StatRow label="Nội Công" value={p.baseStats.int} stKey="int" icon={Target} />
                <StatRow label="Nội Lực" value={p.baseStats.nei} stKey="nei" icon={Gem} />
              </div>

              <div className="mt-8 pt-8 border-t border-white/5 space-y-3">
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest">
                  <span className="text-gray-600">Lực Tay (ATK)</span>
                  <span className="text-red-500">{p.atk}</span>
                </div>
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest">
                  <span className="text-gray-600">Máu Tối Đa</span>
                  <span className="text-red-500">{p.maxHp}</span>
                </div>
              </div>

              <div className="mt-6 bg-black/40 border border-white/5 rounded p-4">
                <p className="text-[10px] text-gray-600 font-bold mb-3 uppercase tracking-[0.2em]">Cơ Duyên Hiện Tại</p>
                <div className="space-y-1.5 text-[11px] text-gold/80 italic font-serif">
                  {gameState.buffs.dmgMult > 1 && <p>+ Tăng sát thương: {Math.floor(gameState.buffs.dmgMult * 100 - 100)}%</p>}
                  {gameState.buffs.hpMult > 1 && <p>+ Tăng sinh lực: {Math.floor(gameState.buffs.hpMult * 100 - 100)}%</p>}
                  {gameState.buffs.cdReduc > 0 && <p>+ Giảm hồi chiêu: {Math.floor(gameState.buffs.cdReduc * 100)}%</p>}
                  {(!gameState.buffs.dmgMult && !gameState.buffs.hpMult && !gameState.buffs.cdReduc) && <p className="text-gray-700">Chưa có cơ duyên...</p>}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {p.skillPoints > 0 && (
                <div className="bg-blue-950/20 border border-blue-900/30 rounded p-4 text-center mb-6">
                  <p className="text-blue-400 text-xs font-bold uppercase tracking-widest">✨ Điểm Tuyệt Học: {p.skillPoints}</p>
                </div>
              )}
              
              {gameState.skills.map(sk => {
                const damage = Math.floor((sk.baseDamage + sk.level * 20 + p.currentStats.int * 5) * gameState.buffs.dmgMult);
                const nextDamage = sk.level < sk.maxLevel ? Math.floor((sk.baseDamage + (sk.level + 1) * 20 + p.currentStats.int * 5) * gameState.buffs.dmgMult) : null;
                return (
                  <div key={sk.name} className="bg-black/40 border border-white/5 rounded p-5 space-y-3 hover:border-gold/30 transition-colors group">
                    <div className="flex justify-between items-center">
                      <h4 className="font-serif italic font-bold text-lg group-hover:text-gold transition-colors" style={{ color: sk.color }}>{sk.name}</h4>
                      <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Cấp {sk.level} / {sk.maxLevel}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[10px] uppercase font-bold tracking-tighter text-gray-500">
                      <p>Sát thương: <span className="text-gray-300">{damage}</span>
                        {nextDamage && <span className="text-green-500 ml-1">(&rarr; {nextDamage})</span>}
                      </p>
                      <p>Tiêu hao: <span className="text-gray-300">{sk.manaCost} MP</span></p>
                      <p>Hồi chiêu: <span className="text-gray-300">{(sk.cooldown * (1 - gameState.buffs.cdReduc)).toFixed(1)}s</span></p>
                      <p>Tầm đánh: <span className="text-gray-300">{sk.range}</span></p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/5 bg-black/40">
          <button 
            onClick={onClose}
            className="w-full py-4 border border-gold text-gold font-serif text-lg hover:bg-gold hover:text-black transition-all active:scale-95"
          >
            QUAY LẠI
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

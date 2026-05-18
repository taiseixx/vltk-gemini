import { GameState } from '../types';
import { motion } from 'motion/react';
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

  const Slot = ({ type, item, emoji }: { type: string; item: any; emoji: string }) => {
    const rarityColor = item ? RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS] : undefined;
    return (
      <div 
        className="flex flex-col items-center group cursor-help pointer-events-auto" 
        title={item ? `${type}: ${item.name}` : undefined}
      >
        <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-900 rounded flex flex-col items-center justify-center relative transition-colors">
          {item ? (
            <>
              <div className="absolute inset-[-2px] rounded-[inherit] overflow-hidden opacity-80 group-hover:opacity-100 transition-opacity z-0 pointer-events-none">
                <div className="absolute inset-[-50%] w-[200%] h-[200%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin-normal"
                     style={{ background: `conic-gradient(from 0deg, transparent 0%, ${rarityColor} 40%, white 48%, transparent 50%, transparent 50%, ${rarityColor} 90%, white 98%, transparent 100%)` }} />
              </div>
              <div className="absolute inset-[2px] rounded bg-gray-900 z-10 pointer-events-none"
                   style={{ boxShadow: `inset 0 0 10px ${rarityColor}40` }} />
            </>
          ) : (
            <div className="absolute inset-0 border border-gray-800 rounded z-0 pointer-events-none" />
          )}
          <span className="text-lg md:text-xl z-20 drop-shadow-md relative" style={{ filter: item ? '' : 'grayscale(100%) opacity(50%)', textShadow: item ? `0 0 8px ${rarityColor}` : undefined }}>
            {emoji}
          </span>
        </div>
        <span className="text-[8px] md:text-[10px] text-gray-500 mt-1 uppercase tracking-widest font-bold group-hover:text-gold transition-colors z-20">
          {type === 'Vũ khí' ? 'VK' : type === 'Giáp' ? 'GIÁP' : type === 'Phụ kiện' ? 'PK' : 'BV'}
        </span>
      </div>
    );
  };

  return (
    <>
      <aside className="fixed top-24 md:top-28 left-4 w-auto flex flex-col items-start z-40 pointer-events-none gap-4">
        {/* Target Info */}
        <div className="bg-red-950/40 backdrop-blur border border-red-900/50 rounded-lg p-3 text-center min-w-[120px] pointer-events-auto shadow-lg shadow-black/50">
          <p className="text-[8px] md:text-[10px] text-red-500 font-bold mb-1 uppercase tracking-widest text-left">Mục Tiêu</p>
          <div className="text-xs md:text-sm font-serif font-bold text-red-400 text-left">
            {p.target ? (
              <p className="truncate drop-shadow-sm">{p.target.isBoss ? '👑 ' : ''}{p.target.name || 'Quái Vật'}</p>
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

      {/* Sect Avatar / Character Info */}
      <aside className="fixed bottom-24 md:bottom-[7.5rem] left-4 z-40 pointer-events-auto cursor-pointer group" onClick={onAvatarClick}>
        <div className="bg-black/90 backdrop-blur-md border border-gray-800 hover:border-gold/50 rounded-lg p-2 md:p-3 flex items-center gap-3 shadow-[0_0_20px_rgba(0,0,0,0.8)] transition-all hover:scale-105">
          <div className="w-12 h-12 md:w-16 md:h-16 rounded bg-[#0c0c12] border flex items-center justify-center text-2xl md:text-3xl shadow-inner relative overflow-hidden" style={{ borderColor: p.color }}>
            <div className="absolute inset-0 opacity-20" style={{ backgroundColor: p.color }} />
            <span style={{ color: p.color, textShadow: `0 0 15px ${p.color}` }} className="relative z-10">{p.icon}</span>
            {p.statPoints > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse border-2 border-black z-20" />}
          </div>
          <div className="flex flex-col pr-2">
            <span className="text-white font-serif font-bold text-sm md:text-lg tracking-wider" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
              {sect?.name || 'Đại Hiệp'}
            </span>
            <span className="text-gold text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] mt-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
              [Thông Tin]
            </span>
          </div>
        </div>
      </aside>

      <aside className="fixed top-[260px] md:top-[280px] right-4 w-auto flex flex-col items-end z-40 pointer-events-none gap-4">
        
        {/* External Equipment Display */}
        <div className="bg-black/40 backdrop-blur border border-white/10 rounded-lg p-3 flex flex-col items-center shadow-lg pointer-events-auto">
          <p className="text-[8px] md:text-[10px] text-gray-400 font-bold mb-2 uppercase tracking-widest">Trang Bị</p>
          <div className="grid grid-cols-2 gap-2">
            <Slot type="Vũ khí" item={eq.weapon} emoji="🗡️" />
            <Slot type="Giáp" item={eq.armor} emoji="🛡️" />
            <Slot type="Phụ kiện" item={eq.accessory} emoji="💍" />
            <Slot type="Bảo vật" item={eq.special} emoji="🔮" />
          </div>
        </div>
      </aside>
    </>
  );
}

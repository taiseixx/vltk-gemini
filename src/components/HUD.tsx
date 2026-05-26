import { useState } from 'react';
import { Volume2, VolumeX, Music } from 'lucide-react';
import { GameState } from '../types';
import { SECTS } from '../constants';
import { sfx } from '../utils/audio';

interface Props {
  gameState: GameState;
  onAvatarClick: () => void;
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

const formatValue = (val: number): string => {
  if (val >= 10000000) {
    return Math.floor(val / 1000000) + 'M';
  }
  if (val >= 10000) {
    return Math.floor(val / 1000) + 'K';
  }
  return Math.floor(val).toString();
};

export default function HUD({ gameState, onAvatarClick }: Props) {
  const [isMuted, setMuted] = useState(sfx.isMuted());
  const [isBgmMuted, setBgmMuted] = useState(sfx.isBgmMuted());
  const p = gameState.player;
  const sect = SECTS.find(s => s.color === p.color);
  const maxExp = Math.floor(100 * Math.pow(1.2, p.level - 1));

  return (
    <header className="fixed top-0 left-0 right-0 md:h-24 py-2 md:py-0 w-full flex flex-wrap md:flex-nowrap items-center justify-between px-2 md:px-8 bg-gradient-to-b from-black via-black/85 to-transparent z-50 pointer-events-none gap-y-2 md:gap-y-0">
      {/* Character Info */}
      <div className="flex flex-col gap-0.5 pointer-events-auto w-[50%] md:w-[260px] md:min-w-[260px]">
        <div className="flex items-center justify-between gap-1.5 mb-px flex-nowrap">
          <span className="text-gold font-serif font-bold text-xs md:text-base drop-shadow-lg leading-none">
            Cấp: {p.level}
          </span>
          {/* Bug 7: Active Count/Boss Status on same row as level */}
          <span className="text-[7.5px] sm:text-[9px] md:text-xs text-amber-400 font-extrabold font-serif px-1.5 py-0.5 bg-black/50 rounded border border-white/10 select-none animate-pulse leading-none">
            {gameState.stagePhase === 'FINAL_BOSS' 
              ? '👑👹 TRÙM CUỐI' 
              : gameState.stagePhase === 'SUB_BOSSES'
              ? '⚡💀 HỘ PHÁP'
              : `⚔️ ${gameState.mobsTotal - gameState.mobsKilled} CÒN LẠI`}
          </span>
        </div>
        
        {/* HP Bar - Liquid Glass Style */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <span className="text-red-400 font-bold text-[8.5px] md:text-[10px] w-5 sm:w-6 text-shadow">HP</span>
          <div className="flex-1 h-1.5 sm:h-2 md:h-2.5 bg-white/[0.04] backdrop-blur-[4px] border border-white/10 rounded-full overflow-hidden relative shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]">
            <div 
              className="h-full bg-red-600/80 transition-all duration-300 relative shadow-[0_0_8px_rgba(239,68,68,0.4)]"
              style={{ width: `${(p.hp / p.maxHp) * 100}%` }}
            >
              <div className="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
            </div>
          </div>
          <span className="text-white font-bold text-[8.5px] md:text-[10px] w-11 sm:w-12 text-right">
            {formatValue(p.hp)}/{formatValue(p.maxHp)}
          </span>
        </div>

        {/* MP Bar - Liquid Glass Style */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <span className="text-blue-400 font-bold text-[8.5px] md:text-[10px] w-5 sm:w-6 text-shadow">MP</span>
          <div className="flex-1 h-1.5 sm:h-2 md:h-2.5 bg-white/[0.04] backdrop-blur-[4px] border border-white/10 rounded-full overflow-hidden relative shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]">
            <div 
              className="h-full bg-blue-500/80 transition-all duration-300 relative shadow-[0_0_8px_rgba(59,130,246,0.4)]"
              style={{ width: `${(p.mp / p.maxMp) * 100}%` }}
            >
              <div className="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
            </div>
          </div>
          <span className="text-white font-bold text-[8.5px] md:text-[10px] w-11 sm:w-12 text-right">
            {formatValue(p.mp)}/{formatValue(p.maxMp)}
          </span>
        </div>

        {/* EXP Bar - Liquid Glass Style */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <span className="text-amber-400 font-bold text-[8.5px] md:text-[10px] w-5 sm:w-6 text-shadow">EXP</span>
          <div className="flex-1 h-1.5 sm:h-2 md:h-2.5 bg-white/[0.04] backdrop-blur-[4px] border border-white/10 rounded-full overflow-hidden relative shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]">
            <div 
              className="h-full bg-yellow-500/80 transition-all duration-300 relative shadow-[0_0_8px_rgba(234,179,8,0.4)]"
              style={{ width: `${(gameState.exp / maxExp) * 100}%` }}
            >
              <div className="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
            </div>
          </div>
          <span className="text-white font-bold text-[8.5px] md:text-[10px] w-11 sm:w-12 text-right">
            {formatValue(gameState.exp)}/{formatValue(maxExp)}
          </span>
        </div>

        {/* Rage / Nộ Bar - Liquid Glass Style */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <span className="text-orange-400 font-bold text-[8.5px] md:text-[10px] w-5 sm:w-6 text-shadow">NỘ</span>
          <div className="flex-1 h-1.5 sm:h-2 md:h-2.5 bg-white/[0.04] backdrop-blur-[4px] border border-white/10 rounded-full overflow-hidden relative shadow-[inset_0_1px_2px_rgba(255,255,255,0.05),_0_0_8px_rgba(230,126,34,0.1)]">
            <div 
              className={`h-full transition-all duration-300 relative ${p.rageActive ? 'bg-gradient-to-r from-red-500/85 via-orange-500/85 to-yellow-500/85 animate-pulse' : 'bg-orange-600/80'}`}
              style={{ 
                width: `${((p.rage || 0) / (p.maxRage || 100)) * 100}%`,
                boxShadow: p.rageActive ? '0 0 10px #ff5500' : 'none'
              }}
            >
              <div className="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
            </div>
            {p.rageActive && (
              <span className="absolute inset-0 flex items-center justify-center text-[6.5px] sm:text-[8px] md:text-[9px] text-white font-extrabold tracking-widest uppercase animate-pulse drop-shadow-[0_1px_1px_rgba(0,0,0,1)] z-10">
                💥 BỘC PHÁT!
              </span>
            )}
          </div>
          <span className="text-orange-400 font-bold text-[8.5px] md:text-[10px] w-11 sm:w-12 text-right">
            {Math.floor(p.rage || 0)}/100
          </span>
        </div>

        {/* Compact Target Frame - Positioned beautifully below the Nộ bar */}
        <div className="mt-1 flex items-center justify-between gap-1.5 px-2 py-1 bg-red-950/20 backdrop-blur-[2px] border border-red-900/45 rounded-md min-h-[22px] transition-all duration-200">
          <span className="text-[7.5px] md:text-[8px] font-black tracking-widest text-red-500 uppercase flex-shrink-0">MỤC TIÊU:</span>
          <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
            {p.target ? (
              <>
                <span className="text-[9.5px] font-serif font-black text-red-400 truncate flex-1 block">
                  {p.target.isBoss ? '👑 ' : p.target.isSubBoss ? '⚡ ' : ''}
                  {p.target.name || 'Quái Vật'}
                </span>
                <div className="w-14 sm:w-16 h-1 bg-red-950 rounded-full overflow-hidden flex-shrink-0 border border-red-900/30">
                  <div className="h-full bg-red-500 transition-all duration-150" style={{ width: `${(p.target.hp / p.target.maxHp) * 100}%` }} />
                </div>
              </>
            ) : (
              <span className="text-[8.5px] text-gray-500 italic truncate flex-1 block">
                Phạm vi vắng lặng...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bug 15: Stage Progress Center (Visible on all devices) */}
      <div className="flex flex-col items-center justify-center pointer-events-auto select-none mx-auto order-first md:order-none w-full md:w-auto text-center py-1 md:py-0">
        <h2 className="text-shimmer-gold font-serif uppercase tracking-[0.2em] text-sm md:text-xl font-extrabold drop-shadow-[0_0_12px_rgba(212,175,55,0.6)]">
          Ải {gameState.stage}
        </h2>
        <span className="text-[10px] md:text-xs text-gray-300 font-bold uppercase tracking-widest font-serif mt-0.5">
          {gameState.stagePhase === 'SUB_BOSSES' 
            ? '⚡ Thủ Hộ Pháp Điện ⚡' 
            : gameState.stagePhase === 'FINAL_BOSS' 
            ? '👑 Trấn Diệt Thủ Lĩnh 👑' 
            : '⚔️ Trúc Lâm Kiếm Ảnh ⚔️'}
        </span>
        
        {/* Step dots for Desktop visual rhythm */}
        <div className="hidden md:flex gap-1.5 mt-1.5">
          {Array.from({ length: 5 }).map((_, i) => {
            const step = Math.floor(gameState.mobsTotal / 5);
            const active = gameState.mobsKilled > i * step;
            return (
              <div 
                key={i} 
                className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${active ? 'bg-gold shadow-[0_0_5px_rgba(212,175,55,1)]' : 'bg-gray-700'}`} 
              />
            );
          })}
        </div>
      </div>

      {/* Sound Controller and Symmetrizing spacer */}
      <div className="flex items-center justify-end gap-2.5 w-[44%] md:w-[260px] pointer-events-auto">
        {/* BGM Toggle button */}
        <button
          onClick={() => {
            const isNowBgmMuted = sfx.toggleBgmMute();
            setBgmMuted(isNowBgmMuted);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/15 bg-black/50 hover:bg-black/70 hover:border-gold/60 text-gray-200 hover:text-gold transition-all duration-200 cursor-pointer shadow-lg text-[10px] md:text-xs font-serif font-bold tracking-wider"
          title={isBgmMuted ? "Bật nhạc nền Kiếm Hiệp Tình" : "Tắt nhạc BGM"}
        >
          <Music className={`w-3.5 h-3.5 ${isBgmMuted ? 'text-gray-500' : 'text-gold animate-spin'} [animation-duration:8s]`} />
          <span className={isBgmMuted ? "text-gray-500 line-through" : "text-amber-300 font-bold"}>Kiếm Hiệp Tình</span>
        </button>

        {/* SFX Toggle button */}
        <button
          onClick={() => {
            const isNowMuted = sfx.toggleMute();
            setMuted(isNowMuted);
          }}
          className="flex items-center justify-center p-2 rounded-full border border-white/10 bg-black/40 hover:bg-black/60 hover:border-gold/50 text-gray-300 hover:text-gold transition-all duration-200 cursor-pointer shadow-md"
          title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
          ) : (
            <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 animate-pulse" />
          )}
        </button>
      </div>
    </header>
  );
}

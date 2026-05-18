import { GameState } from '../types';
import { SECTS } from '../constants';

interface Props {
  gameState: GameState;
  onAvatarClick: () => void;
}

export default function HUD({ gameState, onAvatarClick }: Props) {
  const p = gameState.player;
  const sect = SECTS.find(s => s.color === p.color);
  const maxExp = Math.floor(100 * Math.pow(1.2, p.level - 1));

  return (
    <header className="fixed top-0 left-0 right-0 md:h-24 py-2 md:py-0 w-full flex flex-wrap md:flex-nowrap items-center justify-between px-2 md:px-8 bg-gradient-to-b from-black via-black/80 to-transparent z-50 pointer-events-none gap-y-2">
      {/* Character Info */}
      <div className="flex flex-col gap-1 pointer-events-auto min-w-[200px] md:min-w-[250px]">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-gold font-serif font-bold text-sm md:text-base drop-shadow-lg">
            Cấp: {p.level}
          </span>
        </div>
        
        {/* HP Bar */}
        <div className="flex items-center gap-2">
          <span className="text-red-500 font-bold text-[10px] md:text-xs w-6">HP</span>
          <div className="flex-1 h-3 md:h-4 bg-gray-900 border border-gray-800 rounded-full overflow-hidden relative">
            <div 
              className="h-full bg-red-600 transition-all duration-300"
              style={{ width: `${(p.hp / p.maxHp) * 100}%` }}
            />
          </div>
          <span className="text-white font-bold text-[10px] md:text-xs w-14 text-right">
            {Math.floor(p.hp)}/{Math.floor(p.maxHp)}
          </span>
        </div>

        {/* MP Bar */}
        <div className="flex items-center gap-2">
          <span className="text-blue-500 font-bold text-[10px] md:text-xs w-6">MP</span>
          <div className="flex-1 h-3 md:h-4 bg-gray-900 border border-gray-800 rounded-full overflow-hidden relative">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${(p.mp / p.maxMp) * 100}%` }}
            />
          </div>
          <span className="text-white font-bold text-[10px] md:text-xs w-14 text-right">
            {Math.floor(p.mp)}/{Math.floor(p.maxMp)}
          </span>
        </div>

        {/* EXP Bar */}
        <div className="flex items-center gap-2">
          <span className="text-gold font-bold text-[10px] md:text-xs w-6">EXP</span>
          <div className="flex-1 h-3 md:h-4 bg-gray-900 border border-gray-800 rounded-full overflow-hidden relative">
            <div 
              className="h-full bg-gold transition-all duration-300"
              style={{ width: `${(gameState.exp / maxExp) * 100}%` }}
            />
          </div>
          <span className="text-white font-bold text-[10px] md:text-xs w-14 text-right">
            {Math.floor(gameState.exp)}/{maxExp}
          </span>
        </div>
      </div>

      {/* Stage Progress Center */}
      <div className="hidden md:flex flex-col items-center">
        <h2 className="text-gold font-serif uppercase tracking-[0.2em] text-xs mb-1.5 drop-shadow-md">
          Ải {gameState.stage} — {gameState.bossSpawned ? 'Thủ Lĩnh Xuất Thế' : 'Trúc Lâm Thâm Xứ'}
        </h2>
        <div className="flex gap-1.5">
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
        <p className="text-[9px] text-gray-500 mt-1 uppercase tracking-widest font-bold">
          {gameState.mobsTotal - gameState.mobsKilled} CÒN LẠI
        </p>
      </div>

      {/* Stats Right */}
      <div className="flex items-center gap-4 md:gap-8 pointer-events-auto">
        <div className="text-right">
          <p className="text-[7px] md:text-[9px] text-gray-500 uppercase tracking-[0.2em] font-bold">Ngân Lượng</p>
          <p className="text-gold font-serif text-sm md:text-2xl drop-shadow-sm">{gameState.gold.toLocaleString()}</p>
        </div>
        <div className="h-6 md:h-10 w-[1px] bg-gray-800"></div>
        <div className="flex items-center gap-1 md:gap-2 group">
          <span className="text-red-500 text-sm md:text-xl transition-transform group-hover:scale-110">❤️</span>
          <span className="font-serif text-sm md:text-2xl group-hover:text-red-400 transition-colors">x {gameState.lives}</span>
        </div>
      </div>
      
      {/* Mobile Stage Progress */}
      <div className="w-full flex md:hidden justify-between items-center px-1 mt-1 border-t border-white/5 pt-1">
        <span className="text-[10px] text-gold font-bold font-serif uppercase tracking-wider">Ải {gameState.stage}</span>
        <span className="text-[9px] text-gray-500 font-bold">{gameState.mobsTotal - gameState.mobsKilled} CÒN LẠI</span>
      </div>
    </header>
  );
}

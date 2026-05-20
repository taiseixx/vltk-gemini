import { Dispatch, SetStateAction, useState, useEffect } from 'react';
import { GameState } from '../types';
import { motion } from 'motion/react';
import { ShoppingBag, Sparkles, TrendingUp, Zap, Skull, Coins, Gift, Heart } from 'lucide-react';
import { MAP_SIZE } from '../constants';

interface Props {
  gameState: GameState;
  setGameState: Dispatch<SetStateAction<GameState | null>>;
  addNotification: (text: string, color: string) => void;
}

interface RogueliteOption {
  name: string;
  desc: string;
  icon: any;
  effect: (gs: GameState) => GameState;
}

export default function StageClearOverlay({ gameState, setGameState, addNotification }: Props) {
  const [options, setOptions] = useState<RogueliteOption[]>([]);
  const [timeLeft, setTimeLeft] = useState(10);

  useEffect(() => {
    const pool: RogueliteOption[] = [
      { 
        name: 'Tham Lam', 
        desc: 'Tăng 30% Vàng nhận được', 
        icon: Coins,
        effect: (gs) => ({ ...gs, buffs: { ...gs.buffs, rlGold: gs.buffs.rlGold + 0.3 } })
      },
      { 
        name: 'Khổ Tu', 
        desc: 'Tăng 30% EXP nhận được', 
        icon: TrendingUp,
        effect: (gs) => ({ ...gs, buffs: { ...gs.buffs, rlExp: gs.buffs.rlExp + 0.3 } })
      },
      { 
        name: 'Sát Thủ', 
        desc: 'Hạ gục Boss ngay nếu HP dưới 15%', 
        icon: Skull,
        effect: (gs) => ({ ...gs, buffs: { ...gs.buffs, rlExec: 0.15 } })
      },
      { 
        name: 'Cuồng Bạo', 
        desc: 'Giảm 50% HP quái ải sau, x2 Vàng', 
        icon: Zap,
        effect: (gs) => ({ ...gs, buffs: { ...gs.buffs, hpMult: gs.buffs.hpMult * 0.5, rlGold: gs.buffs.rlGold + 1 } })
      },
      {
        name: 'Phúc Tinh',
        desc: 'Tăng 20% sát thương Tuyệt Học',
        icon: Sparkles,
        effect: (gs) => ({ ...gs, buffs: { ...gs.buffs, dmgMult: gs.buffs.dmgMult + 0.2 } })
      }
    ];

    const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, 3);
    setOptions(shuffled);
  }, []);

  const pickOption = (opt: RogueliteOption) => {
    setGameState(prev => {
      if (!prev) return null;
      const nextGs = opt.effect(prev);
      const nextStage = prev.stage + 1;
      
      const getBossCount = (stage: number): number => {
        if (stage < 10) return 1;
        const exp = Math.floor(stage / 10);
        return Math.pow(2, exp);
      };
      const getMobsTotal = (stage: number): number => {
        const baseMobs = 10 + stage * 2;
        const bosses = getBossCount(stage);
        return baseMobs + bosses * 24;
      };

      return {
        ...nextGs,
        state: 'PLAYING',
        stage: nextStage,
        mobsTotal: getMobsTotal(nextStage),
        mobsKilled: 0,
        bossSpawned: false,
        stagePhase: 'CREEPS',
        player: {
          ...prev.player,
          x: MAP_SIZE / 2,
          y: MAP_SIZE / 2,
          target: null,
          moving: false
        }
      };
    });
    addNotification(`Đã nhận: ${opt.name}`, '#3498db');
  };

  // 10s automatic choice timer
  useEffect(() => {
    if (options.length === 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Automatically pick the first option if time runs out
          pickOption(options[0]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [options]);

  const buyLife = () => {
    if (gameState.gold >= 500) {
      setGameState(prev => prev ? { ...prev, gold: prev.gold - 500, lives: prev.lives + 1 } : null);
      addNotification('Mua thành công 1 Mạng!', '#e74c3c');
    } else {
      addNotification('Không đủ Vàng!', '#888');
    }
  };

  const gachaWeapon = () => {
    if (gameState.gold >= 300) {
      setGameState(prev => prev ? { ...prev, gold: prev.gold - 300 } : null);
      addNotification('Gacha thành công! Hãy tìm đồ ở ải sau.', '#9b59b6');
    } else {
      addNotification('Không đủ Vàng!', '#888');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[300] flex flex-col items-center justify-center p-3 sm:p-6 bg-[radial-gradient(circle_at_center,_#1a1a24_0%,_#050508_100%)] overflow-hidden"
    >
      {/* Background Decorations */}
      <div className="absolute top-20 left-40 opacity-10 text-6xl select-none">🎋</div>
      <div className="absolute bottom-40 right-60 opacity-10 text-5xl select-none">🪨</div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold opacity-[0.02] rounded-full blur-3xl pointer-events-none" />

      <motion.h1 
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-gold font-serif text-2xl sm:text-4xl italic mb-1 sm:mb-2 tracking-wide drop-shadow-lg"
      >
        Kỳ Ngộ Giang Hồ
      </motion.h1>
      
      <motion.p 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-gray-500 text-[8px] sm:text-[10px] mb-4 sm:mb-8 uppercase tracking-[0.4em] font-bold text-center"
      >
        Chọn một cơ duyên để tiếp tục hành trình
      </motion.p>

      {/* 10s automatic choice visual banner */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-4 sm:mb-8 text-yellow-500 text-[10px] sm:text-sm font-bold tracking-wide italic flex items-center gap-1.5 border border-yellow-600/30 bg-yellow-950/10 px-3 py-1.5 rounded-full"
      >
        <span>⏳</span> Tự động chọn sau <span className="text-white bg-yellow-600 px-2 py-0.5 rounded font-mono text-xs sm:text-sm">{timeLeft}s</span>
      </motion.div>

      <div className="grid grid-cols-3 gap-1.5 sm:gap-4 md:gap-6 w-full max-w-4xl mb-6 sm:mb-12 px-1 sm:px-4">
        {options.map((opt, i) => {
          const isMiddle = i === 1;
          return (
             <motion.div
              key={opt.name}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              whileHover={{ y: -6, borderColor: '#d4af37', boxShadow: '0 0 30px rgba(212,175,55,0.1)' }}
              onClick={() => pickOption(opt)}
              className={`group flex flex-col items-center text-center p-2 sm:p-6 md:p-8 rounded-lg cursor-pointer transition-all relative
                ${isMiddle 
                  ? 'h-48 sm:h-80 md:h-[26rem] bg-[#1a1a24] border-2 border-gold shadow-[0_0_50px_rgba(212,175,55,0.2)] md:z-10' 
                  : 'h-44 sm:h-76 md:h-80 bg-[#121218] border border-gray-800 hover:border-gold md:mt-4'}`}
            >
              {isMiddle && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-black text-[7px] sm:text-[10px] px-2 sm:px-3 py-0.5 sm:py-1 font-bold uppercase tracking-tighter whitespace-nowrap">
                  Quý Hiếm
                </div>
              )}
              
              <div className={`rounded-full flex items-center justify-center border aspect-square mb-2 sm:mb-6 transition-transform group-hover:scale-110
                ${isMiddle ? 'w-10 h-10 sm:w-20 sm:h-20 bg-blue-950/30 border-blue-900/50 text-xl sm:text-4xl' : 'w-8 h-8 sm:w-16 sm:h-16 bg-gray-900/30 border-gray-800 text-lg sm:text-3xl'}`}
              >
                <opt.icon className={`${isMiddle ? 'w-5 h-5 sm:w-10 sm:h-10' : 'w-4 h-4 sm:w-8 sm:h-8'} text-blue-400`} />
              </div>

              <h3 className={`font-serif mb-1 sm:mb-4 drop-shadow-md font-bold truncate w-full ${isMiddle ? 'text-blue-400 text-xs sm:text-2xl' : 'text-gray-300 text-[10px] sm:text-xl'}`}>
                {opt.name}
              </h3>
              
              <p className={`leading-relaxed font-serif overflow-hidden text-ellipsis ${isMiddle ? 'text-[8px] sm:text-sm text-gray-400' : 'text-[7px] sm:text-xs text-gray-500'}`}>
                {opt.desc}
              </p>
              
              <div className="mt-auto hidden sm:block">
                <span className={`text-[7px] sm:text-[9px] font-bold uppercase tracking-[0.2em] ${isMiddle ? 'text-blue-500' : 'text-gray-600'}`}>
                  {isMiddle ? 'Duyên Kỳ Ngộ' : 'Bình Thường'}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="w-full max-w-2xl pt-6 md:pt-8 border-t border-white/5 flex flex-col items-center">
        <h3 className="text-gray-500 text-[10px] uppercase tracking-[0.3em] mb-4 md:mb-6 font-bold flex items-center gap-2">
          <ShoppingBag className="w-4 h-4" />
          Thương Nhân Vong Xuyên (Vàng: {gameState.gold.toLocaleString()})
        </h3>
        
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
          <button 
            onClick={buyLife}
            className="group px-8 py-3.5 border border-red-900/50 hover:border-red-500 text-red-500 hover:text-white hover:bg-red-900/20 rounded font-serif text-lg transition-all flex items-center gap-3 active:scale-95"
          >
            <Heart className="w-5 h-5 group-hover:fill-current" />
            Mua ❤️ Mạng (500)
          </button>
          <button 
            onClick={gachaWeapon}
            className="group px-8 py-3.5 border border-purple-900/50 hover:border-purple-500 text-purple-500 hover:text-white hover:bg-purple-900/20 rounded font-serif text-lg transition-all flex items-center gap-3 active:scale-95"
          >
            <Gift className="w-5 h-5 group-hover:rotate-12" />
            Gacha Vũ Khí (300)
          </button>
        </div>
      </div>
    </motion.div>
  );
}

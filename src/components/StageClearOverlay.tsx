import { Dispatch, SetStateAction, useState, useEffect } from 'react';
import { GameState } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Sparkles, TrendingUp, Zap, Skull, Coins, Gift, Heart, Loader2 } from 'lucide-react';
import { MAP_SIZE, RARITY_COLORS } from '../constants';
import { getItemCostMultiplier, formatGoldValue } from '../utils/economy';
import { generateRandomQuest } from '../utils/quest';

interface Props {
  gameState: GameState;
  setGameState: Dispatch<SetStateAction<GameState | null>>;
  addNotification: (text: string, color: string) => void;
  geminiEncounters?: any[] | null;
}

interface RogueliteOption {
  name: string;
  desc: string;
  icon: any;
  rarity?: string;
  effect: (gs: GameState) => GameState;
}

export default function StageClearOverlay({ gameState, setGameState, addNotification, geminiEncounters }: Props) {
  const [options, setOptions] = useState<RogueliteOption[]>([]);
  const [timeLeft, setTimeLeft] = useState(15);

  const priceMultiplier = getItemCostMultiplier(gameState.stage);
  const costLife = Math.floor(500 * priceMultiplier);
  const costGachaWeapon = Math.floor(300 * priceMultiplier);

  useEffect(() => {
    const pool: RogueliteOption[] = [
      { name: 'Tham Lam', desc: 'Tăng 30% Vàng nhận được', icon: Coins, effect: (gs) => ({ ...gs, buffs: { ...gs.buffs, rlGold: gs.buffs.rlGold + 0.3 } }) },
      { name: 'Khổ Tu', desc: 'Tăng 30% EXP nhận được', icon: TrendingUp, effect: (gs) => ({ ...gs, buffs: { ...gs.buffs, rlExp: gs.buffs.rlExp + 0.3 } }) },
      { name: 'Sát Thủ', desc: 'Hạ gục Boss ngay nếu HP dưới 15%', icon: Skull, effect: (gs) => ({ ...gs, buffs: { ...gs.buffs, rlExec: 0.15 } }) },
      { name: 'Cuồng Bạo', desc: 'Giảm 50% HP quái ải sau, x2 Vàng', icon: Zap, effect: (gs) => ({ ...gs, buffs: { ...gs.buffs, hpMult: gs.buffs.hpMult * 0.5, rlGold: gs.buffs.rlGold + 1 } }) },
      { name: 'Phúc Tinh', desc: 'Tăng 20% sát thương', icon: Sparkles, effect: (gs) => ({ ...gs, buffs: { ...gs.buffs, dmgMult: gs.buffs.dmgMult + 0.2 } }) }
    ];

    if (geminiEncounters && geminiEncounters.length === 3) {
      const gOpts = geminiEncounters.map(ai => {
        return {
          name: ai.name || 'Kỳ Ngộ',
          desc: ai.event_text || '',
          icon: Sparkles,
          rarity: ai.rarity?.toLowerCase() || 'normal',
          effect: (gs: GameState) => {
            let nextHp = gs.player.hp;
            let nextGold = gs.gold;
            if (ai.stat_changes) {
              if (ai.stat_changes.hp) {
                  nextHp = Math.min(gs.player.maxHp, Math.max(1, nextHp + ai.stat_changes.hp));
              }
              if (ai.stat_changes.gold) {
                  nextGold = Math.max(0, nextGold + ai.stat_changes.gold);
              }
            }
            return {
              ...gs,
              gold: nextGold,
              player: {
                ...gs.player,
                hp: nextHp
              }
            };
          }
        };
      });
      setOptions(gOpts);
    } else {
      const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, 3);
      setOptions(shuffled);
    }
  }, [geminiEncounters]);

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

      let quests = [...(nextGs.quests || [])];
      // Increment stage for active sect quests
      quests = quests.map(q => {
        if (q.status !== 'active') return q;
        if (q.type === 'sect') {
          const currentCount = Math.min(q.targetCount, q.currentCount + 1);
          const status = currentCount >= q.targetCount ? 'completed' : q.status;
          return { ...q, currentCount, status };
        }
        return q;
      });

      // Every 5 stages, generate 2 new random quests
      if (prev.stage % 5 === 0) {
        quests.push(
          generateRandomQuest('clearA', nextStage),
          generateRandomQuest('clearB', nextStage)
        );
      }

      return {
        ...nextGs,
        state: 'PLAYING',
        stage: nextStage,
        quests,
        mobsTotal: getMobsTotal(nextStage),
        mobsKilled: 0,
        bossSpawned: false,
        stagePhase: 'CREEPS',
        player: {
          ...nextGs.player,
          x: MAP_SIZE / 2,
          y: MAP_SIZE / 2,
          target: null,
          moving: false
        }
      };
    });
    addNotification(`Đã chọn: ${opt.name}`, '#3498db');
  };

  // 15s automatic choice timer
  useEffect(() => {
    if (options.length === 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [options]);

  useEffect(() => {
    if (timeLeft <= 0 && options.length > 0) {
      pickOption(options[0]);
    }
  }, [timeLeft, options]);

  const buyLife = () => {
    if (gameState.gold >= costLife) {
      setGameState(prev => prev ? { ...prev, gold: prev.gold - costLife, lives: prev.lives + 1 } : null);
      addNotification('Mua thành công 1 Mạng!', '#e74c3c');
    } else {
      addNotification('Không đủ Vàng!', '#888');
    }
  };

  const gachaWeapon = () => {
    if (gameState.gold >= costGachaWeapon) {
      setGameState(prev => prev ? { ...prev, gold: prev.gold - costGachaWeapon } : null);
      addNotification('Gacha thành công! Hãy tìm đồ ở ải sau.', '#9b59b6');
    } else {
      addNotification('Không đủ Vàng!', '#888');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 bg-black/50 backdrop-blur-md z-[300] flex flex-col items-center justify-center p-3 sm:p-6 bg-[radial-gradient(circle_at_center,_#1a1a24_0%,_#050508_100%)] overflow-hidden"
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
        Vượt Ải Thành Công
      </motion.h1>
      
      <motion.p 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-gray-400 text-[8px] sm:text-[10px] mb-4 sm:mb-8 uppercase tracking-[0.4em] font-bold text-center"
      >
        Phúc duyên vạn trượng, hãy chọn phần thưởng
      </motion.p>

      {/* 15s automatic choice visual banner */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-4 sm:mb-8 text-yellow-500 text-[10px] sm:text-sm font-bold tracking-wide italic flex items-center gap-1.5 border border-yellow-600/30 bg-yellow-950/10 px-3 py-1.5 rounded-full"
      >
        <span>⏳</span> Tự động chọn sau <span className="text-white bg-yellow-600 px-2 py-0.5 rounded font-mono text-xs sm:text-sm">{timeLeft}s</span>
      </motion.div>

      <div className="grid grid-cols-3 gap-1.5 sm:gap-4 md:gap-6 w-full max-w-5xl mb-6 sm:mb-12 px-1 sm:px-4">
        {options.map((opt, i) => {
          const isAIResp = !!geminiEncounters;
          const rColor = opt.rarity ? RARITY_COLORS[opt.rarity as keyof typeof RARITY_COLORS] || RARITY_COLORS.common || '#3498db' : RARITY_COLORS.common || '#3498db';
          
          return (
             <motion.div
              key={opt.name + i}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              whileHover={{ y: -6, borderColor: rColor, boxShadow: `0 0 30px ${rColor}33` }}
              onClick={() => pickOption(opt)}
              className={`group flex flex-col items-center text-center p-2 sm:p-6 md:p-8 rounded-lg transition-all relative cursor-pointer
                h-auto min-h-[14rem] sm:min-h-80 md:min-h-[24rem] border-2 bg-gradient-to-b md:mt-4`}
              style={{
                borderColor: `${rColor}55`,
                backgroundColor: '#121218',
                backgroundImage: `linear-gradient(to bottom, ${rColor}15, #1a1524)`,
                boxShadow: `0 0 15px ${rColor}15`
              }}
            >
              <div className="absolute inset-0 pointer-events-none rounded-lg" style={{ background: `linear-gradient(to top, transparent, ${rColor}10)` }} />
              
              {isAIResp && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-white text-[7px] sm:text-[10px] px-3 sm:px-4 py-0.5 sm:py-1 font-bold uppercase tracking-widest whitespace-nowrap rounded font-sans shadow-lg flex items-center gap-1"
                     style={{ background: `linear-gradient(to right, ${rColor}, ${rColor}88)` }}>
                  <Sparkles className="w-3 h-3"/>
                  Kỳ Ngộ {opt.rarity || 'Normal'}
                </div>
              )}
              
              <div className="rounded-full flex items-center justify-center border aspect-square mb-2 sm:mb-6 transition-transform group-hover:scale-110 relative z-10 w-10 h-10 sm:w-20 sm:h-20 text-xl sm:text-4xl"
                   style={{ backgroundColor: `${rColor}22`, borderColor: `${rColor}55`, boxShadow: `0 0 20px ${rColor}66` }}
              >
                <opt.icon className="w-5 h-5 sm:w-10 sm:h-10" style={{ color: rColor }} />
              </div>

              <h3 className="font-serif mb-1 sm:mb-4 drop-shadow-md font-bold truncate whitespace-normal w-full relative z-10 text-xs sm:text-lg md:text-xl" style={{ color: rColor }}>
                {opt.name}
              </h3>
              
              <p className="leading-relaxed font-serif overflow-hidden relative z-10 text-[9px] sm:text-xs md:text-sm drop-shadow" style={{ color: '#ddd' }}>
                {opt.desc}
              </p>
              
              <div className="mt-auto hidden sm:block relative z-10">
                <span className="text-[7px] sm:text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: rColor }}>
                  {isAIResp ? 'Thiên Cơ' : 'Bình Thường'}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="w-full max-w-2xl pt-6 md:pt-8 border-t border-white/5 flex flex-col items-center">
        <h3 className="text-gray-500 text-[10px] uppercase tracking-[0.3em] mb-2 font-bold flex items-center justify-center gap-2 flex-wrap">
          <ShoppingBag className="w-4 h-4" />
          Thương Nhân Vong Xuyên (Vàng: {gameState.gold.toLocaleString()})
        </h3>
        
        {priceMultiplier > 1 && (
          <p className="text-red-400 font-serif italic text-[11px] mb-4 text-center">
            ⚠️ Khan hiếm thời chiến (Ải {gameState.stage}): Giá cả tăng gấp <span className="text-white font-bold">x{priceMultiplier}</span> lần!
          </p>
        )}
        
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 transition-all w-full justify-center">
          <button 
            onClick={buyLife}
            className="group px-8 py-3.5 border border-red-900/50 hover:border-red-500 text-red-500 hover:text-white hover:bg-red-900/20 rounded font-serif text-lg transition-all flex items-center justify-center gap-3 active:scale-95 cursor-pointer max-sm:w-full"
          >
            <Heart className="w-5 h-5 group-hover:fill-current" />
            Mua ❤️ Mạng ({formatGoldValue(costLife)})
          </button>
          <button 
            onClick={gachaWeapon}
            className="group px-8 py-3.5 border border-amber-900/50 hover:border-amber-400 text-amber-500 hover:text-white hover:bg-amber-900/20 rounded font-serif text-lg transition-all flex items-center justify-center gap-3 active:scale-95 cursor-pointer max-sm:w-full"
          >
            <Gift className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Tầm Bảo Trang Bị ({formatGoldValue(costGachaWeapon)})
          </button>
        </div>
      </div>
    </motion.div>
  );
}

import { Dispatch, SetStateAction, useState, useEffect } from 'react';
import { GameState } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Sparkles, TrendingUp, Zap, Skull, Coins, Gift, Heart, Loader2 } from 'lucide-react';
import { MAP_SIZE, RARITY_COLORS } from '../constants';
import { getItemCostMultiplier, formatGoldValue } from '../utils/economy';

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
  isLoading?: boolean;
}

export default function StageClearOverlay({ gameState, setGameState, addNotification }: Props) {
  const [options, setOptions] = useState<RogueliteOption[]>([]);
  const [timeLeft, setTimeLeft] = useState(15);
  const [geminiLoading, setGeminiLoading] = useState(false);

  const priceMultiplier = getItemCostMultiplier(gameState.stage);
  const costLife = Math.floor(500 * priceMultiplier);
  const costGachaWeapon = Math.floor(300 * priceMultiplier);

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
        desc: 'Tăng 20% sát thương',
        icon: Sparkles,
        effect: (gs) => ({ ...gs, buffs: { ...gs.buffs, dmgMult: gs.buffs.dmgMult + 0.2 } })
      }
    ];

    const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, 2);
    
    // Add Placeholder for Gemini Encounter in the middle
    shuffled.splice(1, 0, {
      name: 'Kỳ Ngộ Giang Hồ...',
      desc: 'Đang cầu viện thiên y...',
      icon: Loader2,
      isLoading: true,
      effect: (gs) => gs
    });

    setOptions(shuffled);

    // Call Gemini API
    const fetchGeminiEncounter = async () => {
      setGeminiLoading(true);
      try {
        const payload = {
          gameState: {
            stage: gameState.stage,
            gold: gameState.gold,
            player: {
              hp: gameState.player.hp,
              maxHp: gameState.player.maxHp,
              sectId: gameState.player.sectId || 'Vô Danh'
            }
          }
        };

        const res = await fetch('/api/encounter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("API call failed");
        
        const data = await res.json();
        
        // Transform the AI response into a RogueliteOption
        setOptions(prev => {
          const newOpts = [...prev];
          newOpts[1] = {
            name: 'Thiên Cơ Kỳ Ngộ',
            desc: data.event_text || "Một thế lực thần bí giúp đỡ bạn.",
            icon: Sparkles,
            effect: (gs) => {
              let nextHp = gs.player.hp;
              let nextGold = gs.gold;

              if (data.stat_changes) {
                if (data.stat_changes.hp) {
                   nextHp = Math.min(gs.player.maxHp, Math.max(1, nextHp + data.stat_changes.hp));
                }
                if (data.stat_changes.gold) {
                   nextGold = Math.max(0, nextGold + data.stat_changes.gold);
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
          return newOpts;
        });

      } catch (err) {
        console.error("Failed to load Gemini encounter:", err);
        // Fallback if AI fails
        setOptions(prev => {
          const newOpts = [...prev];
          newOpts[1] = pool.find(p => !newOpts.map(n=>n.name).includes(p.name)) || pool[0];
          return newOpts;
        });
      } finally {
        setGeminiLoading(false);
      }
    };

    fetchGeminiEncounter();
  }, []);

  const pickOption = (opt: RogueliteOption) => {
    if (opt.isLoading) return; // Cannot pick if loading
    
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
    if (options.length === 0 || geminiLoading) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [options, geminiLoading]);

  useEffect(() => {
    if (timeLeft <= 0 && options.length > 0 && !geminiLoading) {
      const availableOpt = options.find(o => !o.isLoading) || options[0];
      pickOption(availableOpt);
    }
  }, [timeLeft, options, geminiLoading]);

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
          const isMiddle = i === 1;
          const loading = opt.isLoading;
          return (
             <motion.div
              key={opt.name + i}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              whileHover={!loading ? { y: -6, borderColor: '#d4af37', boxShadow: '0 0 30px rgba(212,175,55,0.1)' } : undefined}
              onClick={() => pickOption(opt)}
              className={`group flex flex-col items-center text-center p-2 sm:p-6 md:p-8 rounded-lg transition-all relative
                ${loading ? 'opacity-70 cursor-wait' : 'cursor-pointer'}
                ${isMiddle 
                  ? 'h-[14rem] sm:h-80 md:h-[26rem] bg-[#1a1524] border-2 border-purple-500/50 shadow-[0_0_50px_rgba(147,51,234,0.15)] md:z-10 bg-gradient-to-b from-purple-900/20 to-[#1a1524]' 
                  : 'h-44 sm:h-76 md:h-80 bg-[#121218] border border-gray-800 hover:border-gold md:mt-4'}`}
            >
              {isMiddle && !loading && (
                 <div className="absolute inset-0 bg-gradient-to-t from-transparent to-purple-500/10 pointer-events-none rounded-lg" />
              )}
              {isMiddle && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 ${loading ? 'bg-gray-600' : 'bg-gradient-to-r from-fuchsia-600 to-purple-600'} text-white text-[7px] sm:text-[10px] px-3 sm:px-4 py-0.5 sm:py-1 font-bold uppercase tracking-widest whitespace-nowrap rounded font-sans shadow-lg flex items-center gap-1`}>
                  {loading ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>}
                  {loading ? 'Đang hỏi AI...' : 'AI Kỳ Ngộ'}
                </div>
              )}
              
              <div className={`rounded-full flex items-center justify-center border aspect-square mb-2 sm:mb-6 transition-transform group-hover:scale-110 relative z-10
                ${isMiddle ? (loading ? 'bg-gray-800 border-gray-700' : 'w-10 h-10 sm:w-20 sm:h-20 bg-purple-950/40 border-purple-500/50 text-xl sm:text-4xl shadow-[0_0_20px_rgba(168,85,247,0.4)]') : 'w-8 h-8 sm:w-16 sm:h-16 bg-gray-900/30 border-gray-800 text-lg sm:text-3xl'}`}
              >
                <opt.icon className={`${isMiddle ? 'w-5 h-5 sm:w-10 sm:h-10 text-fuchsia-400' : 'w-4 h-4 sm:w-8 sm:h-8 text-blue-400'} ${loading ? 'animate-spin text-gray-500' : ''}`} />
              </div>

              <h3 className={`font-serif mb-1 sm:mb-4 drop-shadow-md font-bold truncate w-full relative z-10 ${isMiddle ? (loading ? 'text-gray-400' : 'text-fuchsia-300 text-xs sm:text-2xl') : 'text-gray-300 text-[10px] sm:text-xl'}`}>
                {opt.name}
              </h3>
              
              <p className={`leading-relaxed font-serif overflow-hidden relative z-10 ${isMiddle ? (loading ? 'text-gray-500 text-[8px] sm:text-sm' : 'text-[9px] sm:text-base text-purple-200 drop-shadow') : 'text-[7px] sm:text-xs text-gray-500'}`}>
                {opt.desc}
              </p>
              
              <div className="mt-auto hidden sm:block relative z-10">
                <span className={`text-[7px] sm:text-[9px] font-bold uppercase tracking-[0.2em] ${isMiddle ? 'text-purple-400' : 'text-gray-600'}`}>
                  {isMiddle ? 'AI Duyên Ngộ' : 'Bình Thường'}
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

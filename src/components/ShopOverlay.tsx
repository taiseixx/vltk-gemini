import React, { useState, useEffect } from 'react';
import { GameState, Rarity, EquipmentType, Equipment } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, X, Heart, Sword, Shield, Gem, Star, Package, Award, Zap, Sparkles, Trash2, ShieldCheck, Trophy, Info } from 'lucide-react';
import { RARITIES, RARITY_COLORS, EQUIPMENT_NAME_MAP } from '../constants';
import { getItemCostMultiplier, formatGoldValue } from '../utils/economy';
// @ts-ignore
import equipmentBg from '../assets/images/equipment_bg_1779367218827.png';
// @ts-ignore
import volamWeaponsImg from '../assets/images/volam_sect_weapons_1779556373416.png';
// @ts-ignore
import volamArmorImg from '../assets/images/volam_sect_armor_1779556389670.png';
// @ts-ignore
import consumablesImg from '../assets/images/vltk_consumables_potions_1779591468437.png';
// @ts-ignore
import bannerImg from '../assets/images/vltk_shop_banner_1779591447952.png';

interface Props {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState | null>>;
  onClose: () => void;
}

export default function ShopOverlay({ gameState, setGameState, onClose }: Props) {
  const [gachaResult, setGachaResult] = useState<Equipment[] | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [activeTab, setActiveTab] = useState<'gacha' | 'items' | 'consumables'>('gacha');
  
  const [streakCount, setStreakCount] = useState<number>(0);
  const [streakExpiry, setStreakExpiry] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    let interval = -1;
    if (streakExpiry > Date.now()) {
      interval = window.setInterval(() => {
        const now = Date.now();
        if (now > streakExpiry) {
           setStreakCount(0);
           setTimeRemaining(0);
           clearInterval(interval);
        } else {
           setTimeRemaining(streakExpiry - now);
        }
      }, 50);
    } else {
      setStreakCount(0);
      setTimeRemaining(0);
    }
    return () => clearInterval(interval);
  }, [streakExpiry]);

  const priceMultiplier = getItemCostMultiplier(gameState.stage);
  const costLife = Math.floor(500 * priceMultiplier * Math.pow(2, gameState.livesBought || 0));

  const buyLife = () => {
    if (gameState.lives >= 5) {
      alert("Đạo hữu không thể tàng trữ quá 5 Huyền Đan cứu mạng cùng lúc!");
      return;
    }
    if (gameState.gold >= costLife) {
      setGameState(prev => prev ? { ...prev, gold: prev.gold - costLife, lives: prev.lives + 1, livesBought: (prev.livesBought || 0) + 1 } : null);
    }
  };

  const buyItem = (price: number, item: Equipment, slot: keyof GameState['player']['equipment']) => {
    if (gameState.gold >= price) {
       applyEquipments([item], price);
    }
  };

  const getTierBadge = (tier?: number): string => {
    const badges = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
    return badges[tier || 1] || '一';
  };

  const getTierTitleName = (tier?: number): string => {
    const level = tier || 1;
    const names = [
      '',
      'Đệ Nhất Đẳng (Sơ Nhập Võ Lâm)',
      'Đệ Nhị Đẳng (Tập Sự Hành Tẩu)',
      'Đệ Tam Đẳng (Lục Lâm Thành Danh)',
      'Đệ Tứ Đẳng (Danh Môn Tinh Anh)',
      'Đệ Ngũ Đẳng (Giang Hồ Hào Kiệt)',
      'Đệ Lục Đẳng (Nhất Phương Tôn Giả)',
      'Đệ Thất Đẳng (Khai Sơn Tổ Sư)',
      'Đệ Bát Đẳng (Chấn Thế Thần Binh)',
      'Đệ Cửu Đẳng (Cổ Kim Vô Song)'
    ];
    return names[level] || 'Đệ Nhất Đẳng';
  };

  const getItemValue = (item: Equipment): number => {
    const baseValue: Record<Rarity, number> = {
      common: 120,
      rare: 240,
      epic: 480,
      legendary: 960,
      emerald: 1400,
      gold_rarity: 2000,
      crimson: 3200,
      pink: 6000,
    };
    const tierMultiplier = 1 + ((item.tier || 1) - 1) * 0.75;
    const coreVal = (baseValue[item.rarity] || 120) * tierMultiplier;
    // Bán thu hồi bị giảm 75% giá trị, tức là đại hiệp nhận lại 25% ngân lượng
    return Math.floor(coreVal * 0.25);
  };

  const applyEquipments = (items: Equipment[], cost: number) => {
      setGameState(prev => {
          if (!prev) return prev;
          
          let newEquipment = { ...prev.player.equipment };
          
          items.forEach(item => {
             const slot = item.type;
             const current = newEquipment[slot];
             if (!current || item.power > current.power) {
                 newEquipment[slot] = item;
             }
          });
          
          const newBuffs = { ...prev.buffs };
          newBuffs.dmgMult = 1 + (newEquipment.weapon ? newEquipment.weapon.power * 0.1 : 0);
          newBuffs.hpMult = 1 + (newEquipment.armor ? newEquipment.armor.power * 0.05 : 0);
          
          const cdBonus = (newEquipment.accessory ? newEquipment.accessory.power * 0.02 : 0) + (newEquipment.horse ? newEquipment.horse.power * 0.01 : 0);
          newBuffs.cdReduc = Math.min(0.75, cdBonus);
          
          newBuffs.resMult = 1 + (newEquipment.special ? newEquipment.special.power * 0.1 : 0);
          
          const speedBonus = newEquipment.horse ? newEquipment.horse.power * 4 : 0;
          const speed = 160 + prev.player.currentStats.agi * 5 + speedBonus;
          
          const critDmgBonus = newEquipment.cloak ? newEquipment.cloak.power * 0.03 : 0;
          newBuffs.critDmgMult = 1.5 + critDmgBonus;
          
          const rangeBonus = newEquipment.seal ? newEquipment.seal.power * 2.5 : 0;
          newBuffs.skillRangeBonus = rangeBonus;

          const newMaxHp = Math.floor((100 + prev.player.currentStats.con * 20) * newBuffs.hpMult);
          const newMaxMp = Math.floor((100 + prev.player.currentStats.nei * 15) * 1.0);
          const newAtk = Math.floor((10 + prev.player.currentStats.str * 3) * newBuffs.dmgMult);

          return {
              ...prev,
              gold: Math.max(0, prev.gold - cost),
              buffs: newBuffs,
              player: {
                  ...prev.player,
                  maxHp: newMaxHp,
                  maxMp: newMaxMp,
                  atk: newAtk,
                  speed,
                  equipment: newEquipment
              }
          };
      });
  };

  const rollGacha = (times: number) => {
     const cost = Math.floor(times * 200 * priceMultiplier);
     if (gameState.gold < cost) return;

     const results: Equipment[] = [];
     const types: EquipmentType[] = ['weapon', 'armor', 'accessory', 'special', 'horse', 'cloak', 'seal', 'banner'];

     let currentStreakBonus = 0;
     if (streakCount > 0) {
        currentStreakBonus = Math.min(streakCount * 0.01, 0.1); // up to 10% bonus
     }

     for(let i=0; i<times; i++) {
        const rand = Math.random();
        let rarity: Rarity = 'common';
        
        // Boosted rates for x10 (at least Epic on the last roll)
        if (times === 10 && i === 9) {
           if (rand < 0.008 + currentStreakBonus * 0.5) rarity = 'pink'; // 0.8%
           else if (rand < 0.024 + currentStreakBonus) rarity = 'crimson'; // 1.6%
           else if (rand < 0.065 + currentStreakBonus) rarity = 'gold_rarity'; // 4.1%
           else if (rand < 0.20 + currentStreakBonus) rarity = 'emerald';
           else if (rand < 0.45 + currentStreakBonus) rarity = 'legendary';
           else rarity = 'epic'; // Guaranteed Epic or better
        } else {
           if (rand < 0.001 + currentStreakBonus * 0.1) rarity = 'pink';
           else if (rand < 0.004 + currentStreakBonus * 0.2) rarity = 'crimson';
           else if (rand < 0.014 + currentStreakBonus * 0.4) rarity = 'gold_rarity';
           else if (rand < 0.045 + currentStreakBonus * 0.6) rarity = 'emerald';
           else if (rand < 0.115 + currentStreakBonus) rarity = 'legendary';
           else if (rand < 0.30 + currentStreakBonus) rarity = 'epic';
           else if (rand < 0.65) rarity = 'rare';
           else rarity = 'common';
        }
        
        // Unlocks larger range of tiers early-game, cap at 9 (Cửu Đẳng)
        const maxPossibleTier = Math.min(9, Math.max(3, gameState.stage + 1));
        
        // Balanced, exciting, progression-tuned tier distribution!
        const randTier = Math.random();
        let tier = 1;
        if (randTier < 0.35 + currentStreakBonus) {
          // 35% chance to roll current max tier
          tier = maxPossibleTier;
        } else if (randTier < 0.60 + currentStreakBonus) {
          // 25% chance to roll max - 1
          tier = Math.max(1, maxPossibleTier - 1);
        } else if (randTier < 0.80) {
          // 20% chance to roll max - 2
          tier = Math.max(1, maxPossibleTier - 2);
        } else {
          // 20% chance to roll a fully random tier up to max
          tier = Math.max(1, Math.floor(1 + Math.random() * maxPossibleTier));
        }

        const type = types[Math.floor(Math.random() * types.length)];
        const powerBase: Record<Rarity, number> = { 
          common: 1, 
          rare: 3, 
          epic: 6, 
          legendary: 10, 
          emerald: 12, 
          gold_rarity: 14, 
          crimson: 16, 
          pink: 20 
        };
        
        // Sức mạnh tỷ lệ với Cấp độ độ hiếm của trang bị (tăng sức mạnh Đẳng 1-9 vượt bực)
        const tierMultiplier = 1 + (tier - 1) * 0.35;
        const power = Math.floor((powerBase[rarity] + Math.floor(Math.random() * (powerBase[rarity] + 1))) * tierMultiplier);
        const typeNames = EQUIPMENT_NAME_MAP[type];
        const name = typeNames ? (typeNames[rarity] || 'Kỳ Trân Thần Khí') : 'Kỳ Trân Thần Khí';

        results.push({
           name,
           type,
           rarity,
           power,
           tier
        });
     }

     setGachaResult(results);
     setStreakCount(s => s + 1);
     setStreakExpiry(Date.now() + 5000);
     
     // Subtract the roll cost immediately
     setGameState(prev => prev ? { ...prev, gold: Math.max(0, prev.gold - cost) } : null);
  };

  const handleClaimAllAndRecycleRags = () => {
    if (!gachaResult) return;
    
    setGameState(prev => {
      if (!prev) return null;
      let newEquipment = { ...prev.player.equipment };
      let totalRefund = 0;
      
      gachaResult.forEach(item => {
        const slot = item.type;
        const current = newEquipment[slot];
        if (!current || item.power > current.power) {
          // Trang bị món tốt hơn
          newEquipment[slot] = item;
        } else {
          // Tự động thu hồi những món rác yếu hơn, nhận 25% vàng (giảm 75% giá trị)
          totalRefund += getItemValue(item);
        }
      });

      const newBuffs = { ...prev.buffs };
      newBuffs.dmgMult = 1 + (newEquipment.weapon ? newEquipment.weapon.power * 0.1 : 0);
      newBuffs.hpMult = 1 + (newEquipment.armor ? newEquipment.armor.power * 0.05 : 0);
      
      const cdBonus = (newEquipment.accessory ? newEquipment.accessory.power * 0.02 : 0) + (newEquipment.horse ? newEquipment.horse.power * 0.01 : 0);
      newBuffs.cdReduc = Math.min(0.75, cdBonus);
      
      newBuffs.resMult = 1 + (newEquipment.special ? newEquipment.special.power * 0.1 : 0);
      
      const speedBonus = newEquipment.horse ? newEquipment.horse.power * 4 : 0;
      const speed = 160 + prev.player.currentStats.agi * 5 + speedBonus;
      
      const critDmgBonus = newEquipment.cloak ? newEquipment.cloak.power * 0.03 : 0;
      newBuffs.critDmgMult = 1.5 + critDmgBonus;
      
      const rangeBonus = newEquipment.seal ? newEquipment.seal.power * 2.5 : 0;
      newBuffs.skillRangeBonus = rangeBonus;

      const newMaxHp = Math.floor((100 + prev.player.currentStats.con * 20) * newBuffs.hpMult);
      const newMaxMp = Math.floor((100 + prev.player.currentStats.nei * 15) * 1.0);
      const newAtk = Math.floor((10 + prev.player.currentStats.str * 3) * newBuffs.dmgMult);

      return {
        ...prev,
        gold: prev.gold + totalRefund,
        buffs: newBuffs,
        player: {
          ...prev.player,
          maxHp: newMaxHp,
          maxMp: newMaxMp,
          atk: newAtk,
          speed,
          equipment: newEquipment
        }
      };
    });

    setGachaResult(null);
  };

  const recycleSingleGacha = (index: number) => {
    if (!gachaResult) return;
    const item = gachaResult[index];
    const refund = getItemValue(item);
    
    setGameState(prev => {
      if (!prev) return null;
      return { ...prev, gold: prev.gold + refund };
    });

    const nextResult = [...gachaResult];
    nextResult.splice(index, 1);
    setGachaResult(nextResult.length > 0 ? nextResult : null);
  };

  const recycleAllGacha = () => {
    if (!gachaResult) return;
    let refundTotal = 0;
    gachaResult.forEach(item => {
      refundTotal += getItemValue(item);
    });

    setGameState(prev => {
      if (!prev) return null;
      return { ...prev, gold: prev.gold + refundTotal };
    });
    setGachaResult(null);
  };

  const equipSingleGacha = (index: number) => {
    if (!gachaResult) return;
    const item = gachaResult[index];
    applyEquipments([item], 0);

    const nextResult = [...gachaResult];
    nextResult.splice(index, 1);
    setGachaResult(nextResult.length > 0 ? nextResult : null);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-3 md:p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-4xl bg-[#0c0c12] border-2 border-gold rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] relative"
      >
        <div 
           className="relative p-3 md:p-4 border-b border-white/5 flex justify-between items-center"
           style={{
             backgroundImage: `url(${bannerImg})`,
             backgroundSize: 'cover',
             backgroundPosition: 'center',
           }}
        >
          <div className="absolute inset-0 bg-black/60 pointer-events-none" />
          <h3 className="relative z-10 text-gold font-serif italic text-lg md:text-xl flex items-center gap-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] pb-0.5">
            <ShoppingBag className="w-5 h-5 animate-pulse" /> Tiệm Rèn Thương Nhân Vong Xuyên
          </h3>
          <button onClick={onClose} className="relative z-10 text-gray-300 hover:text-white p-2 bg-black/40 rounded-full cursor-pointer transition-colors border border-white/10 hover:border-white/30"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex border-b border-white/5 bg-[#09090e]">
           <button 
             onClick={() => setActiveTab('gacha')} 
             className={`flex-1 py-3 text-xs md:text-sm font-bold font-serif tracking-widest uppercase transition-colors relative ${activeTab === 'gacha' ? 'text-amber-400' : 'text-gray-500 hover:text-gray-300'}`}
           >
             Tầm Bảo
             {activeTab === 'gacha' && <motion.div layoutId="shopTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400" />}
           </button>
           <button 
             onClick={() => setActiveTab('items')} 
             className={`flex-1 py-3 text-xs md:text-sm font-bold font-serif tracking-widest uppercase transition-colors relative ${activeTab === 'items' ? 'text-amber-400' : 'text-gray-500 hover:text-gray-300'}`}
           >
             Thần Khí (Cố Định)
             {activeTab === 'items' && <motion.div layoutId="shopTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400" />}
           </button>
           <button 
             onClick={() => setActiveTab('consumables')} 
             className={`flex-1 py-3 text-xs md:text-sm font-bold font-serif tracking-widest uppercase transition-colors relative ${activeTab === 'consumables' ? 'text-amber-400' : 'text-gray-500 hover:text-gray-300'}`}
           >
             Linh Dược
             {activeTab === 'consumables' && <motion.div layoutId="shopTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400" />}
           </button>
        </div>
        
        <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar flex-1">
           <div className="flex justify-between items-center mb-4 md:mb-6 bg-gold/10 border border-gold/20 p-3 md:p-4 rounded-lg shadow-inner">
              <span className="text-gold/80 text-xs md:text-sm font-bold uppercase tracking-widest">Ngân Lượng Hiện Có</span>
              <span className="text-gold font-serif text-2xl md:text-3xl drop-shadow-sm">{gameState.gold.toLocaleString()} Vàng</span>
           </div>
           
           {priceMultiplier > 1 && (
             <div className="mb-6 text-center px-4 py-2.5 border border-red-900/40 bg-red-950/20 rounded-lg text-red-400 font-serif text-xs md:text-sm italic shadow-inner">
               ⚠️ <span className="font-bold uppercase tracking-wide">Chiến trường khan hiếm (Ải {gameState.stage}):</span> Do ách tắc giao thương quyết liệt, giá cả toàn bộ kỳ trân dị dược tăng <span className="font-extrabold text-white text-sm bg-red-900/50 px-2 py-0.5 rounded ml-1">x{priceMultiplier}</span> lần!
             </div>
           )}

           {activeTab === 'consumables' && (
             <div>
               <h4 className="text-gray-500 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] mb-3">Vật Phẩm Linh Dược</h4>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                  <button 
                    onClick={buyLife} 
                    disabled={gameState.gold < costLife} 
                    className="p-3 border border-red-900/50 bg-[#0c0505] hover:border-red-500 disabled:opacity-40 disabled:hover:border-red-900/50 rounded-lg flex flex-col items-center justify-center gap-2 group transition-all cursor-pointer w-full text-center relative overflow-hidden"
                  >
                     <div className="w-16 h-16 rounded overflow-hidden mb-1 relative border border-white/10">
                       <img src={consumablesImg} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                       <div className="absolute inset-0 bg-gradient-to-t from-red-900/60 to-transparent mix-blend-overlay pointer-events-none" />
                     </div>
                     <span className="text-red-500 font-bold uppercase text-[9px] md:text-[10px] tracking-widest text-center relative z-10">Hồi Sinh Đan<br/>(+1 Mạng hồi sinh)</span>
                     <span className="text-gold text-xs font-serif border border-gold/30 px-3 py-0.5 rounded bg-black/80 relative z-10">{formatGoldValue(costLife)}</span>
                  </button>
               </div>
             </div>
           )}

           {activeTab === 'gacha' && (
             <div>
               <div className="flex justify-between items-center mb-3">
                 <h4 className="text-gray-500 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em]">Gacha Thập Liên Tầm Bảo</h4>
                 <button onClick={() => setShowInfo(!showInfo)} className="text-amber-500 hover:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 p-1 rounded-full px-2 text-xs font-bold font-sans flex items-center gap-1 transition-colors">
                   <Info className="w-3 h-3" /> Chi Tiết Tỷ Lệ
                 </button>
               </div>
               
               <AnimatePresence>
                 {showInfo && (
                   <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-4">
                     <div className="p-3 bg-amber-950/20 border border-amber-500/20 rounded-lg text-[10px] sm:text-xs text-amber-200/80 font-sans space-y-2">
                       <p className="font-bold text-amber-400">Tỷ lệ Tầm Bảo cơ bản:</p>
                       <ul className="list-disc pl-5 space-y-0.5 text-amber-100/70">
                         <li><span className="text-[#FF00FF] font-bold">Thánh Thể (Pink):</span> 0.1%</li>
                         <li><span className="text-[#DC143C] font-bold">Huyết Ảnh (Crimson):</span> 0.3%</li>
                         <li><span className="text-[#FFD700] font-bold">Hoàng Kim (Gold):</span> 1.0%</li>
                         <li><span className="text-[#50C878] font-bold">Lục Bảo (Emerald):</span> 3.1%</li>
                         <li>Thần Tiên (Legendary): 7.0%, Hiếm (Epic): 18.5%, Tinh Anh (Rare): 35.0%, Thường: 35.0%</li>
                       </ul>
                       <p className="font-bold text-amber-400 mt-2">Bảo Hiểm Thập Liên (x10): Món cuối cùng cam kết từ Epic trở lên và x8 tỷ lệ ra đồ tối thượng!</p>
                       <p className="font-bold text-green-400 mt-2">🔥 Cuồng Nhiệt Combo: Mua liên tiếp trong 5s để tích lũy % tăng vọt tỷ lệ ra đồ hiếm (Cộng dồn tối đa 10%).</p>
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>

               <div className="grid grid-cols-2 gap-3 md:gap-4 mb-2">
                  <button 
                    onClick={() => rollGacha(1)} 
                    disabled={gameState.gold < Math.floor(200 * priceMultiplier)} 
                    className="p-5 border border-teal-900/60 bg-[#0e1615] hover:border-teal-500 disabled:opacity-40 disabled:hover:border-teal-900/60 rounded-xl flex flex-col items-center justify-center gap-3 group transition-all cursor-pointer w-full text-center relative overflow-hidden"
                  >
                     <div className="absolute right-0 top-0 w-32 h-32 bg-teal-500/5 blur-3xl group-hover:bg-teal-500/10 pointer-events-none transition-all" />
                     <Package className="w-8 h-8 md:w-10 md:h-10 text-teal-400 group-hover:rotate-6 transition-transform drop-shadow relative z-10" />
                     <span className="text-teal-300 font-bold uppercase text-[9px] md:text-[11px] tracking-widest text-center relative z-10">Tầm Bảo (x1)</span>
                     <span className="text-gold text-xs sm:text-sm font-serif border border-gold/30 px-3 py-1 rounded bg-black/60 font-bold relative z-10">{formatGoldValue(Math.floor(200 * priceMultiplier))}</span>
                  </button>
                  <button 
                    onClick={() => rollGacha(10)} 
                    disabled={gameState.gold < Math.floor(2000 * priceMultiplier)} 
                    className="p-5 border border-amber-500/40 bg-[#1f170c] hover:border-amber-400 disabled:opacity-40 disabled:hover:border-amber-950/80 rounded-xl flex flex-col items-center justify-center gap-3 group transition-all relative overflow-hidden cursor-pointer w-full text-center shadow-[0_0_20px_rgba(245,158,11,0.05)] hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]"
                  >
                     <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 to-transparent pointer-events-none" />
                     <div className="absolute -right-4 -top-4 w-32 h-32 bg-amber-500/10 blur-3xl group-hover:bg-amber-500/20 pointer-events-none transition-all" />
                     
                     {streakCount > 0 && (
                        <div className="absolute top-2 left-2 right-2 flex justify-between items-center z-20">
                          <span className="bg-red-500 text-white font-black text-[9px] px-2 py-0.5 rounded shadow">🔥 COMBO x{streakCount}</span>
                          <span className="text-red-400 font-mono text-[10px] font-bold">{(timeRemaining/1000).toFixed(1)}s</span>
                        </div>
                     )}
                     {streakCount > 0 && (
                        <div className="absolute top-0 left-0 h-1 bg-red-500 z-20 transition-all duration-75" style={{ width: `${(timeRemaining / 5000) * 100}%` }} />
                     )}

                     <Package className="w-8 h-8 md:w-10 md:h-10 text-amber-400 group-hover:scale-110 transition-transform drop-shadow-[0_2px_10px_rgba(245,158,11,0.4)] relative z-10 mt-2" />
                     <span className="text-amber-400 font-bold uppercase text-[9px] md:text-[11px] tracking-widest text-center relative z-10">Thập Liên (x10)<br/><span className="text-[8px] text-amber-200/60 font-sans tracking-normal">Bảo hiểm 100% rớt Thần Khí</span></span>
                     <span className="text-gold text-xs sm:text-sm font-serif border border-gold/40 px-3 py-1 rounded bg-black/80 shadow-[0_0_10px_#d4af37] font-bold relative z-10">{formatGoldValue(Math.floor(2000 * priceMultiplier))}</span>
                  </button>
               </div>
             </div>
           )}

           {activeTab === 'items' && (
             <div>
               <h4 className="text-gray-500 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] mb-3">Thần Khí Truyền Thuyết Võ Lâm</h4>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 font-serif">
              {/* Weapon */}
              <button 
                onClick={() => buyItem(Math.floor(2500 * priceMultiplier), { name: 'Ỷ Thiên Thần Kiếm', type: 'weapon', rarity: 'pink', power: 20, tier: 1 }, 'weapon')} 
                disabled={gameState.gold < Math.floor(2500 * priceMultiplier) || gameState.player.equipment.weapon?.name === 'Ỷ Thiên Thần Kiếm'} 
                className="p-3 md:p-4 border border-purple-900/40 bg-purple-950/5 hover:border-purple-500 disabled:opacity-50 rounded-lg flex flex-col items-center justify-center gap-2 group transition-all cursor-pointer text-center w-full relative overflow-hidden"
              >
                 <div className="w-16 h-16 rounded border border-white/10 overflow-hidden relative">
                   <img src={volamWeaponsImg} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                 </div>
                 <span className="text-purple-400 font-bold uppercase text-[8.5px] md:text-[9.5px] tracking-widest leading-tight">Ỷ Thiên Kiếm<br/>(+50 Lực Tay dmg)</span>
                 <span className="text-gold text-xs font-serif border border-gold/30 px-2.5 py-0.5 rounded bg-black/50 font-bold">{formatGoldValue(Math.floor(2500 * priceMultiplier))}</span>
              </button>
              
              {/* Armor */}
              <button 
                onClick={() => buyItem(Math.floor(2000 * priceMultiplier), { name: 'Hoàng Kim Chiến Giáp', type: 'armor', rarity: 'pink', power: 20, tier: 1 }, 'armor')} 
                disabled={gameState.gold < Math.floor(2000 * priceMultiplier) || gameState.player.equipment.armor?.name === 'Hoàng Kim Chiến Giáp'} 
                className="p-3 md:p-4 border border-blue-900/40 bg-blue-950/5 hover:border-blue-500 disabled:opacity-50 rounded-lg flex flex-col items-center justify-center gap-2 group transition-all cursor-pointer text-center w-full relative overflow-hidden"
              >
                 <div className="w-16 h-16 rounded border border-white/10 overflow-hidden relative">
                   <img src={volamArmorImg} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                 </div>
                 <span className="text-blue-400 font-bold uppercase text-[8.5px] md:text-[9.5px] tracking-widest leading-tight">Kim Tiền Giáp<br/>(+500 Sinh Lực HP)</span>
                 <span className="text-gold text-xs font-serif border border-gold/30 px-2.5 py-0.5 rounded bg-black/50 font-bold">{formatGoldValue(Math.floor(2000 * priceMultiplier))}</span>
              </button>
              
              {/* Accessory */}
              <button 
                onClick={() => buyItem(Math.floor(3000 * priceMultiplier), { name: 'Vạn Niên Đăng Thần Ngọc Giới Chỉ', type: 'accessory', rarity: 'pink', power: 20, tier: 1 }, 'accessory')} 
                disabled={gameState.gold < Math.floor(3000 * priceMultiplier) || gameState.player.equipment.accessory?.name === 'Vạn Niên Đăng Thần Ngọc Giới Chỉ'} 
                className="p-3 md:p-4 border border-green-900/40 bg-green-950/5 hover:border-green-500 disabled:opacity-50 rounded-lg flex flex-col items-center justify-center gap-2 group transition-all cursor-pointer text-center w-full relative overflow-hidden"
              >
                 <div className="w-16 h-16 rounded border border-white/10 overflow-hidden relative">
                   <img src={equipmentBg} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                 </div>
                 <span className="text-green-400 font-bold uppercase text-[8.5px] md:text-[9.5px] tracking-widest leading-tight">Long Hoàn Chỉ<br/>(-40% CD Tuyệt Kỹ)</span>
                 <span className="text-gold text-xs font-serif border border-gold/30 px-2.5 py-0.5 rounded bg-black/50 font-bold">{formatGoldValue(Math.floor(3000 * priceMultiplier))}</span>
              </button>

              {/* Special */}
              <button 
                onClick={() => buyItem(Math.floor(4000 * priceMultiplier), { name: 'Giang Sơn Xã Tắc Đồ', type: 'special', rarity: 'pink', power: 20, tier: 1 }, 'special')} 
                disabled={gameState.gold < Math.floor(4000 * priceMultiplier) || gameState.player.equipment.special?.name === 'Giang Sơn Xã Tắc Đồ'} 
                className="p-3 md:p-4 border border-yellow-900/40 bg-yellow-950/5 hover:border-yellow-500 disabled:opacity-50 rounded-lg flex flex-col items-center justify-center gap-2 group transition-all cursor-pointer text-center w-full relative overflow-hidden"
              >
                 <div className="w-16 h-16 rounded border border-white/10 overflow-hidden relative">
                   <img src={equipmentBg} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                 </div>
                 <span className="text-yellow-400 font-bold uppercase text-[8.5px] md:text-[9.5px] tracking-widest leading-tight">Bát Quái Kính<br/>(+200% Phòng Thủ)</span>
                 <span className="text-gold text-xs font-serif border border-gold/30 px-2.5 py-0.5 rounded bg-black/50 font-bold">{formatGoldValue(Math.floor(4000 * priceMultiplier))}</span>
              </button>

              {/* Horse (Tọa Kỵ) */}
              <button 
                onClick={() => buyItem(Math.floor(2500 * priceMultiplier), { name: 'Cửu Tiêu Phượng Hoàng Kiệu', type: 'horse', rarity: 'pink', power: 20, tier: 1 }, 'horse')} 
                disabled={gameState.gold < Math.floor(2500 * priceMultiplier) || gameState.player.equipment.horse?.name === 'Cửu Tiêu Phượng Hoàng Kiệu'} 
                className="p-3 md:p-4 border border-teal-900/40 bg-teal-950/5 hover:border-teal-500 disabled:opacity-50 rounded-lg flex flex-col items-center justify-center gap-2 group transition-all cursor-pointer text-center w-full relative overflow-hidden"
              >
                 <div className="w-16 h-16 rounded border border-white/10 overflow-hidden relative">
                   <img src={equipmentBg} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                 </div>
                 <span className="text-teal-400 font-bold uppercase text-[8.5px] md:text-[9.5px] tracking-widest leading-tight">Phượng Hoàng Kiệu<br/>(+80 Tốc Chạy)</span>
                 <span className="text-gold text-xs font-serif border border-gold/30 px-2.5 py-0.5 rounded bg-black/50 font-bold">{formatGoldValue(Math.floor(2500 * priceMultiplier))}</span>
              </button>

              {/* Cloak (Phi Phong) */}
              <button 
                onClick={() => buyItem(Math.floor(3500 * priceMultiplier), { name: 'Kim Tiên Ngũ Sắc Phi Phong', type: 'cloak', rarity: 'pink', power: 20, tier: 1 }, 'cloak')} 
                disabled={gameState.gold < Math.floor(3500 * priceMultiplier) || gameState.player.equipment.cloak?.name === 'Kim Tiên Ngũ Sắc Phi Phong'} 
                className="p-3 md:p-4 border border-rose-900/40 bg-rose-950/5 hover:border-rose-500 disabled:opacity-50 rounded-lg flex flex-col items-center justify-center gap-2 group transition-all cursor-pointer text-center w-full relative overflow-hidden"
              >
                 <div className="w-16 h-16 rounded border border-white/10 overflow-hidden relative">
                   <img src={equipmentBg} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                 </div>
                 <span className="text-rose-400 font-bold uppercase text-[8.5px] md:text-[9.5px] tracking-widest leading-tight">Ngũ Sắc Phi Phong<br/>(+210% Sát Chí Mạng)</span>
                 <span className="text-gold text-xs font-serif border border-gold/30 px-2.5 py-0.5 rounded bg-black/50 font-bold">{formatGoldValue(Math.floor(3500 * priceMultiplier))}</span>
              </button>

              {/* Seal (Mật Ấn) */}
              <button 
                onClick={() => buyItem(Math.floor(2800 * priceMultiplier), { name: 'Vô Lực Ma Kha Thập Mật Ấn', type: 'seal', rarity: 'pink', power: 20, tier: 1 }, 'seal')} 
                disabled={gameState.gold < Math.floor(2800 * priceMultiplier) || gameState.player.equipment.seal?.name === 'Vô Lực Ma Kha Thập Mật Ấn'} 
                className="p-3 md:p-4 border border-indigo-900/40 bg-indigo-950/5 hover:border-indigo-500 disabled:opacity-50 rounded-lg flex flex-col items-center justify-center gap-2 group transition-all cursor-pointer text-center w-full relative overflow-hidden"
              >
                 <div className="w-16 h-16 rounded border border-white/10 overflow-hidden relative">
                   <img src={equipmentBg} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                 </div>
                 <span className="text-indigo-400 font-bold uppercase text-[8.5px] md:text-[9.5px] tracking-widest leading-tight">Cổ Ma Thập Ấn<br/>(+50px Sát Thương/s)</span>
                 <span className="text-gold text-xs font-serif border border-gold/30 px-2.5 py-0.5 rounded bg-black/50 font-bold">{formatGoldValue(Math.floor(2800 * priceMultiplier))}</span>
              </button>

              {/* Banner (Cờ Lệnh) */}
              <button 
                onClick={() => buyItem(Math.floor(4200 * priceMultiplier), { name: 'Vạn Cổ Đan Tâm Phục Ma Kỳ', type: 'banner', rarity: 'pink', power: 20, tier: 1 }, 'banner')} 
                disabled={gameState.gold < Math.floor(4200 * priceMultiplier) || gameState.player.equipment.banner?.name === 'Vạn Cổ Đan Tâm Phục Ma Kỳ'} 
                className="p-3 md:p-4 border border-orange-900/40 bg-orange-950/5 hover:border-orange-500 disabled:opacity-50 rounded-lg flex flex-col items-center justify-center gap-2 group transition-all cursor-pointer text-center w-full relative overflow-hidden"
              >
                 <div className="w-16 h-16 rounded border border-white/10 overflow-hidden relative">
                   <img src={equipmentBg} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                 </div>
                 <span className="text-orange-400 font-bold uppercase text-[8.5px] md:text-[9.5px] tracking-widest leading-tight font-sans">Phục Ma Kỳ Trận<br/>(+110 HP/s Hào quang)</span>
                 <span className="text-gold text-xs font-serif border border-gold/30 px-2.5 py-0.5 rounded bg-black/50 font-bold">{formatGoldValue(Math.floor(4200 * priceMultiplier))}</span>
              </button>
            </div>
           </div>
          )}
        </div>
      </motion.div>

      {/* Gacha Loot Box Modal Display Frame */}
      <AnimatePresence>
        {gachaResult && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[250] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0, scale: 0.8 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.8 }}
               className="w-full max-w-2xl bg-[#09090e] border-2 border-amber-500 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.25)] flex flex-col max-h-[90vh]"
             >
                <div className="p-4 border-b border-amber-500/20 bg-amber-500/5 flex justify-between items-center">
                   <h3 className="text-amber-400 font-serif italic text-lg md:text-xl flex items-center gap-2 font-bold leading-normal">
                     🔮 TRÂN BẢO VONG XUYÊN XUẤT THẾ!
                   </h3>
                   <span className="text-gray-500 text-xs font-sans font-bold">Quay Ngẫu Nhiên</span>
                </div>
                
                <div className="p-4 md:p-6 overflow-y-auto flex-1 custom-scrollbar">
                   <p className="text-gray-400 text-[10px] md:text-xs mb-4 uppercase tracking-[0.2em] font-serif font-bold italic">
                     Đại hiệp có duyên kỳ ngộ tầm được {gachaResult.length} thần binh khí giới dưới đây:
                   </p>
                   
                   <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {gachaResult.map((item, index) => {
                         const rarityColor = RARITY_COLORS[item.rarity];
                         const recycleValue = getItemValue(item);
                         
                         return (
                            <div 
                              key={index} 
                              className="bg-black hover:bg-gray-900 border rounded-lg p-2.5 flex flex-col justify-between items-center relative transition-all group/card shadow"
                              style={{ borderColor: `${rarityColor}80` }}
                            >
                               {/* Tier level display at the top-right corner of card */}
                               <div 
                                 className="absolute top-1 right-1.5 text-[10px] sm:text-xs font-black font-serif px-1 rounded z-20 select-none"
                                 style={{ color: rarityColor, textShadow: `0 0 6px ${rarityColor}` }}
                                 title={`Cơ duyên: ${getTierTitleName(item.tier)}`}
                               >
                                 {getTierBadge(item.tier)}
                               </div>

                               <span className="text-[10px] font-mono opacity-80 uppercase font-bold text-gray-450 w-full text-left">
                                  {item.type === 'weapon' ? '🗡️' : item.type === 'armor' ? '🛡️' : item.type === 'accessory' ? '💍' : item.type === 'special' ? '🔮' : item.type === 'horse' ? '🐴' : item.type === 'cloak' ? '🧥' : item.type === 'seal' ? '🈶' : '🚩'} {item.type.substring(0, 4)}
                               </span>

                               <div className="relative w-full h-14 rounded overflow-hidden border border-white/5 my-2 bg-[#050508] z-10">
                                 <img 
                                   src={item.type === 'weapon' ? volamWeaponsImg : item.type === 'armor' ? volamArmorImg : equipmentBg} 
                                   className="w-full h-full object-cover object-center group-hover/card:scale-110 transition-transform duration-500" 
                                   alt={item.name}
                                   referrerPolicy="no-referrer"
                                 />
                                 <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent pointer-events-none" />
                               </div>

                               <div className="my-3 text-center">
                                  <p className="font-serif text-[10.5px] md:text-xs font-bold leading-normal line-clamp-2 px-1 mb-1" style={{ color: rarityColor }}>
                                     {item.name}
                                  </p>
                                  <span className="text-[9px] font-sans font-bold bg-gray-900/40 text-gold border border-gold/20 px-1.5 py-0.5 rounded">
                                     Uy lực: {item.power}
                                  </span>
                               </div>

                               <div className="w-full space-y-1.5 mt-auto pt-2 border-t border-white/5 flex flex-col items-center">
                                  {/* Equip Single Action */}
                                  <button 
                                    onClick={() => equipSingleGacha(index)}
                                    className="w-full py-1 text-[8px] sm:text-[9.5px] font-bold text-green-400 border border-green-900/10 hover:border-green-400 bg-green-950/25 hover:bg-green-500 hover:text-white rounded transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    <ShieldCheck className="w-3 h-3" /> Trang Bị
                                  </button>
                                  
                                  {/* Recycle Single Action (75% penalty applied: receives 25%) */}
                                  <button 
                                    onClick={() => recycleSingleGacha(index)}
                                    className="w-full py-1 text-[8px] sm:text-[9.5px] font-bold text-rose-400 border border-rose-900/10 hover:border-rose-400 bg-rose-950/25 hover:bg-rose-500 hover:text-white rounded transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                    title={`Thu hồi nhận lại 25% giá trị quy đổi gốc: +${recycleValue} Vàng`}
                                  >
                                    <Trash2 className="w-3 h-3" /> Thu hồi (+{recycleValue})
                                  </button>
                               </div>
                            </div>
                         );
                      })}
                   </div>
                </div>

                <div className="p-4 bg-amber-950/10 border-t border-amber-500/20 flex flex-col sm:flex-row justify-end items-center gap-3">
                   <button 
                     onClick={recycleAllGacha}
                     className="px-4 py-2 border border-rose-900/50 bg-rose-950/20 text-rose-400 hover:text-white hover:bg-rose-600 rounded text-xs select-none font-bold tracking-wide active:scale-95 transition-all w-full sm:w-auto cursor-pointer"
                   >
                     ♻️ Thu hồi toàn bộ (Mất 75% giá gốc)
                   </button>
                   <button 
                     onClick={handleClaimAllAndRecycleRags}
                     className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-bold rounded text-xs select-none shadow-md shadow-amber-500/10 active:scale-95 hover:brightness-110 hover:shadow-lg hover:shadow-amber-500/20 transition-all w-full sm:w-auto cursor-pointer"
                   >
                     ⚔️ Giữ lại món mạnh nhất & Tự động bán rác
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

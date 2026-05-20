import React, { useState } from 'react';
import { GameState, Rarity, EquipmentType, Equipment } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, X, Heart, Sword, Shield, Gem, Star, Package, Award, Zap, Sparkles, Trash2, ShieldCheck, Trophy } from 'lucide-react';
import { RARITIES, RARITY_COLORS, EQUIPMENT_NAME_MAP } from '../constants';

interface Props {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState | null>>;
  onClose: () => void;
}

export default function ShopOverlay({ gameState, setGameState, onClose }: Props) {
  const [gachaResult, setGachaResult] = useState<Equipment[] | null>(null);

  const buyLife = () => {
    if (gameState.gold >= 500) {
      setGameState(prev => prev ? { ...prev, gold: prev.gold - 500, lives: prev.lives + 1 } : null);
    }
  };

  const buyItem = (price: number, item: Equipment, slot: keyof GameState['player']['equipment']) => {
    if (gameState.gold >= price) {
       applyEquipments([item], price);
    }
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
    const tierMultiplier = item.tier === 3 ? 2.5 : (item.tier === 2 ? 1.5 : 1.0);
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
          const newAtk = Math.floor((10 + prev.player.currentStats.str * 3) * newBuffs.dmgMult);

          return {
              ...prev,
              gold: Math.max(0, prev.gold - cost),
              buffs: newBuffs,
              player: {
                  ...prev.player,
                  maxHp: newMaxHp,
                  atk: newAtk,
                  speed,
                  equipment: newEquipment
              }
          };
      });
  };

  const rollGacha = (times: number) => {
     const cost = times * 200;
     if (gameState.gold < cost) return;

     const results: Equipment[] = [];
     const types: EquipmentType[] = ['weapon', 'armor', 'accessory', 'special', 'horse', 'cloak', 'seal', 'banner'];

     for(let i=0; i<times; i++) {
        const rand = Math.random();
        let rarity: Rarity = 'common';
        
        // Boosted rates for x10 (at least Epic on the last roll)
        if (times === 10 && i === 9) {
           if (rand < 0.06) rarity = 'pink';
           else if (rand < 0.16) rarity = 'crimson';
           else if (rand < 0.35) rarity = 'gold_rarity';
           else rarity = 'epic'; // Guaranteed Epic or better
        } else {
           if (rand < 0.012) rarity = 'pink';
           else if (rand < 0.03) rarity = 'crimson';
           else if (rand < 0.06) rarity = 'gold_rarity';
           else if (rand < 0.12) rarity = 'emerald';
           else if (rand < 0.22) rarity = 'legendary';
           else if (rand < 0.45) rarity = 'epic';
           else if (rand < 0.75) rarity = 'rare';
        }
        
        // Randomize Level / Tier (一, 二, 三)
        // Cấp I: 60%, Cấp II: 30%, Cấp III: 10%
        const randTier = Math.random();
        let tier = 1;
        if (randTier < 0.10) tier = 3;
        else if (randTier < 0.40) tier = 2;
        else tier = 1;

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
        
        // Sức mạnh tỷ lệ với Cấp độ độ hiếm của trang bị
        const tierMultiplier = tier === 3 ? 1.5 : (tier === 2 ? 1.25 : 1.0);
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
      const newAtk = Math.floor((10 + prev.player.currentStats.str * 3) * newBuffs.dmgMult);

      return {
        ...prev,
        gold: prev.gold + totalRefund,
        buffs: newBuffs,
        player: {
          ...prev.player,
          maxHp: newMaxHp,
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
        <div className="p-3 md:p-4 border-b border-white/5 flex justify-between items-center bg-black/40">
          <h3 className="text-gold font-serif italic text-lg md:text-xl flex items-center gap-2 drop-shadow-md pb-0.5">
            <ShoppingBag className="w-5 h-5 animate-pulse" /> Tiệm Rèn Thương Nhân Vong Xuyên
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white p-2 bg-white/5 rounded-full cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        
        <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar">
           <div className="flex justify-between items-center mb-4 md:mb-6 bg-gold/10 border border-gold/20 p-3 md:p-4 rounded-lg">
              <span className="text-gold/80 text-xs md:text-sm font-bold uppercase tracking-widest">Ngân Lượng Hiện Có</span>
              <span className="text-gold font-serif text-2xl md:text-3xl drop-shadow-sm">{gameState.gold.toLocaleString()} Vàng</span>
           </div>
           
           <h4 className="text-gray-500 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] mb-3">Vật Phẩm Linh Dược</h4>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
              <button 
                onClick={buyLife} 
                disabled={gameState.gold < 500} 
                className="p-3 md:p-4 border border-red-900/50 bg-red-950/10 hover:border-red-500 disabled:opacity-40 disabled:hover:border-red-900/50 rounded-lg flex flex-col items-center justify-center gap-2 group transition-all cursor-pointer"
              >
                 <Heart className="w-6 h-6 md:w-8 md:h-8 text-red-500 group-hover:scale-110 transition-transform drop-shadow" />
                 <span className="text-red-500 font-bold uppercase text-[9px] md:text-[10px] tracking-widest text-center">Hồi Sinh Đan<br/>(+1 Mạng hồi sinh)</span>
                 <span className="text-gold text-xs font-serif border border-gold/30 px-3 py-0.5 rounded bg-black/50">500</span>
              </button>
           </div>

           <h4 className="text-gray-500 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] mb-3 mt-4">Gacha Thập Liên Tầm Bảo</h4>
           <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
              <button 
                onClick={() => rollGacha(1)} 
                disabled={gameState.gold < 200} 
                className="p-4 border border-teal-900/60 bg-[#0e211e] hover:border-teal-400 disabled:opacity-40 disabled:hover:border-teal-900/60 rounded-lg flex flex-col items-center justify-center gap-2 group transition-all cursor-pointer"
              >
                 <Package className="w-7 h-7 md:w-8 md:h-8 text-teal-400 group-hover:rotate-6 transition-transform drop-shadow" />
                 <span className="text-teal-300 font-bold uppercase text-[9px] md:text-[10px] tracking-widest text-center">Tầm Bảo Đơn (x1)<br/>Toàn bộ 8 slot trang bị</span>
                 <span className="text-gold text-xs sm:text-sm font-serif border border-gold/30 px-3 py-0.5 rounded bg-black/60 font-bold">200 Vàng</span>
              </button>
              <button 
                onClick={() => rollGacha(10)} 
                disabled={gameState.gold < 2000} 
                className="p-4 border border-amber-950/80 bg-[#1f170c] hover:border-amber-400 disabled:opacity-40 disabled:hover:border-amber-950/80 rounded-lg flex flex-col items-center justify-center gap-2 group transition-all relative overflow-hidden cursor-pointer"
              >
                 <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 to-transparent pointer-events-none" />
                 <Package className="w-7 h-7 md:w-8 md:h-8 text-amber-500 group-hover:scale-110 transition-transform drop-shadow" />
                 <span className="text-amber-400 font-bold uppercase text-[9px] md:text-[10px] tracking-widest text-center">Thập Liên Tầm Bảo (x10)<br/>Đảm Bảo Bảo Vật Cực Phẩm!</span>
                 <span className="text-gold text-xs sm:text-sm font-serif border border-gold/30 px-3 py-0.5 rounded bg-black/60 shadow-[0_0_10px_#d4af37] font-bold">2,000 Vàng</span>
              </button>
           </div>

           <h4 className="text-gray-500 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] mb-3">Thần Khí Truyền Thuyết Võ Lâm</h4>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {/* Weapon */}
              <button 
                onClick={() => buyItem(2500, { name: 'Ỷ Thiên Thần Kiếm', type: 'weapon', rarity: 'pink', power: 20, tier: 1 }, 'weapon')} 
                disabled={gameState.gold < 2500 || gameState.player.equipment.weapon?.name === 'Ỷ Thiên Thần Kiếm'} 
                className="p-3 md:p-4 border border-purple-900/40 bg-purple-950/5 hover:border-purple-500 disabled:opacity-50 rounded-lg flex flex-col items-center justify-center gap-2 group transition-all cursor-pointer text-center"
              >
                 <Sword className="w-7 h-7 text-purple-500 group-hover:scale-115 transition-transform drop-shadow" />
                 <span className="text-purple-400 font-bold uppercase text-[8.5px] md:text-[9.5px] tracking-widest leading-tight">Ỷ Thiên Kiếm<br/>(+50 Lực Tay dmg)</span>
                 <span className="text-gold text-xs font-serif border border-gold/30 px-2.5 py-0.5 rounded bg-black/50 font-bold">2,500</span>
              </button>
              
              {/* Armor */}
              <button 
                onClick={() => buyItem(2000, { name: 'Hoàng Kim Chiến Giáp', type: 'armor', rarity: 'pink', power: 20, tier: 1 }, 'armor')} 
                disabled={gameState.gold < 2000 || gameState.player.equipment.armor?.name === 'Hoàng Kim Chiến Giáp'} 
                className="p-3 md:p-4 border border-blue-900/40 bg-blue-950/5 hover:border-blue-500 disabled:opacity-50 rounded-lg flex flex-col items-center justify-center gap-2 group transition-all cursor-pointer text-center"
              >
                 <Shield className="w-7 h-7 text-blue-500 group-hover:scale-115 transition-transform drop-shadow" />
                 <span className="text-blue-400 font-bold uppercase text-[8.5px] md:text-[9.5px] tracking-widest leading-tight">Kim Tiền Giáp<br/>(+500 Sinh Lực HP)</span>
                 <span className="text-gold text-xs font-serif border border-gold/30 px-2.5 py-0.5 rounded bg-black/50 font-bold">2,000</span>
              </button>
              
              {/* Accessory */}
              <button 
                onClick={() => buyItem(3000, { name: 'Vạn Niên Đăng Thần Ngọc Giới Chỉ', type: 'accessory', rarity: 'pink', power: 20, tier: 1 }, 'accessory')} 
                disabled={gameState.gold < 3000 || gameState.player.equipment.accessory?.name === 'Vạn Niên Đăng Thần Ngọc Giới Chỉ'} 
                className="p-3 md:p-4 border border-green-900/40 bg-green-950/5 hover:border-green-500 disabled:opacity-50 rounded-lg flex flex-col items-center justify-center gap-2 group transition-all cursor-pointer text-center"
              >
                 <Gem className="w-7 h-7 text-green-500 group-hover:scale-115 transition-transform drop-shadow" />
                 <span className="text-green-400 font-bold uppercase text-[8.5px] md:text-[9.5px] tracking-widest leading-tight">Long Hoàn Chỉ<br/>(-40% CD Tuyệt Kỹ)</span>
                 <span className="text-gold text-xs font-serif border border-gold/30 px-2.5 py-0.5 rounded bg-black/50 font-bold">3,000</span>
              </button>

              {/* Special */}
              <button 
                onClick={() => buyItem(4000, { name: 'Giang Sơn Xã Tắc Đồ', type: 'special', rarity: 'pink', power: 20, tier: 1 }, 'special')} 
                disabled={gameState.gold < 4000 || gameState.player.equipment.special?.name === 'Giang Sơn Xã Tắc Đồ'} 
                className="p-3 md:p-4 border border-yellow-900/40 bg-yellow-950/5 hover:border-yellow-500 disabled:opacity-50 rounded-lg flex flex-col items-center justify-center gap-2 group transition-all cursor-pointer text-center"
              >
                 <Star className="w-7 h-7 text-yellow-500 group-hover:scale-115 transition-transform drop-shadow" />
                 <span className="text-yellow-400 font-bold uppercase text-[8.5px] md:text-[9.5px] tracking-widest leading-tight">Bát Quái Kính<br/>(+200% Phòng Thủ)</span>
                 <span className="text-gold text-xs font-serif border border-gold/30 px-2.5 py-0.5 rounded bg-black/50 font-bold">4,000</span>
              </button>

              {/* Horse (Tọa Kỵ) */}
              <button 
                onClick={() => buyItem(2500, { name: 'Cửu Tiêu Phượng Hoàng Kiệu', type: 'horse', rarity: 'pink', power: 20, tier: 1 }, 'horse')} 
                disabled={gameState.gold < 2500 || gameState.player.equipment.horse?.name === 'Cửu Tiêu Phượng Hoàng Kiệu'} 
                className="p-3 md:p-4 border border-teal-900/40 bg-teal-950/5 hover:border-teal-500 disabled:opacity-50 rounded-lg flex flex-col items-center justify-center gap-2 group transition-all cursor-pointer text-center"
              >
                 <Award className="w-7 h-7 text-teal-500 group-hover:scale-115 transition-transform drop-shadow" />
                 <span className="text-teal-400 font-bold uppercase text-[8.5px] md:text-[9.5px] tracking-widest leading-tight">Phượng Hoàng Kiệu<br/>(+80 Tốc Chạy)</span>
                 <span className="text-gold text-xs font-serif border border-gold/30 px-2.5 py-0.5 rounded bg-black/50 font-bold">2,500</span>
              </button>

              {/* Cloak (Phi Phong) */}
              <button 
                onClick={() => buyItem(3500, { name: 'Kim Tiên Ngũ Sắc Phi Phong', type: 'cloak', rarity: 'pink', power: 20, tier: 1 }, 'cloak')} 
                disabled={gameState.gold < 3500 || gameState.player.equipment.cloak?.name === 'Kim Tiên Ngũ Sắc Phi Phong'} 
                className="p-3 md:p-4 border border-rose-900/40 bg-rose-950/5 hover:border-rose-500 disabled:opacity-50 rounded-lg flex flex-col items-center justify-center gap-2 group transition-all cursor-pointer text-center"
              >
                 <Zap className="w-7 h-7 text-rose-500 group-hover:scale-115 transition-transform drop-shadow" />
                 <span className="text-rose-400 font-bold uppercase text-[8.5px] md:text-[9.5px] tracking-widest leading-tight">Ngũ Sắc Phi Phong<br/>(+210% Sát Chí Mạng)</span>
                 <span className="text-gold text-xs font-serif border border-gold/30 px-2.5 py-0.5 rounded bg-black/50 font-bold">3,500</span>
              </button>

              {/* Seal (Mật Ấn) */}
              <button 
                onClick={() => buyItem(2800, { name: 'Vô Lực Ma Kha Thập Mật Ấn', type: 'seal', rarity: 'pink', power: 20, tier: 1 }, 'seal')} 
                disabled={gameState.gold < 2800 || gameState.player.equipment.seal?.name === 'Vô Lực Ma Kha Thập Mật Ấn'} 
                className="p-3 md:p-4 border border-indigo-900/40 bg-indigo-950/5 hover:border-indigo-500 disabled:opacity-50 rounded-lg flex flex-col items-center justify-center gap-2 group transition-all cursor-pointer text-center"
              >
                 <Sparkles className="w-7 h-7 text-indigo-500 group-hover:scale-115 transition-transform drop-shadow" />
                 <span className="text-indigo-400 font-bold uppercase text-[8.5px] md:text-[9.5px] tracking-widest leading-tight">Cổ Ma Thập Ấn<br/>(+50px Sát Thương/s)</span>
                 <span className="text-gold text-xs font-serif border border-gold/30 px-2.5 py-0.5 rounded bg-black/50 font-bold">2,800</span>
              </button>

              {/* Banner (Cờ Lệnh) */}
              <button 
                onClick={() => buyItem(4200, { name: 'Vạn Cổ Đan Tâm Phục Ma Kỳ', type: 'banner', rarity: 'pink', power: 20, tier: 1 }, 'banner')} 
                disabled={gameState.gold < 4200 || gameState.player.equipment.banner?.name === 'Vạn Cổ Đan Tâm Phục Ma Kỳ'} 
                className="p-3 md:p-4 border border-orange-900/40 bg-orange-950/5 hover:border-orange-500 disabled:opacity-50 rounded-lg flex flex-col items-center justify-center gap-2 group transition-all cursor-pointer text-center"
              >
                 <Trophy className="w-7 h-7 text-orange-500 group-hover:scale-115 transition-transform drop-shadow" />
                 <span className="text-orange-400 font-bold uppercase text-[8.5px] md:text-[9.5px] tracking-widest leading-tight font-sans">Phục Ma Kỳ Trận<br/>(+110 HP/s Hào quang)</span>
                 <span className="text-gold text-xs font-serif border border-gold/30 px-2.5 py-0.5 rounded bg-black/50 font-bold">4,200</span>
              </button>
           </div>
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
                               {/* Tier level display at the top-right corner of card: 一, 二, 三 */}
                               <div 
                                 className="absolute top-1 right-1.5 text-[10px] sm:text-xs font-black font-serif px-1 rounded z-20 select-none"
                                 style={{ color: rarityColor, textShadow: `0 0 6px ${rarityColor}` }}
                                 title={`Cấp độ độ hiếm: ${item.tier === 3 ? 'Tam' : item.tier === 2 ? 'Nhị' : 'Nhất'}`}
                               >
                                 {item.tier === 3 ? '三' : item.tier === 2 ? '二' : '一'}
                               </div>

                               <span className="text-[10px] font-mono opacity-80 uppercase font-bold text-gray-450 w-full text-left">
                                  {item.type === 'weapon' ? '🗡️' : item.type === 'armor' ? '🛡️' : item.type === 'accessory' ? '💍' : item.type === 'special' ? '🔮' : item.type === 'horse' ? '🐴' : item.type === 'cloak' ? '🧥' : item.type === 'seal' ? '🔏' : '🚩'} {item.type.substring(0, 4)}
                               </span>

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

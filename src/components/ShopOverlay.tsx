import React, { useState } from 'react';
import { GameState, Rarity } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, X, Heart, Sword, Shield, Gem, Star, Package } from 'lucide-react';
import { Equipment } from '../types';
import { RARITIES, RARITY_COLORS } from '../constants';

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

  const buyItem = (price: number, item: Equipment & { power: number }, slot: keyof GameState['player']['equipment']) => {
    if (gameState.gold >= price) {
       applyEquipments([item], price);
    }
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
          newBuffs.dmgMult = 1 + (newEquipment.weapon ? (newEquipment.weapon as any).power * 0.1 : 0);
          newBuffs.hpMult = 1 + (newEquipment.armor ? (newEquipment.armor as any).power * 0.05 : 0);
          newBuffs.cdReduc = newEquipment.accessory ? Math.min(0.5, (newEquipment.accessory as any).power * 0.02) : 0;
          newBuffs.resMult = 1 + (newEquipment.special ? (newEquipment.special as any).power * 0.1 : 0);

          const newMaxHp = Math.floor((300 + prev.player.currentStats.con * 20) * newBuffs.hpMult);
          const newAtk = Math.floor((25 + prev.player.currentStats.str * 3) * newBuffs.dmgMult);

          return {
              ...prev,
              gold: Math.max(0, prev.gold - cost),
              buffs: newBuffs,
              player: {
                  ...prev.player,
                  maxHp: newMaxHp,
                  atk: newAtk,
                  equipment: newEquipment
              }
          };
      });
  };

  const rollGacha = (times: number) => {
     const cost = times * 200;
     if (gameState.gold < cost) return;

     const results: Equipment[] = [];
     const types: ('weapon'|'armor'|'accessory'|'special')[] = ['weapon', 'armor', 'accessory', 'special'];

     for(let i=0; i<times; i++) {
        const rand = Math.random();
        let rarity: Rarity = 'common';
        
        // Boosted rates for x10 (at least Epic on the last roll)
        if (times === 10 && i === 9) {
           if (rand < 0.05) rarity = 'mythical';
           else if (rand < 0.25) rarity = 'legendary';
           else rarity = 'epic'; // Guaranteed Epic or better
        } else {
           if (rand < 0.01) rarity = 'mythical';
           else if (rand < 0.05) rarity = 'legendary';
           else if (rand < 0.20) rarity = 'epic';
           else if (rand < 0.50) rarity = 'rare';
        }
        
        const type = types[Math.floor(Math.random() * types.length)];
        const powerBase = { common: 1, rare: 3, epic: 6, legendary: 10, mythical: 20 }[rarity];
        const power = powerBase + Math.floor(Math.random() * powerBase);
        
        results.push({
           name: `Kỳ Trân [${power}]`,
           type,
           rarity,
           power
        });
     }

     setGachaResult(results);
     applyEquipments(results, cost);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-3xl bg-[#0c0c12] border-2 border-gold rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/40">
          <h3 className="text-gold font-serif italic text-xl flex items-center gap-2 drop-shadow-md">
            <ShoppingBag className="w-5 h-5" /> Thương Nhân Vong Xuyên
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white p-2 bg-white/5 rounded-full"><X className="w-4 h-4" /></button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar">
           <div className="flex justify-between items-center mb-6 bg-gold/10 border border-gold/20 p-4 rounded-lg">
              <span className="text-gold/80 text-sm font-bold uppercase tracking-widest">Ngân Lượng Hiện Có</span>
              <span className="text-gold font-serif text-3xl drop-shadow-sm">{gameState.gold.toLocaleString()}</span>
           </div>
           
           <h4 className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Vật Phẩm Phục Hồi</h4>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <button 
                onClick={buyLife} 
                disabled={gameState.gold < 500} 
                className="p-4 border border-red-900/50 bg-red-950/10 hover:border-red-500 disabled:opacity-50 disabled:hover:border-red-900/50 rounded-lg flex flex-col items-center justify-center gap-3 group transition-all"
              >
                 <Heart className="w-8 h-8 text-red-500 group-hover:scale-110 transition-transform drop-shadow" />
                 <span className="text-red-500 font-bold uppercase text-[10px] tracking-widest text-center">Hồi Sinh Đan<br/>(+1 Mạng)</span>
                 <span className="text-gold text-sm font-serif border border-gold/30 px-3 py-1 rounded bg-black/50">500</span>
              </button>
           </div>

           <h4 className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-4 mt-8">Gacha Tầm Bảo</h4>
           <div className="grid grid-cols-2 gap-4 mb-8">
              <button 
                onClick={() => rollGacha(1)} 
                disabled={gameState.gold < 200} 
                className="p-4 border border-teal-900/50 bg-teal-950/10 hover:border-teal-500 disabled:opacity-50 disabled:hover:border-teal-900/50 rounded-lg flex flex-col items-center justify-center gap-3 group transition-all"
              >
                 <Package className="w-8 h-8 text-teal-500 group-hover:scale-110 transition-transform drop-shadow" />
                 <span className="text-teal-400 font-bold uppercase text-[10px] tracking-widest text-center">Tầm Bảo (x1)<br/>Nhận Ngẫu Nhiên</span>
                 <span className="text-gold text-sm font-serif border border-gold/30 px-3 py-1 rounded bg-black/50">200</span>
              </button>
              <button 
                onClick={() => rollGacha(10)} 
                disabled={gameState.gold < 2000} 
                className="p-4 border border-amber-900/50 bg-amber-950/10 hover:border-amber-500 disabled:opacity-50 disabled:hover:border-amber-900/50 rounded-lg flex flex-col items-center justify-center gap-3 group transition-all relative overflow-hidden"
              >
                 <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 to-transparent pointer-events-none" />
                 <Package className="w-8 h-8 text-amber-500 group-hover:scale-110 transition-transform drop-shadow" />
                 <span className="text-amber-400 font-bold uppercase text-[10px] tracking-widest text-center">Thập Liên Tầm Bảo (x10)<br/>Tỷ Lệ Cao Hơn!</span>
                 <span className="text-gold text-sm font-serif border border-gold/30 px-3 py-1 rounded bg-black/50 shadow-[0_0_10px_#d4af37]">2,000</span>
              </button>
           </div>

           {gachaResult && (
              <div className="mb-8 p-4 border border-gray-700 bg-gray-900/50 rounded-lg">
                <h4 className="text-gold text-sm font-serif italic mb-4">Kết Quả Tầm Bảo:</h4>
                <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                   {gachaResult.map((item, i) => (
                      <div key={i} className="flex flex-col items-center p-2 bg-black border rounded" style={{ borderColor: RARITY_COLORS[item.rarity] }}>
                         <span className="text-[10px] font-bold truncate w-full text-center" style={{ color: RARITY_COLORS[item.rarity] }}>{item.power} Pts</span>
                         <span className="text-[8px] text-gray-500 uppercase mt-1">{item.type.substring(0, 3)}</span>
                      </div>
                   ))}
                </div>
              </div>
           )}

           <h4 className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Thần Khí Truyền Thuyết</h4>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {/* Weapon */}
              <button 
                onClick={() => buyItem(2500, { name: 'Ỷ Thiên Kiếm', type: 'weapon', rarity: 'mythical', power: 20 }, 'weapon')} 
                disabled={gameState.gold < 2500 || gameState.player.equipment.weapon?.name === 'Ỷ Thiên Kiếm'} 
                className="p-4 border border-purple-900/50 bg-purple-950/10 hover:border-purple-500 disabled:opacity-50 disabled:hover:border-purple-900/50 rounded-lg flex flex-col items-center justify-center gap-3 group transition-all"
              >
                 <Sword className="w-8 h-8 text-purple-500 group-hover:scale-110 transition-transform drop-shadow" />
                 <span className="text-purple-400 font-bold uppercase text-[10px] tracking-widest text-center">Ỷ Thiên Kiếm<br/>(+50 Lực Tay)</span>
                 <span className="text-gold text-sm font-serif border border-gold/30 px-3 py-1 rounded bg-black/50">2,500</span>
              </button>
              
               {/* Armor */}
              <button 
                onClick={() => buyItem(2000, { name: 'Kim Tiền Giáp', type: 'armor', rarity: 'mythical', power: 20 }, 'armor')} 
                disabled={gameState.gold < 2000 || gameState.player.equipment.armor?.name === 'Kim Tiền Giáp'} 
                className="p-4 border border-blue-900/50 bg-blue-950/10 hover:border-blue-500 disabled:opacity-50 disabled:hover:border-blue-900/50 rounded-lg flex flex-col items-center justify-center gap-3 group transition-all"
              >
                 <Shield className="w-8 h-8 text-blue-500 group-hover:scale-110 transition-transform drop-shadow" />
                 <span className="text-blue-400 font-bold uppercase text-[10px] tracking-widest text-center">Kim Tiền Giáp<br/>(+500 Máu)</span>
                 <span className="text-gold text-sm font-serif border border-gold/30 px-3 py-1 rounded bg-black/50">2,000</span>
              </button>
              
               {/* Accessory */}
              <button 
                onClick={() => buyItem(3000, { name: 'Long Hoàn', type: 'accessory', rarity: 'mythical', power: 20 }, 'accessory')} 
                disabled={gameState.gold < 3000 || gameState.player.equipment.accessory?.name === 'Long Hoàn'} 
                className="p-4 border border-green-900/50 bg-green-950/10 hover:border-green-500 disabled:opacity-50 disabled:hover:border-green-900/50 rounded-lg flex flex-col items-center justify-center gap-3 group transition-all"
              >
                 <Gem className="w-8 h-8 text-green-500 group-hover:scale-110 transition-transform drop-shadow" />
                 <span className="text-green-400 font-bold uppercase text-[10px] tracking-widest text-center">Long Hoàn<br/>(-20% Hồi chiêu)</span>
                 <span className="text-gold text-sm font-serif border border-gold/30 px-3 py-1 rounded bg-black/50">3,000</span>
              </button>

               {/* Special */}
              <button 
                onClick={() => buyItem(4000, { name: 'Ngọc Tỷ', type: 'special', rarity: 'mythical', power: 20 }, 'special')} 
                disabled={gameState.gold < 4000 || gameState.player.equipment.special?.name === 'Ngọc Tỷ'} 
                className="p-4 border border-yellow-900/50 bg-yellow-950/10 hover:border-yellow-500 disabled:opacity-50 disabled:hover:border-yellow-900/50 rounded-lg flex flex-col items-center justify-center gap-3 group transition-all"
              >
                 <Star className="w-8 h-8 text-yellow-500 group-hover:scale-110 transition-transform drop-shadow" />
                 <span className="text-yellow-400 font-bold uppercase text-[10px] tracking-widest text-center">Ngọc Tỷ<br/>(+100 Tất Cả)</span>
                 <span className="text-gold text-sm font-serif border border-gold/30 px-3 py-1 rounded bg-black/50">4,000</span>
              </button>
           </div>
        </div>
      </motion.div>
    </div>
  );
}

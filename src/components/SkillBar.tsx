import { Dispatch, SetStateAction, MutableRefObject, MouseEvent } from 'react';
import { GameState, Particle, FloatingText, Entity } from '../types';
import { motion } from 'motion/react';

interface Props {
  gameState: GameState;
  setGameState: Dispatch<SetStateAction<GameState | null>>;
  addNotification: (text: string, color: string) => void;
  shakeRef: MutableRefObject<number>;
  particlesRef: MutableRefObject<Particle[]>;
  textsRef: MutableRefObject<FloatingText[]>;
  entitiesRef: MutableRefObject<Entity[]>;
  setShowShop: (show: boolean) => void;
}

export default function SkillBar({ 
  gameState, 
  setGameState, 
  addNotification, 
  shakeRef,
  particlesRef,
  textsRef,
  entitiesRef,
  setShowShop
}: Props) {
  const p = gameState.player;

  const useSkill = (idx: number) => {
    if (gameState.state !== 'PLAYING' || p.dead) return;
    const sk = gameState.skills[idx];
    if (sk.level === 0 || sk.cooldownLeft > 0) return;
    if (p.mp < sk.manaCost) {
       addNotification('Không đủ Nội Lực!', '#3b82f6');
       return;
    }

    // Calculate effect center
    const tx = p.target ? p.target.x : p.x + p.facing * 100;
    const ty = p.target ? p.target.y : p.y;

    // Shake and effects
    shakeRef.current = (idx + 1) * 6; // MORE shake for higher skills
    
    // Base shockwave and ring
    particlesRef.current.push({
      x: tx, y: ty, vx: 0, vy: 0, life: 0.5 + idx * 0.2, maxLife: 0.5 + idx * 0.2, color: sk.color, size: 10, type: 'ring'
    });
    particlesRef.current.push({
      x: tx, y: ty, vx: 0, vy: 0, life: 0.3, maxLife: 0.3, color: '#ffffff', size: 5, type: 'shockwave'
    });

    if (idx === 0) {
      // Tier 1: Fast basic hit, some sparks
      for (let i = 0; i < 15; i++) {
        const ang = Math.random() * Math.PI * 2;
        const speed = 100 + Math.random() * 200;
        particlesRef.current.push({
          x: tx, y: ty,
          vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed,
          life: 0.3 + Math.random() * 0.2,
          color: Math.random() > 0.3 ? sk.color : '#ffffff',
          size: 2 + Math.random() * 3,
          type: 'trail'
        });
      }
    } else if (idx === 1) {
      // Tier 2: Pillar and falling swords
      particlesRef.current.push({
        x: tx, y: ty, vx: 0, vy: 0, life: 0.6, maxLife: 0.6, color: sk.color, size: sk.range / 3, type: 'pillar'
      });
      for (let i = 0; i < 8; i++) {
         particlesRef.current.push({
            x: tx + (Math.random() - 0.5) * sk.range, 
            y: ty - 300 - Math.random() * 200, 
            vx: 0, vy: 800 + Math.random() * 400, // fall fast
            life: 0.8,
            color: sk.color,
            size: 15 + Math.random() * 10,
            type: 'sword',
            rotation: Math.random() * 0.2 - 0.1
         });
      }
    } else if (idx === 2) {
      // Tier 3: Ultimate explosion
      particlesRef.current.push({
        x: tx, y: ty, vx: 0, vy: 0, life: 1, maxLife: 1, color: sk.color, size: sk.range / 1.5, type: 'pillar'
      });
      particlesRef.current.push({
        x: tx, y: ty, vx: 0, vy: 0, life: 0.8, maxLife: 0.8, color: '#ffffff', size: 10, type: 'ring'
      });
      
      for (let i = 0; i < 40; i++) {
        const ang = Math.random() * Math.PI * 2;
        const speed = 200 + Math.random() * 400;
        particlesRef.current.push({
          x: tx, y: ty,
          vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed,
          life: 0.5 + Math.random() * 0.5,
          color: Math.random() > 0.4 ? sk.color : '#ffffff',
          size: 3 + Math.random() * 5,
          type: 'trail'
        });
      }
      for (let i = 0; i < 15; i++) {
         particlesRef.current.push({
            x: tx + (Math.random() - 0.5) * sk.range * 1.5, 
            y: ty - 400 - Math.random() * 300, 
            vx: 0, vy: 1000 + Math.random() * 500,
            life: 1,
            color: '#ffffff',
            size: 20 + Math.random() * 15,
            type: 'sword',
            rotation: Math.random() * 0.4 - 0.2
         });
      }
    }

    const damage = (sk.baseDamage + sk.level * 20 + p.currentStats.int * 5) * gameState.buffs.dmgMult;

    // Update game state for cooldown and mana
    setGameState(prev => {
      if (!prev) return null;
      const newSkills = [...prev.skills];
      newSkills[idx] = { ...sk, cooldownLeft: sk.cooldown * (1 - prev.buffs.cdReduc) };
      
      return {
        ...prev,
        skills: newSkills,
        player: { ...prev.player, mp: prev.player.mp - sk.manaCost }
      };
    });

    // Damage logic (outside of state update for performance)
    entitiesRef.current.forEach(e => {
      const dist = Math.hypot(e.x - tx, e.y - ty);
      if (dist <= sk.range) {
        const d = Math.floor(damage * (0.8 + Math.random() * 0.4));
        e.hp -= d;
        textsRef.current.push({
          id: Math.random(),
          x: e.x, y: e.y - 30, text: d.toString(), color: sk.color, life: 1
        });
      }
    });
  };

  const upgradeSkill = (idx: number, e: MouseEvent) => {
    e.stopPropagation();
    if (p.skillPoints <= 0) return;
    setGameState(prev => {
      if (!prev) return null;
      const newSkills = [...prev.skills];
      if (newSkills[idx].level >= newSkills[idx].maxLevel) return prev;
      newSkills[idx].level++;
      return {
        ...prev,
        player: { ...prev.player, skillPoints: prev.player.skillPoints - 1 },
        skills: newSkills
      };
    });
    addNotification('Thăng cấp Tuyệt Học!', '#2ecc71');
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 h-20 md:h-24 w-full bg-[#08080c] border-t border-white/5 px-2 md:px-12 flex items-center justify-between z-40 pointer-events-auto">
      <div className="flex items-center gap-2 md:gap-4 hidden sm:flex">
        <div className="w-8 h-8 md:w-10 md:h-10 rounded bg-black border border-gray-800 flex items-center justify-center text-[10px] text-gray-600 font-bold uppercase">
          F1-+
        </div>
        <button 
          onClick={() => setGameState(prev => prev ? { ...prev, auto: !prev.auto } : null)}
          className={`px-4 md:px-6 py-2 border rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all
            ${gameState.auto ? 'border-green-900 text-green-500 bg-green-950/10' : 'border-gray-800 text-gray-600 bg-gray-900/10'}`}
        >
          ⚡ Auto: {gameState.auto ? 'On' : 'Off'}
        </button>
      </div>

      <div className="flex gap-2 md:gap-4 mx-auto sm:mx-0">
        {gameState.skills.map((sk, i) => {
          const isLocked = sk.level === 0;
          const canUse = !isLocked && sk.cooldownLeft <= 0 && p.mp >= sk.manaCost;
          const canUpgrade = p.skillPoints > 0 && sk.level < sk.maxLevel;

          return (
            <motion.div
              key={i}
              whileHover={canUse ? { scale: 1.05, y: -5 } : {}}
              whileTap={canUse ? { scale: 0.95 } : {}}
              onPointerDown={(e) => { e.stopPropagation(); useSkill(i); }}
              className={`group relative w-12 h-12 md:w-16 md:h-16 rounded-lg flex items-center justify-center text-xl md:text-2xl transition-all cursor-pointer
                ${isLocked ? 'opacity-30 grayscale' : 'shadow-sm'}
                ${!canUse && !isLocked ? 'brightness-50' : ''}`}
            >
              {/* Chasing Fireballs Ring for unlocked skills */}
              {!isLocked ? (
                <div className="absolute inset-[-2px] rounded-[10px] overflow-hidden opacity-80 group-hover:opacity-100 transition-opacity">
                  <div 
                    className="absolute inset-[-50%] w-[200%] h-[200%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin-normal"
                    style={{
                      background: `conic-gradient(from 0deg, transparent 0%, ${sk.color} 40%, white 48%, transparent 50%, transparent 50%, ${sk.color} 90%, white 98%, transparent 100%)`
                    }}
                  />
                </div>
              ) : (
                <div className="absolute inset-0 border border-gray-800 rounded-lg" />
              )}
              
              {/* Core glow background */}
              <div 
                className="absolute inset-[2px] rounded-lg bg-black z-0"
                style={{
                  boxShadow: !isLocked ? `inset 0 0 10px ${sk.color}40` : undefined,
                }}
              />

              <span className="absolute -top-1 -left-1 w-4 h-4 md:w-5 md:h-5 bg-gray-900 border border-gray-800 text-[8px] md:text-[10px] rounded-full flex items-center justify-center text-gray-400 font-bold z-10 shadow">
                {i + 1}
              </span>
              
              <span className="z-10 drop-shadow-md" style={{ textShadow: !isLocked ? `0 0 10px ${sk.color}` : undefined }}>
                {['👊', '🗡️', '💥'][i]}
              </span>

              {sk.cooldownLeft > 0 && (
                <div className="absolute inset-[2px] bg-black/60 rounded-lg flex items-center justify-center z-20 overflow-hidden">
                  <span className="text-xs md:text-sm font-bold text-white drop-shadow-md">{sk.cooldownLeft.toFixed(1)}s</span>
                </div>
              )}

              {canUpgrade && (
                <button
                  onPointerDown={(e) => upgradeSkill(i, e as any)}
                  className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-gold text-black rounded-full flex items-center justify-center text-[8px] md:text-[10px] font-bold z-30 shadow-lg border border-black hover:scale-110 active:scale-95 transition-transform"
                >
                  +
                </button>
              )}
              
              <div 
                className="absolute bottom-[2px] left-[2px] right-[2px] bg-blue-500/10 transition-all rounded-b-lg z-10 pointer-events-none" 
                style={{ height: `${Math.min(100, (p.mp / sk.manaCost) * 100)}%`, opacity: p.mp < sk.manaCost ? 1 : 0 }} 
              />
            </motion.div>
          );
        })}
      </div>

      <div className="flex gap-2 md:gap-4 text-gray-500 ml-2 sm:ml-0">
         {/* Mobile Auto Toggle Button */}
         <button 
           onClick={() => setGameState(prev => prev ? { ...prev, auto: !prev.auto } : null)}
           className={`w-10 h-10 md:hidden border rounded flex items-center justify-center text-[10px] font-bold uppercase transition-all
              ${gameState.auto ? 'border-green-900 text-green-500 bg-green-950/10' : 'border-gray-800 text-gray-600 bg-gray-900/10'}`}
         >
           ⚡
         </button>
         <button onClick={(e) => { e.stopPropagation(); setShowShop(true); }} className="w-10 h-10 border border-gray-800 rounded flex items-center justify-center text-lg hover:border-gold hover:text-gold transition-colors cursor-pointer pointer-events-auto bg-black" title="Cửa Hàng">
            🏮
         </button>
         <div className="w-10 h-10 border border-gray-800 rounded hidden md:flex items-center justify-center text-lg hover:border-gold hover:text-gold transition-colors cursor-pointer">⚙️</div>
         <div className="w-10 h-10 border border-gray-800 rounded hidden md:flex items-center justify-center text-lg hover:border-gold hover:text-gold transition-colors cursor-pointer">❔</div>
      </div>
    </footer>
  );
}

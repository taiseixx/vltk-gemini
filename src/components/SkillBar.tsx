import { MouseEvent, MutableRefObject } from 'react';
import { GameState, Particle, FloatingText, Entity } from '../types';
import { motion } from 'motion/react';

interface Props {
  gameState: GameState;
  setGameState: (updater: (prev: GameState | null) => GameState | null) => void;
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

  const useSkill = (idx: number) => {
    setGameState(prev => {
      if (!prev || prev.player.dead) return prev;
      const p = { ...prev.player };
      const sk = prev.skills[idx];
      const buffs = prev.buffs;

      const reqLevel = [1, 1, 1, 15, 25, 30][idx];
      if (p.level < reqLevel || sk.level === 0 || sk.cooldownLeft > 0 || p.mp < sk.manaCost) return prev;

      const newSkills = prev.skills.map((s, i) => {
        if (i === idx) {
          return { ...s, cooldownLeft: s.cooldown * (1 - buffs.cdReduc) };
        }
        return s;
      });

      p.mp -= sk.manaCost;

      const tx = p.target ? p.target.x : p.x + p.facing * 120;
      const ty = p.target ? p.target.y : p.y;
      
      shakeRef.current = (idx + 1) * 7;
      const actualRange = sk.range + (buffs.skillRangeBonus || 0);
      
      // Base shockwave and ring
      particlesRef.current.push({
        x: tx, y: ty, vx: 0, vy: 0, life: 0.5 + idx * 0.15, maxLife: 0.5 + idx * 0.15, color: sk.color, size: 10, type: 'ring'
      });
      particlesRef.current.push({
        x: tx, y: ty, vx: 0, vy: 0, life: 0.3, maxLife: 0.3, color: '#ffffff', size: 5, type: 'shockwave'
      });

      if (idx === 0) {
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
        particlesRef.current.push({
          x: tx, y: ty, vx: 0, vy: 0, life: 0.6, maxLife: 0.6, color: sk.color, size: actualRange / 3, type: 'pillar'
        });
        for (let i = 0; i < 8; i++) {
           particlesRef.current.push({
              x: tx + (Math.random() - 0.5) * actualRange, 
              y: ty - 300 - Math.random() * 200, 
              vx: 0, vy: 800 + Math.random() * 400,
              life: 0.8,
              color: sk.color,
              size: 15 + Math.random() * 10,
              type: 'sword',
              rotation: Math.random() * 0.2 - 0.1
           });
        }
      } else if (idx === 2) {
        particlesRef.current.push({
          x: tx, y: ty, vx: 0, vy: 0, life: 1, maxLife: 1, color: sk.color, size: actualRange / 1.5, type: 'pillar'
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
      } else if (idx === 3) {
        for (let sweep = -30; sweep <= 30; sweep += 15) {
           particlesRef.current.push({
             x: tx, y: ty + sweep, vx: 0, vy: 0, life: 0.5, maxLife: 0.5, color: sk.color, size: 25, type: 'beam'
           });
        }
      } else if (idx === 4) {
        for (let i = 0; i < 5; i++) {
           const lx = tx + (Math.random() - 0.5) * actualRange;
           const ly = ty + (Math.random() - 0.5) * actualRange;
           particlesRef.current.push({
             x: lx, y: ly, vx: 0, vy: 0, life: 0.4, maxLife: 0.4, color: '#3498db', size: 8, type: 'lightning'
           });
        }
      } else if (idx === 5) {
        particlesRef.current.push({
          x: tx, y: ty, vx: 0, vy: 0, life: 1.5, maxLife: 1.5, color: '#f1c40f', size: actualRange, type: 'ring'
        });
        for (let i = 0; i < 60; i++) {
          const spinA = Math.random() * Math.PI * 2;
          const rDist = Math.random() * actualRange;
          particlesRef.current.push({
            x: tx + Math.cos(spinA) * rDist, y: ty + Math.sin(spinA) * rDist,
            vx: -Math.sin(spinA) * 200, vy: Math.cos(spinA) * 200,
            life: 0.8, color: '#f1c40f', size: 4, type: 'trail'
          });
        }
      }
      
      const damage = (sk.baseDamage + sk.level * 25 + p.currentStats.int * 5) * buffs.dmgMult;
      
      entitiesRef.current.forEach(e => {
        const dist = Math.hypot(e.x - tx, e.y - ty);
        if (dist <= actualRange) {
          const isCrit = Math.random() < (0.10 + p.currentStats.agi * 0.005);
          let d = Math.floor(damage * (0.8 + Math.random() * 0.4));
          if (isCrit) {
            d = Math.floor(d * (buffs.critDmgMult || 1.5));
          }
          e.hp -= d;
          textsRef.current.push({
            id: Math.random(),
            x: e.x + (Math.random() - 0.5) * 20,
            y: e.y - 20 - Math.random() * 20,
            text: isCrit ? `💥 CHÍ MẠNG! -${d}` : `-${d}`,
            color: isCrit ? '#f1c40f' : sk.color,
            life: 1.8
          });
        }
      });

      return { ...prev, player: p, skills: newSkills };
    });
  };

  const skillEmojis = ['👊', '🗡️', '💥', '🌀', '🌩️', '🐉'];
  const levelRequirements = [1, 1, 1, 15, 25, 30];

  return (
    <footer className="fixed bottom-0 left-0 right-0 h-20 md:h-24 w-full bg-[#08080c] border-t border-white/5 px-2 md:px-12 flex items-center justify-between z-40 pointer-events-auto">
      {/* Auto Cast Button Toggle */}
      <div className="flex items-center gap-2 md:gap-4 hidden sm:flex">
        <button 
          onClick={() => setGameState(prev => prev ? { ...prev, auto: !prev.auto } : null)}
          className={`px-3 md:px-5 py-2 border rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all
            ${gameState.auto ? 'border-green-950 text-green-500 bg-green-950/20 shadow-[0_0_15px_rgba(46,204,113,0.2)]' : 'border-gray-800 text-gray-600 bg-gray-900/10'}`}
        >
          ⚡ Auto: {gameState.auto ? 'Bật' : 'Tắt'}
        </button>
      </div>

      {/* Skills Row - Sized compact for mobile responsive line fitting */}
      <div className="flex gap-1.5 sm:gap-2.5 md:gap-4 mx-auto sm:mx-0 items-center">
        {gameState.skills.map((sk, i) => {
          const reqLevel = levelRequirements[i];
          const isLvlLocked = p.level < reqLevel;
          const isSkillLocked = sk.level === 0 || isLvlLocked;
          const canUse = !isSkillLocked && sk.cooldownLeft <= 0 && p.mp >= sk.manaCost;
          const canUpgrade = p.skillPoints > 0 && sk.level < sk.maxLevel && !isLvlLocked;

          return (
            <motion.div
              key={i}
              whileHover={canUse ? { scale: 1.05, y: -4 } : {}}
              whileTap={canUse ? { scale: 0.95 } : {}}
              onPointerDown={(e) => { 
                e.stopPropagation(); 
                if (!isLvlLocked) useSkill(i); 
              }}
              className={`group relative w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-lg flex items-center justify-center text-lg md:text-2xl transition-all cursor-pointer
                ${isSkillLocked ? 'bg-gray-950/80 border border-gray-900/40 opacity-40' : 'shadow-md'}
                ${!canUse && !isSkillLocked ? 'brightness-50' : ''}`}
              title={isLvlLocked ? `Cần đạt nhân vật Cấp ${reqLevel} để mở khóa khóa tuyệt môn này` : `${sk.name} (Tầm ${sk.range})`}
            >
              {/* Spinning active ring for unlocked skills */}
              {!isSkillLocked ? (
                <div className="absolute inset-[-2px] rounded-[10px] overflow-hidden opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div 
                    className="absolute inset-[-50%] w-[200%] h-[200%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin-normal"
                    style={{
                      background: `conic-gradient(from 0deg, transparent 0%, ${sk.color} 40%, white 48%, transparent 50%, transparent 50%, ${sk.color} 90%, white 98%, transparent 100%)`
                    }}
                  />
                </div>
              ) : (
                <div className="absolute inset-0 border border-gray-900 rounded-lg pointer-events-none" />
              )}
              
              {/* Core glow background */}
              <div 
                className="absolute inset-[2px] rounded-lg bg-black z-0 pointer-events-none"
                style={{
                  boxShadow: !isSkillLocked ? `inset 0 0 10px ${sk.color}40` : undefined,
                }}
              />

              {/* Skill index tag */}
              <span className="absolute -top-1 -left-1 w-3.5 h-3.5 md:w-5 md:h-5 bg-gray-900 border border-gray-800 text-[7px] md:text-[9px] rounded-full flex items-center justify-center text-gray-400 font-bold z-10 shadow">
                {i + 1}
              </span>
              
              {/* Emoji or padlock overlay */}
              {isLvlLocked ? (
                <div className="flex flex-col items-center justify-center z-10 text-red-500 select-none">
                  <span className="text-[10px] md:text-sm">🔒</span>
                  <span className="text-[6px] md:text-[8px] font-sans font-bold text-gray-500 uppercase">Lv{reqLevel}</span>
                </div>
              ) : (
                <span className="z-10 drop-shadow-md select-none text-base md:text-2xl" style={{ textShadow: !isSkillLocked ? `0 0 10px ${sk.color}` : undefined }}>
                  {skillEmojis[i] || '💥'}
                </span>
              )}

              {/* Cooldown left display shadow overlay */}
              {sk.cooldownLeft > 0 && !isLvlLocked && (
                <div className="absolute inset-[2px] bg-black/70 rounded-lg flex items-center justify-center z-20 overflow-hidden">
                  <span className="text-[10px] md:text-xs font-bold text-white drop-shadow-md font-sans">{sk.cooldownLeft.toFixed(1)}s</span>
                </div>
              )}

              {/* Upgrade + trigger button */}
              {canUpgrade && (
                <button
                  onPointerDown={(e) => upgradeSkill(i, e as any)}
                  className="absolute -top-1 -right-1 w-4.5 h-4.5 md:w-5 md:h-5 bg-gold text-black rounded-full flex items-center justify-center text-[9px] md:text-[11px] font-bold z-30 shadow-lg border border-black hover:scale-110 active:scale-95 transition-transform"
                >
                  +
                </button>
              )}
              
              {/* MP deficiency shadow overlay */}
              {!isLvlLocked && p.mp < sk.manaCost && (
                <div 
                  className="absolute bottom-[2px] left-[2px] right-[2px] bg-blue-500/10 transition-all rounded-b-lg z-10 pointer-events-none" 
                  style={{ height: `${Math.min(100, (p.mp / sk.manaCost) * 100)}%`, opacity: 0.8 }} 
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Sidebar Trigger Actions Left/Right */}
      <div className="flex gap-2 text-gray-500 ml-2 sm:ml-0 pointer-events-auto items-center">
         {/* Mobile Auto Cast Trigger Toggle */}
         <button 
           onClick={() => setGameState(prev => prev ? { ...prev, auto: !prev.auto } : null)}
           className={`w-9 h-9 md:hidden border rounded-md flex items-center justify-center text-[10px] font-bold uppercase transition-all
              ${gameState.auto ? 'border-green-900 text-green-500 bg-green-950/20' : 'border-gray-800 text-gray-600 bg-gray-900/10'}`}
         >
           Auto
         </button>
         <button 
           onClick={(e) => { e.stopPropagation(); setShowShop(true); }} 
           className="w-9 h-9 md:w-11 md:h-11 border border-gray-800 rounded-md flex items-center justify-center text-lg hover:border-gold hover:text-gold transition-all cursor-pointer bg-black active:scale-95" 
           title="Cửa Hàng Vong Xuyên"
         >
           🏮
         </button>
      </div>
    </footer>
  );
}

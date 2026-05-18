/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, Sword, Shield, Settings, Info, ShoppingCart, Zap, Heart, Trophy, User } from 'lucide-react';
import { SECTS, MAP_SIZE, RARITY_COLORS, RARITY_MULTIPLIERS, WEAPON_NAMES } from './constants';
import { GameState, Sect, Entity, Particle, FloatingText, Drop, Skill, Equipment, Rarity } from './types';
import SectSelection from './components/SectSelection';
import GameCanvas from './components/GameCanvas';
import HUD from './components/HUD';
import Sidebar from './components/Sidebar';
import SkillBar from './components/SkillBar';
import StatsPopup from './components/StatsPopup';
import StageClearOverlay from './components/StageClearOverlay';
import ShopOverlay from './components/ShopOverlay';

export default function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'skills'>('stats');
  const [notifications, setNotifications] = useState<{ id: number; text: string; color: string }[]>([]);
  
  const particlesRef = useRef<Particle[]>([]);
  const textsRef = useRef<FloatingText[]>([]);
  const entitiesRef = useRef<Entity[]>([]);
  const dropsRef = useRef<Drop[]>([]);
  const sceneryRef = useRef<{ x: number; y: number; t: number; sz: number }[]>([]);
  const shakeRef = useRef(0);

  const addNotification = useCallback((text: string, color: string) => {
    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev, { id, text, color }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 2000);
  }, []);

  const initGame = (sectId: string) => {
    const sect = SECTS.find(s => s.id === sectId);
    if (!sect) return;

    sceneryRef.current = Array.from({ length: 800 }, () => ({
      x: Math.random() * MAP_SIZE,
      y: Math.random() * MAP_SIZE,
      t: Math.floor(Math.random() * 4), // 0 to 3
      sz: 20 + Math.random() * 40
    }));

    const initialSkills: Skill[] = sect.skills.map((nm, i) => ({
      name: nm,
      level: i === 0 ? 1 : 0,
      maxLevel: 10,
      cooldown: 4 + i * 4,
      cooldownLeft: 0,
      manaCost: 10 + i * 15,
      baseDamage: 30 + i * 25,
      range: 120 + i * 50,
      color: sect.color
    }));

    const initialState: GameState = {
      state: 'PLAYING',
      stage: 1,
      lives: 2,
      gold: 0,
      exp: 0,
      mobsTotal: 10,
      mobsKilled: 0,
      bossSpawned: false,
      auto: true,
      player: {
        x: MAP_SIZE / 2,
        y: MAP_SIZE / 2,
        targetX: MAP_SIZE / 2,
        targetY: MAP_SIZE / 2,
        radius: 15,
        speed: 160,
        facing: 1,
        level: 1,
        statPoints: 0,
        skillPoints: 1,
        baseStats: { ...sect.stats },
        currentStats: { ...sect.stats },
        hp: 300,
        maxHp: 300,
        mp: 100,
        maxMp: 100,
        atk: 25,
        target: null,
        moving: false,
        atkCd: 0,
        dead: false,
        color: sect.color,
        icon: sect.icon,
        equipment: {
          weapon: null,
          armor: null,
          accessory: null,
          special: null
        }
      },
      buffs: {
        dmgMult: 1,
        hpMult: 1,
        cdReduc: 0,
        resMult: 1,
        rlGold: 1,
        rlExp: 1,
        rlExec: 0
      },
      skills: initialSkills,
      entities: [],
      drops: []
    };

    setGameState(initialState);
    entitiesRef.current = [];
    dropsRef.current = [];
    particlesRef.current = [];
    textsRef.current = [];
  };

  if (!gameState) {
    return <SectSelection onSelect={initGame} />;
  }

  return (
    <div className="relative w-full h-screen bg-dark-bg overflow-hidden font-sans text-gray-200 select-none">
      <GameCanvas 
        gameState={gameState} 
        setGameState={setGameState}
        particlesRef={particlesRef}
        textsRef={textsRef}
        entitiesRef={entitiesRef}
        dropsRef={dropsRef}
        sceneryRef={sceneryRef}
        shakeRef={shakeRef}
        addNotification={addNotification}
      />

      <HUD gameState={gameState} onAvatarClick={() => setShowStats(true)} />

      <Sidebar 
        gameState={gameState} 
        onAvatarClick={() => setShowStats(true)} 
        onTargetTextClick={() => {}} 
      />

      <SkillBar 
        gameState={gameState} 
        setGameState={setGameState}
        addNotification={addNotification}
        shakeRef={shakeRef}
        particlesRef={particlesRef}
        textsRef={textsRef}
        entitiesRef={entitiesRef}
        setShowShop={setShowShop}
      />

      <AnimatePresence>
        {showStats && (
          <StatsPopup 
            gameState={gameState}
            setGameState={setGameState}
            onClose={() => setShowStats(false)} 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
         {showShop && (
            <ShopOverlay gameState={gameState} setGameState={setGameState} onClose={() => setShowShop(false)} />
         )}
      </AnimatePresence>

      <AnimatePresence>
        {gameState.state === 'CLEARED' && (
          <StageClearOverlay 
            gameState={gameState}
            setGameState={setGameState}
            addNotification={addNotification}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {gameState.state === 'GAMEOVER' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/90 z-[200] flex flex-col items-center justify-center p-4 backdrop-blur-sm"
          >
            <h1 className="text-red-600 font-serif text-6xl mb-4 italic font-bold drop-shadow-[0_0_20px_rgba(220,38,38,0.5)]">
               BẠI TRẬN
            </h1>
            <p className="text-gray-400 mb-8 max-w-md text-center italic">
               Hành trình giang hồ của bạn dừng lại tại ải {gameState.stage}.
            </p>
            <button 
               onClick={() => setGameState(null)}
               className="px-8 py-3 border border-red-900 bg-red-950/30 text-red-500 hover:bg-red-900/50 hover:text-white rounded font-serif text-xl transition-all"
            >
               Quyết Phục Hận
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications */}
      <div className="fixed top-[30%] left-1/2 -translate-x-1/2 z-[100] pointer-events-none flex flex-col gap-2 items-center">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              style={{ color: n.color, borderColor: n.color }}
              className="bg-black/80 border px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap shadow-lg"
            >
              {n.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

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
import QuestTracker from './components/QuestTracker';
import { getCompanionForSect } from './utils/companionHelper';
import { saveGame, loadGame, clearGameSave } from './utils/storage';
import { getInitialManualsForSect, generateRandomQuest } from './utils/quest';
import { sfx } from './utils/audio';

export default function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'skills' | 'companion'>('stats');
  const [notifications, setNotifications] = useState<{ id: number; text: string; color: string }[]>([]);
  
  const particlesRef = useRef<Particle[]>([]);
  const textsRef = useRef<FloatingText[]>([]);
  const entitiesRef = useRef<Entity[]>([]);
  const dropsRef = useRef<Drop[]>([]);
  const sceneryRef = useRef<{ x: number; y: number; t: number; sz: number }[]>([]);
  const shakeRef = useRef(0);
  const cameraRef = useRef({ x: MAP_SIZE / 2, y: MAP_SIZE / 2 });

  const [geminiEncounters, setGeminiEncounters] = useState<any[] | null>(null);

  // Auto-save & Game state transitions audio trigger
  const lastStateRef = useRef<string | null>(null);
  useEffect(() => {
    if (gameState) {
      if (gameState.state !== 'GAMEOVER') {
        saveGame(gameState);
      }
      
      const currentState = gameState.state;
      if (currentState !== lastStateRef.current) {
        if (currentState === 'CLEARED') {
          sfx.playLevelUp();
        } else if (currentState === 'GAMEOVER') {
          sfx.playGameOver();
        }
        lastStateRef.current = currentState;
      }
    }
  }, [gameState]);

  // Global click audio effect handler for all buttons & interactive regions
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      let target = e.target as HTMLElement | null;
      while (target && target !== document.body) {
        const tagName = target.tagName.toLowerCase();
        const role = target.getAttribute("role");
        const hasCursorPointer = target.classList.contains("cursor-pointer") || target.style.cursor === "pointer";
        
        if (tagName === "button" || role === "button" || hasCursorPointer || target.closest("button") || target.closest('a')) {
          sfx.playClick();
          break;
        }
        target = target.parentElement;
      }
    };

    window.addEventListener("click", handleGlobalClick, { capture: true });
    return () => {
      window.removeEventListener("click", handleGlobalClick, { capture: true });
    };
  }, []);

  // Pre-fetch Gemini encounters when a new stage starts
  useEffect(() => {
    if (gameState?.state === 'PLAYING') {
      setGeminiEncounters(null);
      const fetchEncounters = async () => {
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
          
          if (res.ok) {
            const data = await res.json();
            setGeminiEncounters(data);
          }
        } catch (e) {
          console.error("Failed to prefetch encounters", e);
        }
      };
      
      // Give the stage a short moment to render before firing API
      setTimeout(fetchEncounters, 1000);
    }
  }, [gameState?.state, gameState?.stage]);

  const addNotification = useCallback((text: string, color: string) => {
    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev, { id, text, color }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 2000);
  }, []);

  const handleContinueGame = () => {
    const saved = loadGame();
    if (saved) {
      setGameState(saved);
      entitiesRef.current = saved.entities || [];
      dropsRef.current = saved.drops || [];
      particlesRef.current = [];
      textsRef.current = [];
      // Regenerate scenery
      generateScenery();
    }
  };

  const generateScenery = () => {
    const colWidth = 200;
    const rowHeight = 200;
    const numCols = MAP_SIZE / colWidth; // 20
    const numRows = MAP_SIZE / rowHeight; // 20
    const scenery: { x: number; y: number; t: number; sz: number }[] = [];

    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < numCols; c++) {
        const centerX = MAP_SIZE / 2;
        const centerY = MAP_SIZE / 2;
        const cellCenterX = c * colWidth + colWidth / 2;
        const cellCenterY = r * rowHeight + rowHeight / 2;
        
        // Keep spawning area clear (250px radius around center)
        const distToCenter = Math.hypot(cellCenterX - centerX, cellCenterY - centerY);
        if (distToCenter < 250) {
          continue;
        }
        
        if (Math.random() < 0.80) {
          const jitterX = 30 + Math.random() * (colWidth - 60);
          const jitterY = 30 + Math.random() * (rowHeight - 60);
          
          scenery.push({
            x: c * colWidth + jitterX,
            y: r * rowHeight + jitterY,
            t: Math.floor(Math.random() * 6), // 0 to 5
            sz: 24 + Math.random() * 32
          });
        }
      }
    }
    sceneryRef.current = scenery;
  };

  const initGame = (sectId: string) => {
    // Clear save on new game start
    clearGameSave();

    const sect = SECTS.find(s => s.id === sectId);
    if (!sect) return;

    generateScenery();

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

    const initialState: GameState = {
      state: 'PLAYING',
      stage: 1,
      lives: 2,
      livesBought: 0,
      gold: 0,
      exp: 0,
      mobsTotal: getMobsTotal(1),
      mobsKilled: 0,
      bossSpawned: false,
      stagePhase: 'CREEPS',
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
        rage: 0,
        maxRage: 100,
        rageActive: false,
        rageTimer: 0,
        target: null,
        moving: false,
        atkCd: 0,
        dead: false,
        color: sect.color,
        icon: sect.icon,
        sectId: sectId,
        skillComboHistory: [],
        comboTimer: 0,
        activeCombo: null,
        equipment: {
          weapon: null,
          armor: null,
          accessory: null,
          special: null,
          horse: null,
          cloak: null,
          seal: null,
          banner: null
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
      drops: [],
      livesPurchased: 0,
      companion: getCompanionForSect(sectId),
      quests: [
        generateRandomQuest('A', 1, 'Trầm Tích'),
        generateRandomQuest('B', 1, 'Giang Hồ')
      ],
      manuals: getInitialManualsForSect(sectId)
    };

    setGameState(initialState);
    entitiesRef.current = [];
    dropsRef.current = [];
    particlesRef.current = [];
    textsRef.current = [];
  };

  if (!gameState || gameState.state === 'SELECTING') {
    return <SectSelection onSelect={initGame} onContinue={handleContinueGame} hasSave={!!loadGame()} />;
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
        cameraRef={cameraRef}
        addNotification={addNotification}
      />

      <HUD gameState={gameState} onAvatarClick={() => setShowStats(true)} />

      <Sidebar 
        gameState={gameState} 
        setGameState={setGameState}
        onAvatarClick={() => setShowStats(true)} 
        onTargetTextClick={() => {}} 
        addNotification={addNotification}
      />

      <QuestTracker 
        gameState={gameState} 
        setGameState={setGameState} 
        addNotification={addNotification} 
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
            geminiEncounters={geminiEncounters}
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
      <div className="fixed top-[15%] left-1/2 -translate-x-1/2 z-[100] pointer-events-none flex flex-col gap-2.5 items-center">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 0.85, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.9 }}
              style={{ color: n.color }}
              className="bg-black/60 border border-white/10 px-5 py-2.5 rounded-full text-xs font-serif italic font-bold whitespace-nowrap shadow-[0_4px_15px_rgba(0,0,0,0.5)] backdrop-blur-sm"
            >
              {n.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

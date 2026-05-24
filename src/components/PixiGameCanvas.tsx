import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { GameState, Entity, Particle, Drop } from '../types';

interface Props {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState | null>>;
  particlesRef: React.MutableRefObject<Particle[]>;
  entitiesRef: React.MutableRefObject<Entity[]>;
  dropsRef: React.MutableRefObject<Drop[]>;
}

export default function PixiGameCanvas({ gameState, setGameState, particlesRef, entitiesRef, dropsRef }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Pixi Application
    const initPixi = async () => {
      const app = new PIXI.Application();
      await app.init({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0x1a1a24,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      // Assert containerRef.current is not null before appending
      if (containerRef.current) {
        containerRef.current.appendChild(app.canvas as any);
      }
      appRef.current = app;

      // Add simple ticker for rendering
      app.ticker.add((ticker) => {
        // This is where we will migrate the 2D Context logic 
        // to Pixi Scenegraph / Graphics.
        // E.g., looping through entitiesRef and updating PIXI.Sprite positions
      });
    };

    initPixi();

    return () => {
      if (appRef.current) {
        appRef.current.destroy(true, { children: true });
        appRef.current = null;
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 z-0 overflow-hidden" />
  );
}

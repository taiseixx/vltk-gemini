import { Sect } from "../types";
import { SECTS } from "../constants";
import { motion } from "motion/react";

interface Props {
  onSelect: (id: string) => void;
}

export default function SectSelection({ onSelect }: Props) {
  return (
    <div className="absolute inset-0 bg-dark-bg flex flex-col items-center justify-center z-[100] p-4 overflow-y-auto bg-[radial-gradient(circle_at_center,_#1a1a24_0%,_#050508_100%)] custom-scrollbar">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gold opacity-[0.02] rounded-full blur-3xl pointer-events-none" />

      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-gold text-5xl mb-2 font-serif italic font-bold text-center tracking-wide mt-8 flex items-center justify-center gap-4"
        style={{ textShadow: "0 0 20px rgba(212, 175, 55, 0.8), 0 0 40px rgba(212, 175, 55, 0.4)" }}
      >
        <span className="text-3xl opacity-70">⚔️</span>
        Võ Lâm Giang Hồ
        <span className="text-3xl opacity-70 scale-x-[-1]">⚔️</span>
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-gray-500 mb-8 text-center uppercase tracking-[0.4em] text-xs font-bold"
      >
        Chọn một cơ duyên để khởi điểm hành trình
      </motion.p>

      <div className="grid grid-cols-5 gap-2 sm:gap-6 max-w-[1400px] w-full px-2 pb-12">
        {SECTS.map((sect, i) => (
          <motion.div
            key={sect.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -5, backgroundColor: "#121218", boxShadow: `0 0 30px ${sect.color}80, inset 0 0 20px ${sect.color}40` }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(sect.id)}
            style={{
              boxShadow: `0 0 15px ${sect.color}50`,
            }}
            className="group relative rounded-xl cursor-pointer transition-all hover:scale-105"
          >
            {/* Chasing Fireball Border */}
            <div className="absolute inset-[-2px] rounded-[14px] overflow-hidden opacity-50 group-hover:opacity-100 transition-opacity z-0 pointer-events-none">
              <div 
                className="absolute inset-[-50%] w-[200%] h-[200%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin-slow"
                style={{ background: `conic-gradient(from 0deg, transparent 0%, ${sect.color} 40%, white 48%, transparent 50%, transparent 50%, ${sect.color} 90%, white 98%, transparent 100%)` }}
              />
            </div>
            
            {/* Inner Card */}
            <div className="relative h-full flex flex-col items-center p-3 sm:p-4 bg-[#0c0c12] rounded-xl z-10 transition-colors group-hover:bg-[#121218] overflow-hidden"
                 style={{ boxShadow: `inset 0 0 20px ${sect.color}20` }}>
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none"
                style={{ backgroundColor: sect.color }}
              />
              <div
                className="absolute top-0 left-0 w-full h-1"
                style={{ backgroundColor: sect.color, opacity: 0.5 }}
              />

            <div className="relative w-16 h-16 flex items-center justify-center mb-3 z-10 group-hover:scale-110 transition-transform">
              {/* Chasing Fireballs Ring */}
              <div 
                className="absolute inset-[-3px] rounded-full overflow-hidden animate-spin-fast opacity-70 group-hover:opacity-100"
              >
                <div 
                  className="absolute inset-[-10px]"
                  style={{
                    background: `conic-gradient(from 0deg, transparent 0%, ${sect.color} 40%, white 48%, transparent 50%, transparent 50%, ${sect.color} 90%, white 98%, transparent 100%)`
                  }}
                />
              </div>
              
              {/* Core glow background */}
              <div 
                className="absolute inset-[2px] rounded-full bg-[#0c0c12]"
                style={{
                  boxShadow: `inset 0 0 15px ${sect.color}80, 0 0 15px ${sect.color}50`,
                }}
              />
              {/* Center icon */}
              <div className="relative text-2xl drop-shadow-md" style={{ textShadow: `0 0 10px ${sect.color}, 0 0 20px ${sect.color}` }}>
                {sect.icon}
              </div>
            </div>

            <h3
              className="text-lg sm:text-xl font-serif italic mb-1 transition-colors z-10"
              style={{ color: sect.color, textShadow: `0 0 12px ${sect.color}90, 0 0 25px ${sect.color}60` }}
            >
              {sect.name}
            </h3>

            <p className="text-[9px] text-gray-400 text-center italic mb-3 min-h-[24px] flex items-center z-10 font-serif px-1 leading-tight">
              "{sect.motto}"
            </p>

            <div className="w-full space-y-1.5 pt-3 border-t border-white/10 transition-opacity z-10">
              <div className="flex justify-between text-[10px] font-bold tracking-widest text-gray-300">
                <span className="flex items-center gap-1.5">
                  💪{" "}
                  <span className="opacity-70 text-[8px] uppercase">
                    Sức Mạnh
                  </span>
                </span>
                <span style={{ color: sect.color }}>{sect.stats.str}</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold tracking-widest text-gray-300">
                <span className="flex items-center gap-1.5">
                  🏃{" "}
                  <span className="opacity-70 text-[8px] uppercase">
                    Thân Pháp
                  </span>
                </span>
                <span style={{ color: sect.color }}>{sect.stats.agi}</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold tracking-widest text-gray-300">
                <span className="flex items-center gap-1.5">
                  ❤️{" "}
                  <span className="opacity-70 text-[8px] uppercase">
                    Sinh Khí
                  </span>
                </span>
                <span style={{ color: sect.color }}>{sect.stats.con}</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold tracking-widest text-gray-300">
                <span className="flex items-center gap-1.5">
                  🧠{" "}
                  <span className="opacity-70 text-[8px] uppercase">
                    Trí Tuệ
                  </span>
                </span>
                <span style={{ color: sect.color }}>{sect.stats.int}</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold tracking-widest text-gray-300">
                <span className="flex items-center gap-1.5">
                  🌀{" "}
                  <span className="opacity-70 text-[8px] uppercase">
                    Nội Lực
                  </span>
                </span>
                <span style={{ color: sect.color }}>{sect.stats.nei}</span>
              </div>
            </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

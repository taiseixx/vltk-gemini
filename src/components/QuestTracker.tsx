import { useState } from 'react';
import { GameState, Quest, Rarity, HeritagePrefix } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy, Scroll, Eye, ChevronLeft, Award, CheckCircle2, ChevronDown, ChevronUp, Star, Lock } from 'lucide-react';
import { RARITY_COLORS } from '../constants';
import { HERITAGE_BADGES } from '../utils/quest';
// @ts-ignore
import equipmentBg from '../assets/images/equipment_bg_1779367218827.png';

interface Props {
  gameState: GameState;
  setGameState: (updater: (prev: GameState | null) => GameState | null) => void;
  addNotification: (text: string, color: string) => void;
}

export default function QuestTracker({ gameState, setGameState, addNotification }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [claimScreenQuest, setClaimScreenQuest] = useState<Quest | null>(null);

  const quests = gameState.quests ? gameState.quests.filter(q => q.status !== 'claimed') : [];

  if (quests.length === 0) return null;

  // Handle claiming quest reward
  const handleClaimQuest = (quest: Quest) => {
    setGameState((prev) => {
      if (!prev) return null;
      
      // Mark as claimed
      const updatedQuests = prev.quests ? prev.quests.map(q => {
        if (q.id === quest.id) {
          return { ...q, status: 'claimed' as const };
        }
        return q;
      }) : [];

      // Award gold & exp
      let goldAward = quest.rewardValue.gold;
      let expAward = quest.rewardValue.exp;

      // Drop random equipment of the quest's specified rarity and heritage prefix
      const eqTypes: Array<'weapon' | 'armor' | 'accessory' | 'special' | 'horse' | 'cloak' | 'seal' | 'banner'> = [
        'weapon', 'armor', 'accessory', 'special', 'horse', 'cloak', 'seal', 'banner'
      ];
      const randomType = eqTypes[Math.floor(Math.random() * eqTypes.length)];
      
      const equipNames: Record<string, string> = {
        weapon: 'Bảo Đao Thủy Mặc',
        armor: 'Giáp Lân Phục Đạo',
        accessory: 'Huyền Chỉ Hoàn',
        special: 'Văn Kinh Cực Lạc',
        horse: 'Chiến Mã Vân Phong',
        cloak: 'Phi Phong Huyết Tịnh',
        seal: 'Ấn Tiên Môn',
        banner: 'Hạo Thiên Phù Kỳ'
      };

      const newLoot = {
        type: randomType,
        rarity: quest.rewardValue.equipRarity,
        power: prev.stage * 12 + Math.floor(Math.random() * 10),
        name: `💎 [${quest.rewardValue.equipPrefix.toUpperCase()}] ${equipNames[randomType]}`,
        tier: Math.min(9, Math.max(1, Math.floor(prev.stage / 2))),
        heritage: quest.rewardValue.equipPrefix
      };

      let p = { ...prev.player };
      // Try Auto-equipping if empty or stronger
      const current = p.equipment[randomType];
      if (!current || newLoot.power > current.power) {
        p.equipment[randomType] = newLoot;
        addNotification(`🎒 TỰ ĐỘNG TRANG BỊ: ${newLoot.name}!`, '#3498db');
      } else {
        // Recycle to gold
        const goldVal = Math.floor(newLoot.power * 10);
        goldAward += goldVal;
        addNotification(`♻️ Bản trùng vị nén, thu hồi [${newLoot.name}] quy đổi +${goldVal} Vàng!`, '#f1c40f');
      }

      // Exp and Level Up processing
      let newExp = prev.exp + expAward;
      let newLevel = p.level;
      let newStatPts = p.statPoints;
      let newSkillPts = p.skillPoints;
      const maxExp = Math.floor(100 * Math.pow(1.2, newLevel - 1));
      
      if (newExp >= maxExp) {
        newExp -= maxExp;
        newLevel++;
        newStatPts += 5;
        if (newLevel % 3 === 0) newSkillPts++;
        addNotification(`💥 CHÚC MỪNG: LÊN CẤP ${newLevel}!`, "#f1c40f");
      }

      p.level = newLevel;
      p.statPoints = newStatPts;
      p.skillPoints = newSkillPts;

      // Re-trigger stats recalculations directly to maintain balance
      const eq = p.equipment;
      prev.buffs.dmgMult = 1 + (eq.weapon ? eq.weapon.power * 0.02 : 0);
      prev.buffs.hpMult = 1 + (eq.armor ? eq.armor.power * 0.012 : 0);
      p.maxHp = Math.floor((300 + p.currentStats.con * 20) * prev.buffs.hpMult);
      p.atk = Math.floor((25 + p.currentStats.str * 3) * prev.buffs.dmgMult);

      return {
        ...prev,
        quests: updatedQuests,
        gold: prev.gold + goldAward,
        exp: newExp,
        player: p
      };
    });

    addNotification(`🎁 Nhận thưởng Nhiệm Vụ thành công!`, '#2ecc71');
    setSelectedQuest(null);
    setClaimScreenQuest(quest);
  };

  const getDifficultyColor = (diff: Quest['difficulty']) => {
    switch (diff) {
      case 'Trầm Tích': return 'text-zinc-400 border-zinc-500/30';
      case 'Giang Hồ': return 'text-blue-400 border-blue-500/30';
      case 'Tông Môn': return 'text-amber-500 border-amber-500/30';
      case 'Hoàng Kim': return 'text-yellow-400 border-yellow-500/40 shadow-[0_0_8px_rgba(241,196,15,0.2)]';
    }
  };

  const activeCount = quests.filter(q => q.status === 'active' || q.status === 'completed').length;

  return (
    <>
      {/* 1. FLOATING MINI WIDGET BELOW MINIMAP */}
      <div 
        className={`fixed z-40 bg-black/90 backdrop-blur-xl rounded-xl border border-amber-500/20 shadow-2xl overflow-hidden pointer-events-auto transition-all duration-300 ${collapsed ? 'w-auto max-w-[100px] p-2' : 'max-w-[230px] w-52 p-2.5'}`}
        style={{
          left: '12px',
          top: window.innerWidth < 768 ? '185px' : '250px',
          backgroundImage: `url(${equipmentBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'overlay',
          boxShadow: '0 12px 40px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}
        id="wuxia-panel-quest-tracker"
      >
        <div className={`flex items-center justify-between ${collapsed ? '' : 'border-b border-amber-500/10 pb-2 mb-2'} relative z-10`}>
          <div className="flex items-center gap-2" onClick={() => collapsed && setCollapsed(false)} style={{cursor: collapsed ? 'pointer': 'default'}}>
            <div className={`flex items-center justify-center rounded-full bg-amber-950/40 border ${collapsed ? 'w-8 h-8 border-amber-500/50' : 'w-5 h-5 border-amber-500/30'}`}>
              <Scroll className={collapsed ? 'w-4 h-4 text-amber-400 drop-shadow-md' : 'w-3 h-3 text-amber-400'} />
            </div>
            {!collapsed ? (
              <h3 className="font-serif font-black text-[11px] text-[#fcfbf9] uppercase tracking-widest drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                Kỳ Sự ({activeCount}/3)
              </h3>
            ) : (
              <span className="font-black text-amber-400 font-sans text-sm drop-shadow-md pr-1">{activeCount}/3</span>
            )}
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed(!collapsed);
            }}
            className="text-amber-500 hover:text-amber-300 transition-colors p-0.5 bg-black/40 hover:bg-black/60 rounded border border-amber-500/20 active:scale-95 cursor-pointer relative z-20 shrink-0"
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        <AnimatePresence>
          {!collapsed && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-2 max-h-[290px] overflow-y-auto pr-1"
            >
              {quests.map(quest => {
                const isClaimed = quest.status === 'claimed';
                if (isClaimed) return null;

                const isAvailable = quest.status === 'available';
                const isCompleted = quest.status === 'completed';
                const percent = Math.floor((quest.currentCount / quest.targetCount) * 100);

                return (
                  <div 
                    key={quest.id} 
                    className="p-1.5 rounded bg-amber-950/25 border border-amber-900/40 hover:bg-amber-950/45 transition-colors group cursor-pointer"
                    onClick={() => setSelectedQuest(quest)}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <span className="font-serif text-[11px] font-bold text-gray-100 group-hover:text-amber-300 transition-colors line-clamp-1">
                        {quest.title}
                      </span>
                      <span className={`text-[8px] font-bold px-1 py-0.2 bg-black/30 rounded border leading-none shrink-0 ${getDifficultyColor(quest.difficulty)}`}>
                        {quest.difficulty.toUpperCase()}
                      </span>
                    </div>

                    {isAvailable ? (
                      <div className="flex justify-between items-center text-[9px] text-gray-400 mt-1">
                        <span>Chưa nhận sự vụ</span>
                        <span className="text-amber-400 font-bold group-hover:underline">Ấn xem ➔</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] text-gray-300">
                          <span className={isCompleted ? "text-green-400 font-extrabold flex items-center gap-0.5" : "text-gray-400"}>
                            {isCompleted ? "✓ Hoàn Thành" : `${quest.currentCount}/${quest.targetCount}`}
                          </span>
                          <span className="text-[8px] text-amber-500 font-extrabold">{percent}%</span>
                        </div>
                        <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${isCompleted ? 'bg-green-500 shadow-[0_0_4px_rgba(74,222,128,0.5)]' : 'bg-amber-500'}`} 
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. CHINESE INK PARCHMENT DETAIL MODAL POPUP */}
      <AnimatePresence>
        {selectedQuest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm pointer-events-auto">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="bg-[#f0f9f3] text-[#334e36] rounded-2xl border-4 border-amber-900/80 shadow-[0_0_32px_rgba(0,0,0,0.8)] overflow-hidden max-w-lg w-full font-serif flex flex-col relative"
              style={{
                backgroundImage: 'radial-gradient(ellipse at center, rgba(254,251,245,0.95) 0%, rgba(240,233,219,0.98) 100%)',
                boxShadow: 'inset 0 0 40px rgba(139,94,26,0.15), 0 10px 30px rgba(0,0,0,0.5)'
              }}
            >
              {/* Classical Header Ornaments */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-900 via-yellow-700 to-amber-900" />
              
              {/* Quest Banner Backdrop (Wuxia Ink-Style) */}
              <div className="relative w-full h-36 border-b-2 border-amber-900/30 overflow-hidden shrink-0">
                <img 
                  src={selectedQuest.banner} 
                  alt="Quest Banner" 
                  className="w-full h-full object-cover grayscale-[30%] opacity-85 hover:grayscale-0 transition-all duration-500" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#fcfbf9]/95 via-transparent to-black/40" />
                
                {/* Close Button Inside Banner */}
                <button 
                  onClick={() => setSelectedQuest(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 border border-amber-900/30 text-amber-200 flex items-center justify-center hover:bg-black/80 hover:scale-105 active:scale-95 transition-all text-sm font-sans"
                >
                  ✕
                </button>

                {/* Left Floating Title */}
                <div className="absolute bottom-3 left-4">
                  <span className={`text-[10px] uppercase font-sans tracking-widest font-extrabold px-2 py-0.5 rounded-full border bg-[#fcfbf9]/95 flex items-center gap-1 w-fit mb-1 ${getDifficultyColor(selectedQuest.difficulty)}`}>
                    <Star className="w-2.5 h-2.5 fill-current" />
                    Độ khó: {selectedQuest.difficulty}
                  </span>
                  <h2 className="text-xl font-black text-amber-950 font-serif filter drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)] leading-tight">
                    {selectedQuest.title}
                  </h2>
                </div>
              </div>

              {/* Quest Body Scroll Content */}
              <div className="p-5 overflow-y-auto space-y-4 max-h-[350px]">
                <div className="border-l-4 border-amber-900/40 pl-3 leading-relaxed text-sm italic text-emerald-950/80">
                  {selectedQuest.description}
                </div>

                {/* Progress Indicators */}
                {selectedQuest.status !== 'available' && (
                  <div className="bg-amber-950/5 p-3 rounded-xl border border-amber-900/10 space-y-1.5">
                    <span className="text-xs uppercase font-sans tracking-widest font-extrabold text-[#5c3c13]">Tiến độ võ hành:</span>
                    <div className="flex justify-between items-center text-sm font-serif text-amber-950">
                      <span className="font-extrabold">
                        {selectedQuest.status === 'completed' ? '✓ Đã Đạt Mục Tiêu' : `Phục ma trảm quỷ: ${selectedQuest.currentCount} / ${selectedQuest.targetCount}`}
                      </span>
                      <span className="font-sans font-bold text-amber-800">
                        {Math.floor((selectedQuest.currentCount / selectedQuest.targetCount) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-amber-900/15 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${selectedQuest.status === 'completed' ? 'bg-emerald-600' : 'bg-amber-600'}`}
                        style={{ width: `${(selectedQuest.currentCount / selectedQuest.targetCount) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Hidden / Revealed Reward Module */}
                <div className="border-t border-amber-900/15 pt-4 space-y-2">
                  <h3 className="text-sm uppercase font-sans tracking-widest font-extrabold text-[#5c3c13] flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-600" />
                    Phần thưởng sự vụ
                  </h3>

                  {selectedQuest.status !== 'completed' && selectedQuest.status !== 'claimed' ? (
                    // QUEST INACTIVE OR ACTIVE NOT COMPLETED -> REWARDS ARE UNKNOWN (rule requested!)
                    <div className="p-4 rounded-xl border-2 border-dashed border-amber-800/20 bg-amber-900/[0.02] flex flex-col items-center justify-center text-center py-6">
                      <Lock className="w-8 h-8 text-amber-700/60 animate-bounce mb-2" />
                      <span className="text-sm font-black text-amber-950/80">Võ Lâm Mật Ấn Hộ Lộc</span>
                      <span className="text-xs text-amber-900/60 mt-1 max-w-[280px] leading-relaxed">
                        Sự vụ chưa chính thức hoàn thành. Quà tặng thù bảo hiển danh vẫn nằm trong mật thư chỉ có thể mở niêm phong khi hoàn tất mục tiêu dẹp phỉ ác gian.
                      </span>
                      <div className="mt-3.5 px-3 py-1 rounded bg-[#ded2bc] text-[10px] font-sans font-extrabold text-amber-950 uppercase tracking-widest border border-amber-905">
                        {selectedQuest.rewardLabel}
                      </div>
                    </div>
                  ) : (
                    // QUEST LOG COMPLETED -> SHOW REVEALED EXTRAVAGANT REWARDS!
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-[#e4edd4] border border-[#a8c98c]/30 rounded-xl p-3 flex flex-col items-center text-center shadow-xs">
                        <span className="text-[10px] uppercase font-sans tracking-wider font-extrabold text-emerald-800">EXP Tu Vi</span>
                        <div className="text-lg font-black font-sans text-emerald-950 tracking-tight mt-1">
                          +{selectedQuest.rewardValue.exp}
                        </div>
                        <span className="text-[9px] text-[#2ebd2e] font-sans font-bold">Kinh Nghiệm</span>
                      </div>

                      <div className="bg-[#fcedcd] border border-[#e8c07c]/30 rounded-xl p-3 flex flex-col items-center text-center shadow-xs">
                        <span className="text-[10px] uppercase font-sans tracking-wider font-extrabold text-amber-800">Thương Hà Vàng</span>
                        <div className="text-lg font-black font-sans text-amber-950 tracking-tight mt-1">
                          +{selectedQuest.rewardValue.gold}
                        </div>
                        <span className="text-[9px] text-[#b67e23] font-sans font-bold">Lượng Ngân</span>
                      </div>

                      {/* Premium Specific Heritage Weapon Drop Badge */}
                      <div className="bg-[#ebd9f7] border border-[#cfabeb]/30 rounded-xl p-3 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                        <span className="absolute top-1 text-[8.5px] uppercase font-sans tracking-wider font-extrabold text-purple-800">Bảo Tích</span>
                        <div className="mt-3 w-7 h-7 rounded-sm flex items-center justify-center bg-purple-950/20 text-md font-sans font-bold shadow-xs">
                          {HERITAGE_BADGES[selectedQuest.rewardValue.equipPrefix]?.text || '失'}
                        </div>
                        <span className="text-[8.5px] font-black font-sans text-purple-950/80 leading-none mt-1.5 uppercase tracking-tighter">
                          {selectedQuest.rewardValue.equipPrefix} Rơi
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* parchment Footer Action Buttons */}
              <div className="p-4 bg-amber-950/5 border-t border-amber-900/10 shrink-0 flex items-center justify-end gap-2.5">
                {selectedQuest.status === 'available' ? (
                  /* QUEST IS AVAILABLE -> USER CAN ACCEPT IT */
                  <button
                    onClick={() => {
                      setGameState(prev => {
                        if (!prev) return null;
                        // Max 3 active/completed quests
                        const activeCount = prev.quests ? prev.quests.filter(q => q.status === 'active' || q.status === 'completed').length : 0;
                        if (activeCount >= 3) {
                          addNotification('⚠️ Đã thực thi tối đa 3 nhiệm vụ cùng một lúc!', '#e74c3c');
                          return prev;
                        }
                        return {
                          ...prev,
                          quests: prev.quests ? prev.quests.map(q => q.id === selectedQuest.id ? { ...q, status: 'active' as const } : q) : []
                        };
                      });
                      addNotification(`🐎 Nhận thành công: [${selectedQuest.title}]!`, '#f1c40f');
                      setSelectedQuest(null);
                    }}
                    className="w-full py-3 bg-gradient-to-r from-amber-800 via-amber-700 to-amber-800 hover:from-amber-700 hover:to-amber-600 text-white font-serif font-bold text-center rounded-xl border border-amber-950 shadow-md transform hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
                  >
                    🤝 Chấp Nhận Kỳ Sự (Nhận tối đa 3)
                  </button>
                ) : selectedQuest.status === 'completed' ? (
                  /* QUEST IS COMPLETED -> SUBMIT & RECEIVE REWARDS WITH CELEBRATORY LORE TEXT */
                  <button
                    onClick={() => handleClaimQuest(selectedQuest)}
                    className="w-full py-3 bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-700 hover:from-emerald-600 hover:to-emerald-500 text-white font-serif font-extrabold text-center rounded-xl border border-emerald-950 shadow-[0_0_12px_rgba(16,185,129,0.3)] transform hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer animate-pulse"
                  >
                    🎁 Nộp Nhiệm Vụ & Phong Thưởng Bảo Vật
                  </button>
                ) : (
                  /* QUEST ACTIVE BUT NOT COMPLETED YET -> REJECT / RETURN */
                  <div className="w-full flex gap-2">
                    <button
                      onClick={() => {
                        setGameState(prev => {
                          if (!prev) return null;
                          return {
                            ...prev,
                            quests: prev.quests ? prev.quests.map(q => q.id === selectedQuest.id ? { ...q, status: 'available' as const, currentCount: 0 } : q) : []
                          };
                        });
                        addNotification(`Huỷ bỏ thực thi nhiệm vụ: ${selectedQuest.title}`, '#95a5a6');
                        setSelectedQuest(null);
                      }}
                      className="px-3 py-2 bg-red-900/10 hover:bg-red-900/15 border border-red-900/25 text-red-900 rounded-lg text-xs"
                    >
                      Từ bỏ nhiệm vụ
                    </button>
                    <button
                      onClick={() => setSelectedQuest(null)}
                      className="flex-1 py-2.5 bg-amber-900/10 hover:bg-amber-900/15 border border-amber-900/30 text-amber-950 font-bold rounded-lg text-center text-xs"
                    >
                      Quay Lại Hành Tẩu
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. CLAIMED SUCCESS SCREEN WITH CONTEXT-APPROPRIATE FLAVOR TEXT */}
      <AnimatePresence>
        {claimScreenQuest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md pointer-events-auto">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="bg-[#2a1305] text-[#ebdcc5] rounded-3xl border-4 border-[#d4af37] p-6 max-w-md w-full font-serif text-center relative shadow-[0_0_50px_rgba(212,175,55,0.4)]"
            >
              {/* Gold sparkling circle */}
              <div className="mx-auto w-16 h-16 rounded-full bg-[#d4af37]/20 border border-[#d4af37] flex items-center justify-center mb-4">
                <CheckCircle2 className="w-9 h-9 text-[#f1c40f]" />
              </div>

              <h2 className="text-2xl font-black text-white font-serif leading-tight">
                Hoàn Thành Hào Sự!
              </h2>
              <p className="text-[#bf9d65] font-sans uppercase font-extrabold text-xs mt-1 tracking-widest">
                Phục vụ võ môn phong tước
              </p>

              {/* Context appropriate thank-you text in classical tone */}
              <div className="border-y border-[#d4af37]/25 my-4 py-4 px-2 italic text-[#decfa6] text-sm leading-relaxed">
                {claimScreenQuest.type === 'escort' && (
                  `"Nhờ hào trượng phu dũng oai xuất lĩnh, tiêu đầu vạn sự hanh thông. Phỉ tặc thấy bóng thương múa giáo tung binh đã run rẩy từ quan ải. Tiêu cục đại tạ phong kiếm, kính dâng chút bạc lượng giang hồ lộc ngọc!"`
                )}
                {claimScreenQuest.type === 'jailbreak' && (
                  `"Tiếng gông xiềng gãy nát vang động nha phủ, hiệp sĩ mở khóa giải nạn giúp đồng đạo ta toàn mạng trở về núi. Sự vụ ngục đài lần này đã tạc danh ân đức thiên hạ, xin dâng chút kiếm lệnh môn phái đáp lễ chí cao lý trường!"`
                )}
                {claimScreenQuest.type === 'sect' && (
                  `"Tu vi tông môn tích đức dài sâu, Trưởng Giáo Sư tôn nhận hỉ duyệt truyền hạ tu vi đan dược. Ngươi quả không hổ danh dũng sĩ cốt cán đệ tử bản giáo. Hãy tiếp nhận kiếm phong thừa truyền đại danh tông phái!"`
                )}
                {claimScreenQuest.type === 'songjin' && (
                  `"Chiến cổ báo tin biên thành khải hoàn, tướng giặc đã rụng đầu dưới chân chiến mã của ngài! Quân dân lưỡng quốc vạn thuở ghi ơn phong tước trảm giặc biên cương bảo vệ sơn hà xã tắc Thần Châu. Bảo lộc phong trần xứng đáng quy tụ về dũng sĩ tối vinh!"`
                )}
                {!['escort', 'jailbreak', 'sect', 'songjin'].includes(claimScreenQuest.type) && (
                  `"Trọng nghĩa khinh tài bảo tiêu thành đạt, tà nhân lui rũ triệt hạ. Giang hồ vạn thế thanh tịnh bái minh hiệp khách dũng tướng dấn bước oai phong!"`
                )}
              </div>

              <div className="space-y-1 mt-4">
                <p className="text-xs text-stone-400 font-sans uppercase tracking-[0.1em] mb-1">Thiết lộc bồi đắp:</p>
                <div className="flex justify-center gap-4">
                  <span className="text-sm font-bold text-yellow-500">💰 +{claimScreenQuest.rewardValue.gold} Vàng</span>
                  <span className="text-sm font-bold text-green-400">⚡ +{claimScreenQuest.rewardValue.exp} EXP</span>
                  <span className="text-sm font-bold text-purple-400 font-sans">⚔️ Mặc cổ đan thạch</span>
                </div>
              </div>

              <button
                onClick={() => setClaimScreenQuest(null)}
                className="mt-6 w-full py-2.5 bg-[#d4af37] hover:bg-[#e8c07c] text-slate-950 font-serif font-black text-center rounded-xl pointer-events-auto transform hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
              >
                Tiếp Tục Hành Tẩu Giang Hồ
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

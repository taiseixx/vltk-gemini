import { Sect } from "../types";
import { SECTS } from "../constants";
import { motion } from "motion/react";

const SECT_DESCRIPTIONS: Record<string, { desc: string; style: string; weapon: string }> = {
  sl: {
    desc: "Khởi nguồn từ Thiền Tông, võ học nội ngoại kiêm tu, Kim Cang Hộ Thể phản kích dũng mãnh, Sinh Khí đứng đầu quần môn.",
    style: "Cực Hạn Chống Chịu - Kim Cang Thể",
    weapon: "Bắc Hải Thiền Côn & Chưởng"
  },
  vd: {
    desc: "Thái Cực huyền công vô lượng, lấy nhu khắc cương, Trí Tuệ thâm sâu điều hòa tuần hoàn kiếm khí giúp công thủ toàn diện.",
    style: "Dĩ Nhu Khắc Cương - Thái Cực Lực",
    weapon: "Lưỡng Nghi Phục Ma Kiếm"
  },
  cb: {
    desc: "Hàng Long dũng lực vô cương, đả cẩu quất đảo thiên lý. Sức Mạnh tuyệt đỉnh, thế công cuồng bạo làm áp đảo vạn binh.",
    style: "Quần Long Quá Hải - Cuồng Bạo Lực",
    weapon: "Đả Bang Côn & Hàng Long Chưởng"
  },
  nm: {
    desc: "Phật âm thanh tịnh phổ độ quần sinh dạt dào sinh ý, kiếm pháp phiêu dật nhuốm màu tiên khí giúp hồi phục chân nguyên toàn diện.",
    style: "Phổ Độ Phục Hồi - Cửu Âm Thư",
    weapon: "Ngọc Nữ Phong Ấn Kiếm"
  },
  cl: {
    desc: "Kiếm khí tựa thần lôi sấm giật, thân pháp biến ảo nhanh như lôi điện, lôi động cửu thiên quyết định sát phạt chớp nhoáng.",
    style: "Tốc Độ & Bạo Kích Thần Lôi",
    weapon: "Lôi Điệp Tuyệt Ảnh Kiếm"
  },
  nd: {
    desc: "Độc thủ quỷ dị bủa vây thiên hạ, vạn linh phệ hồn phá hủy phòng ngự địch nhân, ăn mòn sinh mệnh vô song vô ảnh vô hình.",
    style: "Cổ Độc Xói Mòn Vô Song",
    weapon: "Ngũ Độc Sa & Xuy Tâm độc thương"
  },
  tm: {
    desc: "Mê hồn trận quỷ ảnh quấn thân, ám khí phi châm bách phát bách trúng liên hoàn tiễn cự ly cực viễn áp chế quần phong.",
    style: "Ám Khí Viễn Trình & Thân Pháp",
    weapon: "Lê Hoa Thiên Địa Phi Trâm"
  },
  ty: {
    desc: "Tuyết sương ngưng tụ hộ thể huyền băng diệu thủ, tinh tú lăng ba vi bộ tiễn biến ảo phòng thủ vững chắc khắc chế nghịch cảnh.",
    style: "Huyền Băng Hộ Thể - Lăng Ba Bộ",
    weapon: "Băng Tức Kiếm Khí & Tuyết Quyết"
  },
  tv: {
    desc: "Thiên Vương dũng tướng kiêu hùng, thương phạt bá vương hùng hồn quyết chí, càn quét vạn binh lính sa trường kiên cường.",
    style: "Thương Vương Chiến Ý - Địch Vạn Quân",
    weapon: "Bá Vương Thương & Hoành Tảo Chuy"
  },
  tn: {
    desc: "Ma diệm liệt hỏa hung tàn thiêu rụi trời đất, chiến thế dâng trào tàn bạo diện rộng biến ảo vô lường tựa hỏa độc hỏa ma.",
    style: "Ma Diệm Phần Thiên - Liệt Hỏa Sa",
    weapon: "Ma Vũ Song Đao & Hỏa Kích"
  }
};

interface Props {
  onSelect: (id: string) => void;
}

export default function SectSelection({ onSelect }: Props) {
  return (
    <div className="absolute inset-0 bg-dark-bg flex flex-col items-center justify-start xl:justify-center z-[100] p-3 md:p-6 overflow-y-auto overflow-x-hidden w-full max-w-full bg-[radial-gradient(circle_at_center,_#1a1a24_0%,_#050508_100%)] custom-scrollbar">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gold opacity-[0.02] rounded-full blur-3xl pointer-events-none" />

      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-gold text-2xl sm:text-4xl md:text-5xl mb-1 md:mb-2 font-serif italic font-bold text-center tracking-wide mt-6 md:mt-8 flex items-center justify-center gap-1.5 sm:gap-4 flex-wrap"
        style={{ textShadow: "0 0 20px rgba(212, 175, 55, 0.8), 0 0 40px rgba(212, 175, 55, 0.4)" }}
      >
        <span className="text-lg sm:text-2xl md:text-3xl opacity-70">⚔️</span>
        Võ Lâm Giang Hồ
        <span className="text-lg sm:text-2xl md:text-3xl opacity-70 scale-x-[-1]">⚔️</span>
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-gray-500 mb-6 md:mb-8 text-center uppercase tracking-[0.1em] sm:tracking-[0.4em] text-[8px] sm:text-xs font-bold px-2"
      >
        Chọn một cơ duyên để khởi điểm hành trình
      </motion.p>

      <div className="grid grid-cols-5 gap-1.5 sm:gap-4 md:gap-5 lg:gap-6 max-w-[1240px] w-full px-1 sm:px-4 pb-16">
        {SECTS.map((sect, i) => (
          <motion.div
            key={sect.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -4, backgroundColor: "#121218", boxShadow: `0 0 24px ${sect.color}70, inset 0 0 15px ${sect.color}30` }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(sect.id)}
            style={{
              boxShadow: `0 0 10px ${sect.color}30`,
            }}
            className="group relative rounded-xl cursor-pointer transition-all"
          >
            {/* Chasing Fireball Border */}
            <div className="absolute inset-[-1px] sm:inset-[-1.5px] rounded-[13px] overflow-hidden opacity-40 group-hover:opacity-100 transition-opacity z-0 pointer-events-none">
              <div 
                className="absolute inset-[-50%] w-[200%] h-[200%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin-slow"
                style={{ background: `conic-gradient(from 0deg, transparent 0%, ${sect.color} 40%, white 48%, transparent 50%, transparent 50%, ${sect.color} 90%, white 98%, transparent 100%)` }}
              />
            </div>
            
            {/* Inner Card */}
            <div className="relative h-full flex flex-col items-center p-1 sm:p-4 bg-[#0c0c12] rounded-xl z-10 transition-colors group-hover:bg-[#121218] overflow-hidden"
                 style={{ boxShadow: `inset 0 0 15px ${sect.color}15` }}>
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none"
                style={{ backgroundColor: sect.color }}
              />
              <div
                className="absolute top-0 left-0 w-full h-0.5 sm:h-1"
                style={{ backgroundColor: sect.color, opacity: 0.5 }}
              />

            <div className="relative w-8 h-8 sm:w-16 sm:h-16 flex items-center justify-center mb-1 sm:mb-3 z-10 group-hover:scale-110 transition-transform">
              {/* Chasing Fireballs Ring */}
              <div 
                className="absolute inset-[-1.5px] sm:inset-[-2px] rounded-full overflow-hidden animate-spin-fast opacity-60 group-hover:opacity-100"
              >
                <div 
                  className="absolute inset-[10%] top-0 left-0"
                  style={{
                    background: `conic-gradient(from 0deg, transparent 0%, ${sect.color} 40%, white 48%, transparent 50%, transparent 50%, ${sect.color} 90%, white 98%, transparent 100%)`
                  }}
                />
              </div>
              
              {/* Core glow background */}
              <div 
                className="absolute inset-[1px] sm:inset-[1.5px] rounded-full bg-[#0c0c12]"
                style={{
                  boxShadow: `inset 0 0 12px ${sect.color}70, 0 0 10px ${sect.color}40`,
                }}
              />
              {/* Center icon */}
              <div className="relative text-xs sm:text-2xl drop-shadow-md" style={{ textShadow: `0 0 8px ${sect.color}, 0 0 15px ${sect.color}` }}>
                {sect.icon}
              </div>
            </div>

            <h3
              className="text-[9px] sm:text-lg md:text-xl font-serif italic mb-0.5 sm:mb-1 transition-colors z-10 text-center font-bold"
              style={{ color: sect.color, textShadow: `0 0 10px ${sect.color}80, 0 0 20px ${sect.color}50` }}
            >
              {sect.name}
            </h3>

            <p className="text-[10px] sm:text-xs text-gray-300 text-center italic mt-1.5 mb-2.5 min-h-[28px] sm:min-h-[36px] flex items-center justify-center z-10 font-serif px-1.5 leading-relaxed tracking-wide bg-gradient-to-r from-transparent via-white/5 to-transparent py-1 w-full border-y border-white/5"
               style={{ textShadow: `0 0 8px ${sect.color}40` }}>
              “{sect.motto}”
            </p>

            <div className="w-full pt-1 sm:pt-3 border-t border-white/10 transition-opacity z-10">
              {/* Desktop detailed view */}
              <div className="hidden sm:block space-y-1.5">
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

              {/* Huyền Học Tông Môn & Chi Tiết Võ Học */}
              <div className="hidden sm:block mt-3 pt-3 border-t border-white/5 space-y-2 text-left z-10 w-full">
                <div className="text-[10px] font-bold uppercase tracking-wider text-gold font-serif flex items-center gap-1">
                  📜 Huyền Học Tông Môn
                </div>
                <p className="text-[10.5px] text-gray-400 leading-relaxed font-serif italic text-justify px-1 min-h-[64px]">
                  {SECT_DESCRIPTIONS[sect.id]?.desc}
                </p>
                <div className="space-y-1 text-[9.5px] bg-black/40 p-2 rounded border border-white/5 font-serif">
                  <div className="flex justify-between text-gray-400">
                    <span className="opacity-75">Sở Trường:</span>
                    <span className="font-bold text-gray-200">{SECT_DESCRIPTIONS[sect.id]?.weapon}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span className="opacity-75">Tâm Pháp:</span>
                    <span className="font-bold" style={{ color: sect.color }}>{SECT_DESCRIPTIONS[sect.id]?.style}</span>
                  </div>
                </div>
                
                <div className="pt-2">
                  <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1.5 font-sans">Võ Học Bản Môn:</div>
                  <div className="flex flex-wrap gap-1">
                    {sect.skills.slice(0, 3).map((sk, idx) => (
                      <span 
                        key={idx} 
                        className="text-[8.5px] px-2 py-0.5 rounded font-serif font-bold tracking-wide border transition-all"
                        style={{ 
                          backgroundColor: `${sect.color}10`, 
                          borderColor: `${sect.color}25`, 
                          color: sect.color,
                          boxShadow: `0 0 5px ${sect.color}10`
                        }}
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mobile micro-inline view */}
              <div className="flex sm:hidden justify-around text-[6.5px] font-sans font-bold text-gray-350 gap-0.5 mt-0.5 flex-wrap">
                <span className="flex items-center gap-0.5">💪<span style={{ color: sect.color }}>{sect.stats.str}</span></span>
                <span className="flex items-center gap-0.5">🏃<span style={{ color: sect.color }}>{sect.stats.agi}</span></span>
                <span className="flex items-center gap-0.5">❤️<span style={{ color: sect.color }}>{sect.stats.con}</span></span>
                <span className="flex items-center gap-0.5">🧠<span style={{ color: sect.color }}>{sect.stats.int}</span></span>
                <span className="flex items-center gap-0.5">🌀<span style={{ color: sect.color }}>{sect.stats.nei}</span></span>
              </div>
            </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

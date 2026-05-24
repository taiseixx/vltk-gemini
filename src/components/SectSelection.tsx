import React, { useState } from "react";
import { Sect } from "../types";
import { SECTS } from "../constants";
import { motion } from "motion/react";
// @ts-ignore
import bannerImg from "../assets/images/game_intro_banner_1779309969305.png";
// @ts-ignore
import womenBannerImg from "../assets/images/volam_women_banner_1779373260490.png";
// @ts-ignore
import powerImg from "../assets/images/volam_masculine_power_1779382205841.png";
// @ts-ignore
import mysticImg from "../assets/images/volam_philosophical_mystic_1779382228296.png";
// @ts-ignore
import eleganceImg from "../assets/images/volam_feminine_elegance_1779382251364.png";
// @ts-ignore
import poisonImg from "../assets/images/volam_poison_shadow_1779382270085.png";
// @ts-ignore
import tvBanner from "../assets/images/volam_tv_banner_1779383127195.png";
// @ts-ignore
import cbBanner from "../assets/images/volam_cb_banner_1779383151501.png";
// @ts-ignore
import clBanner from "../assets/images/volam_cl_banner_1779383176373.png";
// @ts-ignore
import tnBanner from "../assets/images/volam_tn_banner_1779383197838.png";
// @ts-ignore
import nmBanner from "../assets/images/volam_nm_banner_1779383219739.png";
// @ts-ignore
import tmBanner from "../assets/images/volam_tm_banner_1779383238721.png";

const WELCOME_IMAGES: Record<string, string> = {
  sl: powerImg,
  tv: tvBanner,
  cb: cbBanner,
  vd: mysticImg,
  cl: clBanner,
  tn: tnBanner,
  nm: nmBanner,
  ty: eleganceImg,
  nd: poisonImg,
  tm: tmBanner,
};

const COUPLETS: Record<string, { left: string; right: string }> = {
  sl: {
    left: "Thiền tông vạn cổ truyền tâm pháp",
    right: "Dịch cân tẩy tủy tịnh chân nguyên"
  },
  vd: {
    left: "Thái cực âm dương tuần hoàn khí",
    right: "Chân vũ thần kiếm chấn võ lâm"
  },
  cb: {
    left: "Tứ hải ngũ hồ giai huynh đệ",
    right: "Hàng long thập bát đả phong ba"
  },
  nm: {
    left: "Phật quang phổ độ sinh sinh mộc",
    right: "Băng thanh ngọc khiết tụ tiên phong"
  },
  cl: {
    left: "Côn lôn lôi động kinh cửu tiêu",
    right: "Thiên lôi chấn vũ phá hồng sương"
  },
  nd: {
    left: "Vạn cổ phệ hồn khôn tìm ảnh",
    right: "Bách độc xuyên tâm hiểm giang giới"
  },
  tm: {
    left: "Ám khí vô hình bách bộ trúng",
    right: "Bạo vũ lê hoa quỷ thần kinh"
  },
  ty: {
    left: "Băng hàn thấu cốt lăng ba bộ",
    right: "Tuyết cảnh ngân sương kiếm như tiên"
  },
  tv: {
    left: "Thương phạt thiên hạ binh bất bại",
    right: "Chiến ý sa trường liệt phong sương"
  },
  tn: {
    left: "Ma diệm liệt hỏa thiêu tam giới",
    right: "Thiên ma giải thể tịnh thế hoành"
  }
};

// @ts-ignore
import slImg from "../assets/images/sl_chuong_phap_1779366464014.png";
// @ts-ignore
import vdImg from "../assets/images/vd_chuong_phap_1779366484671.png";
// @ts-ignore
import cbImg from "../assets/images/cb_sect_portrait_1779384758265.png";
// @ts-ignore
import nmImg from "../assets/images/nm_chuong_phap_1779366526959.png";
// @ts-ignore
import clImg from "../assets/images/cl_chuong_phap_1779366545584.png";
// @ts-ignore
import ndImg from "../assets/images/nd_chuong_phap_1779366566472.png";
// @ts-ignore
import tmImg from "../assets/images/tm_chuong_phap_1779366588702.png";
// @ts-ignore
import tyImg from "../assets/images/ty_chuong_phap_1779366608758.png";
// @ts-ignore
import tvImg from "../assets/images/tv_chuong_phap_1779366628579.png";
// @ts-ignore
import tnImg from "../assets/images/tn_chuong_phap_1779366650023.png";

const SECT_IMAGES: Record<string, string> = {
  sl: slImg,
  vd: vdImg,
  cb: cbImg,
  nm: nmImg,
  cl: clImg,
  nd: ndImg,
  tm: tmImg,
  ty: tyImg,
  tv: tvImg,
  tn: tnImg
};

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
  onContinue: () => void;
  hasSave: boolean;
}

export default function SectSelection({ onSelect, onContinue, hasSave }: Props) {
  const [isHdActive] = useState<boolean>(true);
  const [toastMessage] = useState<string>("");
  const [selectedSect, setSelectedSect] = useState<Sect | null>(null);
  const [lastSelectedSect, setLastSelectedSect] = useState<Sect | null>(null);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const activeSect = selectedSect || lastSelectedSect;

  const handleSectClick = (sect: Sect) => {
    setSelectedSect(sect);
    setLastSelectedSect(sect);
    setIsFlipped(true);
  };

  const handleConfirm = () => {
    if (selectedSect) {
      onSelect(selectedSect.id);
    }
  };

  const handleBack = () => {
    setIsFlipped(false);
    // Reset selectedSect after full 1.8s slide transition completes
    setTimeout(() => {
      setSelectedSect(null);
    }, 1800);
  };

  return (
    <div className="absolute inset-0 bg-[#050508] z-[100] w-full h-full overflow-hidden" style={{ perspective: 2000 }}>
      {/* Inject custom candlelight flicker & beam CSS */}
      <style>{`
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(212, 175, 55, 0.3);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(212, 175, 55, 0.6);
        }
        @keyframes candleFlicker {
          0%, 100% {
            box-shadow: 0 0 20px rgba(255,255,255,0.1), 0 0 35px var(--glow-color), inset 0 0 20px var(--glow-color);
            filter: brightness(1.0) contrast(1.0);
            border-color: rgba(255,255,255,0.3);
          }
          20% {
            box-shadow: 0 0 25px rgba(255,255,255,0.15), 0 0 50px var(--glow-color), inset 0 0 25px var(--glow-color);
            filter: brightness(1.15) contrast(1.05);
            border-color: rgba(255,255,255,0.45);
          }
          40% {
            box-shadow: 0 0 15px rgba(255,255,255,0.08), 0 0 30px var(--glow-color), inset 0 0 15px var(--glow-color);
            filter: brightness(0.95) contrast(0.95);
            border-color: rgba(255,255,255,0.22);
          }
          60% {
            box-shadow: 0 0 30px rgba(255,255,255,0.2), 0 0 60px var(--glow-color), inset 0 0 30px var(--glow-color);
            filter: brightness(1.2) contrast(1.1);
            border-color: rgba(255,255,255,0.5);
          }
          80% {
            box-shadow: 0 0 18px rgba(255,255,255,0.1), 0 0 28px var(--glow-color), inset 0 0 18px var(--glow-color);
            filter: brightness(1.02) contrast(1.0);
            border-color: rgba(255,255,255,0.28);
          }
        }
        @keyframes pulseBeam {
          0%, 100% {
            opacity: 0.25;
            transform: scale(0.97);
          }
          50% {
            opacity: 0.75;
            transform: scale(1.03);
          }
        }
        .sect-card-candle {
          animation: candleFlicker 3s infinite ease-in-out;
        }
        .beam-glow-effect {
          animation: pulseBeam 4s infinite ease-in-out;
        }
      `}</style>

      <div className="w-full h-full relative">
        {/* ==================== FRONT SIDE: PORTAL SELECTION OF SECTS ==================== */}
        <motion.div
          animate={{ 
            x: isFlipped ? "-105%" : "0%",
            opacity: isFlipped ? 0 : 1,
            scale: isFlipped ? 0.93 : 1,
            skewY: isFlipped ? -4 : 0,
            filter: isFlipped ? "blur(8px)" : "blur(0px)"
          }}
          transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
          className={`absolute inset-0 w-full h-full flex flex-col items-center justify-start p-1.5 xs:p-2 sm:p-6 pt-2 sm:pt-6 pb-20 overflow-y-auto bg-[radial-gradient(circle_at_center,_#1a1a24_0%,_#050508_100%)] ${isFlipped ? "pointer-events-none" : ""}`}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gold opacity-[0.02] rounded-full blur-3xl pointer-events-none" />

          {/* Immersion VLTK 2.5D Style Game Banner / Introduction Area */}
          <div className="relative shrink-0 w-full max-w-[1240px] h-[130px] xs:h-[150px] sm:h-[220px] md:h-[260px] rounded-2xl overflow-hidden mb-3 sm:mb-8 border border-gold/40 shadow-[0_0_30px_rgba(212,175,55,0.25)] bg-[#040406] group pointer-events-auto">
            <img 
              src={bannerImg}
              alt="Võ Lâm Giang Hồ Banner"
              className={`w-full h-full object-cover transition-all duration-700 select-none pointer-events-none ${
                isHdActive 
                  ? "contrast-115 saturate-120 brightness-105 filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]" 
                  : "contrast-90 saturate-90 brightness-95 filter sepia-[0.1]"
              }`}
              referrerPolicy="no-referrer"
            />
            
            {/* Deep, rich traditional gold-mist gradients for heavy RPG feeling */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#08080c] via-black/40 to-black/30 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50 pointer-events-none" />
            
            {/* Ambient floating dust particles if in HD mode */}
            {isHdActive && (
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-yellow-500/[0.04] via-transparent to-transparent animate-pulse pointer-events-none" />
            )}

            {/* Live Graphic Subsystem Mode Indicator Badge */}
            <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 bg-black/80 text-white font-sans text-[7.5px] xs:text-[10px] uppercase font-bold px-2.5 py-1 rounded-md border border-white/10 shadow-md">
              <span className={`w-1.5 h-1.5 rounded-full ${isHdActive ? "bg-emerald-500 animate-ping" : "bg-amber-500 animate-pulse"}`} />
              {isHdActive ? "Đồ họa: 3.0 HD Remastered" : "Đồ họa: Hoài Niệm 2005"}
            </div>

            {/* Game Server client version info */}
            <div 
              className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1 bg-black/85 text-amber-400 border border-amber-500/35 px-2.5 py-1 rounded-md text-[8px] xs:text-[10.5px] font-sans font-black shadow-lg uppercase tracking-wider"
            >
              <span>v3.0.4 HOÀNG KIM</span>
            </div>

            {/* Foreground Content: Title and subtitling */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4 text-center z-10 select-none">
              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-gold text-2xl xs:text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-serif italic font-extrabold tracking-wider flex items-center justify-center gap-1.5 sm:gap-4 flex-wrap drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)]"
                style={{ textShadow: "0 0 25px rgba(212,175,55,1.0), 0 0 50px rgba(212,175,55,0.7)" }}
              >
                <span className="text-xs xs:text-base sm:text-4xl md:text-5xl opacity-90 animate-pulse">⚔️</span>
                Võ Lâm Giang Hồ
                <span className="text-xs xs:text-base sm:text-4xl md:text-5xl opacity-90 animate-pulse scale-x-[-1]">⚔️</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-yellow-400 font-serif font-black tracking-[0.05em] sm:tracking-[0.3em] text-[8px] xs:text-[10.5px] sm:text-sm md:text-base mt-2 sm:mt-4 max-w-[90%] drop-shadow-[0_2px_6px_rgba(0,0,0,0.98)]"
              >
                CHỌN MỘT CƠ DUYÊN ĐỂ KHỞI ĐIỂM HÀNH TRÌNH CỨU THẾ
              </motion.p>
              
              {hasSave && (
                <motion.button
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.4 }}
                   onClick={onContinue}
                   className="mt-3 sm:mt-6 px-6 sm:px-10 py-1.5 sm:py-2.5 bg-amber-600/30 hover:bg-amber-600/60 border border-amber-400/50 hover:border-amber-400 text-amber-200 hover:text-white font-serif font-black uppercase tracking-widest text-[10px] sm:text-sm md:text-base rounded-full shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:shadow-[0_0_25px_rgba(212,175,55,0.6)] backdrop-blur-sm transition-all pointer-events-auto"
                >
                  📜 TIẾP TỤC GIANG HỒ
                </motion.button>
              )}
            </div>
          </div>

          {/* Retro-styled Toast/Notification overlay */}
          {toastMessage && (
            <div className="fixed top-2.5 z-[120] animate-bounce pointer-events-none w-full max-w-sm sm:max-w-md px-4">
              <div className="bg-slate-900/95 border-2 border-gold/80 p-3 rounded-xl shadow-[0_0_25px_rgba(212,175,55,0.4)] text-center">
                <span className="text-gold font-serif font-extrabold text-[10px] xs:text-[13px] tracking-wide block drop-shadow">
                  {toastMessage}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-5 gap-1.5 xs:gap-2 sm:gap-4 md:gap-5 lg:gap-6 max-w-[1240px] w-full px-0.5 sm:px-4 pb-1 sm:pb-16 h-auto">
            {SECTS.map((sect, i) => (
              <motion.div
                key={sect.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -8, backgroundColor: "#121218", scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleSectClick(sect)}
                style={{
                  borderColor: sect.color,
                  '--glow-color': sect.color,
                } as React.CSSProperties}
                className="group relative rounded-xl cursor-pointer transition-all border-2 border-slate-800/80 sect-card-candle h-full"
              >
                {/* Chasing Fireball Candle Border Beam lights */}
                <div className="absolute inset-[-4px] rounded-[15px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0 pointer-events-none beam-glow-effect">
                  <div 
                    className="absolute inset-0 bg-transparent"
                    style={{
                      boxShadow: `0 0 35px 8px ${sect.color}`,
                    }}
                  />
                </div>
                
                {/* Inner Card */}
                <div className="relative h-full flex flex-col items-center justify-between p-1 xs:p-1.5 sm:p-5 bg-[#08080c]/95 rounded-xl z-10 transition-all duration-300 group-hover:bg-[#0c0c14]"
                     style={{ boxShadow: `inset 0 0 25px ${sect.color}25` }}>
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-15 transition-opacity duration-300 pointer-events-none rounded-xl"
                    style={{ backgroundColor: sect.color }}
                  />

                  {/* Header Info Area */}
                  <div className="w-full flex flex-col items-center">
                    {/* PERFECTLY CENTERED rotating logo ring */}
                    <div className="relative w-8 h-8 xs:w-11 xs:h-11 sm:w-20 sm:h-20 flex items-center justify-center mb-1 sm:mb-4 z-10 group-hover:scale-115 transition-transform duration-300">
                      <div className="absolute inset-[-6px] pointer-events-none z-0">
                        <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <defs>
                            <linearGradient id={`sectGrad-${sect.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor={sect.color} stopOpacity="0.4" />
                              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.95" />
                              <stop offset="100%" stopColor={sect.color} stopOpacity="0.4" />
                            </linearGradient>
                          </defs>
                          <circle cx="50" cy="50" r="44" stroke={sect.color} strokeWidth="2.0" strokeOpacity="0.25" className="animate-pulse" />
                          <circle 
                            cx="50" cy="50" r="46" 
                            stroke={sect.color} 
                            strokeWidth="1.2" 
                            strokeDasharray="18 10 6 10" 
                            className="origin-center animate-[spin_10s_linear_infinite]" 
                          />
                          <circle 
                            cx="50" cy="50" r="46" 
                            stroke={`url(#sectGrad-${sect.id})`} 
                            strokeWidth="1.8" 
                            strokeDasharray="30 114" 
                            className="origin-center animate-[spin_3s_linear_infinite]" 
                          />
                        </svg>
                      </div>
                      
                      <div 
                        className="absolute inset-[3px] rounded-full bg-[#08080c] z-10 group-hover:bg-[#0c0c14] transition-colors"
                        style={{
                          boxShadow: `inset 0 0 15px ${sect.color}aa, 0 0 8px ${sect.color}60`,
                        }}
                      />

                      <div 
                        className="relative text-xs xs:text-base sm:text-3xl z-20 transition-transform duration-350 select-none" 
                        style={{ textShadow: `0 0 12px ${sect.color}, 0 0 24px ${sect.color}` }}
                      >
                        {sect.icon}
                      </div>
                    </div>

                    <h3
                      className="text-[8px] xs:text-[10px] sm:text-xl md:text-2xl font-serif italic mb-0.5 sm:mb-1 transition-colors z-10 text-center font-black tracking-wide"
                      style={{ color: sect.color, textShadow: `0 0 12px ${sect.color}, 0 0 25px ${sect.color}` }}
                    >
                      {sect.name}
                    </h3>

                    {/* Highly immersive wuxia style skill image thumbnail */}
                    <div 
                      className="relative mt-1.5 mb-1.5 w-12 h-12 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 shadow-[0_0_15px_rgba(0,0,0,0.85)] group-hover:shadow-[0_0_20px_var(--glow-color)] transition-all duration-300 z-10 scale-95 hover:scale-105"
                      style={{ borderColor: `${sect.color}dd` }}
                    >
                      <img
                        src={SECT_IMAGES[sect.id]}
                        alt={`Chưởng pháp tuyệt kỷ môn phái ${sect.name}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-115 rotate-[1deg]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />
                    </div>

                    <p className="text-[6.5px] xs:text-[8px] sm:text-xs text-gray-200 text-center italic mt-1.5 sm:mt-2 mb-1.5 sm:mb-3 min-h-[20px] xs:min-h-[28px] sm:min-h-[44px] flex items-center justify-center z-10 font-serif px-0.5 sm:px-2 leading-tight sm:leading-relaxed tracking-wider bg-gradient-to-r from-transparent via-white/5 to-transparent py-0.5 sm:py-1.5 w-full border-y border-white/10 font-bold"
                       style={{ textShadow: `0 0 10px ${sect.color}60` }}>
                      “{sect.motto}”
                    </p>
                  </div>

                  <div className="w-full pt-1 sm:pt-4 border-t border-white/10 transition-opacity z-10">
                    {/* Desktop detailed view with high contrast */}
                    <div className="hidden sm:block space-y-2.5">
                      <div className="flex justify-between text-xs font-extrabold tracking-widest text-gray-250 hover:text-white transition-colors">
                        <span className="flex items-center gap-2 drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]">
                          <span className="text-base sm:text-lg animate-pulse" style={{ textShadow: `0 0 10px ${sect.color}` }}>💪</span>{" "}
                          <span className="opacity-95 text-[9px] uppercase font-bold text-gray-300">
                            Sức Mạnh
                          </span>
                        </span>
                        <span className="text-sm font-serif" style={{ color: sect.color, textShadow: `0 0 8px ${sect.color}dd` }}>{sect.stats.str}</span>
                      </div>
                      
                      <div className="flex justify-between text-xs font-extrabold tracking-widest text-gray-250 hover:text-white transition-colors">
                        <span className="flex items-center gap-2 drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]">
                          <span className="text-base sm:text-lg animate-pulse" style={{ textShadow: `0 0 10px ${sect.color}` }}>🏃</span>{" "}
                          <span className="opacity-95 text-[9px] uppercase font-bold text-gray-300">
                            Thân Pháp
                          </span>
                        </span>
                        <span className="text-sm font-serif" style={{ color: sect.color, textShadow: `0 0 8px ${sect.color}dd` }}>{sect.stats.agi}</span>
                      </div>

                      <div className="flex justify-between text-xs font-extrabold tracking-widest text-gray-250 hover:text-white transition-colors">
                        <span className="flex items-center gap-2 drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]">
                          <span className="text-base sm:text-lg animate-pulse" style={{ textShadow: `0 0 10px ${sect.color}` }}>❤️</span>{" "}
                          <span className="opacity-95 text-[9px] uppercase font-bold text-gray-300">
                            Sinh Khí
                          </span>
                        </span>
                        <span className="text-sm font-serif" style={{ color: sect.color, textShadow: `0 0 8px ${sect.color}dd` }}>{sect.stats.con}</span>
                      </div>

                      <div className="flex justify-between text-xs font-extrabold tracking-widest text-gray-250 hover:text-white transition-colors">
                        <span className="flex items-center gap-2 drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]">
                          <span className="text-base sm:text-lg animate-pulse" style={{ textShadow: `0 0 10px ${sect.color}` }}>🧠</span>{" "}
                          <span className="opacity-95 text-[9px] uppercase font-bold text-gray-300">
                            Trí Tuệ
                          </span>
                        </span>
                        <span className="text-sm font-serif" style={{ color: sect.color, textShadow: `0 0 8px ${sect.color}dd` }}>{sect.stats.int}</span>
                      </div>

                      <div className="flex justify-between text-xs font-extrabold tracking-widest text-gray-250 hover:text-white transition-colors">
                        <span className="flex items-center gap-2 drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]">
                          <span className="text-base sm:text-lg animate-pulse" style={{ textShadow: `0 0 10px ${sect.color}` }}>🌀</span>{" "}
                          <span className="opacity-95 text-[9px] uppercase font-bold text-gray-300">
                            Nội Lực
                          </span>
                        </span>
                        <span className="text-sm font-serif" style={{ color: sect.color, textShadow: `0 0 8px ${sect.color}dd` }}>{sect.stats.nei}</span>
                      </div>
                    </div>

                    {/* Huyềnh Học Tông Môn & Chi Tiết Võ Học */}
                    <div className="hidden sm:block mt-4 pt-4 border-t border-white/10 space-y-2.5 text-left z-10 w-full">
                      <div className="text-sm font-black uppercase tracking-widest text-gold font-serif flex items-center gap-1.5 drop-shadow">
                        📜 QUYẾT TÔNG MÔN
                      </div>
                      <p className="text-[11px] text-gray-300 leading-relaxed font-serif italic text-justify px-1 min-h-[72px] font-bold">
                        {SECT_DESCRIPTIONS[sect.id]?.desc}
                      </p>
                      <div className="space-y-1.5 text-xs bg-black/60 p-2.5 rounded border border-white/10 font-serif font-black">
                        <div className="flex justify-between text-gray-300">
                          <span className="opacity-80">Võ Khí Đặc Trưng:</span>
                          <span className="text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.5)]">{SECT_DESCRIPTIONS[sect.id]?.weapon}</span>
                        </div>
                        <div className="flex justify-between text-gray-300">
                          <span className="opacity-80">Quán Đỉnh Bản Môn:</span>
                          <span style={{ color: sect.color, textShadow: `0 0 5px ${sect.color}` }}>{SECT_DESCRIPTIONS[sect.id]?.style}</span>
                        </div>
                      </div>
                      
                      <div className="pt-2">
                        <div className="text-[10px] text-yellow-500 font-extrabold uppercase tracking-widest mb-2 font-sans">Bản Môn Khởi Vũ:</div>
                        <div className="flex flex-wrap gap-1.5">
                          {sect.skills.slice(0, 3).map((sk, idx) => (
                            <span 
                              key={idx} 
                              className="text-[10px] px-2.5 py-1 rounded font-serif font-black tracking-wide border transition-all hover:scale-105 duration-200"
                              style={{ 
                                backgroundColor: `${sect.color}20`, 
                                borderColor: `${sect.color}40`, 
                                color: sect.color,
                                boxShadow: `0 0 8px ${sect.color}25`
                              }}
                            >
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Mobile Micro-Stat Badge Grid */}
                    <div className="grid grid-cols-2 gap-1 sm:hidden mt-2 w-full px-0.5 z-10 bg-black/45 p-1 rounded-lg border border-white/5 shadow-inner">
                      <div className="flex items-center justify-between bg-white/[0.015] px-1.5 py-0.5 rounded border border-white/[0.02]">
                        <span className="text-[11px] select-none">💪</span>
                        <span className="font-black font-serif text-[10px]" style={{ color: sect.color, textShadow: `0 0 4px ${sect.color}` }}>{sect.stats.str}</span>
                      </div>
                      <div className="flex items-center justify-between bg-white/[0.015] px-1.5 py-0.5 rounded border border-white/[0.02]">
                        <span className="text-[11px] select-none">🏃</span>
                        <span className="font-black font-serif text-[10px]" style={{ color: sect.color, textShadow: `0 0 4px ${sect.color}` }}>{sect.stats.agi}</span>
                      </div>
                      <div className="flex items-center justify-between bg-white/[0.015] px-1.5 py-0.5 rounded border border-white/[0.02]">
                        <span className="text-[11px] select-none">❤️</span>
                        <span className="font-black font-serif text-[10px]" style={{ color: sect.color, textShadow: `0 0 4px ${sect.color}` }}>{sect.stats.con}</span>
                      </div>
                      <div className="flex items-center justify-between bg-white/[0.015] px-1.5 py-0.5 rounded border border-white/[0.02]">
                        <span className="text-[11px] select-none">🧠</span>
                        <span className="font-black font-serif text-[10px]" style={{ color: sect.color, textShadow: `0 0 4px ${sect.color}` }}>{sect.stats.int}</span>
                      </div>
                      <div className="col-span-2 flex items-center justify-between bg-white/[0.035] px-2 py-0.5 rounded border border-white/[0.04]">
                        <span className="text-[11px] select-none">🌀</span>
                        <span className="font-black font-serif text-[10.5px]" style={{ color: sect.color, textShadow: `0 0 5px ${sect.color}` }}>{sect.stats.nei}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Decorative Widescreen Panoramic Banner for Female Martial Artists at the Bottom */}
          <div className="relative shrink-0 w-full max-w-[1240px] h-[140px] xs:h-[160px] sm:h-[220px] md:h-[260px] rounded-2xl overflow-hidden mt-6 sm:mt-10 mb-8 border border-amber-500/40 shadow-[0_0_30px_rgba(212,175,55,0.2)] bg-[#040406] group pointer-events-auto">
            <img 
              src={womenBannerImg}
              alt="Quần Phương Hội Võ Lâm"
              className="w-full h-full object-cover transition-all duration-700 select-none pointer-events-none contrast-110 saturate-120 brightness-[1.02] filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] group-hover:scale-102"
              referrerPolicy="no-referrer"
            />
            {/* Subtle decorative overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-80 z-10" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(212,175,55,0.1)_0%,_transparent_70%)] pointer-events-none z-10" />
            
            {/* Decorative Corner Borders in classical styles */}
            <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-gold/60 pointer-events-none z-20" />
            <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-gold/60 pointer-events-none z-20" />
            <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-gold/60 pointer-events-none z-20" />
            <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-gold/60 pointer-events-none z-20" />

            {/* Vintage Client/Server Edition watermark */}
            <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1 bg-black/85 text-pink-400 border border-pink-500/35 px-2.5 py-1 rounded-md text-[8px] xs:text-[10px] font-sans font-black shadow-lg uppercase tracking-wider">
              <span>🌸 QUẦN PHƯƠNG TỤ HỘI</span>
            </div>

            {/* Widescreen title content */}
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-4 pt-4 sm:pb-8 pointer-events-none p-4 text-center z-20 select-none">
              <h2 className="text-lg xs:text-xl sm:text-3xl md:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-rose-100 to-amber-200 font-extrabold font-serif tracking-[0.1em] drop-shadow-[0_4px_8px_rgba(0,0,0,0.95)]">
                QUẦN PHƯƠNG TỤ HỘI - NỮ HIỆP GIANG HỒ
              </h2>
              <p className="mt-1 xs:mt-1.5 sm:mt-2 text-[8px] xs:text-[10px] sm:text-xs text-rose-200/90 font-serif font-black tracking-[0.15em] uppercase max-w-[85%] mx-auto drop-shadow-md">
                Hồng nhan phong nhã quy tụ quần hùng, dệt nên trang sử kiếm hiệp kinh điển võ lâm truyền kỳ
              </p>
            </div>
          </div>
        </motion.div>

        {/* ==================== BACK SIDE: IMMERSIVE WELCOME GATE & VERTICAL POETRY ==================== */}
        <motion.div
          animate={{ 
            x: !isFlipped ? "105%" : "0%",
            opacity: !isFlipped ? 0 : 1,
            scale: !isFlipped ? 0.93 : 1,
            skewY: !isFlipped ? 4 : 0,
            filter: !isFlipped ? "blur(8px)" : "blur(0px)"
          }}
          transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
          className={`absolute inset-0 w-full h-full flex flex-col items-center justify-start p-2 sm:p-6 pt-4 sm:pt-8 pb-20 overflow-y-auto bg-[radial-gradient(circle_at_center,_#11090c_0%,_#040204_100%)] ${!isFlipped ? "pointer-events-none" : ""}`}
        >
          {activeSect ? (() => {
            const selectedSect = activeSect;
            return (
              <div className="relative w-full max-w-[1240px] flex flex-col items-center min-h-screen">
              {/* Back to selection header */}
              <div className="w-full flex justify-between items-center mb-4 sm:mb-8 z-20 pointer-events-auto">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 bg-black/60 hover:bg-[#1a1215] text-amber-500 border border-amber-500/30 hover:border-amber-500 hover:text-white px-4 py-2 rounded-lg text-xs font-serif font-black transition-all transform hover:-translate-x-1 shadow-md cursor-pointer"
                >
                  <span>↩️ Chọn lại Tông Môn môn phái</span>
                </button>
                <div className="text-[10px] sm:text-xs font-mono font-bold text-amber-500/65 uppercase tracking-widest bg-black/40 px-3 py-1 rounded border border-white/5 select-none">
                  Sơn Môn Diễm Kiến
                </div>
              </div>

              {/* Majestic 3-Column Layout: Left Couplet, Center Card Gate, Right Couplet */}
              <div className="w-full grid grid-cols-12 gap-2 sm:gap-6 items-center my-auto">
                
                {/* LEFT VERTICAL COUPLET BANNER */}
                <div className="col-span-2 hidden md:flex flex-col items-center justify-center relative select-none">
                  <div className="absolute inset-0 bg-gradient-to-b from-red-950/40 via-red-900/10 to-transparent blur-xl pointer-events-none" />
                  
                  {/* Left scroll hanger rod */}
                  <div className="w-6 h-2 bg-amber-600 rounded-full shadow border border-amber-800/60 z-10" />
                  
                  {/* The Vertical Crimson Banner/Scroll */}
                  <div 
                    className="w-10 xl:w-14 py-8 rounded-b-md border-x-2 border-b-2 bg-gradient-to-b from-red-650 via-red-800 to-red-950 flex flex-col items-center justify-between shadow-2xl relative z-10"
                    style={{ 
                      borderColor: `${selectedSect.color}60`, 
                      boxShadow: `0 10px 30px -5px rgba(0,0,0,0.85), inset 0 0 15px rgba(0,0,0,0.4), 0 0 15px ${selectedSect.color}15`
                    }}
                  >
                    {/* Top wooden spacer bar */}
                    <div className="absolute top-0 w-full h-1 bg-amber-900/80" />
                    
                    {/* Poetic characters in vertical stack */}
                    <div className="flex flex-col items-center gap-2 font-serif font-black text-xs xl:text-sm tracking-[0.05em] uppercase text-amber-300">
                      {COUPLETS[selectedSect.id]?.left.split(" ").map((word, idx) => (
                        <span key={idx} className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.92)] text-[11px] xl:text-[14px]">
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Bottom scroll roller tip */}
                  <div className="w-4 h-4 bg-amber-900 rounded-full mt-[-2px] border border-amber-950/60 z-10" />
                </div>

                {/* CENTRAL SPECTACLE (GRAND SCROLL GATE & GENERATED IMAGE) */}
                <div className="col-span-12 md:col-span-8 flex flex-col items-center z-10 pointer-events-auto">
                  <div 
                    className="w-full rounded-2xl overflow-hidden border-2 bg-black/90 relative shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col"
                    style={{ borderColor: `${selectedSect.color}cc`, boxShadow: `0 0 40px -5px ${selectedSect.color}45` }}
                  >
                    {/* Ancient portal golden details */}
                    <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 pointer-events-none z-20" style={{ borderColor: selectedSect.color }} />
                    <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 pointer-events-none z-20" style={{ borderColor: selectedSect.color }} />
                    <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 pointer-events-none z-20" style={{ borderColor: selectedSect.color }} />
                    <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 pointer-events-none z-20" style={{ borderColor: selectedSect.color }} />

                    {/* Widescreen container for the newly generated beautiful master image */}
                    <div className="relative w-full h-[180px] xs:h-[220px] sm:h-[350px] overflow-hidden bg-[#020204] select-none">
                      <img 
                        src={WELCOME_IMAGES[selectedSect.id]}
                        alt={`Khung cảnh sơn môn huyền thoại ${selectedSect.name}`}
                        className="w-full h-full object-cover transition-all duration-1000 contrast-110 saturate-120 md:hover:scale-103"
                        referrerPolicy="no-referrer"
                      />
                      {/* Rich artistic masks */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#020204] via-black/30 to-black/30 pointer-events-none" />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50 pointer-events-none" />
                      <div 
                        className="absolute inset-[15px] opacity-25 rounded border pointer-events-none z-10" 
                        style={{ borderColor: `${selectedSect.color}80` }}
                      />

                      {/* Floating glowing aura badge */}
                      <div 
                        className="absolute bottom-4 left-4 z-20 flex items-center gap-2 bg-black/80 px-3 py-1 rounded-md border text-[10px] font-serif font-bold uppercase tracking-wider text-white"
                        style={{ borderColor: `${selectedSect.color}40`, boxShadow: `0 0 10px ${selectedSect.color}20` }}
                      >
                        <span className="text-sm">{selectedSect.icon}</span>
                        <span>{selectedSect.name} bản doành</span>
                      </div>
                    </div>

                    {/* Subtitle & details area under the image */}
                    <div className="p-4 sm:p-8 flex flex-col items-center text-center">
                      <motion.h2 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-2xl sm:text-5xl font-serif font-black italic tracking-widest drop-shadow-[0_4px_12px_rgba(0,0,0,1)] uppercase mt-2 sm:mt-0 select-none"
                        style={{ color: selectedSect.color, textShadow: `0 0 15px ${selectedSect.color}aa, 0 0 30px ${selectedSect.color}45` }}
                      >
                        {selectedSect.name} Nhân Duyên
                      </motion.h2>

                      <p className="text-yellow-400 font-serif italic text-xs sm:text-base mt-2 max-w-[85%] font-extrabold tracking-wide drop-shadow bg-gradient-to-r from-transparent via-white/5 to-transparent py-1 w-full border-y border-white/5 select-none">
                        “{selectedSect.motto}”
                      </p>

                      {/* Mobile couplets - rendered inside for small screens */}
                      <div className="flex md:hidden flex-col gap-2 mt-4 w-full bg-red-950/25 py-2.5 px-4 rounded-xl border border-red-900/30 text-amber-300 font-serif font-black text-[10px] tracking-widest select-none">
                        <div className="flex items-center justify-center gap-1.5 border-b border-red-900/10 pb-1">
                          <span className="text-yellow-500">📜</span>
                          <span>{COUPLETS[selectedSect.id]?.left}</span>
                        </div>
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="text-yellow-500">📜</span>
                          <span>{COUPLETS[selectedSect.id]?.right}</span>
                        </div>
                      </div>

                      {/* Grid listing details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mt-4 sm:mt-6 text-left">
                        <div className="bg-white/[0.02] p-3 sm:p-4 rounded-xl border border-white/5 shadow-inner">
                          <h4 className="text-xs font-black uppercase text-amber-500 font-serif tracking-wider mb-2 flex items-center gap-1.5 select-none">
                            📖 SƠN MÔN KHỞI CHỈNH
                          </h4>
                          <p className="text-[11px] sm:text-xs text-gray-300 leading-relaxed font-serif text-justify font-medium">
                            {SECT_DESCRIPTIONS[selectedSect.id]?.desc}
                          </p>
                        </div>

                        <div className="bg-white/[0.02] p-3 sm:p-4 rounded-xl border border-white/5 shadow-inner flex flex-col justify-between">
                          <div className="space-y-2 text-xs font-serif text-gray-300 select-none">
                            <div className="flex justify-between border-b border-white/5 pb-1">
                              <span className="opacity-70 font-semibold">Tông Môn Vũ Khí:</span>
                              <span className="text-white font-serif font-bold">{SECT_DESCRIPTIONS[selectedSect.id]?.weapon}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-1">
                              <span className="opacity-70 font-semibold">Hoạt Ảnh Đặc Trưng:</span>
                              <span className="font-serif font-bold" style={{ color: selectedSect.color }}>{SECT_DESCRIPTIONS[selectedSect.id]?.style}</span>
                            </div>
                          </div>

                          <div className="mt-3">
                            <span className="text-[10px] text-amber-500/80 font-bold uppercase tracking-wider block mb-1 select-none">Môn Phái Tuyệt Kỹ:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {selectedSect.skills.slice(0, 4).map((sk, idx) => (
                                <span 
                                  key={idx}
                                  className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded font-serif font-bold tracking-wide border select-none"
                                  style={{ backgroundColor: `${selectedSect.color}15`, borderColor: `${selectedSect.color}30`, color: selectedSect.color }}
                                >
                                  {sk}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* DELICATE ACTION BUTTON */}
                      <div className="mt-6 sm:mt-8 w-full max-w-sm flex flex-col items-center gap-3">
                        <button
                          onClick={handleConfirm}
                          className="w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-yellow-400 hover:via-amber-500 hover:to-yellow-400 text-black font-serif font-black py-3 sm:py-4 px-6 sm:px-10 rounded-xl text-xs sm:text-lg tracking-[0.2em] uppercase transition-all duration-300 transform hover:scale-[1.04] active:scale-[0.98] shadow-[0_0_40px_rgba(212,175,55,0.45)] hover:shadow-[0_0_60px_rgba(255,255,255,0.7)] animate-pulse border-2 border-amber-250 z-10 cursor-pointer pointer-events-auto flex items-center justify-center gap-2"
                        >
                          <span>⚔️ XUẤT NHẬP GIANG HỒ</span>
                        </button>
                        <span className="text-[9px] sm:text-xs text-amber-500/60 font-serif tracking-wider uppercase font-extrabold animate-pulse select-none">
                          nhân quả khởi phát - danh phận võ lâm chính thức thiết lập
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT VERTICAL COUPLET BANNER */}
                <div className="col-span-2 hidden md:flex flex-col items-center justify-center relative select-none">
                  <div className="absolute inset-0 bg-gradient-to-b from-red-950/40 via-red-900/10 to-transparent blur-xl pointer-events-none" />
                  
                  {/* Right scroll hanger rod */}
                  <div className="w-6 h-2 bg-amber-600 rounded-full shadow border border-amber-800/60 z-10" />
                  
                  {/* The Vertical Crimson Banner/Scroll */}
                  <div 
                    className="w-10 xl:w-14 py-8 rounded-b-md border-x-2 border-b-2 bg-gradient-to-b from-red-650 via-red-800 to-red-950 flex flex-col items-center justify-between shadow-2xl relative z-10"
                    style={{ 
                      borderColor: `${selectedSect.color}60`, 
                      boxShadow: `0 10px 30px -5px rgba(0,0,0,0.85), inset 0 0 15px rgba(0,0,0,0.4), 0 0 15px ${selectedSect.color}15`
                    }}
                  >
                    {/* Top wooden spacer bar */}
                    <div className="absolute top-0 w-full h-1 bg-amber-900/80" />
                    
                    {/* Poetic characters in vertical stack */}
                    <div className="flex flex-col items-center gap-2 font-serif font-black text-xs xl:text-sm tracking-[0.05em] uppercase text-amber-300">
                      {COUPLETS[selectedSect.id]?.right.split(" ").map((word, idx) => (
                        <span key={idx} className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.92)] text-[11px] xl:text-[14px]">
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Bottom scroll roller tip */}
                  <div className="w-4 h-4 bg-amber-900 rounded-full mt-[-2px] border border-amber-950/60 z-10" />
                </div>
              </div>
            </div>
            );
          })() : (
            <div className="text-white text-lg font-serif">Đang phác họa tuyệt môn phái...</div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

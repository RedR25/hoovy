import React, { useState } from 'react';
import { 
  Mic, Play, Home, BarChart2, Star, Settings,
  ArrowRight, Sparkles, CheckCircle2, Volume2,
  ArrowLeft, Clock, Wand2, BookOpen, MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Global Palette Constants ---
// Soft, glossy, toy-like 3D cartoon palette
const COLORS = {
  sky: "#47C2FF",
  skyDark: "#1FA3E6",
  grass: "#59D968",
  grassDark: "#3CB84B",
  yellow: "#FFD833",
  orange: "#FF9800",
  red: "#FF4766", // Strawberry red
  pink: "#FF7EB3", // Candy pink
  purple: "#A877FF", // Soft purple
  aqua: "#33D6FF",
  cream: "#FFFDF5",
  navy: "#2A3A50"
};

// --- Cartoon World Background ---
// Simple 3D cartoon nursery landscape: bright sky, clouds, low hills, sun, music notes, balloons
const CartoonWorldBackground = () => (
  <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-gradient-to-b from-[#47C2FF] to-[#A3E5FF]">
    {/* Soft Glowing Sun with Cute Smile */}
    <motion.div 
      animate={{ y: [0, -5, 0] }}
      transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
      className="absolute top-10 left-8 sm:top-12 sm:left-12 w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-[#FFF599] via-[#FFD833] to-[#FF9800] shadow-[0_0_50px_rgba(255,216,51,0.6),inset_-6px_-6px_15px_rgba(255,152,0,0.5)] flex flex-col items-center justify-center"
    >
       <div className="absolute top-4 left-4 w-12 h-12 bg-white/60 rounded-full blur-[3px]" />
       {/* Friendly Sun Smile */}
       <div className="flex gap-4 mb-1 relative z-10">
         <div className="w-3 h-3 bg-[#D98A1C] rounded-full"/>
         <div className="w-3 h-3 bg-[#D98A1C] rounded-full"/>
       </div>
       <div className="w-8 h-3 border-b-[4px] border-[#D98A1C] rounded-b-full relative z-10"/>
    </motion.div>

    {/* Fluffy Toy Clouds */}
    <motion.div 
      animate={{ x: [0, 20, 0] }}
      transition={{ repeat: Infinity, duration: 15, ease: "easeInOut" }}
      className="absolute top-16 right-[15%] w-48 h-16 bg-white/95 rounded-full shadow-[inset_-4px_-6px_12px_rgba(71,194,255,0.2),0_10px_20px_rgba(0,0,0,0.05)]"
    >
       <div className="absolute -top-10 left-6 w-20 h-20 bg-white/95 rounded-full shadow-[inset_-4px_-4px_10px_rgba(71,194,255,0.1)]" />
       <div className="absolute -top-6 right-6 w-16 h-16 bg-white/95 rounded-full shadow-[inset_-4px_-4px_10px_rgba(71,194,255,0.1)]" />
    </motion.div>
    
    <motion.div 
      animate={{ x: [0, -15, 0] }}
      transition={{ repeat: Infinity, duration: 20, ease: "easeInOut", delay: 2 }}
      className="absolute top-40 left-[25%] w-36 h-12 bg-white/90 rounded-full shadow-[inset_-4px_-6px_12px_rgba(71,194,255,0.2),0_10px_20px_rgba(0,0,0,0.05)] scale-75"
    >
       <div className="absolute -top-8 left-4 w-16 h-16 bg-white/90 rounded-full" />
       <div className="absolute -top-6 right-4 w-12 h-12 bg-white/90 rounded-full" />
    </motion.div>

    {/* Floating Playful Shapes (Music Notes, Stars, Balloons) */}
    <motion.div animate={{ y: [0, -20, 0], rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 8 }} className="absolute top-[30%] left-[10%] opacity-80">
      <svg width="40" height="40" viewBox="0 0 24 24" fill={COLORS.red} className="drop-shadow-md">
        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
      </svg>
    </motion.div>
    <motion.div animate={{ y: [0, -15, 0], rotate: [0, -10, 10, 0] }} transition={{ repeat: Infinity, duration: 6, delay: 1 }} className="absolute top-[20%] right-[30%] opacity-80">
      <svg width="30" height="30" viewBox="0 0 24 24" fill={COLORS.purple} className="drop-shadow-md">
        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
      </svg>
    </motion.div>
    <motion.div animate={{ y: [0, -25, 0] }} transition={{ repeat: Infinity, duration: 10, delay: 2 }} className="absolute top-[40%] right-[10%] w-12 h-16 bg-gradient-to-br from-[#FF7EB3] to-[#FF4766] rounded-[50%] shadow-[inset_-4px_-4px_10px_rgba(0,0,0,0.2),0_10px_10px_rgba(0,0,0,0.1)]">
       {/* Balloon String */}
       <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-white/60" />
       {/* Glossy Highlight */}
       <div className="absolute top-2 left-2 w-3 h-6 bg-white/60 rounded-full blur-[1px] transform rotate-12" />
    </motion.div>
    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 15, ease: "linear" }} className="absolute top-[25%] left-[40%] opacity-70">
      <Star size={32} className="fill-[#FFD833] text-[#FF9800] drop-shadow-md" />
    </motion.div>

    {/* Clean, low Rolling 3D Hills so they don't cover content */}
    <div className="absolute bottom-0 -left-[10%] w-[70vw] h-[15vh] bg-gradient-to-t from-[#3CB84B] to-[#59D968] rounded-t-[100%] shadow-[inset_0_15px_30px_rgba(255,255,255,0.4)] border-t-[8px] border-[#3CB84B]" />
    <div className="absolute bottom-0 -right-[10%] w-[80vw] h-[20vh] bg-gradient-to-t from-[#3CB84B] to-[#59D968] rounded-t-[100%] shadow-[inset_0_15px_30px_rgba(255,255,255,0.4),0_-10px_20px_rgba(71,194,255,0.2)] border-t-[8px] border-[#3CB84B]">
       {/* Simple Toy Trees */}
       <div className="absolute top-4 left-[30%] w-5 h-14 bg-[#A36F45] rounded-full border-r-[3px] border-[#664024] z-0">
         <div className="absolute -top-8 -left-5 w-16 h-16 bg-gradient-to-br from-[#59D968] to-[#3CB84B] rounded-full shadow-[inset_-3px_-4px_10px_rgba(0,0,0,0.2)] border-b-[4px] border-[#3CB84B]"/>
       </div>
       <div className="absolute top-10 right-[20%] w-4 h-12 bg-[#A36F45] rounded-full border-r-[3px] border-[#664024] z-0">
         <div className="absolute -top-6 -left-4 w-12 h-12 bg-gradient-to-br from-[#59D968] to-[#3CB84B] rounded-full shadow-[inset_-3px_-4px_10px_rgba(0,0,0,0.2)] border-b-[4px] border-[#3CB84B]"/>
       </div>
    </div>
  </div>
);

// --- 3D Mascot & Characters ---

const HoovyMascot = ({ size = 120, state = 'idle', className = '' }: { size?: number, state?: 'idle' | 'happy' | 'wrong' | 'speaking', className?: string }) => {
  const id = React.useId().replace(/:/g, '');
  const isHappy = state === 'happy';
  const isWrong = state === 'wrong';
  const isSpeaking = state === 'speaking';

  return (
    <div className={cn("relative flex flex-col items-center justify-end", className)} style={{ width: size, height: size }}>
      {/* Soft Ground Shadow */}
      <motion.div 
        animate={{ scale: isHappy ? [0.7, 0.9, 0.7] : [0.9, 0.85, 0.9] }}
        transition={{ repeat: Infinity, duration: isHappy ? 1 : 2.5, ease: "easeInOut" }}
        className="absolute bottom-[2%] w-[65%] h-[15%] bg-[#2A3A50]/20 rounded-full blur-[5px] z-0"
      />

      {/* Wrapping SVG in motion.div so parts don't detach during jumps */}
      <motion.div 
        className="relative z-10 w-[95%] h-[95%]"
        animate={{ 
          y: isHappy ? [0, -12, 0] : isWrong ? [0, 4, 0] : [0, -4, 0]
        }}
        transition={{ repeat: Infinity, duration: isHappy ? 1 : isWrong ? 3 : 2.5, ease: "easeInOut" }}
      >
        <svg viewBox="0 0 120 120" className="w-full h-full overflow-visible drop-shadow-[0_12px_15px_rgba(0,0,0,0.15)]">
          <defs>
            <radialGradient id={`bodyGrad${id}`} cx="30%" cy="25%" r="75%">
               <stop offset="0%" stopColor="#D4F0FF" />
               <stop offset="35%" stopColor={COLORS.sky} />
               <stop offset="85%" stopColor={COLORS.skyDark} />
               <stop offset="100%" stopColor="#1C86D9" />
            </radialGradient>
            <radialGradient id={`bellyGrad${id}`} cx="45%" cy="30%" r="65%">
               <stop offset="0%" stopColor="#FFFFFF" />
               <stop offset="60%" stopColor={COLORS.yellow} />
               <stop offset="100%" stopColor="#F5A623" />
            </radialGradient>
            <radialGradient id={`beakGrad${id}`} cx="30%" cy="30%" r="70%">
               <stop offset="0%" stopColor="#FFF8B3" />
               <stop offset="50%" stopColor={COLORS.yellow} />
               <stop offset="100%" stopColor="#D98A1C" />
            </radialGradient>
            <filter id={`shadow${id}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="5" stdDeviation="4" floodOpacity="0.25"/>
            </filter>
          </defs>

          {/* 3D Soft Hair Tuft */}
          <g>
            <path d="M 55 30 Q 50 12 65 16 Q 60 22 62 30" fill={`url(#beakGrad${id})`} filter={`url(#shadow${id})`} />
            <path d="M 62 30 Q 70 16 78 20 Q 68 26 68 30" fill={`url(#beakGrad${id})`} filter={`url(#shadow${id})`} />
          </g>

          {/* Tiny 3D Wings */}
          <rect 
            x="10" y="52" width="22" height="34" rx="11" 
            fill={`url(#bodyGrad${id})`} filter={`url(#shadow${id})`}
            transform="rotate(-15 21 60)"
          />
          <rect 
            x="88" y="52" width="22" height="34" rx="11" 
            fill={`url(#bodyGrad${id})`} filter={`url(#shadow${id})`}
            transform="rotate(15 99 60)"
          />

          {/* Main 3D Spherical Body */}
          <circle cx="60" cy="65" r="42" fill={`url(#bodyGrad${id})`} filter={`url(#shadow${id})`} />
          
          {/* Soft Glossy Highlight - Toy plastic feel */}
          <path d="M 26 48 Q 60 22 94 48 A 34 34 0 0 0 26 48 Z" fill="#ffffff" opacity="0.45" />
          <ellipse cx="32" cy="53" rx="7" ry="16" fill="#ffffff" opacity="0.35" transform="rotate(-30 32 53)" />

          {/* Yellow 3D Belly */}
          <ellipse cx="60" cy="82" rx="32" ry="22" fill={`url(#bellyGrad${id})`} />
          <ellipse cx="60" cy="68" rx="15" ry="6" fill="#ffffff" opacity="0.4" />

          {/* Rosy Toy Cheeks */}
          <circle cx="36" cy="68" r="7" fill={COLORS.pink} opacity="0.65" filter="blur(1px)" />
          <circle cx="84" cy="68" r="7" fill={COLORS.pink} opacity="0.65" filter="blur(1px)" />

          {/* Cartoon 3D Eyes */}
          {isHappy ? (
            <>
              <path d="M 32 55 Q 42 40 52 55" stroke={COLORS.navy} strokeWidth="6" strokeLinecap="round" fill="none" />
              <path d="M 68 55 Q 78 40 88 55" stroke={COLORS.navy} strokeWidth="6" strokeLinecap="round" fill="none" />
            </>
          ) : isWrong ? (
             <>
              <circle cx="42" cy="55" r="11" fill="#ffffff" filter={`url(#shadow${id})`} />
              <circle cx="42" cy="55" r="6" fill={COLORS.navy} />
              <path d="M 32 46 Q 42 42 52 48" stroke={COLORS.navy} strokeWidth="4" strokeLinecap="round" fill="none" />
              
              <circle cx="78" cy="55" r="11" fill="#ffffff" filter={`url(#shadow${id})`} />
              <circle cx="78" cy="55" r="6" fill={COLORS.navy} />
              <path d="M 68 48 Q 78 42 88 46" stroke={COLORS.navy} strokeWidth="4" strokeLinecap="round" fill="none" />
             </>
          ) : (
            <>
              {/* Left Eye */}
              <circle cx="42" cy="55" r="12" fill="#ffffff" filter={`url(#shadow${id})`} />
              <circle cx="42" cy="55" r="7" fill={COLORS.navy} />
              <circle cx="45" cy="52" r="3.5" fill="#ffffff" />
              <circle cx="39" cy="58" r="1.5" fill="#ffffff" />
              {/* Right Eye */}
              <circle cx="78" cy="55" r="12" fill="#ffffff" filter={`url(#shadow${id})`} />
              <circle cx="78" cy="55" r="7" fill={COLORS.navy} />
              <circle cx="81" cy="52" r="3.5" fill="#ffffff" />
              <circle cx="75" cy="58" r="1.5" fill="#ffffff" />
            </>
          )}

          {/* 3D Beak & Mouth */}
          {isHappy ? (
            <>
              <path d="M 50 70 Q 60 88 70 70 Z" fill={COLORS.navy} stroke={COLORS.navy} strokeWidth="2" strokeLinejoin="round" />
              <path d="M 54 78 Q 60 84 66 78 Z" fill={COLORS.red} />
            </>
          ) : isWrong ? (
             <path d="M 54 75 Q 60 70 66 75" stroke={COLORS.navy} strokeWidth="3" strokeLinecap="round" fill="none" />
          ) : (
            <>
              <path d="M 50 70 Q 60 78 70 70 Q 60 66 50 70 Z" fill={`url(#beakGrad${id})`} filter={`url(#shadow${id})`} />
              <path d="M 50 70 Q 60 74 70 70" stroke="#CC7A00" strokeWidth="2" fill="none" />
            </>
          )}
        </svg>
      </motion.div>
    </div>
  );
};

const Kid3DCharacter = ({ 
  shirtColor = COLORS.red, shirtDark = "#D93D55", 
  skinColor = "#FFE8CC", skinDark = "#E59E60", 
  hairColor = "#664024", hairType = "boy",
  pose = "idle", className = "" 
}: any) => {
  const id = React.useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 160 200" className={cn("overflow-visible w-24 h-32 sm:w-36 sm:h-48 drop-shadow-[0_12px_15px_rgba(0,0,0,0.25)]", className)} fill="none">
      <defs>
         <radialGradient id={`skinGrad${id}`} cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
            <stop offset="35%" stopColor={skinColor} />
            <stop offset="90%" stopColor={skinDark} />
            <stop offset="100%" stopColor="#C25A24" />
         </radialGradient>
         <radialGradient id={`shirtGrad${id}`} cx="30%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
            <stop offset="30%" stopColor={shirtColor} />
            <stop offset="100%" stopColor={shirtDark} />
         </radialGradient>
         <radialGradient id={`hairGrad${id}`} cx="30%" cy="20%" r="70%">
            <stop offset="0%" stopColor="#A36F45" />
            <stop offset="100%" stopColor={hairColor} />
         </radialGradient>
         <filter id={`dropShadow${id}`} x="-20%" y="-20%" width="140%" height="140%">
           <feDropShadow dx="0" dy="5" stdDeviation="3" floodOpacity="0.3"/>
         </filter>
      </defs>

      {/* Stubby Legs */}
      {pose !== 'seller' && (
        <>
          <rect x="58" y="130" width="16" height="35" rx="8" fill={COLORS.navy} filter={`url(#dropShadow${id})`} />
          <rect x="86" y="130" width="16" height="35" rx="8" fill={COLORS.navy} filter={`url(#dropShadow${id})`} />
          {/* Glossy Shoes */}
          <rect x="54" y="155" width="24" height="14" rx="7" fill={COLORS.pink} />
          <rect x="82" y="155" width="24" height="14" rx="7" fill={COLORS.pink} />
          <ellipse cx="62" cy="160" rx="5" ry="2" fill="#ffffff" opacity="0.5" transform="rotate(-10 62 160)" />
          <ellipse cx="90" cy="160" rx="5" ry="2" fill="#ffffff" opacity="0.5" transform="rotate(-10 90 160)" />
        </>
      )}
      
      {/* Left Arm */}
      {pose === 'pointing' ? (
        <rect x="35" y="90" width="18" height="50" rx="9" fill={`url(#skinGrad${id})`} transform="rotate(-60 44 90)" filter={`url(#dropShadow${id})`} />
      ) : (
        <rect x="38" y="90" width="18" height="45" rx="9" fill={`url(#skinGrad${id})`} transform="rotate(15 47 90)" filter={`url(#dropShadow${id})`} />
      )}
      
      {/* Rounded Body (Chunky and toy-like) */}
      <rect x="45" y="85" width="70" height="60" rx="30" fill={`url(#shirtGrad${id})`} filter={`url(#dropShadow${id})`} />
      
      {/* Giant Toy Head */}
      <circle cx="80" cy="55" r="42" fill={`url(#skinGrad${id})`} filter={`url(#dropShadow${id})`} />
      
      {/* Rim light on head for 3D pop */}
      <path d="M 45 35 A 40 40 0 0 1 80 15" stroke="#FFFFFF" strokeWidth="4" fill="none" opacity="0.6" strokeLinecap="round" />

      {/* Hair */}
      {hairType === 'boy' ? (
        <path d="M 38 50 Q 45 10 80 12 Q 115 10 122 50 Q 100 22 80 28 Q 60 22 38 50 Z" fill={`url(#hairGrad${id})`} filter={`url(#dropShadow${id})`} />
      ) : (
        <>
          <path d="M 38 55 Q 45 5 80 10 Q 115 5 122 55 Q 115 85 105 85 Q 110 45 80 20 Q 50 45 55 85 Q 45 85 38 55 Z" fill={`url(#hairGrad${id})`} filter={`url(#dropShadow${id})`} />
          <circle cx="40" cy="35" r="14" fill={`url(#hairGrad${id})`} filter={`url(#dropShadow${id})`} />
          <circle cx="120" cy="35" r="14" fill={`url(#hairGrad${id})`} filter={`url(#dropShadow${id})`} />
        </>
      )}

      {/* Glossy Forehead Highlight */}
      <ellipse cx="65" cy="35" rx="14" ry="6" fill="#ffffff" opacity="0.6" transform="rotate(-15 65 35)" />
      
      {/* 3D Glossy Eyes */}
      <circle cx="64" cy="56" r="7" fill={COLORS.navy} />
      <circle cx="66" cy="53" r="3" fill="#ffffff" />
      <circle cx="62" cy="58" r="1.5" fill="#ffffff" />

      <circle cx="96" cy="56" r="7" fill={COLORS.navy} />
      <circle cx="98" cy="53" r="3" fill="#ffffff" />
      <circle cx="94" cy="58" r="1.5" fill="#ffffff" />

      {/* Cute Small Nose & Smiling Mouth */}
      <circle cx="80" cy="62" r="3" fill={skinDark} />
      <path d="M 72 70 Q 80 78 88 70" stroke={COLORS.navy} strokeWidth="3.5" strokeLinecap="round" />
      
      {/* Soft Rosy Cheeks */}
      <circle cx="52" cy="66" r="8" fill={COLORS.pink} opacity="0.6" filter="blur(1.5px)" />
      <circle cx="108" cy="66" r="8" fill={COLORS.pink} opacity="0.6" filter="blur(1.5px)" />
      
      {/* Right Arm */}
      {pose === 'waving' ? (
        <rect x="105" y="40" width="18" height="50" rx="9" fill={`url(#skinGrad${id})`} transform="rotate(35 114 85)" filter={`url(#dropShadow${id})`} />
      ) : (
        <rect x="105" y="90" width="18" height="45" rx="9" fill={`url(#skinGrad${id})`} transform="rotate(-15 114 90)" filter={`url(#dropShadow${id})`} />
      )}
    </svg>
  );
};

const AnimatedArrow = ({ className }: { className?: string }) => (
  <motion.div 
    animate={{ y: [0, -10, 0] }}
    transition={{ repeat: Infinity, duration: 1 }}
    className={cn("absolute text-[#FF4766] drop-shadow-[0_4px_4px_rgba(255,71,102,0.5)] z-20", className)}
  >
     <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 4v16M19 11l-7 7-7-7"/>
     </svg>
  </motion.div>
);

// --- Custom 3D Cartoon SVG Icons ---
const CustomIcon = ({ type }: { type: string }) => {
  const id = React.useId().replace(/:/g, '');

  if (type === 'happy' || type === 'hello') return (
    <svg viewBox="0 0 100 100" className="w-full h-full p-1 drop-shadow-[0_4px_6px_rgba(0,0,0,0.15)]">
      <defs>
        <radialGradient id={`gradH${id}`} cx="30%" cy="30%" r="70%">
           <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7"/>
           <stop offset="40%" stopColor={COLORS.yellow}/>
           <stop offset="100%" stopColor={COLORS.orange}/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="45" fill={`url(#gradH${id})`} stroke={COLORS.orange} strokeWidth="3" />
      <ellipse cx="35" cy="25" rx="15" ry="8" fill="#ffffff" opacity="0.8" transform="rotate(-25 35 25)" />
      <circle cx="35" cy="42" r="6" fill={COLORS.navy} />
      <circle cx="65" cy="42" r="6" fill={COLORS.navy} />
      <path d="M 28 58 Q 50 82 72 58" fill="none" stroke={COLORS.navy} strokeWidth="7" strokeLinecap="round" />
    </svg>
  );
  if (type === 'sad') return (
    <svg viewBox="0 0 100 100" className="w-full h-full p-1 drop-shadow-[0_4px_6px_rgba(0,0,0,0.15)]">
      <defs>
        <radialGradient id={`gradS${id}`} cx="30%" cy="30%" r="70%">
           <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7"/>
           <stop offset="40%" stopColor={COLORS.sky}/>
           <stop offset="100%" stopColor={COLORS.skyDark}/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="45" fill={`url(#gradS${id})`} stroke={COLORS.skyDark} strokeWidth="3" />
      <ellipse cx="35" cy="25" rx="15" ry="8" fill="#ffffff" opacity="0.8" transform="rotate(-25 35 25)" />
      <circle cx="35" cy="45" r="6" fill={COLORS.navy} />
      <circle cx="65" cy="45" r="6" fill={COLORS.navy} />
      <path d="M 28 70 Q 50 48 72 70" fill="none" stroke={COLORS.navy} strokeWidth="7" strokeLinecap="round" />
    </svg>
  );
  if (type === 'angry') return (
    <svg viewBox="0 0 100 100" className="w-full h-full p-1 drop-shadow-[0_4px_6px_rgba(0,0,0,0.15)]">
      <defs>
        <radialGradient id={`gradA${id}`} cx="30%" cy="30%" r="70%">
           <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7"/>
           <stop offset="40%" stopColor={COLORS.red}/>
           <stop offset="100%" stopColor="#D93D55"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="45" fill={`url(#gradA${id})`} stroke="#D93D55" strokeWidth="3" />
      <ellipse cx="35" cy="25" rx="15" ry="8" fill="#ffffff" opacity="0.8" transform="rotate(-25 35 25)" />
      <path d="M 22 38 L 45 46 M 78 38 L 55 46" stroke={COLORS.navy} strokeWidth="7" strokeLinecap="round" />
      <circle cx="35" cy="52" r="6" fill={COLORS.navy} />
      <circle cx="65" cy="52" r="6" fill={COLORS.navy} />
      <path d="M 32 72 L 68 72" stroke={COLORS.navy} strokeWidth="7" strokeLinecap="round" />
    </svg>
  );
  if (type === 'ask_snack' || type === 'snack_time') return (
    <svg viewBox="0 0 100 100" className="w-full h-full p-1 drop-shadow-[0_4px_6px_rgba(0,0,0,0.15)]">
      <defs>
        <radialGradient id={`gradC${id}`} cx="40%" cy="30%" r="60%">
           <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6"/>
           <stop offset="40%" stopColor={COLORS.orange}/>
           <stop offset="100%" stopColor="#D98A1C"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="45" fill={`url(#gradC${id})`} stroke="#D98A1C" strokeWidth="3" />
      <ellipse cx="35" cy="20" rx="15" ry="6" fill="#ffffff" opacity="0.7" transform="rotate(-20 35 20)" />
      <circle cx="35" cy="35" r="6" fill="#664024" />
      <circle cx="65" cy="45" r="7" fill="#664024" />
      <circle cx="45" cy="65" r="8" fill="#664024" />
      <circle cx="28" cy="55" r="5" fill="#664024" />
    </svg>
  );
  if (type === 'clock3') return (
    <svg viewBox="0 0 100 100" className="w-full h-full p-1 drop-shadow-[0_4px_6px_rgba(0,0,0,0.15)]">
      <defs>
        <radialGradient id={`gradClock${id}`} cx="30%" cy="30%" r="70%">
           <stop offset="0%" stopColor="#ffffff"/>
           <stop offset="80%" stopColor="#F8FAFC"/>
           <stop offset="100%" stopColor="#E2E8F0"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="45" fill={`url(#gradClock${id})`} stroke={COLORS.skyDark} strokeWidth="10" />
      <circle cx="50" cy="50" r="5" fill={COLORS.red} />
      <path d="M 50 50 L 50 22 M 50 50 L 72 50" stroke={COLORS.navy} strokeWidth="6" strokeLinecap="round" />
      <ellipse cx="30" cy="25" rx="15" ry="5" fill="#ffffff" opacity="0.9" transform="rotate(-30 30 25)" />
    </svg>
  );
  if (type === 'wave' || type === 'goodbye') return (
    <svg viewBox="0 0 100 100" className="w-full h-full p-1 drop-shadow-[0_4px_6px_rgba(0,0,0,0.15)]" style={type === 'goodbye' ? { transform: "scaleX(-1)" } : {}}>
      <defs>
        <radialGradient id={`gradHand${id}`} cx="35%" cy="30%" r="70%">
           <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6"/>
           <stop offset="40%" stopColor={type === 'goodbye' ? COLORS.red : COLORS.yellow}/>
           <stop offset="100%" stopColor={type === 'goodbye' ? "#D93D55" : COLORS.orange}/>
        </radialGradient>
      </defs>
      <rect x="25" y="40" width="48" height="50" rx="16" fill={`url(#gradHand${id})`} stroke={type === 'goodbye' ? "#D93D55" : "#D98A1C"} strokeWidth="3" />
      <rect x="18" y="28" width="16" height="35" rx="8" fill={`url(#gradHand${id})`} transform="rotate(-15 26 45)" stroke={type === 'goodbye' ? "#D93D55" : "#D98A1C"} strokeWidth="3" />
      <rect x="35" y="15" width="16" height="40" rx="8" fill={`url(#gradHand${id})`} stroke={type === 'goodbye' ? "#D93D55" : "#D98A1C"} strokeWidth="3" />
      <rect x="55" y="20" width="16" height="35" rx="8" fill={`url(#gradHand${id})`} stroke={type === 'goodbye' ? "#D93D55" : "#D98A1C"} strokeWidth="3" />
      <rect x="72" y="30" width="16" height="30" rx="8" fill={`url(#gradHand${id})`} transform="rotate(15 80 45)" stroke={type === 'goodbye' ? "#D93D55" : "#D98A1C"} strokeWidth="3" />
      <ellipse cx="35" cy="30" rx="6" ry="10" fill="#ffffff" opacity="0.6" transform="rotate(-10 35 30)" />
    </svg>
  );
  if (type === 'grab') return (
    <svg viewBox="0 0 100 100" className="w-full h-full p-1 drop-shadow-[0_4px_6px_rgba(0,0,0,0.15)]">
      <defs>
        <radialGradient id={`gradGrab${id}`} cx="35%" cy="30%" r="70%">
           <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6"/>
           <stop offset="40%" stopColor={COLORS.yellow}/>
           <stop offset="100%" stopColor={COLORS.orange}/>
        </radialGradient>
      </defs>
      <rect x="30" y="45" width="40" height="45" rx="16" fill={`url(#gradGrab${id})`} stroke="#D98A1C" strokeWidth="3" />
      <rect x="15" y="40" width="35" height="16" rx="8" fill={`url(#gradGrab${id})`} transform="rotate(-30 32 48)" stroke="#D98A1C" strokeWidth="3" />
      <rect x="28" y="32" width="40" height="16" rx="8" fill={`url(#gradGrab${id})`} stroke="#D98A1C" strokeWidth="3" />
      <rect x="42" y="38" width="35" height="16" rx="8" fill={`url(#gradGrab${id})`} transform="rotate(20 60 46)" stroke="#D98A1C" strokeWidth="3" />
      <ellipse cx="35" cy="55" rx="8" ry="5" fill="#ffffff" opacity="0.7" transform="rotate(-20 35 55)" />
    </svg>
  );
  return <div className="w-full h-full bg-gray-200 rounded-full" />;
};


// --- 3D Lesson Scenes ---

const SceneMakingFriends = ({ isThumbnail = false }: { isThumbnail?: boolean }) => {
  const id = React.useId().replace(/:/g, '');
  return (
  <div className="relative w-full h-full bg-gradient-to-b from-[#47C2FF] to-[#A3E5FF] overflow-hidden">
    <div className={cn("absolute inset-0 w-full h-full origin-[50%_70%] transition-transform duration-500", isThumbnail ? "scale-[0.6]" : "scale-100")}>
      
      {/* Sun */}
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 40, ease: "linear" }} className="absolute top-4 left-6 w-20 h-20 rounded-full bg-gradient-to-br from-[#FFF8B3] to-[#FF9800] shadow-[0_0_30px_rgba(255,152,0,0.6),inset_-4px_-4px_10px_rgba(255,152,0,0.5)]">
        <div className="absolute top-2 left-2 w-8 h-8 bg-white/60 rounded-full blur-[2px]" />
      </motion.div>

      {/* Toy Clouds */}
      <div className="absolute top-8 left-[35%] w-28 h-12 bg-white/95 rounded-full shadow-[inset_-2px_-4px_8px_rgba(71,194,255,0.2),0_5px_10px_rgba(0,0,0,0.05)]">
         <div className="absolute -top-6 left-4 w-14 h-14 bg-white/95 rounded-full" />
         <div className="absolute -top-4 right-4 w-12 h-12 bg-white/95 rounded-full" />
      </div>

      {/* 3D Toy Slide in Background */}
      <div className="absolute bottom-24 right-[40%] w-32 h-24 z-0">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md" fill="none">
          <defs>
             <linearGradient id={`slideGrad${id}`} x1="0" y1="0" x2="1" y2="1">
               <stop offset="0%" stopColor="#FFD833" />
               <stop offset="100%" stopColor="#FF9800" />
             </linearGradient>
          </defs>
          <path d="M 20 80 Q 50 60 80 20 L 90 25 Q 60 65 30 85 Z" fill={`url(#slideGrad${id})`} />
          <rect x="75" y="20" width="10" height="60" rx="3" fill="#33D6FF" />
          <rect x="85" y="25" width="10" height="55" rx="3" fill="#33D6FF" />
          <rect x="70" y="30" width="30" height="6" rx="2" fill={COLORS.red} />
          <rect x="70" y="45" width="30" height="6" rx="2" fill={COLORS.red} />
          <rect x="70" y="60" width="30" height="6" rx="2" fill={COLORS.red} />
        </svg>
      </div>

      {/* Hills */}
      <div className="absolute bottom-[-10px] left-[-20%] w-[100%] h-32 bg-gradient-to-t from-[#3CB84B] to-[#59D968] rounded-t-[100%] shadow-[inset_0_15px_20px_rgba(255,255,255,0.4)] border-t-[8px] border-[#3CB84B] z-0" />
      <div className="absolute bottom-[-10px] right-[-10%] w-[80%] h-28 bg-gradient-to-t from-[#3CB84B] to-[#59D968] rounded-t-[100%] shadow-[inset_0_15px_20px_rgba(255,255,255,0.4),0_-5px_10px_rgba(0,0,0,0.1)] border-t-[8px] border-[#3CB84B] z-0" />

      {/* 3D Children */}
      <div className="absolute bottom-8 left-[15%] z-10">
        <Kid3DCharacter shirtColor={COLORS.red} shirtDark="#D93D55" skinColor="#FFE8CC" hairType="boy" pose="waving" />
      </div>
      <div className="absolute bottom-6 right-[30%] z-10">
        <Kid3DCharacter shirtColor={COLORS.purple} shirtDark="#8A4FCC" skinColor="#FFEDD5" hairType="girl" pose="idle" />
        {!isThumbnail && <AnimatedArrow className="-top-[50px] left-[50%] -translate-x-1/2" />}
      </div>
      <div className={cn("absolute z-20", isThumbnail ? "top-6 right-2" : "top-10 right-[5%] sm:right-[10%]")}>
        <HoovyMascot size={isThumbnail ? 100 : 140} state="speaking" />
      </div>
    </div>
  </div>
)};

const SceneBuyingSnack = ({ isThumbnail = false }: { isThumbnail?: boolean }) => {
  const id = React.useId().replace(/:/g, '');
  return (
  <div className="relative w-full h-full bg-gradient-to-b from-[#FFD833] to-[#FF9800] overflow-hidden">
    <div className={cn("absolute inset-0 w-full h-full origin-[50%_70%] transition-transform duration-500", isThumbnail ? "scale-[0.6]" : "scale-100")}>
      
      {/* Indoor Floor */}
      <div className="absolute bottom-0 w-full h-24 bg-gradient-to-t from-[#D93D55] to-[#FF4766] shadow-[inset_0_15px_20px_rgba(255,255,255,0.4)] border-t-[8px] border-[#D93D55]" />
      
      {/* 3D Snack Counter */}
      <div className="absolute bottom-20 right-[5%] w-[60%] h-28 bg-gradient-to-b from-[#E69500] to-[#CC7A00] rounded-t-[1.5rem] shadow-[-10px_10px_20px_rgba(0,0,0,0.2)] flex flex-col border-[6px] border-[#8B5A2B] border-b-0">
         <div className="w-full h-10 bg-gradient-to-r from-[#FFD833] to-[#FF9800] rounded-t-[1rem] shadow-[inset_0_4px_8px_rgba(255,255,255,0.6)] border-b-[4px] border-[#CC7A00]" />
         
         {/* Posts and Awning */}
         <div className="absolute bottom-full left-4 w-4 h-28 bg-white border-l-[3px] border-gray-300" />
         <div className="absolute bottom-full right-4 w-4 h-28 bg-white border-l-[3px] border-gray-300" />
         <div className="absolute -top-28 -left-4 w-[110%] h-16 bg-white flex rounded-t-lg overflow-hidden shadow-lg border-b-[6px] border-red-700">
            {[...Array(6)].map((_, i) => (
              <div key={i} className={cn("flex-1 h-full", i % 2 === 0 ? "bg-[#FF4766]" : "bg-white")} />
            ))}
         </div>
         
         {/* Fruit and Cookies on counter */}
         <div className="absolute -top-6 left-6 w-10 h-10 bg-[#FF4766] rounded-full shadow-[0_4px_8px_rgba(0,0,0,0.3),inset_-2px_-3px_8px_#D93D55] border-[2px] border-[#D93D55] flex items-center justify-center">
            <div className="absolute top-1 left-2 w-3 h-3 bg-white/60 rounded-full blur-[1px]" />
            <div className="absolute -top-2 left-4 w-4 h-4 bg-[#59D968] rounded-full rounded-bl-none transform rotate-45 border-[1px] border-[#3CB84B]" />
         </div>
         <div className="absolute -top-8 left-16 w-14 h-14 bg-[#FF9800] rounded-full shadow-[0_6px_10px_rgba(0,0,0,0.3),inset_-3px_-4px_10px_#CC7A00] border-[2px] border-[#CC7A00] flex items-center justify-center">
            <div className="w-2.5 h-2.5 bg-[#664024] rounded-full absolute top-3 left-4" />
            <div className="absolute top-2 left-3 w-5 h-5 bg-white/60 rounded-full blur-[1.5px]" />
         </div>
      </div>
      
      {/* Seller */}
      <div className="absolute bottom-28 right-[15%] z-[-1]">
         <Kid3DCharacter shirtColor={COLORS.grass} shirtDark={COLORS.grassDark} skinColor="#FDBA74" hairType="girl" pose="seller" className="scale-[0.85] origin-bottom" />
      </div>
      
      {/* Kid pointing */}
      <div className="absolute bottom-8 left-[15%] z-10">
        <Kid3DCharacter shirtColor={COLORS.sky} shirtDark={COLORS.skyDark} skinColor="#FDE68A" hairType="boy" pose="pointing" />
        {!isThumbnail && <AnimatedArrow className="-top-[50px] left-[65%]" />}
      </div>
      <div className={cn("absolute z-20", isThumbnail ? "top-6 right-2" : "top-10 right-[15%] sm:right-[20%]")}>
        <HoovyMascot size={isThumbnail ? 100 : 140} state="speaking" />
      </div>
    </div>
  </div>
)};

const SceneTellingTime = ({ isThumbnail = false }: { isThumbnail?: boolean }) => (
  <div className="relative w-full h-full bg-gradient-to-b from-[#47C2FF] to-[#A3E5FF] overflow-hidden">
    <div className={cn("absolute inset-0 w-full h-full origin-[50%_70%] transition-transform duration-500", isThumbnail ? "scale-[0.6]" : "scale-100")}>
      
      {/* Classroom Walls and Floor */}
      <div className="absolute bottom-0 w-full h-24 bg-gradient-to-t from-[#E69500] to-[#FFD833] shadow-[inset_0_15px_20px_rgba(255,255,255,0.4)] border-t-[10px] border-[#CC7A00]" />
      
      {/* Whiteboard Background Element */}
      <div className="absolute top-10 left-10 w-48 h-32 bg-white/90 rounded-2xl border-[6px] border-[#A3E5FF] shadow-[0_10px_20px_rgba(0,0,0,0.1)] flex flex-col items-center justify-end pb-2">
         <div className="w-10 h-2 bg-gray-300 rounded-full" />
      </div>

      {/* Giant 3D Clock */}
      <div className="absolute top-6 right-1/4 w-36 h-36 bg-[#FFFDF5] rounded-full shadow-[0_15px_30px_rgba(0,0,0,0.2),inset_0_-8px_20px_rgba(0,0,0,0.1)] flex items-center justify-center border-[12px] border-[#FF4766]">
        <div className="absolute top-2 left-4 w-16 h-8 bg-white/90 rounded-full blur-[2px] transform -rotate-12" />
        
        {/* Clock Ticks */}
        {[...Array(12)].map((_, i) => (
          <div key={i} className="absolute w-1.5 h-1.5 bg-[#2A3A50] rounded-full" style={{ transform: `rotate(${i * 30}deg) translateY(-45px)` }} />
        ))}

        <div className="w-5 h-5 bg-[#33D6FF] rounded-full z-10 shadow-sm border-2 border-white" />
        <div className="absolute w-3 h-14 bg-[#2A3A50] rounded-full bottom-1/2 left-1/2 -translate-x-1/2 origin-bottom shadow-md" />
        <div className="absolute w-12 h-2.5 bg-[#2A3A50] rounded-full top-1/2 left-1/2 -translate-y-1/2 origin-left shadow-md" />
      </div>
      
      {/* Kid Pointing */}
      <div className="absolute bottom-8 left-[30%]">
        <Kid3DCharacter shirtColor={COLORS.red} shirtDark="#D93D55" skinColor="#FFEDD5" hairType="boy" pose="pointing" />
        {!isThumbnail && <AnimatedArrow className="left-1/2 -top-[60px]" />}
      </div>
      <div className={cn("absolute z-10", isThumbnail ? "top-6 right-2" : "top-12 right-[5%] sm:right-[10%]")}>
        <HoovyMascot size={isThumbnail ? 100 : 140} state="speaking" />
      </div>
    </div>
  </div>
);

const SceneHowIFeel = ({ isThumbnail = false }: { isThumbnail?: boolean }) => (
  <div className="relative w-full h-full bg-gradient-to-b from-[#FF7EB3] to-[#FF4766] overflow-hidden">
    <div className={cn("absolute inset-0 w-full h-full origin-[50%_70%] transition-transform duration-500", isThumbnail ? "scale-[0.6]" : "scale-100")}>
      
      {/* Soft Playroom Floor */}
      <div className="absolute bottom-0 w-full h-24 bg-gradient-to-t from-[#A877FF] to-[#DDA0DD] shadow-[inset_0_15px_20px_rgba(255,255,255,0.4)] border-t-[10px] border-[#8A4FCC]" />
      
      {/* Floating 3D Emotion Orbs */}
      <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="absolute top-10 left-[15%] w-20 h-20 bg-gradient-to-br from-[#FFF8B3] to-[#FF9800] rounded-full flex flex-col items-center justify-center shadow-[inset_-4px_-6px_12px_#CC7A00,0_10px_20px_rgba(0,0,0,0.2)] border-[5px] border-[#FFD833] z-10">
        <div className="absolute top-2 left-2 w-8 h-4 bg-white/80 rounded-full blur-[1px] transform -rotate-12" />
        <div className="flex gap-2.5 mb-1.5"><div className="w-3 h-3 bg-[#2A3A50] rounded-full"/><div className="w-3 h-3 bg-[#2A3A50] rounded-full"/></div>
        <div className="w-10 h-4 border-b-[5px] border-[#2A3A50] rounded-b-full"/>
      </motion.div>
      
      <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 3.5 }} className="absolute top-20 right-[40%] w-24 h-24 bg-gradient-to-br from-[#A3E5FF] to-[#1FA3E6] rounded-full flex flex-col items-center justify-center shadow-[inset_-4px_-6px_12px_#1C86D9,0_10px_20px_rgba(0,0,0,0.2)] border-[5px] border-[#47C2FF] z-10">
        <div className="absolute top-2 left-3 w-8 h-4 bg-white/80 rounded-full blur-[1px] transform -rotate-12" />
        <div className="flex gap-3 mb-2"><div className="w-3.5 h-3.5 bg-[#2A3A50] rounded-full"/><div className="w-3.5 h-3.5 bg-[#2A3A50] rounded-full"/></div>
        <div className="w-10 h-4 border-t-[5px] border-[#2A3A50] rounded-t-full mt-2"/>
      </motion.div>

      <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 2.8 }} className="absolute top-12 right-[15%] w-16 h-16 bg-gradient-to-br from-[#FF7EB3] to-[#D93D55] rounded-full flex flex-col items-center justify-center shadow-[inset_-4px_-6px_12px_#990000,0_10px_20px_rgba(0,0,0,0.2)] border-[4px] border-[#FF4766] z-10">
        <div className="absolute top-1 left-2 w-6 h-3 bg-white/80 rounded-full blur-[1px] transform -rotate-12" />
        <div className="flex gap-2 mb-1.5 items-end"><div className="w-5 h-1.5 bg-[#2A3A50] rounded-full rotate-45"/><div className="w-5 h-1.5 bg-[#2A3A50] rounded-full -rotate-45"/></div>
        <div className="w-8 h-1.5 border-t-[5px] border-[#2A3A50] mt-1.5"/>
      </motion.div>
      
      {/* Kid in Center */}
      <div className="absolute bottom-8 left-[35%]">
        <Kid3DCharacter shirtColor={COLORS.grass} shirtDark="#3CB84B" skinColor="#FDE68A" hairType="boy" pose="idle" />
        {!isThumbnail && <AnimatedArrow className="left-[40%] -top-[50px]" />}
      </div>
      <div className={cn("absolute z-20", isThumbnail ? "top-6 right-2" : "top-12 right-[5%] sm:right-[10%]")}>
        <HoovyMascot size={isThumbnail ? 100 : 140} state="speaking" />
      </div>
    </div>
  </div>
);

// --- Scenario Data Mapping ---
const scenariosData: Record<string, any> = {
  social: {
    title: "Making Friends",
    stepText: "Episode 1",
    hoovyText: "Let's say hello to our new friend!",
    cueText: "Say: \"Hi!\"",
    Scene: SceneMakingFriends,
    colorClass: "bg-[#47C2FF]",
    shadowClass: "shadow-[0_8px_0_#1FA3E6,0_15px_30px_rgba(0,0,0,0.15)]",
    stars: 1,
    choices: [
      { label: "Hi!", bg: "bg-[#47C2FF]", border: "border-[#1FA3E6]", icon: 'wave', isCorrect: true },
      { label: "Hello!", bg: "bg-[#59D968]", border: "border-[#3CB84B]", icon: 'hello', isCorrect: true },
      { label: "Goodbye", bg: "bg-[#FF4766]", border: "border-[#D93D55]", icon: 'goodbye', isCorrect: false }
    ]
  },
  money: {
    title: "Buying a Snack",
    stepText: "Episode 2",
    hoovyText: "Let's ask for a snack politely!",
    cueText: "Say: \"Can I have a snack?\"",
    Scene: SceneBuyingSnack,
    colorClass: "bg-[#FFD833]",
    shadowClass: "shadow-[0_8px_0_#FF9800,0_15px_30px_rgba(0,0,0,0.15)]",
    stars: 2,
    choices: [
      { label: "Can I have a snack?", bg: "bg-[#47C2FF]", border: "border-[#1FA3E6]", icon: 'ask_snack', isCorrect: true },
      { label: "Give me snack!", bg: "bg-[#FF4766]", border: "border-[#D93D55]", icon: 'grab', isCorrect: false },
      { label: "Goodbye", bg: "bg-[#A877FF]", border: "border-[#8A4FCC]", icon: 'goodbye', isCorrect: false }
    ]
  },
  time: {
    title: "Telling Time",
    stepText: "Episode 3",
    hoovyText: "Let's look at the big clock together!",
    cueText: "Say: \"It is 3 o'clock.\"",
    Scene: SceneTellingTime,
    colorClass: "bg-[#A877FF]",
    shadowClass: "shadow-[0_8px_0_#8A4FCC,0_15px_30px_rgba(0,0,0,0.15)]",
    stars: 3,
    choices: [
      { label: "3 o'clock", bg: "bg-[#47C2FF]", border: "border-[#1FA3E6]", icon: 'clock3', isCorrect: true },
      { label: "Snack time", bg: "bg-[#59D968]", border: "border-[#3CB84B]", icon: 'snack_time', isCorrect: false },
      { label: "Goodbye", bg: "bg-[#FF4766]", border: "border-[#D93D55]", icon: 'goodbye', isCorrect: false }
    ]
  },
  emotions: {
    title: "How I Feel",
    stepText: "Episode 4",
    hoovyText: "Let's name this feeling together.",
    cueText: "Say: \"I feel happy.\"",
    Scene: SceneHowIFeel,
    colorClass: "bg-[#FF7EB3]",
    shadowClass: "shadow-[0_8px_0_#E13B63,0_15px_30px_rgba(0,0,0,0.15)]",
    stars: 0,
    choices: [
      { label: "Happy", bg: "bg-[#59D968]", border: "border-[#3CB84B]", icon: 'happy', isCorrect: true },
      { label: "Sad", bg: "bg-[#47C2FF]", border: "border-[#1FA3E6]", icon: 'sad', isCorrect: false },
      { label: "Angry", bg: "bg-[#FF4766]", border: "border-[#D93D55]", icon: 'angry', isCorrect: false }
    ]
  }
};


// --- App Components ---

const ChoiceCard = ({ icon, label, bg, border, onClick }: any) => (
  <motion.button 
    onClick={onClick}
    whileHover={{ y: -6 }}
    whileTap={{ y: 2, scale: 0.95 }}
    className={cn(
      "flex-1 sm:w-[30%] max-w-[140px] aspect-[3/4] sm:aspect-square rounded-[2rem] flex flex-col items-center p-3 transition-all",
      "border-[6px] border-white shadow-[0_8px_0_rgba(0,0,0,0.15)] active:shadow-none active:border-b-[3px]",
      bg
    )}
  >
    <div className="w-full flex-1 rounded-xl overflow-hidden bg-white/90 shadow-[inset_0_3px_8px_rgba(0,0,0,0.1)] flex items-center justify-center p-2 border-[3px] border-white">
      <CustomIcon type={icon} />
    </div>
    <div className="mt-2 flex items-center justify-center w-full">
      <span className="font-extrabold text-white text-lg sm:text-xl text-center leading-tight drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]">{label}</span>
    </div>
  </motion.button>
);

const AdventureCard = ({ title, Scene, shadowClass, stars, onClick }: any) => {
  return (
    <motion.button
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ y: 4, scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "p-3 sm:p-4 rounded-[2.5rem] text-left border-[8px] border-white flex flex-col transition-all group overflow-hidden relative bg-[#FFFDF5]",
        shadowClass
      )}
    >
      <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden mb-4 border-[6px] border-white shadow-[inset_0_6px_15px_rgba(0,0,0,0.2)] relative z-10 flex items-center justify-center bg-white group-hover:opacity-95 transition-opacity">
         <Scene isThumbnail={true} />
      </div>
      <div className="px-2 pb-2 relative z-10 flex flex-col justify-between flex-1">
        <h3 className="text-2xl font-extrabold text-navy leading-tight mb-3 drop-shadow-[0_1px_1px_rgba(0,0,0,0.05)]">{title}</h3>
        <div className="flex gap-1 mt-auto bg-white/70 p-2 rounded-full w-max shadow-inner border-2 border-white">
          {[1, 2, 3].map(star => (
            <Star key={star} size={24} strokeWidth={2.5} className={cn(
              star <= stars ? "fill-[#FFD833] text-[#FF9800] drop-shadow-[0_2px_2px_rgba(255,159,51,0.4)]" : "fill-white text-[#CBD5E1]"
            )} />
          ))}
        </div>
      </div>
    </motion.button>
  );
};

const InteractiveFeedbackOverlay = ({ state, onContinue }: { state: 'correct' | 'wrong', onContinue: () => void }) => {
  const isCorrect = state === 'correct';
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 backdrop-blur-sm p-4"
    >
      <motion.div 
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0, transition: { type: "spring", bounce: 0.5 } }}
        className={cn(
          "w-full max-w-xl rounded-[3rem] border-[10px] border-white p-6 sm:p-10 flex flex-col items-center text-center shadow-[0_20px_40px_rgba(0,0,0,0.3)] relative overflow-hidden",
          isCorrect ? "bg-gradient-to-b from-[#59D968] to-[#3CB84B] shadow-[0_15px_0_#3CB84B]" : "bg-gradient-to-b from-[#FFD833] to-[#FF9800] shadow-[0_15px_0_#CC7A00]"
        )}
      >
        {isCorrect && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] animate-spin-slow" style={{ background: 'conic-gradient(from 0deg, transparent 0deg 40deg, rgba(255,255,255,0.25) 40deg 80deg, transparent 80deg 120deg, rgba(255,255,255,0.25) 120deg 160deg, transparent 160deg 200deg, rgba(255,255,255,0.25) 200deg 240deg, transparent 240deg 280deg, rgba(255,255,255,0.25) 280deg 320deg, transparent 320deg 360deg)' }} />
          </div>
        )}

        <div className="relative z-10 bg-white/30 p-4 rounded-full border-[6px] border-white shadow-inner mb-4">
          <HoovyMascot size={140} state={isCorrect ? 'happy' : 'wrong'} />
        </div>

        <h2 className="text-4xl sm:text-5xl font-extrabold text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.2)] mb-3 relative z-10">
          {isCorrect ? "Great Job!" : "Try Again!"}
        </h2>
        <p className="text-xl sm:text-2xl text-white font-bold drop-shadow-sm mb-8 max-w-sm relative z-10">
          {isCorrect ? "You earned a shiny new star!" : "You can do it, buddy! Let's try one more time."}
        </p>

        {isCorrect && (
           <div className="flex gap-3 mb-8 relative z-10">
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 1 }}><Star size={48} className="fill-[#FFD833] text-white drop-shadow-[0_6px_6px_rgba(0,0,0,0.2)]" /></motion.div>
              <motion.div animate={{ y: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}><Star size={64} className="fill-[#FFD833] text-white drop-shadow-[0_6px_6px_rgba(0,0,0,0.2)]" /></motion.div>
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}><Star size={48} className="fill-[#FFD833] text-white drop-shadow-[0_6px_6px_rgba(0,0,0,0.2)]" /></motion.div>
           </div>
        )}

        <button 
          onClick={onContinue}
          className="relative z-10 w-full max-w-[240px] py-4 bg-white text-navy text-2xl font-extrabold rounded-[2rem] border-[6px] border-transparent shadow-[0_8px_0_rgba(0,0,0,0.15)] active:translate-y-2 active:shadow-none transition-all flex items-center justify-center gap-3"
        >
          {isCorrect ? "Next" : "Keep Trying"}
          <ArrowRight size={28} strokeWidth={4} />
        </button>
      </motion.div>
    </motion.div>
  );
}

// --- Main App Flow Screens ---

const WelcomeScreen = ({ onStart }: { onStart: () => void }) => {
  const letters = "Hoovy!".split("");
  const colors = [COLORS.red, COLORS.orange, COLORS.yellow, COLORS.grass, COLORS.sky, COLORS.purple];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 text-center z-10 relative pb-24">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.5 }}
        className="max-w-2xl w-full bg-[#FFFDF5] rounded-[3.5rem] p-6 sm:p-10 shadow-[0_15px_0_#D98A1C,0_25px_40px_rgba(0,0,0,0.2)] border-[10px] border-white flex flex-col items-center"
      >
        {/* Focused Hero Scene */}
        <div className="relative w-full h-64 sm:h-72 rounded-[2.5rem] overflow-hidden bg-gradient-to-b from-[#47C2FF] to-[#1FA3E6] mb-8 border-[8px] border-white shadow-[inset_0_10px_20px_rgba(0,0,0,0.2)] flex items-end justify-center">
           {/* Floating Toy Star replacing the rainbow */}
           <motion.div animate={{ rotate: 360, y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 8 }} className="absolute top-6 left-6 w-16 h-16 opacity-90">
              <Star size={48} className="fill-[#FFD833] text-[#FF9800] drop-shadow-md" />
           </motion.div>
           <motion.div animate={{ rotate: -360, y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 6 }} className="absolute top-12 right-10 w-12 h-12 opacity-80">
              <Star size={36} className="fill-[#FF7EB3] text-[#FF4766] drop-shadow-md" />
           </motion.div>

           {/* Hero Hills */}
           <div className="absolute -bottom-10 left-[-20%] w-[80%] h-32 bg-gradient-to-t from-[#3CB84B] to-[#59D968] rounded-[100%] shadow-[inset_0_15px_20px_rgba(255,255,255,0.4)] border-t-[8px] border-[#3CB84B]" />
           <div className="absolute -bottom-16 right-[-20%] w-[90%] h-40 bg-gradient-to-t from-[#3CB84B] to-[#59D968] rounded-[100%] shadow-[inset_0_15px_20px_rgba(255,255,255,0.4)] border-t-[8px] border-[#3CB84B]" />

           <div className="relative z-10 mb-4 scale-110 origin-bottom">
              <HoovyMascot size={180} state="happy" />
           </div>
        </div>
        
        <h1 className="text-4xl sm:text-6xl font-extrabold text-navy mb-4 tracking-tight flex items-center justify-center gap-3">
          Hi, I'm 
          <span className="flex">
            {letters.map((letter, i) => (
              <motion.span 
                key={i}
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.1 }}
                style={{ color: colors[i % colors.length] }}
                className="drop-shadow-[0_4px_0_rgba(0,0,0,0.15)] ml-1"
              >
                {letter}
              </motion.span>
            ))}
          </span>
        </h1>
        <p className="text-xl sm:text-2xl text-navy/80 mb-8 font-bold max-w-md leading-snug">
          Your friendly learning buddy. Let's play, learn, and grow together!
        </p>

        <button 
          onClick={onStart}
          className="w-full py-6 bg-[#59D968] hover:bg-[#4dd25d] text-white text-3xl sm:text-4xl font-extrabold rounded-[3rem] border-[10px] border-white shadow-[0_12px_0_#3CB84B,0_20px_30px_rgba(60,184,75,0.4)] active:translate-y-3 active:shadow-none flex items-center justify-center gap-4 transition-all group overflow-hidden relative"
        >
          <div className="absolute top-2 left-8 right-8 h-4 bg-white/40 rounded-full blur-[2px]" />
          Let's Play!
          <div className="bg-white/40 p-3 rounded-full shadow-inner group-hover:scale-110 transition-transform">
            <Play size={32} className="fill-white text-white ml-1" />
          </div>
        </button>
      </motion.div>
    </div>
  );
};

const PlaygroundDashboard = ({ onScenarioSelect }: { onScenarioSelect: (s: string) => void }) => {
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto w-full pb-32 z-10 relative">
      <div className="w-full relative h-48 sm:h-64 rounded-[3rem] overflow-hidden bg-gradient-to-br from-[#47C2FF] to-[#A877FF] border-[10px] border-white shadow-[0_15px_0_rgba(0,0,0,0.1),0_20px_30px_rgba(0,0,0,0.15)] mb-12 flex items-center p-6 sm:p-10">
        <div className="absolute -bottom-16 left-[-10%] w-[120%] h-32 bg-gradient-to-t from-[#3CB84B] to-[#59D968] rounded-t-[100%] shadow-[inset_0_15px_20px_rgba(255,255,255,0.3)] border-t-[10px] border-[#3CB84B]" />
        
        <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-sm px-6 py-2 rounded-full border-[6px] border-[#FFD833] flex items-center gap-3 shadow-[0_6px_0_#FF9800]">
          <Star size={32} className="fill-[#FFD833] text-[#FF9800] animate-spin-slow" />
          <span className="text-[#FF9800] font-extrabold text-2xl">12</span>
        </div>

        <div className="absolute bottom-0 right-8 sm:right-24 z-10 w-32 sm:w-48 transform translate-y-4">
          <HoovyMascot size={150} state="happy" className="sm:scale-125 origin-bottom" />
        </div>

        <div className="relative z-20 max-w-[65%] sm:max-w-[55%]">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.2)] mb-3 leading-tight">
            Welcome to<br />Playground!
          </h1>
          <p className="text-[#1FA3E6] font-extrabold text-lg sm:text-xl bg-white px-5 py-2 rounded-full shadow-[0_4px_0_rgba(0,0,0,0.1)] inline-block border-[4px] border-[#FFFDF5]">
            Pick an episode to play!
          </p>
        </div>
      </div>

      <h2 className="text-3xl sm:text-4xl font-extrabold text-navy mb-6 flex items-center gap-4 drop-shadow-[0_2px_2px_rgba(0,0,0,0.05)]">
        <div className="w-12 h-12 bg-[#FFD833] border-[4px] border-white text-[#FF9800] rounded-[1.5rem] flex items-center justify-center rotate-6 shadow-[0_4px_0_rgba(0,0,0,0.1)]">
           <Star size={28} className="fill-[#FFD833]" />
        </div>
        My Episodes
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-12">
        <AdventureCard {...scenariosData.social} onClick={() => onScenarioSelect('social')} />
        <AdventureCard {...scenariosData.money} onClick={() => onScenarioSelect('money')} />
        <AdventureCard {...scenariosData.time} onClick={() => onScenarioSelect('time')} />
        <AdventureCard {...scenariosData.emotions} onClick={() => onScenarioSelect('emotions')} />
      </div>
    </div>
  );
};

const GuidedInteractionScreen = ({ scenarioId, onBack }: { scenarioId: string, onBack: () => void }) => {
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const scenario = scenariosData[scenarioId] || scenariosData.social;
  const ActiveScene = scenario.Scene;

  return (
    <>
      <AnimatePresence>
        {feedback !== 'none' && (
          <InteractiveFeedbackOverlay state={feedback} onContinue={() => { setFeedback('none'); if(feedback === 'correct') onBack(); }} />
        )}
      </AnimatePresence>

      <div className="min-h-screen flex flex-col font-sans relative z-10 pb-40">
        
        {/* Top Navigation */}
        <div className="w-[95%] max-w-5xl mx-auto mt-4 bg-white/95 backdrop-blur-md border-[6px] border-[#FFFDF5] shadow-[0_6px_0_rgba(0,0,0,0.08)] rounded-[2.5rem] p-3 sm:p-4 flex items-center justify-between z-20">
          <button onClick={onBack} className="w-14 h-14 flex items-center justify-center bg-[#FF4766] text-white rounded-full border-[4px] border-white shadow-[0_6px_0_#D93D55] active:translate-y-2 active:shadow-none transition-all">
            <ArrowLeft size={32} strokeWidth={4} />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-[#FF9800] font-extrabold text-sm sm:text-lg tracking-widest uppercase">{scenario.stepText}</span>
            <h2 className="text-navy font-extrabold text-xl sm:text-2xl leading-none">{scenario.title}</h2>
          </div>
          <div className="flex gap-2 items-center bg-[#FFFDF5] p-2 sm:p-3 rounded-full border-[4px] border-white shadow-inner">
            <Star size={28} className="fill-[#FFD833] text-[#FF9800]" />
            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border-[4px] border-white bg-[#CBD5E1] shadow-inner" />
            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border-[4px] border-white bg-[#CBD5E1] shadow-inner" />
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center p-4 sm:p-6 w-full max-w-5xl mx-auto gap-4 mt-2">
          
          {/* Main 3D Scene */}
          <div className="relative w-full h-48 sm:h-64 lg:h-[300px] rounded-[3rem] overflow-hidden border-[10px] border-white shadow-[0_15px_25px_rgba(0,0,0,0.15)] flex-shrink-0 bg-white">
            <ActiveScene isThumbnail={false} />
          </div>

          {/* Clean Instruction Bubble */}
          <div className="flex flex-col items-center z-10 w-full relative -mt-10 sm:-mt-12">
             <div className="bg-white px-6 sm:px-8 py-4 sm:py-5 rounded-[2.5rem] shadow-[0_8px_0_rgba(0,0,0,0.08)] border-[6px] border-[#FFFDF5] flex items-center justify-center gap-4 sm:gap-5 w-[95%] sm:max-w-2xl mx-auto">
                <button className="w-14 h-14 sm:w-16 sm:h-16 bg-[#59D968] text-white rounded-full flex items-center justify-center flex-shrink-0 border-[4px] border-white shadow-[0_6px_0_#3CB84B] active:translate-y-1 active:shadow-none transition-all">
                  <Volume2 size={28} strokeWidth={4} />
                </button>
                <p className="text-navy font-extrabold text-xl sm:text-2xl flex-1 leading-snug">
                  {scenario.hoovyText}
                </p>
             </div>
             
             <div className="bg-[#FFD833] px-8 py-3 rounded-full border-[6px] border-white text-[#FF9800] font-extrabold text-2xl sm:text-3xl tracking-wide -mt-5 shadow-[0_6px_0_rgba(0,0,0,0.1)] z-20">
               {scenario.cueText}
             </div>
          </div>

          {/* Response Cards */}
          <div className="w-full flex justify-center gap-4 sm:gap-6 mt-2 z-10">
            {scenario.choices.map((choice: any, index: number) => (
              <ChoiceCard key={index} {...choice} onClick={() => setFeedback(choice.isCorrect ? 'correct' : 'wrong')} />
            ))}
          </div>
        </div>

        {/* Floating Action Button area */}
        <div className="fixed bottom-0 left-0 w-full p-4 sm:p-6 bg-gradient-to-t from-[#47C2FF] via-[#47C2FF]/80 to-transparent pt-10 z-30 pointer-events-none">
          <div className="max-w-xl mx-auto pointer-events-auto">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98, y: 8, boxShadow: "none" }}
              className="w-full py-4 sm:py-5 bg-[#FF4766] rounded-[3.5rem] shadow-[0_12px_0_#D93D55,0_20px_30px_rgba(217,61,85,0.4)] text-white flex items-center justify-center gap-5 border-[8px] border-white transition-all group relative overflow-hidden"
            >
              <div className="absolute top-2 left-8 right-8 h-4 bg-white/40 rounded-full blur-[2px]" />
              <div className="w-14 h-14 bg-white/30 rounded-full flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                <Mic size={32} strokeWidth={4} />
              </div>
              <span className="text-3xl sm:text-4xl font-extrabold tracking-wide drop-shadow-sm">Say it!</span>
            </motion.button>
          </div>
        </div>
      </div>
    </>
  );
};

const ProgressDashboard = () => {
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto w-full pb-32 z-10 relative">
      <header className="mb-10 bg-white rounded-[2.5rem] p-6 sm:p-8 border-[8px] border-[#FFFDF5] shadow-[0_10px_0_rgba(0,0,0,0.08)] flex items-center justify-between">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-navy flex items-center gap-3">
           <div className="p-2.5 bg-[#59D968] rounded-2xl border-[4px] border-white shadow-sm"><BarChart2 className="text-white" size={28} /></div>
           Growth & Progress
        </h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-[0_8px_0_rgba(0,0,0,0.08)] border-[6px] border-[#FFFDF5] flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-[#59D968] text-white rounded-full border-[4px] border-white shadow-[0_6px_0_#3CB84B] flex items-center justify-center mb-4">
            <CheckCircle2 size={36} strokeWidth={3} />
          </div>
          <h3 className="text-4xl font-extrabold text-navy">14</h3>
          <p className="text-navy/60 font-extrabold text-lg mt-1 uppercase tracking-wider">Activities</p>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] shadow-[0_8px_0_rgba(0,0,0,0.08)] border-[6px] border-[#FFFDF5] flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-[#FFD833] text-[#FF9800] rounded-full border-[4px] border-white shadow-[0_6px_0_#FF9800] flex items-center justify-center mb-4">
            <Star size={36} strokeWidth={3} className="fill-[#FF9800]" />
          </div>
          <h3 className="text-4xl font-extrabold text-navy">42</h3>
          <p className="text-navy/60 font-extrabold text-lg mt-1 uppercase tracking-wider">Stars</p>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] shadow-[0_8px_0_rgba(0,0,0,0.08)] border-[6px] border-[#FFFDF5] flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-[#47C2FF] text-white rounded-full border-[4px] border-white shadow-[0_6px_0_#1FA3E6] flex items-center justify-center mb-4">
            <Clock size={36} strokeWidth={3} />
          </div>
          <h3 className="text-4xl font-extrabold text-navy">2.5h</h3>
          <p className="text-navy/60 font-extrabold text-lg mt-1 uppercase tracking-wider">Play Time</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[3rem] shadow-[0_10px_0_rgba(0,0,0,0.08)] border-[8px] border-[#FFFDF5] mb-10">
        <h2 className="text-2xl font-extrabold text-navy mb-8 flex items-center gap-3">
          <Sparkles className="text-[#FF9800]" size={28} /> Skill Focus Areas
        </h2>
        <div className="space-y-6">
          {[
            { label: 'Communication', value: '80%', color: 'from-[#47C2FF] to-[#1FA3E6]', bg: 'bg-[#B3E5FF]', text: 'Great progress!' },
            { label: 'Social Interactions', value: '60%', color: 'from-[#FFD833] to-[#FF9800]', bg: 'bg-[#FFF8B3]', text: 'Getting there' },
            { label: 'Emotional Regulation', value: '40%', color: 'from-[#59D968] to-[#3CB84B]', bg: 'bg-[#C5F4CD]', text: 'Needs practice' }
          ].map((skill, i) => (
            <div key={i}>
              <div className="flex justify-between text-base font-extrabold text-navy/70 mb-3">
                <span>{skill.label}</span>
                <span>{skill.text}</span>
              </div>
              <div className={`w-full ${skill.bg} h-8 rounded-full border-[3px] border-white shadow-inner p-1 relative`}>
                <div className={`bg-gradient-to-r ${skill.color} h-full rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.1)] relative`} style={{ width: skill.value }}>
                   <div className="absolute top-1 left-3 right-3 h-2 bg-white/40 rounded-full blur-[1px]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#FFFDF5] to-[#FFF8B3] p-8 rounded-[3rem] border-[8px] border-white shadow-[0_10px_0_rgba(0,0,0,0.08)] flex flex-col md:flex-row items-center gap-8">
        <div className="p-4 bg-white rounded-full shadow-[0_6px_0_rgba(0,0,0,0.05)] border-[4px] border-white">
           <HoovyMascot size={100} state="happy" />
        </div>
        <div>
          <h3 className="text-2xl font-extrabold text-navy mb-3">Note from Hoovy</h3>
          <p className="text-navy/80 font-bold text-xl leading-relaxed bg-white/80 p-5 rounded-2xl shadow-inner border-2 border-white">
            "They showed incredible patience during the 'Taking Turns' activity today! I recommend focusing on 'Recognizing Emotions' next week."
          </p>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto w-full pb-32 z-10 relative">
       <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white rounded-[2.5rem] p-6 sm:p-8 border-[8px] border-[#FFFDF5] shadow-[0_10px_0_rgba(0,0,0,0.08)]">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-navy flex items-center gap-3">
             <div className="p-2.5 bg-[#A877FF] rounded-2xl border-[4px] border-white shadow-sm"><Settings className="text-white" size={28} /></div>
             Scenario Builder
          </h1>
          <p className="text-lg text-navy/60 font-bold mt-2 ml-14">Create new learning modules.</p>
        </div>
        <button className="px-6 py-4 bg-[#47C2FF] text-white rounded-[2rem] font-extrabold text-xl border-[4px] border-white shadow-[0_6px_0_#1FA3E6] active:translate-y-1 active:shadow-none flex items-center gap-2 hover:bg-[#1FA3E6]">
          <Wand2 size={24} /> Generate
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white p-6 rounded-[2.5rem] shadow-[0_8px_0_rgba(0,0,0,0.08)] border-[6px] border-[#FFFDF5]">
          <h3 className="text-xl font-extrabold text-navy mb-6 flex items-center gap-2">
            <Sparkles className="text-[#FF9800]" size={24}/> AI Prompt
          </h3>
          
          <div className="space-y-5">
            <div>
              <label className="block text-base font-extrabold text-navy/70 mb-2">Skill Target</label>
              <select className="w-full bg-[#FFFDF5] border-[4px] border-white shadow-inner rounded-[1.5rem] p-4 font-bold text-navy outline-none focus:ring-4 ring-[#47C2FF]/30">
                <option>Going to the grocery store</option>
                <option>Dealing with loud noises</option>
                <option>Sharing toys</option>
              </select>
            </div>
            
            <div>
              <label className="block text-base font-extrabold text-navy/70 mb-2">Child's Interests</label>
              <input 
                type="text" 
                placeholder="e.g. Dinosaurs, Trains"
                className="w-full bg-[#FFFDF5] border-[4px] border-white shadow-inner rounded-[1.5rem] p-4 font-bold text-navy outline-none focus:ring-4 ring-[#47C2FF]/30"
                defaultValue="Trains"
              />
            </div>

            <div>
              <label className="block text-base font-extrabold text-navy/70 mb-2">Complexity Level</label>
              <div className="flex gap-2">
                {['Low', 'Medium', 'High'].map(level => (
                  <button key={level} className={cn(
                    "flex-1 py-3 rounded-2xl font-extrabold border-[3px] transition-all",
                    level === 'Low' ? "bg-[#59D968] border-white shadow-[0_4px_0_#3CB84B] text-white" : "bg-[#F1F5F9] border-white text-navy/50 shadow-inner"
                  )}>
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-[#FFFDF5] p-6 rounded-[2.5rem] border-[6px] border-white shadow-[inset_0_4px_10px_rgba(0,0,0,0.05)] flex flex-col">
          <div className="flex justify-between items-center mb-6 px-2">
             <h3 className="text-xl font-extrabold text-navy">Draft: <span className="text-navy/50">Train Station Visit</span></h3>
             <span className="px-4 py-2 bg-[#59D968] text-white text-sm font-extrabold rounded-full uppercase border-2 border-white shadow-sm">Ready</span>
          </div>

          <div className="flex-1 bg-white rounded-[2rem] p-6 sm:p-8 border-[4px] border-white shadow-[0_8px_0_rgba(0,0,0,0.05)] space-y-8">
            <div className="flex gap-4">
               <div className="w-12 h-12 bg-[#47C2FF] rounded-[1rem] flex items-center justify-center text-white flex-shrink-0 shadow-sm border-2 border-white">
                  <BookOpen size={24} />
               </div>
               <div>
                  <h4 className="font-extrabold text-navy text-lg mb-2">Context</h4>
                  <p className="text-navy/70 font-bold leading-relaxed bg-[#F8FAFC] p-4 rounded-2xl">The child is visiting a busy train station. Hoovy helps them buy a ticket and wait patiently while managing sensory input.</p>
               </div>
            </div>

            <div className="flex gap-4">
               <div className="w-12 h-12 bg-[#FFD833] rounded-[1rem] flex items-center justify-center text-[#FF9800] flex-shrink-0 shadow-sm border-2 border-white">
                  <MessageCircle size={24} />
               </div>
               <div>
                  <h4 className="font-extrabold text-navy text-lg mb-2">Hoovy's Line</h4>
                  <p className="text-navy/80 font-bold italic bg-[#FFFDF5] p-4 rounded-2xl border-2 border-white shadow-inner">"Wow, look at all the big trains! It's a little noisy here, isn't it? If it's too loud, you can cover your ears, and that's okay."</p>
               </div>
            </div>

            <div className="pt-4 flex justify-end gap-4">
              <button className="px-6 py-3 font-extrabold text-navy/50 bg-[#F1F5F9] rounded-2xl hover:bg-[#E2E8F0]">Edit</button>
              <button className="px-8 py-3 font-extrabold bg-[#2A3A50] text-white rounded-2xl shadow-[0_4px_0_#1A252F] hover:translate-y-1 hover:shadow-none">Save & Publish</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


// --- Main App Component ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'onboarding' | 'playground' | 'interaction' | 'progress' | 'admin'>('onboarding');
  const [selectedScenario, setSelectedScenario] = useState<string>('social');

  const navItems = [
    { id: 'playground', icon: Home, label: 'Episodes', color: 'bg-[#47C2FF]', shadow: 'shadow-[0_4px_0_#1FA3E6]' },
    { id: 'progress', icon: BarChart2, label: 'Growth', color: 'bg-[#59D968]', shadow: 'shadow-[0_4px_0_#3CB84B]' },
    { id: 'admin', icon: Settings, label: 'Therapist', color: 'bg-[#A877FF]', shadow: 'shadow-[0_4px_0_#8A4FCC]' },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden relative" style={{ fontFamily: "'Fredoka', 'Nunito', sans-serif", color: COLORS.navy }}>
      <CartoonWorldBackground />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="h-full"
        >
          {activeTab === 'onboarding' && <WelcomeScreen onStart={() => setActiveTab('playground')} />}
          {activeTab === 'playground' && (
            <PlaygroundDashboard 
              onScenarioSelect={(s) => { 
                setSelectedScenario(s); 
                setActiveTab('interaction'); 
              }} 
            />
          )}
          {activeTab === 'interaction' && (
            <GuidedInteractionScreen 
              scenarioId={selectedScenario} 
              onBack={() => setActiveTab('playground')} 
            />
          )}
          {activeTab === 'progress' && <ProgressDashboard />}
          {activeTab === 'admin' && <AdminDashboard />}
        </motion.div>
      </AnimatePresence>

      {/* Chunky Toy Navigation */}
      {activeTab !== 'onboarding' && activeTab !== 'interaction' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-lg bg-white/95 backdrop-blur-md rounded-[3rem] border-[6px] border-[#FFFDF5] shadow-[0_15px_30px_rgba(0,0,0,0.15),0_10px_0_rgba(0,0,0,0.08)] p-3 z-50 flex justify-around">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={cn(
                  "flex flex-col items-center justify-center w-24 sm:w-28 h-20 sm:h-24 rounded-[2rem] transition-all relative overflow-hidden",
                  isActive ? `${item.color} border-[4px] border-white ${item.shadow}` : "hover:bg-slate-50"
                )}
              >
                {isActive && <div className="absolute top-1 left-4 right-4 h-2 bg-white/30 rounded-full blur-[1px]" />}
                <motion.div animate={isActive ? { y: -2, scale: 1.1 } : { y: 0, scale: 1 }}>
                  <Icon size={isActive ? 32 : 28} strokeWidth={isActive ? 3 : 2.5} className={cn("mb-1", isActive ? "text-white drop-shadow-sm" : "text-navy/40")} />
                </motion.div>
                <span className={cn("text-xs sm:text-sm uppercase tracking-widest font-extrabold", isActive ? "text-white" : "text-navy/40")}>
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  );
}
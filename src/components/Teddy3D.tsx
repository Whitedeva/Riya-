import React, { useEffect, useRef, useState } from "react";

interface TeddyProps {
  waving?: boolean;
}

export default function Teddy3D({ waving = true }: TeddyProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [blushing, setBlushing] = useState(false);
  const [isWaving, setIsWaving] = useState(waving);
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const teddyCenterX = rect.left + rect.width / 2;
      const teddyCenterY = rect.top + rect.height / 2;

      // Calculate angle and distance
      const dx = e.clientX - teddyCenterX;
      const dy = e.clientY - teddyCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxMove = 3; // Max pixels for the eye pupil to offset

      if (distance > 0) {
        const moveX = (dx / distance) * Math.min(distance * 0.05, maxMove);
        const moveY = (dy / distance) * Math.min(distance * 0.05, maxMove);
        setEyeOffset({ x: moveX, y: moveY });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleTeddyClick = (e: React.MouseEvent) => {
    setBlushing(true);
    setIsWaving(true);
    
    // Add a heart pop effect at the click position
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      
      const newHeart = {
        id: Date.now(),
        x: clickX,
        y: clickY - 20
      };
      
      setHearts(prev => [...prev, newHeart]);
      setTimeout(() => {
        setHearts(prev => prev.filter(h => h.id !== newHeart.id));
      }, 1500);
    }

    setTimeout(() => {
      setBlushing(false);
    }, 1500);
  };

  return (
    <div
      ref={containerRef}
      onClick={handleTeddyClick}
      className="relative w-44 h-48 mx-auto cursor-pointer select-none group transition-all duration-300 transform hover:scale-105"
      id="teddy-3d-root"
    >
      {/* Floating click hearts */}
      {hearts.map(heart => (
        <span
          key={heart.id}
          className="absolute text-xl animate-bounce pointer-events-none text-rose-400 z-50 transition-all duration-1000 select-none"
          style={{
            left: `${heart.x}px`,
            top: `${heart.y}px`,
            animation: "teddy-heart-float 1.2s forwards ease-out"
          }}
        >
          ❤️
        </span>
      ))}

      <svg
        viewBox="0 0 100 110"
        className="w-full h-full drop-shadow-[0_10px_20px_rgba(255,182,193,0.3)] filter md:drop-shadow-[0_15px_30px_rgba(255,192,203,0.4)]"
      >
        <defs>
          {/* Fur Gradient */}
          <linearGradient id="furGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F5C3C2" />
            <stop offset="50%" stopColor="#ECAAA9" />
            <stop offset="100%" stopColor="#D98A89" />
          </linearGradient>

          {/* Golden Ears Gradient */}
          <linearGradient id="innerEarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFF0F5" />
            <stop offset="100%" stopColor="#FFC0CB" />
          </linearGradient>

          {/* Snout Gradient */}
          <radialGradient id="snoutGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF" />
            <stop offset="100%" stopColor="#FFE4E1" />
          </radialGradient>
        </defs>

        {/* Shadow */}
        <ellipse cx="50" cy="100" rx="28" ry="6" fill="#FFAEC9" opacity="0.4" className="animate-pulse" />

        {/* Ears */}
        {/* Left Ear */}
        <circle cx="28" cy="28" r="11" fill="url(#furGradient)" />
        <circle cx="28" cy="28" r="7" fill="url(#innerEarGradient)" />

        {/* Right Ear */}
        <circle cx="72" cy="28" r="11" fill="url(#furGradient)" />
        <circle cx="72" cy="28" r="7" fill="url(#innerEarGradient)" />

        {/* Body */}
        <circle cx="50" cy="78" r="22" fill="url(#furGradient)" />
        {/* Tummy patch */}
        <circle cx="50" cy="80" r="14" fill="#FFF5F5" opacity="0.8" />

        {/* Head */}
        <circle cx="50" cy="45" r="21" fill="url(#furGradient)" />

        {/* Eyes */}
        <g id="teddy-eyes">
          {/* Left Eye */}
          <circle cx="41" cy="40" r="3.5" fill="#4B2321" />
          <circle cx={41 + eyeOffset.x} cy={40 + eyeOffset.y} r="1.5" fill="#FFF" />

          {/* Right Eye */}
          <circle cx="59" cy="40" r="3.5" fill="#4B2321" />
          <circle cx={59 + eyeOffset.x} cy={40 + eyeOffset.y} r="1.5" fill="#FFF" />
        </g>

        {/* Blush Cheeks */}
        <g id="teddy-blush" className="transition-all duration-300">
          <circle cx="35" cy="47" r="4" fill="#FF839B" opacity={blushing ? "0.7" : "0.3"} className="animate-pulse" />
          <circle cx="65" cy="47" r="4" fill="#FF839B" opacity={blushing ? "0.7" : "0.3"} className="animate-pulse" />
        </g>

        {/* Snout and Nose */}
        <ellipse cx="50" cy="48" rx="7.5" ry="5.5" fill="url(#snoutGradient)" />
        {/* Nose */}
        <path d="M 46.5,46 C 46.5,46 50,49 53.5,46 C 53.5,46 50,44 46.5,46 Z" fill="#4B2321" />
        {/* Smiling Mouth */}
        <path d="M 47,51 Q 50,54 53,51" stroke="#4B2321" strokeWidth="1" fill="none" strokeLinecap="round" />

        {/* Left Arm (Waving) */}
        <g
          className="origin-[32px_65px] transition-transform duration-300"
          style={{
            animation: isWaving
              ? "teddy-arm-wave 1.8s infinite ease-in-out"
              : "none",
          }}
        >
          {/* Paw */}
          <ellipse cx="28" cy="62" rx="7" ry="9" fill="url(#furGradient)" transform="rotate(-30 28 62)" />
          {/* Paw patch */}
          <ellipse cx="28" cy="62" rx="4" ry="5" fill="#FFF0F5" opacity="0.6" transform="rotate(-30 28 62)" />
        </g>

        {/* Right Arm (Resting on lap/sides) */}
        <g className="origin-[68px_65px] hover:rotate-12 transition-transform duration-300">
          <ellipse cx="72" cy="62" rx="7" ry="9" fill="url(#furGradient)" transform="rotate(30 72 62)" />
          <ellipse cx="72" cy="62" rx="4" ry="5" fill="#FFF0F5" opacity="0.6" transform="rotate(30 72 62)" />
        </g>

        {/* Legs */}
        {/* Left Foot */}
        <circle cx="34" cy="94" r="8.5" fill="url(#furGradient)" />
        <circle cx="34" cy="94" r="5.5" fill="#FFF0F5" opacity="0.7" />
        {/* Foot pads */}
        <circle cx="31" cy="89" r="1.5" fill="#FFC0CB" />
        <circle cx="34" cy="88" r="1.5" fill="#FFC0CB" />
        <circle cx="37" cy="89" r="1.5" fill="#FFC0CB" />

        {/* Right Foot */}
        <circle cx="66" cy="94" r="8.5" fill="url(#furGradient)" />
        <circle cx="66" cy="94" r="5.5" fill="#FFF0F5" opacity="0.7" />
        {/* Foot pads */}
        <circle cx="63" cy="89" r="1.5" fill="#FFC0CB" />
        <circle cx="66" cy="88" r="1.5" fill="#FFC0CB" />
        <circle cx="69" cy="89" r="1.5" fill="#FFC0CB" />
      </svg>

      {/* Styled inline animation */}
      <style>{`
        @keyframes teddy-arm-wave {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-50deg) translateY(-5px); }
          50% { transform: rotate(-35deg) translateY(-2px); }
          75% { transform: rotate(-50deg) translateY(-5px); }
        }
        @keyframes teddy-heart-float {
          0% {
            transform: scale(0.5) translateY(0);
            opacity: 1;
          }
          100% {
            transform: scale(1.2) translateY(-80px) translateX(${Math.random() * 40 - 20}px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

import React, { useEffect, useState, useRef } from "react";
import { Heart, Music, Music2, Sparkles, Volume2, VolumeX, Key, MessageCircle, Star, ArrowRight, CornerDownRight, Check, RefreshCw } from "lucide-react";
import FloatingBackground from "./components/FloatingBackground";
import Teddy3D from "./components/Teddy3D";
import HobbiesSelector from "./components/HobbiesSelector";
import Timeline from "./components/Timeline";
import AdminPanel from "./components/AdminPanel";
import { AppConfig, PhotoAsset } from "./types";

export default function App() {
  const [sessionId, setSessionId] = useState("");
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [photos, setPhotos] = useState<PhotoAsset[]>([]);
  const [currentStep, setCurrentStep] = useState(0); // 0: Landing, 1: Hobbies, 2: Timeline, 3: Why Special, 4: Proposal, 5: Success
  const [loading, setLoading] = useState(true);

  // Background Music controls
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Proposal Section States
  const [thinkAgainPos, setThinkAgainPos] = useState({ x: 0, y: 0 });
  const [thinkAgainClickCount, setThinkAgainClickCount] = useState(0);
  const [funnyMsg, setFunnyMsg] = useState("");
  const [successNote, setSuccessNote] = useState("");
  const [noteSubmitted, setNoteSubmitted] = useState(false);
  const [isCelebrationActive, setIsCelebrationActive] = useState(false);

  // Admin section toggling
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Generate or load sessionId
  useEffect(() => {
    let sid = localStorage.getItem("riyaaa_special_session");
    if (!sid) {
      sid = "session_" + Math.random().toString(36).substr(2, 9);
      localStorage.setItem("riyaaa_special_session", sid);
    }
    setSessionId(sid);

    // Initial page track load
    fetchConfig(sid);
  }, []);

  const fetchConfig = async (sid = sessionId) => {
    try {
      const res = await fetch("/api/config");
      const data = await res.json();
      setConfig(data.config);
      setPhotos(data.photos);

      // Track active visit event at the landing point
      if (sid) {
        fetch("/api/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: sid,
            type: "page_view"
          })
        }).catch(err => console.error(err));
      }
    } catch (e) {
      console.error("Failed to load application config:", e);
    } finally {
      setLoading(false);
    }
  };

  // Setup background music stream
  useEffect(() => {
    if (config?.backgroundMusicUrl) {
      if (audioRef.current) {
        audioRef.current.src = config.backgroundMusicUrl;
      } else {
        const audio = new Audio(config.backgroundMusicUrl);
        audio.loop = true;
        audioRef.current = audio;
      }
    }
  }, [config?.backgroundMusicUrl]);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.warn("Autoplay blocked, click play button again");
      });
    }
  };

  // Log milestone visits on the server
  const advanceStep = (stepNumber: number, stageName: string) => {
    setCurrentStep(stepNumber);
    
    fetch("/api/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        type: "visit_stage",
        payload: stageName
      })
    }).catch(err => console.error("Action track error:", err));
    
    // Auto-unmute when starting journey
    if (stepNumber === 1 && !isPlaying && audioRef.current) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  // Playful dodge effect for the No / Think Again button in proposal page
  const handleThinkAgainDodge = () => {
    const randomX = Math.floor(Math.random() * 240) - 120; // coordinate displacement bounds
    const randomY = Math.floor(Math.random() * 160) - 80;
    setThinkAgainPos({ x: randomX, y: randomY });

    const hints = [
      "No way! Try again 😝",
      "Cursor is too slow! Try the other button 💕",
      "My hearts are locked on Yes! 🥰",
      "Access Denied! 🌸",
      "Think Again button is currently taking a nap! 😴",
      "Wanna try again? 😝"
    ];
    setFunnyMsg(hints[Math.floor(Math.random() * hints.length)]);
    setThinkAgainClickCount(prev => prev + 1);

    // Track "Think again" selection frequency
    fetch("/api/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        type: "proposal_answer",
        payload: "think_again"
      })
    }).catch(err => console.error(err));
  };

  // Yes / Happy Proposal action
  const handleYesProposal = () => {
    setCurrentStep(5);
    setIsCelebrationActive(true);

    fetch("/api/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        type: "proposal_answer",
        payload: "yes"
      })
    }).catch(err => console.error(err));
  };

  // Submit personal letter note back
  const handleLetterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!successNote.trim()) return;

    fetch("/api/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        type: "submit_note",
        payload: successNote
      })
    }).then(res => res.json()).then(data => {
      if (data.success) {
        setNoteSubmitted(true);
      }
    }).catch(err => console.error(err));
  };

  if (loading || !config) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FFF0F5] text-pink-500 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <span className="font-semibold text-sm tracking-wider font-mono">Unfolding Something Magical...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF0F5] relative overflow-x-hidden flex flex-col justify-between py-6 px-4 md:px-8 font-sans antialiased text-gray-800">
      
      {/* Absolute Beautiful Canvas particle backdrop */}
      <FloatingBackground />

      {/* Floating Sparkly Hearts Backdrop SVG elements per design theme instructions */}
      <svg className="absolute opacity-40 pointer-events-none text-rose-300 fill-current animate-pulse hidden md:block" style={{ top: '80px', left: '10%' }} width="40" height="40" viewBox="0 0 24 24">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
      <svg className="absolute opacity-30 pointer-events-none text-pink-300 fill-current animate-pulse hidden md:block" style={{ bottom: '120px', right: '12%' }} width="60" height="60" viewBox="0 0 24 24">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>

      {/* Background Sound controls UI */}
      <div className="fixed top-5 right-5 z-50 flex items-center gap-2">
        {isPlaying && (
          <div className="flex gap-0.5 items-end h-3 px-1">
            <span className="w-0.5 bg-rose-400 rounded-xs animate-[music-wave_1s_infinite_0.1s] h-3" />
            <span className="w-0.5 bg-rose-400 rounded-xs animate-[music-wave_1s_infinite_0.3s] h-2" />
            <span className="w-0.5 bg-rose-400 rounded-xs animate-[music-wave_1s_infinite_0.5s] h-3.5" />
            <span className="w-0.5 bg-rose-400 rounded-xs animate-[music-wave_1s_infinite_0.2s] h-1.5" />
          </div>
        )}
        <button
          onClick={toggleMusic}
          className="w-10 h-10 bg-white/70 hover:bg-white/90 border border-pink-200 text-pink-600 rounded-full flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="Background Music"
          id="music-toggle-btn"
        >
          {isPlaying ? <Volume2 className="w-5 h-5 animate-pulse" /> : <VolumeX className="w-5 h-5 opacity-70" />}
        </button>
      </div>

      {/* Dynamic Header Block from the Design HTML (Active during step 1-5 transitions) */}
      {currentStep > 0 && (
        <div className="w-full max-w-4xl mx-auto mb-2 flex justify-between items-center gap-4 relative z-20 animate-fade-in">
          <div className="glass-card px-6 py-3.5 flex flex-col shadow-pink-100 shadow-sm">
            <h1 className="romantic-title text-3xl text-pink-600 leading-none">Hii Riyaaa 🌸</h1>
            <p className="text-pink-400 font-semibold text-xs mt-1">I made something special just for you ❤️</p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="text-right hidden sm:block">
              <span className="block text-[9px] uppercase tracking-widest text-pink-400 font-bold font-mono">Session Timer</span>
              <span className="text-pink-600 font-semibold text-xs font-mono">Forever & Always</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-pink-200 flex items-center justify-center border-2 border-pink-300">
              <span className="text-lg">🧸</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Core Container Stage Router */}
      <main className="flex-1 w-full max-w-4xl mx-auto flex items-center justify-center relative z-20 pt-4 pb-12">
        
        {/* STEP 0: LANDING PAGE HERO */}
        {currentStep === 0 && (
          <div className="text-center space-y-6 max-w-xl mx-auto animate-fade-in" id="step-landing">
            <div className="glass-card p-6 md:p-10 space-y-6 shadow-pink-100 shadow-md">
              {/* 3D Teddy Bear SVG element */}
              <Teddy3D waving={true} />

              <div className="space-y-3">
                <h1 className="romantic-title text-4xl md:text-5xl font-bold text-pink-600 leading-tight">
                  {config.landingPage.heading}
                </h1>
                <p className="text-pink-400 font-semibold text-sm md:text-base tracking-wide max-w-sm mx-auto">
                  {config.landingPage.subHeading}
                </p>
              </div>

              <button
                id="journey-start-btn"
                onClick={() => advanceStep(1, "Hobbies Screen")}
                className="bg-linear-to-r from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600 text-white font-bold py-3.5 px-8 rounded-full shadow-[0_10px_30px_rgba(244,63,94,0.4)] hover:shadow-[0_15px_35px_rgba(244,63,94,0.5)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2 mx-auto uppercase tracking-wider text-xs"
              >
                <span>{config.landingPage.button}</span>
                <Heart className="w-4 h-4 fill-white stroke-none" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 1: HOBBIES SECTION */}
        {currentStep === 1 && (
          <div className="w-full animate-fade-in" id="step-hobbies">
            <HobbiesSelector
              question={config.hobbiesSection}
              sessionId={sessionId}
              onNext={() => advanceStep(2, "Timeline Screen")}
            />
          </div>
        )}

        {/* STEP 2: RELATIONSHIP TIMELINE */}
        {currentStep === 2 && (
          <div className="w-full animate-fade-in" id="step-timeline">
            <Timeline
              timeline={config.journeyTimeline}
              sessionId={sessionId}
              onNext={() => advanceStep(3, "Special Box")}
            />
          </div>
        )}

        {/* STEP 3: WHY RIYAAA IS SPECIAL (BENTO CARD GRID & PHOTOS) */}
        {currentStep === 3 && (
          <div className="w-full space-y-10 animate-fade-in" id="step-special">
            <div className="glass-card p-6 md:p-10 space-y-8 shadow-pink-100 shadow-md">
              <div className="text-center space-y-1">
                <h2 className="romantic-title text-3xl md:text-4xl text-pink-600 font-bold">
                  {config.specialSection.title}
                </h2>
                <p className="text-pink-400 font-bold text-xs uppercase tracking-wider">Hover on each polaroid card to look deeper</p>
              </div>

              {/* Polaroid bento cards with special-card backgrounds */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                {config.specialSection.cards.map((card, i) => {
                  const rotations = ["-rotate-3", "rotate-3", "-rotate-2", "rotate-2", "-rotate-4", "rotate-3"];
                  const rot = rotations[i % rotations.length];
                  return (
                    <div
                      key={card}
                      className={`special-card p-3 shadow-xs text-center transform ${rot} hover:rotate-0 hover:scale-[1.06] transition-all duration-300 group cursor-default`}
                    >
                      <div className="w-full h-20 bg-white/65 rounded-xl mb-2 flex items-center justify-center text-2xl select-none group-hover:scale-110 transition-transform">
                        {card.substring(card.length - 2)}
                      </div>
                      <p className="text-xs font-semibold text-pink-700 leading-none tracking-tight">
                        {card.substring(0, card.length - 2).trim()}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Uploaded Memory Cards Slider */}
              {photos.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-pink-100/50">
                  <h3 className="text-center font-sans font-bold text-pink-500 text-xs uppercase tracking-widest">
                    ★ Our Cozy Captured Memory Cards ✨
                  </h3>
                  
                  <div className="flex gap-4 overflow-x-auto py-2 px-2 max-w-xl mx-auto items-center justify-center md:flex-wrap">
                    {photos.map((ph, idx) => (
                      <div
                        key={ph.id || idx}
                        className="bg-white p-2.5 rounded-2xl shadow-xs border border-pink-150 w-36 transform hover:rotate-0 hover:scale-105 transition-all duration-300 shrink-0 text-center relative rotate-2"
                      >
                        <img
                          src={ph.url}
                          alt={ph.caption}
                          className="w-full h-24 object-cover rounded-xl"
                          referrerPolicy="no-referrer"
                        />
                        <p className="text-[10px] font-bold text-pink-600 mt-1.5 truncate">
                          {ph.caption}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Next section trigger button */}
              <div className="text-center pt-2">
                <button
                  id="special-advance-btn"
                  onClick={() => advanceStep(4, "Proposal Modal")}
                  className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-8 rounded-full shadow-[0_4px_15px_rgba(239,68,68,0.2)] cursor-pointer hover:shadow-md transition-all flex items-center gap-2 mx-auto hover:translate-x-1 uppercase text-xs tracking-wider"
                >
                  <span>Continue Journey</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: PROPOSAL INVITATION SCREEN */}
        {currentStep === 4 && (
          <div className="w-full max-w-lg mx-auto glass-card p-6 md:p-8 space-y-6 text-center animate-fade-in relative overflow-hidden shadow-pink-100 shadow-md" id="step-proposal">
            
            {/* Glowing heart visuals */}
            <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto shadow-inner text-rose-500 animate-pulse">
              <Heart className="w-8 h-8 fill-pink-400 stroke-none animate-ping" />
            </div>

            {/* Custom formatted message */}
            <div className="space-y-3">
              <h2 className="romantic-title text-3xl font-bold text-pink-600">
                Will you be my girlfriend? 💖
              </h2>
              <div className="text-gray-700 text-sm md:text-base leading-relaxed font-semibold whitespace-pre-line bg-white/50 p-4 rounded-2xl border border-pink-150 text-center max-h-[220px] overflow-y-auto font-medium">
                {config.proposalSection.message}
              </div>
            </div>

            {/* Interactive dodge button container */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative py-2 select-none">
              
              <button
                id="proposal-yes-btn"
                onClick={handleYesProposal}
                className="px-8 py-3.5 bg-pink-500 hover:bg-pink-600 text-white font-bold text-base rounded-2xl shadow-lg shadow-pink-100 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 z-30 cursor-pointer min-w-[130px] justify-center"
              >
                <Heart className="w-4 h-4 fill-white stroke-none" />
                {config.proposalSection.buttons.yes}
              </button>

              <button
                id="proposal-no-btn"
                onMouseEnter={handleThinkAgainDodge}
                onClick={handleThinkAgainDodge}
                style={{
                  transform: `translate(${thinkAgainPos.x}px, ${thinkAgainPos.y}px)`,
                  transition: "all 0.15s ease-out"
                }}
                className="px-6 py-3.5 bg-white border border-pink-200 text-pink-400 font-bold text-sm rounded-2xl z-30 cursor-pointer transition-transform duration-100 min-w-[130px]"
              >
                {config.proposalSection.buttons.thinkAgain}
              </button>
            </div>

            {funnyMsg && (
              <p className="text-xs text-rose-500 font-bold font-mono animate-bounce">{funnyMsg}</p>
            )}

            <p className="text-[10px] text-pink-400 font-semibold tracking-wider uppercase font-mono">
              ★ RIYAAA SPECIAL COLLECTION ★
            </p>
          </div>
        )}

        {/* STEP 5: PROPOSAL SUCCESS CELEBRATION */}
        {currentStep === 5 && (
          <div className="w-full max-w-md mx-auto glass-card p-6 md:p-8 space-y-6 text-center animate-scale-up relative overflow-hidden shadow-pink-100 shadow-md" id="step-success">
            {/* Heart blast effects details */}
            <div className="w-20 h-20 bg-pink-100/80 rounded-full flex items-center justify-center mx-auto shadow-inner text-rose-500">
              <Heart className="w-10 h-10 fill-rose-500 stroke-none animate-bounce" />
            </div>

            <div className="space-y-2">
              <h2 className="romantic-title text-4xl font-bold text-pink-600">
                Yayyyy! 🎉❤️🌸
              </h2>
              <p className="text-slate-700 font-semibold text-base max-w-xs mx-auto leading-relaxed">
                {config.proposalSection.successMessage}
              </p>
              <p className="text-[10px] text-emerald-600 font-bold tracking-widest font-mono uppercase">
                ★ RELATIONSHIP UNLOCKED SUCCESSFULLY ★
              </p>
            </div>

            {/* Custom note form back to him */}
            {!noteSubmitted ? (
              <form onSubmit={handleLetterSubmit} className="space-y-4 border-t border-pink-100/50 pt-5 text-left">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-pink-500 flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5 text-pink-500" />
                    Write a sweet message back to him 💌
                  </label>
                  <textarea
                    rows={3}
                    value={successNote}
                    onChange={(e) => setSuccessNote(e.target.value)}
                    placeholder="Tell him what you are thinking, how you fell... 💕"
                    className="w-full text-xs font-semibold border border-pink-150 rounded-2xl p-3 focus:outline-hidden focus:ring-2 focus:ring-pink-300 text-slate-700 bg-white/60 shadow-xs"
                  />
                </div>
                <button
                  id="submit-success-note-btn"
                  type="submit"
                  className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-5 rounded-2xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider"
                >
                  Send Reply Card
                </button>
              </form>
            ) : (
              <div className="special-card p-4 text-center animate-pulse">
                <p className="text-pink-700 text-xs font-bold flex items-center justify-center gap-1 select-none">
                  <Check className="w-4 h-4 stroke-[3]" /> Reply delivered safely to his dashboard! ❤️
                </p>
              </div>
            )}
          </div>
        )}

      </main>

      {/* FOOTER & ADMIN DRAWER ACCESS OVERLAY */}
      <footer className="relative z-30 pt-6 border-t border-pink-100 flex flex-col sm:flex-row items-center justify-between text-xs text-pink-400 font-medium select-none text-center gap-4">
        <div>
          <span>Made with ❤️ for Riyaaa</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAdminOpen(!isAdminOpen)}
            className="flex items-center gap-1 bg-white/60 hover:bg-white text-pink-500 hover:text-pink-600 border border-pink-200 py-1.5 px-3 rounded-full shadow-xs cursor-pointer transition-all"
            id="admin-panel-toggle"
          >
            <Key className="w-3.5 h-3.5" />
            <span>{isAdminOpen ? "Close Admin Panel" : "Admin Panel"}</span>
          </button>
        </div>
      </footer>

      {/* RENDER ADMIN DRAWER MODAL OVERLAY */}
      {isAdminOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-4xl bg-white shadow-2xl rounded-3xl p-4 md:p-6 my-8">
            <button
              onClick={() => setIsAdminOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold border border-slate-200 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer transition-all bg-white z-50 text-sm"
              title="Close Settings"
            >
              ✕
            </button>
            <div className="max-h-[85vh] overflow-y-auto pt-4 pr-1">
              <AdminPanel />
            </div>
          </div>
        </div>
      )}

      {/* Styled inline helper animations */}
      <style>{`
        @keyframes music-wave {
          0%, 100% { height: 4px; }
          50% { height: 16px; }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scale-up {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-scale-up {
          animation: scale-up 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </div>
  );
}

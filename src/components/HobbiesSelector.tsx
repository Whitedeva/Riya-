import { useState } from "react";
import { Sparkles, Heart, Check, Loader2 } from "lucide-react";
import { HobbyQuestion } from "../types";

interface HobbiesSelectorProps {
  question: HobbyQuestion;
  sessionId: string;
  onNext: (selected: string[]) => void;
}

export default function HobbiesSelector({ question, sessionId, onNext }: HobbiesSelectorProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [customResponse, setCustomResponse] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiCompliment, setAiCompliment] = useState<string | null>(null);

  const handleOptionToggle = (option: string) => {
    let updated: string[];
    if (option.includes("All Of The Above")) {
      // If "All of the Above" is chosen, select everything
      if (selected.includes(option)) {
        updated = [];
      } else {
        updated = [...question.options];
      }
    } else {
      if (selected.includes(option)) {
        updated = selected.filter(o => o !== option);
      } else {
        // Remove "All of the Above" if we are toggling single options
        const filtered = selected.filter(o => !o.includes("All Of The Above"));
        updated = [...filtered, option];
      }
    }
    
    setSelected(updated);

    // Track selection on the server
    fetch("/api/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        type: "select_hobbies",
        payload: updated
      })
    }).catch(err => console.error("Action error:", err));

    // Show appropriate sweet responses
    if (option.includes("All Of The Above")) {
      setCustomResponse(question.responses[option] || question.responses["all"] || null);
    } else {
      setCustomResponse(question.responses[option] || null);
    }
    
    // Clear old AI compliments on selection change
    setAiCompliment(null);
  };

  const fetchAiCompliment = async () => {
    if (selected.length === 0) return;
    setAiLoading(true);
    setAiCompliment(null);

    try {
      const response = await fetch("/api/gemini/generate-compliment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hobbies: selected })
      });
      const data = await response.json();
      setAiCompliment(data.compliment);
    } catch (err) {
      console.error("Failed to generate AI compliment:", err);
      setAiCompliment("Riyaaa, you are simply the most beautiful, fun-loving, and soothing soul in my universe. 💕");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = () => {
    onNext(selected);
  };

  return (
    <div className="w-full max-w-lg mx-auto glass-card p-6 md:p-8 space-y-6 transition-all duration-300">
      
      {/* Title & Question */}
      <div className="space-y-2 text-center">
        <h2 className="text-xl font-sans font-bold text-rose-500 tracking-tight flex items-center justify-center gap-1 uppercase tracking-wider text-xs">
          <Heart className="w-4 h-4 fill-rose-400 text-rose-400 animate-pulse" />
          {question.title}
        </h2>
        <p className="text-gray-700 text-sm md:text-base font-semibold">{question.question}</p>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 gap-3">
        {question.options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <button
              key={option}
              id={`hobby-opt-${option.replace(/\s+/g, '-').toLowerCase()}`}
              onClick={() => handleOptionToggle(option)}
              className={`w-full py-3 px-5 rounded-full text-left text-sm md:text-base transition-all duration-300 flex items-center justify-between font-semibold group cursor-pointer ${
                isSelected
                  ? "bg-pink-200 border border-pink-400 text-pink-700 shadow-sm"
                  : "hobby-pill text-pink-600 hover:bg-pink-50/50 hover:border-pink-300"
              }`}
            >
              <span className="flex items-center gap-2 group-hover:scale-102 transition-transform duration-300">
                {option}
              </span>
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                isSelected ? "bg-rose-400 border-rose-400" : "border-pink-200 bg-white"
              }`}>
                {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Cute Specific Response balloon */}
      {customResponse && !aiCompliment && (
        <div className="special-card p-4 text-center animate-fade-in relative overflow-hidden shadow-xs">
          <span className="absolute -top-1 -right-1 text-2xl rotate-12 opacity-30">🌸</span>
          <p className="text-pink-700 text-xs italic font-semibold leading-relaxed">
            "{customResponse}"
          </p>
        </div>
      )}

      {/* Magical AI Compliment Area */}
      <div className="pt-2 border-t border-pink-100 space-y-4">
        {selected.length > 0 ? (
          <button
            id="spark-compliment-btn"
            onClick={fetchAiCompliment}
            disabled={aiLoading}
            className="w-full bg-linear-to-r from-amber-400 to-rose-400 hover:from-amber-500 hover:to-rose-500 text-white py-3 px-5 rounded-2xl font-sans font-semibold text-sm shadow-[0_4px_15px_rgba(251,191,36,0.3)] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer outline-hidden hover:scale-[1.02] active:scale-[0.98]"
          >
            {aiLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Sparkles className="w-4 h-4 fill-white stroke-none animate-pulse" />
            )}
            {aiLoading ? "Generating sweet magic..." : "Ask AI what makes you special ✨"}
          </button>
        ) : (
          <p className="text-xs text-slate-400 text-center italic">
            Select one or more hobbies to unlock sweet AI compliments! 🌸
          </p>
        )}

        {/* AI Compliment Output Panel */}
        {aiCompliment && (
          <div className="special-card p-4 shadow-xs animate-fade-in relative">
            <span className="absolute -top-1.5 -left-1 text-lg">✨</span>
            <p className="text-pink-800 text-xs italic font-semibold leading-relaxed">
              "{aiCompliment}"
            </p>
            <div className="text-right text-[9px] text-pink-500 font-bold mt-2 uppercase tracking-widest font-mono">
              ★ personalized highlight for riyaaa ★
            </div>
          </div>
        )}
      </div>

      {/* Button to Next Section */}
      <button
        id="hobbies-advance-btn"
        onClick={handleSubmit}
        className="w-full bg-linear-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 text-white font-semibold py-3.5 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-lg hover:scale-102 active:scale-98 cursor-pointer mt-4"
      >
        <span>Continue Journey</span>
        <Heart className="w-4 h-4 fill-white" />
      </button>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

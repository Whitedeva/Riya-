import { useState } from "react";
import { Sparkles, ArrowRight, Star, Heart } from "lucide-react";
import { TimelineStage } from "../types";

interface TimelineProps {
  timeline: TimelineStage[];
  sessionId: string;
  onNext: () => void;
}

export default function Timeline({ timeline, sessionId, onNext }: TimelineProps) {
  const [activeStage, setActiveStage] = useState<number>(0);

  const handleStageSelect = (index: number) => {
    setActiveStage(index);

    // Track stage visit on server
    fetch("/api/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        type: "visit_stage",
        payload: timeline[index].stage
      })
    }).catch(err => console.error("Action error:", err));
  };

  const incrementStage = () => {
    if (activeStage < timeline.length - 1) {
      handleStageSelect(activeStage + 1);
    } else {
      onNext();
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      
      {/* Intro header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-pink-600 romantic-title">
          Our Journey Together 🌸
        </h2>
        <p className="text-gray-500 text-xs md:text-sm font-semibold">
          Click on each milestone to look back at our beautiful story
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 glass-card p-6 md:p-8 relative overflow-hidden">
        
        {/* Sidebar Steps (Col 1-5) */}
        <div className="md:col-span-5 flex md:flex-col justify-between md:justify-start gap-2 relative md:border-r border-pink-100 overflow-x-auto pb-4 md:pb-0 md:pr-4">
          {timeline.map((item, index) => {
            const isCompleted = index <= activeStage;
            const isSelected = index === activeStage;

            return (
              <button
                key={item.stage}
                id={`timeline-node-${index}`}
                onClick={() => handleStageSelect(index)}
                className={`flex items-center gap-3 py-2 px-3 md:py-3.5 md:px-4 rounded-xl text-left text-xs md:text-sm font-semibold transition-all duration-300 min-w-[120px] md:min-w-0 cursor-pointer ${
                  isSelected
                    ? "bg-pink-100 text-pink-700 shadow-sm border-l-4 border-rose-500"
                    : isCompleted
                    ? "text-pink-500 hover:bg-pink-50"
                    : "text-slate-400 hover:bg-pink-50/30"
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  isCompleted ? "bg-rose-400 text-white" : "bg-slate-100 text-slate-400"
                }`}>
                  {index + 1}
                </div>
                <span className="truncate">{item.stage}</span>
              </button>
            );
          })}
        </div>

        {/* Stage Content Card (Col 6-12) */}
        <div className="md:col-span-7 flex flex-col justify-between space-y-6 min-h-[180px] pt-2 md:pt-0">
          <div className="space-y-4 text-center md:text-left transition-all duration-500 transform translate-y-0">
            
            {/* Phase Tag */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-pink-50 text-pink-600 border border-pink-200 shadow-xs">
              <Star className="w-3 h-3 fill-pink-500 text-pink-500 animate-pulse" />
              Stage {activeStage + 1} of {timeline.length}
            </div>

            {/* Stage Title */}
            <h3 className="text-2xl font-bold text-gray-800 font-sans tracking-tight">
              {timeline[activeStage].stage}
            </h3>

            {/* Stage Description */}
            <p className="text-gray-600 text-sm md:text-base leading-relaxed font-medium">
              {timeline[activeStage].description}
            </p>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-4 border-t border-pink-50">
            <span className="text-[11px] text-pink-400 italic flex items-center gap-1 font-semibold">
              <Heart className="w-3.5 h-3.5 fill-pink-300 stroke-none animate-ping" />
              Every step with you matters
            </span>

            <button
              id="timeline-next-btn"
              onClick={incrementStage}
              className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-4 rounded-xl text-xs md:text-sm flex items-center gap-1.5 shadow-sm transition-all hover:translate-x-1 outline-hidden cursor-pointer"
            >
              <span>{activeStage === timeline.length - 1 ? "Start Proposal" : "Next Milestone"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
    </div>
  );
}

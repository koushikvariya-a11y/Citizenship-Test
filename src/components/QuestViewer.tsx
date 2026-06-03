import { useState, useEffect } from 'react';
import { Question } from '../types';
import { CheckCircle, AlertCircle, ArrowLeft, ArrowRight, GraduationCap } from 'lucide-react';

interface QuestViewerProps {
  key?: any;
  question: Question;
  index: number;
  total: number;
  onNext: () => void;
  onPrev: () => void;
  onSelectAnswer: (isCorrect: boolean, selectedIdx: number) => void;
  savedAnswer?: { selectedIdx: number; isCorrect: boolean };
  isMockMode?: boolean;
}

export default function QuestViewer({
  question,
  index,
  total,
  onNext,
  onPrev,
  onSelectAnswer,
  savedAnswer,
  isMockMode = false
}: QuestViewerProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Synchronize state when question changes or if there is already a saved answer for this session
  useEffect(() => {
    if (savedAnswer) {
      setSelectedIdx(savedAnswer.selectedIdx);
      setHasSubmitted(true);
    } else {
      setSelectedIdx(null);
      setHasSubmitted(false);
    }
  }, [question, savedAnswer]);

  const handleOptionClick = (idx: number) => {
    if (hasSubmitted) return; // Prevent multiple submissions
    setSelectedIdx(idx);
    setHasSubmitted(true);
    const isCorrect = idx === question.correctIndex;
    onSelectAnswer(isCorrect, idx);
  };

  return (
    <div id="practice-card" className="bg-white rounded-xl border-3 border-black bauhaus-shadow flex flex-col overflow-hidden h-full">
      
      {/* Question Header & Category Badge */}
      <div className="bg-[#fbbf24] px-3.5 py-2 sm:px-5 sm:py-3 border-b-3 border-black flex flex-wrap items-center justify-between gap-1.5 shrink-0">
        <div className="flex items-center space-x-2">
          <span className="text-[9px] sm:text-[10px] bg-black text-white font-extrabold px-2 py-0.5 rounded-none border border-black uppercase tracking-wider">
            FRAGEBOGEN
          </span>
          <span className="text-[11px] sm:text-xs text-black font-extrabold uppercase tracking-wide">{question.category}</span>
        </div>
        <div className="text-[9px] sm:text-[10px] text-black font-mono bg-white border-2 border-black px-2 py-0.5 font-bold">
          Aufgabe {question.taskNumber} • {index + 1} / {total}
        </div>
      </div>

      {/* Core Split-Screen Bilingual Card */}
      <div className="p-2 sm:p-4.5 flex-1 flex flex-col justify-between space-y-3">
        
        {/* Dynamic Responsive Grid: stacked on mobile, side-by-side on desktop */}
        <div className={`grid grid-cols-1 ${!isMockMode ? 'md:grid-cols-2' : ''} gap-3 sm:gap-4`}>
          
          {/* Column 1: DEUTSCH ORIGINAL */}
          <div className="flex flex-col space-y-2">
            
            {/* Sibling 1: German Question Section wrapper */}
            <div className="space-y-2">
              {/* Column Header */}
              <div className="flex items-center justify-between pb-1 border-b-2 border-black">
                <span className="text-[10px] sm:text-xs uppercase font-black text-black tracking-wider flex items-center">
                  <span className="w-2.5 h-2.5 bg-red-600 border border-black inline-block mr-1.5 rounded-full" />
                  DEUTSCH ORIGINAL
                </span>
              </div>

              {/* Question Text */}
              <div className="bg-[#fcfbf9] border border-black p-2 rounded-md shadow-sm min-h-[48px] flex items-center">
                <h3 className="text-xs sm:text-sm font-black text-black leading-snug select-text">
                  {question.questionDe}
                </h3>
              </div>
            </div>

            {/* Sibling 2: German Choices Button Group (pt-3px, pl-14px, pb-3px padding is applied cleanly matching user CSS rules!) */}
            <div className="space-y-1.5">
              {question.options.map((option, idx) => {
                const isSelected = selectedIdx === idx;
                const isCorrectOption = idx === question.correctIndex;
                
                let btnStyle = "bg-white border-2 border-black hover:bg-[#faf7ee] text-black active:translate-y-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:border-black cursor-pointer";
                let badgeStyle = "bg-[#1d4ed8] text-white";
                let rightIndicator = null;

                if (hasSubmitted) {
                  if (isCorrectOption) {
                    btnStyle = "bg-[#22c55e] border-2 border-black text-black font-extrabold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]";
                    badgeStyle = "bg-black text-[#22c55e]";
                    rightIndicator = <CheckCircle className="w-3.5 h-3.5 text-black shrink-0 ml-1.5" />;
                  } else if (isSelected) {
                    btnStyle = "bg-[#ef4444] border-2 border-black text-white font-extrabold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]";
                    badgeStyle = "bg-white text-[#ef4444]";
                    rightIndicator = <AlertCircle className="w-3.5 h-3.5 text-white shrink-0 ml-1.5" />;
                  } else {
                    btnStyle = "bg-slate-100 border border-slate-200 text-slate-400 opacity-40 shadow-none pointer-events-none";
                    badgeStyle = "bg-slate-200 text-slate-400";
                  }
                }

                return (
                  <button
                    key={`de-${idx}`}
                    disabled={hasSubmitted}
                    onClick={() => handleOptionClick(idx)}
                    className={`w-full pt-[3px] pb-[3px] pl-[14px] pr-2 border-2 rounded-lg text-left transition-all duration-105 flex items-center justify-between text-xs sm:text-[13px] ${btnStyle}`}
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className={`w-4.5 h-4.5 rounded-none border border-black ${badgeStyle} text-[9px] font-black flex items-center justify-center shrink-0`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="font-bold text-xs truncate leading-tight select-text">
                        {option.textDe}
                      </span>
                    </div>
                    {rightIndicator}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Column 2: ENGLISH TRANSLATION */}
          {!isMockMode && (
            <div className="flex flex-col space-y-2">
              
              {/* Sibling 1: English Question Section wrapper */}
              <div className="space-y-2">
                {/* Column Header */}
                <div className="flex items-center justify-between pb-1 border-b-2 border-black">
                  <span className="text-[10px] sm:text-xs uppercase font-black text-black tracking-wider flex items-center">
                    <span className="w-2.5 h-2.5 bg-blue-600 border border-black inline-block mr-1.5 rounded-full" />
                    ENGLISH TRANSLATION
                  </span>
                  <span className="text-[9px] text-[#1d4ed8] font-bold">
                    Bilingual Sync Active
                  </span>
                </div>

                {/* Question Text */}
                <div className="bg-[#f2f7fc] border border-black p-2 rounded-md shadow-sm min-h-[48px] flex items-center">
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug select-text italic">
                    {question.questionEn}
                  </h3>
                </div>
              </div>

              {/* Sibling 2: English Choices Button Group */}
              <div className="space-y-1.5">
                {question.options.map((option, idx) => {
                  const isSelected = selectedIdx === idx;
                  const isCorrectOption = idx === question.correctIndex;
                  
                  let btnStyle = "bg-white border-2 border-black hover:bg-[#faf7ee] text-black active:translate-y-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:border-black cursor-pointer";
                  let badgeStyle = "bg-[#1d4ed8] text-white";
                  let rightIndicator = null;

                  if (hasSubmitted) {
                    if (isCorrectOption) {
                      btnStyle = "bg-[#22c55e] border-2 border-black text-black font-extrabold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]";
                      badgeStyle = "bg-black text-[#22c55e]";
                      rightIndicator = <CheckCircle className="w-3.5 h-3.5 text-black shrink-0 ml-1.5" />;
                    } else if (isSelected) {
                      btnStyle = "bg-[#ef4444] border-2 border-black text-white font-extrabold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]";
                      badgeStyle = "bg-white text-[#ef4444]";
                      rightIndicator = <AlertCircle className="w-3.5 h-3.5 text-white shrink-0 ml-1.5" />;
                    } else {
                      btnStyle = "bg-slate-100 border border-slate-200 text-slate-400 opacity-40 shadow-none pointer-events-none";
                      badgeStyle = "bg-slate-200 text-slate-400";
                    }
                  }

                  return (
                    <button
                      key={`en-${idx}`}
                      disabled={hasSubmitted}
                      onClick={() => handleOptionClick(idx)}
                      className={`w-full pt-[3px] pb-[3px] pl-[14px] pr-2 border-2 rounded-lg text-left transition-all duration-105 flex items-center justify-between text-xs sm:text-[13px] ${btnStyle}`}
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        <span className={`w-4.5 h-4.5 rounded-none border border-black ${badgeStyle} text-[9px] font-black flex items-center justify-center shrink-0`}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="font-semibold text-xs text-slate-700 truncate leading-tight italic select-text">
                          {option.textEn}
                        </span>
                      </div>
                      {rightIndicator}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Navigation Footer */}
      <div className="border-t-3 border-black p-3 bg-white flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
        <button
          onClick={onPrev}
          disabled={index === 0}
          className="w-full sm:w-auto flex items-center justify-center space-x-1.5 text-xs font-black text-black hover:bg-[#eaeaea] px-3.5 py-1.5 border-2 border-black bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> <span>Previous</span>
        </button>

        {hasSubmitted ? (
          <div className="text-[10px] font-extrabold flex items-center py-0.5">
            {selectedIdx === question.correctIndex ? (
              <span className="text-black bg-[#22c55e] border-2 border-black px-2.5 py-0.5 font-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                🎉 RICHTIG! +1 XP
              </span>
            ) : (
              <span className="text-white bg-[#ef4444] border-2 border-black px-2.5 py-0.5 font-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                ❌ FALSCH! Correct answer is green
              </span>
            )}
          </div>
        ) : (
          <div className="text-[9px] sm:text-[10px] text-black font-extrabold uppercase bg-[#fbbf24] border-2 border-black px-2 py-0.5 animate-pulse">
            Select an option choice above to verify
          </div>
        )}

        <button
          onClick={onNext}
          disabled={index === total - 1}
          className="w-full sm:w-auto flex items-center justify-center space-x-1.5 text-xs font-black text-white hover:bg-[#1d4ed8]/90 px-3.5 py-1.5 border-2 border-black bg-[#1d4ed8] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer"
        >
          <span>Next</span> <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

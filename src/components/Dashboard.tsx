import { QuizAttempt, Question } from '../types';
import { Award, CheckCircle, Clock, Star, Compass } from 'lucide-react';

interface DashboardProps {
  attempts: QuizAttempt[];
  questions: Question[];
  onStartExam: () => void;
  onResetProgress: () => void;
}

export default function Dashboard({
  attempts,
  questions,
  onStartExam,
  onResetProgress
}: DashboardProps) {
  // Statistics Calculations
  const totalAttempted = attempts.length;
  const correctAttempts = attempts.filter(a => a.isCorrect).length;
  const correctPercent = totalAttempted > 0 ? Math.round((correctAttempts / totalAttempted) * 100) : 0;
  
  // Calculate average streak - consecutive successful responses
  let currentStreak = 0;
  let maxStreak = 0;
  const sortedAttempts = [...attempts].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  
  for (const attempt of sortedAttempts) {
    if (attempt.isCorrect) {
      currentStreak++;
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }
    } else {
      currentStreak = 0;
    }
  }

  // Passing standard simulation calculation (e.g. 17 / 33 scale)
  const isPassingMockExam = correctPercent >= 51; // Einbürgerungstest standard is 17 of 33 which is ~51.5%
  
  // Progress ratios
  const uniqueAttemptedIds = new Set(attempts.map(a => a.questionId));
  const uniqueAttemptedCount = uniqueAttemptedIds.size;
  const coveragePercent = Math.min(100, Math.round((uniqueAttemptedCount / Math.max(1, questions.length)) * 100));

  return (
    <div className="space-y-6 animate-fadeIn text-black">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-white border-2 sm:border-3 border-black p-5 sm:p-7 rounded-xl bauhaus-shadow">
        {/* Asymmetrical Bauhaus shapes in the corner! Very authentic */}
        <div className="absolute right-0 top-0 h-28 w-28 bg-[#fbbf24] border-l-2 border-b-2 border-black -mr-4 -mt-4 rotate-12 opacity-90 hidden sm:block" />
        <div className="absolute right-12 top-6 h-12 w-12 bg-[#dc2626] border-2 border-black rounded-none -mt-4 rotate-45 opacity-90 hidden sm:block" />
        
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-4 max-w-xl">
            <div className="space-y-2.5">
              <span className="text-[10px] bg-black text-[#fbbf24] font-black px-3 py-1 border border-black uppercase tracking-widest inline-block">
                LERNPORTAL DEUTSCH
              </span>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight font-sans text-black">
                State Citizenship Trainer
              </h1>
              <p className="text-slate-800 text-xs sm:text-sm leading-relaxed font-sans font-semibold">
                Master the German Einbürgerungstest. Explore 310 targeted, bilingual questions with contextual translation helpers, live tracking matrices, and realistic BAMF mock exams.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2.5 shrink-0 z-10">
              <button
                onClick={onStartExam}
                className="px-5 py-3 bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-extrabold border-2 border-black rounded-lg text-xs tracking-wider transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer uppercase"
              >
                Start Official Mock Exam
              </button>
              <button
                onClick={onResetProgress}
                disabled={attempts.length === 0}
                className="px-4 py-3 bg-white hover:bg-slate-50 border-2 border-black text-black text-xs font-black rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer"
              >
                Reset Progress
              </button>
            </div>
          </div>

          {/* Bauhaus Reading Girl Illustration */}
          <div className="hidden md:flex justify-center items-center shrink-0 bg-[#fefcf6] border-2 border-black p-4 rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern opacity-10" />
            <svg viewBox="0 0 240 200" className="w-44 sm:w-48 md:w-52 h-auto z-10 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Bauhaus Geometric Background Elements */}
              <circle cx="120" cy="100" r="75" fill="#fef08a" opacity="0.85" />
              <path d="M 40,150 L 200,150" stroke="black" strokeWidth="4" strokeLinecap="round" />
              <rect x="50" y="110" width="70" height="40" fill="#1d4ed8" stroke="black" strokeWidth="3" />
              <circle cx="160" cy="80" r="18" fill="#dc2626" opacity="0.95" />

              {/* Legs */}
              <path d="M 75,130 L 75,160 M 90,130 L 105,160" stroke="black" strokeWidth="4.5" strokeLinecap="round" />
              <path d="M 68,160 L 78,161 M 105,160 L 115,161" stroke="black" strokeWidth="4.5" strokeLinecap="round" />
              
              {/* Body */}
              <path d="M 80,75 L 110,130 L 70,130 Z" fill="#c084fc" stroke="black" strokeWidth="3" strokeLinejoin="round" />

              {/* Head & Neck */}
              <path d="M 88,75 L 88,65" stroke="black" strokeWidth="4" strokeLinecap="round" />
              <circle cx="88" cy="52" r="15" fill="#f1be9b" stroke="black" strokeWidth="3" />

              {/* Hair */}
              <circle cx="88" cy="35" r="7" fill="black" />
              <path d="M 73,50 C 73,35 103,35 103,50 C 103,55 98,58 98,52 C 98,42 78,42 78,52 C 78,58 73,55 73,50 Z" fill="black" />

              {/* Arms holding the book */}
              <path d="M 80,85 C 95,95 105,95 115,90" stroke="black" strokeWidth="4.5" strokeLinecap="round" />
              
              {/* The Book */}
              <path d="M 112,82 L 125,75 L 138,82 L 138,95 L 125,88 L 112,95 Z" fill="#fbbf24" stroke="black" strokeWidth="2.5" strokeLinejoin="round" />
              <path d="M 125,75 L 125,88" stroke="black" strokeWidth="2" />

              {/* Reading glasses */}
              <circle cx="91" cy="52" r="3.5" stroke="black" strokeWidth="2" fill="none" />
              <circle cx="83" cy="52" r="3.5" stroke="black" strokeWidth="2" fill="none" />
              <line x1="86.5" y1="52" x2="87.5" y2="52" stroke="black" strokeWidth="1.5" />
            </svg>
          </div>
        </div>
      </div>

      {/* Numerical Metrics Cards in Bauhaus geometric blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Total attempts card */}
        <div className="bg-white rounded-lg border-2 border-black p-4.5 shadow-[4px_4px_0px_0px_rgba(29,78,216,1)] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">TOTAL ATTEMPTS</p>
              <p className="text-3xl font-black text-black leading-none">{totalAttempted}</p>
              <p className="text-[10px] text-slate-600 font-bold font-mono mt-1">
                {uniqueAttemptedCount} of {questions.length} questions covered
              </p>
            </div>
            <div className="p-2 border-2 border-black bg-[#fbbf24] text-black">
              <Clock className="w-4 h-4 stroke-[2.5px]" />
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-100 h-2 border border-black mt-4 overflow-hidden">
            <div className="bg-[#1d4ed8] h-full transition-all duration-300" style={{ width: `${coveragePercent}%` }} />
          </div>
        </div>

        {/* Accuracy card */}
        <div className="bg-white rounded-lg border-2 border-black p-4.5 shadow-[4px_4px_0px_0px_rgba(34,197,94,1)] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">ACCURACY RATIO</p>
              <p className="text-3xl font-black text-black leading-none">{correctPercent}%</p>
              <p className="text-[10px] text-slate-600 font-bold font-mono mt-1">
                {correctAttempts} answers successfully solved
              </p>
            </div>
            <div className="p-2 border-2 border-black bg-[#22c55e] text-black">
              <CheckCircle className="w-4 h-4 stroke-[2.5px]" />
            </div>
          </div>
          <div className="w-full bg-slate-100 h-2 border border-black mt-4 overflow-hidden">
            <div className="bg-[#22c55e] h-full transition-all duration-300" style={{ width: `${correctPercent}%` }} />
          </div>
        </div>

        {/* Streak card */}
        <div className="bg-white rounded-lg border-2 border-black p-4.5 shadow-[4px_4px_0px_0px_rgba(251,191,36,1)] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">CURRENT STREAK</p>
              <p className="text-3xl font-black text-black leading-none">{currentStreak}</p>
              <p className="text-[10px] text-slate-600 font-bold font-mono mt-1">
                Max streak limit: {maxStreak}
              </p>
            </div>
            <div className="p-2 border-2 border-black bg-[#fbbf24] text-black">
              <Star className="w-4 h-4 stroke-[2.5px]" />
            </div>
          </div>
          <div className="w-full bg-slate-100 h-2 border border-black mt-4 overflow-hidden">
            <div className="bg-[#fbbf24] h-full transition-all duration-300" style={{ width: `${totalAttempted > 0 ? (currentStreak / Math.max(1, maxStreak)) * 100 : 0}%` }} />
          </div>
        </div>

        {/* Test readiness card */}
        <div className="bg-white rounded-lg border-2 border-black p-4.5 shadow-[4px_4px_0px_0px_rgba(220,38,38,1)] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">TEST READINESS</p>
              <p className="text-lg sm:text-xl font-black text-black uppercase leading-tight truncate">
                {totalAttempted < 10 ? "ANALYZING" : isPassingMockExam ? "PASSED (READY)" : "NEEDS WORK"}
              </p>
              <p className="text-[10px] text-slate-600 font-bold mt-1">
                {totalAttempted < 10 ? "Complete 10 answers first" : `Survival threshold met!`}
              </p>
            </div>
            <div className="p-2 border-2 border-black bg-[#dc2626] text-white">
              <Award className="w-4 h-4 stroke-[2.5px]" />
            </div>
          </div>
          <div className="w-full bg-slate-100 h-2 border border-black mt-4 overflow-hidden">
            <div className="bg-[#dc2626] h-full transition-all duration-300" style={{ width: `${totalAttempted < 10 ? (totalAttempted / 10) * 100 : correctPercent}%` }} />
          </div>
        </div>
      </div>

      <div className="pt-2">
        
        {/* Practice History Logging list */}
        <div className="bg-white rounded-xl border-2 border-black p-4.5 sm:p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-black pb-2">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-[#1d4ed8]" />
              <h3 className="font-black text-sm sm:text-base tracking-tight font-sans text-black">RECENT PRACTICE LOGS</h3>
            </div>
            <span className="text-[10px] text-black font-semibold font-mono bg-[#fbbf24] border border-black px-2 py-0.5 rounded-none">
              {attempts.length} attempts recorded
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[300px] divide-y-2 divide-black border-2 border-black rounded bg-white">
            {sortedAttempts.length > 0 ? (
              [...sortedAttempts].reverse().map((attempt, index) => {
                const associatedQuestion = questions.find(q => q.id === attempt.questionId);
                if (!associatedQuestion) return null;

                return (
                  <div key={index} className="p-3 hover:bg-slate-50 transition-colors flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-[9px] font-black text-white bg-black px-2 py-0.5 rounded-none uppercase">
                          Question {associatedQuestion.taskNumber}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(attempt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-black line-clamp-1 leading-snug">
                        DE: {associatedQuestion.questionDe}
                      </p>
                      <p className="text-xs text-slate-600 font-medium italic line-clamp-1 leading-tight">
                        EN: {associatedQuestion.questionEn}
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center">
                      <span className={`text-[9px] font-black px-2.5 py-1 uppercase tracking-wider border border-black ${
                        attempt.isCorrect 
                          ? 'bg-[#22c55e] text-black' 
                          : 'bg-[#ef4444] text-white'
                      }`}>
                        {attempt.isCorrect ? "Correct" : "Wrong"}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs flex flex-col items-center justify-center space-y-3 font-medium">
                <Compass className="w-8 h-8 text-black animate-pulse" />
                <p>Your practice logs are empty. Choose questions above and click an option to submit responses!</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

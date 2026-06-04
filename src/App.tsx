import { useState, useEffect } from 'react';
import { QUESTIONS } from './data/questions';
import { generateStateQuestions, BUNDESLAENDER } from './data/stateQuestions';
import { Question, QuizAttempt } from './types';
import { QuestViewer, Dashboard } from './components';
import { GraduationCap, Compass, HelpCircle, Award, MapPin, ListFilter, Sparkles, AlertTriangle, Menu, X, Cloud, LogOut } from 'lucide-react';
import { auth, db, signInWithGoogle, logOut, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc, getDocs, collection, getDocFromServer } from 'firebase/firestore';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'practice' | 'mock-exam' | 'guide'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [selectedState, setSelectedState] = useState<string>(() => {
    return localStorage.getItem('trainer_selected_state') || 'Nordrhein-Westfalen';
  });

  // Practice Stats Tracking
  const [attempts, setAttempts] = useState<QuizAttempt[]>(() => {
    try {
      const saved = localStorage.getItem('trainer_quiz_attempts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Track the user's active index in Practice mode up to 310 questions
  const [practiceIndex, setPracticeIndex] = useState<number>(0);

  // Mock Exam Session State
  const [mockExamQuestions, setMockExamQuestions] = useState<Question[]>([]);
  const [mockExamIndex, setMockExamIndex] = useState<number>(0);
  const [mockExamAnswers, setMockExamAnswers] = useState<Record<number, { selectedIdx: number; isCorrect: boolean }>>({});
  const [mockExamFinished, setMockExamFinished] = useState<boolean>(false);
  const [mockExamScore, setMockExamScore] = useState<{ correct: number; total: number } | null>(null);

  // Firebase Authentication and Synced Status
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Critical Connection Test on boot
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'connection-test', 'ping'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. Client is offline.");
        }
      }
    }
    testConnection();
  }, []);

  // Listen to Auth State and Retrieve Cloud-synced Profile and Attempts
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      
      if (currentUser) {
        setSyncing(true);
        try {
          const userId = currentUser.uid;
          
          // 1. Fetch Profile
          const profileRef = doc(db, 'users', userId);
          const profileSnap = await getDoc(profileRef);
          
          let cloudState = selectedState;
          let cloudPracticeIdx = practiceIndex;
          
          if (profileSnap.exists()) {
            const profileData = profileSnap.data();
            cloudState = profileData.selectedState;
            cloudPracticeIdx = profileData.practiceIndex;
            setSelectedState(cloudState);
            setPracticeIndex(cloudPracticeIdx);
          } else {
            // New user, push current local preferences as profile baseline
            await setDoc(profileRef, {
              userId,
              selectedState,
              practiceIndex,
              updatedAt: new Date().toISOString()
            });
          }
          
          // 2. Fetch Attempts
          const attemptsColRef = collection(db, 'users', userId, 'attempts');
          const attemptsSnap = await getDocs(attemptsColRef);
          const cloudAttempts: QuizAttempt[] = [];
          
          attemptsSnap.forEach((doc) => {
            const data = doc.data();
            cloudAttempts.push({
              id: `${data.timestamp}-${data.questionId}`,
              timestamp: data.timestamp,
              questionId: data.questionId,
              selectedIdx: data.selectedIdx,
              isCorrect: data.isCorrect
            });
          });
          
          // Merge local and cloud attempts by taking the most recent completion
          setAttempts(prev => {
            const mergedMap = new Map<number, QuizAttempt>();
            
            prev.forEach(attempt => {
              mergedMap.set(attempt.questionId, attempt);
            });
            
            cloudAttempts.forEach(attempt => {
              const local = mergedMap.get(attempt.questionId);
              if (!local || new Date(attempt.timestamp) > new Date(local.timestamp)) {
                mergedMap.set(attempt.questionId, attempt);
              }
            });
            
            const mergedArray = Array.from(mergedMap.values());
            localStorage.setItem('trainer_quiz_attempts', JSON.stringify(mergedArray));
            return mergedArray;
          });
          
        } catch (error) {
          console.error("Cloud synchronisation failed:", error);
        } finally {
          setSyncing(false);
        }
      }
    });
    
    return () => unsubscribe();
  }, [auth]);

  // Debounced cloud profile sync
  useEffect(() => {
    if (!user) return;
    
    const timeoutId = setTimeout(async () => {
      try {
        const profileRef = doc(db, 'users', user.uid);
        await setDoc(profileRef, {
          userId: user.uid,
          selectedState,
          practiceIndex,
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error("Profile sync failure:", err);
      }
    }, 1000); // 1-second debounce
    
    return () => clearTimeout(timeoutId);
  }, [selectedState, practiceIndex, user]);

  const handleLogin = async () => {
    setLoginError(null);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error("Sign In failed:", error);
      const errorCode = error?.code || '';
      const errorMessage = error?.message || String(error);
      
      if (errorCode === 'auth/unauthorized-domain' || errorMessage.includes('unauthorized-domain') || errorMessage.includes('auth/unauthorized-domain')) {
        setLoginError(`unauthorized-domain|${window.location.hostname}`);
      } else if (errorCode === 'auth/popup-blocked') {
        setLoginError("popup-blocked");
      } else {
        setLoginError(errorMessage);
      }
    }
  };

  const handleLogout = async () => {
    if (confirm("Are you sure you want to sign out? Your history remains saved locally and in the cloud.")) {
      try {
        await logOut();
      } catch (error) {
        console.error("Sign Out failed:", error);
      }
    }
  };

  // Sync state & attempts to localStorage
  useEffect(() => {
    localStorage.setItem('trainer_selected_state', selectedState);
  }, [selectedState]);

  useEffect(() => {
    localStorage.setItem('trainer_quiz_attempts', JSON.stringify(attempts));
  }, [attempts]);

  // Combine general questions (300) and state-specific questions (10) for lists = 310
  const stateQuestions = generateStateQuestions(selectedState);
  const totalQuestionsList = [...QUESTIONS, ...stateQuestions];

  // Submit Answer in Practice mode
  const handleSelectAnswerPractice = async (isCorrect: boolean, selectedIdx: number) => {
    const activeQuestion = totalQuestionsList[practiceIndex];
    const timestamp = new Date().toISOString();
    const newAttempt: QuizAttempt = {
      id: `${Date.now()}-${activeQuestion.id}`,
      timestamp,
      questionId: activeQuestion.id,
      selectedIdx,
      isCorrect
    };
    
    setAttempts(prev => {
      const filtered = prev.filter(a => a.questionId !== activeQuestion.id);
      return [newAttempt, ...filtered];
    });

    if (user) {
      try {
        const attemptRef = doc(db, 'users', user.uid, 'attempts', `q${activeQuestion.id}`);
        await setDoc(attemptRef, {
          questionId: activeQuestion.id,
          selectedIdx,
          isCorrect,
          timestamp
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/attempts/q${activeQuestion.id}`);
      }
    }
  };

  // Setup / Initialize a realistic 33-question mock exam (30 general + 3 current state questions)
  const handleStartExam = () => {
    const shuffledGeneral = [...QUESTIONS].sort(() => 0.5 - Math.random());
    const selectedGeneral = shuffledGeneral.slice(0, 30);
    const selectedStateQs = generateStateQuestions(selectedState).slice(0, 3);
    
    setMockExamQuestions([...selectedGeneral, ...selectedStateQs]);
    setMockExamIndex(0);
    setMockExamAnswers({});
    setMockExamFinished(false);
    setMockExamScore(null);
    setActiveTab('mock-exam');
  };

  // Submit Answer in Mock Exam mode
  const handleSelectAnswerMock = (isCorrect: boolean, selectedIdx: number) => {
    const activeQuestion = mockExamQuestions[mockExamIndex];
    setMockExamAnswers(prev => ({
      ...prev,
      [activeQuestion.id]: { selectedIdx, isCorrect }
    }));
  };

  const handleFinishMockExam = async () => {
    let correctCount = 0;
    mockExamQuestions.forEach(q => {
      if (mockExamAnswers[q.id]?.isCorrect) {
        correctCount++;
      }
    });

    setMockExamScore({
      correct: correctCount,
      total: mockExamQuestions.length
    });
    setMockExamFinished(true);

    const timestamp = new Date().toISOString();
    const newAttempts: QuizAttempt[] = mockExamQuestions.map(q => ({
      id: `${Date.now()}-${q.id}-mock`,
      timestamp,
      questionId: q.id,
      selectedIdx: mockExamAnswers[q.id]?.selectedIdx ?? -1,
      isCorrect: mockExamAnswers[q.id]?.isCorrect ?? false
    }));

    setAttempts(prev => {
      const activeIds = new Set(newAttempts.map(n => n.questionId));
      const filteredPrev = prev.filter(a => !activeIds.has(a.questionId));
      return [...newAttempts, ...filteredPrev];
    });

    if (user) {
      try {
        for (const item of newAttempts) {
          const attemptRef = doc(db, 'users', user.uid, 'attempts', `q${item.questionId}`);
          await setDoc(attemptRef, {
            questionId: item.questionId,
            selectedIdx: item.selectedIdx,
            isCorrect: item.isCorrect,
            timestamp
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/attempts`);
      }
    }
  };

  const handleResetProgress = async () => {
    if (confirm("Are you sure you want to clear your quiz history, streaks, and personal study lists?")) {
      setAttempts([]);
      setPracticeIndex(0);
      setMockExamAnswers({});
      setMockExamFinished(false);
      setMockExamScore(null);
      localStorage.removeItem('trainer_quiz_attempts');
      localStorage.removeItem('trainer_custom_study_list');
      localStorage.removeItem('trainer_search_history');

      if (user) {
        try {
          const profileRef = doc(db, 'users', user.uid);
          await setDoc(profileRef, {
            userId: user.uid,
            selectedState,
            practiceIndex: 0,
            updatedAt: new Date().toISOString()
          });

          // Delete all records in attempts subcollection
          const attemptsCol = collection(db, 'users', user.uid, 'attempts');
          const snap = await getDocs(attemptsCol);
          for (const d of snap.docs) {
            await deleteDoc(d.ref);
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}`);
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfaf2] text-black font-sans antialiased selection:bg-[#fbbf24] selection:text-black pb-12">
      
      {/* Firebase Auth Error Modal / Warning */}
      {loginError && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border-3 border-black p-6 rounded-xl max-w-md w-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4 relative font-semibold">
            <button 
              onClick={() => setLoginError(null)} 
              className="absolute top-4 right-4 p-1 border-2 border-black hover:bg-slate-50 rounded cursor-pointer"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
            
            <div className="flex items-center space-x-2 text-[#ef4444] border-b-2 border-black pb-2">
              <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
              <h3 className="font-black text-sm uppercase tracking-tight">Login Error Info</h3>
            </div>
            
            {loginError.startsWith("unauthorized-domain") ? (
              <div className="space-y-3 text-xs leading-relaxed text-slate-800">
                <p>
                  Identity/Google Login requires the hosting domain to be added to your Firebase project's <strong>Authorized Domains</strong>.
                </p>
                <div className="p-3 bg-rose-50 border-2 border-dashed border-[#ef4444] rounded font-mono break-all text-[11px] text-black">
                  Domain: {loginError.split("|")[1]}
                </div>
                <div className="space-y-2 pt-1">
                  <p className="font-extrabold text-black uppercase text-[10px] tracking-wider text-[#1d4ed8]">How to fix in 30 seconds:</p>
                  <ol className="list-decimal pl-4.5 space-y-1">
                    <li>Open <strong>Firebase Console</strong> and open your project <strong>gen-lang-client-0293337794</strong>.</li>
                    <li>Navigate to <strong>Authentication</strong> &rarr; <strong>Settings</strong> &rarr; <strong>Authorized domains</strong>.</li>
                    <li>Click <strong>Add domain</strong> and add: <strong className="bg-[#fbbf24] px-1 text-black">{loginError.split("|")[1]}</strong></li>
                  </ol>
                </div>
              </div>
            ) : loginError === "popup-blocked" ? (
              <div className="space-y-2 text-xs text-slate-800 leading-relaxed">
                <p>
                  The sign-in popup was blocked by your browser.
                </p>
                <p>
                  Please click the button again and allow popups for this site, or check your browser settings.
                </p>
              </div>
            ) : (
              <div className="space-y-2 text-xs text-slate-800 leading-relaxed">
                <p>
                  An error occurred during authentication:
                </p>
                <pre className="p-3 bg-slate-50 border-2 border-black font-mono break-all text-[10px] text-slate-700 whitespace-pre-wrap">
                  {loginError}
                </pre>
              </div>
            )}
            
            <div className="pt-2 flex justify-end">
              <button 
                onClick={() => setLoginError(null)}
                className="px-4 py-2 bg-black hover:bg-slate-800 text-white text-xs font-black uppercase rounded shadow-[2px_2px_0px_0px_rgba(251,191,36,1)] active:translate-y-0.5 cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Bauhaus Header */}
      <header className="sticky top-0 z-40 bg-white border-b-3 border-black shadow-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            
            <div className="flex items-center space-x-2">
              {/* Mobile Burger Menu on top left */}
              <div className="flex md:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(prev => !prev)}
                  className="p-1 px-1.5 border-2 border-black bg-white hover:bg-slate-50 text-black rounded-md shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer flex items-center justify-center"
                  aria-label="Toggle Menu"
                >
                  {isMobileMenuOpen ? (
                    <X className="w-5 h-5 stroke-[2.5px]" />
                  ) : (
                    <Menu className="w-5 h-5 stroke-[2.5px]" />
                  )}
                </button>
              </div>

              {/* Logo box */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#1d4ed8] text-white border-2 border-black flex items-center justify-center relative shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
                  <span className="font-black text-xs sm:text-sm tracking-tighter">DE</span>
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#fbbf24] border border-black" />
                </div>
                <div className="leading-tight">
                  <span className="font-black text-[13px] sm:text-base text-black block tracking-tight">
                    Citizenship Trainer
                  </span>
                  <span className="text-[9px] text-[#dc2626] font-black uppercase tracking-wider block">
                    Bilingual Study Lab
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs (Desktop only) */}
            <nav className="hidden md:flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto scrollbar-none py-1">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: Compass },
                { id: 'practice', label: 'Practice', icon: GraduationCap },
                { id: 'mock-exam', label: 'Mock Exam', icon: Award },
                { id: 'guide', label: 'Guide', icon: HelpCircle }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 py-1.5 sm:px-3 rounded-md text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#1d4ed8] text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                        : 'text-black hover:bg-slate-50 border-2 border-black bg-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 stroke-[2.5px]" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Right section: State selector and Cloud sync */}
            <div className="flex items-center space-x-2 shrink-0">
              {/* Federal State Selector */}
              <div className="flex items-center space-x-1 bg-white border-2 border-black rounded-lg px-2 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <MapPin className="w-3.5 h-3.5 text-[#dc2626] shrink-0" />
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="bg-transparent text-black font-black focus:outline-none text-[10px] sm:text-xs font-sans h-7 cursor-pointer border-none max-w-[100px] sm:max-w-none"
                >
                  {Object.keys(BUNDESLAENDER).map(name => (
                    <option key={name} value={name} className="bg-white text-black font-bold">{name}</option>
                  ))}
                </select>
              </div>

              {/* Authentication Sync Control */}
              {authLoading ? (
                <div className="w-8 h-8 rounded-full border-2 border-black bg-slate-100 animate-pulse shrink-0" />
              ) : user ? (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleLogout}
                    className="hidden sm:inline-block text-[9px] font-black bg-white hover:bg-slate-50 border-2 border-black text-black px-2.5 py-1.5 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer uppercase tracking-wider h-8 rounded"
                    title="Sign Out"
                  >
                    Logout
                  </button>
                  <div 
                    className="w-8 h-8 rounded-full border-2 border-black bg-[#fbbf24] flex items-center justify-center text-xs font-black shrink-0 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] relative select-none"
                    title={`${user.displayName || user.email} (Cloud Sync Active)`}
                  >
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="avatar" className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <span>{user.displayName?.charAt(0) || user.email?.charAt(0) || '?'}</span>
                    )}
                    <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-[#22c55e] border border-black rounded-full" title="Cloud Sync Active" />
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className="text-xs font-black uppercase tracking-wider hover:text-[#1d4ed8] focus:outline-none transition-colors cursor-pointer"
                  title="Enable Cloud Backup"
                >
                  LOGIN
                </button>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Mobile Menu Slide-down/Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[65px] sm:top-[81px] right-0 bottom-0 left-0 bg-black/65 z-50 animate-fadeIn" onClick={() => setIsMobileMenuOpen(false)}>
          <div 
            className="w-64 max-w-[85vw] h-full bg-[#fcfaf2] border-r-3 border-black p-5 flex flex-col space-y-4 shadow-[4px_0px_0px_0px_rgba(0,0,0,1)] transform transition-transform"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b-2 border-black pb-3">
              <span className="font-black text-[10px] bg-black text-[#fbbf24] px-2 py-0.5 border border-black uppercase tracking-wider inline-block">
                NAVIGATE PORTAL
              </span>
            </div>
            
            <div className="flex flex-col space-y-3">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: Compass },
                { id: 'practice', label: 'Practice', icon: GraduationCap },
                { id: 'mock-exam', label: 'Mock Exam', icon: Award },
                { id: 'guide', label: 'Guide', icon: HelpCircle }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#1d4ed8] text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                        : 'text-black hover:bg-slate-50 border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5'
                    }`}
                  >
                    <Icon className="w-4 h-4 stroke-[2.5px]" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Mobile Account Control Widget */}
            <div className="border-t-2 border-black pt-4 mt-auto space-y-3">
              {authLoading ? (
                <div className="h-16 bg-white border-2 border-black animate-pulse rounded-lg" />
              ) : user ? (
                <div className="bg-white border-2 border-black p-3 rounded-lg space-y-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-full border-2 border-black bg-[#fbbf24] flex items-center justify-center font-black text-xs shrink-0 select-none">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt="avatar" className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <span>{user.displayName?.charAt(0) || user.email?.charAt(0) || '?'}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black text-black truncate">{user.displayName || user.email}</p>
                      <p className="text-[8px] text-[#22c55e] font-black uppercase">● Cloud Synced</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full py-1.5 bg-[#ef4444] text-white border-2 border-black rounded font-black text-[10px] uppercase shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer text-center"
                  >
                    Sign Out Account
                  </button>
                </div>
              ) : (
                <div className="bg-white border-2 border-black p-3 rounded-lg space-y-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-center">
                  <p className="text-[9px] uppercase font-black text-slate-500">Enable Cloud Storage</p>
                  <p className="text-[9px] font-semibold text-slate-800 leading-tight">Sync your progress and streaks across any machine.</p>
                  <button
                    onClick={() => {
                      handleLogin();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-xs font-black uppercase tracking-wider hover:text-[#1d4ed8] focus:outline-none transition-colors cursor-pointer text-center py-1.5 mt-2 block"
                  >
                    LOGIN
                  </button>
                </div>
              )}
            </div>

            <div className="pt-3 text-center">
              <span className="text-[9px] text-slate-500 font-extrabold uppercase">Citizenship Study Lab 🇩🇪</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Container Layout */}
      <main className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 mt-5 sm:mt-7">
        <div className="space-y-5 sm:space-y-6">
            
            {activeTab === 'dashboard' && (
              <Dashboard
                attempts={attempts}
                questions={totalQuestionsList}
                onStartExam={handleStartExam}
                onResetProgress={handleResetProgress}
              />
            )}

            {activeTab === 'practice' && (
              <div className="space-y-4">
                <div className="bg-white px-5 py-3 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-[#dc2626] uppercase tracking-widest">Active Mode</p>
                    <h2 className="font-extrabold text-sm sm:text-base text-black">Bilingual Training Window (310 Qs)</h2>
                  </div>
                  <div className="text-[10px] bg-[#fbbf24] border-2 border-black text-black px-3 py-1 font-black flex items-center w-fit shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                    <Sparkles className="w-3.5 h-3.5 mr-1 text-black stroke-[3px]" /> General (300) + {selectedState} (10) Questions
                  </div>
                </div>

                {/* Navigation Jump Controller */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center space-x-1.5">
                    <ListFilter className="w-4 h-4 text-[#1d4ed8] stroke-[2.5px]" />
                    <span className="text-[10px] font-black uppercase text-black">Quick Jump:</span>
                  </div>
                  
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setPracticeIndex(prev => Math.max(0, prev - 10))}
                      className="text-xs px-2 py-0.5. sm:py-1 bg-white border-2 border-black text-black rounded font-black hover:bg-slate-50 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px]"
                      title="Skip back 10 questions"
                    >
                      -10
                    </button>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs font-bold text-slate-500">Q</span>
                      <input
                        type="number"
                        min={1}
                        max={totalQuestionsList.length}
                        value={practiceIndex + 1}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val) && val >= 1 && val <= totalQuestionsList.length) {
                            setPracticeIndex(val - 1);
                          }
                        }}
                        className="w-12 sm:w-14 bg-white border-2 border-black text-black font-black text-center text-xs py-1 focus:outline-none focus:ring-1 focus:ring-black"
                      />
                      <span className="text-xs font-bold text-slate-500">/ {totalQuestionsList.length}</span>
                    </div>
                    <button
                      onClick={() => setPracticeIndex(prev => Math.min(totalQuestionsList.length - 1, prev + 10))}
                      className="text-xs px-2 py-0.5 sm:py-1 bg-white border-2 border-black text-black rounded font-black hover:bg-slate-50 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px]"
                      title="Skip forward 10 questions"
                    >
                      +10
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] font-black text-slate-500 uppercase mr-0.5">Filter:</span>
                    <button
                      onClick={() => setPracticeIndex(0)}
                      className="text-[9px] uppercase font-black px-2 py-1 bg-[#1d4ed8] text-white border-2 border-black rounded shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px]"
                    >
                      General
                    </button>
                    <button
                      onClick={() => setPracticeIndex(300)}
                      className="text-[9px] uppercase font-black px-2 py-1 bg-[#fbbf24] text-black border-2 border-black rounded shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px]"
                    >
                      State
                    </button>
                  </div>
                </div>

                <QuestViewer
                  key={practiceIndex}
                  question={totalQuestionsList[practiceIndex]}
                  index={practiceIndex}
                  total={totalQuestionsList.length}
                  onNext={() => setPracticeIndex(prev => Math.min(totalQuestionsList.length - 1, prev + 1))}
                  onPrev={() => setPracticeIndex(prev => Math.max(0, prev - 1))}
                  onSelectAnswer={handleSelectAnswerPractice}
                  savedAnswer={
                    attempts.find(a => a.questionId === totalQuestionsList[practiceIndex].id) 
                      ? { 
                          selectedIdx: attempts.find(a => a.questionId === totalQuestionsList[practiceIndex].id)!.selectedIdx, 
                          isCorrect: attempts.find(a => a.questionId === totalQuestionsList[practiceIndex].id)!.isCorrect 
                        } 
                      : undefined
                  }
                />
              </div>
            )}

            {activeTab === 'mock-exam' && (
              <div className="space-y-4">
                
                {mockExamQuestions.length === 0 ? (
                  <div className="bg-white rounded-xl p-6 sm:p-10 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center flex flex-col items-center space-y-4">
                    <div className="w-14 h-14 bg-[#fbbf24] border-2 border-black text-black rounded-lg flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <GraduationCap className="w-8 h-8 stroke-[2.5px]" />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="font-black text-base sm:text-lg text-black uppercase tracking-tight">REALISTIC MOCK TEST (DEUTSCH ORIGINAL)</h3>
                      <p className="text-xs sm:text-sm text-slate-800 max-w-md mx-auto leading-relaxed font-semibold">
                        This simulates the real BAMF Citizenship Exam threshold. Features 33 random questions (30 general, 3 state) in German with no translations or dictionaries to test your final readiness.
                      </p>
                    </div>
                    <button
                      onClick={handleStartExam}
                      className="px-6 py-3 bg-[#dc2626] border-2 border-black text-white font-extrabold hover:bg-rose-700 rounded-lg text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer uppercase tracking-wider"
                    >
                      Start Mock Exam
                    </button>
                  </div>
                ) : mockExamFinished && mockExamScore ? (
                  /* Completed score screen */
                  <div className="bg-white rounded-xl p-6 sm:p-8 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-5 text-center animate-fadeIn font-semibold">
                    <div className={`w-16 h-16 mx-auto border-2 border-black rounded-lg flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${
                      mockExamScore.correct >= 17 ? 'bg-[#22c55e] text-black' : 'bg-[#ef4444] text-white'
                    }`}>
                      <Award className="w-9 h-9 stroke-[2.5px] animate-bounce" />
                    </div>
                    
                    <div className="space-y-1.5">
                      <h3 className="text-xl sm:text-2xl font-black text-black">
                        {mockExamScore.correct >= 17 ? "CONGRATULATIONS! EXAM PASSED" : "TRY AGAIN! EXAM UNFINISHED"}
                      </h3>
                      <p className="text-xs sm:text-sm font-bold text-slate-850">
                        You successfully solved <strong className="text-white bg-black px-2.5 py-0.5 font-mono">{mockExamScore.correct}</strong> out of <strong className="text-black">{mockExamScore.total}</strong> questions.
                      </p>
                      <p className="text-xs text-slate-600 font-semibold leading-relaxed max-w-md mx-auto">
                        {mockExamScore.correct >= 17 
                          ? `Passed state threshold! You are officially prepared for the physical naturalization exam in ${selectedState}.` 
                          : "State Einbürgerungstest requires at least 17 correct answers of 33 to pass. Take another run to consolidate!"
                        }
                      </p>
                    </div>

                    {/* Progress Score Bar */}
                    <div className="max-w-sm mx-auto space-y-1">
                      <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase">
                        <span>Correct answers split</span>
                        <span>{Math.round((mockExamScore.correct / mockExamScore.total) * 100)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-3 border-2 border-black overflow-hidden">
                        <div className={`h-full transition-all duration-300 ${
                          mockExamScore.correct >= 17 ? 'bg-[#22c55e]' : 'bg-[#ef4444]'
                        }`} style={{ width: `${(mockExamScore.correct / mockExamScore.total) * 100}%` }} />
                      </div>
                    </div>

                    <div className="border-t-2 border-black pt-5 flex justify-center space-x-3">
                      <button
                        onClick={handleStartExam}
                        className="px-5 py-2.5 bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-extrabold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 text-xs tracking-wider rounded transition-all cursor-pointer uppercase"
                      >
                        Try Again
                      </button>
                      <button
                        onClick={() => setActiveTab('dashboard')}
                        className="px-5 py-2.5 bg-white border-2 border-black hover:bg-slate-50 text-black font-extrabold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 text-xs transition-all cursor-pointer uppercase"
                      >
                        Dashboard
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Active exam questionnaire simulation stream */
                  <div className="space-y-4">
                    <div className="bg-white px-5 py-3 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-[10px] uppercase font-mono font-black text-[#dc2626] tracking-wider">EXAM SIMULATOR LIVE (DE ONLY)</p>
                        <h2 className="font-extrabold text-xs sm:text-sm text-black">Keep browser tab open</h2>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[10px] text-slate-500 font-extrabold uppercase">Progress:</span>
                        <span className="text-xs font-mono font-black text-white bg-black px-2.5 py-1 shadow-sm">
                          {Object.keys(mockExamAnswers).length} / {mockExamQuestions.length}
                        </span>
                      </div>
                    </div>

                    <QuestViewer
                      key={`mock-${mockExamIndex}`}
                      question={mockExamQuestions[mockExamIndex]}
                      index={mockExamIndex}
                      total={mockExamQuestions.length}
                      onNext={() => setMockExamIndex(prev => Math.min(mockExamQuestions.length - 1, prev + 1))}
                      onPrev={() => setMockExamIndex(prev => Math.max(0, prev - 1))}
                      onSelectAnswer={handleSelectAnswerMock}
                      savedAnswer={mockExamAnswers[mockExamQuestions[mockExamIndex].id]}
                      isMockMode={true}
                    />

                    {/* Finish Exam Form trigger */}
                    {Object.keys(mockExamAnswers).length === mockExamQuestions.length && (
                      <div className="bg-white p-4.5 rounded-xl border-3 border-dashed border-black flex flex-col md:flex-row items-center justify-between gap-4 animate-fadeIn shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                        <div className="space-y-1 text-center md:text-left">
                          <p className="text-xs font-black text-[#1d4ed8] uppercase">KANDIDATENBOGEN VOLLSTÄNDIG</p>
                          <p className="text-xs text-slate-700 font-semibold">You selected choices for all 33 questions.</p>
                        </div>
                        <button
                          onClick={handleFinishMockExam}
                          className="px-6 py-3 bg-[#dc2626] hover:bg-rose-700 text-white font-black text-xs tracking-wider border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition-all cursor-pointer uppercase"
                        >
                          SUBMIT AND SCORE EXAM →
                        </button>
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}

            {activeTab === 'guide' && (
              <div className="bg-white rounded-xl p-5 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-5">
                <div className="flex items-center space-x-2 text-[#dc2626] border-b-2 border-black pb-2.5">
                  <GraduationCap className="w-6 h-6 stroke-[2.5px]" />
                  <h2 className="font-black text-sm sm:text-base tracking-tight uppercase"> Leben in Deutschland Exam Guide </h2>
                </div>
                
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-sans font-semibold">
                  The naturalization test of the Federal Office for Migration and Refugees (BAMF) comprises <strong>33 questions</strong> chosen from a catalog of 300 general questions + 10 state-uniques.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-[#fbf9f4] border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] space-y-1">
                    <p className="text-xs font-black text-black">Time Allocation</p>
                    <p className="text-xs text-slate-600 font-medium">60 minutes are allocated in standard settings.</p>
                  </div>
                  <div className="p-3 bg-[#fbf9f4] border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] space-y-1">
                    <p className="text-xs font-black text-[#22c55e]">Passing Threshold</p>
                    <p className="text-xs text-slate-600 font-medium font-semibold">At least 17 correct answers of 33 total questions.</p>
                  </div>
                  <div className="p-3 bg-[#fbf9f4] border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] space-y-1">
                    <p className="text-xs font-black text-[#1d4ed8]">Categories Included</p>
                    <p className="text-xs text-slate-600 font-medium">Living in a Democracy, History, and Duty.</p>
                  </div>
                  <div className="p-3 bg-[#fbf9f4] border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] space-y-1">
                    <p className="text-xs font-black text-[#dc2626]">Certificate Received</p>
                    <p className="text-xs text-slate-600 font-medium font-semibold">BAMF official naturalization certification certificate.</p>
                  </div>
                </div>

                <div className="bg-[#fbbf24] border-2 border-black text-black p-4 rounded-none space-y-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <h4 className="font-black text-xs flex items-center uppercase tracking-wider text-black">
                    <AlertTriangle className="w-4 h-4 mr-1.5 stroke-[2.5]" /> Dual Cognitive Learning Layout
                  </h4>
                  <p className="text-xs leading-relaxed font-semibold">
                    This platform integrates side-by-side or stacked English translation card maps during standard test review to support vocabulary building and bilingual comprehension.
                  </p>
                </div>
              </div>
            )}

        </div>
      </main>
    </div>
  );
}

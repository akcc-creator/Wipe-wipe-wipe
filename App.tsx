
import React, { useState, useCallback, useMemo } from 'react';
import { TOTAL_IMAGES_COUNT, DEFAULT_BRUSH_SIZE, COMPLETION_THRESHOLD, ALL_IMAGES } from './constants';
import { GameState } from './types';
import CleaningCanvas from './components/CleaningCanvas';
import { getRandomImage } from './services/imageService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [currentImgUrl, setCurrentImgUrl] = useState<string | null>(null);
  
  // Track played images to show progress and avoid repeats
  const [playedImages, setPlayedImages] = useState<Set<string>>(new Set());
  
  const [progress, setProgress] = useState(0);
  const [isTherapistMode, setIsTherapistMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false); 
  const [wipesRequired, setWipesRequired] = useState(5); // Default higher for exercise
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const startRandomLevel = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
        // Find an image we haven't played yet
        let pool = ALL_IMAGES.filter(url => !playedImages.has(url));
        
        // If we've played everything, reset the pool (or loop)
        if (pool.length === 0) {
            pool = ALL_IMAGES;
            // Optional: reset history if you want to loop: setPlayedImages(new Set());
        }

        // Pick random from the available pool
        const randomUrl = pool[Math.floor(Math.random() * pool.length)];
        
        // Simulate delay consistent with previous UX
        await new Promise(resolve => setTimeout(resolve, 600));

        setCurrentImgUrl(randomUrl);
        setProgress(0);
        setGameState(GameState.PLAYING);
        
    } catch (e: any) {
        console.error("Image Load Error:", e);
        setErrorMsg("圖片載入失敗，請檢查網路連線。");
    } finally {
        setIsLoading(false);
    }
  };

  const handleNextLevel = () => {
    // If completed, add to played history
    if (gameState === GameState.COMPLETED && currentImgUrl) {
        setPlayedImages(prev => new Set(prev).add(currentImgUrl));
    }
    startRandomLevel();
  };

  const handleSkip = () => {
     // Skip also picks a new one without marking current as 'completed' (optional choice)
     // But to prevent seeing it again immediately, let's mark it as played or just pick next
     startRandomLevel();
  };

  const handleProgress = useCallback((val: number) => {
    setProgress(val);
    if (val >= COMPLETION_THRESHOLD && gameState !== GameState.COMPLETED) {
        setGameState(GameState.COMPLETED);
    }
  }, [gameState]);

  // Calculate stats
  const playedCount = playedImages.size;
  const remainingCount = TOTAL_IMAGES_COUNT - playedCount;

  // Difficulty Labels
  const getDifficultyLabel = (val: number) => {
      if (val <= 4) return "輕鬆 (熱身)";
      if (val <= 8) return "適中 (推薦)";
      if (val <= 12) return "困難 (肌力)";
      return "挑戰 (極限)";
  };

  return (
    <div className="relative w-screen h-screen flex flex-col bg-[#f8fafc]">
      {/* Error Modal */}
      {errorMsg && (
        <div className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center border-4 border-red-100 animate-[bounceIn_0.5s_cubic-bezier(0.175,0.885,0.32,1.275)]">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">網路問題</h3>
                <p className="text-slate-600 mb-8 font-bold">{errorMsg}</p>
                <button 
                    onClick={() => setErrorMsg(null)}
                    className="px-6 py-3 rounded-xl bg-slate-200 text-slate-600 font-bold hover:bg-slate-300 transition-colors"
                >
                    關閉
                </button>
            </div>
        </div>
      )}

      <header className="absolute top-0 left-0 right-0 z-20 p-6 flex justify-between items-start pointer-events-none">
        <div className="bg-white/95 backdrop-blur-md px-10 py-4 rounded-full shadow-2xl pointer-events-auto border border-teal-100 flex items-center gap-4">
          <span className="text-3xl">✨</span>
          <div>
            <h1 className="text-3xl font-black text-teal-800 tracking-tight">抹窗遊世界</h1>
            <p className="text-xs text-teal-600 font-bold tracking-widest uppercase">ZenClean 智能復健</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-4 pointer-events-auto">
          {gameState === GameState.PLAYING && (
            <div className="bg-white/95 backdrop-blur-md p-6 rounded-[2rem] shadow-2xl border-4 border-teal-100 flex flex-col items-center gap-2 transition-all hover:scale-105">
              <span className="text-sm font-black text-slate-400 uppercase tracking-widest">清潔進度</span>
              <div className="flex items-baseline gap-2">
                 <span className="text-6xl font-black text-teal-600 tracking-tighter tabular-nums drop-shadow-sm">
                   {Math.min(100, Math.round((progress / COMPLETION_THRESHOLD) * 100))}
                 </span>
                 <span className="text-3xl font-bold text-teal-400">%</span>
              </div>
              <div className="w-64 h-6 bg-gray-100 rounded-full overflow-hidden shadow-inner mt-2 border border-gray-200">
                  <div 
                    className="h-full bg-gradient-to-r from-teal-400 to-teal-500 transition-all duration-300 ease-out" 
                    style={{ width: `${Math.min(100, (progress / COMPLETION_THRESHOLD) * 100)}%` }}
                  />
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 relative">
        {gameState === GameState.START ? (
          <div className="absolute inset-0 overflow-y-auto bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-8">
            <div className="max-w-4xl w-full text-center space-y-8">
              <div className="space-y-4">
                <h2 className="text-6xl font-black text-slate-800 tracking-tighter drop-shadow-sm">
                   探索世界美景
                </h2>
                <p className="text-2xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
                  每一次擦拭，都是一次新的相遇。<br/>
                  準備好看看窗外是什麼風景了嗎？
                </p>
              </div>

              {/* Stats Card */}
              <div className="inline-flex items-center gap-8 bg-white/60 px-12 py-6 rounded-3xl border border-white/50 shadow-xl backdrop-blur-sm">
                  <div className="text-center">
                      <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">圖庫總數</div>
                      <div className="text-4xl font-black text-slate-700">{TOTAL_IMAGES_COUNT}</div>
                  </div>
                  <div className="w-px h-12 bg-slate-300"></div>
                  <div className="text-center">
                      <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">已探索</div>
                      <div className="text-4xl font-black text-teal-600">{playedCount}</div>
                  </div>
                  <div className="w-px h-12 bg-slate-300"></div>
                   <div className="text-center">
                      <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">未探索</div>
                      <div className="text-4xl font-black text-orange-400">{remainingCount}</div>
                  </div>
              </div>

              {/* Difficulty Settings (Moved to Home Page) */}
              <div className="max-w-lg mx-auto bg-white/70 p-6 rounded-[2rem] shadow-lg border border-teal-50/50 backdrop-blur-md">
                 <div className="flex justify-between items-end mb-4">
                    <div className="text-left">
                        <label className="text-sm font-black text-slate-500 uppercase tracking-widest block mb-1">清潔力度設定</label>
                        <div className="text-lg font-bold text-teal-700">{getDifficultyLabel(wipesRequired)}</div>
                    </div>
                    <span className="text-4xl font-black text-slate-800 tabular-nums">{wipesRequired}<span className="text-xl text-slate-400 ml-1">下</span></span>
                 </div>
                 <input 
                    type="range" 
                    min="3" 
                    max="15" 
                    step="1"
                    value={wipesRequired} 
                    onChange={(e) => setWipesRequired(parseInt(e.target.value))}
                    className="w-full h-4 bg-slate-200 rounded-full appearance-none cursor-pointer accent-teal-600 hover:accent-teal-500 transition-all"
                 />
                 <div className="flex justify-between text-xs font-bold text-slate-400 mt-2 px-1">
                    <span>輕鬆</span>
                    <span>挑戰</span>
                 </div>
              </div>
              
              <div className="pt-4">
                <button 
                    onClick={startRandomLevel}
                    disabled={isLoading}
                    className="group relative inline-flex items-center gap-6 bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-16 py-10 rounded-[3rem] shadow-[0_20px_50px_-12px_rgba(20,184,166,0.5)] hover:scale-105 hover:shadow-[0_30px_60px_-15px_rgba(20,184,166,0.6)] transition-all disabled:opacity-50 disabled:scale-100 active:scale-95 active:shadow-lg border-b-8 border-teal-700 active:border-b-0 active:translate-y-2"
                >
                    {isLoading ? (
                        <>
                            <i className="fas fa-spinner animate-spin text-5xl"></i>
                            <span className="text-4xl font-black tracking-tight">準備中...</span>
                        </>
                    ) : (
                        <>
                            <span className="text-7xl group-hover:rotate-12 transition-transform duration-300">🚀</span>
                            <div className="text-left">
                                <div className="text-4xl font-black tracking-tight">隨機出發</div>
                                <div className="text-xl font-medium opacity-90 mt-1">下一站會是哪裡？</div>
                            </div>
                        </>
                    )}
                </button>
              </div>
              
              {playedCount === TOTAL_IMAGES_COUNT && (
                 <div className="bg-yellow-100 text-yellow-800 px-6 py-3 rounded-full font-bold inline-block animate-pulse">
                    🏆 恭喜！您已看過所有風景！
                 </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <CleaningCanvas
                key={currentImgUrl} // Force remount on URL change
                backgroundImage={currentImgUrl || ''}
                brushSize={DEFAULT_BRUSH_SIZE}
                wipesRequired={wipesRequired}
                onProgress={handleProgress}
                isComplete={gameState === GameState.COMPLETED}
            />
          </>
        )}
      </main>

      {gameState !== GameState.START && (
        <footer className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[60] flex gap-4 w-full max-w-2xl justify-center px-4">
          <button 
            onClick={() => setGameState(GameState.START)}
            disabled={isLoading}
            className="flex-1 bg-white/95 backdrop-blur-md px-6 py-5 rounded-full shadow-2xl hover:bg-white text-slate-800 font-black text-xl md:text-2xl transition-all border-b-4 border-slate-300 active:border-0 active:translate-y-1 flex items-center justify-center gap-3 disabled:opacity-50 min-w-[160px]"
          >
            <i className="fas fa-home text-teal-500"></i> 回首頁
          </button>

          {/* SKIP BUTTON - Visible during play */}
          {gameState === GameState.PLAYING && (
              <button 
                onClick={handleSkip}
                disabled={isLoading}
                className="flex-1 bg-white/95 backdrop-blur-md px-6 py-5 rounded-full shadow-2xl hover:bg-yellow-50 text-slate-700 font-black text-xl md:text-2xl transition-all border-b-4 border-slate-300 active:border-0 active:translate-y-1 flex items-center justify-center gap-3 disabled:opacity-50 min-w-[160px]"
              >
                {isLoading ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-step-forward text-orange-400"></i>}
                換一張
              </button>
          )}
          
          {gameState === GameState.COMPLETED && (
            <button 
              onClick={handleNextLevel}
              disabled={isLoading}
              className="flex-[2] bg-teal-600 px-8 py-5 rounded-full shadow-2xl hover:bg-teal-700 text-white font-black text-xl md:text-2xl transition-all animate-pulse flex items-center justify-center gap-3 disabled:opacity-70 disabled:animate-none min-w-[200px]"
            >
              {isLoading ? (
                  <>
                    <i className="fas fa-spinner animate-spin"></i> 挑選中...
                  </>
              ) : (
                  <>
                    <i className="fas fa-plane"></i>
                    下一張美景
                  </>
              )}
            </button>
          )}
        </footer>
      )}
    </div>
  );
};

export default App;

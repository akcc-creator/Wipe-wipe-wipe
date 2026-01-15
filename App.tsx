
import React, { useState, useEffect, useCallback } from 'react';
import { BACKGROUNDS, DEFAULT_BRUSH_SIZE, COMPLETION_THRESHOLD } from './constants';
import { GameState, BackgroundInfo } from './types';
import CleaningCanvas from './components/CleaningCanvas';
import { generateThemeBackground, generateRandomBackground } from './services/imageService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [currentBg, setCurrentBg] = useState<BackgroundInfo>(BACKGROUNDS[0]);
  const [customBgUrl, setCustomBgUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isTherapistMode, setIsTherapistMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [wipesRequired, setWipesRequired] = useState(4); // Default 4 wipes

  const startLevel = (bg: BackgroundInfo) => {
    setCurrentBg(bg);
    setCustomBgUrl(null);
    setProgress(0);
    setGameState(GameState.PLAYING);
  };

  const handleProgress = useCallback((percent: number) => {
    setProgress(percent);
    if (percent >= COMPLETION_THRESHOLD && gameState !== GameState.COMPLETED) {
      setGameState(GameState.COMPLETED);
    }
  }, [gameState]);

  // Wrapper for generation with error handling
  const handleGeneration = async (genFunction: () => Promise<string | null>, successCallback: (url: string) => void) => {
    setIsGenerating(true);
    try {
        const result = await genFunction();
        if (result) {
            successCallback(result);
        } else {
            alert("生成失敗，可能是網路問題或模型繁忙，請再試一次。");
        }
    } catch (e: any) {
        console.error(e);
        if (e.message && e.message.includes("API Key")) {
            alert(e.message);
        } else {
            alert("發生錯誤：" + (e.message || "未知原因"));
        }
    } finally {
        setIsGenerating(false);
    }
  };

  // Generate specific theme (used for Therapist mode OR continuing a category)
  const generateNewBackground = async (prompt: string) => {
    await handleGeneration(
        () => generateThemeBackground(prompt),
        (url) => {
            setCustomBgUrl(url);
            setProgress(0);
            setGameState(GameState.PLAYING);
        }
    );
  };

  const handleRandomPlay = async () => {
      await handleGeneration(
          () => generateRandomBackground(),
          (url) => {
            setCurrentBg({
                id: 'random',
                url: url,
                label: '神秘世界',
                emoji: '🎲',
                prompt: 'Random generation'
            });
            setCustomBgUrl(url);
            setProgress(0);
            setGameState(GameState.PLAYING);
          }
      );
  };

  const handleNextLevel = () => {
    // Logic: If currently in "Random" mode, generate another random.
    // If in a specific category (e.g., Garden), generate a NEW image for that category.
    if (currentBg.id === 'random') {
        handleRandomPlay();
    } else {
        // Use the prompt from the current category to generate a fresh image
        generateNewBackground(currentBg.prompt);
    }
  };

  return (
    <div className="relative w-screen h-screen flex flex-col bg-[#f8fafc]">
      <header className="absolute top-0 left-0 right-0 z-20 p-6 flex justify-between items-start pointer-events-none">
        <div className="bg-white/95 backdrop-blur-md px-10 py-4 rounded-full shadow-2xl pointer-events-auto border border-teal-100 flex items-center gap-4">
          <span className="text-3xl">✨</span>
          <div>
            <h1 className="text-3xl font-black text-teal-800 tracking-tight">神手去旅行</h1>
            <p className="text-xs text-teal-600 font-bold tracking-widest uppercase">ZenClean AI 復健</p>
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

          <button 
            onClick={() => setIsTherapistMode(!isTherapistMode)}
            className={`px-8 py-3 rounded-full shadow-xl font-black text-lg transition-all border-b-4 ${isTherapistMode ? 'bg-orange-500 text-white border-orange-700 translate-y-1' : 'bg-white/90 text-gray-700 border-gray-200 hover:bg-white'}`}
          >
            <i className="fas fa-cog mr-2"></i>
            設定
          </button>
        </div>
      </header>

      <main className="flex-1 relative">
        {gameState === GameState.START ? (
          <div className="absolute inset-0 overflow-y-auto bg-gradient-to-br from-blue-50 via-white to-teal-50 p-12">
            <div className="max-w-7xl mx-auto text-center space-y-16 py-16">
              <div className="space-y-6">
                <h2 className="text-6xl font-black text-slate-800 tracking-tighter">準備好去哪裡旅行了嗎？</h2>
                <p className="text-3xl text-slate-500 font-medium max-w-3xl mx-auto leading-relaxed">
                  窗外有好美的風景，但被霧擋住了。<br/>
                  請用你的「神之手」，把窗戶擦乾淨吧！
                </p>
                
                {/* Random Generation Button */}
                <button 
                    onClick={handleRandomPlay}
                    disabled={isGenerating}
                    className="group relative inline-flex items-center gap-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-10 py-5 rounded-full shadow-2xl hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
                >
                    {isGenerating ? (
                        <>
                            <i className="fas fa-spinner animate-spin text-3xl"></i>
                            <span className="text-2xl font-black">生成神秘景點中...</span>
                        </>
                    ) : (
                        <>
                            <span className="text-4xl animate-bounce">🌍</span>
                            <div className="text-left">
                                <div className="text-2xl font-black">隨機去旅行</div>
                                <div className="text-sm font-medium opacity-90">任何驚喜地點！城市、美食、大自然...</div>
                            </div>
                        </>
                    )}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-10">
                {BACKGROUNDS.map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => startLevel(bg)}
                    className="group flex flex-col items-center gap-6"
                  >
                    <div className="relative w-full aspect-square rounded-[3rem] overflow-hidden shadow-2xl transition-all duration-300 group-hover:scale-105 group-active:scale-95 bg-white flex items-center justify-center border-8 border-transparent group-hover:border-teal-400 group-hover:shadow-teal-200/50">
                      <span className="text-8xl transform group-hover:scale-125 transition-transform duration-500 grayscale group-hover:grayscale-0">
                        {bg.emoji}
                      </span>
                      {/* Mysterious Overlay */}
                      <div className="absolute inset-0 bg-teal-900/10 group-hover:bg-transparent transition-colors"></div>
                    </div>
                    <span className="text-2xl font-black text-slate-700 tracking-tight group-hover:text-teal-700 transition-colors">{bg.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <CleaningCanvas
            backgroundImage={customBgUrl || currentBg.url}
            brushSize={DEFAULT_BRUSH_SIZE}
            wipesRequired={wipesRequired}
            onProgress={handleProgress}
            isComplete={gameState === GameState.COMPLETED}
          />
        )}
      </main>

      {gameState !== GameState.START && (
        <footer className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[60] flex gap-8">
          <button 
            onClick={() => setGameState(GameState.START)}
            disabled={isGenerating}
            className="bg-white/95 backdrop-blur-md px-12 py-5 rounded-full shadow-2xl hover:bg-white text-slate-800 font-black text-2xl transition-all border-b-4 border-slate-300 active:border-0 active:translate-y-1 flex items-center gap-4 disabled:opacity-50"
          >
            <i className="fas fa-home text-teal-500"></i> 回首頁
          </button>
          
          {gameState === GameState.COMPLETED && (
            <button 
              onClick={handleNextLevel}
              disabled={isGenerating}
              className="bg-teal-600 px-14 py-5 rounded-full shadow-2xl hover:bg-teal-700 text-white font-black text-2xl transition-all animate-pulse flex items-center gap-4 disabled:opacity-70 disabled:animate-none"
            >
              {isGenerating ? (
                  <>
                    <i className="fas fa-spinner animate-spin"></i> 規劃行程中...
                  </>
              ) : (
                  <>
                    {currentBg.id === 'random' ? '去下一個地方' : `再看一張「${currentBg.label}」`} 
                    <i className={`fas ${currentBg.id === 'random' ? 'fa-plane' : 'fa-camera'}`}></i>
                  </>
              )}
            </button>
          )}
        </footer>
      )}

      {isTherapistMode && (
        <div className="absolute top-28 right-8 w-96 bg-white/98 backdrop-blur-2xl rounded-[3rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border border-teal-50 p-10 z-50 overflow-y-auto max-h-[80vh]">
          <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
            <i className="fas fa-sliders-h text-teal-600"></i> 復健設定
          </h3>
          
          <div className="space-y-10">
             <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="text-sm font-black text-slate-500 uppercase tracking-widest">清潔難度 (重覆次數)</label>
                  <span className="text-3xl font-black text-teal-600">{wipesRequired} 下</span>
                </div>
                <input 
                  type="range" 
                  min="3" 
                  max="15" 
                  value={wipesRequired} 
                  onChange={(e) => setWipesRequired(parseInt(e.target.value))}
                  className="w-full h-3 bg-teal-100 rounded-full appearance-none cursor-pointer accent-teal-600"
                />
                <p className="text-xs text-slate-400 font-bold italic leading-relaxed">
                  數值越高，同一區域需要抹擦更多次才能完全看見底圖。建議從 4 下開始。
                </p>
             </div>

             <div className="pt-6 border-t border-slate-100">
              <label className="block text-sm font-black text-slate-500 mb-4 uppercase tracking-widest">AI 即時生成測試</label>
              <div className="grid grid-cols-1 gap-3">
                {BACKGROUNDS.slice(0, 4).map(bg => (
                  <button
                    key={bg.id}
                    disabled={isGenerating}
                    onClick={() => generateNewBackground(bg.prompt)}
                    className="group text-left p-4 rounded-2xl bg-slate-50 hover:bg-teal-50 text-slate-700 font-bold border border-slate-200 flex justify-between items-center transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{bg.emoji}</span>
                      <span>新生成「{bg.label}」</span>
                    </div>
                    {isGenerating ? <i className="fas fa-spinner animate-spin text-teal-500"></i> : <i className="fas fa-wand-sparkles text-teal-300 group-hover:text-teal-500 transition-colors"></i>}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={() => {
                setIsTherapistMode(false);
                startLevel(currentBg);
              }}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-lg hover:bg-black transition-all shadow-xl"
            >
              套用設定並重置
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

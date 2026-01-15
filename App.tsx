
import React, { useState, useCallback } from 'react';
import { BACKGROUNDS, DEFAULT_BRUSH_SIZE, COMPLETION_THRESHOLD } from './constants';
import { GameState, BackgroundInfo } from './types';
import CleaningCanvas from './components/CleaningCanvas';
import { generateThemeBackground, generateRandomBackground, GenerationResult } from './services/imageService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [currentBg, setCurrentBg] = useState<BackgroundInfo>(BACKGROUNDS[0]);
  const [customBgUrl, setCustomBgUrl] = useState<string | null>(null);
  const [imageSource, setImageSource] = useState<'AI' | 'FALLBACK' | 'PRESET'>('PRESET');
  const [progress, setProgress] = useState(0);
  const [isTherapistMode, setIsTherapistMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [wipesRequired, setWipesRequired] = useState(4); 
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Track specific error type for UI actions
  const [isQuotaError, setIsQuotaError] = useState(false);

  // Check if API Key is detected (for UI indication only)
  const hasApiKey = !!process.env.API_KEY;

  const startLevel = (bg: BackgroundInfo) => {
    setCurrentBg(bg);
    setCustomBgUrl(null);
    setImageSource('PRESET');
    setProgress(0);
    setGameState(GameState.PLAYING);
  };

  const handleProgress = useCallback((percent: number) => {
    setProgress(percent);
    if (percent >= COMPLETION_THRESHOLD && gameState !== GameState.COMPLETED) {
      setGameState(GameState.COMPLETED);
    }
  }, [gameState]);

  const handleGeneration = async (
      genFunction: () => Promise<GenerationResult | null>, 
      successCallback: (result: GenerationResult) => void
  ) => {
    setIsGenerating(true);
    setErrorMsg(null);
    setIsQuotaError(false);
    try {
        const result = await genFunction();
        if (result) {
            successCallback(result);
        } else {
            throw new Error("No result returned");
        }
    } catch (e: any) {
        console.error("Generation error:", e);
        
        // Friendly Error Messages
        let friendlyMsg = "AI 連線失敗，請檢查網路。";
        const rawMsg = e.message || "";

        if (rawMsg.includes("API Key")) {
            friendlyMsg = "找不到 API Key。\n請確認 .env 檔案已設定 API_KEY。";
        } else if (rawMsg.includes("429") || rawMsg.includes("Quota") || rawMsg.includes("Too Many Requests")) {
            friendlyMsg = "AI 畫師目前太忙碌 (免費額度用完)。\n建議您先玩「經典景點」模式！";
            setIsQuotaError(true);
        } else if (rawMsg.includes("Server endpoint")) {
            friendlyMsg = "伺服器連線錯誤。\n若是本機執行，請確認 .env 有設定 API_KEY。";
        } else if (rawMsg.includes("Candidate was blocked")) {
            friendlyMsg = "AI 拒絕繪製此主題 (安全過濾)。\n請試試其他主題。";
        }
        
        setErrorMsg(friendlyMsg);
    } finally {
        setIsGenerating(false);
    }
  };

  const generateNewBackground = async (prompt: string) => {
    await handleGeneration(
        () => generateThemeBackground(prompt),
        (result) => {
            setCustomBgUrl(result.url);
            setImageSource(result.source);
            setProgress(0);
            setGameState(GameState.PLAYING);
        }
    );
  };

  const handleRandomPlay = async () => {
      await handleGeneration(
          () => generateRandomBackground(),
          (result) => {
            setCurrentBg({
                id: 'random',
                url: result.url,
                label: '神秘世界',
                emoji: '🎲',
                prompt: 'Random generation'
            });
            setCustomBgUrl(result.url);
            setImageSource(result.source);
            setProgress(0);
            setGameState(GameState.PLAYING);
        }
    );
  };

  const handleNextLevel = () => {
    if (currentBg.id === 'random') {
        handleRandomPlay();
    } else {
        generateNewBackground(currentBg.prompt);
    }
  };

  const switchToPresetMode = () => {
      setErrorMsg(null);
      // Pick a random preset
      const randomPreset = BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)];
      startLevel(randomPreset);
  };

  return (
    <div className="relative w-screen h-screen flex flex-col bg-[#f8fafc]">
      {/* Error Modal */}
      {errorMsg && (
        <div className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center border-4 border-red-100 animate-[bounceIn_0.5s_cubic-bezier(0.175,0.885,0.32,1.275)]">
                <div className="text-6xl mb-4">😵‍💫</div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">哎呀！</h3>
                <p className="text-slate-600 mb-8 font-bold whitespace-pre-line leading-relaxed bg-slate-50 p-4 rounded-xl">
                    {errorMsg}
                </p>
                <div className="flex gap-4 justify-center">
                    <button 
                        onClick={() => setErrorMsg(null)}
                        className="px-6 py-3 rounded-xl bg-slate-200 text-slate-600 font-bold hover:bg-slate-300 transition-colors"
                    >
                        關閉
                    </button>
                    {isQuotaError ? (
                        <button 
                            onClick={switchToPresetMode}
                            className="px-6 py-3 rounded-xl bg-teal-500 text-white font-bold hover:bg-teal-600 transition-colors shadow-lg flex items-center gap-2"
                        >
                            <i className="fas fa-play"></i> 玩內建景點
                        </button>
                    ) : (
                        <button 
                            onClick={() => { setErrorMsg(null); handleRandomPlay(); }}
                            className="px-6 py-3 rounded-xl bg-teal-500 text-white font-bold hover:bg-teal-600 transition-colors shadow-lg flex items-center gap-2"
                        >
                            <i className="fas fa-redo"></i> 再試一次
                        </button>
                    )}
                </div>
            </div>
        </div>
      )}

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
                    className="group relative inline-flex items-center gap-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-12 py-6 rounded-full shadow-2xl hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 active:scale-95"
                >
                    {isGenerating ? (
                        <>
                            <i className="fas fa-spinner animate-spin text-4xl"></i>
                            <div className="text-left">
                                <div className="text-2xl font-black">AI 正在繪製中...</div>
                                <div className="text-sm font-medium opacity-90">請稍候</div>
                            </div>
                        </>
                    ) : (
                        <>
                            <span className="text-5xl animate-bounce">🌍</span>
                            <div className="text-left">
                                <div className="text-3xl font-black">隨機去旅行</div>
                                <div className="text-base font-medium opacity-90">AI 帶你去未知的地方！</div>
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
          <>
            {/* Source Badge */}
            <div className="absolute top-28 left-8 z-30 bg-black/40 backdrop-blur-md text-white px-5 py-2 rounded-full font-bold text-sm border border-white/20 shadow-lg flex items-center gap-2 animate-fade-in">
                {imageSource === 'AI' && <><i className="fas fa-magic text-yellow-300"></i> AI 即時生成</>}
                {imageSource === 'FALLBACK' && <><i className="fas fa-images text-blue-300"></i> 精選圖庫 (備援)</>}
                {imageSource === 'PRESET' && <><i className="fas fa-star text-orange-300"></i> 經典景點</>}
            </div>

            <CleaningCanvas
                backgroundImage={customBgUrl || currentBg.url}
                brushSize={DEFAULT_BRUSH_SIZE}
                wipesRequired={wipesRequired}
                onProgress={handleProgress}
                isComplete={gameState === GameState.COMPLETED}
            />
          </>
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

          <div className="mb-6 p-4 bg-slate-100 rounded-xl flex items-center justify-between">
             <span className="text-sm font-bold text-slate-600">API Key 狀態:</span>
             <span className={`px-3 py-1 rounded-full text-xs font-black ${hasApiKey ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {hasApiKey ? '已連線 OK' : '未偵測 Missing'}
             </span>
          </div>
          
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
                  數值越高，同一區域需要抹擦更多次才能完全看見底圖。
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

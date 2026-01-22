
import React, { useRef, useEffect, useState, useCallback } from 'react';

interface CleaningCanvasProps {
  backgroundImage: string;
  brushSize: number;
  wipesRequired: number;
  onProgress: (percent: number) => void;
  isComplete: boolean;
}

declare const Hands: any;
declare const Camera: any;

// === CONFIGURATION ===
const TRACKING_SMOOTHING = 0.5; 
const MOVEMENT_SENSITIVITY = 1.8; 
const FOG_OPACITY = 0.95; 
const LOST_TRACKING_GRACE_PERIOD = 2000;
// Fallback image in case the intended image fails to load
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1080&q=80';

const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;

// Particle System
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  type: 'foam' | 'water' | 'sparkle';
}

interface TrailPoint {
  x: number;
  y: number;
  age: number;
  size: number;
}

const CleaningCanvas: React.FC<CleaningCanvasProps> = ({
  backgroundImage,
  brushSize,
  wipesRequired,
  onProgress,
  isComplete
}) => {
  // Canvases
  const stainCanvasRef = useRef<HTMLCanvasElement>(null); 
  const cursorCanvasRef = useRef<HTMLCanvasElement>(null); 
  const stainContextRef = useRef<CanvasRenderingContext2D | null>(null);
  
  // State for UI
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isTrackingActive, setIsTrackingActive] = useState(false);
  const [inputType, setInputType] = useState<'camera' | 'mouse'>('camera');
  const [showGuide, setShowGuide] = useState(false);
  
  // Image & Layer State
  const [isImageLoaded, setIsImageLoaded] = useState(false); 
  // NEW: Ensures we don't show the BG until the fog layer is painted
  const [isCanvasReady, setIsCanvasReady] = useState(false); 
  const [activeImageUrl, setActiveImageUrl] = useState<string>(backgroundImage);
  
  // Refs for tracking
  const lastHandDetectionTime = useRef<number>(0);
  const isHandRawDetected = useRef<boolean>(false);
  const targetPosRef = useRef({ x: 0, y: 0 }); 
  const currentPosRef = useRef({ x: 0, y: 0 });
  const lastDrawPosRef = useRef<{x: number, y: number} | null>(null);
  const requestRef = useRef<number>(0);
  
  // Visual Effects Refs
  const particlesRef = useRef<Particle[]>([]);
  const trailRef = useRef<TrailPoint[]>([]); 
  
  const lastProgressCheckTime = useRef<number>(0);

  // --- 0. ROBUST IMAGE LOADING ---
  useEffect(() => {
    setIsImageLoaded(false);
    setIsCanvasReady(false); // Reset canvas ready state on new image
    setActiveImageUrl(backgroundImage);

    const img = new Image();
    img.src = backgroundImage;
    
    img.onload = () => {
      setActiveImageUrl(backgroundImage);
      setIsImageLoaded(true);
    };
    
    img.onerror = () => {
      console.warn(`Failed to load: ${backgroundImage}. Switching to fallback.`);
      const fallbackImg = new Image();
      fallbackImg.src = FALLBACK_IMAGE;
      fallbackImg.onload = () => {
          setActiveImageUrl(FALLBACK_IMAGE);
          setIsImageLoaded(true);
      };
      fallbackImg.onerror = () => {
          setIsImageLoaded(true); 
      }
    };
  }, [backgroundImage]);

  // --- 1. MEDIA PIPE SETUP ---
  useEffect(() => {
    const videoElement = document.getElementById('tracking-video') as HTMLVideoElement;
    if (!videoElement) return;

    let camera: any = null;
    let hands: any = null;

    const startTracking = async () => {
      try {
        if (typeof Hands === 'undefined' || typeof Camera === 'undefined') {
            console.warn("MediaPipe scripts not loaded yet. Mouse fallback active.");
            setIsCameraReady(true);
            return;
        }

        hands = new Hands({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        hands.onResults((results: any) => {
          if (!isCameraReady) setIsCameraReady(true);

          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            isHandRawDetected.current = true;
            lastHandDetectionTime.current = Date.now();
            
            setIsTrackingActive(true); 
            setInputType('camera');
            setShowGuide(false);
            
            const palm = results.multiHandLandmarks[0][9];
            const canvas = stainCanvasRef.current;
            
            if (canvas) {
              let rawX = 1 - palm.x;
              let rawY = palm.y;
              let x = (rawX - 0.5) * MOVEMENT_SENSITIVITY + 0.5;
              let y = (rawY - 0.5) * MOVEMENT_SENSITIVITY + 0.5;
              x = Math.max(0, Math.min(1, x));
              y = Math.max(0, Math.min(1, y));

              targetPosRef.current = { 
                x: x * canvas.width, 
                y: y * canvas.height 
              };
            }
          } else {
            isHandRawDetected.current = false;
          }
        });

        camera = new Camera(videoElement, {
          onFrame: async () => {
            if (hands) await hands.send({ image: videoElement });
            setIsCameraReady(true);
          },
          width: 640,
          height: 480
        });
        
        await camera.start();
      } catch (err) {
        console.error("Camera error:", err);
        setIsCameraReady(true);
      }
    };

    startTracking();

    const checkInterval = setInterval(() => {
        if (isHandRawDetected.current) return; 
        const timeSinceLastHand = Date.now() - lastHandDetectionTime.current;
        if (timeSinceLastHand > LOST_TRACKING_GRACE_PERIOD) {
            setIsTrackingActive(false);
            if (inputType === 'camera') {
                setShowGuide(true);
            }
        }
    }, 500);

    return () => {
      if (camera) camera.stop();
      clearInterval(checkInterval);
    };
  }, []);

  // --- 2. MOUSE FALLBACK ---
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isComplete) {
      if (inputType !== 'mouse') {
          setInputType('mouse');
          setShowGuide(false);
      }
      const canvas = stainCanvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      targetPosRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  // --- 3. PARTICLES & WATER STREAKS ---
  const spawnParticles = (x: number, y: number, amount: number = 1) => {
    if (Math.random() > 0.4) {
      particlesRef.current.push({
        x: x + (Math.random() - 0.5) * brushSize * 0.8,
        y: y + (Math.random() - 0.5) * brushSize * 0.8,
        vx: 0,
        vy: Math.random() * 3 + 2, 
        life: 1.0,
        maxLife: 1.0,
        size: Math.random() * 3 + 2,
        type: 'water'
      });
    }

    for (let i = 0; i < amount; i++) {
        particlesRef.current.push({
          x: x + (Math.random() - 0.5) * brushSize,
          y: y + (Math.random() - 0.5) * brushSize,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5 - 0.2,
          life: 1.0,
          maxLife: 1.0,
          size: Math.random() * 10 + 2,
          type: 'foam'
        });
    }

    if (Math.random() > 0.9) {
        particlesRef.current.push({
          x: x + (Math.random() - 0.5) * brushSize * 0.5,
          y: y + (Math.random() - 0.5) * brushSize * 0.5,
          vx: 0,
          vy: 0,
          life: 0.8,
          maxLife: 0.8,
          size: Math.random() * 6 + 3,
          type: 'sparkle'
        });
    }
  };

  const updateAndDrawParticles = (ctx: CanvasRenderingContext2D) => {
    for (let i = trailRef.current.length - 1; i >= 0; i--) {
        const t = trailRef.current[i];
        t.age -= 0.03; 
        if (t.age <= 0) {
            trailRef.current.splice(i, 1);
        } else {
            ctx.beginPath();
            const grad = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, t.size);
            grad.addColorStop(0, `rgba(255, 255, 255, ${t.age * 0.15})`);
            grad.addColorStop(0.5, `rgba(200, 230, 255, ${t.age * 0.05})`);
            grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = grad;
            ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.x += p.vx;
      p.y += p.vy;
      
      if (p.type === 'foam') {
        p.life -= 0.02; 
        p.size *= 0.98;
      } else if (p.type === 'water') {
        p.life -= 0.015;
        p.vy *= 1.05; 
      } else if (p.type === 'sparkle') {
        p.life -= 0.05;
      }

      if (p.life <= 0 || p.y > ctx.canvas.height) {
        particlesRef.current.splice(i, 1);
      } else {
        ctx.beginPath();
        const opacity = p.life / p.maxLife;
        
        if (p.type === 'foam') {
            ctx.fillStyle = `rgba(240, 250, 255, ${opacity * 0.4})`;
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        } else if (p.type === 'water') {
            ctx.fillStyle = `rgba(200, 230, 255, ${opacity * 0.6})`;
            ctx.ellipse(p.x, p.y, p.size * 0.6, p.size, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (p.type === 'sparkle') {
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.font = `${p.size * 2}px Arial`;
            ctx.fillText('✨', p.x, p.y);
        }
      }
    }
  };

  // --- 4. ANIMATION LOOP ---
  const animate = useCallback(() => {
    const cursorCanvas = cursorCanvasRef.current;
    if (!cursorCanvas) return;

    const target = targetPosRef.current;
    const current = currentPosRef.current;
    
    current.x = lerp(current.x, target.x, TRACKING_SMOOTHING);
    current.y = lerp(current.y, target.y, TRACKING_SMOOTHING);

    const ctx = cursorCanvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
      
      // Only draw particles if image is loaded and canvas is ready (fog painted)
      if (!isComplete && isImageLoaded && isCanvasReady) {
        updateAndDrawParticles(ctx);
      }

      const isInteracting = (isTrackingActive || inputType === 'mouse') && !isComplete && isCameraReady && isImageLoaded && isCanvasReady;

      if (isInteracting) {
        const x = current.x;
        const y = current.y;

        const grad = ctx.createRadialGradient(x, y, 0, x, y, brushSize / 1.5);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, brushSize / 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 15;
        ctx.font = `${brushSize * 0.6}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🖐️', x, y);
        ctx.shadowBlur = 0;

        handleWipe(current.x, current.y);
        
        if (Math.random() > 0.5) {
            trailRef.current.push({
                x: x,
                y: y,
                age: 1.0,
                size: brushSize / 2
            });
        }

        const dist = lastDrawPosRef.current ? Math.hypot(x - lastDrawPosRef.current.x, y - lastDrawPosRef.current.y) : 10;
        if (dist > 5) {
            spawnParticles(current.x, current.y, Math.min(3, dist / 10));
        }
      }
    }

    requestRef.current = requestAnimationFrame(animate);
  }, [isTrackingActive, inputType, isComplete, brushSize, isCameraReady, isImageLoaded, isCanvasReady]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [animate]);

  // --- 5. STAIN LAYER (NOISE & FOG) ---
  useEffect(() => {
    // Only initialize stain layer AFTER image is loaded
    if (!isImageLoaded) return;

    const canvas = stainCanvasRef.current;
    const cCanvas = cursorCanvasRef.current;
    if (!canvas || !cCanvas) return;

    const initStainLayer = () => {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      stainContextRef.current = ctx;
      ctx.globalCompositeOperation = 'source-over';
      
      // Clear previous
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Fill Fog
      ctx.fillStyle = `rgba(235, 240, 245, ${FOG_OPACITY})`; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
          const noise = (Math.random() - 0.5) * 30;
          data[i] = Math.min(255, Math.max(0, data[i] + noise));
          data[i+1] = Math.min(255, Math.max(0, data[i+1] + noise));
          data[i+2] = Math.min(255, Math.max(0, data[i+2] + noise));
          if (Math.random() > 0.98) {
             data[i+3] = Math.min(255, data[i+3] - 50); 
          }
      }
      ctx.putImageData(imageData, 0, 0);

      // Water drops
      for(let i = 0; i < 400; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const r = Math.random() * 3 + 1;
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // CRITICAL: Only after painting the fog do we reveal the container
      setIsCanvasReady(true);
    };

    const parent = canvas.parentElement;
    if (!parent) return;

    const setSize = () => {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        cCanvas.width = parent.clientWidth;
        cCanvas.height = parent.clientHeight;
        initStainLayer();
    };

    setSize();
    const observer = new ResizeObserver(setSize);
    observer.observe(parent);

    return () => observer.disconnect();
  }, [activeImageUrl, isImageLoaded]); 

  const calculateProgress = useCallback(() => {
    const ctx = stainContextRef.current;
    const canvas = stainCanvasRef.current;
    if (!ctx || !canvas) return;

    const stride = 25; 
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let totalTransparent = 0;

    for (let i = 3; i < pixels.length; i += 4 * stride) {
      if (pixels[i] < 40) totalTransparent++;
    }

    const totalPixels = (canvas.width * canvas.height) / stride;
    const percent = (totalTransparent / totalPixels) * 100;

    if (percent >= 98) {
        onProgress(100);
    } else {
        onProgress(percent);
    }
  }, [onProgress]);

  const handleWipe = (x: number, y: number) => {
    const ctx = stainContextRef.current;
    if (!ctx) return;

    ctx.globalCompositeOperation = 'destination-out';
    const hardness = 1 / Math.max(1, wipesRequired); 
    const rad = brushSize / 2;
    const gradient = ctx.createRadialGradient(x, y, rad * 0.3, x, y, rad);
    gradient.addColorStop(0, `rgba(0, 0, 0, ${hardness})`);
    gradient.addColorStop(0.6, `rgba(0, 0, 0, ${hardness * 0.5})`);
    gradient.addColorStop(1, `rgba(0, 0, 0, 0)`);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
    
    if (lastDrawPosRef.current) {
        const dist = Math.hypot(x - lastDrawPosRef.current.x, y - lastDrawPosRef.current.y);
        const steps = Math.ceil(dist / (rad * 0.2));
        
        if (steps > 0) {
            for (let i = 1; i <= steps; i++) {
                 const t = i / steps;
                 const ix = lastDrawPosRef.current.x + (x - lastDrawPosRef.current.x) * t;
                 const iy = lastDrawPosRef.current.y + (y - lastDrawPosRef.current.y) * t;
                 
                 const g2 = ctx.createRadialGradient(ix, iy, rad * 0.3, ix, iy, rad);
                 g2.addColorStop(0, `rgba(0, 0, 0, ${hardness})`);
                 g2.addColorStop(0.6, `rgba(0, 0, 0, ${hardness * 0.5})`);
                 g2.addColorStop(1, `rgba(0, 0, 0, 0)`);
                 ctx.fillStyle = g2;
                 ctx.beginPath();
                 ctx.arc(ix, iy, rad, 0, Math.PI * 2);
                 ctx.fill();
            }
        }
    }
    
    lastDrawPosRef.current = { x, y };
    
    const now = Date.now();
    if (now - lastProgressCheckTime.current > 150) {
        calculateProgress();
        lastProgressCheckTime.current = now;
    }
  };

  // Determine if we should show the content
  // Content is visible ONLY when image is loaded AND fog is painted
  const isContentVisible = isImageLoaded && isCanvasReady;

  return (
    <div 
      className="relative w-full h-full overflow-hidden select-none bg-gray-50"
      onPointerMove={handlePointerMove}
    >
      {/* 
         WRAPPER for Image + Canvas
         Controlled by opacity. Opacity 0 until fog is fully painted.
         This prevents the "flash" of the underlying image.
      */}
      <div 
        className={`absolute inset-0 transition-opacity duration-700 ease-in bg-cover bg-center ${isContentVisible ? 'opacity-100' : 'opacity-0'} ${!isComplete ? 'cursor-none' : ''}`}
        style={{ backgroundImage: `url(${activeImageUrl})` }} 
      >
        <canvas ref={stainCanvasRef} className="absolute top-0 left-0 w-full h-full z-10" />
        <canvas ref={cursorCanvasRef} className="absolute top-0 left-0 w-full h-full z-20 pointer-events-none" />
      </div>

      {/* Completion Flash */}
      {isComplete && (
        <div className="absolute inset-0 z-40 pointer-events-none animate-[flash_1s_ease-out_forwards] border-[20px] border-white/80 shadow-[inset_0_0_100px_rgba(255,255,255,0.8)]">
            <style>{`
                @keyframes flash {
                    0% { background-color: rgba(255, 255, 255, 0.9); opacity: 1; }
                    50% { background-color: rgba(255, 255, 255, 0.4); opacity: 1; }
                    100% { background-color: transparent; opacity: 0; }
                }
            `}</style>
        </div>
      )}

      {/* --- LOADING SPINNER --- */}
      {/* Shown when content is NOT visible yet (downloading or painting fog) */}
      {!isContentVisible && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-[60]">
             <div className="w-16 h-16 border-8 border-slate-200 border-t-teal-500 rounded-full animate-spin mb-4"></div>
             <p className="text-xl font-bold text-slate-500 animate-pulse">風景下載中...</p>
          </div>
      )}

      {/* Camera Loading (Shown on top of foggy layer) */}
      {isContentVisible && !isCameraReady && !isComplete && (
         <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 z-50 backdrop-blur-sm">
            <div className="bg-white p-8 rounded-3xl flex flex-col items-center gap-4 shadow-2xl animate-bounce-small">
                 <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                 <p className="text-xl font-black text-slate-700">攝影機啟動中...</p>
                 <p className="text-sm text-slate-500">請稍候片刻</p>
            </div>
         </div>
      )}

      {/* Ghost Hand Guide */}
      {isContentVisible && isCameraReady && !isTrackingActive && inputType === 'camera' && !isComplete && showGuide && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-fade-in">
          <div className="flex flex-col items-center">
             <div className="relative w-32 h-32 mb-6 opacity-80 animate-[wave_2s_infinite_ease-in-out]">
                <svg viewBox="0 0 24 24" fill="white" className="w-full h-full drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                    <path d="M21,11C21,16.55 17.16,21.74 12,22C6.84,21.74 3,16.55 3,11V5C3,4.45 3.45,4 4,4H5C5.55,4 6,4.45 6,5V11H7V3C7,2.45 7.45,2 8,2H9C9.55,2 10,2.45 10,3V11H11V3C11,2.45 11.45,2 12,2H13C13.55,2 14,2.45 14,3V11H15V4C15,3.45 15.45,3 16,3H17C17.55,3 18,3.45 18,4V11H19V5C19,4.45 19.45,4 20,4H21C21.55,4 22,4.45 22,5V11H21Z" />
                </svg>
                <div className="absolute inset-0 border-2 border-teal-300 rounded-xl animate-[ping_2s_infinite] opacity-50"></div>
             </div>
             
             <div className="bg-slate-900/60 backdrop-blur-md px-8 py-4 rounded-full text-white flex flex-col items-center border border-white/20">
                <p className="text-2xl font-bold mb-1">請揮揮手 👋</p>
                <p className="text-sm opacity-90">將手掌放入鏡頭範圍內</p>
             </div>
          </div>
          <style>{`
             @keyframes wave {
                0%, 100% { transform: translateX(-10px) rotate(-10deg); }
                50% { transform: translateX(10px) rotate(10deg); }
             }
          `}</style>
        </div>
      )}

      {isComplete && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/20 backdrop-blur-md transition-opacity duration-1000 z-50">
          <div className="bg-white/95 p-12 rounded-[3rem] shadow-2xl flex flex-col items-center border-4 border-teal-500 transform scale-110 animate-pop-in">
             <div className="text-8xl mb-4 animate-bounce">✨</div>
             <h2 className="text-4xl font-black text-teal-900 tracking-tight mb-2">窗戶擦乾淨了！</h2>
             <p className="text-xl text-teal-700 font-medium">風景真美</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CleaningCanvas;

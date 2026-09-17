import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { MoroccoLocation, MovementMode, PanoLink } from '../types/game';
import { TRANSLATIONS, Language } from '../utils/i18n';
import { 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Compass, 
  Maximize2, 
  Minimize2, 
  ArrowUp,
  MapPin,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface PanoViewerProps {
  location: MoroccoLocation;
  currentAssetUrl: string;
  currentSceneId: string;
  movementMode: MovementMode;
  lang: Language;
  onNavigateToScene?: (link: PanoLink) => void;
  onReturnToSpawn?: () => void;
  isAtSpawn?: boolean;
}

export const PanoViewer: React.FC<PanoViewerProps> = ({
  location,
  currentAssetUrl,
  currentSceneId,
  movementMode,
  lang,
  onNavigateToScene,
  onReturnToSpawn,
  isAtSpawn = true
}) => {
  const t = TRANSLATIONS[lang];
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [headingDeg, setHeadingDeg] = useState(location.heading || 0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Three.js instances ref
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    isUserInteracting: boolean;
    onMouseDownMouseX: number;
    onMouseDownMouseY: number;
    lon: number;
    lat: number;
    onMouseDownLon: number;
    onMouseDownLat: number;
    phi: number;
    theta: number;
    targetFov: number;
    activeTexture: THREE.CubeTexture | null;
    animFrameId: number | null;
  } | null>(null);

  // Initialize Three.js
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 1, 1100);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.replaceChildren(renderer.domElement);

    const state = {
      scene,
      camera,
      renderer,
      isUserInteracting: false,
      onMouseDownMouseX: 0,
      onMouseDownMouseY: 0,
      lon: location.heading || 0,
      lat: 0,
      onMouseDownLon: 0,
      onMouseDownLat: 0,
      phi: 0,
      theta: 0,
      targetFov: 75,
      activeTexture: null as THREE.CubeTexture | null,
      animFrameId: null as number | null
    };
    threeRef.current = state;

    const onPointerDown = (event: PointerEvent) => {
      if (movementMode === 'nmpz') return;
      state.isUserInteracting = true;
      state.onMouseDownMouseX = event.clientX;
      state.onMouseDownMouseY = event.clientY;
      state.onMouseDownLon = state.lon;
      state.onMouseDownLat = state.lat;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!state.isUserInteracting || movementMode === 'nmpz') return;
      const factor = state.camera.fov / 75; // Slower drag when zoomed in
      state.lon = (state.onMouseDownMouseX - event.clientX) * 0.18 * factor + state.onMouseDownLon;
      state.lat = (event.clientY - state.onMouseDownMouseY) * 0.18 * factor + state.onMouseDownLat;
    };

    const onPointerUp = () => {
      state.isUserInteracting = false;
    };

    const onWheel = (event: WheelEvent) => {
      if (movementMode === 'nmpz') return;
      event.preventDefault();
      state.targetFov = Math.max(35, Math.min(100, state.targetFov + event.deltaY * 0.05));
    };

    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    // Handle window resize
    const handleResize = () => {
      if (!container || !threeRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation render loop
    let lastHeadingUpdate = 0;
    const animate = (time: number) => {
      state.animFrameId = requestAnimationFrame(animate);

      // Smooth zoom interpolation
      camera.fov += (state.targetFov - camera.fov) * 0.15;
      camera.updateProjectionMatrix();

      // Clamp latitude to avoid gimbal flip
      state.lat = Math.max(-85, Math.min(85, state.lat));
      state.phi = THREE.MathUtils.degToRad(90 - state.lat);
      state.theta = THREE.MathUtils.degToRad(state.lon);

      const targetX = 500 * Math.sin(state.phi) * Math.cos(state.theta);
      const targetY = 500 * Math.cos(state.phi);
      const targetZ = 500 * Math.sin(state.phi) * Math.sin(state.theta);
      camera.lookAt(targetX, targetY, targetZ);

      // Throttled heading degree state update for HUD compass
      if (time - lastHeadingUpdate > 100) {
        const normalized = ((state.lon % 360) + 360) % 360;
        setHeadingDeg(Math.round(normalized));
        lastHeadingUpdate = time;
      }

      renderer.render(scene, camera);
    };
    state.animFrameId = requestAnimationFrame(animate);

    return () => {
      if (state.animFrameId) cancelAnimationFrame(state.animFrameId);
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (state.activeTexture) state.activeTexture.dispose();
      threeRef.current = null;
    };
  }, [movementMode, location.heading]);

  // Load cubemap textures whenever currentAssetUrl changes
  useEffect(() => {
    const state = threeRef.current;
    if (!state) return;

    setIsLoading(true);
    setLoadError(false);

    // carte.ma cubemap convention for Three.js CubeTextureLoader:
    // [px, nx, py, ny, pz, nz]
    // px: right, nx: left, py: up, ny: down, pz: front, nz: back
    const urls = [
      `${currentAssetUrl}mobile_r.jpg`,
      `${currentAssetUrl}mobile_l.jpg`,
      `${currentAssetUrl}mobile_u.jpg`,
      `${currentAssetUrl}mobile_d.jpg`,
      `${currentAssetUrl}mobile_f.jpg`,
      `${currentAssetUrl}mobile_b.jpg`
    ];

    const loader = new THREE.CubeTextureLoader();
    loader.setCrossOrigin('anonymous');

    loader.load(
      urls,
      (cubeTexture) => {
        cubeTexture.colorSpace = THREE.SRGBColorSpace;
        if (state.activeTexture) {
          state.activeTexture.dispose();
        }
        state.activeTexture = cubeTexture;
        state.scene.background = cubeTexture;
        setIsLoading(false);
      },
      undefined,
      (err) => {
        console.warn('Error loading cubemap texture from carte.ma:', err);
        setLoadError(true);
        setIsLoading(false);
      }
    );
  }, [currentAssetUrl]);

  // Controls helpers
  const handleRotate = useCallback((delta: number) => {
    if (threeRef.current && movementMode !== 'nmpz') {
      threeRef.current.lon += delta;
    }
  }, [movementMode]);

  const handleZoom = useCallback((inOut: 'in' | 'out') => {
    if (threeRef.current && movementMode !== 'nmpz') {
      const delta = inOut === 'in' ? -15 : 15;
      threeRef.current.targetFov = Math.max(35, Math.min(100, threeRef.current.targetFov + delta));
    }
  }, [movementMode]);

  const handleResetView = useCallback(() => {
    if (threeRef.current && movementMode !== 'nmpz') {
      threeRef.current.lon = location.heading || 0;
      threeRef.current.lat = 0;
      threeRef.current.targetFov = 75;
    }
  }, [location.heading, movementMode]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Calculate relative angle for navigation links
  const availableLinks = movementMode === 'move' ? (location.links || []) : [];

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950 select-none">
      {/* Three.js Canvas Container */}
      <div 
        ref={containerRef} 
        id="pano-stage" 
        className={`w-full h-full cursor-grab active:cursor-grabbing ${movementMode === 'nmpz' ? '!cursor-default' : ''}`}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md text-white transition-opacity duration-300">
          <div className="relative w-16 h-16 flex items-center justify-center">
            {/* Moroccan 8-pointed star spinner */}
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
            <div className="w-8 h-8 rounded bg-red-600/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
              🇲🇦
            </div>
          </div>
          <p className="mt-4 text-sm font-medium text-slate-200 animate-pulse text-center px-4">
            {t.loadingPanorama}
          </p>
          <span className="mt-1 text-xs text-slate-400">
            carte.ma 360° • {location.cityNameAr} ({location.cityNameEn})
          </span>
        </div>
      )}

      {/* Error Fallback */}
      {loadError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/90 text-white p-6 text-center">
          <MapPin className="w-12 h-12 text-amber-500 mb-3" />
          <h3 className="text-lg font-bold mb-1">{t.loadingFailed}</h3>
          <p className="text-sm text-slate-400 mb-4">{location.roadEn} — {location.cityNameEn}</p>
          {onReturnToSpawn && (
            <button 
              id="return-spawn-error-btn"
              onClick={onReturnToSpawn}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-sm transition"
            >
              {t.returnToSpawn}
            </button>
          )}
        </div>
      )}

      {/* Street Movement Hotspots / Direction Arrows (GeoGuessr Style) */}
      {!isLoading && movementMode === 'move' && availableLinks.length > 0 && (
        <div className="absolute inset-x-0 bottom-8 z-10 flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-3 bg-[#0e121d]/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-zinc-700/80 shadow-2xl pointer-events-auto">
            {availableLinks.map((link, idx) => {
              return (
                <button
                  key={`${link.targetSceneId}_${idx}`}
                  id={`walk-btn-${idx}`}
                  onClick={() => onNavigateToScene && onNavigateToScene(link)}
                  className="group flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#181e2c] hover:bg-emerald-600 text-zinc-100 transition duration-150 border border-zinc-700 hover:border-emerald-400 shadow-md active:scale-95"
                  title={`${link.road || t.walkHere} (${link.distanceM}m)`}
                >
                  <ArrowUp 
                    className="w-4 h-4 text-emerald-400 group-hover:text-white transition-transform" 
                    style={{ transform: `rotate(${link.bearing - headingDeg}deg)` }}
                  />
                  <span className="text-xs font-semibold whitespace-nowrap">
                    {t.walkHere} {link.distanceM > 0 && <span className="opacity-70 text-[10px]">({link.distanceM}m)</span>}
                  </span>
                </button>
              );
            })}

            {!isAtSpawn && onReturnToSpawn && (
              <button
                id="reset-spawn-btn"
                onClick={onReturnToSpawn}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/40 transition text-xs font-semibold shadow-md active:scale-95"
                title={t.returnToSpawn}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="whitespace-nowrap">{t.returnToSpawn}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Floating HUD Controls (Top Left / Right) */}
      <div className={`absolute top-4 ${lang === 'ar' ? 'left-4' : 'right-4'} z-10 flex flex-col gap-2`}>
        {/* Compass Dial */}
        <button
          id="compass-hud-btn"
          onClick={handleResetView}
          className="w-11 h-11 rounded-full bg-[#0e121d]/90 backdrop-blur-md border border-zinc-700/80 hover:border-amber-500/60 text-white flex items-center justify-center shadow-xl transition active:scale-95 relative group"
          title={t.returnToSpawn}
        >
          <div 
            className="w-7 h-7 flex items-center justify-center transition-transform duration-100"
            style={{ transform: `rotate(${-headingDeg}deg)` }}
          >
            <Compass className="w-6 h-6 text-rose-500" />
          </div>
          <span className="absolute -bottom-5 text-[10px] font-bold text-amber-400 bg-[#0a0d14]/90 px-1 rounded border border-zinc-800 font-mono">
            {headingDeg}°
          </span>
        </button>

        {movementMode !== 'nmpz' && (
          <div className="flex flex-col rounded-xl bg-[#0e121d]/90 backdrop-blur-md p-1 gap-1 border border-zinc-700/80 shadow-xl mt-4">
            <button
              id="zoom-in-hud"
              onClick={() => handleZoom('in')}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-amber-400 transition active:scale-90"
              title={t.zoomIn}
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              id="zoom-out-hud"
              onClick={() => handleZoom('out')}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-amber-400 transition active:scale-90"
              title={t.zoomOut}
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <div className="h-px bg-zinc-800 my-0.5" />
            <button
              id="pan-left-hud"
              onClick={() => handleRotate(lang === 'ar' ? 25 : -25)}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-amber-400 transition active:scale-90"
              title={t.rotateLeft}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              id="pan-right-hud"
              onClick={() => handleRotate(lang === 'ar' ? -25 : 25)}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-amber-400 transition active:scale-90"
              title={t.rotateRight}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="h-px bg-zinc-800 my-0.5" />
            <button
              id="fullscreen-hud"
              onClick={toggleFullscreen}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-amber-400 transition active:scale-90"
              title={isFullscreen ? t.exitFullscreen : t.fullscreen}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>

      {/* Watermark / Attribution badge (bottom left in LTR, bottom right in RTL) */}
      <div className={`absolute top-4 ${lang === 'ar' ? 'right-4' : 'left-4'} z-10 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0e121d]/90 backdrop-blur-md text-xs text-zinc-300 pointer-events-none border border-zinc-800 shadow-xl`}>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span className="font-bold text-white">carte.ma 360°</span>
        <span className="text-zinc-600">|</span>
        <span className="text-zinc-400">Morocco Panoramas</span>
      </div>
    </div>
  );
};

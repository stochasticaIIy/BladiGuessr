import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  GameSettings, 
  MoroccoLocation, 
  RoundResult, 
  PanoLink 
} from './types/game';
import { MOROCCO_LOCATIONS } from './data/locations';
import { MOROCCO_CITIES } from './data/cities';
import { TRANSLATIONS, Language } from './utils/i18n';
import { 
  calculateDistanceKm, 
  calculatePoints, 
  soundManager 
} from './utils/gameLogic';
import { PanoViewer } from './components/PanoViewer';
import { GuessMap } from './components/GuessMap';
import { RoundResultView } from './components/RoundResultView';
import { GameSummaryView } from './components/GameSummaryView';
import { MainMenuView } from './components/MainMenuView';
import { 
  LogOut, 
  Timer as TimerIcon, 
  Award, 
  Compass, 
  Languages, 
  Volume2, 
  VolumeX, 
  Moon, 
  Sun 
} from 'lucide-react';

const TOTAL_ROUNDS = 5;

export default function App() {
  // Load saved preferences
  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem('bladiguessr_settings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      language: 'ar', // Arabic is the default view
      theme: 'dark',   // Dark mode
      cityFilter: 'all',
      movementMode: 'move',
      timeLimitSec: null,
      soundEnabled: true
    };
  });

  const [highScore, setHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('bladiguessr_highscore');
      if (saved) return Number(saved) || 0;
    } catch {}
    return 0;
  });

  // Game lifecycle
  const [gameStatus, setGameStatus] = useState<'menu' | 'playing' | 'round_result' | 'game_summary'>('menu');
  const [roundQueue, setRoundQueue] = useState<MoroccoLocation[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [currentAssetUrl, setCurrentAssetUrl] = useState<string>('');
  const [currentSceneId, setCurrentSceneId] = useState<string>('');
  const [selectedGuess, setSelectedGuess] = useState<{ lat: number; lng: number } | null>(null);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  const lang = settings.language;
  const t = TRANSLATIONS[lang];

  // Sync settings with localStorage and HTML root dir/lang
  useEffect(() => {
    localStorage.setItem('bladiguessr_settings', JSON.stringify(settings));
    document.documentElement.lang = settings.language;
    document.documentElement.dir = settings.language === 'ar' ? 'rtl' : 'ltr';
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  // Current active location for the round
  const currentLocation = roundQueue[currentRoundIndex] || MOROCCO_LOCATIONS[0];

  // Start new 5-round game
  const handleStartGame = useCallback(() => {
    if (settings.soundEnabled) soundManager.playClick();

    // Filter locations based on city filter
    let pool = [...MOROCCO_LOCATIONS];
    if (settings.cityFilter !== 'all') {
      pool = pool.filter((loc) => loc.cityId === settings.cityFilter);
    }

    // Shuffle and pick 5 distinct locations
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, TOTAL_ROUNDS);

    // If for some reason less than 5, repeat or fill
    while (selected.length < TOTAL_ROUNDS) {
      selected.push(MOROCCO_LOCATIONS[Math.floor(Math.random() * MOROCCO_LOCATIONS.length)]);
    }

    setRoundQueue(selected);
    setCurrentRoundIndex(0);
    setCurrentAssetUrl(selected[0].assetBaseUrl);
    setCurrentSceneId(selected[0].sceneId);
    setSelectedGuess(null);
    setRoundResults([]);
    setTotalScore(0);
    setTimeRemaining(settings.timeLimitSec);
    setGameStatus('playing');
  }, [settings]);

  // Timer countdown
  useEffect(() => {
    if (gameStatus !== 'playing' || timeRemaining === null) return;

    if (timeRemaining <= 0) {
      // Time is up! Auto submit guess
      handleSubmitGuess();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        if (prev <= 10 && settings.soundEnabled) {
          soundManager.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStatus, timeRemaining, settings.soundEnabled]);

  // Handle Walking to adjacent scene (in 'move' mode)
  const handleNavigateToScene = useCallback((link: PanoLink) => {
    if (settings.movementMode !== 'move') return;
    if (settings.soundEnabled) soundManager.playClick();
    setCurrentAssetUrl(link.targetAssetUrl);
    setCurrentSceneId(link.targetSceneId);
  }, [settings.movementMode, settings.soundEnabled]);

  // Return to original spawn
  const handleReturnToSpawn = useCallback(() => {
    if (settings.soundEnabled) soundManager.playClick();
    setCurrentAssetUrl(currentLocation.assetBaseUrl);
    setCurrentSceneId(currentLocation.sceneId);
  }, [currentLocation, settings.soundEnabled]);

  // Submit Player Guess
  const handleSubmitGuess = useCallback(() => {
    if (gameStatus !== 'playing') return;

    if (settings.soundEnabled) soundManager.playGuessSubmitted();

    const loc = currentLocation;
    let distKm = 9999;
    let points = 0;

    if (selectedGuess) {
      distKm = calculateDistanceKm(
        selectedGuess.lat,
        selectedGuess.lng,
        loc.lat,
        loc.lng
      );
      points = calculatePoints(distKm, settings.cityFilter !== 'all');
    }

    const timeSpent = settings.timeLimitSec !== null && timeRemaining !== null
      ? settings.timeLimitSec - timeRemaining
      : 0;

    const result: RoundResult = {
      roundNumber: currentRoundIndex + 1,
      location: loc,
      guess: selectedGuess,
      distanceKm: distKm,
      points,
      timeTakenSec: timeSpent
    };

    const newScore = totalScore + points;
    setTotalScore(newScore);
    setRoundResults((prev) => [...prev, result]);
    setGameStatus('round_result');
  }, [gameStatus, currentLocation, selectedGuess, settings, totalScore, currentRoundIndex, timeRemaining]);

  // Next Round Handler
  const handleNextRound = useCallback(() => {
    if (settings.soundEnabled) soundManager.playClick();

    if (currentRoundIndex + 1 >= TOTAL_ROUNDS) {
      // Game completed
      if (totalScore > highScore) {
        setHighScore(totalScore);
        try {
          localStorage.setItem('bladiguessr_highscore', String(totalScore));
        } catch {}
      }
      setGameStatus('game_summary');
    } else {
      // Advance to next round
      const nextIdx = currentRoundIndex + 1;
      const nextLoc = roundQueue[nextIdx];
      setCurrentRoundIndex(nextIdx);
      setCurrentAssetUrl(nextLoc.assetBaseUrl);
      setCurrentSceneId(nextLoc.sceneId);
      setSelectedGuess(null);
      setTimeRemaining(settings.timeLimitSec);
      setGameStatus('playing');
    }
  }, [currentRoundIndex, totalScore, highScore, roundQueue, settings]);

  const handleUpdateSettings = (newVals: Partial<GameSettings>) => {
    setSettings((prev) => ({ ...prev, ...newVals }));
  };

  const handleExitToMenu = () => {
    if (gameStatus === 'playing') {
      const confirmExit = window.confirm(
        lang === 'ar'
          ? 'هل أنت متأكد من العودة للقائمة الرئيسية؟ ستفقد تقدمك في هذه اللعبة.'
          : 'Are you sure you want to exit to the menu? Your game progress will be lost.'
      );
      if (!confirmExit) return;
    }
    setGameStatus('menu');
  };

  // Find city metadata for initial map center
  const currentCityMeta = MOROCCO_CITIES.find((c) => c.id === settings.cityFilter) || MOROCCO_CITIES[0];

  return (
    <main 
      id="bladiguessr-root" 
      className="relative w-screen h-screen overflow-hidden bg-[#0c0f17] font-sans text-zinc-100 flex flex-col"
    >
      {/* 1. Main Menu View */}
      {gameStatus === 'menu' && (
        <MainMenuView
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onStartGame={handleStartGame}
          highScore={highScore}
        />
      )}

      {/* 2. Playing View */}
      {gameStatus === 'playing' && (
        <div className="relative w-full h-full flex flex-col overflow-hidden">
          {/* Top In-Game Header HUD */}
          <header className="absolute top-3 inset-x-3 z-30 flex items-center justify-between pointer-events-none">
            {/* Left Box: Logo & City */}
            <div className="flex items-center gap-2 bg-[#0e121d]/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-zinc-800/90 shadow-xl pointer-events-auto">
              <span className="text-base">🇲🇦</span>
              <span className="font-black text-sm text-white hidden sm:inline tracking-tight">
                BladiGuessr
              </span>
              <span className="text-zinc-600 hidden sm:inline">•</span>
              <span className="text-xs font-bold text-amber-400">
                {lang === 'ar' ? currentCityMeta.nameAr : currentCityMeta.nameEn}
              </span>
            </div>

            {/* Center Box: Round & Timer */}
            <div className="flex items-center gap-3 bg-[#0e121d]/90 backdrop-blur-md px-4 py-1.5 rounded-2xl border border-zinc-800/90 shadow-xl pointer-events-auto">
              <div className="text-center">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block leading-tight">
                  {t.round}
                </span>
                <span className="text-sm font-black text-white font-mono">
                  {currentRoundIndex + 1} / {TOTAL_ROUNDS}
                </span>
              </div>

              {timeRemaining !== null && (
                <>
                  <div className="w-px h-6 bg-zinc-700/60" />
                  <div className="flex items-center gap-1.5">
                    <TimerIcon className={`w-4 h-4 ${timeRemaining <= 15 ? 'text-rose-500 animate-pulse' : 'text-amber-400'}`} />
                    <span className={`text-sm font-black font-mono ${timeRemaining <= 15 ? 'text-rose-400 animate-pulse font-extrabold' : 'text-zinc-200'}`}>
                      {timeRemaining}s
                    </span>
                  </div>
                </>
              )}

              <div className="w-px h-6 bg-zinc-700/60" />
              <div className="text-center">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block leading-tight">
                  {t.score}
                </span>
                <span className="text-sm font-black text-amber-400 font-mono">
                  {totalScore.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Right Box: Exit to menu */}
            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                id="in-game-exit-btn"
                onClick={handleExitToMenu}
                className="p-2 rounded-xl bg-[#0e121d]/90 backdrop-blur-md border border-zinc-800/90 hover:bg-rose-950/40 hover:border-rose-500/50 text-zinc-300 hover:text-rose-400 transition shadow-xl"
                title={t.backToMenu}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Fullscreen 360 Panorama Stage */}
          <div className="flex-1 w-full h-full relative">
            <PanoViewer
              location={currentLocation}
              currentAssetUrl={currentAssetUrl}
              currentSceneId={currentSceneId}
              movementMode={settings.movementMode}
              lang={lang}
              onNavigateToScene={handleNavigateToScene}
              onReturnToSpawn={handleReturnToSpawn}
              isAtSpawn={currentSceneId === currentLocation.sceneId}
            />
          </div>

          {/* Collapsible Guess Map (Bottom Corner) */}
          <aside className={`absolute bottom-4 ${lang === 'ar' ? 'left-4' : 'right-4'} z-20`}>
            <GuessMap
              lang={lang}
              selectedGuess={selectedGuess}
              onSelectGuess={(coords) => setSelectedGuess(coords)}
              onSubmitGuess={handleSubmitGuess}
              disabled={false}
              showResult={false}
              initialCenter={currentCityMeta.center}
              initialZoom={currentCityMeta.zoom}
            />
          </aside>
        </div>
      )}

      {/* 3. Round Result View */}
      {gameStatus === 'round_result' && roundResults.length > 0 && (
        <RoundResultView
          result={roundResults[roundResults.length - 1]}
          currentRound={currentRoundIndex + 1}
          totalRounds={TOTAL_ROUNDS}
          totalScore={totalScore}
          lang={lang}
          soundEnabled={settings.soundEnabled}
          onNextRound={handleNextRound}
        />
      )}

      {/* 4. Game Summary View */}
      {gameStatus === 'game_summary' && (
        <GameSummaryView
          rounds={roundResults}
          totalScore={totalScore}
          lang={lang}
          soundEnabled={settings.soundEnabled}
          onPlayAgain={handleStartGame}
          onBackToMenu={() => setGameStatus('menu')}
        />
      )}
    </main>
  );
}

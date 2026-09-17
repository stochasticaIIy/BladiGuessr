import React, { useState } from 'react';
import { GameSettings, MovementMode } from '../types/game';
import { MOROCCO_CITIES } from '../data/cities';
import { TRANSLATIONS, Language } from '../utils/i18n';
import { 
  Play, 
  Map, 
  Volume2, 
  VolumeX, 
  Languages, 
  Compass, 
  Timer, 
  HelpCircle, 
  Sparkles,
  ChevronDown,
  Eye,
  Footprints,
  Lock
} from 'lucide-react';

interface MainMenuViewProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onStartGame: () => void;
  highScore: number;
}

export const MainMenuView: React.FC<MainMenuViewProps> = ({
  settings,
  onUpdateSettings,
  onStartGame,
  highScore
}) => {
  const lang = settings.language;
  const t = TRANSLATIONS[lang];
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  const movementModes: { id: MovementMode; label: string; icon: React.ReactNode; desc: string; badge: string }[] = [
    { 
      id: 'move', 
      label: t.moveLabel, 
      icon: <Footprints className="w-4 h-4 text-amber-400" />,
      desc: t.moveDesc,
      badge: lang === 'ar' ? 'حر' : 'Free'
    },
    { 
      id: 'no-move', 
      label: t.noMoveLabel, 
      icon: <Eye className="w-4 h-4 text-cyan-400" />,
      desc: t.noMoveDesc,
      badge: lang === 'ar' ? 'التفاف فقط' : 'Rotate'
    },
    { 
      id: 'nmpz', 
      label: t.fixedLabel, 
      icon: <Lock className="w-4 h-4 text-rose-400" />,
      desc: t.nmpzDesc,
      badge: lang === 'ar' ? 'تحدي' : 'Pro'
    }
  ];

  const timeLimits: { value: number | null; label: string }[] = [
    { value: null, label: t.noTimer },
    { value: 60, label: `60 ${t.seconds}` },
    { value: 90, label: `90 ${t.seconds}` },
    { value: 120, label: `120 ${t.seconds}` }
  ];

  const activeMode = movementModes.find(m => m.id === settings.movementMode) || movementModes[0];

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto bg-[#0a0d14] text-zinc-100">
      {/* Background warm Moroccan ambient glow */}
      <div className="absolute top-1/6 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-amber-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[420px] h-[420px] bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 left-10 w-72 h-72 bg-rose-700/10 rounded-full blur-[90px] pointer-events-none" />

      {/* Top Bar */}
      <div className="absolute top-4 inset-x-4 max-w-4xl mx-auto flex items-center justify-between z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 border border-amber-400/40 flex items-center justify-center text-lg shadow-md shadow-red-950/60">
            🇲🇦
          </div>
          <div>
            <span className="text-base font-black tracking-tight text-white block leading-tight">
              BladiGuessr
            </span>
            <span className="text-[10px] font-bold text-amber-400 block leading-tight">
              MOROCCO 360°
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            id="sound-toggle-btn"
            onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
            className="p-2.5 rounded-xl bg-[#131824] border border-zinc-800 hover:border-amber-500/40 text-zinc-300 hover:text-white transition shadow-sm"
            title={t.sound}
          >
            {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
          </button>

          {/* Language Switch */}
          <button
            id="lang-switch-btn"
            onClick={() => onUpdateSettings({ language: lang === 'ar' ? 'en' : 'ar' })}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#131824] border border-zinc-800 hover:border-amber-500/40 text-xs font-bold text-zinc-200 hover:text-white transition shadow-sm"
          >
            <Languages className="w-4 h-4 text-amber-400" />
            <span>{t.switchLanguage}</span>
          </button>
        </div>
      </div>

      {/* Main Menu Modal Card */}
      <div className="relative w-full max-w-2xl bg-[#121622]/95 backdrop-blur-2xl border border-zinc-800/90 hover:border-zinc-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/90 z-10 my-auto mt-16 sm:mt-12 transition-all">
        {/* Title Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mb-3 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.cloudflareReady}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white mb-2 font-display">
            BladiGuessr
          </h1>

          <p className="text-xs sm:text-sm text-zinc-300 max-w-lg mx-auto leading-relaxed">
            {t.appSubTitle}
          </p>

          <p className="text-[11px] text-amber-400/90 mt-1 font-semibold">
            {t.tagline}
          </p>

          {highScore > 0 && (
            <div className="mt-3.5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold shadow-sm">
              <span>🏆 {t.highScores}:</span>
              <span className="text-amber-400 font-extrabold">{highScore.toLocaleString()} {t.pts}</span>
            </div>
          )}
        </div>

        {/* Options Stack */}
        <div className="space-y-4 mb-6">
          {/* City / Map Mode Selector */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Map className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.selectCity}</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto p-1.5 rounded-2xl bg-[#0b0e15] border border-zinc-800/80">
              {MOROCCO_CITIES.map((city) => {
                const isSelected = settings.cityFilter === city.id;
                return (
                  <button
                    key={city.id}
                    id={`city-select-${city.id}`}
                    onClick={() => onUpdateSettings({ cityFilter: city.id })}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl text-start transition text-xs font-semibold ${
                      isSelected
                        ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-950/60 border border-amber-400/60'
                        : 'bg-[#151a26] text-zinc-300 hover:bg-[#1a2130] hover:text-white border border-zinc-800/90'
                    }`}
                  >
                    <span className="text-base">{city.icon}</span>
                    <div className="overflow-hidden">
                      <span className="block truncate font-bold">
                        {lang === 'ar' ? city.nameAr : city.nameEn}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Movement Mode Selector (Clear & Understandable) */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.movementMode}</span>
              </span>
              <span className="text-[11px] font-normal text-amber-400/90">
                {activeMode.desc}
              </span>
            </label>

            <div className="grid grid-cols-3 gap-2.5">
              {movementModes.map((m) => {
                const isSelected = settings.movementMode === m.id;
                return (
                  <button
                    key={m.id}
                    id={`move-mode-${m.id}`}
                    onClick={() => onUpdateSettings({ movementMode: m.id })}
                    className={`p-3 rounded-2xl text-center transition relative border flex flex-col items-center gap-1.5 ${
                      isSelected
                        ? 'bg-gradient-to-b from-amber-500/20 to-orange-500/10 border-amber-500 text-amber-300 font-bold shadow-md shadow-amber-950/40'
                        : 'bg-[#151a26] border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {m.icon}
                      <span className="text-xs font-extrabold block">{m.label}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-zinc-400 font-medium">
                      {m.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timer Selector */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.timer}</span>
            </label>

            <div className="grid grid-cols-4 gap-2">
              {timeLimits.map((tl, idx) => {
                const isSelected = settings.timeLimitSec === tl.value;
                return (
                  <button
                    key={idx}
                    id={`timer-option-${tl.value || 'unlimited'}`}
                    onClick={() => onUpdateSettings({ timeLimitSec: tl.value })}
                    className={`py-2 px-2 rounded-xl text-center text-xs font-bold transition border ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                        : 'bg-[#151a26] border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    {tl.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Start Game Button (Energetic Moroccan Gaming CTA) */}
        <button
          id="start-game-btn"
          onClick={onStartGame}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 active:scale-[0.98] text-white font-black text-lg sm:text-xl flex items-center justify-center gap-3 shadow-xl shadow-emerald-950/80 transition-all border border-emerald-400/50 cursor-pointer"
        >
          <Play className="w-6 h-6 fill-current" />
          <span>{t.play}</span>
        </button>

        {/* How to Play Accordion */}
        <div className="mt-4 pt-3 border-t border-zinc-800/80">
          <button
            id="how-to-play-toggle"
            onClick={() => setShowHowToPlay(!showHowToPlay)}
            className="w-full flex items-center justify-between text-xs text-zinc-400 hover:text-zinc-200 transition py-1"
          >
            <span className="flex items-center gap-1.5 font-semibold">
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              {t.howToPlayTitle}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showHowToPlay ? 'rotate-180' : ''}`} />
          </button>

          {showHowToPlay && (
            <div className="mt-2.5 text-xs text-zinc-300 space-y-2 p-3.5 rounded-2xl bg-[#0b0e15] border border-zinc-800 leading-relaxed">
              <p>• {t.howToPlay1}</p>
              <p>• {t.howToPlay2}</p>
              <p>• {t.howToPlay3}</p>
              <p>• {t.howToPlay4}</p>
            </div>
          )}
        </div>

        {/* carte.ma credit */}
        <div className="mt-4 text-center">
          <span className="text-[11px] text-zinc-500">
            {t.imageryCredit}
          </span>
        </div>
      </div>
    </div>
  );
};

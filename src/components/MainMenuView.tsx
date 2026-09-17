import React, { useState } from 'react';
import { GameSettings, MovementMode } from '../types/game';
import { MOROCCO_CITIES } from '../data/cities';
import { TRANSLATIONS } from '../utils/i18n';
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
  Lock,
  Trophy,
  Check
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
      icon: <Footprints className="w-4 h-4" />,
      desc: t.moveDesc,
      badge: lang === 'ar' ? 'حر' : 'Free'
    },
    { 
      id: 'no-move', 
      label: t.noMoveLabel, 
      icon: <Eye className="w-4 h-4" />,
      desc: t.noMoveDesc,
      badge: lang === 'ar' ? 'التفاف' : 'Rotate'
    },
    { 
      id: 'nmpz', 
      label: t.fixedLabel, 
      icon: <Lock className="w-4 h-4" />,
      desc: t.nmpzDesc,
      badge: lang === 'ar' ? 'ثابت' : 'Fixed'
    }
  ];

  const timeLimits: { value: number | null; label: string }[] = [
    { value: null, label: t.noTimer },
    { value: 60, label: `60 ${t.seconds}` },
    { value: 90, label: `90 ${t.seconds}` },
    { value: 120, label: `120 ${t.seconds}` }
  ];

  const activeMode = movementModes.find(m => m.id === settings.movementMode) || movementModes[0];
  const allMoroccoOption = MOROCCO_CITIES.find(c => c.id === 'all') || MOROCCO_CITIES[0];
  const specificCities = MOROCCO_CITIES.filter(c => c.id !== 'all');
  const isAllSelected = settings.cityFilter === 'all';

  return (
    <div className="relative w-full h-full min-h-screen flex flex-col items-center justify-between p-4 sm:p-6 overflow-y-auto moroccan-pattern text-zinc-100">
      {/* Subtle Moroccan Ambient Glows (Warm Terracotta & Desert Gold) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-amber-500/10 via-amber-600/5 to-transparent rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-t from-orange-600/5 via-amber-700/5 to-transparent rounded-full blur-[100px] pointer-events-none" />

      {/* Top Bar */}
      <header className="relative w-full max-w-3xl mx-auto flex items-center justify-between pt-2 pb-4 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#161a26] border border-amber-500/30 flex items-center justify-center text-xl shadow-lg shadow-black/40">
            🇲🇦
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-white leading-none">
                BladiGuessr
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold uppercase tracking-wider">
                360°
              </span>
            </div>
            <span className="text-[11px] text-zinc-400 font-medium block mt-0.5">
              {lang === 'ar' ? 'استكشف المغرب شبراً بشبر' : 'Explore Morocco Street by Street'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            id="sound-toggle-btn"
            onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
            className="p-2.5 rounded-xl bg-[#141824] border border-zinc-800/90 hover:border-amber-500/40 text-zinc-300 hover:text-white transition shadow-sm cursor-pointer"
            title={t.sound}
            aria-label={t.sound}
          >
            {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
          </button>

          {/* Language Switch */}
          <button
            id="lang-switch-btn"
            onClick={() => onUpdateSettings({ language: lang === 'ar' ? 'en' : 'ar' })}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#141824] border border-zinc-800/90 hover:border-amber-500/40 text-xs font-bold text-zinc-200 hover:text-white transition shadow-sm cursor-pointer"
          >
            <Languages className="w-4 h-4 text-amber-400" />
            <span>{t.switchLanguage}</span>
          </button>
        </div>
      </header>

      {/* Main Menu Center Card */}
      <main className="relative w-full max-w-3xl bg-[#131722]/90 backdrop-blur-2xl border border-amber-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 z-10 my-auto transition-all">
        {/* Title Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-bold mb-3 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.badgeTag || (lang === 'ar' ? 'استكشاف شوارع وأزقة المغرب 360°' : 'Authentic 360° Moroccan Exploration')}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white mb-2">
            BladiGuessr
          </h1>

          <p className="text-xs sm:text-sm text-zinc-300 max-w-lg mx-auto leading-relaxed">
            {t.appSubTitle}
          </p>

          <p className="text-[11px] text-amber-400/90 mt-1.5 font-medium">
            {t.tagline}
          </p>

          {highScore > 0 && (
            <div className="mt-3.5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-mono font-bold">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.highScores}:</span>
              <span className="text-amber-400 font-extrabold">{highScore.toLocaleString()} {t.pts}</span>
            </div>
          )}
        </div>

        {/* Options Stack */}
        <div className="space-y-5 mb-6">
          {/* 1. City / Map Mode Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                <Map className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.selectCity}</span>
              </label>
              <span className="text-[11px] text-zinc-400">
                {isAllSelected 
                  ? (lang === 'ar' ? '10 مدن ومناطق' : '10 cities & regions') 
                  : (lang === 'ar' ? MOROCCO_CITIES.find(c => c.id === settings.cityFilter)?.nameAr : MOROCCO_CITIES.find(c => c.id === settings.cityFilter)?.nameEn)}
              </span>
            </div>

            <div className="space-y-2">
              {/* Featured: All Morocco (كل المغرب) Hero Option */}
              <button
                id="city-select-all"
                onClick={() => onUpdateSettings({ cityFilter: 'all' })}
                className={`w-full flex items-center justify-between p-3 rounded-2xl transition cursor-pointer border ${
                  isAllSelected
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold border-amber-300 shadow-md shadow-amber-500/20'
                    : 'bg-[#181d2a] text-zinc-300 hover:text-white hover:bg-[#1f2536] border-zinc-800/80 hover:border-amber-500/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{allMoroccoOption.icon}</span>
                  <div className="text-start">
                    <span className="block text-sm font-extrabold leading-tight">
                      {lang === 'ar' ? allMoroccoOption.nameAr : allMoroccoOption.nameEn}
                    </span>
                    <span className={`block text-[11px] ${isAllSelected ? 'text-zinc-900 font-semibold' : 'text-zinc-400'}`}>
                      {t.allCitiesDesc || (lang === 'ar' ? 'جميع المدن والمناطق التاريخية' : 'All 10 historic cities & regions')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2.5 py-1 rounded-lg font-bold ${
                    isAllSelected ? 'bg-zinc-950/20 text-zinc-950' : 'bg-zinc-800/60 text-amber-400 border border-zinc-700/60'
                  }`}>
                    {lang === 'ar' ? 'المملكة كاملة' : 'Full Kingdom'}
                  </span>
                  {isAllSelected && <Check className="w-4 h-4 text-zinc-950 stroke-[3]" />}
                </div>
              </button>

              {/* Specific Cities Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 max-h-40 sm:max-h-none overflow-y-auto sm:overflow-visible p-1">
                {specificCities.map((city) => {
                  const isSelected = settings.cityFilter === city.id;
                  return (
                    <button
                      key={city.id}
                      id={`city-select-${city.id}`}
                      onClick={() => onUpdateSettings({ cityFilter: city.id })}
                      className={`flex items-center gap-2 p-2 rounded-xl text-start transition cursor-pointer text-xs border ${
                        isSelected
                          ? 'bg-amber-500 text-zinc-950 font-bold border-amber-300 shadow-sm'
                          : 'bg-[#181d2a] text-zinc-300 hover:text-white hover:bg-[#1f2536] border-zinc-800/80 hover:border-amber-500/40'
                      }`}
                    >
                      <span className="text-base shrink-0">{city.icon}</span>
                      <span className="truncate block font-semibold">
                        {lang === 'ar' ? city.nameAr : city.nameEn}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 2. Movement Mode Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.movementMode}</span>
              </label>
              <span className="text-[11px] text-amber-400/90 font-medium">
                {activeMode.desc}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {movementModes.map((m) => {
                const isSelected = settings.movementMode === m.id;
                return (
                  <button
                    key={m.id}
                    id={`move-mode-${m.id}`}
                    onClick={() => onUpdateSettings({ movementMode: m.id })}
                    className={`p-3 rounded-2xl text-center transition cursor-pointer relative border flex flex-col items-center gap-1.5 ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold shadow-md shadow-amber-950/30'
                        : 'bg-[#181d2a] border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 hover:bg-[#1f2536]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-amber-400">
                      {m.icon}
                      <span className="text-xs font-extrabold text-zinc-100 block">{m.label}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                      isSelected ? 'bg-amber-400/20 text-amber-300' : 'bg-zinc-800/80 text-zinc-400'
                    }`}>
                      {m.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Timer Selector */}
          <div>
            <label className="block text-xs font-bold text-zinc-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
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
                    className={`py-2 px-2 rounded-xl text-center text-xs font-bold transition cursor-pointer border ${
                      isSelected
                        ? 'bg-amber-500 text-zinc-950 font-bold border-amber-300 shadow-sm'
                        : 'bg-[#181d2a] border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 hover:bg-[#1f2536]'
                    }`}
                  >
                    {tl.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Primary CTA: Start Game Button (Golden Moroccan Ochre) */}
        <button
          id="start-game-btn"
          onClick={onStartGame}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 active:scale-[0.99] text-zinc-950 font-black text-lg sm:text-xl flex items-center justify-center gap-3 shadow-xl shadow-amber-500/20 border border-amber-300/60 transition-all cursor-pointer"
        >
          <Play className="w-6 h-6 fill-current text-zinc-950" />
          <span>{t.play}</span>
        </button>

        {/* How to Play Accordion */}
        <div className="mt-4 pt-3 border-t border-zinc-800/80">
          <button
            id="how-to-play-toggle"
            onClick={() => setShowHowToPlay(!showHowToPlay)}
            className="w-full flex items-center justify-between text-xs text-zinc-400 hover:text-zinc-200 transition py-1 cursor-pointer"
          >
            <span className="flex items-center gap-1.5 font-semibold">
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              {t.howToPlayTitle}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform text-amber-400 ${showHowToPlay ? 'rotate-180' : ''}`} />
          </button>

          {showHowToPlay && (
            <div className="mt-2.5 text-xs text-zinc-300 space-y-2 p-3.5 rounded-2xl bg-[#0f131c] border border-zinc-800/80 leading-relaxed">
              <p>• {t.howToPlay1}</p>
              <p>• {t.howToPlay2}</p>
              <p>• {t.howToPlay3}</p>
              <p>• {t.howToPlay4}</p>
            </div>
          )}
        </div>

        {/* Imagery Credit */}
        <div className="mt-3 text-center">
          <span className="text-[11px] text-zinc-500 font-medium">
            {t.imageryCredit}
          </span>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="relative w-full max-w-3xl mx-auto py-3 text-center z-20 text-[11px] text-zinc-500">
        <span>🇲🇦 BladiGuessr • Moroccan 360° Geography Exploration</span>
      </footer>
    </div>
  );
};

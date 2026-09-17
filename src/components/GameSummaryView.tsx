import React, { useEffect, useState } from 'react';
import { RoundResult } from '../types/game';
import { TRANSLATIONS, Language } from '../utils/i18n';
import { getMoroccanScoreRank, formatDistance, soundManager } from '../utils/gameLogic';
import { 
  Trophy, 
  RotateCcw, 
  Share2, 
  Check, 
  Home, 
  MapPin, 
  Compass, 
  Award,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface GameSummaryViewProps {
  rounds: RoundResult[];
  totalScore: number;
  lang: Language;
  soundEnabled: boolean;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export const GameSummaryView: React.FC<GameSummaryViewProps> = ({
  rounds,
  totalScore,
  lang,
  soundEnabled,
  onPlayAgain,
  onBackToMenu
}) => {
  const t = TRANSLATIONS[lang];
  const rank = getMoroccanScoreRank(totalScore);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (soundEnabled) {
      soundManager.playPointsCelebration(totalScore / 5);
    }
    // Launch festive confetti
    confetti({
      particleCount: 90,
      spread: 80,
      origin: { y: 0.5 }
    });
  }, [totalScore, soundEnabled]);

  const handleShare = () => {
    const text = lang === 'ar'
      ? `🇲🇦 لعبت BladiGuessr وحققت نتيجة ${totalScore.toLocaleString()} من أصل 25,000 نقطة!\nرتبتي: ${rank.titleAr}\nجرب اللعبة واستكشف المغرب برؤية 360°!`
      : `🇲🇦 I just scored ${totalScore.toLocaleString()} / 25,000 on BladiGuessr!\nRank: ${rank.titleEn}\nExplore Moroccan street panoramas at carte.ma!`;

    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const percentage = Math.round((totalScore / 25000) * 100);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 bg-[#0a0d14] overflow-y-auto">
      {/* Subtle Moroccan background geometric warm ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(245,158,11,0.12),transparent_60%)] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-2xl bg-[#121622]/95 backdrop-blur-2xl border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/90 z-10 my-auto">
        {/* Top Trophy & Rank */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500/25 via-orange-500/20 to-amber-500/35 border border-amber-500/40 text-4xl mb-4 shadow-xl shadow-amber-950/40">
            {rank.badge}
          </div>

          <span className="text-xs font-bold uppercase tracking-widest text-amber-400 block mb-1">
            {t.gameOver}
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-white">
            {lang === 'ar' ? rank.titleAr : rank.titleEn}
          </h1>

          <p className="text-sm text-zinc-400 mt-1">
            {lang === 'ar' ? rank.subtitleAr : rank.subtitleEn}
          </p>
        </div>

        {/* Score Card */}
        <div className="bg-[#0b0e15] rounded-2xl p-5 border border-amber-500/30 text-center mb-6 relative overflow-hidden shadow-lg">
          <div className="text-xs font-bold text-zinc-400 uppercase mb-1">
            {t.finalScore}
          </div>

          <div className="flex items-center justify-center gap-2 font-mono">
            <span className="text-4xl sm:text-5xl font-black text-amber-400 tracking-tight">
              {totalScore.toLocaleString()}
            </span>
            <span className="text-base font-bold text-zinc-500">/ 25,000</span>
          </div>

          <div className="w-full bg-zinc-800 h-3 rounded-full overflow-hidden mt-4 mb-2 max-w-md mx-auto">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-400 transition-all duration-1000 ease-out rounded-full"
              style={{ width: `${percentage}%` }}
            />
          </div>

          <span className="text-xs text-zinc-400 font-medium">
            {percentage}% {lang === 'ar' ? 'نسبة الدقة الجغرافية' : 'Geographical Accuracy'}
          </span>
        </div>

        {/* 5-Round Breakdown List */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{t.roundSummary}</span>
          </h3>

          <div className="space-y-2">
            {rounds.map((r) => (
              <div 
                key={r.roundNumber} 
                className="flex items-center justify-between p-3 rounded-xl bg-[#151a26] border border-zinc-800/90 text-xs sm:text-sm hover:border-zinc-700 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-zinc-800 text-amber-400 font-bold flex items-center justify-center text-xs">
                    {r.roundNumber}
                  </span>
                  <div>
                    <span className="font-bold text-white block">
                      {r.location.cityNameAr} • {r.location.cityNameEn}
                    </span>
                    <span className="text-[11px] text-zinc-400 block truncate max-w-[180px] sm:max-w-[260px]">
                      {r.location.roadAr || r.location.roadEn}
                    </span>
                  </div>
                </div>

                <div className="text-end">
                  <span className="font-mono font-bold text-emerald-400 block">
                    +{r.points.toLocaleString()} {t.pts}
                  </span>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    {formatDistance(r.distanceKm, lang)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            id="play-again-btn"
            onClick={onPlayAgain}
            className="sm:col-span-2 py-3.5 px-5 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 active:scale-[0.98] text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/80 transition border border-emerald-400/50"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t.playAgain}</span>
          </button>

          <button
            id="share-score-btn"
            onClick={handleShare}
            className="py-3.5 px-4 rounded-xl bg-[#181e2c] hover:bg-[#202738] active:scale-[0.98] text-zinc-200 hover:text-white font-bold text-sm flex items-center justify-center gap-2 border border-zinc-700 transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-amber-400" />}
            <span>{copied ? t.copiedNotice : t.shareScore}</span>
          </button>
        </div>

        <div className="mt-4 text-center">
          <button
            id="back-to-menu-btn"
            onClick={onBackToMenu}
            className="text-xs text-zinc-400 hover:text-white inline-flex items-center gap-1.5 transition py-1"
          >
            <Home className="w-3.5 h-3.5" />
            <span>{t.backToMenu}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

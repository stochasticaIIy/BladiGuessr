import React, { useEffect } from 'react';
import { RoundResult } from '../types/game';
import { TRANSLATIONS, Language } from '../utils/i18n';
import { formatDistance, soundManager } from '../utils/gameLogic';
import { GuessMap } from './GuessMap';
import { 
  ArrowRight, 
  ArrowLeft, 
  Award, 
  MapPin, 
  Compass, 
  Calendar,
  CheckCircle,
  Trophy
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface RoundResultViewProps {
  result: RoundResult;
  currentRound: number;
  totalRounds: number;
  totalScore: number;
  lang: Language;
  soundEnabled: boolean;
  onNextRound: () => void;
}

export const RoundResultView: React.FC<RoundResultViewProps> = ({
  result,
  currentRound,
  totalRounds,
  totalScore,
  lang,
  soundEnabled,
  onNextRound
}) => {
  const t = TRANSLATIONS[lang];
  const isLastRound = currentRound >= totalRounds;

  useEffect(() => {
    if (soundEnabled) {
      soundManager.playPointsCelebration(result.points);
    }
    if (result.points >= 4000) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
    }
  }, [result.points, soundEnabled]);

  const percentage = Math.round((result.points / 5000) * 100);

  return (
    <div className="relative w-full h-full flex flex-col md:flex-row bg-[#0a0d14] overflow-hidden">
      {/* Interactive Map taking majority of the view */}
      <div className="flex-1 h-[55%] md:h-full relative">
        <GuessMap
          lang={lang}
          selectedGuess={result.guess}
          onSelectGuess={() => {}}
          onSubmitGuess={() => {}}
          disabled={true}
          actualLocation={{
            lat: result.location.lat,
            lng: result.location.lng,
            title: `${result.location.roadAr} — ${result.location.cityNameAr}`
          }}
          showResult={true}
        />
      </div>

      {/* Result Metrics & Next Round Sidebar */}
      <div className="w-full md:w-[420px] lg:w-[460px] h-[45%] md:h-full bg-[#0e121d] border-t md:border-t-0 md:border-s border-zinc-800/90 p-5 sm:p-6 flex flex-col justify-between overflow-y-auto z-20 shadow-2xl">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800/90 pb-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                {t.round} {currentRound} {t.of} {totalRounds}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                {lang === 'ar' ? `نتائج الجولة ${currentRound}` : `Round ${currentRound} Result`}
              </h2>
            </div>
            <div className="text-end">
              <span className="text-[11px] text-zinc-400 block">{t.totalScore}</span>
              <span className="text-lg font-extrabold text-amber-400 font-mono">
                {totalScore.toLocaleString()} {t.pts}
              </span>
            </div>
          </div>

          {/* Points Card */}
          <div className="bg-[#0b0e15] rounded-2xl p-4 border border-amber-500/30 text-center relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-400" />
            
            <div className="flex items-center justify-center gap-2 mb-1">
              <Award className="w-6 h-6 text-amber-400" />
              <span className="text-3xl sm:text-4xl font-black text-white font-mono">
                +{result.points.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-amber-400 uppercase">{t.pts}</span>
            </div>

            {/* Score bar */}
            <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden mt-3 mb-1">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-400 transition-all duration-1000 ease-out"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-[11px] text-zinc-400 font-medium">
              {percentage}% {lang === 'ar' ? 'من النقاط القصوى (5,000)' : 'of max points (5,000)'}
            </span>
          </div>

          {/* Details list */}
          <div className="space-y-2.5 text-sm">
            {/* Distance */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#131724] border border-zinc-800/80">
              <div className="flex items-center gap-2.5 text-zinc-300">
                <Compass className="w-4 h-4 text-amber-400" />
                <span className="font-semibold">{t.distanceAway}</span>
              </div>
              <span className="font-extrabold text-white font-mono text-base">
                {formatDistance(result.distanceKm, lang)}
              </span>
            </div>

            {/* Location Name */}
            <div className="p-3.5 rounded-xl bg-[#131724] border border-zinc-800/80">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span className="font-semibold">{t.actualLocation}</span>
              </div>
              <div className="font-bold text-white text-base">
                {result.location.cityNameAr} • {result.location.cityNameEn}
              </div>
              <div className="text-xs text-amber-400/90 mt-0.5 font-medium">
                {result.location.roadAr} <span className="text-zinc-400">({result.location.roadEn})</span>
              </div>
            </div>

            {/* Capture Date / Source */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#131724]/60 text-xs text-zinc-400 border border-zinc-800/40">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                <span>{lang === 'ar' ? 'تاريخ التصوير:' : 'Captured:'}</span>
              </div>
              <span className="font-mono text-zinc-300">{result.location.capturedAt.split(' ')[0]}</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-4 pt-3 border-t border-zinc-800/80">
          <button
            id="next-round-btn"
            onClick={onNextRound}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 active:scale-[0.98] text-white font-black text-base flex items-center justify-center gap-3 shadow-xl shadow-emerald-950/80 transition border border-emerald-400/50"
          >
            <span>{isLastRound ? t.viewSummary : t.nextRound}</span>
            {lang === 'ar' ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

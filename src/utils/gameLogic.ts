// Geo math, scoring system, Web Audio synthesizer & local storage

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function calculatePoints(distanceKm: number, isCityMode: boolean): number {
  if (distanceKm <= 0.035) {
    return 5000; // Perfect pin (< 35m)
  }
  
  // Exponential decay scale adapted to city vs national map
  const scale = isCityMode ? 5.5 : 180;
  const rawScore = 5000 * Math.exp(-distanceKm / scale);
  const score = Math.round(rawScore);
  return Math.max(0, Math.min(5000, score));
}

export function formatDistance(distanceKm: number, lang: 'ar' | 'en'): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return lang === 'ar' ? `${meters} متر` : `${meters} m`;
  }
  const formatted = distanceKm >= 10 ? distanceKm.toFixed(1) : distanceKm.toFixed(2);
  return lang === 'ar' ? `${formatted} كم` : `${formatted} km`;
}

export interface MoroccanRank {
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  badge: string;
}

export function getMoroccanScoreRank(totalScore: number): MoroccanRank {
  if (totalScore >= 24000) {
    return {
      titleAr: 'ولد البلاد الحقيقي 🇲🇦',
      titleEn: 'True Moroccan Native 🇲🇦',
      subtitleAr: 'كتعرف المغرب زَنْقَة زَنْقَة ودَرْب دَرْب!',
      subtitleEn: 'You know every street, corner and alleyway across Morocco!',
      badge: '👑'
    };
  }
  if (totalScore >= 20000) {
    return {
      titleAr: 'مستكشف خبير 🧭',
      titleEn: 'Master Explorer 🧭',
      subtitleAr: 'معرفة جغرافية دقيقة بالمدن المغربية ومعالمها!',
      subtitleEn: 'Incredible geographical intuition across Moroccan cities!',
      badge: '⭐'
    };
  }
  if (totalScore >= 15000) {
    return {
      titleAr: 'سائق طاكسي محترف 🚕',
      titleEn: 'Grand Taxi Veteran 🚕',
      subtitleAr: 'كتسافر بزاف بين المدن والشوارع وعندك حاسة قوية!',
      subtitleEn: 'You travel often and have great street instincts!',
      badge: '🚖'
    };
  }
  if (totalScore >= 10000) {
    return {
      titleAr: 'سائح عاشق للمغرب 🧳',
      titleEn: 'Enthusiastic Traveler 🧳',
      subtitleAr: 'بداية جيدة جداً، مازال عندك بزاف ديال البلايص تكتشفهم!',
      subtitleEn: 'Great job! Many hidden gems left to discover!',
      badge: '🗺️'
    };
  }
  return {
    titleAr: 'مستكشف مبتدئ 🌱',
    titleEn: 'Curious Novice 🌱',
    subtitleAr: 'المغرب كبير وغني، العب مرة خرى وطوّر مهاراتك!',
    subtitleEn: 'Morocco is vast and rich! Play again to level up your eye!',
    badge: '🎒'
  };
}

// Web Audio API Synthesizer (zero assets needed, 100% reliable)
class SoundSystem {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  playClick() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch {
      // Audio errors are benign
    }
  }

  playGuessSubmitted() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(740, this.ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.14);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.14);
    } catch {}
  }

  playPointsCelebration(points: number) {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = points > 4000 ? [523.25, 659.25, 783.99, 1046.50] : [440, 554.37, 659.25];
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.15, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.35);
      });
    } catch {}
  }

  playTick() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.03);
    } catch {}
  }
}

export const soundManager = new SoundSystem();

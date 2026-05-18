'use client';

import { useCallback, useEffect, useRef } from 'react';

export type BilliardAlertType = 'booking' | 'extra';

const ALERT_FILES: Record<BilliardAlertType, string[]> = {
  booking: ['booking.mp3', 'booking.wav', 'booking.ogg', 'stol-band.mp3'],
  extra: ['extra-order.mp3', 'extra-order.wav', 'extra-order.ogg', 'qoshimcha.mp3'],
};

const BASE = '/buyurtma-music';

function tryPlay(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    const audio = new Audio(src);
    audio.volume = 0.85;
    audio.oncanplaythrough = () => {
      audio.play().then(() => resolve(true)).catch(() => resolve(false));
    };
    audio.onerror = () => resolve(false);
    setTimeout(() => resolve(false), 1200);
    audio.load();
  });
}

async function playAlertSound(type: BilliardAlertType) {
  for (const file of ALERT_FILES[type]) {
    const played = await tryPlay(`${BASE}/${file}`);
    if (played) return;
  }
  // Brauzer fallback (Web Audio beep)
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = type === 'booking' ? 880 : 660;
    gain.gain.value = 0.15;
    osc.start();
    osc.stop(ctx.currentTime + (type === 'booking' ? 0.35 : 0.25));
    setTimeout(() => ctx.close(), 500);
  } catch {
    /* ignore */
  }
}

export function useBilliardAlertSound(enabled = true) {
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const play = useCallback((type: BilliardAlertType) => {
    if (!enabledRef.current) return;
    void playAlertSound(type);
  }, []);

  const handleSocketEvent = useCallback((event: string) => {
    if (event === 'booking-requested') play('booking');
    if (event === 'extra-requested') play('extra');
  }, [play]);

  // Brauzer autoplay policy: birinchi klikdan keyin audio ruxsat
  useEffect(() => {
    const unlock = () => {
      const a = new Audio();
      a.volume = 0;
      void a.play().catch(() => {});
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    window.addEventListener('click', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });
    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
    };
  }, []);

  return { play, handleSocketEvent };
}

'use client';

import { useEffect, useState } from 'react';

export function useSessionTimer(active: boolean, startAt?: string) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!active || !startAt) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [active, startAt]);

  if (!startAt) return { seconds: 0, now };

  const seconds = Math.max(0, Math.floor((now - new Date(startAt).getTime()) / 1000));
  return { seconds, now };
}

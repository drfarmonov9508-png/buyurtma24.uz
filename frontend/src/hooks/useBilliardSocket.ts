'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { getSocketBase } from '@/lib/billiard';

type BilliardSocketOptions = {
  clubId?: string;
  userId?: string;
  onEvent?: (event: string, payload: unknown) => void;
  enabled?: boolean;
};

export function useBilliardSocket({ clubId, userId, onEvent, enabled = true }: BilliardSocketOptions) {
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    if (!enabled || (!clubId && !userId)) return;

    const socket: Socket = io(`${getSocketBase()}/billiard`, {
      query: {
        ...(clubId ? { clubId } : {}),
        ...(userId ? { userId } : {}),
      },
      transports: ['websocket', 'polling'],
    });

    const events = [
      'booking-requested',
      'booking-confirmed',
      'booking-rejected',
      'order-closed',
      'session-updated',
      'table-updated',
      'extra-requested',
      'extra-accepted',
      'inventory-updated',
    ];

    events.forEach((event) => {
      socket.on(event, (payload) => handlerRef.current?.(event, payload));
    });

    return () => {
      socket.disconnect();
    };
  }, [clubId, userId, enabled]);
}

'use client';

import { Suspense } from 'react';
import BilliardShell from '@/components/layout/BilliardShell';

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0c0a09]">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-500/30 border-t-amber-400" />
    </div>
  );
}

export default function BilliardAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<Loading />}>
      <BilliardShell>{children}</BilliardShell>
    </Suspense>
  );
}

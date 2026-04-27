'use client';

import PanelLayout from '@/components/layout/PanelLayout';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <PanelLayout allowedRoles={['cafe_admin']}>
      {children}
    </PanelLayout>
  );
}

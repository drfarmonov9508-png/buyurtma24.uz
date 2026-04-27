'use client';

import PanelLayout from '@/components/layout/PanelLayout';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <PanelLayout allowedRoles={['superadmin']}>
      {children}
    </PanelLayout>
  );
}

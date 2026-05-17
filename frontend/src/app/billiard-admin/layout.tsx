'use client';

import PanelLayout from '@/components/layout/PanelLayout';

export default function BilliardAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <PanelLayout allowedRoles={['billiard_admin', 'sport_admin', 'superadmin']} title="Billiard boshqaruvi">
      {children}
    </PanelLayout>
  );
}

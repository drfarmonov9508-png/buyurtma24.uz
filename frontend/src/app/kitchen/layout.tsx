import PanelLayout from '@/components/layout/PanelLayout';

export default function KitchenLayout({ children }: { children: React.ReactNode }) {
  return <PanelLayout allowedRoles={['kitchen']}>{children}</PanelLayout>;
}

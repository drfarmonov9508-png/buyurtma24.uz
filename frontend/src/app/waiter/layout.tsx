import PanelLayout from '@/components/layout/PanelLayout';

export default function WaiterLayout({ children }: { children: React.ReactNode }) {
  return <PanelLayout allowedRoles={['waiter']}>{children}</PanelLayout>;
}

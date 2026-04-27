import PanelLayout from '@/components/layout/PanelLayout';

export default function CashierLayout({ children }: { children: React.ReactNode }) {
  return <PanelLayout allowedRoles={['cashier']}>{children}</PanelLayout>;
}

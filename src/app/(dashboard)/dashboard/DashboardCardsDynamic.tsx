'use client';

import dynamic from 'next/dynamic';

const DashboardCards = dynamic(
  () => import('./DashboardCards').then((m) => m.DashboardCards),
  { ssr: false }
);

export default function DashboardCardsDynamic() {
  return <DashboardCards />;
}

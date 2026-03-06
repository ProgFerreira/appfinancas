export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams(): { id: string }[] {
  return [{ id: '0' }];
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

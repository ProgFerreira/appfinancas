import Link from 'next/link';

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="bg-white border-b border-slate-200 px-4 py-2" aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2">
            {i > 0 && <span className="text-slate-300">/</span>}
            {item.href ? (
              <Link href={item.href} className="text-indigo-600 hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className="font-semibold text-slate-800" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

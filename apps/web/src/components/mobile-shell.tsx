import Link from "next/link";
import type { PropsWithChildren } from "react";

const navItems = [
  { href: "/watchlist", label: "Watchlist" },
  { href: "/watchlist/add", label: "Add" },
  { href: "/notifications", label: "Alerts" },
  { href: "/settings/connections", label: "Settings" },
];

export function MobileShell({ children }: PropsWithChildren) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-3">
        <p className="text-lg font-semibold text-slate-950">Shopping Helper</p>
      </header>
      <main className="flex-1 px-4 py-4">{children}</main>
      <nav className="grid grid-cols-4 border-t border-slate-200 bg-white">
        {navItems.map((item) => (
          <Link
            className="px-2 py-3 text-center text-sm font-medium text-slate-700"
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

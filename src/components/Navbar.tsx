"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart2 } from "lucide-react";

const NAV_LINKS = [
  { href: "/",          label: "Platform" },
  { href: "/research",  label: "Research" },
  { href: "/portfolio", label: "Portfolio", cta: true },
];

export default function Navbar() {
  const path = usePathname();

  return (
    <nav className="bg-white border-b border-[#E5E7EB]">
      <div className="max-w-screen-xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#0B5D3B] rounded-lg flex items-center justify-center">
            <BarChart2 size={15} className="text-white" />
          </div>
          <span className="font-bold text-[#111827] text-sm tracking-tight">
            S&amp;M <span className="text-[#0B5D3B]">Services</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {NAV_LINKS.map(({ href, label, cta }) =>
            cta ? (
              <Link
                key={href}
                href={href}
                className="bg-[#0B5D3B] hover:bg-[#1E7A52] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
              >
                {label}
              </Link>
            ) : (
              <Link
                key={href}
                href={href}
                className={`text-sm px-3 py-2 rounded-lg font-medium transition-colors ${
                  path === href || (href !== "/" && path.startsWith(href))
                    ? "text-[#0B5D3B] bg-[#F0F7F4]"
                    : "text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]"
                }`}
              >
                {label}
              </Link>
            )
          )}
        </div>
      </div>
    </nav>
  );
}
